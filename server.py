# server.py

# --- IMPORTANT: Gevent Monkey Patching MUST be at the very top ---
import gevent.monkey
gevent.monkey.patch_all()

# --- Standard Imports ---
from flask import Flask, request, jsonify, send_from_directory, session
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
import os
import uuid
from datetime import datetime, timedelta
# Import Flask-SocketIO and SocketIO
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from flask_cors import CORS # Import CORS

app = Flask(__name__, static_folder='.') # Serve static files from current directory

# --- Flask App Configuration ---
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_for_sessions') # Needed for sessions
app.config["MONGO_URI"] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/oneclass_db')
app.permanent_session_lifetime = timedelta(days=7) # Session lasts for 7 days

# --- CORS and SocketIO Setup ---
# CORS allows cross-origin requests, essential for frontend-backend communication in development
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}}, supports_credentials=True) # Allow all origins for dev
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent', logger=True, engineio_logger=True) # Use gevent async_mode

# --- NEW: Fix for gevent/PyMongo threading conflict ---
mongo = PyMongo(app, connect=False)

# --- NEW: Check for MongoDB Connection and Log Status ---
try:
    # Attempt to access a collection to force a connection test
    # This is an efficient way to check if the connection is active
    mongo.db.command('ping')
    print("MongoDB connection successful! 🚀")
except Exception as e:
    print(f"MongoDB connection failed: {e} ❌")

# MongoDB Collections
users_collection = mongo.db.users
classrooms_collection = mongo.db.classrooms
library_files_collection = mongo.db.library_files
assessments_collection = mongo.db.assessments
assessment_questions_collection = mongo.db.assessment_questions # New
assessment_submissions_collection = mongo.db.assessment_submissions # New
# Modified whiteboard_collection to store drawings per page
whiteboard_collection = mongo.db.whiteboard_drawings_pages
chat_messages_collection = mongo.db.chat_messages # NEW: Collection for chat messages

# Ensure necessary directories exist for file uploads
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


# --- API Endpoints ---

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def serve_css():
    return send_from_directory('.', 'style.css')

@app.route('/app.js')
def serve_js():
    return send_from_directory('.', 'app.js')

# Route for classroom details (for direct access via share link)
@app.route('/classroom/<classroomId>')
def serve_classroom_page(classroomId):
    return send_from_directory('.', 'index.html')

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user') # 'user' or 'admin'

    if not all([username, email, password]):
        return jsonify({"error": "Missing required fields"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    hashed_password = generate_password_hash(password)
    user_id = str(uuid.uuid4()) # Generate a unique ID for the user
    users_collection.insert_one({
        "id": user_id,
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": role,
        "created_at": datetime.utcnow()
    })
    return jsonify({"message": "User registered successfully", "user": {"id": user_id, "username": username, "email": email, "role": role}}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid email or password"}), 401

    session['user_id'] = user['id'] # Store user ID in session
    session['username'] = user['username'] # Store username in session
    session['role'] = user['role'] # Store role in session
    session.permanent = True # Make session permanent
    print(f"User {user['username']} ({user['role']}) logged in. Session set.")

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "role": user['role']
        }
    }), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id')
    if user_id:
        print(f"User {session.get('username')} logging out. Clearing session.")
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None) # Clear role from session
    return jsonify({"message": "Logged out successfully"}), 200

# NEW: Endpoint to check current user session
@app.route('/api/@me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        user = users_collection.find_one({"id": user_id}, {"_id": 0, "password": 0}) # Exclude _id and password
        if user:
            print(f"Current user session check: {user.get('username')} ({user.get('role')})")
            return jsonify(user), 200
        else:
            print(f"User ID {user_id} found in session but not in DB. Clearing session.")
            session.pop('user_id', None)
            session.pop('username', None)
            session.pop('role', None)
            return jsonify({"error": "User not found"}), 404
    print("No user ID in session. Unauthorized.")
    return jsonify({"error": "Unauthorized"}), 401


@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    new_username = data.get('username')

    if not new_username:
        return jsonify({"error": "New username is missing"}), 400

    result = users_collection.update_one(
        {"id": user_id},
        {"$set": {"username": new_username, "updated_at": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404
    if result.modified_count == 0:
        return jsonify({"message": "No changes made"}), 200 # No error if same username
    
    session['username'] = new_username # Update username in session
    print(f"Profile for {user_id} updated to username: {new_username}")
    return jsonify({"message": "Profile updated successfully"}), 200

@app.route('/api/upload-library-files', methods=['POST'])
def upload_library_files():
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    if user_role != 'admin':
        return jsonify({"error": "Forbidden: Only administrators can upload files."}), 403

    if 'files' not in request.files:
        return jsonify({"error": "No files part"}), 400

    files = request.files.getlist('files')
    class_room_id = request.form.get('classroomId')

    if not class_room_id:
        return jsonify({"error": "Classroom ID is missing"}), 400

    uploaded_file_info = []
    for file in files:
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        if file:
            filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1] # Unique filename
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            file_id = str(uuid.uuid4()) # Generate unique ID for the file record
            library_files_collection.insert_one({
                "id": file_id, # Store the generated ID
                "classroomId": class_room_id,
                "original_filename": file.filename,
                "stored_filename": filename,
                "url": f"/uploads/{filename}",
                "uploaded_at": datetime.utcnow(),
                "uploaded_by": user_id
            })
            uploaded_file_info.append({"id": file_id, "filename": file.filename, "url": f"/uploads/{filename}"})
    
    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"Admin {session.get('username')} uploaded new file(s) to the library."
    }, room=class_room_id)

    print(f"Files uploaded to classroom {class_room_id} by {session.get('username')}")
    return jsonify({"message": "Files uploaded successfully", "files": uploaded_file_info}), 201

@app.route('/api/library-files/<classroomId>', methods=['GET'])
def get_library_files(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0})) # Fetch all fields including 'id'
    # Rename 'original_filename' to 'filename' for client consistency if needed, but now 'filename' is stored
    for file in files:
        if 'original_filename' in file: # Handle older entries
            file['filename'] = file.pop('original_filename')
    print(f"Fetched {len(files)} library files for classroom {classroomId}")
    return jsonify(files), 200

@app.route('/api/library-files/<fileId>', methods=['DELETE'])
def delete_library_file(fileId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    if user_role != 'admin':
        return jsonify({"error": "Forbidden: Only administrators can delete files."}), 403

    file_data = library_files_collection.find_one({"id": fileId})
    if not file_data:
        return jsonify({"error": "File not found"}), 404

    # Delete file from filesystem
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file_data['stored_filename'])
    if os.path.exists(filepath):
        os.remove(filepath)
    
    result = library_files_collection.delete_one({"id": fileId})
    if result.deleted_count > 0:
        # Emit admin action update
        socketio.emit('admin_action_update', {
            'classroomId': file_data.get('classroomId'),
            'message': f"Admin {session.get('username')} deleted file '{file_data.get('original_filename', file_data.get('filename'))}' from the library."
        }, room=file_data.get('classroomId'))
        print(f"File {fileId} deleted by {session.get('username')}")
        return jsonify({"message": "File deleted successfully"}), 200
    print(f"Attempted to delete file {fileId} but not found in DB.")
    return jsonify({"error": "File not found"}), 404


@app.route('/api/assessments', methods=['POST'])
def create_assessment():
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can create assessments."}), 401

    data = request.json
    class_room_id = data.get('classroomId')
    title = data.get('title')
    description = data.get('description')
    scheduled_at_str = data.get('scheduled_at')
    duration_minutes = data.get('duration_minutes')
    questions_data = data.get('questions') # Renamed to avoid conflict with 'questions' list below

    if not all([class_room_id, title, scheduled_at_str, duration_minutes is not None, questions_data is not None]):
        return jsonify({"error": "Missing required fields: classroomId, title, scheduled_at, duration_minutes, or questions"}), 400
    
    if not isinstance(questions_data, list) or not questions_data:
        return jsonify({"error": "Questions must be a non-empty list"}), 400

    try:
        scheduled_at = datetime.fromisoformat(scheduled_at_str)
    except ValueError:
        return jsonify({"error": "Invalid scheduled_at format. Expected YYYY-MM-DDTHH:MM"}), 400

    if not isinstance(duration_minutes, int) or duration_minutes <= 0:
        return jsonify({"error": "Duration must be a positive integer"}), 400

    assessment_id = str(uuid.uuid4())
    
    # Debugging: Print values before insertion
    print(f"Creating assessment: title='{title}', scheduled_at='{scheduled_at}', duration_minutes='{duration_minutes}'")

    # Insert assessment details
    assessments_collection.insert_one({
        "id": assessment_id,
        "classroomId": class_room_id,
        "title": title,
        "description": description,
        "scheduled_at": scheduled_at, # Storing as datetime object
        "duration_minutes": duration_minutes,
        "creator_id": user_id,
        "creator_username": username,
        "creator_role": user_role,
        "created_at": datetime.utcnow()
    })

    # Insert each question into the assessment_questions_collection
    inserted_question_ids = []
    for q_data in questions_data: # Iterate over questions_data
        question_id = str(uuid.uuid4())
        # Ensure consistent key names for storing questions
        question_doc = {
            "id": question_id,
            "assessmentId": assessment_id,
            "classroomId": class_room_id, # Link to classroom for easier queries
            "question_text": q_data.get('question_text'), # Use 'question_text'
            "question_type": q_data.get('question_type'), # Use 'question_type'
            "options": q_data.get('options'),
            "correct_answer": q_data.get('correct_answer')
        }
        # Filter out None values for optional fields if they are not provided
        question_doc = {k: v for k, v in question_doc.items() if v is not None}
        
        assessment_questions_collection.insert_one(question_doc)
        inserted_question_ids.append(question_id)

    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"Admin {session.get('username')} created a new assessment: '{title}' with {len(questions_data)} questions."
    }, room=class_room_id)

    print(f"Assessment '{title}' created by {username} in classroom {class_room_id} with {len(questions_data)} questions.")
    return jsonify({"message": "Assessment created successfully", "id": assessment_id}), 201

@app.route('/api/assessments/<assessmentId>/questions', methods=['POST'])
def add_questions_to_assessment(assessmentId):
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can add questions."}), 401

    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    data = request.json
    questions_data = data.get('questions') # Renamed

    if not isinstance(questions_data, list) or not questions_data:
        return jsonify({"error": "Questions must be a non-empty list"}), 400

    inserted_question_ids = []
    for q_data in questions_data: # Iterate over questions_data
        question_id = str(uuid.uuid4())
        question_doc = {
            "id": question_id,
            "assessmentId": assessmentId,
            "classroomId": assessment['classroomId'], # Link to classroom
            "question_text": q_data.get('question_text'), # Use 'question_text'
            "question_type": q_data.get('question_type'), # Use 'question_type'
            "options": q_data.get('options'),
            "correct_answer": q_data.get('correct_answer')
        }
        question_doc = {k: v for k, v in question_doc.items() if v is not None}

        assessment_questions_collection.insert_one(question_doc)
        inserted_question_ids.append(question_id)

    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': assessment.get('classroomId'),
        'message': f"Admin {session.get('username')} added {len(questions_data)} questions to assessment '{assessment.get('title')}'."
    }, room=assessment.get('classroomId'))

    print(f"Added {len(questions_data)} questions to assessment {assessmentId}")
    return jsonify({"message": "Questions added successfully", "question_ids": inserted_question_ids}), 201


@app.route('/api/assessments/<classroomId>', methods=['GET'])
def get_assessments(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Fetch assessments without their questions for the list view
    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"_id": 0}))
    
    # Convert datetime objects to ISO format strings for client-side
    for assessment in assessments:
        if 'scheduled_at' in assessment and isinstance(assessment['scheduled_at'], datetime):
            assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
        if 'created_at' in assessment and isinstance(assessment['created_at'], datetime):
            assessment['created_at'] = assessment['created_at'].isoformat()

    print(f"Fetched {len(assessments)} assessments (list view) for classroom {classroomId}")
    return jsonify(assessments), 200

@app.route('/api/assessments/<assessmentId>', methods=['GET'])
def get_assessment_details(assessmentId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    assessment = assessments_collection.find_one({"id": assessmentId}, {"_id": 0})
    if not assessment:
        print(f"Assessment {assessmentId} not found.")
        return jsonify({"error": "Assessment not found"}), 404
    
    # Debugging: Print raw values from DB
    print(f"Raw assessment details from DB for {assessmentId}: scheduled_at={assessment.get('scheduled_at')}, duration_minutes={assessment.get('duration_minutes')}")

    # Check if the assessment is starting now and emit event
    now = datetime.utcnow()
    scheduled_at = assessment.get('scheduled_at')
    duration_minutes = assessment.get('duration_minutes')

    # Basic validation for scheduled_at and duration_minutes before calculations
    if not isinstance(scheduled_at, datetime) or not isinstance(duration_minutes, (int, float)) or duration_minutes <= 0:
        print(f"Invalid scheduled_at ({scheduled_at}) or duration_minutes ({duration_minutes}) for assessment {assessmentId}. Cannot calculate end time.")
        # Return an error or handle gracefully if data is corrupt
        return jsonify({"error": "Assessment scheduling data is invalid. Please contact an administrator."}), 500


    end_time = scheduled_at + timedelta(minutes=duration_minutes)

    # If the assessment is active and it's the first time a user is fetching it since it became active
    # (or within a small buffer to ensure notification)
    if scheduled_at <= now < end_time:
        # Check if this user has already started/submitted this assessment
        existing_submission = assessment_submissions_collection.find_one({
            "assessmentId": assessmentId,
            "student_id": user_id
        })
        # Only emit if no submission exists yet for this user for this assessment
        if not existing_submission:
            # Emit assessment_started event to the specific user who just fetched it
            socketio.emit('assessment_started', {
                'classroomId': assessment['classroomId'],
                'assessmentId': assessmentId,
                'title': assessment['title'],
                'endTime': end_time.isoformat()
            }, room=request.sid) # Emit only to the requesting client's SID
            print(f"Emitted 'assessment_started' to {request.sid} for assessment {assessmentId}")


    # Fetch questions for this specific assessment
    # Ensure the keys are consistent with what the frontend expects
    assessment['questions'] = list(assessment_questions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))
    
    # Convert datetime objects to ISO format strings for client-side
    if 'scheduled_at' in assessment and isinstance(assessment['scheduled_at'], datetime):
        assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
    if 'created_at' in assessment and isinstance(assessment['created_at'], datetime):
        assessment['created_at'] = assessment['created_at'].isoformat()

    print(f"Fetched details for assessment {assessmentId} including questions. Questions count: {len(assessment['questions'])}")
    return jsonify(assessment), 200


@app.route('/api/assessments/<assessmentId>/submit', methods=['POST'])
def submit_assessment():
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role') # Get user role for submission record
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    assessment_id = data.get('assessmentId')
    class_room_id = data.get('classroomId')
    answers = data.get('answers') # List of {question_id: "...", user_answer: "...", question_text: "...", question_type: "...", correct_answer: "..."}
    is_auto_submit = data.get('is_auto_submit', False) # New: flag for auto-submission

    if not all([assessment_id, class_room_id, answers]):
        return jsonify({"error": "Missing required fields: assessmentId, classroomId, or answers"}), 400
    
    if not isinstance(answers, list):
        return jsonify({"error": "Answers must be a list"}), 400

    # Check if assessment is still active or if it's an auto-submission
    assessment_details = assessments_collection.find_one({"id": assessment_id})
    if not assessment_details:
        return jsonify({"error": "Assessment not found"}), 404

    now = datetime.utcnow()
    scheduled_at = assessment_details['scheduled_at']
    duration_minutes = assessment_details['duration_minutes']
    end_time = scheduled_at + timedelta(minutes=duration_minutes)

    if not is_auto_submit and now > end_time:
        return jsonify({"error": "Assessment submission time has passed."}), 403

    # Check if user has already submitted
    existing_submission = assessment_submissions_collection.find_one({
        "assessmentId": assessment_id,
        "student_id": user_id
    })
    if existing_submission:
        return jsonify({"error": "You have already submitted this assessment."}), 409

    submission_id = str(uuid.uuid4())
    
    score = 0
    total_questions = 0
    graded_answers = []

    for submitted_answer in answers:
        question_id = submitted_answer.get('question_id')
        user_answer = submitted_answer.get('user_answer')
        
        if question_id:
            question = assessment_questions_collection.find_one({"id": question_id})
            if question:
                total_questions += 1
                is_correct = False
                # Use 'question_type' from DB for consistency
                if question.get('question_type') == 'mcq': 
                    # Use the correct_answer from the DB, not client-provided
                    db_correct_answer = question.get('correct_answer')
                    if db_correct_answer and user_answer is not None and \
                       str(user_answer).strip().lower() == str(db_correct_answer).strip().lower():
                        score += 1
                        is_correct = True
                
                graded_answers.append({
                    "question_id": question_id,
                    "question_text": question.get('question_text'), # Use 'question_text' from DB
                    "user_answer": user_answer,
                    "correct_answer": question.get('correct_answer'),
                    "is_correct": is_correct if question.get('question_type') == 'mcq' else None # Only for MCQ
                })

    assessment_submissions_collection.insert_one({
        "id": submission_id,
        "assessmentId": assessment_id,
        "classroomId": class_room_id,
        "student_id": user_id,
        "student_username": username,
        "student_role": user_role, # Store student's role
        "submitted_at": datetime.utcnow(),
        "answers": graded_answers,
        "score": score,
        "total_questions": total_questions,
        "is_auto_submit": is_auto_submit # Store auto-submit flag
    })

    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"User {username} submitted an assessment for '{assessment_details.get('title')}'."
    }, room=class_room_id)

    print(f"Assessment {assessment_id} submitted by {username}. Score: {score}/{total_questions}")
    return jsonify({"message": "Assessment submitted successfully", "submission_id": submission_id, "score": score, "total_questions": total_questions}), 201

@app.route('/api/assessments/<assessmentId>/submissions', methods=['GET'])
def get_assessment_submissions(assessmentId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Admins can see all submissions for their assessment
    # Students can only see their own submission (if any)
    query = {"assessmentId": assessmentId}
    # If not admin, filter by student_id
    if user_role != 'admin':
        query["student_id"] = user_id

    submissions = list(assessment_submissions_collection.find(query, {"_id": 0}).sort("submitted_at", -1))

    print(f"Fetched {len(submissions)} submissions for assessment {assessmentId}")
    return jsonify(submissions), 200

@app.route('/api/submissions/<submissionId>', methods=['GET'])
def get_single_submission(submissionId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    submission = assessment_submissions_collection.find_one({"id": submissionId}, {"_id": 0})
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    # Ensure only admin (who owns the assessment) or the submitting student can view
    assessment = assessments_collection.find_one({"id": submission['assessmentId']})
    if not assessment:
        return jsonify({"error": "Associated assessment not found"}), 404

    if user_role == 'admin' and assessment['creator_id'] == user_id:
        return jsonify(submission), 200
    elif user_role == 'user' and submission['student_id'] == user_id:
        return jsonify(submission), 200
    else:
        return jsonify({"error": "Forbidden: You do not have permission to view this submission."}), 403


@app.route('/api/assessments/<assessmentId>/mark-submission/<submissionId>', methods=['POST'])
def mark_submission(assessmentId, submissionId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can mark submissions."}), 401

    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment or assessment['creator_id'] != user_id:
        return jsonify({"error": "Forbidden: You are not the creator of this assessment."}), 403

    submission = assessment_submissions_collection.find_one({"id": submissionId, "assessmentId": assessmentId})
    if not submission:
        return jsonify({"error": "Submission not found"}), 404
    
    data = request.json
    new_score = data.get('score')
    feedback = data.get('feedback')

    if new_score is None:
        return jsonify({"error": "New score is missing"}), 400
    
    try:
        new_score = int(new_score)
    except (ValueError, TypeError):
        return jsonify({"error": "Score must be an integer"}), 400
    
    result = assessment_submissions_collection.update_one(
        {"id": submissionId},
        {"$set": {"score": new_score, "feedback": feedback, "marked_by": user_id, "marked_at": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Submission not found or not updated"}), 404
    
    print(f"Submission {submissionId} for assessment {assessmentId} marked with score {new_score}")
    return jsonify({"message": "Submission marked successfully"}), 200


@app.route('/api/classrooms', methods=['POST'])
def create_classroom():
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can create classrooms."}), 401

    data = request.json
    classroom_name = data.get('classroomName')
    if not classroom_name:
        return jsonify({"error": "Classroom name is required"}), 400

    classroom_id = str(uuid.uuid4())
    classrooms_collection.insert_one({
        "id": classroom_id,
        "name": classroom_name,
        "adminId": user_id,
        "createdAt": datetime.utcnow()
    })
    
    print(f"Classroom '{classroom_name}' created with ID: {classroom_id} by admin {user_id}")
    return jsonify({"message": "Classroom created successfully", "classroomId": classroom_id}), 201

@app.route('/api/classrooms', methods=['GET'])
def get_classrooms():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    classrooms = list(classrooms_collection.find({}, {"_id": 0}))
    print(f"Fetched {len(classrooms)} classrooms.")
    return jsonify(classrooms), 200

# NEW: Endpoint to get a single classroom by ID
@app.route('/api/classrooms/<classroomId>', methods=['GET'])
def get_single_classroom(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    classroom = classrooms_collection.find_one({"id": classroomId}, {"_id": 0})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404
    
    print(f"Fetched classroom details for ID: {classroomId}")
    return jsonify(classroom), 200

@app.route('/api/classrooms/<classroomId>', methods=['DELETE'])
def delete_classroom(classroomId):
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can delete classrooms."}), 401
    
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    # Ensure the admin is the creator of the classroom
    if classroom.get('adminId') != user_id:
        return jsonify({"error": "Forbidden: You are not the creator of this classroom."}), 403

    # Delete related documents (assessments, submissions, library files, whiteboard drawings, chat messages)
    assessments_collection.delete_many({"classroomId": classroomId})
    assessment_questions_collection.delete_many({"classroomId": classroomId})
    assessment_submissions_collection.delete_many({"classroomId": classroomId})
    whiteboard_collection.delete_many({"classroomId": classroomId})
    chat_messages_collection.delete_many({"classroomId": classroomId})
    library_files_collection.delete_many({"classroomId": classroomId})

    # Delete the classroom itself
    result = classrooms_collection.delete_one({"id": classroomId})

    if result.deleted_count > 0:
        print(f"Classroom {classroomId} and all related data deleted by admin {user_id}")
        return jsonify({"message": "Classroom and associated data deleted successfully"}), 200
    
    print(f"Attempted to delete classroom {classroomId} but not found in DB.")
    return jsonify({"error": "Classroom not found"}), 404

# --- SocketIO Event Handlers ---

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")
    # Remove user from their room on disconnect
    for r in rooms():
        if r != request.sid: # Exclude the user's personal room
            leave_room(r)
            print(f"Client {request.sid} left room {r} on disconnect.")

@socketio.on('join_classroom')
def handle_join_classroom(data):
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')
    classroomId = data.get('classroomId')

    if not user_id or not classroomId:
        emit('join_status', {'status': 'error', 'message': 'Unauthorized or invalid data'}, room=request.sid)
        return

    join_room(classroomId)
    print(f"User {username} ({user_role}) joined classroom: {classroomId}")
    
    # Broadcast to all others in the room
    emit('user_joined', {'userId': user_id, 'username': username, 'role': user_role, 'sid': request.sid}, room=classroomId, include_sid=False)
    
    # Send a private message to the newly joined user with a list of current users
    current_users_in_room = []
    
    # This is a bit tricky with SocketIO. A simple way is to iterate over SIDs in the room
    # and send a query to each client to get their user info.
    # A more robust solution would involve a server-side state of users in each room.
    # For now, we'll just log and let the client handle.
    # The new user will be notified of existing users via a separate 'current_users' event.

    emit('join_status', {'status': 'success', 'message': f'Joined classroom {classroomId}'}, room=request.sid)

@socketio.on('leave_classroom')
def handle_leave_classroom(data):
    user_id = session.get('user_id')
    username = session.get('username')
    classroomId = data.get('classroomId')
    if not user_id or not classroomId:
        return
    
    leave_room(classroomId)
    print(f"User {username} left classroom: {classroomId}")
    emit('user_left', {'userId': user_id, 'username': username}, room=classroomId, include_sid=False)

# NEW: Chat message handler
@socketio.on('send_chat_message')
def handle_send_chat_message(data):
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')
    classroomId = data.get('classroomId')
    message_text = data.get('message')

    if not all([user_id, classroomId, message_text]):
        print("Missing data for chat message.")
        return

    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow()
    
    message_doc = {
        "id": message_id,
        "classroomId": classroomId,
        "userId": user_id,
        "username": username,
        "role": user_role,
        "text": message_text,
        "timestamp": timestamp
    }
    
    chat_messages_collection.insert_one(message_doc)
    print(f"New chat message in {classroomId} from {username}: '{message_text}'")
    
    # Send the message to everyone in the room, including the sender
    emit('receive_chat_message', {
        'id': message_id,
        'userId': user_id,
        'username': username,
        'role': user_role,
        'text': message_text,
        'timestamp': timestamp.isoformat()
    }, room=classroomId)

# NEW: Whiteboard drawing handler
@socketio.on('whiteboard_draw')
def handle_whiteboard_draw(data):
    classroomId = data.get('classroomId')
    page_number = data.get('pageNumber')
    drawing_data = data.get('drawingData')
    
    if not all([classroomId, page_number, drawing_data]):
        return

    # Store the drawing data for persistence
    drawing_id = str(uuid.uuid4())
    whiteboard_collection.insert_one({
        "id": drawing_id,
        "classroomId": classroomId,
        "pageNumber": page_number,
        "drawingData": drawing_data,
        "timestamp": datetime.utcnow()
    })
    
    # Broadcast the drawing to other clients in the room
    emit('whiteboard_draw', {'drawingData': drawing_data, 'pageNumber': page_number}, room=classroomId, include_sid=False)

# NEW: Clear whiteboard handler
@socketio.on('clear_whiteboard')
def handle_clear_whiteboard(data):
    classroomId = data.get('classroomId')
    page_number = data.get('pageNumber')
    
    if not all([classroomId, page_number]):
        return
    
    # Delete all drawings for the specified page in the specified classroom
    whiteboard_collection.delete_many({"classroomId": classroomId, "pageNumber": page_number})
    
    # Broadcast the clear event to all clients in the room
    emit('clear_whiteboard', {'pageNumber': page_number}, room=classroomId, include_sid=False)
    print(f"Whiteboard page {page_number} in classroom {classroomId} cleared.")

# NEW: Whiteboard page change handler
@socketio.on('whiteboard_page_change')
def handle_whiteboard_page_change(data):
    classroomId = data.get('classroomId')
    newPageNumber = data.get('newPageNumber')

    if not all([classroomId, newPageNumber]):
        return
    
    # Broadcast the page change to all other clients in the room
    emit('whiteboard_page_change', {'newPageNumber': newPageNumber}, room=classroomId, include_sid=False)
    print(f"Whiteboard page changed to {newPageNumber} in classroom {classroomId}.")

# NEW: Handlers for video/audio (WebRTC) signaling
@socketio.on('webrtc_signal')
def handle_webrtc_signal(data):
    recipient_id = data.get('recipient_id')
    signal_data = data.get('signal_data')
    sender_sid = request.sid

    if not recipient_id or not signal_data:
        print("Missing recipient or signal data")
        return

    # Forward the signal to the intended recipient
    emit('webrtc_signal', {'signal_data': signal_data, 'sender_id': sender_sid}, room=recipient_id)
    print(f"WEBRTC: Signal from {sender_sid} to {recipient_id}")

@socketio.on('webrtc_ice_candidate')
def handle_ice_candidate(data):
    recipient_id = data.get('recipient_id')
    candidate = data.get('candidate')
    classroomId = data.get('classroomId') # Added for context
    sender_id = request.sid

    if not recipient_id or not candidate or not classroomId:
        print(f"Missing data for webrtc_ice_candidate: {data}")
        return

    emit('webrtc_ice_candidate', {'candidate': candidate, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: ICE Candidate from {sender_id} to {recipient_id} in classroom {classroomId}")


@socketio.on('webrtc_peer_disconnected')
def handle_peer_disconnected_signal(data):
    classroomId = data.get('classroomId')
    peer_id = data.get('peer_id')
    sender_sid = request.sid

    if not classroomId or not peer_id:
        print(f"Missing data for webrtc_peer_disconnected: {data}")
        return
    
    emit('webrtc_peer_disconnected', {'peer_id': peer_id}, room=classroomId, include_sid=False)
    print(f"WEBRTC: Client {sender_sid} signaling peer {peer_id} disconnected in classroom {classroomId}")


@socketio.on('admin_action_update')
def handle_admin_action_update(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    # Only admins can send this, but we'll re-emit to everyone in the room
    if classroomId and message:
        emit('admin_action_update', {'message': message}, room=classroomId, include_sid=False)
        print(f"Admin action update from {session.get('username')} in classroom {classroomId}: {message}")


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=os.environ.get('PORT', 5000))
