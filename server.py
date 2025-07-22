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
from bson.objectid import ObjectId # Import ObjectId for querying by _id in MongoDB

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

# Define collections
users_collection = mongo.db.users
classrooms_collection = mongo.db.classrooms
messages_collection = mongo.db.messages
files_collection = mongo.db.files
assessments_collection = mongo.db.assessments # NEW: Assessments collection
submissions_collection = mongo.db.submissions # NEW: Submissions collection


# --- Helper Functions ---

def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        # Fetch user from DB to ensure session data is fresh and complete
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if user:
            # Convert ObjectId to string for JSON serialization
            user['_id'] = str(user['_id'])
            return user
    return None

def login_required(f):
    """Decorator to protect routes that require authentication."""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'error': 'Unauthorized, please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- Authentication Routes ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user') # Default role is 'user'

    if not username or not email or not password:
        return jsonify({'error': 'Missing username, email, or password'}), 400

    if users_collection.find_one({'username': username}):
        return jsonify({'error': 'Username already exists'}), 409
    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 409

    hashed_password = generate_password_hash(password)
    user_id = users_collection.insert_one({
        'username': username,
        'email': email,
        'password': hashed_password,
        'role': role,
        'classrooms': [] # List of classroom IDs the user is a member of
    }).inserted_id

    return jsonify({'message': 'Registration successful!', 'user_id': str(user_id)}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = users_collection.find_one({'username': username})
    if user and check_password_hash(user['password'], password):
        session.permanent = True
        session['user_id'] = str(user['_id'])
        session['username'] = user['username'] # Store username in session
        session['role'] = user['role'] # Store role in session
        return jsonify({'message': 'Login successful!', 'user': {'id': str(user['_id']), 'username': user['username'], 'email': user['email'], 'role': user['role']}}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    user = get_current_user()
    if user:
        return jsonify({'authenticated': True, 'user': {'id': user['_id'], 'username': user['username'], 'email': user['email'], 'role': user['role']}}), 200
    return jsonify({'authenticated': False}), 200


# --- Classroom Routes ---

@app.route('/api/classrooms', methods=['POST'])
@login_required
def create_classroom():
    user = get_current_user()
    if user['role'] != 'admin':
        return jsonify({'error': 'Only administrators can create classrooms.'}), 403

    data = request.get_json()
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Classroom name is required'}), 400

    classroom_id = classrooms_collection.insert_one({
        'name': name,
        'creator_id': user['_id'],
        'creator_username': user['username'],
        'members': [user['_id']], # Creator is automatically a member
        'created_at': datetime.utcnow()
    }).inserted_id

    # Add classroom to admin's list of classrooms
    users_collection.update_one(
        {'_id': ObjectId(user['_id'])},
        {'$push': {'classrooms': str(classroom_id)}}
    )

    return jsonify({'message': 'Classroom created successfully!', 'id': str(classroom_id)}), 201

@app.route('/api/classrooms', methods=['GET'])
@login_required
def get_user_classrooms():
    user = get_current_user()
    # Fetch classrooms where the current user is a member
    user_classrooms = classrooms_collection.find({'members': user['_id']})
    classrooms_list = []
    for classroom in user_classrooms:
        classroom['_id'] = str(classroom['_id'])
        classrooms_list.append({
            'id': classroom['_id'],
            'name': classroom['name'],
            'creator_username': classroom['creator_username']
        })
    return jsonify(classrooms_list), 200

@app.route('/api/classrooms/join', methods=['POST'])
@login_required
def join_classroom():
    user = get_current_user()
    data = request.get_json()
    classroomId = data.get('classroomId')

    if not classroomId:
        return jsonify({'error': 'Classroom ID is required'}), 400

    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId)})
    if not classroom:
        return jsonify({'error': 'Classroom not found'}), 404

    # Check if user is already a member
    if user['_id'] in classroom['members']:
        return jsonify({'message': 'Already a member of this classroom.', 'classroom_name': classroom['name']}), 200

    # Add user to classroom's members list
    classrooms_collection.update_one(
        {'_id': ObjectId(classroomId)},
        {'$push': {'members': user['_id']}}
    )
    # Add classroom to user's list of classrooms
    users_collection.update_one(
        {'_id': ObjectId(user['_id'])},
        {'$push': {'classrooms': classroomId}}
    )

    socketio.emit('classroom_member_update', {
        'classroomId': classroomId,
        'message': f"{user['username']} has joined the classroom {classroom['name']}."
    }, room=classroomId)

    return jsonify({'message': 'Joined classroom successfully!', 'classroom_name': classroom['name']}), 200


# --- Chat Routes (REST and Socket.IO) ---

@app.route('/api/classrooms/<classroomId>/messages', methods=['GET'])
@login_required
def get_classroom_messages(classroomId):
    user = get_current_user()
    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId), 'members': user['_id']})
    if not classroom:
        return jsonify({'error': 'Classroom not found or you are not a member.'}), 404

    # Fetch messages, sort by timestamp
    msgs = list(messages_collection.find({'classroomId': classroomId}).sort('timestamp'))
    for msg in msgs:
        msg['_id'] = str(msg['_id'])
        msg['timestamp'] = msg['timestamp'].isoformat() # Convert datetime to string
    return jsonify(msgs), 200

@socketio.on('message')
@login_required
def handle_message(data):
    user = get_current_user()
    classroomId = data.get('classroomId')
    message_text = data.get('message')

    if not classroomId or not message_text:
        return {'error': 'Missing classroomId or message'}, 400

    # Ensure user is a member of the classroom
    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId), 'members': user['_id']})
    if not classroom:
        return {'error': 'Classroom not found or you are not a member'}, 404

    timestamp = datetime.utcnow()
    message_data = {
        'classroomId': classroomId,
        'sender_id': user['_id'],
        'sender_username': user['username'],
        'message': message_text,
        'timestamp': timestamp
    }
    messages_collection.insert_one(message_data)

    # Emit message to all members in the room, including sender, but sender_id is client's socket ID for front-end check
    emit('message', {
        'classroomId': classroomId,
        'sender_id': request.sid, # Use request.sid for the sender's current socket ID
        'sender_user': {'username': user['username'], 'role': user['role']}, # Pass user details
        'message': message_text,
        'timestamp': timestamp.isoformat()
    }, room=classroomId)
    print(f"Message from {user['username']} in {classroomId}: {message_text}")


# --- File Library Routes ---

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/api/upload_file', methods=['POST'])
@login_required
def upload_file():
    user = get_current_user()
    if user['role'] != 'admin':
        return jsonify({'error': 'Only administrators can upload files.'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    classroomId = request.form.get('classroomId')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not classroomId:
        return jsonify({'error': 'Classroom ID is required'}), 400

    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId), 'members': user['_id']})
    if not classroom:
        return jsonify({'error': 'Classroom not found or you are not a member.'}), 404

    filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1] # Unique filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    file_size = os.path.getsize(filepath)

    file_id = files_collection.insert_one({
        'classroomId': classroomId,
        'file_name': file.filename,
        'unique_filename': filename,
        'file_url': f'/uploads/{filename}',
        'uploader_id': user['_id'],
        'uploader_username': user['username'],
        'file_size': file_size,
        'uploaded_at': datetime.utcnow()
    }).inserted_id

    # Notify all members in the classroom about the new file
    socketio.emit('file_uploaded', {
        'classroomId': classroomId,
        'message': f"New file '{file.filename}' uploaded to the library by {user['username']}!"
    }, room=classroomId)

    return jsonify({'message': 'File uploaded successfully!', 'file_id': str(file_id)}), 201

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/classrooms/<classroomId>/library', methods=['GET'])
@login_required
def get_classroom_library_files(classroomId):
    user = get_current_user()
    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId), 'members': user['_id']})
    if not classroom:
        return jsonify({'error': 'Classroom not found or you are not a member.'}), 404

    # Fetch files, sort by upload date
    files = list(files_collection.find({'classroomId': classroomId}).sort('uploaded_at', -1))
    for f in files:
        f['_id'] = str(f['_id'])
        f['uploaded_at'] = f['uploaded_at'].isoformat()
    return jsonify(files), 200

@app.route('/api/classrooms/<classroomId>/library/<fileId>', methods=['DELETE'])
@login_required
def delete_library_file(classroomId, fileId):
    user = get_current_user()
    if user['role'] != 'admin':
        return jsonify({'error': 'Only administrators can delete files.'}), 403

    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId), 'members': user['_id']})
    if not classroom:
        return jsonify({'error': 'Classroom not found or you are not a member.'}), 404

    file_record = files_collection.find_one({'_id': ObjectId(fileId), 'classroomId': classroomId})
    if not file_record:
        return jsonify({'error': 'File not found in this classroom.'}), 404

    try:
        os.remove(os.path.join(UPLOAD_FOLDER, file_record['unique_filename']))
        files_collection.delete_one({'_id': ObjectId(fileId)})

        socketio.emit('admin_action_update', { # Use general admin action update for consistency
            'classroomId': classroomId,
            'message': f"Admin {user['username']} deleted file '{file_record['file_name']}' from the library."
        }, room=classroomId)

        return jsonify({'message': 'File deleted successfully!'}), 200
    except Exception as e:
        print(f"Error deleting file: {e}")
        return jsonify({'error': 'Failed to delete file.'}), 500


# --- WebRTC Signaling (Socket.IO) ---
@socketio.on('join_classroom')
@login_required
def handle_join_classroom(data):
    user = get_current_user()
    classroomId = data.get('classroomId')
    if not classroomId:
        print(f"Missing classroomId for join_classroom: {data}")
        return

    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId), 'members': user['_id']})
    if not classroom:
        print(f"User {user['username']} not authorized to join room {classroomId}")
        return

    join_room(classroomId)
    print(f"User {user['username']} (SID: {request.sid}) joined room {classroomId}")
    emit('message', {
        'sender_id': 'system',
        'message': f"{user['username']} has joined the chat.",
        'timestamp': datetime.utcnow().isoformat()
    }, room=classroomId, include_sid=False) # Broadcast to others in room

    # NEW: Signal new peer for WebRTC
    emit('webrtc_new_peer_joined', {
        'peer_id': request.sid,
        'classroomId': classroomId
    }, room=classroomId, include_sid=False) # Notify others in the room about this new peer

@socketio.on('leave_classroom')
@login_required
def handle_leave_classroom(data):
    user = get_current_user()
    classroomId = data.get('classroomId')
    if not classroomId:
        print(f"Missing classroomId for leave_classroom: {data}")
        return

    leave_room(classroomId)
    print(f"User {user['username']} (SID: {request.sid}) left room {classroomId}")
    emit('message', {
        'sender_id': 'system',
        'message': f"{user['username']} has left the chat.",
        'timestamp': datetime.utcnow().isoformat()
    }, room=classroomId, include_sid=False)

    # NEW: Signal peer disconnection for WebRTC
    emit('webrtc_peer_disconnected', {
        'peer_id': request.sid,
        'classroomId': classroomId
    }, room=classroomId, include_sid=False)

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    recipient_id = data.get('recipient_id')
    offer = data.get('offer')
    classroomId = data.get('classroomId')
    sender_id = request.sid
    if not recipient_id or not offer or not classroomId:
        print(f"Missing data for webrtc_offer: {data}")
        return

    emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id, 'classroomId': classroomId}, room=recipient_id)
    print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    recipient_id = data.get('recipient_id')
    answer = data.get('answer')
    classroomId = data.get('classroomId')
    sender_id = request.sid
    if not recipient_id or not answer or not classroomId:
        print(f"Missing data for webrtc_answer: {data}")
        return

    emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id, 'classroomId': classroomId}, room=recipient_id)
    print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    recipient_id = data.get('recipient_id')
    candidate = data.get('candidate')
    classroomId = data.get('classroomId')
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


# --- Assessment Routes (NEW) ---

@app.route('/api/assessments', methods=['POST'])
@login_required
def create_assessment():
    user = get_current_user()
    if user['role'] != 'admin':
        return jsonify({'error': 'Only administrators can create assessments.'}), 403

    data = request.get_json()
    classroomId = data.get('classroomId')
    title = data.get('title')
    description = data.get('description')
    questions = data.get('questions')
    scheduled_at_str = data.get('scheduled_at') # Datetime string from frontend
    duration_minutes = data.get('duration_minutes')

    if not classroomId or not title or not questions or not scheduled_at_str or not duration_minutes:
        return jsonify({'error': 'Missing required assessment fields.'}), 400

    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId), 'members': user['_id']})
    if not classroom:
        return jsonify({'error': 'Classroom not found or you are not a member.'}), 404

    try:
        # Convert scheduled_at string to datetime object
        scheduled_at = datetime.fromisoformat(scheduled_at_str)
        if not isinstance(duration_minutes, int) or duration_minutes <= 0:
            return jsonify({'error': 'Duration must be a positive integer.'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid scheduled time format or duration.'}), 400

    assessment_data = {
        'classroomId': classroomId,
        'title': title,
        'description': description,
        'creator_id': user['_id'],
        'creator_username': user['username'],
        'creator_role': user['role'],
        'created_at': datetime.utcnow(),
        'scheduled_at': scheduled_at, # Store as datetime
        'duration_minutes': duration_minutes, # Store as int
        'questions': []
    }

    for q in questions:
        if not q.get('question_text') or not q.get('question_type') or not q.get('correct_answer'):
            return jsonify({'error': 'Each question must have text, type, and correct answer.'}), 400
        question_entry = {
            'id': str(uuid.uuid4()), # Unique ID for each question
            'question_text': q['question_text'],
            'question_type': q['question_type'],
            'correct_answer': q['correct_answer']
        }
        if q['question_type'] == 'mcq' and 'options' in q and isinstance(q['options'], list):
            question_entry['options'] = q['options']
        assessment_data['questions'].append(question_entry)

    inserted_id = assessments_collection.insert_one(assessment_data).inserted_id

    socketio.emit('admin_action_update', {
        'classroomId': classroomId,
        'message': f"Admin {user['username']} created a new assessment: '{title}'."
    }, room=classroomId)

    return jsonify({'message': 'Assessment created successfully!', 'assessment_id': str(inserted_id)}), 201

@app.route('/api/assessments/<classroomId>', methods=['GET'])
@login_required
def get_class_assessments(classroomId):
    user = get_current_user()
    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId), 'members': user['_id']})
    if not classroom:
        return jsonify({'error': 'Classroom not found or you are not a member.'}), 404

    # Fetch all assessments for this classroom, sort by scheduled_at
    assessments = list(assessments_collection.find({'classroomId': classroomId}).sort('scheduled_at', 1))
    result = []
    for assessment in assessments:
        assessment['_id'] = str(assessment['_id'])
        assessment['scheduled_at'] = assessment['scheduled_at'].isoformat() # Convert datetime to string
        assessment['created_at'] = assessment['created_at'].isoformat()
        # Do not send full questions details (especially correct answers) to all users here
        # Frontend will fetch specific assessment for taking
        result.append({
            'id': assessment['_id'],
            'title': assessment['title'],
            'description': assessment['description'],
            'creator_username': assessment['creator_username'],
            'creator_role': assessment['creator_role'],
            'scheduled_at': assessment['scheduled_at'],
            'duration_minutes': assessment['duration_minutes'],
            'total_questions': len(assessment['questions'])
        })
    return jsonify(result), 200

@app.route('/api/assessments/<assessmentId>', methods=['GET'])
@login_required
def get_single_assessment(assessmentId):
    user = get_current_user()
    assessment = assessments_collection.find_one({'_id': ObjectId(assessmentId)})
    if not assessment:
        return jsonify({'error': 'Assessment not found.'}), 404

    # Ensure user is a member of the classroom associated with the assessment
    classroom = classrooms_collection.find_one({'_id': ObjectId(assessment['classroomId']), 'members': user['_id']})
    if not classroom:
        return jsonify({'error': 'You are not authorized to view this assessment.'}), 403

    assessment['_id'] = str(assessment['_id'])
    assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
    assessment['created_at'] = assessment['created_at'].isoformat()
    # For taking the assessment, include question details but sanitize sensitive info if needed
    # For now, sending all details as frontend handles logic, but correct_answer is for scoring only
    for q in assessment['questions']:
        q['id'] = str(q['id']) # Ensure question ID is string

    return jsonify(assessment), 200


@app.route('/api/assessments/<assessmentId>/submit', methods=['POST'])
@login_required
def submit_assessment(assessmentId):
    user = get_current_user()
    data = request.get_json()
    classroomId = data.get('classroomId')
    answers = data.get('answers') # [{'question_id': 'uuid', 'user_answer': 'text'}]

    if not classroomId or not answers:
        return jsonify({'error': 'Missing classroom ID or answers.'}), 400

    assessment = assessments_collection.find_one({'_id': ObjectId(assessmentId)})
    if not assessment:
        return jsonify({'error': 'Assessment not found.'}), 404

    # Ensure user is a member of the classroom
    classroom = classrooms_collection.find_one({'_id': ObjectId(classroomId), 'members': user['_id']})
    if not classroom:
        return jsonify({'error': 'Classroom not found or you are not a member.'}), 404

    # Check if assessment is currently active
    now = datetime.utcnow()
    scheduled_at = assessment['scheduled_at']
    duration = timedelta(minutes=assessment['duration_minutes'])
    end_time = scheduled_at + duration

    if now < scheduled_at:
        return jsonify({'error': 'Assessment has not started yet.'}), 400
    if now > end_time:
        return jsonify({'error': 'Assessment has already ended.'}), 400

    # Check if user has already submitted this assessment
    existing_submission = submissions_collection.find_one({
        'assessment_id': assessmentId,
        'student_id': user['_id']
    })
    if existing_submission:
        return jsonify({'error': 'You have already submitted this assessment.'}), 400

    score = 0
    total_questions = len(assessment['questions'])
    submission_answers = []

    # Map question IDs to question objects for easy lookup
    questions_map = {q['id']: q for q in assessment['questions']}

    for ans in answers:
        question_id = ans.get('question_id')
        user_answer = ans.get('user_answer', '').strip()

        question = questions_map.get(question_id)
        if question:
            is_correct = False
            correct_answer = question['correct_answer'].strip()

            if question['question_type'] == 'mcq':
                # Case-insensitive and whitespace-insensitive comparison for MCQ options
                is_correct = (user_answer.lower() == correct_answer.lower())
            elif question['question_type'] == 'text':
                # Simple case-insensitive comparison for text answers
                is_correct = (user_answer.lower() == correct_answer.lower())
            # Add other question types logic here if needed

            if is_correct:
                score += 1

            submission_answers.append({
                'question_id': question_id,
                'question_text': question['question_text'], # Include question text for display
                'user_answer': user_answer,
                'correct_answer': correct_answer, # Include correct answer for review
                'is_correct': is_correct
            })

    submission_data = {
        'assessment_id': assessmentId,
        'classroomId': classroomId,
        'student_id': user['_id'],
        'student_username': user['username'],
        'student_role': user['role'],
        'submitted_at': datetime.utcnow(),
        'score': score,
        'total_questions': total_questions,
        'answers': submission_answers
    }
    submissions_collection.insert_one(submission_data)

    return jsonify({
        'message': 'Assessment submitted successfully!',
        'score': score,
        'total_questions': total_questions,
        'submission_id': str(submission_data['_id'])
    }), 200


@app.route('/api/assessments/<assessmentId>/submissions', methods=['GET'])
@login_required
def get_assessment_submissions(assessmentId):
    user = get_current_user()
    assessment = assessments_collection.find_one({'_id': ObjectId(assessmentId)})
    if not assessment:
        return jsonify({'error': 'Assessment not found.'}), 404

    # Ensure user is a member of the classroom associated with the assessment
    classroom = classrooms_collection.find_one({'_id': ObjectId(assessment['classroomId']), 'members': user['_id']})
    if not classroom:
        return jsonify({'error': 'You are not authorized to view submissions for this assessment.'}), 403

    # Only admins can view all submissions. Users can view their own.
    query = {'assessment_id': assessmentId}
    if user['role'] != 'admin':
        query['student_id'] = user['_id']

    submissions = list(submissions_collection.find(query).sort('submitted_at', -1))

    result = []
    for submission in submissions:
        submission['_id'] = str(submission['_id'])
        submission['submitted_at'] = submission['submitted_at'].isoformat()
        result.append(submission) # Send all submission data including answers for review
    return jsonify(result), 200

@app.route('/api/assessments/<assessmentId>', methods=['DELETE'])
@login_required
def delete_assessment(assessmentId):
    user = get_current_user()
    if user['role'] != 'admin':
        return jsonify({'error': 'Only administrators can delete assessments.'}), 403

    assessment = assessments_collection.find_one({'_id': ObjectId(assessmentId)})
    if not assessment:
        return jsonify({'error': 'Assessment not found.'}), 404

    # Delete the assessment itself
    assessments_collection.delete_one({'_id': ObjectId(assessmentId)})
    # Delete all associated submissions
    submissions_collection.delete_many({'assessment_id': assessmentId})

    socketio.emit('admin_action_update', {
        'classroomId': assessment['classroomId'],
        'message': f"Admin {user['username']} deleted assessment: '{assessment['title']}' and all its submissions."
    }, room=assessment['classroomId'])

    return jsonify({'message': 'Assessment and its submissions deleted successfully!'}), 200


# --- Serve Static Files ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# --- Run the App ---
if __name__ == '__main__':
    # Ensure MongoDB indices if needed (e.g., for performance)
    users_collection.create_index('username', unique=True)
    users_collection.create_index('email', unique=True)
    classrooms_collection.create_index('members')
    messages_collection.create_index('classroomId')
    messages_collection.create_index('timestamp')
    files_collection.create_index('classroomId')
    assessments_collection.create_index('classroomId')
    submissions_collection.create_index([('assessment_id', 1), ('student_id', 1)], unique=True)

    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
