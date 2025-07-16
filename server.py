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
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS # Import CORS

app = Flask(__name__, static_folder='.') # Serve static files from current directory

# --- Flask App Configuration ---
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_for_sessions') # Needed for sessions
app.config["MONGO_URI"] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/oneclass_db')
app.permanent_session_lifetime = timedelta(days=7) # Session lasts for 7 days

# --- CORS and SocketIO Setup ---
# CORS allows cross-origin requests, essential for frontend-backend communication in development
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True) # Allow all origins for dev
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent', logger=True, engineio_logger=True) # Use gevent async_mode

mongo = PyMongo(app) # Initialize PyMongo after app config

# MongoDB Collections
users_collection = mongo.db.users
classrooms_collection = mongo.db.classrooms
library_files_collection = mongo.db.library_files
assessments_collection = mongo.db.assessments

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
    # You might want to fetch classroom details here and pass them to the template
    # For now, we'll just serve index.html and let app.js handle the routing
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
    session.permanent = True # Make session permanent

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
    session.pop('user_id', None)
    session.pop('username', None)
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/update-profile', methods=['POST'])
# This endpoint would ideally require authentication (e.g., JWT token validation)
def update_profile():
    # Use session to get user_id if authenticated
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
    return jsonify({"message": "Profile updated successfully"}), 200

@app.route('/api/upload-library-files', methods=['POST'])
# This endpoint would ideally require authentication (e.g., JWT token validation)
def upload_library_files():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

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

            library_files_collection.insert_one({
                "classroomId": class_room_id,
                "original_filename": file.filename,
                "stored_filename": filename,
                "url": f"/uploads/{filename}",
                "uploaded_at": datetime.utcnow(),
                "uploaded_by": user_id
            })
            uploaded_file_info.append({"filename": file.filename, "url": f"/uploads/{filename}"})
    return jsonify({"message": "Files uploaded successfully", "files": uploaded_file_info}), 201

@app.route('/api/library-files/<classroomId>', methods=['GET'])
def get_library_files(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0, "original_filename": 1, "url": 1}))
    # Rename 'original_filename' to 'filename' for client consistency
    for file in files:
        file['filename'] = file.pop('original_filename')
    return jsonify(files), 200

@app.route('/api/create-assessment', methods=['POST'])
def create_assessment():
    user_id = session.get('user_id')
    username = session.get('username')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    class_room_id = data.get('classroomId')
    title = data.get('title')
    description = data.get('description')
    # creator = data.get('creator') # Use session username instead

    if not all([class_room_id, title]):
        return jsonify({"error": "Missing required fields"}), 400

    assessment_id = str(uuid.uuid4())
    assessments_collection.insert_one({
        "id": assessment_id,
        "classroomId": class_room_id,
        "title": title,
        "description": description,
        "creator_id": user_id,
        "creator_username": username,
        "created_at": datetime.utcnow()
    })
    return jsonify({"message": "Assessment created successfully", "id": assessment_id}), 201

@app.route('/api/assessments/<classroomId>', methods=['GET'])
def get_assessments(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"_id": 0}))
    return jsonify(assessments), 200

@app.route('/api/create-classroom', methods=['POST'])
def create_classroom():
    user_id = session.get('user_id')
    username = session.get('username')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

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
    return jsonify({"message": "Classroom created successfully", "classroom": {"id": classroom_id, "name": classroom_name}}), 201

@app.route('/api/classrooms', methods=['GET'])
def get_classrooms():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Get classrooms where the current user is either the creator or a participant
    user_classrooms = list(classrooms_collection.find(
        {"$or": [{"creator_id": user_id}, {"participants": user_id}]},
        {"_id": 0} # Exclude MongoDB's default _id field
    ))
    return jsonify(user_classrooms), 200

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
        socketio.emit('participant_join', {'username': session.get('username'), 'classroomId': classroom_id}, room=classroom_id)
        return jsonify({"message": "Joined classroom successfully", "classroom": {"id": classroom_id, "name": classroom.get('name')}}), 200
    else:
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

    return jsonify({"share_link": share_link}), 200

# --- Socket.IO Event Handlers ---

@socketio.on('connect')
def connect():
    user_id = session.get('user_id')
    username = session.get('username')
    if user_id:
        print(f"Client connected: {username} ({user_id})")
        # Store sid for user to map them
        session['sid'] = request.sid
        # You might want to store a mapping of user_id to sid if needed
    else:
        print("Unauthenticated client connected")

@socketio.on('disconnect')
def disconnect():
    user_id = session.get('user_id')
    username = session.get('username')
    if user_id:
        print(f"Client disconnected: {username} ({user_id})")
        # In a real app, you'd remove them from active rooms and notify others
    else:
        print("Unauthenticated client disconnected")

@socketio.on('join_room')
def on_join(data):
    classroomId = data.get('classroomId')
    username = session.get('username') # Get username from session
    user_id = session.get('user_id') # Get user_id from session

    if not classroomId or not username or not user_id:
        print("Missing data for join_room or user not authenticated.")
        return

    join_room(classroomId)
    print(f"{username} ({user_id}) joined room: {classroomId}")

    # Optionally, broadcast to others in the room
    emit('participant_join', {'username': username, 'user_id': user_id}, room=classroomId, include_sid=False) # Exclude sender


@socketio.on('leave_room')
def on_leave(data):
    classroomId = data.get('classroomId')
    username = session.get('username')

    if not classroomId or not username:
        return

    leave_room(classroomId)
    print(f"{username} left room: {classroomId}")
    emit('participant_leave', {'username': username}, room=classroomId, include_sid=False) # Exclude sender


@socketio.on('chat_message')
def handle_chat_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    username = session.get('username') # Get username from session
    user_id = session.get('user_id') # Get user_id from session

    if not classroomId or not message or not username or not user_id:
        print("Missing chat message data.")
        return

    timestamp = datetime.now().strftime('%H:%M')
    emit('chat_message', {
        'user_id': user_id,
        'username': username,
        'message': message,
        'timestamp': timestamp
    }, room=classroomId)


@socketio.on('whiteboard_data')
def handle_whiteboard_data(data):
    classroomId = data.get('classroomId')
    if not classroomId:
        print("Missing classroomId for whiteboard data.")
        return

    # Broadcast whiteboard data to all other clients in the same room
    # The client that sent the data already has it, so no need to send back
    emit('whiteboard_data', data, room=classroomId, include_sid=False)

@socketio.on('start_broadcast')
def handle_start_broadcast(data):
    classroomId = data.get('classroomId')
    peer_id = data.get('peer_id')
    if not classroomId or not peer_id:
        return

    emit('webrtc_offer', {'peer_id': peer_id}, room=classroomId, include_sid=False)

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    classroomId = data.get('classroomId')
    recipient_id = data.get('recipient_id')
    offer = data.get('offer')
    sender_id = request.sid

    if not classroomId or not recipient_id or not offer:
        return

    emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id}, room=recipient_id)


@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    classroomId = data.get('classroomId')
    recipient_id = data.get('recipient_id')
    answer = data.get('answer')
    sender_id = request.sid

    if not classroomId or not recipient_id or not answer:
        return

    emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id}, room=recipient_id)


@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    classroomId = data.get('classroomId')
    recipient_id = data.get('recipient_id')
    candidate = data.get('candidate')
    sender_id = request.sid

    if not classroomId or not recipient_id or not candidate:
        return

    emit('webrtc_ice_candidate', {'candidate': candidate, 'sender_id': sender_id}, room=recipient_id)


@socketio.on('webrtc_peer_disconnected')
def handle_peer_disconnected(data):
    classroomId = data.get('classroomId')
    peer_id = data.get('peer_id')
    if not classroomId or not peer_id:
        return
    emit('webrtc_peer_disconnected', {'peer_id': peer_id}, room=classroomId, include_sid=False)


# --- Main Run Block ---
if __name__ == '__main__':
    # When using Flask-SocketIO with gevent, you run the SocketIO instance
    # directly using socketio.run, which wraps the WSGI server.
    print("Server running on http://localhost:5000 (with Socket.IO)")
    socketio.run(app, debug=True, port=5000, host='0.0.0.0')

    # Remember to install: pip install Flask Flask-PyMongo Flask-SocketIO Werkzeug gevent python-dotenv
    # (python-dotenv for .env file in dev)
