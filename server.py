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
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from flask_cors import CORS
from apscheduler.schedulers.gevent import GeventScheduler
from apscheduler.executors.gevent import GeventExecutor
from bson.objectid import ObjectId # For using ObjectId in MongoDB queries

# --- Flask App Configuration ---
app = Flask(__name__, static_folder='.')
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_for_sessions')
app.config["MONGO_URI"] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/oneclass_db')
app.permanent_session_lifetime = timedelta(days=7)

# --- CORS and SocketIO Setup ---
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}}, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent', logger=True, engineio_logger=True, manage_session=True)

# --- MongoDB Setup ---
mongo = PyMongo(app)
users_collection = mongo.db.users
classrooms_collection = mongo.db.classrooms
files_collection = mongo.db.files # from server (1).py
library_files_collection = mongo.db.library_files # from server.py (more specific)
chats_collection = mongo.db.chats # from server (1).py
chat_messages_collection = mongo.db.chat_messages # from server.py (more specific)
whiteboard_collection = mongo.db.whiteboards # from server (1).py
whiteboard_drawings_pages = mongo.db.whiteboard_drawings_pages # from server.py (more specific)
webrtc_signals_collection = mongo.db.webrtc_signals # from server (1).py (note: not used)
assessments_collection = mongo.db.assessments
submissions_collection = mongo.db.submissions # from server (1).py
assessment_questions_collection = mongo.db.assessment_questions # from server.py (more specific)
assessment_submissions_collection = mongo.db.assessment_submissions # from server.py (more specific)

# Ensure necessary directories exist for file uploads
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Background Task Scheduler Setup ---
scheduler = GeventScheduler()
scheduler.add_executor(GeventExecutor, 'default') # This line is redundant but here for clarity.
def delete_old_classrooms():
    """
    Deletes classrooms that have not been active for a period of time.
    For this example, we'll use a simple time-based check.
    """
    # Placeholder for logic. In a real app, you'd use a timestamp.
    pass

scheduler.add_job(delete_old_classrooms, 'interval', minutes=60) # Run every hour
scheduler.start()

# --- API Endpoints ---
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/classroom/<classroomId>')
def serve_classroom_page(classroomId):
    return send_from_directory('.', 'index.html')

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')

    if not all([username, email, password]):
        return jsonify({"message": "Username, email, and password are required"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User with that email already exists"}), 409

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    new_user = {
        "_id": ObjectId(),
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": role,
        "created_at": datetime.utcnow()
    }
    users_collection.insert_one(new_user)

    return jsonify({"message": "User created successfully"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"message": "Email and password are required"}), 400

    user = users_collection.find_one({"email": email})

    if user and check_password_hash(user['password'], password):
        session.permanent = True
        session['user_id'] = str(user['_id'])
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({"message": "Login successful", "user": {"id": str(user['_id']), "username": user['username'], "role": user['role']}}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route("/api/@me")
def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Not authenticated"}), 401
    
    user = users_collection.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if user:
        return jsonify({"user": {"id": str(user['_id']), "username": user['username'], "role": user['role']}}), 200
    else:
        return jsonify({"message": "User not found"}), 404

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

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
        {"_id": ObjectId(user_id)},
        {"$set": {"username": new_username, "updated_at": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404
    if result.modified_count == 0:
        return jsonify({"message": "No changes made"}), 200
    
    session['username'] = new_username
    print(f"Profile for {user_id} updated to username: {new_username}")
    return jsonify({"message": "Profile updated successfully"}), 200

@app.route("/api/classrooms", methods=["POST"])
def create_classroom():
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"message": "Unauthorized: Only administrators can create classrooms"}), 401
    
    data = request.json
    name = data.get('name')
    if not name:
        return jsonify({"message": "Classroom name is required"}), 400
    
    existing_classroom = classrooms_collection.find_one({"name": name, "creator_id": ObjectId(user_id)})
    if existing_classroom:
        return jsonify({"message": "A classroom with this name already exists"}), 409

    new_classroom = {
        "_id": ObjectId(),
        "name": name,
        "creator_id": ObjectId(user_id),
        "creator_username": username,
        "created_at": datetime.utcnow(),
        "members": [{"id": ObjectId(user_id), "role": "admin"}]
    }
    classrooms_collection.insert_one(new_classroom)
    
    socketio.emit('admin_action_update', {
        'classroomId': str(new_classroom['_id']),
        'message': f"Admin {username} created a new classroom: '{name}'."
    })
    
    return jsonify({"message": "Classroom created successfully", "classroom_id": str(new_classroom['_id'])}), 201

@app.route("/api/classrooms/<classroomId>", methods=["GET"])
def get_classroom(classroomId):
    classroom = classrooms_collection.find_one({"_id": ObjectId(classroomId)})
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404
    
    return jsonify({
        "classroom_id": str(classroom['_id']),
        "name": classroom['name'],
        "creator_username": classroom['creator_username'],
        "members": [{"id": str(m['id']), "role": m['role']} for m in classroom['members']]
    }), 200

@app.route("/api/classrooms", methods=["GET"])
def get_classrooms():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    
    classrooms = list(classrooms_collection.find({"members.id": ObjectId(user_id)}))
    return jsonify([{
        "classroom_id": str(c['_id']),
        "name": c['name'],
        "creator_username": c['creator_username']
    } for c in classrooms]), 200

@app.route("/api/classrooms/<classroomId>/join", methods=["POST"])
def join_classroom():
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.json
    classroomId = data.get('classroomId')
    if not classroomId:
        return jsonify({"message": "Classroom ID is required"}), 400

    classroom = classrooms_collection.find_one({"_id": ObjectId(classroomId)})
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404
    
    if any(member['id'] == ObjectId(user_id) for member in classroom['members']):
        return jsonify({"message": "Already a member of this classroom"}), 200
    
    classrooms_collection.update_one(
        {"_id": ObjectId(classroomId)},
        {"$push": {"members": {"id": ObjectId(user_id), "role": user_role}}}
    )
    
    socketio.emit('admin_action_update', {
        'classroomId': classroomId,
        'message': f"User {session.get('username')} joined classroom '{classroom.get('name')}'."
    }, room=classroomId)

    return jsonify({"message": "Joined classroom successfully"}), 200

@app.route('/api/upload-library-files', methods=['POST'])
def upload_library_files():
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
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
            filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            file_id = str(uuid.uuid4())
            library_files_collection.insert_one({
                "id": file_id,
                "classroomId": class_room_id,
                "original_filename": file.filename,
                "stored_filename": filename,
                "url": f"/uploads/{filename}",
                "uploaded_at": datetime.utcnow(),
                "uploaded_by": user_id
            })
            uploaded_file_info.append({"id": file_id, "filename": file.filename, "url": f"/uploads/{filename}"})
    
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"Admin {session.get('username')} uploaded new file(s) to the library."
    }, room=class_room_id)

    print(f"Files uploaded to classroom {class_room_id} by {session.get('username')}")
    return jsonify({"message": "Files uploaded successfully", "files": uploaded_file_info}), 201

@app.route("/api/library-files/<classroomId>", methods=["GET"])
def get_library_files(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0}))
    for file in files:
        if 'original_filename' in file:
            file['filename'] = file.pop('original_filename')
    print(f"Fetched {len(files)} library files for classroom {classroomId}")
    return jsonify(files), 200

@app.route("/api/library-files/<fileId>", methods=["DELETE"])
def delete_library_file(fileId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized"}), 401
    
    file_data = library_files_collection.find_one({"id": fileId})
    if not file_data:
        return jsonify({"error": "File not found"}), 404

    classroom_id = file_data.get('classroomId')
    classroom = classrooms_collection.find_one({"_id": ObjectId(classroom_id)})
    if not classroom or not any(member['id'] == ObjectId(user_id) and member['role'] == 'admin' for member in classroom['members']):
        return jsonify({"message": "Forbidden"}), 403

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file_data['stored_filename'])
    if os.path.exists(filepath):
        os.remove(filepath)
    
    result = library_files_collection.delete_one({"id": fileId})
    if result.deleted_count > 0:
        socketio.emit('admin_action_update', {
            'classroomId': classroom_id,
            'message': f"Admin {session.get('username')} deleted file '{file_data.get('original_filename', file_data.get('filename'))}' from the library."
        }, room=classroom_id)
        print(f"File {fileId} deleted by {session.get('username')}")
        return jsonify({"message": "File deleted successfully"}), 200
    print(f"Attempted to delete file {fileId} but not found in DB.")
    return jsonify({"error": "File not found"}), 404

# --- Assessment Endpoints ---
@app.route("/api/assessments", methods=["POST"])
def create_assessment():
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.json
    title = data.get('title')
    classroom_id = data.get('classroomId')
    questions = data.get('questions')
    
    if not all([title, classroom_id, questions]):
        return jsonify({"message": "Missing required fields"}), 400

    new_assessment = {
        "_id": ObjectId(),
        "title": title,
        "classroomId": classroom_id,
        "questions": questions,
        "creator_id": ObjectId(user_id),
        "created_at": datetime.utcnow()
    }
    assessments_collection.insert_one(new_assessment)
    return jsonify({"message": "Assessment created successfully"}), 201

@app.route("/api/assessments/<classroomId>", methods=["GET"])
def get_assessments(classroomId):
    assessments = list(assessments_collection.find({"classroomId": classroomId}))
    return jsonify([{
        "id": str(a['_id']),
        "title": a['title'],
        "creator_id": str(a['creator_id'])
    } for a in assessments]), 200

@app.route("/api/assessments/<assessmentId>/questions", methods=["GET"])
def get_assessment_questions(assessmentId):
    assessment = assessments_collection.find_one({"_id": ObjectId(assessmentId)})
    if not assessment:
        return jsonify({"message": "Assessment not found"}), 404
    
    return jsonify({"questions": assessment['questions']}), 200

@app.route("/api/assessments/<assessmentId>/submit", methods=["POST"])
def submit_assessment():
    user_id = session.get('user_id')
    username = session.get('username')
    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.json
    assessmentId = data.get('assessmentId')
    answers = data.get('answers')
    
    new_submission = {
        "assessmentId": ObjectId(assessmentId),
        "studentId": ObjectId(user_id),
        "answers": answers,
        "submitted_at": datetime.utcnow()
    }
    submissions_collection.insert_one(new_submission)
    return jsonify({"message": "Submission successful"}), 201

@app.route("/api/assessments/<assessmentId>/submissions", methods=["GET"])
def get_assessment_submissions(assessmentId):
    user_role = session.get('role')
    if user_role != 'admin':
        return jsonify({"message": "Unauthorized"}), 401
    
    submissions = list(submissions_collection.find({"assessmentId": ObjectId(assessmentId)}))
    return jsonify([{
        "submissionId": str(s['_id']),
        "studentId": str(s['studentId']),
        "answers": s['answers'],
        "submitted_at": s['submitted_at']
    } for s in submissions]), 200

# --- Socket.IO Event Handlers ---
@socketio.on('connect')
def connect():
    user_id = session.get('user_id')
    username = session.get('username')
    if user_id:
        print(f"Client connected: {username} ({user_id}), SID: {request.sid}")
        session['sid'] = request.sid
        join_room(user_id)
        print(f"User {username} ({user_id}) joined personal room: {user_id}")
    else:
        print(f"Unauthenticated client connected, SID: {request.sid}")

@socketio.on('disconnect')
def disconnect():
    user_id = session.get('user_id')
    username = session.get('username')
    sid = request.sid

    print(f"Client disconnected: {username} ({user_id}), SID: {sid}")
    
    classroomId_to_leave = None
    for room_id in rooms(sid):
        if room_id != sid and room_id != request.sid and room_id != user_id:
            if len(room_id) == 36 and '-' in room_id:
                classroomId_to_leave = room_id
                break
    
    if classroomId_to_leave:
        leave_room(classroomId_to_leave)
        emit('user_left', {'username': username, 'sid': sid}, room=classroomId_to_leave, include_sid=False)
        emit('webrtc_peer_disconnected', {'peer_id': sid}, room=classroomId_to_leave, include_sid=False)
        print(f"User {username} ({sid}) left classroom {classroomId_to_leave} due to disconnect.")

@socketio.on('join_classroom')
def handle_join_classroom(data):
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    username = session.get('username')
    
    if not classroomId or not user_id:
        emit('join_error', {'message': 'Classroom ID or user not authenticated.'})
        return
        
    classroom = classrooms_collection.find_one({"_id": ObjectId(classroomId)})
    if not classroom or not any(str(m['id']) == user_id for m in classroom['members']):
        emit('join_error', {'message': 'User is not a member of this classroom.'})
        return

    join_room(classroomId)
    
    chat_history = list(chats_collection.find({'classroomId': classroomId}).sort('timestamp', 1))
    emit('chat_history', {'messages': chat_history}, room=request.sid)

    whiteboard_state = whiteboard_collection.find_one({'classroomId': classroomId})
    if whiteboard_state:
        emit('whiteboard_state', {'data': whiteboard_state['data']}, room=request.sid)

    emit('status_message', {'message': f'{username} has joined the room.'}, room=classroomId)
    print(f"User {username} joined room {classroomId}")

@socketio.on('leave_classroom')
def handle_leave_classroom(data):
    classroomId = data.get('classroomId')
    username = session.get('username')
    leave_room(classroomId)
    emit('status_message', {'message': f'{username} has left the room.'}, room=classroomId)
    print(f"User {username} left room {classroomId}")

@socketio.on('chat_message')
def handle_chat_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    user_id = session.get('user_id')
    username = session.get('username')
    
    if not all([classroomId, message, user_id, username]):
        return
    
    chat_doc = {
        'classroomId': classroomId,
        'user_id': user_id,
        'username': username,
        'message': message,
        'timestamp': datetime.utcnow()
    }

    chats_collection.insert_one(chat_doc)
    
    emit('chat_message', chat_doc, room=classroomId)

@socketio.on('whiteboard_message')
def handle_whiteboard_message(data):
    classroomId = data.get('classroomId')
    whiteboard_data = data.get('data')
    user_id = session.get('user_id')
    username = session.get('username')

    if not all([classroomId, whiteboard_data, user_id, username]):
        return

    whiteboard_collection.update_one(
        {'classroomId': classroomId},
        {'$set': {
            'data': whiteboard_data,
            'last_modified_by_id': user_id,
            'last_modified_by_username': username,
            'timestamp': datetime.utcnow()
        }},
        upsert=True
    )
    
    emit('whiteboard_state', {'data': whiteboard_data}, room=classroomId, include_sid=False)

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    classroomId = data.get('classroomId')
    offer = data.get('offer')
    recipient_id = data.get('recipient_id')
    sender_id = request.sid
    
    if not all([classroomId, offer, recipient_id, sender_id]):
        print(f"Missing data for webrtc_offer: {data}")
        return
    
    emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    classroomId = data.get('classroomId')
    answer = data.get('answer')
    recipient_id = data.get('recipient_id')
    sender_id = request.sid

    if not all([classroomId, answer, recipient_id, sender_id]):
        print(f"Missing data for webrtc_answer: {data}")
        return

    emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    classroomId = data.get('classroomId')
    candidate = data.get('candidate')
    recipient_id = data.get('recipient_id')
    sender_id = request.sid

    if not all([classroomId, candidate, recipient_id, sender_id]):
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
    if classroomId and message:
        emit('admin_action_update', {'message': message}, room=classroomId, include_sid=False)
        print(f"Admin action update from {session.get('username')} in {classroomId}: {message}")

# --- Main Run Block ---
if __name__ == '__main__':
    print("Server running on http://localhost:5000 (with Socket.IO)")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
