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
    questions = data.get('questions') # Retrieve the questions array

    if not all([class_room_id, title, scheduled_at_str, duration_minutes is not None, questions is not None]):
        return jsonify({"error": "Missing required fields: classroomId, title, scheduled_at, duration_minutes, or questions"}), 400
    
    if not isinstance(questions, list) or not questions:
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
    for q_data in questions:
        question_id = str(uuid.uuid4())
        assessment_questions_collection.insert_one({
            "id": question_id,
            "assessmentId": assessment_id,
            "classroomId": class_room_id, # Link to classroom for easier queries
            "question_text": q_data.get('question_text') or q_data.get('text'),
            "question_type": q_data.get('question_type') or q_data.get('type'),
            "options": q_data.get('options'),
            "correct_answer": q_data.get('correct_answer')
        })
        inserted_question_ids.append(question_id)

    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"Admin {session.get('username')} created a new assessment: '{title}' with {len(questions)} questions."
    }, room=class_room_id)

    print(f"Assessment '{title}' created by {username} in classroom {class_room_id} with {len(questions)} questions.")
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
    questions = data.get('questions') # List of question objects

    if not isinstance(questions, list) or not questions:
        return jsonify({"error": "Questions must be a non-empty list"}), 400

    inserted_question_ids = []
    for q_data in questions:
        question_id = str(uuid.uuid4())
        assessment_questions_collection.insert_one({
            "id": question_id,
            "assessmentId": assessmentId,
            "classroomId": assessment['classroomId'], # Link to classroom
            "question_text": q_data.get('question_text') or q_data.get('text'),
            "question_type": q_data.get('question_type') or q_data.get('type'),
            "options": q_data.get('options'),
            "correct_answer": q_data.get('correct_answer')
        })
        inserted_question_ids.append(question_id)

    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': assessment.get('classroomId'),
        'message': f"Admin {session.get('username')} added {len(questions)} questions to assessment '{assessment.get('title')}'."
    }, room=assessment.get('classroomId'))

    print(f"Added {len(questions)} questions to assessment {assessmentId}")
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
    
    # Fetch questions for this specific assessment
    assessment['questions'] = list(assessment_questions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))
    
    # Convert datetime objects to ISO format strings for client-side
    if 'scheduled_at' in assessment and isinstance(assessment['scheduled_at'], datetime):
        assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
    if 'created_at' in assessment and isinstance(assessment['created_at'], datetime):
        assessment['created_at'] = assessment['created_at'].isoformat()

    print(f"Fetched details for assessment {assessmentId} including questions.")
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

    if not all([assessment_id, class_room_id, answers]):
        return jsonify({"error": "Missing required fields: assessmentId, classroomId, or answers"}), 400
    
    if not isinstance(answers, list):
        return jsonify({"error": "Answers must be a list"}), 400

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
                if question.get('question_type') == 'mcq' or question.get('type') == 'mcq':
                    # Use the correct_answer from the DB, not client-provided
                    db_correct_answer = question.get('correct_answer')
                    if db_correct_answer and user_answer and \
                       str(user_answer).strip().lower() == str(db_correct_answer).strip().lower():
                        score += 1
                        is_correct = True
                
                graded_answers.append({
                    "question_id": question_id,
                    "question_text": question.get('question_text') or question.get('text'),
                    "user_answer": user_answer,
                    "correct_answer": question.get('correct_answer'),
                    "is_correct": is_correct if (question.get('question_type') == 'mcq' or question.get('type') == 'mcq') else None # Only for MCQ
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
        "total_questions": total_questions
    })

    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"User {username} submitted an assessment for '{assessments_collection.find_one({'id': assessment_id}).get('title')}'."
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
    if user_role != 'admin':
        query["student_id"] = user_id

    submissions = list(assessment_submissions_collection.find(query, {"_id": 0}).sort("submitted_at", -1))
    print(f"Fetched {len(submissions)} submissions for assessment {assessmentId}")
    return jsonify(submissions), 200

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
        # Notify existing participants that a new user joined via Socket.IO
        # Changed to emit with user_id, which can be used to send whiteboard history to specific user
        # Also include the session ID (request.sid) for WebRTC peer identification
        socketio.emit('user_joined', {
            'username': session.get('username'),
            'user_id': user_id,
            'sid': request.sid, # <<< IMPORTANT for WebRTC peer identification
            'classroomId': classroom_id,
            'role': session.get('role') # Include role of joining user
        }, room=classroom_id, include_sid=False)

        # Emit admin action update
        socketio.emit('admin_action_update', {
            'classroomId': classroom_id,
            'message': f"User {session.get('username')} joined classroom '{classroom.get('name')}'."
        }, room=class_room_id)
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
        if room_id != sid and room_id != request.sid:
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
    drawing_data = data.get('drawing') or data.get('data') # Use drawing_data consistently
    sender_id = request.sid
    user_role = session.get('role')

    if not classroomId or not action or not drawing_data:
        print(f"Whiteboard data missing: {data}")
        return
    
    # ADDED: Check if drawing_data is a dictionary
    if not isinstance(drawing_data, dict):
        print(f"Received malformed drawing_data (not a dictionary): {drawing_data}")
        return

    # Only allow admins to draw or clear
    if user_role != 'admin':
        print(f"User {sender_id} (role: {user_role}) attempted to modify whiteboard in classroom {classroomId} without admin privileges.")
        return

    page_index = drawing_data.get('pageIndex', 0) # Default to page 0

    if action == 'draw':
        # Safely get drawing coordinates and properties using .get()
        prev_x = drawing_data.get('prevX')
        prev_y = drawing_data.get('prevY')
        curr_x = drawing_data.get('currX')
        curr_y = drawing_data.get('currY')
        color = drawing_data.get('color')
        line_thickness = drawing_data.get('width') # Assuming 'width' is the key used for line thickness

        # ADDED: Basic validation for essential drawing data
        if None in [prev_x, prev_y, curr_x, curr_y, color, line_thickness]:
            print(f"Missing essential drawing data for 'draw' action: {drawing_data}")
            return

        # Store drawing action in MongoDB for the specific page
        whiteboard_collection.update_one(
            {"classroomId": classroomId, "pageIndex": page_index},
            {"$push": {"drawings": {
                "prevX": prev_x,
                "prevY": prev_y,
                "currX": curr_x,
                "currY": curr_y,
                "color": color,
                "width": line_thickness,
                "timestamp": datetime.utcnow() # Add timestamp for ordering/history
            }}},
            upsert=True # Create the document if it doesn't exist
        )
        # Broadcast drawing data to all in the room except the sender
        emit('whiteboard_data', data, room=classroomId, include_sid=False)
        print(f"Whiteboard draw data broadcasted and saved for page {page_index} in classroom {classroomId}")

    elif action == 'clear':
        # Clear drawings for a specific page
        whiteboard_collection.update_one(
            {"classroomId": classroomId, "pageIndex": page_index},
            {"$set": {"drawings": []}} # Set drawings to an empty array
        )
        # Broadcast clear action to all in the room
        emit('whiteboard_data', {'action': 'clear', 'data': {'pageIndex': page_index}}, room=classroomId, include_sid=False)
        print(f"Whiteboard page {page_index} cleared in classroom {classroomId}")
        # Emit admin action update
        socketio.emit('admin_action_update', {
            'classroomId': classroomId,
            'message': f"Admin {session.get('username')} cleared whiteboard page {page_index + 1}."
        }, room=classroomId)


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
