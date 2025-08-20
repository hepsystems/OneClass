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
from bson.objectid import ObjectId
from functools import wraps
import json
import base64

app = Flask(__name__, static_folder='.') # Serve static files from current directory

# --- Flask App Configuration ---
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_for_sessions') # Needed for sessions
app.config["MONGO_URI"] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/oneclass_db')
app.permanent_session_lifetime = timedelta(days=7) # Session lasts for 7 days

# --- CORS and SocketIO Setup ---
# CORS allows cross-origin requests, essential for frontend-backend communication in development
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}}, supports_credentials=True) # Allow all origins for dev
# Use a custom logging configuration to get more detailed logs
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent', logger=True, engineio_logger=True) # Use gevent async_mode

# --- NEW: Fix for gevent/PyMongo threading conflict ---
# Initialize PyMongo in a way that is compatible with gevent.
# The `connect=False` argument prevents PyMongo from creating a connection pool
# at startup, which can cause threading issues with gevent's monkey-patching.
mongo = PyMongo(app, connect=False)
db = mongo.db # Access the database instance

def get_db():
    """Returns the database instance, ensuring a new connection is established if needed."""
    if not hasattr(app, 'mongo_db_instance'):
        # This is the point where the connection is established.
        app.mongo_db_instance = PyMongo(app).db
    return app.mongo_db_instance

# --- Helper functions ---

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Login required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Login required'}), 401
        
        db = get_db()
        user = db.users.find_one({'_id': session['user_id']})
        if not user or user.get('role') != 'admin':
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# --- User Authentication Endpoints ---

@app.route('/api/register', methods=['POST'])
def register():
    db = get_db()
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    
    if db.users.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 409
    
    # Simple logic to make the first registered user an admin
    user_count = db.users.count_documents({})
    user_role = 'admin' if user_count == 0 else 'user'
    
    hashed_password = generate_password_hash(password)
    
    new_user = {
        '_id': str(uuid.uuid4()),
        'username': username,
        'email': email,
        'password': hashed_password,
        'role': user_role
    }
    
    db.users.insert_one(new_user)
    
    return jsonify({'message': 'Registration successful'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    db = get_db()
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = db.users.find_one({'email': email})
    
    if user and check_password_hash(user['password'], password):
        session.permanent = True
        session['user_id'] = user['_id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'message': 'Login successful', 'user': {'id': user['_id'], 'username': user['username'], 'role': user['role']}}), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/user', methods=['GET'])
@login_required
def get_current_user():
    db = get_db()
    user = db.users.find_one({'_id': session['user_id']})
    if user:
        return jsonify({
            'id': user['_id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }), 200
    return jsonify({'error': 'User not found'}), 404

# --- Classroom Management Endpoints ---

@app.route('/api/classrooms', methods=['GET'])
@login_required
def get_classrooms():
    db = get_db()
    classrooms = list(db.classrooms.find({}))
    
    for classroom in classrooms:
        classroom['_id'] = str(classroom['_id'])
        classroom['id'] = classroom['_id']
        # Convert ObjectId of creator_id if it exists
        if 'creator_id' in classroom:
            classroom['creator_id'] = str(classroom['creator_id'])

    return jsonify(classrooms)

@app.route('/api/create-classroom', methods=['POST'])
@admin_required
def create_classroom():
    db = get_db()
    data = request.get_json()
    name = data.get('name')
    creator_id = session['user_id']
    
    if not name:
        return jsonify({'error': 'Classroom name is required'}), 400
    
    new_classroom = {
        'name': name,
        'creator_id': creator_id,
        'created_at': datetime.now(),
        'participants': [creator_id]
    }
    
    result = db.classrooms.insert_one(new_classroom)
    
    return jsonify({'message': 'Classroom created successfully', 'id': str(result.inserted_id)}), 201

@app.route('/api/join-classroom', methods=['POST'])
@login_required
def join_classroom():
    db = get_db()
    data = request.get_json()
    classroomId = data.get('classroomId')
    user_id = session['user_id']

    if not classroomId:
        return jsonify({'error': 'Classroom ID is required'}), 400

    try:
        # Check if the user is already a participant
        classroom = db.classrooms.find_one({'_id': ObjectId(classroomId)})
        if not classroom:
            return jsonify({'error': 'Classroom not found'}), 404
        
        if user_id in classroom.get('participants', []):
            return jsonify({'message': 'You are already a member of this classroom'}), 200

        # Add the user to the participants list
        db.classrooms.update_one(
            {'_id': ObjectId(classroomId)},
            {'$addToSet': {'participants': user_id}}
        )
        return jsonify({'message': 'Joined classroom successfully'}), 200
    except Exception as e:
        print(f"Error joining classroom: {e}")
        return jsonify({'error': 'Invalid classroom ID'}), 400

# --- File Library Endpoints ---

@app.route('/api/upload-library-files/<classroomId>', methods=['POST'])
@admin_required
def upload_library_files(classroomId):
    db = get_db()
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    
    classroom = db.classrooms.find_one({'_id': ObjectId(classroomId)})
    if not classroom:
        return jsonify({'error': 'Classroom not found'}), 404

    # Ensure a 'library' folder exists for the classroom
    upload_folder = os.path.join('library', classroomId)
    os.makedirs(upload_folder, exist_ok=True)
    
    uploaded_count = 0
    for file in files:
        if file.filename == '':
            continue
        
        filename = file.filename
        file_id = str(uuid.uuid4())
        filepath = os.path.join(upload_folder, file_id + '_' + filename)
        file.save(filepath)
        
        db.library.insert_one({
            'file_id': file_id,
            'filename': filename,
            'classroomId': classroomId,
            'filepath': filepath,
            'uploaded_by': session['user_id'],
            'uploaded_at': datetime.now()
        })
        uploaded_count += 1
    
    if uploaded_count > 0:
        return jsonify({'message': f'Successfully uploaded {uploaded_count} files.'}), 201
    else:
        return jsonify({'message': 'No files were uploaded.'}), 200


@app.route('/api/library-files/<classroomId>', methods=['GET'])
@login_required
def get_library_files(classroomId):
    db = get_db()
    files = list(db.library.find({'classroomId': classroomId}))
    
    file_list = []
    for f in files:
        file_list.append({
            'id': str(f['_id']),
            'filename': f['filename'],
            'url': f'/api/library-files/download/{f["_id"]}' # Dynamic download URL
        })
    
    return jsonify(file_list)

@app.route('/api/library-files/download/<fileId>', methods=['GET'])
@login_required
def download_library_file(fileId):
    db = get_db()
    try:
        file_data = db.library.find_one({'_id': ObjectId(fileId)})
        if not file_data:
            return jsonify({'error': 'File not found'}), 404
            
        filepath = file_data['filepath']
        directory = os.path.dirname(filepath)
        filename = os.path.basename(filepath)
        
        # Security: Prevent path traversal
        if not filepath.startswith(os.path.join('library', file_data['classroomId'])):
            return jsonify({'error': 'Invalid file path'}), 400

        return send_from_directory(directory, filename, as_attachment=True, download_name=file_data['filename'])
    except Exception as e:
        print(f"Error downloading file: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@app.route('/api/delete-library-file/<fileId>', methods=['DELETE'])
@admin_required
def delete_library_file(fileId):
    db = get_db()
    try:
        file_data = db.library.find_one({'_id': ObjectId(fileId)})
        if not file_data:
            return jsonify({'error': 'File not found'}), 404
        
        # First, delete the file from the filesystem
        try:
            os.remove(file_data['filepath'])
        except OSError as e:
            print(f"Error deleting file from disk: {e}")
            # We will proceed to delete the DB entry anyway
            
        # Then, delete the entry from the database
        db.library.delete_one({'_id': ObjectId(fileId)})
        
        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting file: {e}")
        return jsonify({'error': 'An error occurred'}), 500

# --- Assessment Endpoints ---

@app.route('/api/create-assessment', methods=['POST'])
@admin_required
def create_assessment():
    db = get_db()
    data = request.get_json()
    
    if not all(k in data for k in ['title', 'description', 'classroomId', 'questions', 'scheduledAt', 'durationMinutes']):
        return jsonify({'error': 'Missing required fields'}), 400

    new_assessment = {
        'title': data['title'],
        'description': data['description'],
        'classroomId': data['classroomId'],
        'questions': data['questions'],
        'scheduledAt': data['scheduledAt'],
        'durationMinutes': data['durationMinutes'],
        'creatorId': session['user_id'],
        'created_at': datetime.now()
    }
    
    result = db.assessments.insert_one(new_assessment)
    
    # Broadcast to all clients in the classroom that a new assessment is available
    socketio.emit('new_assessment_notification', {
        'classroomId': data['classroomId'], 
        'title': data['title'],
        'assessmentId': str(result.inserted_id)
    }, room=data['classroomId'])
    
    return jsonify({'message': 'Assessment created successfully', 'id': str(result.inserted_id)}), 201

@app.route('/api/assessments/<classroomId>', methods=['GET'])
@login_required
def get_assessments_by_classroom(classroomId):
    db = get_db()
    assessments = list(db.assessments.find({'classroomId': classroomId}))
    
    for assessment in assessments:
        assessment['_id'] = str(assessment['_id'])
    
    return jsonify(assessments)

@app.route('/api/assessments/<classroomId>/<assessmentId>', methods=['GET'])
@login_required
def get_assessment_details(classroomId, assessmentId):
    db = get_db()
    try:
        assessment = db.assessments.find_one({'_id': ObjectId(assessmentId), 'classroomId': classroomId})
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
        
        assessment['_id'] = str(assessment['_id'])
        return jsonify(assessment)
    except Exception as e:
        return jsonify({'error': 'Invalid ID'}), 400

@app.route('/api/submit-assessment', methods=['POST'])
@login_required
def submit_assessment():
    db = get_db()
    data = request.get_json()
    
    required_fields = ['assessmentId', 'classroomId', 'studentId', 'answers']
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    # Optional: You might want to add logic here to check if the submission is within the time limit
    # For now, we'll just save it.
    
    # Get the student's username for the submission record
    student = db.users.find_one({'_id': data['studentId']})
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    new_submission = {
        'assessmentId': data['assessmentId'],
        'classroomId': data['classroomId'],
        'studentId': data['studentId'],
        'student_username': student['username'],
        'answers': data['answers'],
        'submitted_at': datetime.now()
    }
    
    result = db.submissions.insert_one(new_submission)
    
    return jsonify({'message': 'Submission successful', 'id': str(result.inserted_id)}), 201

@app.route('/api/submissions/<assessmentId>', methods=['GET'])
@admin_required
def get_submissions_by_assessment(assessmentId):
    db = get_db()
    submissions = list(db.submissions.find({'assessmentId': assessmentId}))
    
    for sub in submissions:
        sub['_id'] = str(sub['_id'])
    
    return jsonify(submissions)

@app.route('/api/delete-assessment/<assessmentId>', methods=['DELETE'])
@admin_required
def delete_assessment(assessmentId):
    db = get_db()
    try:
        # Delete all submissions for this assessment first
        db.submissions.delete_many({'assessmentId': assessmentId})
        
        # Then delete the assessment itself
        result = db.assessments.delete_one({'_id': ObjectId(assessmentId)})
        
        if result.deleted_count == 1:
            return jsonify({'message': 'Assessment and all associated submissions deleted successfully'}), 200
        else:
            return jsonify({'error': 'Assessment not found'}), 404
    except Exception as e:
        print(f"Error deleting assessment: {e}")
        return jsonify({'error': 'An error occurred'}), 500


# --- Socket.IO Event Handlers ---

@socketio.on('join')
def on_join(data):
    classroomId = data.get('classroomId')
    role = data.get('role')
    user_id = session.get('user_id')
    
    if not classroomId:
        print(f"Received join request with no classroomId from {request.sid}")
        return
        
    join_room(classroomId)
    print(f"User {session.get('username')} ({user_id}) joined classroom {classroomId} with role {role}")
    emit('status', {'message': f'{session.get("username")} has joined the room.'}, room=classroomId)

@socketio.on('leave')
def on_leave(data):
    classroomId = data.get('classroomId')
    leave_room(classroomId)
    print(f"User {session.get('username')} left classroom {classroomId}")
    emit('status', {'message': f'{session.get("username")} has left the room.'}, room=classroomId)

@socketio.on('message')
def handle_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    username = session.get('username')
    user_role = session.get('role')

    if not classroomId or not message:
        return
    
    print(f"Message from {username} in room {classroomId}: {message}")
    emit('message', {'username': username, 'message': message, 'role': user_role}, room=classroomId)

@socketio.on('whiteboard_drawing')
def handle_drawing(data):
    classroomId = data.get('classroomId')
    drawing_data = data.get('drawingData')
    page_index = data.get('pageIndex')
    
    if not classroomId or not drawing_data:
        return

    # Persist drawing data to MongoDB
    db = get_db()
    
    # Store the drawing command with a unique ID and timestamp
    command_id = str(uuid.uuid4())
    drawing_data_to_save = {
        'command_id': command_id,
        'classroomId': classroomId,
        'pageIndex': page_index,
        'data': drawing_data,
        'timestamp': datetime.now()
    }
    db.whiteboard_history.insert_one(drawing_data_to_save)
    
    # Re-emit the drawing command to all other clients in the room
    emit('whiteboard_drawing', {
        'drawingData': drawing_data,
        'pageIndex': page_index
    }, room=classroomId, include_self=False)

@socketio.on('request_whiteboard_history')
def request_whiteboard_history(data):
    classroomId = data.get('classroomId')
    
    if not classroomId:
        return

    db = get_db()
    # Find the most recent whiteboard history document. This is a simplification.
    # A more robust solution would retrieve and assemble a history from a series of commands.
    
    history_cursor = db.whiteboard_history.find({'classroomId': classroomId}).sort('timestamp', -1)
    
    # Group history by page
    history_by_page = {}
    for command in history_cursor:
        page_index = command['pageIndex']
        if page_index not in history_by_page:
            history_by_page[page_index] = []
        history_by_page[page_index].append(command['data'])
    
    # Sort pages by index
    sorted_pages = sorted(history_by_page.keys())
    
    # Construct the final whiteboardPages array in the correct order
    whiteboard_pages = [history_by_page[i] for i in sorted_pages]
    
    # A more robust solution might need to determine the last active page
    # For now, we'll just set it to the last page with commands
    current_page_index = len(whiteboard_pages) - 1 if whiteboard_pages else 0
    
    emit('whiteboard_history', {
        'whiteboardPages': whiteboard_pages,
        'currentPageIndex': current_page_index
    }, room=request.sid) # Send only to the requesting client


@socketio.on('whiteboard_page_change')
def handle_page_change(data):
    classroomId = data.get('classroomId')
    new_index = data.get('newIndex')
    
    if not classroomId or new_index is None:
        return
        
    emit('whiteboard_page_change', {
        'newIndex': new_index
    }, room=classroomId, include_self=False)

# --- WebRTC Signaling Handlers ---

@socketio.on('webrtc_start_broadcast')
def handle_start_broadcast(data):
    classroomId = data.get('classroomId')
    if not classroomId: return
    
    # Get all SIDs in the room
    room_sids = rooms(request.sid)
    peer_list = [sid for sid in room_sids if sid != request.sid]
    
    # Emit the list of existing peers to the new broadcaster
    emit('webrtc_peer_list', peer_list, room=request.sid)

@socketio.on('webrtc_end_broadcast')
def handle_end_broadcast(data):
    classroomId = data.get('classroomId')
    if not classroomId: return
    
    # Emit a message to all peers in the room to signal the end of the broadcast
    emit('webrtc_peer_disconnected', {'peer_id': request.sid}, room=classroomId, include_self=False)


@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    recipient_id = data.get('recipient_id')
    offer = data.get('offer')
    classroomId = data.get('classroomId') # Added for context
    sender_id = request.sid
    
    if not recipient_id or not offer or not classroomId:
        print(f"Missing data for webrtc_offer: {data}")
        return

    emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    recipient_id = data.get('recipient_id')
    answer = data.get('answer')
    classroomId = data.get('classroomId') # Added for context
    sender_id = request.sid

    if not recipient_id or not answer or not classroomId:
        print(f"Missing data for webrtc_answer: {data}")
        return

    emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_ice_candidate')
def handle_ice_candidate(data):
    recipient_id = data.get('recipient_id')
    candidate = data.get('candidate')
    classroomId = data.get('classroomId') # Added for context
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


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


if __name__ == '__main__':
    # Use Gunicorn to run the app with gevent
    # Command to run in production: gunicorn --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 -b 0.0.0.0:5000 server:app
    # In development, use socketio.run for convenience.
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
