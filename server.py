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
webrtc_users = {} # Store user IDs and their corresponding SIDs for WebRTC signaling

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

# NEW: Endpoint to get a list of all classrooms
@app.route('/api/classrooms', methods=['GET'])
def get_classrooms():
    if not session.get('user_id'):
        return jsonify({"error": "Unauthorized"}), 401
    
    classrooms = list(classrooms_collection.find({}, {"_id": 0}))
    return jsonify(classrooms), 200

# NEW: Endpoint to create a classroom
@app.route('/api/create-classroom', methods=['POST'])
def create_classroom():
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can create classrooms."}), 401

    data = request.json
    name = data.get('name')
    if not name:
        return jsonify({"error": "Missing classroom name"}), 400

    class_id = str(uuid.uuid4())
    classrooms_collection.insert_one({
        "id": class_id,
        "name": name,
        "created_by": user_id,
        "created_at": datetime.utcnow()
    })
    print(f"Admin {session.get('username')} created a new classroom: {name}")
    return jsonify({"message": "Classroom created successfully", "id": class_id, "name": name}), 201


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

    return jsonify(assessment), 200

@app.route('/api/assessments/<assessmentId>/submit', methods=['POST'])
def submit_assessment(assessmentId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    # Check if the assessment is still active based on scheduled time and duration
    now = datetime.utcnow()
    scheduled_at = assessment.get('scheduled_at')
    duration_minutes = assessment.get('duration_minutes')

    if not isinstance(scheduled_at, datetime) or not isinstance(duration_minutes, (int, float)):
        return jsonify({"error": "Invalid assessment scheduling data"}), 500

    end_time = scheduled_at + timedelta(minutes=duration_minutes)
    if now > end_time:
        return jsonify({"error": "Assessment submission time has passed."}), 403

    submission_data = request.json
    submitted_answers = submission_data.get('answers')
    
    # Check for existing submission from this user
    existing_submission = assessment_submissions_collection.find_one({
        "assessmentId": assessmentId,
        "student_id": user_id
    })
    
    if existing_submission:
        return jsonify({"error": "You have already submitted this assessment."}), 409

    # Save submission
    submission_id = str(uuid.uuid4())
    assessment_submissions_collection.insert_one({
        "id": submission_id,
        "assessmentId": assessmentId,
        "classroomId": assessment['classroomId'],
        "student_id": user_id,
        "student_username": session.get('username'),
        "submitted_at": datetime.utcnow(),
        "answers": submitted_answers
    })

    # You could add grading logic here if needed
    # Emit an event to the admin and perhaps the user
    socketio.emit('assessment_submitted', {
        'assessmentId': assessmentId,
        'studentId': user_id,
        'studentUsername': session.get('username')
    }, room=assessment['classroomId'])

    print(f"Assessment {assessmentId} submitted by user {user_id}")
    return jsonify({"message": "Assessment submitted successfully"}), 201


@app.route('/api/assessments/<assessmentId>/submissions', methods=['GET'])
def get_assessment_submissions(assessmentId):
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can view submissions."}), 401
    
    submissions = list(assessment_submissions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))
    
    # Convert datetime objects to ISO format strings
    for submission in submissions:
        if 'submitted_at' in submission and isinstance(submission['submitted_at'], datetime):
            submission['submitted_at'] = submission['submitted_at'].isoformat()
    
    return jsonify(submissions), 200

@app.route('/api/whiteboard/<classroomId>', methods=['POST'])
def save_whiteboard_drawing(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    drawing_data = data.get('drawing_data')
    page_number = data.get('page_number')

    if drawing_data is None or page_number is None:
        return jsonify({"error": "Missing drawing data or page number"}), 400

    whiteboard_collection.update_one(
        {"classroomId": classroomId, "page_number": page_number},
        {"$set": {"drawing_data": drawing_data, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    
    return jsonify({"message": "Drawing saved successfully"}), 200

@app.route('/api/whiteboard/<classroomId>/<pageNumber>', methods=['GET'])
def get_whiteboard_drawing(classroomId, pageNumber):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Convert pageNumber to integer
    try:
        pageNumber = int(pageNumber)
    except ValueError:
        return jsonify({"error": "Invalid page number"}), 400

    drawing_doc = whiteboard_collection.find_one(
        {"classroomId": classroomId, "page_number": pageNumber}, 
        {"_id": 0, "drawing_data": 1}
    )
    
    drawing_data = drawing_doc.get('drawing_data') if drawing_doc else None
    
    return jsonify({"drawing_data": drawing_data}), 200


# --- Socket.IO Event Handlers ---

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    user_id = session.get('user_id')
    classroom_id = None
    if user_id in webrtc_users and webrtc_users[user_id]['sid'] == request.sid:
        classroom_id = webrtc_users[user_id]['classroom_id']
        del webrtc_users[user_id]
        print(f"User {user_id} disconnected from WebRTC and classroom {classroom_id}")
    else:
        # Find the user's classroom based on their SID
        for uid, data in webrtc_users.items():
            if data['sid'] == request.sid:
                classroom_id = data['classroom_id']
                del webrtc_users[uid]
                print(f"User {uid} disconnected from classroom {classroom_id}")
                break
    
    if classroom_id:
        # Emit 'user_left' event to the classroom
        emit('user_left', {'user_id': user_id}, room=classroom_id, include_sid=False)
        print(f"Emitted 'user_left' for {user_id} in classroom {classroom_id}")

    print(f"Client disconnected: {request.sid}")


@socketio.on('join_classroom')
def handle_join_classroom(data):
    user_id = session.get('user_id')
    username = session.get('username')
    classroomId = data.get('classroomId')

    if not all([user_id, username, classroomId]):
        print("Missing data for join_classroom event.")
        return

    join_room(classroomId)
    webrtc_users[user_id] = {'sid': request.sid, 'classroom_id': classroomId}

    # Get a list of all participants in the room
    all_users = [uid for uid, info in webrtc_users.items() if info['classroom_id'] == classroomId]
    
    # Emit a notification to the room that a new user has joined
    emit('user_joined', {'userId': user_id, 'username': username, 'currentUsers': all_users}, room=classroomId, include_sid=False)

    print(f"User {username} ({user_id}) joined classroom {classroomId}")

@socketio.on('leave_classroom')
def handle_leave_classroom(data):
    user_id = session.get('user_id')
    username = session.get('username')
    classroomId = data.get('classroomId')

    if not all([user_id, username, classroomId]):
        print("Missing data for leave_classroom event.")
        return

    leave_room(classroomId)
    if user_id in webrtc_users:
        del webrtc_users[user_id]

    emit('user_left', {'userId': user_id, 'username': username}, room=classroomId, include_sid=False)
    print(f"User {username} ({user_id}) left classroom {classroomId}")


@socketio.on('chat_message')
def handle_chat_message(data):
    user_id = session.get('user_id')
    username = session.get('username')
    classroomId = data.get('classroomId')
    message = data.get('message')

    if not all([user_id, username, classroomId, message]):
        print("Missing data for chat_message event.")
        return

    # Store the message in the database
    chat_messages_collection.insert_one({
        "classroomId": classroomId,
        "userId": user_id,
        "username": username,
        "message": message,
        "timestamp": datetime.utcnow()
    })

    # Broadcast the message to all clients in the classroom
    emit('new_chat_message', {
        'userId': user_id,
        'username': username,
        'message': message
    }, room=classroomId)


@socketio.on('whiteboard_drawing')
def handle_whiteboard_drawing(data):
    user_id = session.get('user_id')
    classroomId = data.get('classroomId')
    drawing_data = data.get('drawing_data')
    page_number = data.get('page_number')

    if not all([user_id, classroomId, drawing_data, page_number]):
        print("Missing data for whiteboard_drawing event.")
        return

    # Update the drawing data in the database
    whiteboard_collection.update_one(
        {"classroomId": classroomId, "page_number": page_number},
        {"$set": {"drawing_data": drawing_data, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    
    # Broadcast the drawing to all clients in the room, excluding the sender
    emit('new_whiteboard_drawing', {
        'userId': user_id,
        'drawing_data': drawing_data,
        'page_number': page_number
    }, room=classroomId, include_sid=False)

    print(f"Whiteboard update from user {user_id} in classroom {classroomId} on page {page_number}")


@socketio.on('whiteboard_clear')
def handle_whiteboard_clear(data):
    user_id = session.get('user_id')
    classroomId = data.get('classroomId')
    page_number = data.get('page_number')

    if not all([user_id, classroomId, page_number]):
        print("Missing data for whiteboard_clear event.")
        return

    # Clear the drawing data in the database for the specific page
    whiteboard_collection.update_one(
        {"classroomId": classroomId, "page_number": page_number},
        {"$set": {"drawing_data": [], "updated_at": datetime.utcnow()}}
    )

    # Broadcast the clear event to all clients in the room, excluding the sender
    emit('whiteboard_cleared', {
        'userId': user_id,
        'page_number': page_number
    }, room=classroomId, include_sid=False)
    
    print(f"Whiteboard page {page_number} cleared by {user_id} in classroom {classroomId}")


@socketio.on('webrtc_signal')
def handle_webrtc_signal(data):
    recipient_id = data.get('recipient_id')
    signal_data = data.get('signal')
    classroomId = data.get('classroomId') # Added for context
    sender_id = session.get('user_id')
    
    # Find the recipient's SID
    recipient_sid = webrtc_users.get(recipient_id, {}).get('sid')

    if not recipient_sid or not signal_data or not classroomId:
        print(f"Missing data for webrtc_signal: {data}")
        return

    # Check if the sender is authorized to send a signal to the recipient
    # (e.g., are they in the same classroom?)
    if webrtc_users.get(sender_id, {}).get('classroom_id') != classroomId:
        print(f"Unauthorized WebRTC signal attempt. Sender {sender_id} is not in classroom {classroomId}")
        return

    emit('webrtc_signal', {'signal': signal_data, 'sender_id': sender_id}, room=recipient_sid)
    print(f"WEBRTC: Signal from {sender_id} to {recipient_id} in classroom {classroomId}")


@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    recipient_id = data.get('recipient_id')
    offer = data.get('offer')
    classroomId = data.get('classroomId') # Added for context
    sender_id = session.get('user_id')

    # Find the recipient's SID
    recipient_sid = webrtc_users.get(recipient_id, {}).get('sid')

    if not recipient_sid or not offer or not classroomId:
        print(f"Missing data for webrtc_offer: {data}")
        return

    emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id}, room=recipient_sid)
    print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    recipient_id = data.get('recipient_id')
    answer = data.get('answer')
    classroomId = data.get('classroomId') # Added for context
    sender_id = session.get('user_id')

    # Find the recipient's SID
    recipient_sid = webrtc_users.get(recipient_id, {}).get('sid')

    if not recipient_sid or not answer or not classroomId:
        print(f"Missing data for webrtc_answer: {data}")
        return

    emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id}, room=recipient_sid)
    print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    recipient_id = data.get('recipient_id')
    candidate = data.get('candidate')
    classroomId = data.get('classroomId') # Added for context
    sender_id = session.get('user_id')
    
    # Find the recipient's SID
    recipient_sid = webrtc_users.get(recipient_id, {}).get('sid')

    if not recipient_sid or not candidate or not classroomId:
        print(f"Missing data for webrtc_ice_candidate: {data}")
        return

    emit('webrtc_ice_candidate', {'candidate': candidate, 'sender_id': sender_id}, room=recipient_sid)
    print(f"WEBRTC: ICE Candidate from {sender_id} to {recipient_id} in classroom {classroomId}")


@socketio.on('webrtc_peer_disconnected')
def handle_peer_disconnected_signal(data):
    classroomId = data.get('classroomId')
    peer_id = data.get('peer_id')
    sender_sid = request.sid
    sender_id = session.get('user_id')

    if not classroomId or not peer_id:
        print(f"Missing data for webrtc_peer_disconnected: {data}")
        return
    
    emit('webrtc_peer_disconnected', {'peer_id': sender_id}, room=classroomId, include_sid=False)
    print(f"WEBRTC: Client {sender_sid} signaling peer {peer_id} disconnected in classroom {classroomId}")


@socketio.on('admin_action_update')
def handle_admin_action_update(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    # Only admins can send this, but we'll re-emit to everyone in the room
    if classroomId and message:
        emit('admin_action_update', {'message': message}, room=classroomId, include_sid=False)
        print(f"Admin action update from {session.get('username')} in classroom {classroomId}: {message}")


@app.route('/api/get-chat-history/<classroomId>', methods=['GET'])
def get_chat_history(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    messages = list(chat_messages_collection.find({"classroomId": classroomId}, {"_id": 0}).sort("timestamp", 1))
    
    # Convert datetime objects to ISO format strings
    for msg in messages:
        if 'timestamp' in msg and isinstance(msg['timestamp'], datetime):
            msg['timestamp'] = msg['timestamp'].isoformat()
            
    return jsonify(messages), 200

if __name__ == '__main__':
    # Use gevent's WSGI server for production
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler
    print("Starting server with Gevent...")
    # This is a basic setup, you might want to use a more robust
    # WSGI server like Gunicorn in a real production environment.
    http_server = pywsgi.WSGI-Server(('0.0.0.0', 5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()
