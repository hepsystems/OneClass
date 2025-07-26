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

mongo = PyMongo(app) # Initialize PyMongo after app config

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
    
    # Insert assessment details
    assessments_collection.insert_one({
        "id": assessment_id,
        "classroomId": class_room_id,
        "title": title,
        "description": description,
        "scheduled_at": scheduled_at,
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
            "classroomId": class_room_id,
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
    
    # Check if the assessment is starting now and emit event
    now = datetime.utcnow()
    scheduled_at = assessment['scheduled_at']
    duration_minutes = assessment['duration_minutes']
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
        return jsonify({"error": "Submission not found for this assessment."}), 404

    data = request.json
    updated_answers = data.get('updated_answers') # List of {question_id: "...", is_correct: bool, admin_feedback: "..."}

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
        }, room=submission['student_id']) # Emit to the student's user_id room

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

    if not user_id or user_role != 'admin': # Only admins can create classrooms
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
        "participants": [user_id] # Creator is initially a participant
    })
    # Emit admin action update (this is for general notification, not room-specific yet)
    socketio.emit('admin_action_update', {
        'classroomId': classroom_id, # Use new classroom ID
        'message': f"Admin {username} created a new classroom: '{classroom_name}'."
    })
    print(f"Classroom '{classroom_name}' created by {username}. ID: {classroom_id}")
    return jsonify({"message": "Classroom created successfully", "classroom": {"id": classroom_id, "name": classroom_name}}), 201

@app.route('/api/classrooms', methods=['GET'])
def get_classrooms():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # MODIFIED: Return ALL classrooms for an authenticated user to discover
    all_classrooms = list(classrooms_collection.find({}, {"_id": 0}))
    print(f"Fetched {len(all_classrooms)} classrooms for display.")
    return jsonify(all_classrooms), 200

@app.route('/api/join-classroom', methods=['POST'])
def join_classroom():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    classroom_id = data.get('classroomId')

    if not classroom_id:
        return jsonify({"error": "Classroom ID is required"}), 400

    classroom = classrooms_collection.find_one({"id": classroom_id})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    if user_id not in classroom.get('participants', []):
        classrooms_collection.update_one(
            {"id": classroom_id},
            {"$addToSet": {"participants": user_id}} # Add user to participants if not already there
        )
        # REMOVED: The problematic emit('user_joined') from this HTTP route
        # The 'user_joined' event with 'sid' is correctly handled in the socketio.on('join') event handler.

        # Emit admin action update
        socketio.emit('admin_action_update', {
            'classroomId': classroom_id,
            'message': f"User {session.get('username')} joined classroom '{classroom.get('name')}'."
        }, room=classroom_id)
        print(f"User {session.get('username')} joined classroom {classroom_id}.")
        return jsonify({"message": "Joined classroom successfully", "classroom": {"id": classroom_id, "name": classroom.get('name')}}), 200
    else:
        print(f"User {session.get('username')} already a participant in classroom {classroom_id}.")
        return jsonify({"message": "Already a participant in this classroom", "classroom": {"id": classroom_id, "name": classroom.get('name')}}), 200

@app.route('/api/generate-share-link/<classroomId>', methods=['GET'])
def generate_share_link(classroomId):
    # You might want to verify if the classroomId exists and if the user has access
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    # Construct the base URL for your application
    # It's highly recommended to set APP_BASE_URL as an environment variable in Render.
    # E.g., APP_BASE_URL=https://your-app-name.onrender.com
    base_url = os.environ.get('APP_BASE_URL', request.host_url)
    if base_url.endswith('/'):
        base_url = base_url[:-1] # Remove trailing slash if present

    # Construct the shareable URL for the classroom
    # This URL should lead to your single-page app which then handles routing
    share_link = f"{base_url}/classroom/{classroomId}"
    print(f"Generated share link for classroom {classroomId}: {share_link}")
    return jsonify({"share_link": share_link}), 200

# --- Socket.IO Event Handlers ---

@socketio.on('connect')
def connect():
    user_id = session.get('user_id')
    username = session.get('username')
    if user_id:
        print(f"Client connected: {username} ({user_id}), SID: {request.sid}")
        session['sid'] = request.sid
        # Join a personal room for direct messages (e.g., submission marked notifications)
        join_room(user_id)
        print(f"User {username} ({user_id}) joined personal room: {user_id}")
    else:
        print(f"Unauthenticated client connected, SID: {request.sid}")

@socketio.on('disconnect')
def disconnect(sid): # MODIFIED: Added 'sid' argument
    user_id = session.get('user_id')
    username = session.get('username')
    # sid is now passed as an argument

    print(f"Client disconnected: {username} ({user_id}), SID: {sid}")

    # Find which classroom the user was in to emit user_left and webrtc_peer_disconnected
    classroomId_to_leave = None
    # Iterate through all rooms the sid is in
    # MODIFIED: Used 'rooms(sid)' directly
    for room_id in rooms(sid):
        # Exclude the user's own SID room and the default Flask-SocketIO app room
        # A simple check: assume classroom IDs are UUIDs (or specific prefix)
        if room_id != sid and room_id != request.sid and room_id != user_id: # Also exclude personal user_id room
            # Check if it's a classroom room (assuming UUID format for classroom IDs)
            if len(room_id) == 36 and '-' in room_id: # Rough check for UUID format
                classroomId_to_leave = room_id
                break
    
    if classroomId_to_leave:
        leave_room(classroomId_to_leave)
        emit('user_left', {'username': username, 'sid': sid}, room=classroomId_to_leave, include_sid=False)
        emit('webrtc_peer_disconnected', {'peer_id': sid}, room=classroomId_to_leave, include_sid=False)
        print(f"User {username} ({sid}) left classroom {classroomId_to_leave} due to disconnect.")


@socketio.on('join')
def on_join(data):
    classroomId = data.get('classroomId')
    username = session.get('username')
    user_id = session.get('user_id')
    user_role = data.get('role') or session.get('role')
    sid = request.sid

    if not classroomId or not username or not user_id:
        print("Missing data for join or user not authenticated.")
        return

    join_room(classroomId)
    session['classroomId'] = classroomId # Store for disconnect handling
    print(f"[Socket.IO] User '{username}' ({user_id}) joined room: {classroomId} with SID: {sid}")

    # Broadcast to others in the room that a new user joined.
    emit('user_joined', {
        'username': username,
        'user_id': user_id,
        'sid': sid,
        'role': user_role
    }, room=classroomId, include_sid=False)

    # Send whiteboard history to the joining user
    # Fetch all pages and their drawings
    history_cursor = whiteboard_collection.find(
        {"classroomId": classroomId},
        {"_id": 0, "pageIndex": 1, "drawings": 1}
    ).sort("pageIndex", 1)

    whiteboard_history_pages = {}
    for entry in history_cursor:
        page_index = entry.get('pageIndex', 0)
        drawings = entry.get('drawings', [])
        # Convert datetime objects to ISO format strings for client-side
        for drawing in drawings:
            if 'timestamp' in drawing and isinstance(drawing['timestamp'], datetime):
                drawing['timestamp'] = drawing['timestamp'].isoformat()
        
        if page_index not in whiteboard_history_pages:
            whiteboard_history_pages[page_index] = []
        whiteboard_history_pages[page_index].extend(drawings)
    
    # Convert dict to ordered list of lists
    # Ensure all pages up to the max index are included, even if empty
    max_page_index = max(whiteboard_history_pages.keys()) if whiteboard_history_pages else 0
    ordered_history = [whiteboard_history_pages.get(i, []) for i in range(max_page_index + 1)]
    
    emit('whiteboard_data', {'action': 'history', 'history': ordered_history}, room=sid)
    print(f"Whiteboard history sent to new participant {sid} in classroom {classroomId}")

    # Send chat history to the joining user
    chat_history_from_db = list(chat_messages_collection.find(
        {"classroomId": classroomId},
        {"_id": 0}
    ).sort("timestamp", 1).limit(100)) # Get last 100 messages
    if chat_history_from_db:
        # Convert datetime objects to ISO format strings for client-side
        for msg in chat_history_from_db:
            msg['timestamp'] = msg['timestamp'].isoformat()
        emit('chat_history', chat_history_from_db, room=sid)
        print(f"Chat history sent to new participant {sid} in classroom {classroomId}")


@socketio.on('leave')
def on_leave(data):
    classroomId = data.get('classroomId')
    username = session.get('username')
    sid = request.sid

    if not classroomId or not username:
        return

    leave_room(classroomId)
    print(f"{username} left room: {classroomId}")
    emit('user_left', {'username': username, 'sid': sid}, room=classroomId, include_sid=False)


@socketio.on('message')
def handle_chat_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    username = session.get('username')
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not classroomId or not message or not username or not user_id:
        print("Missing chat message data.")
        return

    # Store message in MongoDB
    chat_message_record = {
        "classroomId": classroomId,
        "user_id": user_id,
        "username": username,
        "role": user_role,
        "message": message,
        "timestamp": datetime.utcnow()
    }
    chat_messages_collection.insert_one(chat_message_record)

    # Emit message to all in the room
    emit('message', {
        'user_id': user_id,
        'username': username,
        'message': message,
        'timestamp': datetime.utcnow().isoformat(),
        'role': user_role
    }, room=classroomId)
    print(f"Chat message from {username} in {classroomId} broadcasted and saved.")


@socketio.on('whiteboard_data')
def handle_whiteboard_data(data):
    classroomId = data.get('classroomId')
    action = data.get('action')
    # Frontend now consistently sends 'data' as the drawing payload
    drawing_data = data.get('data')
    sender_id = request.sid
    user_role = session.get('role')

    if not classroomId or not action or not drawing_data:
        print(f"Whiteboard data missing: {data}")
        return
    
    # Ensure drawing_data is a dictionary for 'draw' action
    if action == 'draw' and not isinstance(drawing_data, dict):
        print(f"Received malformed drawing_data (not a dictionary) for 'draw' action: {drawing_data}")
        return

    # Only allow admins to draw or clear
    if user_role != 'admin':
        print(f"User {sender_id} (role: {user_role}) attempted to modify whiteboard in classroom {classroomId} without admin privileges.")
        return

    # CORRECTED: Get page_index from the top-level 'data' dictionary
    page_index = data.get('pageIndex', 0) 

    if action == 'draw':
        # Get the tool type to differentiate drawing data
        tool_type = drawing_data.get('tool')
        drawing_to_save = {
            "tool": tool_type,
            "color": drawing_data.get('color'),
            # 'size' for text, 'width' for shapes/pen. Prioritize 'width' if both exist or just one
            "width": drawing_data.get('width') or drawing_data.get('size'), 
            "timestamp": datetime.utcnow()
        }

        # Validate and extract specific data based on tool type
        if tool_type == 'pen' or tool_type == 'eraser':
            points = drawing_data.get('points')
            if not points or not isinstance(points, list) or not all(isinstance(p, dict) and 'x' in p and 'y' in p for p in points):
                print(f"Missing or malformed points for pen/eraser tool: {drawing_data}")
                return
            drawing_to_save['points'] = points
        
        elif tool_type == 'line':
            start_x = drawing_data.get('startX')
            start_y = drawing_data.get('startY')
            end_x = drawing_data.get('endX')
            end_y = drawing_data.get('endY')
            if None in [start_x, start_y, end_x, end_y]:
                print(f"Missing coordinates for line tool: {drawing_data}")
                return
            drawing_to_save['startX'] = start_x
            drawing_to_save['startY'] = start_y
            drawing_to_save['endX'] = end_x
            drawing_to_save['endY'] = end_y
        
        elif tool_type == 'rectangle':
            # Store start and end coordinates as sent by frontend for rectangles
            start_x = drawing_data.get('startX')
            start_y = drawing_data.get('startY')
            end_x = drawing_data.get('endX') 
            end_y = drawing_data.get('endY')
            if None in [start_x, start_y, end_x, end_y]:
                print(f"Missing dimensions for rectangle tool: {drawing_data}")
                return
            drawing_to_save['startX'] = start_x
            drawing_to_save['startY'] = start_y
            drawing_to_save['endX'] = end_x
            drawing_to_save['endY'] = end_y

        elif tool_type == 'circle':
            # For circle, frontend sends startX, startY as center, and endX, endY to calculate radius
            # We should store startX, startY, endX, endY as sent by frontend, and recalculate radius on frontend
            # Or, if frontend sends radius, store radius directly.
            # Assuming frontend sends startX, startY, endX, endY to define the circle:
            start_x = drawing_data.get('startX')
            start_y = drawing_data.get('startY')
            end_x = drawing_data.get('endX')
            end_y = drawing_data.get('endY')
            if None in [start_x, start_y, end_x, end_y]:
                print(f"Missing circle properties (startX, startY, endX, endY): {drawing_data}")
                return
            drawing_to_save['startX'] = start_x
            drawing_to_save['startY'] = start_y
            drawing_to_save['endX'] = end_x
            drawing_to_save['endY'] = end_y
            # If the frontend sends 'radius', store it directly
            if 'radius' in drawing_data:
                drawing_to_save['radius'] = drawing_data.get('radius')


        elif tool_type == 'text':
            text_content = drawing_data.get('text')
            start_x = drawing_data.get('startX')
            start_y = drawing_data.get('startY')
            if None in [text_content, start_x, start_y]:
                print(f"Missing text properties: {drawing_data}")
                return
            drawing_to_save['text'] = text_content
            drawing_to_save['startX'] = start_x
            drawing_to_save['startY'] = start_y

        else:
            print(f"Unknown tool type received: {tool_type} in data: {drawing_data}")
            return # Don't save unknown tool types

        # Store the comprehensive drawing action in MongoDB for the specific page
        whiteboard_collection.update_one(
            {"classroomId": classroomId, "pageIndex": page_index},
            {"$push": {"drawings": drawing_to_save}},
            upsert=True # Create the document if it doesn't exist
        )
        # Broadcast the original incoming data to all in the room except the sender
        # The frontend will then know how to render based on 'tool' type
        emit('whiteboard_data', data, room=classroomId, include_sid=False)
        print(f"Whiteboard draw data for tool '{tool_type}' broadcasted and saved for page {page_index} in classroom {classroomId}")

    elif action == 'clear':
        # Ensure page_index is correctly retrieved from top-level 'data' for clear action as well
        if 'pageIndex' in data:
            page_index_to_clear = data.get('pageIndex', 0)
            whiteboard_collection.update_one(
                {"classroomId": classroomId, "pageIndex": page_index_to_clear},
                {"$set": {"drawings": []}} # Set drawings to an empty array
            )
            # Broadcast clear action to all in the room
            emit('whiteboard_data', {'action': 'clear', 'data': {'pageIndex': page_index_to_clear}}, room=classroomId, include_sid=False)
            print(f"Whiteboard page {page_index_to_clear} cleared in classroom {classroomId}")
            # Emit admin action update
            socketio.emit('admin_action_update', {
                'classroomId': classroomId,
                'message': f"Admin {session.get('username')} cleared whiteboard page {page_index_to_clear + 1}."
            }, room=classroomId)
        else:
            print(f"Clear action failed: Missing pageIndex in {data}")
            
@socketio.on('whiteboard_page_change')
def handle_whiteboard_page_change(data):
    classroomId = data.get('classroomId')
    new_page_index = data.get('newPageIndex')
    action_type = data.get('action') # e.g., 'add_page'

    if not classroomId or new_page_index is None:
        print(f"Whiteboard page change missing data: {data}")
        return

    user_role = session.get('role')
    if user_role != 'admin':
        print(f"Non-admin user attempted to change whiteboard page in classroom {classroomId}.")
        return

    # If a new page is explicitly added by the admin, ensure it exists in DB
    if action_type == 'add_page':
        whiteboard_collection.update_one(
            {"classroomId": classroomId, "pageIndex": new_page_index},
            {"$setOnInsert": {"drawings": []}}, # Initialize with empty drawings if new
            upsert=True
        )
        print(f"Whiteboard: New page {new_page_index} ensured in classroom {classroomId}")
        # Emit admin action update
        socketio.emit('admin_action_update', {
            'classroomId': classroomId,
            'message': f"Admin {session.get('username')} added a new whiteboard page."
        }, room=classroomId)


    # Broadcast page change to all other clients in the room
    emit('whiteboard_page_change', {'newPageIndex': new_page_index}, room=classroomId, include_sid=False)
    print(f"Whiteboard: Broadcasted page change to {new_page_index} for classroom {classroomId}")


@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    recipient_id = data.get('recipient_id')
    classroomId = data.get('classroomId')
    offer = data.get('offer')
    sender_id = request.sid

    if not recipient_id or not offer or not classroomId:
        print(f"Missing data for webrtc_offer: {data}")
        return
    
    emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    recipient_id = data.get('recipient_id')
    classroomId = data.get('classroomId')
    answer = data.get('answer')
    sender_id = request.sid

    if not recipient_id or not answer or not classroomId:
        print(f"Missing data for webrtc_answer: {data}")
        return
    
    emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId}")


@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    recipient_id = data.get('recipient_id')
    classroomId = data.get('classroomId')
    candidate = data.get('candidate')
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
        print(f"Admin action update from {session.get('username')} in {classroomId}: {message}")


# --- Main Run Block ---
if __name__ == '__main__':
    print("Server running on http://localhost:5000 (with Socket.IO)")
    socketio.run(app, debug=True, port=5000, host='0.0.0.0')
