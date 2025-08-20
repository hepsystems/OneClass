# server.py

# --- IMPORTANT: Gevent Monkey Patching MUST be at the very top ---
import gevent.monkey
gevent.monkey.patch_all()

# --- Standard Imports ---
from flask import Flask, request, jsonify, send_from_directory, session
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.exceptions import HTTPException
import os
import uuid
from datetime import datetime, timedelta
import json
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

# --- NEW: Fix for gevent/PyMongo threading conflict ---
# Initialize PyMongo AFTER app and socketio setup
mongo = PyMongo(app)

# --- Global Error Handler ---
@app.errorhandler(Exception)
def handle_error(e):
    code = 500
    if isinstance(e, HTTPException):
        code = e.code
    
    # Log the full traceback for unhandled exceptions
    if code == 500:
        app.logger.error('An unhandled exception occurred:', exc_info=True)
    
    return jsonify(error=str(e)), code

# --- Helper Functions ---
def get_user_by_id(user_id):
    return mongo.db.users.find_one({'id': user_id})

def get_user_by_email(email):
    return mongo.db.users.find_one({'email': email})

def get_classroom_by_id(classroom_id):
    return mongo.db.classrooms.find_one({'id': classroom_id})

def check_auth():
    user_id = session.get('user_id')
    if not user_id:
        return None
    user = get_user_by_id(user_id)
    if not user:
        session.pop('user_id', None)
        return None
    return user

# --- API Endpoints ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'error': 'All fields are required.'}), 400

        if get_user_by_email(email):
            return jsonify({'error': 'Email already exists.'}), 409

        hashed_password = generate_password_hash(password)
        
        mongo.db.users.insert_one({
            'id': str(uuid.uuid4()),
            'username': username,
            'email': email,
            'password': hashed_password,
            'role': 'student', # Default role
            'created_at': datetime.utcnow()
        })
        
        return jsonify({'message': 'User registered successfully.'}), 201
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required.'}), 400

        user = get_user_by_email(email)
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid email or password.'}), 401

        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        
        return jsonify({
            'message': 'Login successful.',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    try:
        session.pop('user_id', None)
        session.pop('username', None)
        session.pop('role', None)
        return jsonify({'message': 'Logged out successfully.'}), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/user', methods=['GET'])
def get_current_user():
    try:
        user = check_auth()
        if not user:
            return jsonify({'error': 'Not authenticated'}), 401
        
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/create-classroom', methods=['POST'])
def create_classroom():
    try:
        user = check_auth()
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.json
        name = data.get('name')
        if not name:
            return jsonify({'error': 'Classroom name is required.'}), 400

        classroom_id = str(uuid.uuid4())
        mongo.db.classrooms.insert_one({
            'id': classroom_id,
            'name': name,
            'owner_id': user['id'],
            'created_at': datetime.utcnow(),
            'participants': [user['id']],
            'whiteboard': {'currentPageIndex': 0, 'pages': [[]]} # Initialize whiteboard
        })

        return jsonify({'message': 'Classroom created successfully.', 'id': classroom_id}), 201
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/classrooms', methods=['GET'])
def get_classrooms():
    try:
        user = check_auth()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        classrooms = list(mongo.db.classrooms.find({}, {'_id': 0}))
        return jsonify(classrooms), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/join-classroom', methods=['POST'])
def join_classroom():
    try:
        user = check_auth()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.json
        classroomId = data.get('classroomId')
        if not classroomId:
            return jsonify({'error': 'Classroom ID is required.'}), 400

        classroom = get_classroom_by_id(classroomId)
        if not classroom:
            return jsonify({'error': 'Classroom not found.'}), 404

        if user['id'] not in classroom['participants']:
            mongo.db.classrooms.update_one(
                {'id': classroomId},
                {'$addToSet': {'participants': user['id']}}
            )
        
        return jsonify({'message': 'Joined classroom successfully.', 'classroomName': classroom['name']}), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/upload-library-files/<classroomId>', methods=['POST'])
def upload_library_files(classroomId):
    try:
        user = check_auth()
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
            
        if 'files' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        files = request.files.getlist('files')
        if not files:
            return jsonify({'error': 'No selected file'}), 400

        classroom = get_classroom_by_id(classroomId)
        if not classroom:
            return jsonify({'error': 'Classroom not found.'}), 404

        # Ensure the uploads directory exists
        upload_folder = os.path.join('uploads', classroomId)
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        file_info_list = []
        for file in files:
            if file.filename == '':
                continue
            
            filename = str(uuid.uuid4()) + "_" + file.filename
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)

            file_id = str(uuid.uuid4())
            mongo.db.files.insert_one({
                'id': file_id,
                'classroomId': classroomId,
                'filename': file.filename,
                'path': filepath,
                'uploader_id': user['id'],
                'uploaded_at': datetime.utcnow()
            })
            file_info_list.append({'filename': file.filename, 'id': file_id})

        return jsonify({'message': f'Successfully uploaded {len(file_info_list)} file(s).', 'files': file_info_list}), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred during file upload: {str(e)}'}), 500

@app.route('/api/library-files/<classroomId>', methods=['GET'])
def get_library_files(classroomId):
    try:
        user = check_auth()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        files = list(mongo.db.files.find({'classroomId': classroomId}, {'_id': 0, 'path': 0}))
        for file in files:
            file['url'] = f'/api/library-files/{classroomId}/{file["id"]}'
        
        return jsonify(files), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/library-files/<classroomId>/<fileId>', methods=['GET'])
def serve_library_file(classroomId, fileId):
    try:
        user = check_auth()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        file_doc = mongo.db.files.find_one({'id': fileId, 'classroomId': classroomId})
        if not file_doc:
            return jsonify({'error': 'File not found.'}), 404
        
        return send_from_directory(os.path.join('uploads', classroomId), os.path.basename(file_doc['path']))
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/delete-library-file/<fileId>', methods=['DELETE'])
def delete_library_file(fileId):
    try:
        user = check_auth()
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        file_doc = mongo.db.files.find_one({'id': fileId})
        if not file_doc:
            return jsonify({'error': 'File not found.'}), 404

        # Delete the file from the filesystem
        try:
            os.remove(file_doc['path'])
        except OSError as e:
            app.logger.error(f'Error deleting file from disk: {e}', exc_info=True)
            # Continue to delete from DB even if file is missing from disk

        mongo.db.files.delete_one({'id': fileId})
        
        return jsonify({'message': 'File deleted successfully.'}), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/create-assessment', methods=['POST'])
def create_assessment():
    try:
        user = check_auth()
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.json
        title = data.get('title')
        classroomId = data.get('classroomId')
        questions = data.get('questions')
        
        if not all([title, classroomId, questions]):
            return jsonify({'error': 'Missing required fields.'}), 400

        assessment_id = str(uuid.uuid4())
        mongo.db.assessments.insert_one({
            'id': assessment_id,
            'classroomId': classroomId,
            'title': title,
            'description': data.get('description', ''),
            'questions': questions,
            'scheduledAt': data.get('scheduledAt'),
            'durationMinutes': int(data.get('durationMinutes', 60)),
            'created_by': user['id'],
            'created_at': datetime.utcnow()
        })
        
        # Notify clients in the classroom
        socketio.emit('new_assessment_notification', {'title': title}, room=classroomId)

        return jsonify({'message': 'Assessment created successfully.', 'assessmentId': assessment_id}), 201
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/assessments/<classroomId>', methods=['GET'])
def get_assessments(classroomId):
    try:
        user = check_auth()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        assessments = list(mongo.db.assessments.find({'classroomId': classroomId}, {'_id': 0}))
        return jsonify(assessments), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/assessments/<classroomId>/<assessmentId>', methods=['GET'])
def get_single_assessment(classroomId, assessmentId):
    try:
        user = check_auth()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        assessment = mongo.db.assessments.find_one({'id': assessmentId, 'classroomId': classroomId}, {'_id': 0})
        if not assessment:
            return jsonify({'error': 'Assessment not found.'}), 404
        
        return jsonify(assessment), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/submit-assessment', methods=['POST'])
def submit_assessment():
    try:
        user = check_auth()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.json
        assessmentId = data.get('assessmentId')
        classroomId = data.get('classroomId')
        answers = data.get('answers')
        
        if not all([assessmentId, classroomId, answers]):
            return jsonify({'error': 'Missing required fields.'}), 400

        submission_id = str(uuid.uuid4())
        mongo.db.submissions.insert_one({
            'id': submission_id,
            'assessmentId': assessmentId,
            'classroomId': classroomId,
            'student_id': user['id'],
            'student_username': user['username'],
            'answers': answers,
            'submitted_at': datetime.utcnow()
        })
        
        return jsonify({'message': 'Submission successful.'}), 201
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/submissions/<assessmentId>', methods=['GET'])
def get_submissions(assessmentId):
    try:
        user = check_auth()
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        submissions = list(mongo.db.submissions.find({'assessmentId': assessmentId}, {'_id': 0}))
        return jsonify(submissions), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/delete-assessment/<assessmentId>', methods=['DELETE'])
def delete_assessment(assessmentId):
    try:
        user = check_auth()
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        result = mongo.db.assessments.delete_one({'id': assessmentId})
        if result.deleted_count == 0:
            return jsonify({'error': 'Assessment not found.'}), 404
        
        # Also delete associated submissions
        mongo.db.submissions.delete_many({'assessmentId': assessmentId})
        
        return jsonify({'message': 'Assessment and its submissions deleted successfully.'}), 200
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

# --- Socket.IO Event Handlers ---
@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')
    # Remove from rooms on disconnect
    for room in rooms(request.sid):
        if room != request.sid: # Don't leave the personal room
            print(f"Client {request.sid} auto-leaving room {room}")
            leave_room(room)
            
            # Update participants list if it's a classroom
            if room and len(room) > 10: # A simple check for classroomId format
                try:
                    classroom = get_classroom_by_id(room)
                    if classroom:
                        participants_sids = [sid for sid in rooms(room) if sid != room]
                        participants_ids = [mongo.db.users.find_one({'id': sid})['id'] for sid in participants_sids]
                        emit('classroom_participants_update', {'participants': participants_ids}, room=room)
                        emit('webrtc_peer_disconnected', {'peer_id': request.sid}, room=room, include_sid=False)
                except Exception as e:
                    app.logger.error(f'Error updating participants on disconnect: {e}', exc_info=True)

@socketio.on('join')
def on_join(data):
    try:
        user = check_auth()
        if not user:
            return
        
        classroomId = data.get('classroomId')
        if not classroomId:
            return
        
        join_room(classroomId)
        print(f"User {user['username']} ({request.sid}) joined classroom {classroomId}")
        
        # Emit the new participant list to everyone in the room
        classroom = get_classroom_by_id(classroomId)
        if classroom:
            participants = list(mongo.db.users.find({'id': {'$in': classroom['participants']}}, {'_id': 0, 'username': 1}))
            emit('classroom_participants_update', {'participants': participants}, room=classroomId)
            
    except Exception as e:
        app.logger.error(f'Error on join event: {e}', exc_info=True)

@socketio.on('leave')
def on_leave(data):
    try:
        user = check_auth()
        if not user:
            return
        
        classroomId = data.get('classroomId')
        if not classroomId:
            return

        leave_room(classroomId)
        print(f"User {user['username']} ({request.sid}) left classroom {classroomId}")

        # Emit the new participant list to everyone in the room
        classroom = get_classroom_by_id(classroomId)
        if classroom:
            participants = list(mongo.db.users.find({'id': {'$in': classroom['participants']}}, {'_id': 0, 'username': 1}))
            emit('classroom_participants_update', {'participants': participants}, room=classroomId)
            
    except Exception as e:
        app.logger.error(f'Error on leave event: {e}', exc_info=True)

@socketio.on('message')
def handle_message(data):
    try:
        user = check_auth()
        if not user:
            return
            
        classroomId = data.get('classroomId')
        message = data.get('message')
        
        if not classroomId or not message:
            return
            
        # Broadcast the message to all clients in the classroom
        emit('message', {'username': user['username'], 'message': message, 'role': user['role']}, room=classroomId, include_sid=False)
        print(f"Message from {user['username']} in classroom {classroomId}: {message}")
    except Exception as e:
        app.logger.error(f'Error handling message event: {e}', exc_info=True)

@socketio.on('whiteboard_drawing')
def handle_whiteboard_drawing(data):
    try:
        user = check_auth()
        if not user:
            return

        classroomId = data.get('classroomId')
        pageIndex = data.get('pageIndex')
        drawingData = data.get('drawingData')
        
        if not classroomId or pageIndex is None or not drawingData:
            return

        # Update the database with the new drawing data
        mongo.db.classrooms.update_one(
            {'id': classroomId},
            {'$push': {f'whiteboard.pages.{pageIndex}': drawingData}}
        )

        # Broadcast the drawing data to all clients in the classroom except the sender
        emit('whiteboard_drawing', {
            'pageIndex': pageIndex,
            'drawingData': drawingData
        }, room=classroomId, include_sid=False)
        
    except Exception as e:
        app.logger.error(f'Error handling whiteboard_drawing event: {e}', exc_info=True)
        
@socketio.on('whiteboard_page_change')
def handle_whiteboard_page_change(data):
    try:
        user = check_auth()
        if not user:
            return
        
        classroomId = data.get('classroomId')
        newIndex = data.get('newIndex')
        
        if not classroomId or newIndex is None:
            return

        # Update the database with the new current page
        mongo.db.classrooms.update_one(
            {'id': classroomId},
            {'$set': {'whiteboard.currentPageIndex': newIndex}}
        )
        
        # Broadcast the page change to all clients except the sender
        emit('whiteboard_page_change', {
            'newIndex': newIndex
        }, room=classroomId, include_sid=False)
        
    except Exception as e:
        app.logger.error(f'Error handling whiteboard_page_change event: {e}', exc_info=True)

@socketio.on('request_whiteboard_history')
def handle_request_whiteboard_history(data):
    try:
        user = check_auth()
        if not user:
            return
            
        classroomId = data.get('classroomId')
        if not classroomId:
            return
            
        classroom = get_classroom_by_id(classroomId)
        if classroom and 'whiteboard' in classroom:
            # Send the entire whiteboard state to the requester
            emit('whiteboard_history', {
                'whiteboardPages': classroom['whiteboard']['pages'],
                'currentPageIndex': classroom['whiteboard']['currentPageIndex']
            }, room=request.sid)
    except Exception as e:
        app.logger.error(f'Error handling request_whiteboard_history event: {e}', exc_info=True)

# WebRTC Signaling Handlers
@socketio.on('webrtc_start_broadcast')
def handle_webrtc_start_broadcast(data):
    try:
        classroomId = data.get('classroomId')
        if not classroomId:
            print(f"Missing classroomId for webrtc_start_broadcast: {data}")
            return
        
        # Get all SIDs in the room
        peer_list = [sid for sid in rooms(classroomId) if sid != request.sid]
        
        # Send the list of existing peers to the new broadcaster
        emit('webrtc_peer_list', peer_list, room=request.sid)
        
    except Exception as e:
        app.logger.error(f'Error handling webrtc_start_broadcast event: {e}', exc_info=True)

@socketio.on('webrtc_end_broadcast')
def handle_webrtc_end_broadcast(data):
    try:
        classroomId = data.get('classroomId')
        if not classroomId:
            print(f"Missing classroomId for webrtc_end_broadcast: {data}")
            return
            
        emit('webrtc_peer_disconnected', {'peer_id': request.sid}, room=classroomId, include_sid=False)
    except Exception as e:
        app.logger.error(f'Error handling webrtc_end_broadcast event: {e}', exc_info=True)

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    try:
        recipient_id = data.get('recipient_id')
        offer = data.get('offer')
        classroomId = data.get('classroomId')
        sender_id = request.sid
        
        if not recipient_id or not offer or not classroomId:
            print(f"Missing data for webrtc_offer: {data}")
            return
        
        emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id}, room=recipient_id)
        print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")
    except Exception as e:
        app.logger.error(f'Error handling webrtc_offer event: {e}', exc_info=True)

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    try:
        recipient_id = data.get('recipient_id')
        answer = data.get('answer')
        classroomId = data.get('classroomId') # Added for context
        sender_id = request.sid
        
        if not recipient_id or not answer or not classroomId:
            print(f"Missing data for webrtc_answer: {data}")
            return

        emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id}, room=recipient_id)
        print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId}")
    except Exception as e:
        app.logger.error(f'Error handling webrtc_answer event: {e}', exc_info=True)

@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    try:
        recipient_id = data.get('recipient_id')
        candidate = data.get('candidate')
        classroomId = data.get('classroomId') # Added for context
        sender_id = request.sid
        
        if not recipient_id or not candidate or not classroomId:
            print(f"Missing data for webrtc_ice_candidate: {data}")
            return

        emit('webrtc_ice_candidate', {'candidate': candidate, 'sender_id': sender_id}, room=recipient_id)
        print(f"WEBRTC: ICE Candidate from {sender_id} to {recipient_id} in classroom {classroomId}")
    except Exception as e:
        app.logger.error(f'Error handling webrtc_ice_candidate event: {e}', exc_info=True)

@socketio.on('webrtc_peer_disconnected')
def handle_peer_disconnected_signal(data):
    try:
        classroomId = data.get('classroomId')
        peer_id = data.get('peer_id')
        sender_sid = request.sid
        
        if not classroomId or not peer_id:
            print(f"Missing data for webrtc_peer_disconnected: {data}")
            return
        
        emit('webrtc_peer_disconnected', {'peer_id': peer_id}, room=classroomId, include_sid=False)
        print(f"WEBRTC: Client {sender_sid} signaling peer {peer_id} disconnected in classroom {classroomId}")
    except Exception as e:
        app.logger.error(f'Error handling webrtc_peer_disconnected event: {e}', exc_info=True)

@socketio.on('admin_action_update')
def handle_admin_action_update(data):
    try:
        classroomId = data.get('classroomId')
        message = data.get('message')
        # Only admins can send this, but we'll re-emit to everyone in the room
        if classroomId and message:
            emit('admin_action_update', {'message': message}, room=classroomId, include_sid=False)
            print(f"Admin action update from {session.get('username')} in classroom {classroomId}: {message}")
    except Exception as e:
        app.logger.error(f'Error handling admin_action_update event: {e}', exc_info=True)


if __name__ == '__main__':
    # Use Gunicorn as the production server
    # See previous response for the start command
    # `gunicorn --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 -b 0.0.0.0:5000 server:app`
    
    # For local development, you can use socketio.run
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
