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

# --- Configuration and App Setup ---
app = Flask(__name__)
# WARNING: Change this secret key!
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "A_SUPER_SECRET_KEY_THAT_SHOULD_BE_CHANGED_IN_PROD")

# Secure CORS configuration:
# Replace '*' with a specific list of your allowed front-end domains in production.
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5000", "http://localhost:5000"], "supports_credentials": True}})

# Socket.IO setup
# Async mode is set to 'gevent' as this is often used with Flask-SocketIO for performance.
socketio = SocketIO(app, cors_allowed_origins=["http://127.0.0.1:5000", "http://localhost:5000"], manage_session=True, async_mode='gevent')

# MongoDB client setup
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client.virtual_classroom_db

# Collections
users_collection = db.users
classrooms_collection = db.classrooms
chat_history_collection = db.chat_history
whiteboard_history_collection = db.whiteboard_history
library_files_collection = db.library_files
assessments_collection = db.assessments
submissions_collection = db.submissions


# --- Helper Functions ---
def is_authenticated():
    return 'user_id' in session

def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user['id'] = str(user['_id'])
        del user['_id']
    return user

def is_classroom_participant(classroomId, userId):
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return False
    # Check if the user is the creator or in the participants list
    return str(userId) == classroom['creator_id'] or str(userId) in classroom.get('participants', [])

# --- API Routes ---

@app.route('/api/register', methods=['POST'])
def register():
    """Handles new user registration with robust input validation."""
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return jsonify({"error": "Missing username, email, or password"}), 400

    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Invalid email format"}), 400
    
    # Password complexity validation
    if len(password) < 8 or not re.search(r"[a-z]", password) or not re.search(r"[A-Z]", password) or not re.search(r"\d", password):
        return jsonify({"error": "Password must be at least 8 characters and contain uppercase, lowercase, and numbers"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 409
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 409

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    user_data = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": "user"  # Default role
    }
    # First user to register is an admin
    if users_collection.count_documents({}) == 0:
        user_data['role'] = 'admin'

    users_collection.insert_one(user_data)
    return jsonify({"message": "User registered successfully!"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    """Handles user login."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not all([username, password]):
        return jsonify({"error": "Missing username or password"}), 400

    user = users_collection.find_one({"username": username})
    if user and check_password_hash(user['password'], password):
        session['user_id'] = str(user['_id'])
        user['id'] = str(user['_id'])
        del user['_id']
        del user['password']
        return jsonify({"message": "Login successful", "user": user}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logs the user out."""
    session.pop('user_id', None)
    return jsonify({"message": "Logged out"}), 200

@app.route('/api/create-classroom', methods=['POST'])
def create_classroom():
    """Admin-only: Creates a new classroom."""
    if not is_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
    
    current_user = get_current_user()
    if not current_user or current_user['role'] != 'admin':
        return jsonify({"error": "Permission denied"}), 403

    data = request.json
    name = data.get('name')
    if not name:
        return jsonify({"error": "Classroom name is required"}), 400

    new_classroom_id = str(uuid.uuid4())
    classrooms_collection.insert_one({
        "id": new_classroom_id,
        "name": name,
        "creator_id": current_user['id'],
        "participants": [current_user['id']],
        "created_at": datetime.datetime.now()
    })
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
    if not is_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    classroomId = data.get('classroomId')
    if not classroomId:
        return jsonify({"error": "Classroom ID is required"}), 400

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    user_id = session.get('user_id')
    if classroom.get('creator_id') == str(user_id) or str(user_id) in classroom.get('participants', []):
        return jsonify({"message": "Already a participant"}), 200

    classrooms_collection.update_one(
        {"id": classroomId},
        {"$push": {"participants": str(user_id)}}
    )
    return jsonify({"message": "Successfully joined classroom"}), 200

@app.route('/api/library-files/<classroomId>')
def get_library_files(classroomId):
    """Retrieves a list of files for a specific classroom."""
    if not is_authenticated() or not is_classroom_participant(classroomId, session.get('user_id')):
        return jsonify({"error": "Unauthorized or not a participant"}), 401
    
    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0}))
    return jsonify(files), 200

@app.route('/api/upload-library-files', methods=['POST'])
def upload_library_files():
    """Admin-only: Uploads files to the classroom library."""
    if not is_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
    
    current_user = get_current_user()
    if not current_user or current_user['role'] != 'admin':
        return jsonify({"error": "Permission denied"}), 403

    classroomId = request.form.get('classroomId')
    if not classroomId:
        return jsonify({"error": "Classroom ID is missing"}), 400
    
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    files = request.files.getlist('files')
    if not files:
        return jsonify({"error": "No files selected"}), 400

    file_directory = os.path.join(app.root_path, 'uploads', classroomId)
    os.makedirs(file_directory, exist_ok=True)

    for file in files:
        if file.filename == '':
            continue
        filename = file.filename
        filepath = os.path.join(file_directory, filename)
        file.save(filepath)
        library_files_collection.insert_one({
            "classroomId": classroomId,
            "filename": filename,
            "filepath": f"/uploads/{classroomId}/{filename}",
            "uploaded_by": current_user['username'],
            "uploaded_at": datetime.datetime.now()
        })
    
    # Notify classroom about new files
    socketio.emit('admin_action_update', {
        "classroomId": classroomId,
        "message": "New files have been uploaded to the library."
    }, room=classroomId)

    return jsonify({"message": "Files uploaded successfully"}), 201

@app.route('/uploads/<classroomId>/<filename>')
def uploaded_file(classroomId, filename):
    """Serves uploaded files."""
    file_directory = os.path.join(app.root_path, 'uploads', classroomId)
    return send_from_directory(file_directory, filename)

# --- Socket.IO Events ---

@socketio.on('connect')
def handle_connect():
    """Handles new client connections."""
    print(f"Client connected: {request.sid}")
    emit('status', {'message': 'Connected to server'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handles client disconnections."""
    print(f"Client disconnected: {request.sid}")
    # The `leave` event should be handled on the client side before disconnecting to clean up rooms.
    # The server can't reliably know which room a user was in without a persistent lookup.
    
@socketio.on('join')
def on_join(data):
    """Adds a user to a classroom's Socket.IO room."""
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')

    if not user_id or not is_classroom_participant(classroomId, user_id):
        emit('error', {'message': 'Unauthorized to join this classroom'})
        return

    join_room(classroomId)
    user = get_current_user()
    emit('user_joined', {'username': user['username'], 'role': user['role'], 'sid': request.sid}, room=classroomId)
    
    # Send chat history to the newly joined user
    chat_history = list(chat_history_collection.find({"classroomId": classroomId}).sort("timestamp", 1))
    for msg in chat_history:
        msg['_id'] = str(msg['_id'])
        msg['user_id'] = str(msg['user_id']) # Ensure ID is a string for JS
    emit('chat_history', chat_history, room=request.sid)

@socketio.on('leave')
def on_leave(data):
    """Removes a user from a classroom's Socket.IO room."""
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    
    if not user_id or not is_classroom_participant(classroomId, user_id):
        # Even if unauthorized, we can still allow them to leave the room if they were somehow in it.
        if classroomId in rooms(sid=request.sid):
            leave_room(classroomId)
        return

    leave_room(classroomId)
    user = get_current_user()
    emit('user_left', {'username': user['username'], 'sid': request.sid}, room=classroomId)
    
@socketio.on('message')
def handle_message(data):
    """Handles new chat messages."""
    classroomId = data.get('classroomId')
    message = data.get('message')
    user_id = session.get('user_id')

    if not all([classroomId, message, user_id]) or not is_classroom_participant(classroomId, user_id):
        return

    user = get_current_user()
    message_data = {
        'classroomId': classroomId,
        'username': user['username'],
        'role': user['role'],
        'user_id': user['id'],
        'message': message,
        'timestamp': datetime.datetime.now()
    }
    chat_history_collection.insert_one(message_data)
    
    emit('message', {
        'username': user['username'],
        'role': user['role'],
        'message': message,
        'timestamp': message_data['timestamp'].isoformat(),
        'user_id': user['id']
    }, room=classroomId)
    
@socketio.on('whiteboard_data')
def handle_whiteboard_data(data):
    """Handles new whiteboard drawing events and history."""
    classroomId = data.get('classroomId')
    action = data.get('action')
    pageIndex = data.get('pageIndex')
    user_id = session.get('user_id')
    user = get_current_user()
    
    # Only allow admins to send whiteboard data
    if not user or user['role'] != 'admin' or not is_classroom_participant(classroomId, user_id):
        return
        
    if action == 'draw':
        stroke_data = data.get('data')
        whiteboard_history_collection.update_one(
            {"classroomId": classroomId, "pageIndex": pageIndex},
            {"$push": {"strokes": stroke_data}},
            upsert=True
        )
        emit('whiteboard_data', data, room=classroomId, skip_sid=request.sid)

    elif action == 'clear':
        whiteboard_history_collection.update_one(
            {"classroomId": classroomId, "pageIndex": pageIndex},
            {"$set": {"strokes": []}}
        )
        emit('whiteboard_data', data, room=classroomId, skip_sid=request.sid)

@socketio.on('get_whiteboard_history')
def get_whiteboard_history(data):
    """Sends full whiteboard history to a specific client upon request."""
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    
    if not user_id or not is_classroom_participant(classroomId, user_id):
        return
    
    history_pages = list(whiteboard_history_collection.find({"classroomId": classroomId}).sort("pageIndex", 1))
    
    # Reformat the history pages into the client's expected array format
    # The client expects an array of pages, where each page is an array of strokes
    # So we need to ensure the pages are indexed correctly
    max_page_index = max([p['pageIndex'] for p in history_pages]) if history_pages else -1
    formatted_history = [[] for _ in range(max_page_index + 1)]
    for page in history_pages:
        formatted_history[page['pageIndex']] = page['strokes']

    emit('whiteboard_data', {'action': 'history', 'history': formatted_history}, room=request.sid)

@socketio.on('whiteboard_page_change')
def handle_whiteboard_page_change(data):
    """Broadcasts a whiteboard page change to all users in the classroom."""
    classroomId = data.get('classroomId')
    newPageIndex = data.get('newPageIndex')
    user_id = session.get('user_id')
    user = get_current_user()

    # Only allow admins to change the page
    if not user or user['role'] != 'admin' or not is_classroom_participant(classroomId, user_id):
        return
    
    emit('whiteboard_page_change', {'newPageIndex': newPageIndex}, room=classroomId, skip_sid=request.sid)
    
@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    """Forwards a WebRTC offer to the recipient."""
    classroomId = data.get('classroomId')
    recipient_id = data.get('recipient_id')
    user_id = session.get('user_id')
    
    if not user_id or not is_classroom_participant(classroomId, user_id):
        return

    data['sender_id'] = request.sid
    socketio.emit('webrtc_offer', data, room=recipient_id)

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    """Forwards a WebRTC answer to the recipient."""
    classroomId = data.get('classroomId')
    recipient_id = data.get('recipient_id')
    user_id = session.get('user_id')
    
    if not user_id or not is_classroom_participant(classroomId, user_id):
        return
        
    data['sender_id'] = request.sid
    socketio.emit('webrtc_answer', data, room=recipient_id)

@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    """Forwards an ICE candidate to the recipient."""
    classroomId = data.get('classroomId')
    recipient_id = data.get('recipient_id')
    user_id = session.get('user_id')
    
    if not user_id or not is_classroom_participant(classroomId, user_id):
        return

    data['sender_id'] = request.sid
    socketio.emit('webrtc_ice_candidate', data, room=recipient_id)

@socketio.on('webrtc_peer_disconnected')
def handle_webrtc_peer_disconnected(data):
    """Notifies a peer that a specific connection has been closed."""
    classroomId = data.get('classroomId')
    peer_id = data.get('peer_id')
    user_id = session.get('user_id')
    
    if not user_id or not is_classroom_participant(classroomId, user_id):
        return
    
    # Broadcast to the room, excluding the sender
    socketio.emit('webrtc_peer_disconnected', {'peer_id': request.sid}, room=classroomId, skip_sid=request.sid)


if __name__ == '__main__':
    # Add indexes for better query performance
    # This is a one-time operation. You can also do this directly in MongoDB shell.
    users_collection.create_index("username", unique=True)
    users_collection.create_index("email", unique=True)
    classrooms_collection.create_index("id", unique=True)
    classrooms_collection.create_index("creator_id")
    classrooms_collection.create_index("participants")
    chat_history_collection.create_index("classroomId")
    whiteboard_history_collection.create_index([("classroomId", 1), ("pageIndex", 1)])
    library_files_collection.create_index("classroomId")

    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
