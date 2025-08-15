# virtual_classroom_server.py

# --- IMPORTANT: Gevent Monkey Patching MUST be at the very top ---
import gevent.monkey
gevent.monkey.patch_all()

# --- Standard Imports ---
import os
import re
import json
import uuid
import datetime
from flask import Flask, request, jsonify, session, send_from_directory
from flask_socketio import SocketIO, join_room, leave_room, emit, rooms
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from datetime import datetime, timedelta

# --- Configuration and App Setup ---
app = Flask(__name__, static_folder='.')
app.secret_key = os.environ.get("SECRET_KEY", "A_SUPER_SECRET_KEY_THAT_SHOULD_BE_CHANGED_IN_PROD")
app.permanent_session_lifetime = timedelta(days=7)

# Secure CORS configuration:
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5000", "http://localhost:5000"], "supports_credentials": True}})

# Socket.IO setup
socketio = SocketIO(app, cors_allowed_origins=["http://127.0.0.1:5000", "http://localhost:5000"], manage_session=True, async_mode='gevent', logger=True, engineio_logger=True)

# MongoDB client setup
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/virtual_classroom_db")
client = MongoClient(MONGO_URI)
db = client.virtual_classroom_db

# Collections
users_collection = db.users
classrooms_collection = db.classrooms
chat_messages_collection = db.chat_messages
whiteboard_collection = db.whiteboard_drawings_pages
library_files_collection = db.library_files
assessments_collection = db.assessments
assessment_questions_collection = db.assessment_questions
assessment_submissions_collection = db.assessment_submissions

# File Uploads Directory
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


# --- Helper Functions ---
def is_authenticated():
    return 'user_id' in session

def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    # Assuming 'id' is a string UUID in the DB, not ObjectId
    user = users_collection.find_one({"id": user_id})
    if user:
        # Don't return the hashed password
        user.pop('password', None)
        user.pop('_id', None)
    return user

def is_classroom_participant(classroomId, userId):
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return False
    return userId in classroom.get('participants', [])

# --- API Routes ---

# Serves static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/classroom/<classroomId>')
def serve_classroom_page(classroomId):
    return send_from_directory('.', 'index.html')

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/register', methods=['POST'])
def register():
    """Handles new user registration with robust input validation."""
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return jsonify({"error": "Missing username, email, or password"}), 400

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Invalid email format"}), 400
    
    if len(password) < 8 or not re.search(r"[a-z]", password) or not re.search(r"[A-Z]", password) or not re.search(r"\d", password):
        return jsonify({"error": "Password must be at least 8 characters and contain uppercase, lowercase, and numbers"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 409
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 409

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": "user",
        "created_at": datetime.utcnow()
    }
    # First user to register is an admin
    if users_collection.count_documents({}) == 0:
        user_data['role'] = 'admin'

    users_collection.insert_one(user_data)
    user_data.pop('password', None)
    user_data.pop('_id', None)
    return jsonify({"message": "User registered successfully!", "user": user_data}), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Handles user login."""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email})
    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        session.permanent = True
        user.pop('password', None)
        user.pop('_id', None)
        return jsonify({"message": "Login successful", "user": user}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logs the user out."""
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None)
    return jsonify({"message": "Logged out"}), 200

@app.route('/api/@me', methods=['GET'])
def get_me():
    """Returns the current user's session data."""
    user = get_current_user()
    if user:
        return jsonify(user), 200
    return jsonify({"error": "Unauthorized"}), 401

@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    new_username = data.get('username')

    if not new_username:
        return jsonify({"error": "New username is missing"}), 400

    result = users_collection.update_one(
        {"id": user['id']},
        {"$set": {"username": new_username, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404
    session['username'] = new_username
    return jsonify({"message": "Profile updated successfully"}), 200

@app.route('/api/create-classroom', methods=['POST'])
def create_classroom():
    """Admin-only: Creates a new classroom."""
    user = get_current_user()
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Permission denied"}), 403

    data = request.json
    name = data.get('name')
    if not name:
        return jsonify({"error": "Classroom name is required"}), 400

    new_classroom_id = str(uuid.uuid4())
    classrooms_collection.insert_one({
        "id": new_classroom_id,
        "name": name,
        "creator_id": user['id'],
        "creator_username": user['username'],
        "participants": [user['id']],
        "created_at": datetime.utcnow()
    })
    socketio.emit('admin_action_update', {'classroomId': new_classroom_id, 'message': f"Admin {user['username']} created a new classroom: '{name}'."}, room=new_classroom_id)
    return jsonify({"message": f"Classroom '{name}' created successfully", "id": new_classroom_id}), 201

@app.route('/api/classrooms')
def get_classrooms():
    """Returns a list of all classrooms."""
    if not is_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
    
    classrooms = classrooms_collection.find({}, {"_id": 0})
    return jsonify(list(classrooms)), 200

@app.route('/api/join-classroom', methods=['POST'])
def join_classroom():
    """Allows a user to join an existing classroom."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    classroomId = data.get('classroomId')
    if not classroomId:
        return jsonify({"error": "Classroom ID is required"}), 400

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    if user['id'] in classroom.get('participants', []):
        return jsonify({"message": "Already a participant", "classroom": {"id": classroomId, "name": classroom['name']}}), 200

    classrooms_collection.update_one(
        {"id": classroomId},
        {"$addToSet": {"participants": user['id']}}
    )
    socketio.emit('admin_action_update', {'classroomId': classroomId, 'message': f"User {user['username']} joined classroom '{classroom['name']}'."}, room=classroomId)
    return jsonify({"message": "Successfully joined classroom", "classroom": {"id": classroomId, "name": classroom['name']}}), 200

@app.route('/api/generate-share-link/<classroomId>', methods=['GET'])
def generate_share_link(classroomId):
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404
    base_url = os.environ.get('APP_BASE_URL', request.host_url)
    if base_url.endswith('/'):
        base_url = base_url[:-1]
    share_link = f"{base_url}/classroom/{classroomId}"
    return jsonify({"share_link": share_link}), 200

@app.route('/api/library-files/<classroomId>')
def get_library_files(classroomId):
    user = get_current_user()
    if not user or not is_classroom_participant(classroomId, user['id']):
        return jsonify({"error": "Unauthorized or not a participant"}), 401
    
    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0}))
    return jsonify(files), 200

@app.route('/api/upload-library-files', methods=['POST'])
def upload_library_files():
    """Admin-only: Uploads files to the classroom library."""
    user = get_current_user()
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Permission denied"}), 403

    classroomId = request.form.get('classroomId')
    if not classroomId:
        return jsonify({"error": "Classroom ID is missing"}), 400
    
    if 'files' not in request.files:
        return jsonify({"error": "No files part"}), 400
    
    files = request.files.getlist('files')
    if not files:
        return jsonify({"error": "No files selected"}), 400
    
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    uploaded_file_info = []
    for file in files:
        if file.filename == '':
            continue
        filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        file_id = str(uuid.uuid4())
        library_files_collection.insert_one({
            "id": file_id,
            "classroomId": classroomId,
            "original_filename": file.filename,
            "stored_filename": filename,
            "url": f"/uploads/{filename}",
            "uploaded_at": datetime.utcnow(),
            "uploaded_by": user['id']
        })
        uploaded_file_info.append({"id": file_id, "filename": file.filename, "url": f"/uploads/{filename}"})
    
    socketio.emit('admin_action_update', {'classroomId': classroomId, 'message': f"Admin {user['username']} uploaded new file(s) to the library."}, room=classroomId)
    return jsonify({"message": "Files uploaded successfully", "files": uploaded_file_info}), 201

@app.route('/api/library-files/<fileId>', methods=['DELETE'])
def delete_library_file(fileId):
    user = get_current_user()
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Forbidden: Only administrators can delete files."}), 403

    file_data = library_files_collection.find_one({"id": fileId})
    if not file_data:
        return jsonify({"error": "File not found"}), 404

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file_data['stored_filename'])
    if os.path.exists(filepath):
        os.remove(filepath)
    
    result = library_files_collection.delete_one({"id": fileId})
    if result.deleted_count > 0:
        socketio.emit('admin_action_update', {'classroomId': file_data.get('classroomId'), 'message': f"Admin {user['username']} deleted file '{file_data.get('original_filename')}' from the library."}, room=file_data.get('classroomId'))
        return jsonify({"message": "File deleted successfully"}), 200
    return jsonify({"error": "File not found"}), 404

# --- Assessments API Routes (from server.py) ---

@app.route('/api/assessments', methods=['POST'])
def create_assessment():
    user = get_current_user()
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can create assessments."}), 401
    data = request.json
    class_room_id = data.get('classroomId')
    title = data.get('title')
    description = data.get('description')
    scheduled_at_str = data.get('scheduled_at')
    duration_minutes = data.get('duration_minutes')
    questions_data = data.get('questions')
    if not all([class_room_id, title, scheduled_at_str, duration_minutes is not None, questions_data is not None]):
        return jsonify({"error": "Missing required fields"}), 400
    if not isinstance(questions_data, list) or not questions_data:
        return jsonify({"error": "Questions must be a non-empty list"}), 400
    try:
        scheduled_at = datetime.fromisoformat(scheduled_at_str)
    except ValueError:
        return jsonify({"error": "Invalid scheduled_at format. Expected YYYY-MM-DDTHH:MM"}), 400
    if not isinstance(duration_minutes, int) or duration_minutes <= 0:
        return jsonify({"error": "Duration must be a positive integer"}), 400

    assessment_id = str(uuid.uuid4())
    assessments_collection.insert_one({
        "id": assessment_id, "classroomId": class_room_id, "title": title, "description": description,
        "scheduled_at": scheduled_at, "duration_minutes": duration_minutes, "creator_id": user['id'],
        "creator_username": user['username'], "creator_role": user['role'], "created_at": datetime.utcnow()
    })
    for q_data in questions_data:
        question_id = str(uuid.uuid4())
        question_doc = {"id": question_id, "assessmentId": assessment_id, "classroomId": class_room_id, "question_text": q_data.get('question_text'), "question_type": q_data.get('question_type'), "options": q_data.get('options'), "correct_answer": q_data.get('correct_answer')}
        assessment_questions_collection.insert_one({k: v for k, v in question_doc.items() if v is not None})
    socketio.emit('admin_action_update', {'classroomId': class_room_id, 'message': f"Admin {user['username']} created a new assessment: '{title}' with {len(questions_data)} questions."}, room=class_room_id)
    return jsonify({"message": "Assessment created successfully", "id": assessment_id}), 201

@app.route('/api/assessments/<assessmentId>/questions', methods=['POST'])
def add_questions_to_assessment(assessmentId):
    user = get_current_user()
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can add questions."}), 401
    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404
    data = request.json
    questions_data = data.get('questions')
    if not isinstance(questions_data, list) or not questions_data:
        return jsonify({"error": "Questions must be a non-empty list"}), 400
    for q_data in questions_data:
        question_id = str(uuid.uuid4())
        question_doc = {"id": question_id, "assessmentId": assessmentId, "classroomId": assessment['classroomId'], "question_text": q_data.get('question_text'), "question_type": q_data.get('question_type'), "options": q_data.get('options'), "correct_answer": q_data.get('correct_answer')}
        assessment_questions_collection.insert_one({k: v for k, v in question_doc.items() if v is not None})
    socketio.emit('admin_action_update', {'classroomId': assessment.get('classroomId'), 'message': f"Admin {user['username']} added {len(questions_data)} questions to assessment '{assessment.get('title')}'."}, room=assessment.get('classroomId'))
    return jsonify({"message": "Questions added successfully"}), 201

@app.route('/api/assessments/<classroomId>', methods=['GET'])
def get_assessments(classroomId):
    if not is_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"_id": 0}))
    for assessment in assessments:
        if 'scheduled_at' in assessment and isinstance(assessment['scheduled_at'], datetime):
            assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
        if 'created_at' in assessment and isinstance(assessment['created_at'], datetime):
            assessment['created_at'] = assessment['created_at'].isoformat()
    return jsonify(assessments), 200

@app.route('/api/assessments/<assessmentId>', methods=['GET'])
def get_assessment_details(assessmentId):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    assessment = assessments_collection.find_one({"id": assessmentId}, {"_id": 0})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404
    now = datetime.utcnow()
    scheduled_at = assessment.get('scheduled_at')
    duration_minutes = assessment.get('duration_minutes')
    if isinstance(scheduled_at, datetime) and isinstance(duration_minutes, (int, float)) and duration_minutes > 0:
        end_time = scheduled_at + timedelta(minutes=duration_minutes)
        if scheduled_at <= now < end_time and not assessment_submissions_collection.find_one({"assessmentId": assessmentId, "student_id": user['id']}):
            socketio.emit('assessment_started', {'classroomId': assessment['classroomId'], 'assessmentId': assessmentId, 'title': assessment['title'], 'endTime': end_time.isoformat()}, room=request.sid)
    assessment['questions'] = list(assessment_questions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))
    if 'scheduled_at' in assessment and isinstance(assessment['scheduled_at'], datetime):
        assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
    if 'created_at' in assessment and isinstance(assessment['created_at'], datetime):
        assessment['created_at'] = assessment['created_at'].isoformat()
    return jsonify(assessment), 200

@app.route('/api/assessments/<assessmentId>/submit', methods=['POST'])
def submit_assessment():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    assessment_id = data.get('assessmentId')
    answers = data.get('answers')
    is_auto_submit = data.get('is_auto_submit', False)
    if not all([assessment_id, answers]):
        return jsonify({"error": "Missing required fields"}), 400
    if not isinstance(answers, list):
        return jsonify({"error": "Answers must be a list"}), 400
    assessment_details = assessments_collection.find_one({"id": assessment_id})
    if not assessment_details:
        return jsonify({"error": "Assessment not found"}), 404
    now = datetime.utcnow()
    end_time = assessment_details['scheduled_at'] + timedelta(minutes=assessment_details['duration_minutes'])
    if not is_auto_submit and now > end_time:
        return jsonify({"error": "Assessment submission time has passed."}), 403
    if assessment_submissions_collection.find_one({"assessmentId": assessment_id, "student_id": user['id']}):
        return jsonify({"error": "You have already submitted this assessment."}), 409
    
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
                if question.get('question_type') == 'mcq':
                    db_correct_answer = question.get('correct_answer')
                    if db_correct_answer and user_answer is not None and str(user_answer).strip().lower() == str(db_correct_answer).strip().lower():
                        score += 1
                        is_correct = True
                graded_answers.append({"question_id": question_id, "question_text": question.get('question_text'), "user_answer": user_answer, "correct_answer": question.get('correct_answer'), "is_correct": is_correct if question.get('question_type') == 'mcq' else None})
    
    submission_id = str(uuid.uuid4())
    assessment_submissions_collection.insert_one({
        "id": submission_id, "assessmentId": assessment_id, "classroomId": assessment_details['classroomId'],
        "student_id": user['id'], "student_username": user['username'], "student_role": user['role'],
        "submitted_at": datetime.utcnow(), "answers": graded_answers, "score": score,
        "total_questions": total_questions, "is_auto_submit": is_auto_submit
    })
    socketio.emit('admin_action_update', {'classroomId': assessment_details['classroomId'], 'message': f"User {user['username']} submitted an assessment for '{assessment_details['title']}'."}, room=assessment_details['classroomId'])
    return jsonify({"message": "Assessment submitted successfully", "submission_id": submission_id, "score": score, "total_questions": total_questions}), 201

@app.route('/api/assessments/<assessmentId>/submissions', methods=['GET'])
def get_assessment_submissions(assessmentId):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    query = {"assessmentId": assessmentId}
    if user['role'] != 'admin':
        query["student_id"] = user['id']
    submissions = list(assessment_submissions_collection.find(query, {"_id": 0}).sort("submitted_at", -1))
    return jsonify(submissions), 200

@app.route('/api/submissions/<submissionId>', methods=['GET'])
def get_single_submission(submissionId):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    submission = assessment_submissions_collection.find_one({"id": submissionId}, {"_id": 0})
    if not submission:
        return jsonify({"error": "Submission not found"}), 404
    assessment = assessments_collection.find_one({"id": submission['assessmentId']})
    if not assessment:
        return jsonify({"error": "Associated assessment not found"}), 404
    if user['role'] == 'admin' and assessment['creator_id'] == user['id']:
        return jsonify(submission), 200
    elif user['role'] == 'user' and submission['student_id'] == user['id']:
        return jsonify(submission), 200
    else:
        return jsonify({"error": "Forbidden: You do not have permission to view this submission."}), 403

@app.route('/api/assessments/<assessmentId>/mark-submission/<submissionId>', methods=['POST'])
def mark_submission(assessmentId, submissionId):
    user = get_current_user()
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can mark submissions."}), 401
    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment or assessment['creator_id'] != user['id']:
        return jsonify({"error": "Forbidden: You are not the creator of this assessment."}), 403
    submission = assessment_submissions_collection.find_one({"id": submissionId, "assessmentId": assessmentId})
    if not submission:
        return jsonify({"error": "Submission not found for this assessment."}), 404
    data = request.json
    updated_answers = data.get('updated_answers')
    if not isinstance(updated_answers, list):
        return jsonify({"error": "updated_answers must be a list"}), 400
    existing_answers_map = {ans['question_id']: ans for ans in submission['answers']}
    new_score = 0
    updated_answers_list = []
    for updated_ans_data in updated_answers:
        q_id = updated_ans_data.get('question_id')
        is_correct = updated_ans_data.get('is_correct')
        admin_feedback = updated_ans_data.get('admin_feedback')
        if q_id and q_id in existing_answers_map:
            original_answer = existing_answers_map[q_id]
            original_answer['is_correct'] = is_correct
            original_answer['admin_feedback'] = admin_feedback
            if is_correct:
                new_score += 1
            updated_answers_list.append(original_answer)
    result = assessment_submissions_collection.update_one(
        {"id": submissionId},
        {"$set": {"answers": updated_answers_list, "score": new_score, "marked_by": user['id'], "marked_at": datetime.utcnow()}}
    )
    if result.modified_count > 0:
        socketio.emit('submission_marked', {'assessmentId': assessmentId, 'assessmentTitle': assessment['title'], 'submissionId': submissionId, 'studentId': submission['student_id'], 'score': new_score, 'total_questions': submission['total_questions']}, room=submission['student_id'])
        socketio.emit('admin_action_update', {'classroomId': assessment.get('classroomId'), 'message': f"Admin {user['username']} marked a submission for '{assessment.get('title')}'."}, room=assessment.get('classroomId'))
        return jsonify({"message": "Submission marked successfully", "new_score": new_score}), 200
    return jsonify({"message": "No changes made to submission"}), 200

@app.route('/api/assessments/<assessmentId>', methods=['DELETE'])
def delete_assessment(assessmentId):
    user = get_current_user()
    if not user or user['role'] != 'admin':
        return jsonify({"error": "Unauthorized: Only admins can delete assessments"}), 403
    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404
    assessment_questions_collection.delete_many({"assessmentId": assessmentId})
    assessment_submissions_collection.delete_many({"assessmentId": assessmentId})
    result = assessments_collection.delete_one({"id": assessmentId})
    if result.deleted_count > 0:
        socketio.emit('admin_action_update', {'classroomId': assessment.get('classroomId'), 'message': f"Admin {user['username']} deleted assessment '{assessment.get('title')}'."}, room=assessment.get('classroomId'))
        return jsonify({"message": "Assessment and its related data deleted successfully"}), 200
    return jsonify({"error": "Assessment not found"}), 404


# --- Socket.IO Events ---

@socketio.on('connect')
def connect():
    user = get_current_user()
    if user:
        session['sid'] = request.sid
        join_room(user['id'])
    print(f"Client connected: {user['username'] if user else 'Unauthenticated'}, SID: {request.sid}")

@socketio.on('disconnect')
def disconnect():
    user = get_current_user()
    sid = request.sid
    if user:
        # Check all rooms the SID is in and find the classroom
        classroomId_to_leave = None
        for room_id in rooms(sid=sid):
            if room_id != sid and room_id != user['id']:
                classroomId_to_leave = room_id
                break
        if classroomId_to_leave:
            leave_room(classroomId_to_leave)
            emit('user_left', {'username': user['username'], 'sid': sid}, room=classroomId_to_leave, include_sid=False)
            emit('webrtc_peer_disconnected', {'peer_id': sid}, room=classroomId_to_leave, include_sid=False)
    print(f"Client disconnected: {user['username'] if user else 'Unauthenticated'}, SID: {sid}")

@socketio.on('join')
def on_join(data):
    classroomId = data.get('classroomId')
    user = get_current_user()
    if not user or not classroomId:
        return
    if not is_classroom_participant(classroomId, user['id']):
        emit('error', {'message': 'Unauthorized to join this classroom'})
        return
    
    join_room(classroomId)
    session['classroomId'] = classroomId
    emit('user_joined', {'username': user['username'], 'user_id': user['id'], 'sid': request.sid, 'role': user['role']}, room=classroomId, include_sid=False)

    chat_history_from_db = list(chat_messages_collection.find({"classroomId": classroomId}, {"_id": 0}).sort("timestamp", 1).limit(100))
    for msg in chat_history_from_db:
        if 'timestamp' in msg and isinstance(msg['timestamp'], datetime):
            msg['timestamp'] = msg['timestamp'].isoformat()
    emit('chat_history', chat_history_from_db, room=request.sid)

    history_cursor = whiteboard_collection.find({"classroomId": classroomId}, {"_id": 0, "pageIndex": 1, "drawings": 1}).sort("pageIndex", 1)
    whiteboard_history_pages = {}
    for entry in history_cursor:
        page_index = entry.get('pageIndex', 0)
        drawings = entry.get('drawings', [])
        for drawing in drawings:
            if 'timestamp' in drawing and isinstance(drawing['timestamp'], datetime):
                drawing['timestamp'] = drawing['timestamp'].isoformat()
        if page_index not in whiteboard_history_pages:
            whiteboard_history_pages[page_index] = []
        whiteboard_history_pages[page_index].extend(drawings)
    max_page_index = max(whiteboard_history_pages.keys()) if whiteboard_history_pages else 0
    ordered_history = [whiteboard_history_pages.get(i, []) for i in range(max_page_index + 1)]
    emit('whiteboard_data', {'action': 'history', 'history': ordered_history}, room=request.sid)

@socketio.on('leave')
def on_leave(data):
    classroomId = data.get('classroomId')
    user = get_current_user()
    if not user or not classroomId:
        return
    if classroomId in rooms(sid=request.sid):
        leave_room(classroomId)
        emit('user_left', {'username': user['username'], 'sid': request.sid}, room=classroomId, include_sid=False)

@socketio.on('message')
def handle_chat_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    user = get_current_user()
    if not all([classroomId, message]) or not user:
        return
    if not is_classroom_participant(classroomId, user['id']):
        return
    
    chat_message_record = {"classroomId": classroomId, "user_id": user['id'], "username": user['username'], "role": user['role'], "message": message, "timestamp": datetime.utcnow()}
    chat_messages_collection.insert_one(chat_message_record)
    emit('message', {'user_id': user['id'], 'username': user['username'], 'message': message, 'timestamp': chat_message_record['timestamp'].isoformat(), 'role': user['role']}, room=classroomId)

@socketio.on('whiteboard_data')
def handle_whiteboard_data(data):
    classroomId = data.get('classroomId')
    action = data.get('action')
    drawing_data = data.get('data')
    user = get_current_user()
    
    if not user or user['role'] != 'admin':
        return
    if not classroomId or not action:
        return

    page_index = data.get('pageIndex', 0)
    
    if action == 'draw':
        drawing_to_save = {"tool": drawing_data.get('tool'), "color": drawing_data.get('color'), "width": drawing_data.get('width') or drawing_data.get('size'), "timestamp": datetime.utcnow()}
        if drawing_data.get('tool') in ['pen', 'eraser']:
            drawing_to_save['points'] = drawing_data.get('points')
        elif drawing_data.get('tool') == 'line':
            drawing_to_save.update({"startX": drawing_data.get('startX'), "startY": drawing_data.get('startY'), "endX": drawing_data.get('endX'), "endY": drawing_data.get('endY')})
        elif drawing_data.get('tool') == 'rectangle':
            drawing_to_save.update({"startX": drawing_data.get('startX'), "startY": drawing_data.get('startY'), "endX": drawing_data.get('endX'), "endY": drawing_data.get('endY')})
        elif drawing_data.get('tool') == 'circle':
            drawing_to_save.update({"startX": drawing_data.get('startX'), "startY": drawing_data.get('startY'), "endX": drawing_data.get('endX'), "endY": drawing_data.get('endY'), "radius": drawing_data.get('radius')})
        elif drawing_data.get('tool') == 'text':
            drawing_to_save.update({"text": drawing_data.get('text'), "startX": drawing_data.get('startX'), "startY": drawing_data.get('startY')})
        
        whiteboard_collection.update_one({"classroomId": classroomId, "pageIndex": page_index}, {"$push": {"drawings": drawing_to_save}}, upsert=True)
        emit('whiteboard_data', data, room=classroomId, skip_sid=request.sid)

    elif action == 'clear':
        whiteboard_collection.update_one({"classroomId": classroomId, "pageIndex": page_index}, {"$set": {"drawings": []}})
        emit('whiteboard_data', {'action': 'clear', 'data': {'pageIndex': page_index}}, room=classroomId, skip_sid=request.sid)
        socketio.emit('admin_action_update', {'classroomId': classroomId, 'message': f"Admin {user['username']} cleared whiteboard page {page_index + 1}."}, room=classroomId)

@socketio.on('whiteboard_page_change')
def handle_whiteboard_page_change(data):
    classroomId = data.get('classroomId')
    new_page_index = data.get('newPageIndex')
    user = get_current_user()

    if not user or user['role'] != 'admin':
        return
    if not classroomId or new_page_index is None:
        return
    
    if data.get('action') == 'add_page':
        whiteboard_collection.update_one({"classroomId": classroomId, "pageIndex": new_page_index}, {"$setOnInsert": {"drawings": []}}, upsert=True)
        socketio.emit('admin_action_update', {'classroomId': classroomId, 'message': f"Admin {user['username']} added a new whiteboard page."}, room=classroomId)

    emit('whiteboard_page_change', {'newPageIndex': new_page_index}, room=classroomId, skip_sid=request.sid)

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    recipient_id = data.get('recipient_id')
    classroomId = data.get('classroomId')
    user = get_current_user()
    if not user or not is_classroom_participant(classroomId, user['id']):
        return
    data['sender_id'] = request.sid
    socketio.emit('webrtc_offer', data, room=recipient_id)

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    recipient_id = data.get('recipient_id')
    classroomId = data.get('classroomId')
    user = get_current_user()
    if not user or not is_classroom_participant(classroomId, user['id']):
        return
    data['sender_id'] = request.sid
    socketio.emit('webrtc_answer', data, room=recipient_id)

@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    recipient_id = data.get('recipient_id')
    classroomId = data.get('classroomId')
    user = get_current_user()
    if not user or not is_classroom_participant(classroomId, user['id']):
        return
    data['sender_id'] = request.sid
    socketio.emit('webrtc_ice_candidate', data, room=recipient_id)

@socketio.on('webrtc_peer_disconnected')
def handle_webrtc_peer_disconnected(data):
    classroomId = data.get('classroomId')
    user = get_current_user()
    if not user or not is_classroom_participant(classroomId, user['id']):
        return
    emit('webrtc_peer_disconnected', {'peer_id': request.sid}, room=classroomId, skip_sid=request.sid)

@socketio.on('admin_action_update')
def handle_admin_action_update(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    if classroomId and message:
        emit('admin_action_update', {'message': message}, room=classroomId, include_sid=False)

# --- Main Run Block ---
if __name__ == '__main__':
    users_collection.create_index("username", unique=True)
    users_collection.create_index("email", unique=True)
    classrooms_collection.create_index("id", unique=True)
    classrooms_collection.create_index("creator_id")
    classrooms_collection.create_index("participants")
    chat_messages_collection.create_index("classroomId")
    whiteboard_collection.create_index([("classroomId", 1), ("pageIndex", 1)], unique=True)
    library_files_collection.create_index("classroomId")
    library_files_collection.create_index("id", unique=True)
    assessments_collection.create_index("id", unique=True)
    assessment_questions_collection.create_index([("assessmentId", 1), ("id", 1)], unique=True)
    assessment_submissions_collection.create_index([("assessmentId", 1), ("student_id", 1)], unique=True)
    
    print("Server running on http://localhost:5000 (with Socket.IO)")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
