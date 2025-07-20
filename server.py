# Merged server.py and server (1).py

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
library_files_collection = mongo.db.library_files # From server.py
classroom_files_collection = mongo.db.classroom_files # From server (1).py - might be a renamed/updated version of library_files_collection
whiteboard_collection = mongo.db.whiteboard_drawings_pages # From server.py
whiteboard_states_collection = mongo.db.whiteboard_states # From server (1).py - might be a renamed/updated version of whiteboard_collection
assessments_collection = mongo.db.assessments
assessment_questions_collection = mongo.db.assessment_questions # From server.py
assessment_submissions_collection = mongo.db.assessment_submissions # From server.py
submissions_collection = mongo.db.submissions # From server (1).py - might be a renamed/updated version of assessment_submissions_collection
chat_messages_collection = mongo.db.chat_messages # From both

# Ensure necessary directories exist for file uploads (from server.py)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global dictionary to track active users and their socket IDs (for direct messaging, etc.) (from server (1).py)
# {user_id: socket_id}
active_users_sockets = {}

# --- Helper Functions (from server (1).py) ---
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
def index(): # From server.py
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def serve_css(): # From server.py
    return send_from_directory('.', 'style.css')

@app.route('/app.js')
def serve_js(): # From server.py
    return send_from_directory('.', 'app.js')

# Route for classroom details (for direct access via share link) (from server.py)
@app.route('/classroom/<classroomId>')
def serve_classroom_page(classroomId):
    return send_from_directory('.', 'index.html')

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename): # From server.py
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/<path:path>')
def serve_static(path): # From server (1).py (more general than serve_css/js)
    # Serve other static files like CSS, JS
    return send_from_directory('.', path)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user') # 'user' or 'admin' from server.py, 'student' from server (1).py - keep 'user' or 'student' as default and allow 'admin' from data

    if not all([username, email, password]): # From server.py
        return jsonify({"error": "Missing required fields"}), 400 # From server.py

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409 # From server.py

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
    return jsonify({"message": "User registered successfully", "user": {"id": user_id, "username": username, "email": email, "role": role}}), 201 # From server.py

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]): # From server.py
        return jsonify({"error": "Missing email or password"}), 400 # From server.py

    user = users_collection.find_one({"email": email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"error": "Invalid email or password"}), 401 # From server.py

    session['user_id'] = user['id'] # Store user ID in session
    session['username'] = user['username'] # Store username in session
    session['role'] = user['role'] # Store role in session
    session.permanent = True # Make session permanent
    print(f"User {user['username']} ({user['role']}) logged in. Session set.") # From server.py

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "role": user['role']
        }
    }), 200 # From server.py

@app.route('/api/logout', methods=['POST'])
@login_required # From server (1).py
def logout():
    user_id = session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None) # Clear role from session (from server.py)
    if user_id in active_users_sockets: # From server (1).py
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
        print(f"User {user_id} logged out and removed from active_sockets.") # From server (1).py
    print(f"User {session.get('username')} logging out. Clearing session.") # From server.py
    return jsonify({"message": "Logged out successfully"}), 200

# NEW: Endpoint to check current user session (from server.py)
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

@app.route('/api/check_auth', methods=['GET'])
def check_auth(): # From server (1).py
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

@app.route('/api/update-profile', methods=['POST'])
@login_required # Using decorator from server (1).py
def update_profile():
    user_id = get_user_id() # Using helper from server (1).py
    if not user_id: # This check is redundant with @login_required but keeping for safety from server.py
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    new_username = data.get('username') # From server.py - keeping 'new_username' for clarity

    if not new_username:
        return jsonify({"error": "New username is missing"}), 400 # From server.py

    result = users_collection.update_one(
        {"id": user_id},
        {"$set": {"username": new_username, "updated_at": datetime.utcnow()}} # From server.py
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404 # From server.py
    if result.modified_count == 0:
        return jsonify({"message": "No changes made"}), 200 # No error if same username (from server.py)
    
    session['username'] = new_username # Update username in session (from server.py)
    print(f"Profile for {user_id} updated to username: {new_username}") # From server.py
    return jsonify({"message": "Profile updated successfully"}), 200

@app.route('/api/create_classroom', methods=['POST'])
@teacher_or_admin_required
def create_classroom(): # From server (1).py
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
def join_classroom_api(): # From server (1).py
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
def get_user_classrooms(): # From server (1).py
    user_id = get_user_id()
    # Find classrooms where the user is a participant
    classrooms = list(classrooms_collection.find({"participants": user_id}))
    # Convert ObjectId to string for JSON serialization
    for classroom in classrooms:
        classroom['_id'] = str(classroom['_id'])
    return jsonify({"classrooms": classrooms}), 200

@app.route('/api/classrooms/<classroomId>/participants', methods=['GET'])
@login_required
def get_classroom_participants(classroomId): # From server (1).py
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
def kick_participant(classroomId): # From server (1).py
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

@app.route('/api/upload-library-files', methods=['POST'])
@teacher_or_admin_required # From server (1).py
def upload_library_files():
    user_id = session.get('user_id') # From server.py - keeping for consistency, though @teacher_or_admin_required handles it
    user_role = session.get('role') # From server.py - keeping for consistency
    if not user_id: # Redundant with decorator
        return jsonify({"error": "Unauthorized"}), 401
    
    if user_role != 'admin' and user_role != 'teacher': # Modified to include teacher
        return jsonify({"error": "Forbidden: Only administrators or teachers can upload files."}), 403

    if 'files' not in request.files:
        return jsonify({"error": "No files part"}), 400

    files = request.files.getlist('files')
    class_room_id = request.form.get('classroomId') # From server.py
    classroomId = request.form.get('classroomId') # From server (1).py - keeping for consistency

    if not class_room_id: # Or classroomId
        return jsonify({"error": "Classroom ID is missing"}), 400

    classroom = classrooms_collection.find_one({"id": classroomId}) # From server (1).py
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404

    uploaded_file_info = [] # From server.py
    uploaded_files_info = [] # From server (1).py - merging them

    # Using UPLOAD_FOLDER from app.config (from server.py)
    # Ensuring it exists (from server (1).py)
    UPLOAD_FOLDER_PATH = os.path.join(os.getcwd(), app.config['UPLOAD_FOLDER'])
    if not os.path.exists(UPLOAD_FOLDER_PATH):
        os.makedirs(UPLOAD_FOLDER_PATH)

    for file in files:
        if file.filename == '':
            continue # From server (1).py
        
        # Secure filename and save
        original_filename = file.filename # From server (1).py
        unique_filename = f"{uuid.uuid4()}_{original_filename}" # Combination of both approaches
        filepath = os.path.join(UPLOAD_FOLDER_PATH, unique_filename)
        file.save(filepath)

        file_id = str(uuid.uuid4())
        # Using classroom_files_collection (from server (1).py)
        classroom_files_collection.insert_one({
            "id": file_id,
            "classroomId": class_room_id, # Using class_room_id for consistency with existing code
            "uploader_id": user_id,
            "original_name": original_filename,
            "stored_name": unique_filename,
            "path": filepath,
            "uploaded_at": datetime.utcnow()
        })
        uploaded_file_info.append({"id": file_id, "filename": original_filename, "url": f"/uploads/{unique_filename}"}) # Combining info
        uploaded_files_info.append({"id": file_id, "name": original_filename}) # For server (1).py's structure

    if not uploaded_file_info: # If no valid files were processed
        return jsonify({"message": "No valid files uploaded"}), 400 # From server (1).py

    # Emit admin action update (from server.py)
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"Admin {session.get('username')} uploaded new file(s) to the library."
    }, room=class_room_id)

    print(f"Files uploaded to classroom {class_room_id} by {session.get('username')}") # From server.py
    return jsonify({"message": "Files uploaded successfully", "files": uploaded_file_info}), 201 # From server.py

@app.route('/api/library-files/<classroomId>', methods=['GET'])
@login_required
def get_library_files(classroomId): # From server.py - keeping this endpoint
    user_id = session.get('user_id')
    if not user_id: # Redundant with decorator
        return jsonify({"error": "Unauthorized"}), 401

    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0})) # Using library_files_collection from server.py
    # Rename 'original_filename' to 'filename' for client consistency if needed, but now 'filename' is stored
    for file in files:
        if 'original_filename' in file: # Handle older entries
            file['filename'] = file.pop('original_filename')
    print(f"Fetched {len(files)} library files for classroom {classroomId}")
    return jsonify(files), 200

@app.route('/api/classrooms/<classroomId>/files', methods=['GET'])
@login_required
def get_classroom_files(classroomId): # From server (1).py - keeping this endpoint
    user_id = get_user_id()
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        return jsonify({"message": "Forbidden: Not a participant of this classroom"}), 403

    files = list(classroom_files_collection.find({"classroomId": classroomId})) # Using classroom_files_collection from server (1).py
    # Convert ObjectId to string for JSON serialization
    for file in files:
        file['_id'] = str(file['_id'])
    return jsonify({"files": files}), 200

@app.route('/api/library-files/<fileId>', methods=['DELETE'])
def delete_library_file(fileId): # From server.py - keeping this endpoint name
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    if user_role != 'admin' and user_role != 'teacher': # Modified to include teacher
        return jsonify({"error": "Forbidden: Only administrators or teachers can delete files."}), 403

    file_data = library_files_collection.find_one({"id": fileId}) # Using library_files_collection from server.py
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

@app.route('/api/delete_library_file/<file_id>', methods=['DELETE'])
@teacher_or_admin_required
def delete_classroom_file(file_id): # From server (1).py - renaming to avoid conflict
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

@app.route('/api/download_library_file/<file_id>', methods=['GET'])
@login_required
def download_library_file(file_id): # From server (1).py
    file_record = classroom_files_collection.find_one({"id": file_id})
    if not file_record:
        return jsonify({"message": "File not found"}), 404
    
    # Ensure user is part of the classroom the file belongs to
    user_id = get_user_id()
    classroom = classrooms_collection.find_one({"id": file_record['classroomId'], "participants": user_id})
    if not classroom:
        return jsonify({"message": "Forbidden: You are not a participant of this classroom"}), 403

    UPLOAD_FOLDER_PATH = os.path.join(os.getcwd(), app.config['UPLOAD_FOLDER'])
    return send_from_directory(UPLOAD_FOLDER_PATH, file_record['stored_name'], as_attachment=True, download_name=file_record['original_name'])


@app.route('/api/assessments', methods=['POST'])
def create_assessment_v1(): # Renamed to avoid conflict with the other create_assessment
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can create assessments."}), 401

    data = request.json
    class_room_id = data.get('classroomId')
    title = data.get('title')
    description = data.get('description')
    scheduled_at_str = data.get('scheduled_at') # New: "YYYY-MM-DDTHH:MM"
    duration_minutes = data.get('duration_minutes') # New: integer

    if not all([class_room_id, title, scheduled_at_str, duration_minutes is not None]):
        return jsonify({"error": "Missing required fields: classroomId, title, scheduled_at, or duration_minutes"}), 400
    
    try:
        # Parse the scheduled_at string into a datetime object
        scheduled_at = datetime.fromisoformat(scheduled_at_str)
    except ValueError:
        return jsonify({"error": "Invalid scheduled_at format. Expected YYYY-MM-DDTHH:MM"}), 400

    if not isinstance(duration_minutes, int) or duration_minutes <= 0:
        return jsonify({"error": "Duration must be a positive integer"}), 400

    assessment_id = str(uuid.uuid4())
    
    # Insert assessment details (without questions initially)
    assessments_collection.insert_one({
        "id": assessment_id,
        "classroomId": class_room_id,
        "title": title,
        "description": description,
        "scheduled_at": scheduled_at, # Store as datetime object
        "duration_minutes": duration_minutes, # Store as integer
        "creator_id": user_id,
        "creator_username": username,
        "creator_role": user_role, # Store creator's role
        "created_at": datetime.utcnow()
    })

    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"Admin {session.get('username')} created a new assessment: '{title}'."
    }, room=class_room_id)

    print(f"Assessment '{title}' created by {username} in classroom {class_room_id}")
    return jsonify({"message": "Assessment created successfully", "id": assessment_id}), 201

@app.route('/api/assessments/<assessmentId>/questions', methods=['POST'])
def add_questions_to_assessment_v1(assessmentId): # Renamed
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


@app.route('/api/classrooms/<classroomId>/assessments', methods=['POST'])
@teacher_or_admin_required
def create_assessment(classroomId): # From server (1).py
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

@app.route('/api/assessments/<classroomId>', methods=['GET'])
def get_assessments_v1(classroomId): # Renamed
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

@app.route('/api/classrooms/<classroomId>/assessments', methods=['GET'])
@login_required
def get_assessments(classroomId): # From server (1).py
    user_id = get_user_id()
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        return jsonify({"message": "Forbidden: Not a participant of this classroom"}), 403

    assessments = list(assessments_collection.find({"classroomId": classroomId}))
    for assessment in assessments:
        assessment['_id'] = str(assessment['_id'])
    return jsonify({"assessments": assessments}), 200

@app.route('/api/assessments/<assessmentId>', methods=['GET'])
def get_assessment_details_v1(assessmentId): # Renamed
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

@app.route('/api/classrooms/<classroomId>/assessments/<assessmentId>', methods=['GET'])
@login_required
def get_single_assessment(classroomId, assessmentId): # From server (1).py
    user_id = get_user_id()
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        return jsonify({"message": "Forbidden: Not a participant of this classroom"}), 403
    assessment = assessments_collection.find_one({"id": assessmentId, "classroomId": classroomId})
    if not assessment:
        return jsonify({"message": "Assessment not found"}), 404
    assessment['_id'] = str(assessment['_id'])
    return jsonify({"assessment": assessment}), 200

@app.route('/api/assessments/<assessmentId>/submit', methods=['POST'])
def submit_assessment_v1(): # Renamed
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
                if question.get('question_type') == 'mcq' or question.get('type') == 'mcq': # Use the correct_answer from the DB, not client-provided
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

@app.route('/api/classrooms/<classroomId>/assessments/<assessmentId>/submit', methods=['POST'])
@login_required
def submit_assessment(classroomId, assessmentId): # From server (1).py
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
    
    submissions_collection.insert_one({
        "assessmentId": assessmentId,
        "classroomId": classroomId,
        "userId": user_id,
        "username": username,
        "answers": answers,
        "score": score,
        "total_questions": total_questions,
        "submitted_at": datetime.utcnow()
    })
    return jsonify({"message": "Assessment submitted successfully", "score": score, "total_questions": total_questions}), 200

@app.route('/api/assessments/<assessmentId>/submissions', methods=['GET'])
def get_assessment_submissions_v1(assessmentId): # From server.py
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Only admins or the original creator can view all submissions for an assessment
    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    if user_role not in ['admin'] and assessment.get('creator_id') != user_id: # Modified to 'admin'
        return jsonify({"error": "Forbidden: Only administrators or the creator can view all submissions."}), 403

    submissions = list(assessment_submissions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))
    
    for submission in submissions:
        if 'submitted_at' in submission and isinstance(submission['submitted_at'], datetime):
            submission['submitted_at'] = submission['submitted_at'].isoformat()
    
    print(f"Fetched {len(submissions)} submissions for assessment {assessmentId}")
    return jsonify(submissions), 200

@app.route('/api/classrooms/<classroomId>/assessments/<assessmentId>', methods=['DELETE'])
@teacher_or_admin_required
def delete_assessment(classroomId, assessmentId): # From server (1).py
    assessment = assessments_collection.find_one({"id": assessmentId, "classroomId": classroomId})
    if not assessment:
        return jsonify({"message": "Assessment not found or you don't have permission"}), 404
    # Optionally delete associated submissions
    submissions_collection.delete_many({"assessmentId": assessmentId})
    result = assessments_collection.delete_one({"id": assessmentId})
    if result.deleted_count > 0:
        return jsonify({"message": "Assessment deleted successfully"}), 200
    return jsonify({"message": "Failed to delete assessment"}), 500

# SocketIO Events (combined and de-duplicated)
active_sockets = {} # {sid: user_id} mapping (from server (1).py)
socket_to_user = {} # {sid: user_id} (from server.py)
user_to_socket = {} # {user_id: sid} (from server.py)


@socketio.on('connect')
def handle_connect():
    user_id = session.get('user_id')
    if user_id:
        active_sockets[request.sid] = user_id # From server (1).py
        socket_to_user[request.sid] = user_id # From server.py
        user_to_socket[user_id] = request.sid # From server.py
        print(f"Client {request.sid} connected and mapped to user {user_id}")
    else:
        print(f"Client {request.sid} connected (unauthenticated)")

@socketio.on('disconnect')
def handle_disconnect():
    user_id = socket_to_user.pop(request.sid, None) # From server.py
    if user_id:
        user_to_socket.pop(user_id, None) # From server.py
        active_sockets.pop(request.sid, None) # From server (1).py
        print(f"Client {request.sid} (user {user_id}) disconnected.")
        # Broadcast to classrooms that this user has left
        for room_id in rooms(request.sid):
            if room_id != request.sid: # Don't send to self room
                emit('user_left', {'user_id': user_id, 'sid': request.sid, 'message': f'User {user_id} has left the room.'}, room=room_id, include_sid=False)
                print(f"Signaling user {user_id} left room {room_id}")
    else:
        print(f"Client {request.sid} disconnected (unauthenticated).")

@socketio.on('join_classroom')
def handle_join_classroom(data):
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    if not all([classroomId, user_id, username]):
        print(f"Missing data for join_classroom: {data}")
        return

    join_room(classroomId)
    print(f"User {username} ({user_id}) joined classroom {classroomId} (SID: {request.sid})")
    
    # Announce new participant to the classroom
    emit('participant_joined', {
        'user_id': user_id,
        'username': username,
        'role': user_role,
        'sid': request.sid,
        'message': f'{username} has joined the classroom.'
    }, room=classroomId, include_sid=False) # Broadcast to everyone in the room except the sender

    # Send current whiteboard state to the newly joined user (from server.py)
    latest_state = whiteboard_collection.find_one(
        {"classroomId": classroomId},
        sort=[('timestamp', -1)]
    )
    if latest_state:
        emit('whiteboard_state', {'state': latest_state['state'], 'page': latest_state.get('page', 0)}, room=request.sid)
        print(f"Sent latest whiteboard state to {username} in classroom {classroomId}")

@socketio.on('leave_classroom')
def handle_leave_classroom(data):
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    username = session.get('username')

    if not all([classroomId, user_id, username]):
        print(f"Missing data for leave_classroom: {data}")
        return

    leave_room(classroomId)
    print(f"User {username} ({user_id}) left classroom {classroomId} (SID: {request.sid})")
    
    # Announce participant left to the classroom
    emit('participant_left', {
        'user_id': user_id,
        'username': username,
        'sid': request.sid,
        'message': f'{username} has left the classroom.'
    }, room=classroomId, include_sid=False)


@socketio.on('chat_message')
def handle_chat_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    sender_id = session.get('user_id')
    sender_username = session.get('username')

    if not all([classroomId, message, sender_id, sender_username]):
        print(f"Missing data for chat_message: {data}")
        return

    chat_messages_collection.insert_one({
        "classroomId": classroomId,
        "sender_id": sender_id,
        "sender_username": sender_username,
        "message": message,
        "timestamp": datetime.utcnow()
    })

    # Broadcast message to everyone in the classroom
    emit('new_chat_message', {
        'sender_id': sender_id,
        'sender_username': sender_username,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }, room=classroomId)
    print(f"Chat message from {sender_username} in {classroomId}: {message}")

@socketio.on('get_chat_history')
def get_chat_history(data):
    classroomId = data.get('classroomId')
    if not classroomId:
        return

    # Fetch last 50 messages for the classroom, sorted by timestamp
    messages = list(chat_messages_collection.find(
        {"classroomId": classroomId},
        {"_id": 0}
    ).sort("timestamp", 1).limit(50)) # Sort ascending for history

    # Convert datetime objects to ISO format strings
    for msg in messages:
        if isinstance(msg.get('timestamp'), datetime):
            msg['timestamp'] = msg['timestamp'].isoformat()
    
    emit('chat_history', {'messages': messages}, room=request.sid)
    print(f"Sent chat history for classroom {classroomId} to {request.sid}")


@socketio.on('draw_event')
def handle_draw_event(data):
    classroomId = data.get('classroomId')
    drawing_data = data.get('drawingData')
    page = data.get('page', 0) # Page number for whiteboard (from server.py)
    
    if not all([classroomId, drawing_data]):
        print(f"Missing data for draw_event: {data}")
        return

    # Update the whiteboard state in the database for the specific page
    # This will either insert a new document or update an existing one
    whiteboard_collection.update_one( # Using whiteboard_collection from server.py
        {"classroomId": classroomId, "page": page},
        {"$set": {"state": drawing_data, "timestamp": datetime.utcnow()}},
        upsert=True
    )
    
    # Broadcast the drawing event to all other clients in the classroom (from server.py)
    emit('draw_event', {'drawingData': drawing_data, 'page': page}, room=classroomId, include_sid=False)
    print(f"Whiteboard drawing event for classroom {classroomId}, page {page}")

@socketio.on('clear_whiteboard')
def handle_clear_whiteboard(data): # From server.py
    classroomId = data.get('classroomId')
    page = data.get('page', 0)
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not classroomId:
        print(f"Missing classroomId for clear_whiteboard: {data}")
        return

    # Only admins or teachers should be able to clear the whiteboard
    if user_role not in ['admin', 'teacher']:
        emit('error', {'message': 'Forbidden: Only administrators or teachers can clear the whiteboard.'}, room=request.sid)
        print(f"Unauthorized clear whiteboard attempt by {user_id} in {classroomId}")
        return

    # Delete the drawing state for the specific page
    whiteboard_collection.delete_one({"classroomId": classroomId, "page": page})
    
    # Broadcast clear event to all clients in the classroom for the specific page
    emit('clear_whiteboard', {'page': page}, room=classroomId, include_sid=False)
    print(f"Whiteboard cleared for classroom {classroomId}, page {page} by {session.get('username')}")

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    recipient_id = data.get('recipient_id') # user_id of the recipient
    offer = data.get('offer')
    classroomId = data.get('classroomId') # Added classroomId
    sender_id = session.get('user_id') # The user_id of the offerer
    
    if not recipient_id or not offer or not classroomId:
        print(f"Missing data for webrtc_offer: {data}")
        return

    recipient_sid = user_to_socket.get(recipient_id) # Get recipient's SID (from server.py)

    if recipient_sid:
        emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id, 'classroomId': classroomId}, room=recipient_sid) # Pass classroomId
        print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId} (SID: {recipient_sid})")
    else:
        print(f"WEBRTC: Recipient {recipient_id} not found in active sockets.")
        emit('error', {'message': 'Recipient offline or not found.'}, room=request.sid)

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    recipient_id = data.get('recipient_id') # user_id of the recipient (original offerer)
    answer = data.get('answer')
    classroomId = data.get('classroomId') # Added classroomId
    sender_id = session.get('user_id') # The user_id of the answerer

    if not recipient_id or not answer or not classroomId:
        print(f"Missing data for webrtc_answer: {data}")
        return

    recipient_sid = user_to_socket.get(recipient_id)

    if recipient_sid:
        emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id, 'classroomId': classroomId}, room=recipient_sid) # Pass classroomId
        print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId} (SID: {recipient_sid})")
    else:
        print(f"WEBRTC: Recipient {recipient_id} not found in active sockets.")
        emit('error', {'message': 'Recipient offline or not found.'}, room=request.sid)


@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    recipient_id = data.get('recipient_id') # user_id of the recipient
    candidate = data.get('candidate')
    classroomId = data.get('classroomId') # Added classroomId
    sender_id = session.get('user_id') # The user_id of the sender

    if not recipient_id or not candidate or not classroomId:
        print(f"Missing data for webrtc_ice_candidate: {data}")
        return

    recipient_sid = user_to_socket.get(recipient_id) # Get recipient's SID

    if recipient_sid:
        emit('webrtc_ice_candidate', {'candidate': candidate, 'sender_id': sender_id}, room=recipient_sid)
        print(f"WEBRTC: ICE Candidate from {sender_id} to {recipient_id} in classroom {classroomId}")
    else: # From server (1).py
        print(f"WEBRTC: Recipient {recipient_id} not found in active sockets.")
        emit('error', {'message': 'Recipient offline or not found.'}, room=request.sid)


@socketio.on('webrtc_peer_disconnected')
def handle_peer_disconnected_signal(data):
    classroomId = data.get('classroomId')
    peer_id = data.get('peer_id') # This is the user_id of the peer that disconnected (from server (1).py)
    sender_sid = request.sid # The SID of the client signaling the disconnect (from server (1).py)

    if not classroomId or not peer_id:
        print(f"Missing data for webrtc_peer_disconnected: {data}")
        return
    
    # Broadcast to all others in the classroom that a peer has disconnected
    # The 'include_sid=False' means it won't be sent back to the client that emitted this.
    emit('webrtc_peer_disconnected', {'peer_id': peer_id, 'classroomId': classroomId}, room=classroomId, include_sid=False) # From server (1).py
    print(f"WEBRTC: Client {sender_sid} signaling peer {peer_id} disconnected in classroom {classroomId}")

@socketio.on('admin_action_update')
def handle_admin_action_update(data): # From server.py
    classroomId = data.get('classroomId')
    message = data.get('message')
    # Only admins can send this, but we'll re-emit to everyone in the room
    if classroomId and message:
        emit('admin_action_update', {'message': message}, room=classroomId, include_sid=False)
        print(f"Admin action update from {session.get('username')} in classroom {classroomId}: {message}")


if __name__ == '__main__':
    # When running with 'flask run' or a production WSGI server,
    # you'd typically run using 'gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 server:app'
    # For simple local development with socketio built-in server:
    # Ensure MongoDB is running on localhost:27017
    print("Starting Flask-SocketIO server...")
    socketio.run(app, debug=True, port=5000, host='0.0.0.0') # Set host to '0.0.0.0' to be accessible externally
