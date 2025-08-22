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
from bson.objectid import ObjectId  # For using ObjectId in MongoDB queries

# Import Flask-SocketIO and SocketIO
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from flask_cors import CORS  # Import CORS

# --- New: Import APScheduler and the GeventExecutor ---
from apscheduler.schedulers.gevent import GeventScheduler
from apscheduler.executors.gevent import GeventExecutor

app = Flask(__name__, static_folder='.')  # Serve static files from current directory

# --- Flask App Configuration ---
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_for_sessions')  # Needed for sessions
app.config["MONGO_URI"] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/oneclass_db')
app.permanent_session_lifetime = timedelta(days=7)  # Session lasts for 7 days

# --- CORS and SocketIO Setup ---
# CORS allows cross-origin requests, essential for frontend-backend communication in development
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}}, supports_credentials=True)  # Allow all origins for dev
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent', logger=True, engineio_logger=True, manage_session=True)

# --- MongoDB Setup ---
mongo = PyMongo(app)

# MongoDB Collections
users_collection = mongo.db.users
classrooms_collection = mongo.db.classrooms
library_files_collection = mongo.db.library_files
assessments_collection = mongo.db.assessments
assessment_questions_collection = mongo.db.assessment_questions
assessment_submissions_collection = mongo.db.assessment_submissions
whiteboard_collection = mongo.db.whiteboard_drawings_pages
chat_messages_collection = mongo.db.chat_messages
webrtc_signals_collection = mongo.db.webrtc_signals  # Collection for persistent signaling

# Ensure necessary directories exist for file uploads
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- APScheduler Setup ---
scheduler = GeventScheduler()
scheduler.add_executor(GeventExecutor, 'default')
scheduler.start()

def delete_old_classrooms():
    """
    Deletes classrooms that have not been active for a period of time.
    For this example, we'll use a simple time-based check.
    """
    # Placeholder for logic. In a real app, you'd use a timestamp.
    pass

scheduler.add_job(delete_old_classrooms, 'interval', minutes=60)  # Run every hour

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

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')  # 'user' or 'admin'

    if not all([username, email, password]):
        return jsonify({"error": "Missing required fields"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    hashed_password = generate_password_hash(password)
    user_id = str(uuid.uuid4())  # Generate a unique ID for the user
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

    session['user_id'] = user['id']  # Store user ID in session
    session['username'] = user['username']  # Store username in session
    session['role'] = user['role']  # Store role in session
    session.permanent = True  # Make session permanent
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
    session.pop('role', None)  # Clear role from session
    return jsonify({"message": "Logged out successfully"}), 200

# NEW: Endpoint to check current user session
@app.route('/api/@me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        user = users_collection.find_one({"id": user_id}, {"_id": 0, "password": 0})  # Exclude _id and password
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
        return jsonify({"message": "No changes made"}), 200  # No error if same username
    
    session['username'] = new_username  # Update username in session
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
            filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]  # Unique filename
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            file_id = str(uuid.uuid4())  # Generate unique ID for the file record
            library_files_collection.insert_one({
                "id": file_id,  # Store the generated ID
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

    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0}))  # Fetch all fields including 'id'
    # Rename 'original_filename' to 'filename' for client consistency if needed, but now 'filename' is stored
    for file in files:
        if 'original_filename' in file:  # Handle older entries
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
    questions_data = data.get('questions')  # Renamed to avoid conflict with 'questions' list below

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
        "scheduled_at": scheduled_at,  # Storing as datetime object
        "duration_minutes": duration_minutes,
        "creator_id": user_id,
        "creator_username": username,
        "creator_role": user_role,
        "created_at": datetime.utcnow()
    })

    # Insert each question into the assessment_questions_collection
    inserted_question_ids = []
    for q_data in questions_data:  # Iterate over questions_data
        question_id = str(uuid.uuid4())
        # Ensure consistent key names for storing questions
        question_doc = {
            "id": question_id,
            "assessmentId": assessment_id,
            "classroomId": class_room_id,  # Link to classroom for easier queries
            "question_text": q_data.get('question_text'),  # Use 'question_text'
            "question_type": q_data.get('question_type'),  # Use 'question_type'
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
    questions_data = data.get('questions')  # Renamed

    if not isinstance(questions_data, list) or not questions_data:
        return jsonify({"error": "Questions must be a non-empty list"}), 400

    inserted_question_ids = []
    for q_data in questions_data:  # Iterate over questions_data
        question_id = str(uuid.uuid4())
        question_doc = {
            "id": question_id,
            "assessmentId": assessmentId,
            "classroomId": assessment['classroomId'],  # Link to classroom
            "question_text": q_data.get('question_text'),  # Use 'question_text'
            "question_type": q_data.get('question_type'),  # Use 'question_type'
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
            }, room=request.sid)  # Emit only to the requesting client's SID
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
    user_role = session.get('role')  # Get user role for submission record
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    assessment_id = data.get('assessmentId')
    class_room_id = data.get('classroomId')
    answers = data.get('answers')  # List of {question_id: "...", user_answer: "...", question_text: "...", question_type: "...", correct_answer: "..."}
    is_auto_submit = data.get('is_auto_submit', False)  # New: flag for auto-submission

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
                    "question_text": question.get('question_text'),  # Use 'question_text' from DB
                    "user_answer": user_answer,
                    "correct_answer": question.get('correct_answer'),
                    "is_correct": is_correct if question.get('question_type') == 'mcq' else None  # Only for MCQ
                })

    assessment_submissions_collection.insert_one({
        "id": submission_id,
        "assessmentId": assessment_id,
        "classroomId": class_room_id,
        "student_id": user_id,
        "student_username": username,
        "student_role": user_role,  # Store student's role
        "submitted_at": datetime.utcnow(),
        "answers": graded_answers,
        "score": score,
        "total_questions": total_questions,
        "is_auto_submit": is_auto_submit  # Store auto-submit flag
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
        return jsonify({"error": "Submission not found for this assessment."}), 404

    data = request.json
    updated_answers = data.get('updated_answers')  # List of {question_id: "...", is_correct: bool, admin_feedback: "..."}

    if not isinstance(updated_answers, list):
        return jsonify({"error": "updated_answers must be a list"}), 400

    # Create a dictionary for quick lookup of existing answers
    existing_answers_map = {ans['question_id']: ans for ans in submission['answers']}

    new_score = 0
    updated_answers_list = []

    for updated_ans_data in updated_answers:
        q_id = updated_ans_data.get('question_id')
        is_correct = updated_ans_data.get('is_correct')
        admin_feedback = updated_ans_data.get('admin_feedback')

        if q_id and q_id in existing_answers_map:
            original_answer = existing_answers_map[q_id]
            
            # Update the original answer with new marking data
            original_answer['is_correct'] = is_correct
            original_answer['admin_feedback'] = admin_feedback

            if is_correct:
                new_score += 1
            
            updated_answers_list.append(original_answer)
        else:
            print(f"Warning: Question ID {q_id} not found in original submission {submissionId}")

    # Update the submission document
    result = assessment_submissions_collection.update_one(
        {"id": submissionId},
        {"$set": {
            "answers": updated_answers_list,
            "score": new_score,
            "marked_by": user_id,
            "marked_at": datetime.utcnow()
        }}
    )

    if result.modified_count > 0:
        # Emit Socket.IO event to the student who submitted the assessment
        socketio.emit('submission_marked', {
            'assessmentId': assessmentId,
            'assessmentTitle': assessment['title'],
            'submissionId': submissionId,
            'studentId': submission['student_id'],
            'score': new_score,
            'total_questions': submission['total_questions']
        }, room=submission['student_id'])  # Emit to the student's user_id room

        # Also emit admin action update to the classroom
        socketio.emit('admin_action_update', {
            'classroomId': assessment.get('classroomId'),
            'message': f"Admin {session.get('username')} marked a submission for '{assessment.get('title')}'."
        }, room=assessment.get('classroomId'))

        print(f"Submission {submissionId} for assessment {assessmentId} marked by admin {user_id}. New score: {new_score}")
        return jsonify({"message": "Submission marked successfully", "new_score": new_score}), 200
    
    print(f"No changes made to submission {submissionId} during marking.")
    return jsonify({"message": "No changes made to submission"}), 200

@app.route('/api/assessments/<assessmentId>', methods=['DELETE'])
def delete_assessment(assessmentId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only admins can delete assessments"}), 403

    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    # Delete associated questions and submissions
    assessment_questions_collection.delete_many({"assessmentId": assessmentId})
    assessment_submissions_collection.delete_many({"assessmentId": assessmentId})
    result = assessments_collection.delete_one({"id": assessmentId})

    if result.deleted_count > 0:
        # Emit admin action update
        socketio.emit('admin_action_update', {
            'classroomId': assessment.get('classroomId'),
            'message': f"Admin {session.get('username')} deleted assessment '{assessment.get('title')}'."
        }, room=assessment.get('classroomId'))
        print(f"Assessment {assessmentId} and related data deleted by {session.get('username')}")
        return jsonify({"message": "Assessment and its related data deleted successfully"}), 200
    print(f"Attempted to delete assessment {assessmentId} but not found in DB.")
    return jsonify({"error": "Assessment not found"}), 404

@app.route('/api/classrooms', methods=['POST'])
def create_classroom():
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':  # Only admins can create classrooms
        return jsonify({"error": "Unauthorized: Only administrators can create classrooms."}), 401

    data = request.json
    classroom_name = data.get('name')

    if not classroom_name:
        return jsonify({"error": "Classroom name is required"}), 400

    classroom_id = str(uuid.uuid4())
    classrooms_collection.insert_one({
        "id": classroom_id,
        "name": classroom_name,
        "creator_id": user_id,
        "creator_username": username,
        "created_at": datetime.utcnow(),
        "participants": [user_id]  # Creator is initially a participant
    })
    # Emit admin action update (this is for general notification, not room-specific yet)
    socketio.emit('admin_action_update', {
        'classroomId': classroom_id,  # Use new classroom ID
        'message': f"Admin {username} created a new classroom: '{classroom_name}'."
    })
    print(f"Classroom '{classroom_name}' created by {username}. ID: {classroom_id}")
    return jsonify({"message": "Classroom created successfully", "classroom": {"id": classroom_id, "name": classroom_name}}), 201

@app.route('/api/classrooms', methods=['GET'])
def get_classrooms():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Fetch classrooms where the user is a participant
    classrooms = list(classrooms_collection.find({"participants": user_id}, {"_id": 0}))
    print(f"Fetched {len(classrooms)} classrooms for user {user_id}")
    return jsonify(classrooms), 200

@app.route('/api/classrooms/<classroomId>', methods=['GET'])
def get_classroom_details(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id}, {"_id": 0})
    if not classroom:
        return jsonify({"error": "Classroom not found or access denied"}), 404

    # Fetch recent chat messages for this classroom (e.g., last 50 messages)
    chat_messages = list(chat_messages_collection.find({"classroomId": classroomId}, {"_id": 0}).sort("timestamp", -1).limit(50))
    chat_messages.reverse()  # Reverse to get chronological order

    # Fetch library files for this classroom
    library_files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0}))

    # Fetch assessments for this classroom
    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"_id": 0}))
    for assessment in assessments:
        if 'scheduled_at' in assessment and isinstance(assessment['scheduled_at'], datetime):
            assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
        if 'created_at' in assessment and isinstance(assessment['created_at'], datetime):
            assessment['created_at'] = assessment['created_at'].isoformat()

    # Fetch whiteboard drawings for this classroom
    whiteboard_drawings = list(whiteboard_collection.find({"classroomId": classroomId}, {"_id": 0}).sort("timestamp", -1).limit(1))
    current_whiteboard = whiteboard_drawings[0] if whiteboard_drawings else None

    classroom_details = {
        "classroom": classroom,
        "chat_messages": chat_messages,
        "library_files": library_files,
        "assessments": assessments,
        "current_whiteboard": current_whiteboard
    }
    print(f"Fetched details for classroom {classroomId} for user {user_id}")
    return jsonify(classroom_details), 200

@app.route('/api/classrooms/<classroomId>/join', methods=['POST'])
def join_classroom(classroomId):
    user_id = session.get('user_id')
    username = session.get('username')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    # Add user to participants if not already there
    if user_id not in classroom.get('participants', []):
        classrooms_collection.update_one(
            {"id": classroomId},
            {"$addToSet": {"participants": user_id}}
        )
        print(f"User {username} joined classroom {classroomId}")
        return jsonify({"message": "Joined classroom successfully"}), 200
    else:
        print(f"User {username} already in classroom {classroomId}")
        return jsonify({"message": "Already a participant"}), 200

@app.route('/api/classrooms/<classroomId>/leave', methods=['POST'])
def leave_classroom(classroomId):
    user_id = session.get('user_id')
    username = session.get('username')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    # Remove user from participants
    if user_id in classroom.get('participants', []):
        classrooms_collection.update_one(
            {"id": classroomId},
            {"$pull": {"participants": user_id}}
        )
        print(f"User {username} left classroom {classroomId}")
        return jsonify({"message": "Left classroom successfully"}), 200
    else:
        print(f"User {username} was not in classroom {classroomId}")
        return jsonify({"message": "Not a participant"}), 200

@app.route('/api/classrooms/<classroomId>/participants', methods=['GET'])
def get_classroom_participants(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id}, {"_id": 0, "participants": 1})
    if not classroom:
        return jsonify({"error": "Classroom not found or access denied"}), 404

    # Fetch user details for each participant
    participant_ids = classroom.get('participants', [])
    participants = list(users_collection.find({"id": {"$in": participant_ids}}, {"_id": 0, "password": 0}))
    print(f"Fetched {len(participants)} participants for classroom {classroomId}")
    return jsonify(participants), 200

@app.route('/api/classrooms/<classroomId>', methods=['DELETE'])
def delete_classroom(classroomId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only admins can delete classrooms"}), 403

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    # Delete all associated data: library files, assessments, questions, submissions, whiteboard, chat messages
    library_files = list(library_files_collection.find({"classroomId": classroomId}, {"stored_filename": 1}))
    for file in library_files:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file['stored_filename'])
        if os.path.exists(filepath):
            os.remove(filepath)
    library_files_collection.delete_many({"classroomId": classroomId})

    # Delete assessments and related data
    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"id": 1}))
    assessment_ids = [a['id'] for a in assessments]
    assessment_questions_collection.delete_many({"classroomId": classroomId})
    assessment_submissions_collection.delete_many({"classroomId": classroomId})
    assessments_collection.delete_many({"classroomId": classroomId})

    # Delete whiteboard and chat messages
    whiteboard_collection.delete_many({"classroomId": classroomId})
    chat_messages_collection.delete_many({"classroomId": classroomId})

    # Finally, delete the classroom itself
    result = classrooms_collection.delete_one({"id": classroomId})
    if result.deleted_count > 0:
        # Emit admin action update (general notification)
        socketio.emit('admin_action_update', {
            'classroomId': classroomId,
            'message': f"Admin {session.get('username')} deleted classroom '{classroom.get('name')}' and all its data."
        })
        print(f"Classroom {classroomId} and all related data deleted by {session.get('username')}")
        return jsonify({"message": "Classroom and all related data deleted successfully"}), 200
    print(f"Attempted to delete classroom {classroomId} but not found in DB.")
    return jsonify({"error": "Classroom not found"}), 404

# --- Socket.IO Event Handlers ---
@socketio.on('connect')
def handle_connect():
    user_id = session.get('user_id')
    username = session.get('username')
    if user_id:
        print(f"User {username} ({user_id}) connected with SID: {request.sid}")
        # Join a room specific to the user for targeted events (e.g., assessment notifications)
        join_room(user_id)
    else:
        print(f"Unauthenticated user connected with SID: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    user_id = session.get('user_id')
    username = session.get('username')
    if user_id:
        print(f"User {username} ({user_id}) disconnected. SID: {request.sid}")
        # Leave all rooms? SocketIO automatically handles leaving rooms on disconnect.

@socketio.on('join_classroom')
def handle_join_classroom(data):
    user_id = session.get('user_id')
    username = session.get('username')
    classroom_id = data.get('classroomId')
    if not user_id or not classroom_id:
        return

    # Verify user is a participant of the classroom
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": user_id})
    if classroom:
        join_room(classroom_id)
        print(f"User {username} joined Socket.IO room for classroom {classroom_id}")
        # Optionally, emit a system message to the classroom chat
        chat_message_id = str(uuid.uuid4())
        chat_message = {
            "id": chat_message_id,
            "classroomId": classroom_id,
            "userId": user_id,
            "username": username,
            "message": f"{username} joined the classroom.",
            "timestamp": datetime.utcnow(),
            "isSystemMessage": True
        }
        chat_messages_collection.insert_one(chat_message)
        emit('chat_message', chat_message, room=classroom_id, include_self=True)
    else:
        print(f"User {username} attempted to join classroom {classroom_id} without access.")

@socketio.on('leave_classroom')
def handle_leave_classroom(data):
    user_id = session.get('user_id')
    username = session.get('username')
    classroom_id = data.get('classroomId')
    if not user_id or not classroom_id:
        return

    leave_room(classroom_id)
    print(f"User {username} left Socket.IO room for classroom {classroom_id}")
    # Optionally, emit a system message to the classroom chat
    chat_message_id = str(uuid.uuid4())
    chat_message = {
        "id": chat_message_id,
        "classroomId": classroom_id,
        "userId": user_id,
        "username": username,
        "message": f"{username} left the classroom.",
        "timestamp": datetime.utcnow(),
        "isSystemMessage": True
    }
    chat_messages_collection.insert_one(chat_message)
    emit('chat_message', chat_message, room=classroom_id)

@socketio.on('chat_message')
def handle_chat_message(data):
    user_id = session.get('user_id')
    username = session.get('username')
    classroom_id = data.get('classroomId')
    message_text = data.get('message')

    if not all([user_id, username, classroom_id, message_text]):
        return

    # Verify user is a participant of the classroom
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": user_id})
    if not classroom:
        return

    chat_message_id = str(uuid.uuid4())
    chat_message = {
        "id": chat_message_id,
        "classroomId": classroom_id,
        "userId": user_id,
        "username": username,
        "message": message_text,
        "timestamp": datetime.utcnow(),
        "isSystemMessage": False
    }
    chat_messages_collection.insert_one(chat_message)
    emit('chat_message', chat_message, room=classroom_id)
    print(f"Chat message from {username} in classroom {classroom_id}: {message_text}")

@socketio.on('whiteboard_draw')
def handle_whiteboard_draw(data):
    user_id = session.get('user_id')
    username = session.get('username')
    classroom_id = data.get('classroomId')
    drawing_data = data.get('drawingData')

    if not all([user_id, classroom_id, drawing_data]):
        return

    # Verify user is a participant of the classroom
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": user_id})
    if not classroom:
        return

    # Store the latest drawing state for the classroom
    whiteboard_collection.update_one(
        {"classroomId": classroom_id},
        {"$set": {
            "classroomId": classroom_id,
            "drawingData": drawing_data,
            "lastUpdatedBy": user_id,
            "lastUpdatedByUsername": username,
            "timestamp": datetime.utcnow()
        }},
        upsert=True
    )
    # Broadcast the drawing data to all other users in the classroom
    emit('whiteboard_draw', data, room=classroom_id, include_self=False)
    print(f"Whiteboard drawing update from {username} in classroom {classroom_id}")

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    user_id = session.get('user_id')
    username = session.get('username')
    target_user_id = data.get('targetUserId')
    classroom_id = data.get('classroomId')
    offer = data.get('offer')

    if not all([user_id, target_user_id, classroom_id, offer]):
        return

    # Verify both users are in the same classroom
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": {"$all": [user_id, target_user_id]}})
    if not classroom:
        return

    # Store the offer persistently for the target user to fetch if they are offline
    signal_id = str(uuid.uuid4())
    webrtc_signals_collection.insert_one({
        "id": signal_id,
        "type": "offer",
        "classroomId": classroom_id,
        "fromUserId": user_id,
        "fromUsername": username,
        "toUserId": target_user_id,
        "signalData": offer,
        "timestamp": datetime.utcnow()
    })

    # Also emit the offer in real-time to the target user
    emit('webrtc_offer', {
        'fromUserId': user_id,
        'fromUsername': username,
        'offer': offer
    }, room=target_user_id)  # Emit to the target user's personal room
    print(f"WebRTC offer from {username} ({user_id}) to {target_user_id} in classroom {classroom_id}")

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    user_id = session.get('user_id')
    username = session.get('username')
    target_user_id = data.get('targetUserId')
    classroom_id = data.get('classroomId')
    answer = data.get('answer')

    if not all([user_id, target_user_id, classroom_id, answer]):
        return

    # Verify both users are in the same classroom
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": {"$all": [user_id, target_user_id]}})
    if not classroom:
        return

    # Store the answer persistently
    signal_id = str(uuid.uuid4())
    webrtc_signals_collection.insert_one({
        "id": signal_id,
        "type": "answer",
        "classroomId": classroom_id,
        "fromUserId": user_id,
        "fromUsername": username,
        "toUserId": target_user_id,
        "signalData": answer,
        "timestamp": datetime.utcnow()
    })

    # Emit the answer in real-time
    emit('webrtc_answer', {
        'fromUserId': user_id,
        'fromUsername': username,
        'answer': answer
    }, room=target_user_id)
    print(f"WebRTC answer from {username} ({user_id}) to {target_user_id} in classroom {classroom_id}")

@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    user_id = session.get('user_id')
    username = session.get('username')
    target_user_id = data.get('targetUserId')
    classroom_id = data.get('classroomId')
    candidate = data.get('candidate')

    if not all([user_id, target_user_id, classroom_id, candidate]):
        return

    # Verify both users are in the same classroom
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": {"$all": [user_id, target_user_id]}})
    if not classroom:
        return

    # Store the ICE candidate persistently
    signal_id = str(uuid.uuid4())
    webrtc_signals_collection.insert_one({
        "id": signal_id,
        "type": "ice_candidate",
        "classroomId": classroom_id,
        "fromUserId": user_id,
        "fromUsername": username,
        "toUserId": target_user_id,
        "signalData": candidate,
        "timestamp": datetime.utcnow()
    })

    # Emit the ICE candidate in real-time
    emit('webrtc_ice_candidate', {
        'fromUserId': user_id,
        'fromUsername': username,
        'candidate': candidate
    }, room=target_user_id)
    print(f"WebRTC ICE candidate from {username} ({user_id}) to {target_user_id} in classroom {classroom_id}")

# New endpoint to fetch pending WebRTC signals for a user upon connection
@app.route('/api/webrtc-signals', methods=['GET'])
def get_pending_webrtc_signals():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Find all signals intended for this user
    signals = list(webrtc_signals_collection.find({"toUserId": user_id}, {"_id": 0}).sort("timestamp", 1))
    # Delete the signals after fetching (to avoid processing them again)
    webrtc_signals_collection.delete_many({"toUserId": user_id})
    print(f"Fetched {len(signals)} pending WebRTC signals for user {user_id}")
    return jsonify(signals), 200

# --- Error Handling ---
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500

# --- Main Entry Point ---
if __name__ == '__main__':
    print("Starting OneClass server...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
