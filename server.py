import gevent.monkey
gevent.monkey.patch_all()

import os
import uuid
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, session, send_from_directory, make_response
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__)
# --- MODIFICATION START ---
# Fetch SECRET_KEY from environment variable
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default_fallback_secret_key') 
# It's highly recommended to set this variable in your Render environment settings.
# The 'default_fallback_secret_key' is just a placeholder for local development
# and should NEVER be used in production.
# --- MODIFICATION END ---
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1) # Session timeout

# Explicitly set async_mode to 'gevent' for Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False, async_mode='gevent') 

# MongoDB Configuration
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
# To address the KeyError with gevent and PyMongo's monitoring threads,
# try setting serverSelectionTimeoutMS and directConnection=True.
# directConnection=True tells PyMongo to connect only to the specified hosts
# and bypass server discovery, which often prevents the problematic threads.
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000, directConnection=True)
    # The ismaster command is cheap and does not require auth.
    # It forces PyMongo to try and connect and run server discovery, potentially exposing the threading issue early.
    client.admin.command('ismaster')
    print("MongoDB connection successful!")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    # You might want to exit or handle this error more robustly in production
    # sys.exit(1)

db = client.classroom_app

users_collection = db.users
classrooms_collection = db.classrooms
chat_messages_collection = db.chat_messages
whiteboard_collection = db.whiteboard_data # To store drawing data per page
library_files_collection = db.library_files
assessments_collection = db.assessments
assessment_questions_collection = db.assessment_questions
assessment_submissions_collection = db.assessment_submissions

# Create uploads directory if it doesn't exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Helper function for user authentication and session management
def login_required(f):
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__ # Preserve original function name
    return wrapper

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user') # Default role is 'user'

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 409

    user_id = str(uuid.uuid4())
    users_collection.insert_one({
        "id": user_id,
        "username": username,
        "password": password, # In a real app, hash this password!
        "role": role
    })
    return jsonify({"message": "User registered successfully", "userId": user_id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = users_collection.find_one({"username": username, "password": password}) # Again, hash comparison needed
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        print(f"User {username} logged in. Session: {session}")
        return jsonify({"message": "Login successful", "user": {"id": user['id'], "username": user['username'], "role": user['role']}}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None)
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/@me', methods=['GET'])
def get_current_user():
    if 'user_id' in session:
        user = users_collection.find_one({"id": session['user_id']})
        if user:
            return jsonify({"id": user['id'], "username": user['username'], "role": user['role']}), 200
    return jsonify({"user": None}), 200 # No user logged in


# Classroom Endpoints
@app.route('/api/classrooms', methods=['POST'])
@login_required
def create_classroom():
    user_id = session.get('user_id')
    user_role = session.get('role')

    if user_role != 'admin': # Only admins can create classrooms
        return jsonify({"error": "Forbidden: Only administrators can create classrooms."}), 403

    data = request.json
    name = data.get('name')

    if not name:
        return jsonify({"error": "Classroom name is required"}), 400

    classroom_id = str(uuid.uuid4())
    classrooms_collection.insert_one({
        "id": classroom_id,
        "name": name,
        "creator_id": user_id,
        "created_at": datetime.utcnow(),
        "participants": [user_id] # Creator is automatically a participant
    })
    print(f"Classroom '{name}' created by {session.get('username')}")
    return jsonify({"message": "Classroom created successfully", "classroom": {"id": classroom_id, "name": name}}), 201

@app.route('/api/classrooms', methods=['GET'])
@login_required
def get_classrooms():
    user_id = session.get('user_id')
    user_role = session.get('role')

    # Admins see all classrooms they created or are part of.
    # Regular users see all classrooms they are part of.
    if user_role == 'admin':
        classrooms = list(classrooms_collection.find({"$or": [{"creator_id": user_id}, {"participants": user_id}]}, {"_id": 0}).sort("created_at", -1))
    else: # 'user' role
        classrooms = list(classrooms_collection.find({"participants": user_id}, {"_id": 0}).sort("created_at", -1))

    print(f"Fetched {len(classrooms)} classrooms for {session.get('username')}")
    return jsonify(classrooms), 200

@app.route('/api/classrooms/<classroomId>', methods=['GET'])
@login_required
def get_classroom_details(classroomId):
    user_id = session.get('user_id')
    classroom = classrooms_collection.find_one({"id": classroomId}, {"_id": 0})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    # Ensure user is a participant or creator
    if user_id not in classroom.get('participants', []) and user_id != classroom.get('creator_id'):
        return jsonify({"error": "Forbidden: You are not a participant of this classroom."}), 403

    return jsonify(classroom), 200

@app.route('/api/join-classroom', methods=['POST'])
@login_required
def join_classroom():
    data = request.json
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    username = session.get('username')

    if not classroomId:
        return jsonify({"error": "Classroom ID is required"}), 400

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    if user_id not in classroom.get('participants', []):
        classrooms_collection.update_one(
            {"id": classroomId},
            {"$push": {"participants": user_id}}
        )
        print(f"User {username} joined classroom {classroomId}")
        return jsonify({"message": "Joined classroom successfully"}), 200
    else:
        return jsonify({"message": "Already a participant of this classroom"}), 200

# File Library Endpoints
@app.route('/api/upload-library-files', methods=['POST'])
@login_required
def upload_library_files():
    user_id = session.get('user_id')
    user_role = session.get('role')
    classroomId = request.form.get('classroomId') # Get classroomId from form data

    if user_role != 'admin':
        return jsonify({"error": "Forbidden: Only administrators can upload files."}), 403

    if 'files' not in request.files:
        return jsonify({"error": "No file part"}), 400

    if not classroomId:
        return jsonify({"error": "Classroom ID is required"}), 400

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    uploaded_files_info = []
    files = request.files.getlist('files')
    for file in files:
        if file.filename == '':
            continue
        if file:
            filename = secure_filename(file.filename)
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(filename)[1]
            new_filename = f"{file_id}{file_extension}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
            file.save(filepath)

            file_info = {
                "id": file_id,
                "classroomId": classroomId,
                "original_filename": filename,
                "stored_filename": new_filename,
                "uploaded_by": user_id,
                "uploaded_at": datetime.utcnow(),
                "mimetype": file.mimetype,
                "size": os.path.getsize(filepath)
            }
            library_files_collection.insert_one(file_info)
            uploaded_files_info.append(file_info)

    return jsonify({"message": "Files uploaded successfully", "files": uploaded_files_info}), 201

@app.route('/api/library-files/<classroomId>', methods=['GET'])
@login_required
def get_library_files(classroomId):
    user_id = session.get('user_id')
    
    # Check if user is part of the classroom
    classroom = classrooms_collection.find_one(
        {"id": classroomId, "$or": [{"creator_id": user_id}, {"participants": user_id}]}
    )
    if not classroom:
        return jsonify({"error": "Forbidden: You are not a participant of this classroom."}), 403

    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0}).sort("uploaded_at", -1))
    # Convert datetime objects to ISO strings for client-side
    for file_info in files:
        file_info['uploaded_at'] = file_info['uploaded_at'].isoformat() + 'Z'
    return jsonify(files), 200

@app.route('/uploads/<filename>', methods=['GET'])
@login_required
def download_file(filename):
    # This assumes that the client already has the file_id and classroomId,
    # and the client-side logic should ensure authorized access before calling this.
    # For stricter control, you might want to pass file_id and check permissions here.
    try:
        response = make_response(send_from_directory(app.config['UPLOAD_FOLDER'], filename))
        # Find the original filename to set as Content-Disposition header
        file_info = library_files_collection.find_one({"stored_filename": filename})
        if file_info and file_info.get('original_filename'):
            response.headers["Content-Disposition"] = f"attachment; filename=\"{file_info['original_filename']}\""
        return response
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

@app.route('/api/library-files/<fileId>', methods=['DELETE'])
@login_required
def delete_library_file(fileId):
    user_id = session.get('user_id')
    user_role = session.get('role')

    if user_role != 'admin':
        return jsonify({"error": "Forbidden: Only administrators can delete files."}), 403

    file_info = library_files_collection.find_one({"id": fileId})
    if not file_info:
        return jsonify({"error": "File not found"}), 404

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file_info['stored_filename'])
    if os.path.exists(filepath):
        os.remove(filepath)

    library_files_collection.delete_one({"id": fileId})
    return jsonify({"message": "File deleted successfully"}), 200

# Assessment Endpoints
@app.route('/api/assessments', methods=['POST'])
@login_required
def create_assessment():
    user_id = session.get('user_id')
    user_role = session.get('role')

    if user_role != 'admin':
        return jsonify({"error": "Forbidden: Only administrators can create assessments."}), 403

    data = request.json
    classroomId = data.get('classroomId')
    title = data.get('title')
    scheduled_at_str = data.get('scheduled_at') # ISO string from client
    questions_data = data.get('questions')

    if not all([classroomId, title, scheduled_at_str, questions_data]):
        return jsonify({"error": "Missing required assessment fields"}), 400

    try:
        scheduled_at = datetime.fromisoformat(scheduled_at_str.replace('Z', '+00:00')) # Handle 'Z' for UTC
    except ValueError:
        return jsonify({"error": "Invalid scheduled_at date format. Use ISO 8601."}), 400

    assessment_id = str(uuid.uuid4())
    assessment_doc = {
        "id": assessment_id,
        "classroomId": classroomId,
        "title": title,
        "scheduled_at": scheduled_at,
        "created_by": user_id,
        "created_at": datetime.utcnow()
    }
    assessments_collection.insert_one(assessment_doc)

    for q_data in questions_data:
        question_id = str(uuid.uuid4())
        question_doc = {
            "id": question_id,
            "assessmentId": assessment_id,
            "question_text": q_data.get('question_text'),
            "question_type": q_data.get('question_type'), # e.g., 'multiple_choice', 'short_answer', 'multi_select', 'true_false'
            "options": q_data.get('options'), # For multiple choice/select
            "correct_answer": q_data.get('correct_answer') # For auto-grading
        }
        assessment_questions_collection.insert_one(question_doc)

    print(f"Assessment '{title}' created in {classroomId} by {session.get('username')}")
    return jsonify({"message": "Assessment created successfully", "assessmentId": assessment_id}), 201

@app.route('/api/assessments/<classroomId>', methods=['GET'])
@login_required
def get_assessments(classroomId):
    user_id = session.get('user_id')
    
    # Check if user is part of the classroom
    classroom = classrooms_collection.find_one(
        {"id": classroomId, "$or": [{"creator_id": user_id}, {"participants": user_id}]}
    )
    if not classroom:
        return jsonify({"error": "Forbidden: You are not a participant of this classroom."}), 403

    assessments = list(assessments_collection.find(
        {"classroomId": classroomId},
        {"_id": 0}
    ).sort("created_at", -1)) # Most recent first

    # Convert datetime objects to ISO strings for client-side
    for assessment in assessments:
        assessment['scheduled_at'] = assessment['scheduled_at'].isoformat() + 'Z'
        assessment['created_at'] = assessment['created_at'].isoformat() + 'Z'

        # Check if current user has submitted this assessment
        submission = assessment_submissions_collection.find_one(
            {"assessmentId": assessment['id'], "user_id": user_id}
        )
        assessment['has_submitted'] = bool(submission)

    print(f"Fetched {len(assessments)} assessments for classroom {classroomId}")
    return jsonify(assessments), 200

@app.route('/api/assessments/take/<assessmentId>', methods=['GET'])
@login_required
def get_assessment_to_take(assessmentId):
    user_id = session.get('user_id')

    assessment = assessments_collection.find_one({"id": assessmentId}, {"_id": 0})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    # Ensure user is a participant of the classroom where the assessment belongs
    classroom = classrooms_collection.find_one(
        {"id": assessment['classroomId'], "$or": [{"creator_id": user_id}, {"participants": user_id}]}
    )
    if not classroom:
        return jsonify({"error": "Forbidden: You are not a participant of this classroom."}), 403

    # Fetch questions for this assessment
    questions = list(assessment_questions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))

    # Remove correct answers if the user is not an admin
    if session.get('role') != 'admin':
        for q in questions:
            q.pop('correct_answer', None) # Remove correct answer for regular users

    assessment['questions'] = questions
    assessment['scheduled_at'] = assessment['scheduled_at'].isoformat() + 'Z'
    assessment['created_at'] = assessment['created_at'].isoformat() + 'Z'

    print(f"Fetched assessment {assessmentId} for user {session.get('username')}")
    return jsonify(assessment), 200


@app.route('/api/submit-assessment', methods=['POST'])
@login_required
def submit_assessment():
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    data = request.json
    assessment_id = data.get('assessmentId')
    answers = data.get('answers') # Dictionary {questionId: "answer"} or {questionId: ["option1", "option2"]}
    submission_time_client = data.get('submissionTime') # Client-side timestamp

    if not all([assessment_id, answers is not None]):
        return jsonify({"error": "Missing assessmentId or answers"}), 400

    assessment = assessments_collection.find_one({"id": assessment_id})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    # Check if user is part of the classroom where the assessment belongs
    classroom = classrooms_collection.find_one(
        {"id": assessment['classroomId'], "$or": [{"creator_id": user_id}, {"participants": user_id}]}
    )
    if not classroom:
        return jsonify({"error": "Forbidden: You are not a participant of this classroom."}), 403

    # Prevent multiple submissions (optional, but good practice)
    existing_submission = assessment_submissions_collection.find_one(
        {"assessmentId": assessment_id, "user_id": user_id}
    )
    if existing_submission:
        return jsonify({"error": "You have already submitted this assessment."}), 409

    # Validate answers and calculate score (server-side calculation is more secure)
    total_score = 0
    correct_count = 0
    total_questions = 0
    detailed_answers = []

    all_assessment_questions = list(assessment_questions_collection.find({"assessmentId": assessment_id}))
    questions_map = {q['id']: q for q in all_assessment_questions}

    for question_id, user_answer in answers.items():
        question = questions_map.get(question_id)
        if not question:
            continue # Skip if question not found

        total_questions += 1
        is_correct = False
        correct_answer = question.get('correct_answer')

        if question.get('question_type') == 'multiple_choice' or question.get('question_type') == 'true_false':
            if isinstance(user_answer, str) and user_answer == correct_answer:
                is_correct = True
        elif question.get('question_type') == 'multi_select':
            # Ensure both are lists and compare as sets for order-independence
            if isinstance(user_answer, list) and isinstance(correct_answer, list):
                if set(user_answer) == set(correct_answer):
                    is_correct = True
        elif question.get('question_type') == 'short_answer' or question.get('question_type') == 'long_answer':
            # For text answers, might need more sophisticated comparison or manual grading
            # For now, a simple direct match for example purposes
            if isinstance(user_answer, str) and correct_answer and user_answer.strip().lower() == correct_answer.strip().lower():
                is_correct = True
            # Or, just record the answer for later manual review
            # is_correct = False # Assume not auto-gradable for now

        detailed_answers.append({
            "question_id": question_id,
            "user_answer": user_answer,
            "correct_answer": correct_answer, # Include for review
            "is_correct": is_correct
        })
        if is_correct:
            correct_count += 1
            total_score += 1 # Assuming 1 point per correct answer

    submission_id = str(uuid.uuid4())
    submission_doc = {
        "id": submission_id,
        "assessmentId": assessment_id,
        "classroomId": assessment['classroomId'],
        "user_id": user_id,
        "username": username,
        "submission_time": datetime.utcnow(),
        "submission_time_client": submission_time_client, # Keep client time for reference
        "answers": detailed_answers,
        "score": total_score,
        "total_questions": total_questions,
        "correct_count": correct_count
    }
    assessment_submissions_collection.insert_one(submission_doc)

    print(f"Assessment {assessment_id} submitted by {username} with score {total_score}/{total_questions}")
    
    # Emit admin action update to classroom
    socketio.emit('admin_action_update', {
        'classroomId': assessment['classroomId'],
        'message': f"User {username} submitted assessment '{assessment['title']}'."
    }, room=assessment['classroomId'])

    return jsonify({"message": "Assessment submitted successfully", "submission_id": submission_id, "score": total_score, "total_questions": total_questions}), 200


@app.route('/api/assessments/submissions/<assessmentId>', methods=['GET'])
@login_required
def get_assessment_submissions(assessmentId):
    user_id = session.get('user_id')
    user_role = session.get('role')

    if user_role != 'admin':
        return jsonify({"error": "Forbidden: Only administrators can view submissions."}), 403

    assessment = assessments_collection.find_one({"id": assessmentId}, {"_id": 0})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    submissions = list(assessment_submissions_collection.find(
        {"assessmentId": assessmentId},
        {"_id": 0}
    ).sort("submission_time", 1)) # Order by submission time

    for submission in submissions:
        submission['submission_time'] = submission['submission_time'].isoformat() + 'Z'
        # Optionally, fetch full question text for each answer to make display easier
        # This can be heavy if many questions/submissions. Consider doing this on client side if needed.

    print(f"Fetched {len(submissions)} submissions for assessment {assessmentId}")
    return jsonify({
        "assessment_title": assessment['title'],
        "submissions": submissions
    }), 200


# Socket.IO Event Handlers
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}, User ID: {session.get('user_id')}")
    # You might want to emit user_connected or update user status in DB here

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}, User ID: {session.get('user_id')}")
    # You might want to emit user_disconnected or update user status in DB here

@socketio.on('join')
def on_join(data):
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    if not classroomId or not user_id or not username:
        print(f"Join failed: Missing classroomId, userId, or username for SID {request.sid}")
        return

    # Check if the user is a participant or creator of the classroom
    classroom = classrooms_collection.find_one(
        {"id": classroomId, "$or": [{"creator_id": user_id}, {"participants": user_id}]}
    )
    if not classroom:
        print(f"User {username} ({user_id}) not authorized to join classroom {classroomId}")
        emit('status', {'message': 'Unauthorized to join this classroom.'}, room=request.sid)
        return

    join_room(classroomId)
    print(f"User {username} ({user_role}) with SID {request.sid} joined room {classroomId}")

    # Emit status to the joining client
    emit('status', {'message': f'You have joined classroom {classroomId}.'}, room=request.sid)

    # Emit user_joined to all others in the room
    emit('user_joined', {
        'username': username,
        'role': user_role,
        'sid': request.sid,
        'user_id': user_id # Include user_id for client-side filtering
    }, room=classroomId, include_self=False)

    # Send chat history to the newly joined user
    chat_history = list(chat_messages_collection.find(
        {"classroomId": classroomId}
    ).sort("timestamp", 1)) # Sort by timestamp ascending
    # Ensure messages have user_id and username for display
    for msg in chat_history:
        # Fetch user info if not directly stored in chat message (consider storing username/role directly on message creation)
        sender_user = users_collection.find_one({"id": msg.get("user_id")})
        msg['username'] = sender_user['username'] if sender_user else 'Unknown'
        msg['role'] = sender_user['role'] if sender_user else 'user'
        msg['timestamp'] = msg['timestamp'].isoformat() + 'Z' # Convert datetime to ISO string
        msg.pop('_id', None) # Remove MongoDB _id

    emit('chat_history', chat_history, room=request.sid)

@socketio.on('leave')
def on_leave(data):
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    username = session.get('username')
    if not classroomId or not user_id or not username:
        return

    leave_room(classroomId)
    print(f"User {username} ({user_id}) with SID {request.sid} left room {classroomId}")

    emit('user_left', {
        'username': username,
        'sid': request.sid,
        'user_id': user_id
    }, room=classroomId, include_self=False)


@socketio.on('send_message')
def handle_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    if not all([classroomId, message, user_id, username, user_role]):
        return

    chat_message = {
        "id": str(uuid.uuid4()),
        "classroomId": classroomId,
        "user_id": user_id,
        "username": username, # Store username directly for simplicity
        "role": user_role,    # Store role directly for simplicity
        "message": message,
        "timestamp": datetime.utcnow()
    }
    chat_messages_collection.insert_one(chat_message)

    # Broadcast message to all in the classroom
    emit('message', {
        'user_id': user_id,
        'username': username,
        'role': user_role,
        'message': message,
        'timestamp': chat_message['timestamp'].isoformat() + 'Z' # Send ISO formatted string
    }, room=classroomId)
    print(f"Message from {username} in {classroomId}: {message}")


@socketio.on('draw_whiteboard')
def handle_draw_whiteboard(data):
    classroomId = data.get('classroomId')
    page_index = data.get('pageIndex')
    drawing_data = data.get('data') # This is the drawing object (e.g., pen stroke, rectangle)
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not all([classroomId, drawing_data is not None, page_index is not None]):
        print("Missing drawing data, classroomId, or pageIndex for draw_whiteboard")
        return # Do not return jsonify, as this is Socket.IO

    # Only allow admins to draw
    if user_role != 'admin':
        emit('whiteboard_role_error', {'message': 'Only administrators can draw on the whiteboard.'}, room=request.sid)
        return

    # Store the drawing command in the database for the specific page
    # Find the whiteboard document for the classroom and page, or create if it doesn't exist
    whiteboard_collection.update_one(
        {"classroomId": classroomId, "pageIndex": page_index},
        {"$push": {"drawings": drawing_data}},
        upsert=True
    )

    # Broadcast the drawing data to all clients in the classroom, including the sender
    emit('whiteboard_data', {
        'action': 'draw',
        'classroomId': classroomId,
        'pageIndex': page_index,
        'data': drawing_data
    }, room=classroomId)
    # print(f"Whiteboard draw on page {page_index} in {classroomId} by {session.get('username')}")


@socketio.on('clear_whiteboard')
def handle_clear_whiteboard(data):
    classroomId = data.get('classroomId')
    page_index = data.get('pageIndex')
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not all([classroomId, page_index is not None]):
        print("Missing classroomId or pageIndex for clear_whiteboard")
        return

    # Only allow admins to clear
    if user_role != 'admin':
        emit('whiteboard_role_error', {'message': 'Only administrators can clear the whiteboard.'}, room=request.sid)
        return

    # Clear drawing commands for the specific page in the database
    whiteboard_collection.delete_one({"classroomId": classroomId, "pageIndex": page_index})
    # Re-insert an empty page entry to ensure the document exists for future drawings
    whiteboard_collection.insert_one({"classroomId": classroomId, "pageIndex": page_index, "drawings": []})

    # Broadcast the clear action to all clients in the classroom
    emit('whiteboard_data', {
        'action': 'clear',
        'classroomId': classroomId,
        'pageIndex': page_index
    }, room=classroomId)
    print(f"Whiteboard page {page_index} cleared in {classroomId} by {session.get('username')}")


@socketio.on('request_whiteboard_history')
def handle_request_whiteboard_history(data):
    classroomId = data.get('classroomId')
    page_index = data.get('pageIndex') # Client might request a specific page or expect full history based on max page
    user_id = session.get('user_id')

    if not classroomId or not user_id:
        print("Missing classroomId or user_id for request_whiteboard_history")
        return

    # Fetch all pages for the classroom to reconstruct the full whiteboardPages array on client
    # Sort by pageIndex to ensure correct order
    all_pages_data = list(whiteboard_collection.find({"classroomId": classroomId}).sort("pageIndex", 1))

    whiteboard_history_structure = []
    # Initialize a sparse array based on max page index found
    max_page = 0
    if all_pages_data:
        max_page = max(p.get('pageIndex', 0) for p in all_pages_data)

    for i in range(max_page + 1):
        whiteboard_history_structure.append([])

    for page_data in all_pages_data:
        p_idx = page_data.get('pageIndex')
        if p_idx is not None and p_idx < len(whiteboard_history_structure):
            whiteboard_history_structure[p_idx] = page_data.get('drawings', [])

    # If the requested page is beyond what's stored, ensure it's at least an empty array
    # This scenario should be handled by the client requesting existing pages or page 0 initially.
    # But if client requests page_index > max_page_index found, pad the array.
    if page_index is not None and page_index >= len(whiteboard_history_structure):
        # Extend the array with empty lists up to the requested page_index
        for _ in range(len(whiteboard_history_structure), page_index + 1):
            whiteboard_history_structure.append([])

    # Send the reconstructed full history structure to the requesting client
    emit('whiteboard_data', {
        'action': 'history',
        'classroomId': classroomId,
        'history': whiteboard_history_structure # Send the full structure
    }, room=request.sid)
    print(f"Sent whiteboard history for classroom {classroomId} to SID {request.sid}")


# WebRTC Signaling Handlers
@socketio.on('offer')
def handle_offer(data):
    target_sid = data['target_sid']
    classroomId = data['classroomId']
    offer = data['offer']
    sender_sid = request.sid
    print(f"[WebRTC] Offer from {sender_sid} to {target_sid} in {classroomId}")
    # Forward the offer to the target peer
    emit('offer', {'sender_sid': sender_sid, 'offer': offer, 'classroomId': classroomId}, room=target_sid)

@socketio.on('answer')
def handle_answer(data):
    target_sid = data['target_sid']
    classroomId = data['classroomId']
    answer = data['answer']
    sender_sid = request.sid
    print(f"[WebRTC] Answer from {sender_sid} to {target_sid} in {classroomId}")
    # Forward the answer to the target peer
    emit('answer', {'sender_sid': sender_sid, 'answer': answer, 'classroomId': classroomId}, room=target_sid)

@socketio.on('ice_candidate')
def handle_ice_candidate(data):
    target_sid = data['target_sid']
    classroomId = data['classroomId']
    candidate = data['candidate']
    sender_sid = request.sid
    print(f"[WebRTC] ICE Candidate from {sender_sid} to {target_sid} in {classroomId}")
    # Forward the ICE candidate to the target peer
    emit('ice_candidate', {'sender_sid': sender_sid, 'candidate': candidate, 'classroomId': classroomId}, room=target_sid)

@socketio.on('start_broadcast')
def handle_start_broadcast(data):
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    user_role = session.get('role')
    if user_role != 'admin':
        emit('broadcast_error', {'message': 'Only administrators can start a broadcast.'}, room=request.sid)
        return

    # Notify clients in the room that a broadcast has started
    emit('broadcast_started', {
        'classroomId': classroomId,
        'broadcaster_sid': request.sid,
        'broadcaster_username': session.get('username'),
        'broadcaster_user_id': user_id
    }, room=classroomId, include_self=False)
    print(f"Admin {session.get('username')} started broadcast in {classroomId}")

@socketio.on('end_broadcast')
def handle_end_broadcast(data):
    classroomId = data.get('classroomId')
    user_id = session.get('user_id')
    user_role = session.get('role')
    if user_role != 'admin':
        emit('broadcast_error', {'message': 'Only administrators can end a broadcast.'}, room=request.sid)
        return

    # Notify all clients in the room that the broadcast has ended
    emit('broadcast_ended', {
        'classroomId': classroomId,
        'broadcaster_sid': request.sid,
        'broadcaster_user_id': user_id
    }, room=classroomId)
    print(f"Admin {session.get('username')} ended broadcast in {classroomId}")


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
