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
from bson.objectid import ObjectId # For working with MongoDB _id

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

# --- MongoDB Collections ---
users_collection = mongo.db.users
classrooms_collection = mongo.db.classrooms
classroom_files_collection = mongo.db.classroom_files
whiteboard_states_collection = mongo.db.whiteboard_states # Stores whiteboard drawing history
assessments_collection = mongo.db.assessments
submissions_collection = mongo.db.submissions
chat_messages_collection = mongo.db.chat_messages # NEW: Collection for chat messages

# Global dictionary to track active users and their socket IDs (for direct messaging, etc.)
# {user_id: socket_id}
active_users_sockets = {}

# --- Helper Functions ---
def get_user_id():
    return session.get('user_id')

def get_user_role():
    return session.get('role')

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Unauthorized: Login required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def teacher_or_admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Unauthorized: Login required"}), 401
        if session.get('role') not in ['teacher', 'admin']:
            return jsonify({"message": "Forbidden: Insufficient permissions"}), 403
        return f(*args, **kwargs)
    return decorated_function

# --- API Endpoints ---

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Serve other static files like CSS, JS
    return send_from_directory('.', path)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student') # Default role is student

    if not all([username, email, password, role]):
        return jsonify({"message": "Missing required fields"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "Email already registered"}), 409

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
    return jsonify({"message": "Registration successful"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({"email": email})
    if user and check_password_hash(user['password'], password):
        session.permanent = True # Make the session permanent
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "role": user['role']
            }
        }), 200
    return jsonify({"message": "Invalid email or password"}), 401

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        user_id = session['user_id']
        user = users_collection.find_one({"id": user_id}, {"password": 0}) # Exclude password
        if user:
            return jsonify({"authenticated": True, "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "role": user['role']
            }}), 200
    return jsonify({"authenticated": False}), 200

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    user_id = session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None)
    if user_id in active_users_sockets:
        # Emit a user_left event for this user if they are currently connected via socket
        # Find all rooms the user's socket is in and emit.
        s_id = active_users_sockets.pop(user_id)
        # This will emit to all rooms the user was in except the user's own sid
        # (which is being disconnected).
        # We need to find the rooms first.
        # Note: socketio.rooms() gives rooms for a specific sid, which we can't call easily
        # without an actual request context from that SID.
        # A simpler approach is to let the client-side `disconnect` event handle clean-up
        # or have a specific 'user_logged_out' event.
        # For now, just remove from active_users_sockets.
        print(f"User {user_id} logged out and removed from active_sockets.")
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/update_profile', methods=['POST'])
@login_required
def update_profile():
    user_id = get_user_id()
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({"message": "Username cannot be empty"}), 400

    users_collection.update_one({"id": user_id}, {"$set": {"username": username}})
    session['username'] = username # Update session username immediately
    return jsonify({"message": "Profile updated successfully"}), 200


@app.route('/api/create_classroom', methods=['POST'])
@teacher_or_admin_required
def create_classroom():
    data = request.json
    name = data.get('name')
    creator_id = get_user_id()
    creator_username = session.get('username')

    if not name:
        return jsonify({"message": "Classroom name is required"}), 400

    classroom_id = str(uuid.uuid4()) # Generate a unique ID for the classroom
    classrooms_collection.insert_one({
        "id": classroom_id,
        "name": name,
        "creator_id": creator_id,
        "creator_username": creator_username,
        "participants": [creator_id], # Creator is automatically a participant
        "created_at": datetime.utcnow()
    })
    return jsonify({"message": "Classroom created successfully", "id": classroom_id}), 201

@app.route('/api/join_classroom_api', methods=['POST'])
@login_required
def join_classroom_api():
    data = request.json
    classroom_id = data.get('classroomId') # This might be `classroom_id` from client
    user_id = get_user_id()

    if not classroom_id:
        return jsonify({"message": "Classroom ID is required"}), 400

    classroom = classrooms_collection.find_one({"id": classroom_id})
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404

    # Add user to participants if not already there
    classrooms_collection.update_one(
        {"id": classroom_id},
        {"$addToSet": {"participants": user_id}}
    )
    return jsonify({"message": "Joined classroom successfully", "classroom_name": classroom['name']}), 200


@app.route('/api/classrooms', methods=['GET'])
@login_required
def get_user_classrooms():
    user_id = get_user_id()
    # Find classrooms where the user is a participant
    classrooms = list(classrooms_collection.find({"participants": user_id}))
    # Convert ObjectId to string for JSON serialization
    for classroom in classrooms:
        classroom['_id'] = str(classroom['_id'])
    return jsonify({"classrooms": classrooms}), 200

@app.route('/api/classrooms/<classroomId>/participants', methods=['GET'])
@login_required
def get_classroom_participants(classroomId):
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404

    participant_ids = classroom.get('participants', [])
    participants = []
    for p_id in participant_ids:
        user = users_collection.find_one({"id": p_id}, {"password": 0})
        if user:
            participants.append({
                "id": user['id'],
                "username": user['username'],
                "role": user['role']
            })
    return jsonify({"participants": participants}), 200

@app.route('/api/classrooms/<classroomId>/kick_participant', methods=['POST'])
@teacher_or_admin_required
def kick_participant(classroomId):
    data = request.json
    user_id_to_kick = data.get('user_id')
    
    if not user_id_to_kick:
        return jsonify({"message": "User ID to kick is required"}), 400

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404

    # Prevent admin from kicking themselves or other admins, or teachers kicking other teachers/admins
    kicker_id = get_user_id()
    kicker_role = get_user_role()

    if kicker_id == user_id_to_kick:
        return jsonify({"message": "Cannot kick yourself"}), 403

    target_user = users_collection.find_one({"id": user_id_to_kick})
    if not target_user:
        return jsonify({"message": "User to kick not found"}), 404

    if target_user['role'] in ['teacher', 'admin'] and kicker_role == 'teacher':
        return jsonify({"message": "Teachers cannot kick other teachers or admins"}), 403
    if target_user['role'] == 'admin' and kicker_role == 'admin' and target_user['id'] != kicker_id:
        # Admins can kick other admins, but this might need more robust checks
        pass # Allow for now, but could be restricted.

    result = classrooms_collection.update_one(
        {"id": classroomId},
        {"$pull": {"participants": user_id_to_kick}}
    )

    if result.modified_count > 0:
        # If the kicked user has an active socket, disconnect them from the classroom's room
        if user_id_to_kick in active_users_sockets:
            s_id = active_users_sockets[user_id_to_kick]
            socketio.leave_room(classroomId, sid=s_id)
            # Emit a user_left message specifically to the kicked user's socket
            emit('user_left', {'username': target_user['username'], 'message': f'You have been kicked from {classroom["name"]}.'}, room=s_id)
            print(f"User {user_id_to_kick} kicked from classroom {classroomId} and their socket {s_id} left the room.")

        return jsonify({"message": f"User {target_user['username']} kicked from classroom"}), 200
    return jsonify({"message": "User not found in classroom or already kicked"}), 404


@app.route('/api/upload_library_files', methods=['POST'])
@teacher_or_admin_required
def upload_library_files():
    classroomId = request.form.get('classroomId')
    if 'files' not in request.files:
        return jsonify({"message": "No file part"}), 400
    
    files = request.files.getlist('files')
    if not files:
        return jsonify({"message": "No selected file"}), 400

    if not classroomId:
        return jsonify({"message": "Classroom ID is required"}), 400

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404

    uploaded_files_info = []
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    for file in files:
        if file.filename == '':
            continue
        
        # Secure filename and save
        original_filename = file.filename
        unique_filename = f"{uuid.uuid4()}_{original_filename}"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)

        file_id = str(uuid.uuid4())
        classroom_files_collection.insert_one({
            "id": file_id,
            "classroomId": classroomId,
            "uploader_id": get_user_id(),
            "original_name": original_filename,
            "stored_name": unique_filename,
            "path": filepath,
            "uploaded_at": datetime.utcnow()
        })
        uploaded_files_info.append({"id": file_id, "name": original_filename})

    if not uploaded_files_info:
        return jsonify({"message": "No valid files uploaded"}), 400

    return jsonify({"message": "Files uploaded successfully", "files": uploaded_files_info}), 200


@app.route('/api/download_library_file/<file_id>', methods=['GET'])
@login_required
def download_library_file(file_id):
    file_record = classroom_files_collection.find_one({"id": file_id})
    if not file_record:
        return jsonify({"message": "File not found"}), 404
    
    # Ensure user is part of the classroom the file belongs to
    user_id = get_user_id()
    classroom = classrooms_collection.find_one({"id": file_record['classroomId'], "participants": user_id})
    if not classroom:
        return jsonify({"message": "Forbidden: You are not a participant of this classroom"}), 403

    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    return send_from_directory(UPLOAD_FOLDER, file_record['stored_name'], as_attachment=True, download_name=file_record['original_name'])

@app.route('/api/delete_library_file/<file_id>', methods=['DELETE'])
@teacher_or_admin_required
def delete_library_file(file_id):
    classroomId = request.json.get('classroomId') # Get classroomId from body for security check
    
    file_record = classroom_files_collection.find_one({"id": file_id, "classroomId": classroomId})
    if not file_record:
        return jsonify({"message": "File not found or not in specified classroom"}), 404

    try:
        os.remove(file_record['path'])
        classroom_files_collection.delete_one({"id": file_id})
        return jsonify({"message": "File deleted successfully", "file_name": file_record['original_name']}), 200
    except OSError as e:
        print(f"Error deleting file from disk: {e}")
        return jsonify({"message": "Error deleting file from server"}), 500

@app.route('/api/classrooms/<classroomId>/files', methods=['GET'])
@login_required
def get_classroom_files(classroomId):
    user_id = get_user_id()
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        return jsonify({"message": "Forbidden: Not a participant of this classroom"}), 403

    files = list(classroom_files_collection.find({"classroomId": classroomId}))
    # Convert ObjectId to string for JSON serialization
    for file in files:
        file['_id'] = str(file['_id'])
    return jsonify({"files": files}), 200

@app.route('/api/classrooms/<classroomId>/assessments', methods=['POST'])
@teacher_or_admin_required
def create_assessment(classroomId):
    data = request.json
    title = data.get('title')
    description = data.get('description')
    questions = data.get('questions') # List of question objects

    if not all([title, description, questions]):
        return jsonify({"message": "Missing required assessment fields"}), 400

    if not isinstance(questions, list) or not questions:
        return jsonify({"message": "Assessment must contain at least one question"}), 400

    # Basic validation for questions
    for q_idx, question in enumerate(questions):
        if not all(k in question for k in ['text', 'type']):
            return jsonify({"message": f"Question {q_idx+1} missing text or type"}), 400
        if question['type'] == 'mcq':
            if 'options' not in question or not isinstance(question['options'], list) or len(question['options']) < 2:
                return jsonify({"message": f"MCQ Question {q_idx+1} requires at least 2 options"}), 400
            if 'correct_answer' not in question or not isinstance(question['correct_answer'], int):
                 return jsonify({"message": f"MCQ Question {q_idx+1} requires a correct answer index"}), 400
            if not (0 <= question['correct_answer'] < len(question['options'])):
                return jsonify({"message": f"MCQ Question {q_idx+1}: Correct answer index out of bounds"}), 400
        elif question['type'] == 'short_answer':
            if 'correct_answer' not in question or not isinstance(question['correct_answer'], str) or not question['correct_answer'].strip():
                return jsonify({"message": f"Short Answer Question {q_idx+1} requires a correct answer text"}), 400
        else:
            return jsonify({"message": f"Unknown question type for Question {q_idx+1}"}), 400

    assessment_id = str(uuid.uuid4())
    assessments_collection.insert_one({
        "id": assessment_id,
        "classroomId": classroomId,
        "creator_id": get_user_id(),
        "title": title,
        "description": description,
        "questions": questions,
        "created_at": datetime.utcnow()
    })
    return jsonify({"message": "Assessment created successfully", "assessment_id": assessment_id}), 201

@app.route('/api/classrooms/<classroomId>/assessments', methods=['GET'])
@login_required
def get_assessments(classroomId):
    user_id = get_user_id()
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        return jsonify({"message": "Forbidden: Not a participant of this classroom"}), 403

    assessments = list(assessments_collection.find({"classroomId": classroomId}))
    for assessment in assessments:
        assessment['_id'] = str(assessment['_id'])
    return jsonify({"assessments": assessments}), 200

@app.route('/api/classrooms/<classroomId>/assessments/<assessmentId>', methods=['GET'])
@login_required
def get_single_assessment(classroomId, assessmentId):
    user_id = get_user_id()
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        return jsonify({"message": "Forbidden: Not a participant of this classroom"}), 403

    assessment = assessments_collection.find_one({"id": assessmentId, "classroomId": classroomId})
    if not assessment:
        return jsonify({"message": "Assessment not found"}), 404
    
    assessment['_id'] = str(assessment['_id'])
    return jsonify({"assessment": assessment}), 200


@app.route('/api/classrooms/<classroomId>/assessments/<assessmentId>', methods=['DELETE'])
@teacher_or_admin_required
def delete_assessment(classroomId, assessmentId):
    assessment = assessments_collection.find_one({"id": assessmentId, "classroomId": classroomId})
    if not assessment:
        return jsonify({"message": "Assessment not found or you don't have permission"}), 404

    # Optionally delete associated submissions
    submissions_collection.delete_many({"assessmentId": assessmentId})
    
    result = assessments_collection.delete_one({"id": assessmentId})
    if result.deleted_count > 0:
        return jsonify({"message": "Assessment deleted successfully"}), 200
    return jsonify({"message": "Failed to delete assessment"}), 500


@app.route('/api/classrooms/<classroomId>/assessments/<assessmentId>/submit', methods=['POST'])
@login_required
def submit_assessment(classroomId, assessmentId):
    user_id = get_user_id()
    username = session.get('username')
    answers = request.json.get('answers')

    if not answers:
        return jsonify({"message": "No answers provided"}), 400

    assessment = assessments_collection.find_one({"id": assessmentId, "classroomId": classroomId})
    if not assessment:
        return jsonify({"message": "Assessment not found"}), 404

    # Check if user has already submitted (optional, but good for one-time assessments)
    existing_submission = submissions_collection.find_one({"assessmentId": assessmentId, "userId": user_id})
    if existing_submission:
        return jsonify({"message": "You have already submitted this assessment."}), 409

    score = 0
    total_questions = len(assessment['questions'])

    # Grade the answers
    for i, question in enumerate(assessment['questions']):
        if i < len(answers):
            user_answer = answers[i]
            if question['type'] == 'mcq':
                if user_answer == question['correct_answer']:
                    score += 1
            elif question['type'] == 'short_answer':
                # Basic case-insensitive and whitespace-stripped comparison
                if str(user_answer).strip().lower() == str(question['correct_answer']).strip().lower():
                    score += 1
        # If user_answer is None (not answered), it's not counted as correct

    submission_id = str(uuid.uuid4())
    submissions_collection.insert_one({
        "id": submission_id,
        "assessmentId": assessmentId,
        "classroomId": classroomId,
        "userId": user_id,
        "username": username, # Store username for easier display
        "answers": answers,
        "score": score,
        "timestamp": datetime.utcnow()
    })

    return jsonify({"message": "Assessment submitted successfully", "score": score, "total_questions": total_questions}), 200


@app.route('/api/classrooms/<classroomId>/assessments/<assessmentId>/submissions', methods=['GET'])
@teacher_or_admin_required
def get_assessment_submissions(classroomId, assessmentId):
    # Ensure the classroom exists and the user is an admin/teacher in it
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404

    submissions = list(submissions_collection.find({"assessmentId": assessmentId, "classroomId": classroomId}))
    for submission in submissions:
        submission['_id'] = str(submission['_id'])
        # Convert datetime objects in answers if necessary (e.g., if answers contain nested datetimes)
        # For MongoDB specific datetime objects
        if 'timestamp' in submission and isinstance(submission['timestamp'], datetime):
            # Convert to a dictionary with $date for ISO string representation,
            # which is what EJSON uses and frontend expects.
            submission['timestamp'] = {"$date": submission['timestamp'].isoformat()}
    return jsonify({"submissions": submissions}), 200


# --- Socket.IO Event Handlers ---

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")
    # Remove user from active_users_sockets if their socket disconnects
    user_id_to_remove = None
    for uid, sid in active_users_sockets.items():
        if sid == request.sid:
            user_id_to_remove = uid
            break
    if user_id_to_remove:
        active_users_sockets.pop(user_id_to_remove, None)
        print(f"User {user_id_to_remove} removed from active_users_sockets on disconnect.")
        # Broadcast updated active users list
        emit('active_users_update', {'active_user_ids': list(active_users_sockets.keys())}, broadcast=True)

@socketio.on('register_user_socket')
@login_required
def register_user_socket(data):
    user_id = data.get('userId')
    if user_id:
        active_users_sockets[user_id] = request.sid
        print(f"User {user_id} registered with socket {request.sid}. Active users: {active_users_sockets}")
        # Broadcast updated active users list to all connected clients
        emit('active_users_update', {'active_user_ids': list(active_users_sockets.keys())}, broadcast=True)

@socketio.on('request_active_users')
def handle_request_active_users(data):
    # This might be called when a client joins a classroom to get current online users
    emit('active_users_update', {'active_user_ids': list(active_users_sockets.keys())}, room=request.sid)


@socketio.on('join_classroom')
def handle_join_classroom(data):
    classroomId = data.get('classroomId')
    username = session.get('username')
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not all([classroomId, username, user_id]):
        print(f"Missing data for join_classroom: {data}")
        return

    # Ensure user is actually a participant of this classroom
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        print(f"User {username} not authorized to join classroom {classroomId}")
        emit('error', {'message': 'Unauthorized to join this classroom.'}, room=request.sid)
        return

    join_room(classroomId)
    print(f"Client {request.sid} ({username}) joined classroom {classroomId}")

    # Add user to classroom's participants if not already there (redundant if via API, but safe)
    classrooms_collection.update_one(
        {"id": classroomId},
        {"$addToSet": {"participants": user_id}} # Add user_id to participants array
    )

    # Emit to everyone in the room (including the sender for confirmation)
    emit('user_joined', {
        'username': username,
        'user_id': user_id,
        'role': user_role,
        'message': f'{username} has joined the classroom.',
        'timestamp': datetime.utcnow().isoformat()
    }, room=classroomId)

    # NEW: Fetch and send historical chat messages to the joining user
    historical_messages = chat_messages_collection.find(
        {"classroomId": classroomId}
    ).sort("timestamp", 1) # Sort by timestamp ascending

    # Convert cursor to list and send them
    messages_to_send = []
    for msg in historical_messages:
        messages_to_send.append({
            'sender_id': msg.get('sender_id'),
            'sender_username': msg.get('sender_username'),
            'message_content': msg.get('message_content'),
            # Ensure timestamp is ISO format
            'timestamp': msg.get('timestamp').isoformat() if isinstance(msg.get('timestamp'), datetime) else msg.get('timestamp')
        })
    emit('historical_messages', messages_to_send, room=request.sid) # Only send to the current client

    # Send current whiteboard state to the joining user
    current_whiteboard_state = whiteboard_states_collection.find_one({"classroomId": classroomId})
    if current_whiteboard_state:
        # Ensure _id is stringified
        current_whiteboard_state['_id'] = str(current_whiteboard_state['_id'])
        emit('whiteboard_state', {
            'classroomId': classroomId,
            'history': current_whiteboard_state.get('history', {}),
            'currentPage': current_whiteboard_state.get('currentPage', 1)
        }, room=request.sid)


@socketio.on('leave_classroom')
def handle_leave_classroom(data):
    classroomId = data.get('classroomId')
    username = session.get('username')
    user_id = session.get('user_id')

    if not all([classroomId, username, user_id]):
        print(f"Missing data for leave_classroom: {data}")
        return

    leave_room(classroomId)
    print(f"Client {request.sid} ({username}) left classroom {classroomId}")

    # Remove user from classroom's participants (optional, depending on desired persistence of participant list)
    # classrooms_collection.update_one(
    #     {"id": classroomId},
    #     {"$pull": {"participants": user_id}}
    # )

    emit('user_left', {
        'username': username,
        'message': f'{username} has left the classroom.',
        'timestamp': datetime.utcnow().isoformat()
    }, room=classroomId)


@socketio.on('request_historical_messages')
def handle_request_historical_messages(data):
    classroomId = data.get('classroomId')
    if not classroomId:
        print(f"Missing classroomId for request_historical_messages: {data}")
        return

    # Ensure user is authorized to receive messages for this classroom
    user_id = get_user_id()
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        print(f"User {session.get('username')} not authorized to request historical messages for classroom {classroomId}")
        emit('error', {'message': 'Unauthorized to access messages for this classroom.'}, room=request.sid)
        return

    historical_messages = chat_messages_collection.find(
        {"classroomId": classroomId}
    ).sort("timestamp", 1) # Sort by timestamp ascending

    messages_to_send = []
    for msg in historical_messages:
        messages_to_send.append({
            'sender_id': msg.get('sender_id'),
            'sender_username': msg.get('sender_username'),
            'message_content': msg.get('message_content'),
            'timestamp': msg.get('timestamp').isoformat() if isinstance(msg.get('timestamp'), datetime) else msg.get('timestamp')
        })
    emit('historical_messages', messages_to_send, room=request.sid) # Send only to the requesting client
    print(f"Sent {len(messages_to_send)} historical messages to client {request.sid} for classroom {classroomId}")


@socketio.on('chat_message')
def handle_chat_message(data):
    classroomId = data.get('classroomId')
    message_content = data.get('message_content')
    sender_username = session.get('username')
    sender_id = session.get('user_id')

    if not all([classroomId, message_content, sender_username, sender_id]):
        print(f"Missing data for chat_message: {data}")
        return

    # Ensure user is part of the classroom they are sending a message to
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": sender_id})
    if not classroom:
        print(f"User {sender_username} not authorized to send message in classroom {classroomId}")
        emit('error', {'message': 'Unauthorized to send messages in this classroom.'}, room=request.sid)
        return

    timestamp = datetime.utcnow()

    # NEW: Save message to MongoDB
    chat_messages_collection.insert_one({
        "classroomId": classroomId,
        "sender_id": sender_id,
        "sender_username": sender_username,
        "message_content": message_content,
        "timestamp": timestamp
    })
    print(f"Chat message saved: {sender_username} in {classroomId} at {timestamp}")

    # Emit the message to everyone in the classroom
    emit('chat_message', {
        'sender_id': sender_id,
        'sender_username': sender_username,
        'message_content': message_content,
        'timestamp': timestamp.isoformat() # Send ISO formatted string
    }, room=classroomId, include_sid=False) # Do not send back to sender, as they will render locally
    print(f"CHAT: Message from {sender_username} in classroom {classroomId}")


@socketio.on('drawing')
def handle_drawing(data):
    classroomId = data.get('classroomId')
    page = data.get('page')
    x0, y0, x1, y1 = data.get('x0'), data.get('y0'), data.get('x1'), data.get('y1')
    color = data.get('color')
    size = data.get('size')

    if not all([classroomId, page, x0 is not None, y0 is not None, x1 is not None, y1 is not None, color, size]):
        print(f"Missing data for drawing: {data}")
        return

    # Only allow teachers/admins to draw (or modify this logic if students can draw)
    if get_user_role() not in ['teacher', 'admin']:
        emit('error', {'message': 'Only teachers and admins can draw.'}, room=request.sid)
        return

    # Update whiteboard state in MongoDB
    whiteboard_states_collection.update_one(
        {"classroomId": classroomId},
        {"$push": {f"history.{page}": {"x0": x0, "y0": y0, "x1": x1, "y1": y1, "color": color, "size": size}}},
        upsert=True # Create document if it doesn't exist
    )
    
    # Broadcast drawing to all clients in the classroom except the sender
    emit('drawing', data, room=classroomId, include_sid=False)

@socketio.on('clear_whiteboard')
def handle_clear_whiteboard(data):
    classroomId = data.get('classroomId')
    page = data.get('page')
    full_clear = data.get('full_clear', False)

    if not classroomId:
        print(f"Missing classroomId for clear_whiteboard: {data}")
        return

    if get_user_role() not in ['teacher', 'admin']:
        emit('error', {'message': 'Only teachers and admins can clear the whiteboard.'}, room=request.sid)
        return

    if full_clear:
        whiteboard_states_collection.delete_one({"classroomId": classroomId})
        print(f"Whiteboard for classroom {classroomId} fully cleared.")
    else:
        # Clear only the current page's history
        whiteboard_states_collection.update_one(
            {"classroomId": classroomId},
            {"$set": {f"history.{page}": []}}
        )
        print(f"Whiteboard page {page} for classroom {classroomId} cleared.")

    emit('clear_whiteboard', {'classroomId': classroomId, 'page': page, 'full_clear': full_clear}, room=classroomId, include_sid=False)

@socketio.on('change_whiteboard_page')
def handle_change_whiteboard_page(data):
    classroomId = data.get('classroomId')
    page = data.get('page')
    # history = data.get('history') # Client sends full history on page change

    if not all([classroomId, page]):
        print(f"Missing data for change_whiteboard_page: {data}")
        return

    if get_user_role() not in ['teacher', 'admin']:
        emit('error', {'message': 'Only teachers and admins can change whiteboard pages.'}, room=request.sid)
        return

    # Update current page in DB and save the full history for that page (sent by client)
    # This approach assumes the client sends the authoritative state for the page it's on.
    # For more robust systems, you might want to merge history or use a more granular sync.
    whiteboard_states_collection.update_one(
        {"classroomId": classroomId},
        {"$set": {"currentPage": page}},
        upsert=True
    )
    # Optionally save the sent history if it's considered the complete state for the page
    if 'history' in data:
         whiteboard_states_collection.update_one(
            {"classroomId": classroomId},
            {"$set": {"history": data['history']}}, # Save the whole history object
            upsert=True
        )


    emit('new_whiteboard_page', {'classroomId': classroomId, 'page': page}, room=classroomId, include_sid=False)


@socketio.on('library_file_uploaded_notify')
def handle_library_file_uploaded_notify(data):
    classroomId = data.get('classroomId')
    file_name = data.get('file_name')
    if classroomId and file_name:
        emit('library_file_uploaded', {'classroomId': classroomId, 'file_name': file_name}, room=classroomId, include_sid=False)

@socketio.on('library_file_deleted_notify')
def handle_library_file_deleted_notify(data):
    classroomId = data.get('classroomId')
    file_name = data.get('file_name')
    if classroomId and file_name:
        emit('library_file_deleted', {'classroomId': classroomId, 'file_name': file_name}, room=classroomId, include_sid=False)

@socketio.on('new_assessment_created_notify')
def handle_new_assessment_created_notify(data):
    classroomId = data.get('classroomId')
    title = data.get('title')
    if classroomId and title:
        emit('new_assessment_created', {'classroomId': classroomId, 'title': title}, room=classroomId, include_sid=False)

@socketio.on('assessment_submitted_notify')
def handle_assessment_submitted_notify(data):
    classroomId = data.get('classroomId')
    assessment_id = data.get('assessment_id')
    assessment_title = data.get('assessment_title')
    username = data.get('username')
    user_id = data.get('user_id')
    if classroomId and assessment_id and assessment_title and username and user_id:
        # Emit only to teachers/admins in the classroom
        # Get SIDs of teachers/admins in this room
        room_sids = rooms(classroomId)
        teacher_admin_sids = []
        for s_id in room_sids:
            # Need to look up user role for each SID. This can be complex.
            # A simpler way is to have users register their role on connect and store in server memory
            # For now, let's assume `active_users_sockets` maps user_id to sid
            # and we can get role from `users_collection`.
            for uid, sid_val in active_users_sockets.items():
                if sid_val == s_id:
                    user_info = users_collection.find_one({"id": uid}, {"role": 1})
                    if user_info and user_info.get('role') in ['teacher', 'admin']:
                        teacher_admin_sids.append(s_id)
                    break
        
        for s_id in teacher_admin_sids:
            if s_id != request.sid: # Don't send back to the student who submitted if they are also a teacher/admin
                emit('assessment_submitted_notification', {
                    'classroomId': classroomId,
                    'assessment_id': assessment_id,
                    'assessment_title': assessment_title,
                    'username': username,
                    'user_id': user_id
                }, room=s_id)
        print(f"Notification for submission of {assessment_title} sent to teachers/admins in {classroomId}")

@socketio.on('admin_action_update')
def handle_admin_action_update(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    # Only admins/teachers can send this, but we'll re-emit to everyone in the room
    if classroomId and message:
        emit('admin_action_update', {'message': message, 'classroomId': classroomId}, room=classroomId, include_sid=False)
        print(f"Admin action update from {session.get('username')} in {classroomId}: {message}")


# WebRTC Signaling (for future video/audio calls, etc.)
@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    recipient_id = data.get('recipient_id') # user_id of the target client
    offer = data.get('offer')
    classroomId = data.get('classroomId') # Classroom context
    sender_id = session.get('user_id') # Current user's ID

    if not recipient_id or not offer or not classroomId:
        print(f"Missing data for webrtc_offer: {data}")
        return

    # Find recipient's socket ID
    recipient_sid = active_users_sockets.get(recipient_id)

    if recipient_sid:
        emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id, 'classroomId': classroomId}, room=recipient_sid)
        print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")
    else:
        print(f"WEBRTC: Recipient {recipient_id} not found in active sockets.")
        emit('error', {'message': 'Recipient offline or not found.'}, room=request.sid)

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    recipient_id = data.get('recipient_id') # user_id of the target client
    answer = data.get('answer')
    classroomId = data.get('classroomId')
    sender_id = session.get('user_id')

    if not recipient_id or not answer or not classroomId:
        print(f"Missing data for webrtc_answer: {data}")
        return

    recipient_sid = active_users_sockets.get(recipient_id)

    if recipient_sid:
        emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id, 'classroomId': classroomId}, room=recipient_sid)
        print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId}")
    else:
        print(f"WEBRTC: Recipient {recipient_id} not found in active sockets.")
        emit('error', {'message': 'Recipient offline or not found.'}, room=request.sid)

@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    recipient_id = data.get('recipient_id')
    candidate = data.get('candidate')
    classroomId = data.get('classroomId')
    sender_id = session.get('user_id')

    if not recipient_id or not candidate or not classroomId:
        print(f"Missing data for webrtc_ice_candidate: {data}")
        return

    recipient_sid = active_users_sockets.get(recipient_id)

    if recipient_sid:
        emit('webrtc_ice_candidate', {'candidate': candidate, 'sender_id': sender_id, 'classroomId': classroomId}, room=recipient_sid)
        print(f"WEBRTC: ICE Candidate from {sender_id} to {recipient_id} in classroom {classroomId}")
    else:
        print(f"WEBRTC: Recipient {recipient_id} not found in active sockets.")
        emit('error', {'message': 'Recipient offline or not found.'}, room=request.sid)


@socketio.on('webrtc_peer_disconnected')
def handle_peer_disconnected_signal(data):
    classroomId = data.get('classroomId')
    peer_id = data.get('peer_id') # This is the user_id of the peer that disconnected
    sender_sid = request.sid # The SID of the client signaling the disconnect

    if not classroomId or not peer_id:
        print(f"Missing data for webrtc_peer_disconnected: {data}")
        return
    
    # Broadcast to all others in the classroom that a peer has disconnected
    # The 'include_sid=False' means it won't be sent back to the client that emitted this.
    emit('webrtc_peer_disconnected', {'peer_id': peer_id, 'classroomId': classroomId}, room=classroomId, include_sid=False)
    print(f"WEBRTC: Client {sender_sid} signaling peer {peer_id} disconnected in classroom {classroomId}")


if __name__ == '__main__':
    # When running with 'flask run' or a production WSGI server,
    # you'd typically run using 'gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 server:app'
    # For simple local development with socketio built-in server:
    # Ensure MongoDB is running on localhost:27017
    print("Starting Flask-SocketIO server...")
    print("Ensure MongoDB is running on mongodb://localhost:27017/oneclass_db")
    socketio.run(app, debug=True, port=5000, host='0.0.0.0')
