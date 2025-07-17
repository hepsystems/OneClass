# server.py

# --- IMPORTANT: Gevent Monkey Patching MUST be at the very top ---\
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
assessment_questions_collection = mongo.db.assessment_questions # New
assessment_submissions_collection = mongo.db.assessment_submissions # New
whiteboard_collection = mongo.db.whiteboard_drawings # New collection for whiteboard data
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

@app.route('/classroom.js')
def serve_classroom_js():
    # This file is no longer needed as its content is merged into app.js
    # You might want to remove this route if classroom.js is completely gone.
    # For now, it's kept to prevent errors if something still tries to fetch it.
    return send_from_directory('.', 'classroom.js')


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
    session['role'] = user['role'] # Store role in session
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
    session.pop('role', None) # Clear role from session
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
def upload_library_files():
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    # --- SECURITY FIX: Only allow admins to upload files ---
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
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can create assessments."}), 401

    data = request.json
    class_room_id = data.get('classroomId')
    title = data.get('title')
    description = data.get('description')
    questions = data.get('questions') # List of question objects

    if not all([class_room_id, title, questions]):
        return jsonify({"error": "Missing required fields: classroomId, title, or questions"}), 400
    
    if not isinstance(questions, list) or not questions:
        return jsonify({"error": "Questions must be a non-empty list"}), 400

    assessment_id = str(uuid.uuid4())
    
    # Insert assessment details
    assessments_collection.insert_one({
        "id": assessment_id,
        "classroomId": class_room_id,
        "title": title,
        "description": description,
        "creator_id": user_id,
        "creator_username": username,
        "creator_role": user_role, # Store creator's role
        "created_at": datetime.utcnow()
    })

    # Insert each question linked to the assessment
    for q_data in questions:
        question_id = str(uuid.uuid4())
        assessment_questions_collection.insert_one({
            "id": question_id,
            "assessmentId": assessment_id,
            "classroomId": class_room_id,
            "question_text": q_data.get('question_text'),
            "question_type": q_data.get('question_type'), # 'text' or 'mcq'
            "options": q_data.get('options'), # List of strings for MCQ
            "correct_answer": q_data.get('correct_answer') # For MCQ, e.g., "A", "B"; for text, can be null or example answer
        })

    return jsonify({"message": "Assessment created successfully", "id": assessment_id}), 201

@app.route('/api/assessments/<classroomId>', methods=['GET'])
def get_assessments(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"_id": 0}))
    return jsonify(assessments), 200

@app.route('/api/assessment/<assessmentId>/questions', methods=['GET'])
def get_assessment_questions(assessmentId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    questions = list(assessment_questions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))
    return jsonify(questions), 200

@app.route('/api/submit-assessment', methods=['POST'])
def submit_assessment():
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role') # Get user role for submission record
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    assessment_id = data.get('assessmentId')
    class_room_id = data.get('classroomId')
    answers = data.get('answers') # List of {questionId: "...", answer: "..."}

    if not all([assessment_id, class_room_id, answers]):
        return jsonify({"error": "Missing required fields: assessmentId, classroomId, or answers"}), 400
    
    if not isinstance(answers, list):
        return jsonify({"error": "Answers must be a list"}), 400

    submission_id = str(uuid.uuid4())
    
    # Calculate score (simple for now: exact match for MCQ, no scoring for text)
    score = 0
    total_questions = 0
    graded_answers = []

    for submitted_answer in answers:
        question_id = submitted_answer.get('questionId')
        user_answer = submitted_answer.get('answer')
        
        if question_id:
            question = assessment_questions_collection.find_one({"id": question_id})
            if question:
                total_questions += 1
                is_correct = False
                if question.get('question_type') == 'mcq':
                    if question.get('correct_answer') and user_answer and \
                       user_answer.strip().lower() == question['correct_answer'].strip().lower():
                        score += 1
                        is_correct = True
                
                graded_answers.append({
                    "question_id": question_id,
                    "question_text": question.get('question_text'),
                    "user_answer": user_answer,
                    "correct_answer": question.get('correct_answer'),
                    "is_correct": is_correct if question.get('question_type') == 'mcq' else None # Only for MCQ
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

    return jsonify({"message": "Assessment submitted successfully", "submission_id": submission_id, "score": score, "total_questions": total_questions}), 201

@app.route('/api/assessment/<assessmentId>/submissions', methods=['GET'])
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
    return jsonify(submissions), 200


@app.route('/api/create-classroom', methods=['POST'])
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
    return jsonify({"message": "Classroom created successfully", "classroom": {"id": classroom_id, "name": classroom_name}}), 201

@app.route('/api/classrooms', methods=['GET'])
def get_classrooms():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # MODIFIED: Return ALL classrooms for an authenticated user to discover
    # Previously: {"$or": [{"creator_id": user_id}, {"participants": user_id}]}
    all_classrooms = list(classrooms_collection.find({}, {"_id": 0}))
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
        socketio.emit('user_joined', { # Changed from 'participant_join' to 'user_joined' for consistency
            'username': session.get('username'),
            'user_id': user_id,
            'sid': request.sid, # <<< IMPORTANT for WebRTC peer identification
            'classroomId': classroom_id,
            'role': session.get('role') # Include role of joining user
        }, room=classroom_id, include_sid=False)
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
        print(f"Client connected: {username} ({user_id}), SID: {request.sid}")
        # Store sid for user to map them
        session['sid'] = request.sid
        # You might want to store a mapping of user_id to sid if needed
    else:
        print(f"Unauthenticated client connected, SID: {request.sid}")

@socketio.on('disconnect')
def disconnect():
    user_id = session.get('user_id')
    username = session.get('username')
    classroomId = session.get('classroomId') # If you store classroomId in session on join
    sid = request.sid

    print(f"Client disconnected: {username} ({user_id}), SID: {sid}")

    # Emit to all users in the classroom that a peer has disconnected
    # This is primarily for WebRTC cleanup on other clients
    if classroomId:
        emit('webrtc_peer_disconnected', {'peer_id': sid}, room=classroomId, include_sid=False)


@socketio.on('join') # Renamed from join_room for consistency with client and previous response
def on_join(data):
    classroomId = data.get('classroomId')
    username = session.get('username') # Get username from session
    user_id = session.get('user_id') # Get user_id from session
    user_role = data.get('role') or session.get('role')  # ✅ Accept role from client
    session['role'] = user_role  # ✅ Store role in session
    sid = request.sid # Get the current socket's ID

    if not classroomId or not username or not user_id:
        print("Missing data for join or user not authenticated.")
        return

    join_room(classroomId)
    # Store classroomId in session if needed for disconnect handling
    session['classroomId'] = classroomId
    print(f"[Socket.IO] User '{username}' ({user_id}) joined as role: {user_role}") # ✅ Debug log
    print(f"{username} ({user_id}, {user_role}) joined room: {classroomId} with SID: {sid}")

    # Broadcast to others in the room that a new user joined.
    # Include the new user's SID for WebRTC.
    emit('user_joined', {
        'username': username,
        'user_id': user_id,
        'sid': sid, # The Socket.IO ID of the newly joined user
        'role': user_role
    }, room=classroomId, include_sid=False) # Exclude sender from this notification

    # Send whiteboard history to the joining user immediately from the database
    whiteboard_history_from_db = list(whiteboard_collection.find({"classroomId": classroomId}, {"_id": 0}).sort("timestamp", 1))
    if whiteboard_history_from_db:
        emit('whiteboard_data', {'action': 'history', 'data': whiteboard_history_from_db}, room=sid)
        print(f"Whiteboard history sent to new participant {sid} in classroom {classroomId}")

    # NEW: Send chat history to the joining user
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


@socketio.on('leave') # Renamed from leave_room for consistency with client and previous response
def on_leave(data):
    classroomId = data.get('classroomId')
    username = session.get('username')
    sid = request.sid

    if not classroomId or not username:
        return

    leave_room(classroomId)
    print(f"{username} left room: {classroomId}")
    emit('user_left', {'username': username, 'sid': sid}, room=classroomId, include_sid=False) # Exclude sender


@socketio.on('message') # Renamed from chat_message for consistency with client
def handle_chat_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    username = session.get('username') # Get username from session
    user_id = session.get('user_id') # Get user_id from session
    user_role = session.get('role') # Get user role from session

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
        "timestamp": datetime.utcnow() # Store as UTC datetime object
    }
    chat_messages_collection.insert_one(chat_message_record)

    # Emit message to all in the room
    emit('message', { # Renamed to 'message'
        'user_id': user_id,
        'username': username,
        'message': message,
        'timestamp': datetime.utcnow().isoformat(), # Send ISO format for client parsing
        'role': user_role # Include sender's role
    }, room=classroomId)
    print(f"Chat message from {username} in {classroomId} broadcasted and saved.")


@socketio.on('whiteboard_data')
def handle_whiteboard_data(data):
    classroomId = data.get('classroomId')
    action = data.get('action')
    sender_id = request.sid
    user_role = session.get('role') # Get user role from session
    user_id = session.get('user_id')
    username = session.get('username')

    if not classroomId:
        return

    if action == 'draw':
        # Check if the user is an admin before allowing drawing
        if user_role != 'admin':
            print(f"User {sender_id} (role: {user_role}) attempted to draw on whiteboard in classroom {classroomId} without admin privileges.")
            return # Prevent non-admins from drawing

        tool = data.get('tool')
        draw_data = data.get('data')

        if not tool or not draw_data:
            print(f"Missing tool or data for whiteboard draw action: {data}")
            return

        # Store drawing action in MongoDB with more detail
        drawing_record = {
            "classroomId": classroomId,
            "action": "draw",
            "timestamp": datetime.utcnow(),
            "tool": tool, # Store the tool used (pen, line, rect, circle, text, eraser)
            "data": draw_data, # This will contain specific data for each tool (coords, text, etc.)
            "user_id": user_id,
            "username": username
        }
        whiteboard_collection.insert_one(drawing_record)
        
        # Broadcast drawing data to all in the room except the sender
        emit('whiteboard_data', data, room=classroomId, include_sid=False)
        print(f"Whiteboard draw data broadcasted and saved in classroom {classroomId} by {username} ({user_id}) (Tool: {tool})")

    elif action == 'clear':
        # Only allow admin to clear the board
        if user_role != 'admin':
            print(f"User {sender_id} (role: {user_role}) attempted to clear whiteboard in classroom {classroomId} without admin privileges.")
            return

        # Clear history for this classroom from MongoDB
        whiteboard_collection.delete_many({"classroomId": classroomId})
        
        # Broadcast clear action to all in the room
        emit('whiteboard_data', {'action': 'clear'}, room=classroomId)
        print(f"Whiteboard cleared in classroom {classroomId} by {username} ({user_id})")

    # The 'history_request' action is now handled directly in the 'join' event,
    # so this block is no longer strictly necessary but can be kept for explicit requests.
    elif action == 'history_request':
        recipient_id = data.get('recipient_id')
        if recipient_id:
            whiteboard_history_from_db = list(whiteboard_collection.find({"classroomId": classroomId}, {"_id": 0}).sort("timestamp", 1))
            emit('whiteboard_data', {'action': 'history', 'data': whiteboard_history_from_db}, room=recipient_id)
            print(f"Whiteboard history sent to new participant {recipient_id} in classroom {classroomId} (explicit request).")


# --- WebRTC Socket.IO Handlers ---
# These handlers are primarily for signaling (passing SDP offers/answers and ICE candidates)
# The client-side (classroom.js) will manage the peer connections and actual media streams.

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    classroomId = data.get('classroomId')
    recipient_id = data.get('recipient_id') # This is the socket.id of the target peer
    offer = data.get('offer')
    sender_id = request.sid # The socket.id of the sender (broadcaster)

    if not classroomId or not recipient_id or not offer:
        print(f"Missing data for webrtc_offer: {data}")
        return

    # Emit the offer to the specific recipient
    emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")


@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    classroomId = data.get('classroomId')
    recipient_id = data.get('recipient_id') # This is the socket.id of the target peer (broadcaster)
    answer = data.get('answer')
    sender_id = request.sid # The socket.id of the sender (receiver)

    if not classroomId or not recipient_id or not answer:
        print(f"Missing data for webrtc_answer: {data}")
        return

    # Emit the answer to the specific recipient
    emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id}, room=recipientId)
    print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId}")


@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    classroomId = data.get('classroomId')
    recipient_id = data.get('recipient_id') # This is the socket.id of the target peer
    candidate = data.get('candidate')
    sender_id = request.sid # The socket.id of the sender

    if not classroomId or not recipient_id or not candidate:
        print(f"Missing data for webrtc_ice_candidate: {data}")
        return

    # Emit the ICE candidate to the specific recipient
    emit('webrtc_ice_candidate', {'candidate': candidate, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: ICE Candidate from {sender_id} to {recipient_id} in classroom {classroomId}")


@socketio.on('webrtc_peer_disconnected')
def handle_peer_disconnected_signal(data):
    # This is a client-sent signal that a peer is intentionally disconnecting
    classroomId = data.get('classroomId')
    peer_id = data.get('peer_id') # The socket.id of the peer that is disconnecting
    sender_sid = request.sid

    if not classroomId or not peer_id:
        print(f"Missing data for webrtc_peer_disconnected: {data}")
        return
    
    # Broadcast to all other clients in the room that this peer has disconnected
    emit('webrtc_peer_disconnected', {'peer_id': peer_id}, room=classroomId, include_sid=False)
    print(f"WEBRTC: Client {sender_sid} signaling peer {peer_id} disconnected in classroom {classroomId}")


# --- Main Run Block ---
if __name__ == '__main__':
    # When using Flask-SocketIO with gevent, you run the SocketIO instance
    # directly using socketio.run, which wraps the WSGI server.
    print("Server running on http://localhost:5000 (with Socket.IO)")
    socketio.run(app, debug=True, port=5000, host='0.0.0.0')

    # Remember to install: pip install Flask Flask-PyMongo Flask-SocketIO Werkzeug gevent python-dotenv
    # (python-dotenv for .env file in dev)
