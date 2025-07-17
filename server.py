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
assessment_questions_collection = mongo.db.assessment_questions # New
assessment_submissions_collection = mongo.db.assessment_submissions # New
# Modified whiteboard_collection to store drawings per page
whiteboard_collection = mongo.db.whiteboard_drawings_pages


# Ensure necessary directories exist for file uploads
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Global Whiteboard History Storage (NO LONGER USED FOR PERSISTENCE, KEPT FOR REFERENCE IF NEEDED) ---
# This will store whiteboard data per classroom, keyed by classroomId
# whiteboard_history = {} # This will be replaced by database storage


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
        
        filename = str(uuid.uuid4()) + "_" + file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        file_id = str(uuid.uuid4())
        library_files_collection.insert_one({
            "id": file_id,
            "classroomId": class_room_id,
            "filename": file.filename,
            "stored_filename": filename, # Store unique filename
            "url": f"/uploads/{filename}",
            "uploaded_by": user_id,
            "uploaded_at": datetime.utcnow()
        })
        uploaded_file_info.append({"id": file_id, "filename": file.filename, "url": f"/uploads/{filename}"})
    
    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"New file(s) uploaded to library by {session.get('username')}"
    }, room=class_room_id)

    return jsonify({"message": "Files uploaded successfully", "files": uploaded_file_info}), 201

@app.route('/api/library-files/<classroomId>', methods=['GET'])
def get_library_files(classroomId):
    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0}))
    return jsonify(files), 200

@app.route('/api/library-files/<fileId>', methods=['DELETE'])
def delete_library_file(fileId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    if user_role != 'admin':
        return jsonify({"error": "Forbidden: Only administrators can delete files."}), 403

    file_data = library_files_collection.find_one({"id": fileId})
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
            'message': f"File '{file_data.get('filename')}' deleted from library by {session.get('username')}"
        }, room=file_data.get('classroomId'))
        return jsonify({"message": "File deleted successfully"}), 200
    return jsonify({"error": "File not found"}), 404


@app.route('/api/classrooms', methods=['POST'])
def create_classroom():
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only admins can create classrooms"}), 403

    data = request.json
    name = data.get('name')
    if not name:
        return jsonify({"error": "Classroom name is required"}), 400

    classroom_id = str(uuid.uuid4())
    classrooms_collection.insert_one({
        "id": classroom_id,
        "name": name,
        "created_by": user_id,
        "created_at": datetime.utcnow()
    })
    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': classroom_id, # This is a new classroom, so no existing room to emit to yet
        'message': f"New classroom '{name}' created by {session.get('username')}"
    })
    return jsonify({"message": "Classroom created successfully", "classroom": {"id": classroom_id, "name": name}}), 201

@app.route('/api/classrooms', methods=['GET'])
def get_user_classrooms():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # In a real app, you'd fetch classrooms the user is enrolled in.
    # For this example, we'll return all classrooms for simplicity,
    # or you might want to adjust logic based on user role.
    classrooms = list(classrooms_collection.find({}, {"_id": 0}))
    return jsonify(classrooms), 200

@app.route('/api/classrooms/join', methods=['POST'])
def join_classroom():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    classroomId = data.get('classroomId')
    if not classroomId:
        return jsonify({"error": "Classroom ID is required"}), 400

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404
    
    # In a real app, you might add the user to a list of members in the classroom document
    # For now, simply confirming join is enough as Socket.IO handles room joining.
    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': classroomId,
        'message': f"{session.get('username')} joined the classroom."
    }, room=classroomId)

    return jsonify({"message": "Joined classroom successfully", "classroom": {"id": classroom['id'], "name": classroom['name']}}), 200

# --- Assessment API Endpoints ---
@app.route('/api/assessments', methods=['POST'])
def create_assessment():
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only admins can create assessments"}), 403
    
    data = request.json
    classroomId = data.get('classroomId')
    title = data.get('title')
    description = data.get('description')
    questions_data = data.get('questions')

    if not all([classroomId, title, questions_data]):
        return jsonify({"error": "Missing required assessment fields"}), 400
    
    assessment_id = str(uuid.uuid4())
    assessment_questions_for_db = []
    for q_data in questions_data:
        q_id = str(uuid.uuid4())
        question_entry = {
            "id": q_id,
            "text": q_data['text'],
            "type": q_data['type'],
        }
        if q_data['type'] == 'mcq':
            question_entry['options'] = q_data['options']
            question_entry['correct_answer'] = q_data['correct_answer']
        assessment_questions_for_db.append(question_entry)

    assessments_collection.insert_one({
        "id": assessment_id,
        "classroomId": classroomId,
        "title": title,
        "description": description,
        "created_by": user_id,
        "created_at": datetime.utcnow()
    })
    assessment_questions_collection.insert_many([
        {"assessmentId": assessment_id, **q} for q in assessment_questions_for_db
    ])

    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': classroomId,
        'message': f"New assessment '{title}' created by {session.get('username')}"
    }, room=classroomId)

    return jsonify({"message": "Assessment created successfully", "assessmentId": assessment_id}), 201

@app.route('/api/assessments/<classroomId>', methods=['GET'])
def get_assessments_for_classroom(classroomId):
    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"_id": 0}))
    for assessment in assessments:
        assessment['questions'] = list(assessment_questions_collection.find({"assessmentId": assessment['id']}, {"_id": 0}))
    return jsonify(assessments), 200

@app.route('/api/assessments/<assessmentId>', methods=['GET'])
def get_assessment_details(assessmentId):
    assessment = assessments_collection.find_one({"id": assessmentId}, {"_id": 0})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404
    assessment['questions'] = list(assessment_questions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))
    return jsonify(assessment), 200

@app.route('/api/assessments/<assessmentId>/submit', methods=['POST'])
def submit_assessment():
    user_id = session.get('user_id')
    user_username = session.get('username')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    assessmentId = data.get('assessmentId')
    classroomId = data.get('classroomId') # Ensure classroomId is passed for room emission
    answers = data.get('answers')

    if not all([assessmentId, answers, classroomId]):
        return jsonify({"error": "Missing required submission fields"}), 400

    assessment_doc = assessments_collection.find_one({"id": assessmentId})
    if not assessment_doc:
        return jsonify({"error": "Assessment not found"}), 404

    total_questions = len(answers)
    correct_answers_count = 0
    detailed_answers = []

    for submitted_answer in answers:
        question_id = submitted_answer.get('question_id')
        user_answer = submitted_answer.get('user_answer')
        question_text = submitted_answer.get('question_text') # Pass through for display
        question_type = submitted_answer.get('question_type') # Pass through for display
        correct_answer_from_client = submitted_answer.get('correct_answer') # From client, for scoring logic

        # Fetch the original question to verify the correct answer
        original_question = assessment_questions_collection.find_one({"id": question_id, "assessmentId": assessmentId})
        if not original_question:
            # Handle case where question might not be found (shouldn't happen if client data is correct)
            is_correct = False
            actual_correct_answer = "N/A"
        else:
            actual_correct_answer = original_question.get('correct_answer')
            if question_type == 'mcq':
                is_correct = (str(user_answer).strip().upper() == str(actual_correct_answer).strip().upper())
            else: # For 'text' type, usually just record the answer, no auto-scoring
                is_correct = None # Or implement fuzzy matching/manual review
            
            if is_correct:
                correct_answers_count += 1
        
        detailed_answers.append({
            "question_id": question_id,
            "question_text": question_text,
            "question_type": question_type,
            "user_answer": user_answer,
            "correct_answer": actual_correct_answer,
            "is_correct": is_correct
        })

    submission_id = str(uuid.uuid4())
    assessment_submissions_collection.insert_one({
        "id": submission_id,
        "assessmentId": assessmentId,
        "classroomId": classroomId,
        "userId": user_id,
        "username": user_username,
        "submitted_at": datetime.utcnow(),
        "answers": detailed_answers,
        "score": correct_answers_count,
        "total_questions": total_questions
    })

    # Emit admin action update
    socketio.emit('admin_action_update', {
        'classroomId': classroomId,
        'message': f"User {user_username} submitted an assessment for '{assessment_doc.get('title')}'."
    }, room=classroomId)

    return jsonify({"message": "Assessment submitted successfully!", "submissionId": submission_id, "score": correct_answers_count, "total_questions": total_questions}), 201

@app.route('/api/assessments/<assessmentId>/submissions', methods=['GET'])
def get_assessment_submissions(assessmentId):
    user_role = session.get('role')
    if user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only admins can view submissions"}), 403

    submissions = list(assessment_submissions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))
    return jsonify(submissions), 200

@app.route('/api/assessments/<assessmentId>', methods=['DELETE'])
def delete_assessment(assessmentId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only admins can delete assessments"}), 403

    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    # Delete associated questions and submissions
    assessment_questions_collection.delete_many({"assessmentId": assessmentId})
    assessment_submissions_collection.delete_many({"assessmentId": assessmentId})
    result = assessments_collection.delete_one({"id": assessmentId})

    if result.deleted_count > 0:
        # Emit admin action update
        socketio.emit('admin_action_update', {
            'classroomId': assessment.get('classroomId'),
            'message': f"Assessment '{assessment.get('title')}' and its submissions deleted by {session.get('username')}"
        }, room=assessment.get('classroomId'))
        return jsonify({"message": "Assessment and its related data deleted successfully"}), 200
    return jsonify({"error": "Assessment not found"}), 404

# --- Whiteboard API Endpoints (for persistence) ---
@app.route('/api/whiteboard-history/<classroomId>', methods=['GET'])
def get_whiteboard_history(classroomId):
    # Fetch all drawing commands for all pages in this classroom
    # Sort by pageIndex and then by the order in which they were stored
    history_cursor = whiteboard_collection.find(
        {"classroomId": classroomId},
        {"_id": 0, "pageIndex": 1, "drawings": 1}
    ).sort("pageIndex", 1)

    # Reconstruct history into a list of lists, where each inner list is a page
    whiteboard_history_pages = {}
    for entry in history_cursor:
        page_index = entry.get('pageIndex', 0)
        drawings = entry.get('drawings', [])
        if page_index not in whiteboard_history_pages:
            whiteboard_history_pages[page_index] = []
        whiteboard_history_pages[page_index].extend(drawings)
    
    # Convert dict to ordered list of lists
    ordered_history = [whiteboard_history_pages[i] for i in sorted(whiteboard_history_pages.keys())]

    return jsonify({"history": ordered_history}), 200


# --- Socket.IO Event Handlers ---
@socketio.on('join')
def on_join(data):
    classroomId = data.get('classroomId')
    role = data.get('role')
    username = session.get('username', 'Anonymous') # Get username from session

    if not classroomId:
        print("Join failed: Missing classroomId")
        return
    
    join_room(classroomId)
    print(f"User {username} ({request.sid}) joined classroom {classroomId} with role {role}")
    
    # Notify others in the room that a user has joined
    emit('user_joined', {'username': username, 'sid': request.sid, 'role': role}, room=classroomId, include_sid=False)
    # Emit status back to the joining user
    emit('status', {'message': f"Welcome to classroom {classroomId}!"})


@socketio.on('message')
def on_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    username = session.get('username', 'Anonymous') # Get username from session
    role = session.get('role', 'user') # Get role from session

    if not classroomId or not message:
        print("Message failed: Missing classroomId or message")
        return
    
    # Emit the message to all clients in the classroom
    emit('message', {'username': username, 'message': message, 'role': role}, room=classroomId)
    print(f"Message from {username} in {classroomId}: {message}")


@socketio.on('whiteboard_data')
def handle_whiteboard_data(data):
    classroomId = data.get('data', {}).get('classroomId') # Handle nested data from client
    action = data.get('action')
    drawing_data = data.get('data')

    if not classroomId or not action or not drawing_data:
        print(f"Whiteboard data missing: {data}")
        return

    # Store data in MongoDB
    if action == 'draw':
        # Find the document for the specific classroom and page, or create if it doesn't exist
        whiteboard_collection.update_one(
            {"classroomId": classroomId, "pageIndex": drawing_data['pageIndex']},
            {"$push": {"drawings": {
                "prevX": drawing_data['prevX'],
                "prevY": drawing_data['prevY'],
                "currX": drawing_data['currX'],
                "currY": drawing_data['currY'],
                "color": drawing_data['color'],
                "width": drawing_data['width']
            }}},
            upsert=True # Create the document if it doesn't exist
        )
    elif action == 'clear':
        # Clear drawings for a specific page
        whiteboard_collection.update_one(
            {"classroomId": classroomId, "pageIndex": drawing_data['pageIndex']},
            {"$set": {"drawings": []}} # Set drawings to an empty array
        )
        print(f"Whiteboard page {drawing_data['pageIndex']} cleared in classroom {classroomId}")

    # Broadcast to all other clients in the room
    emit('whiteboard_data', data, room=classroomId, include_sid=False)
    print(f"Whiteboard: Broadcasted {action} data for classroom {classroomId}")


@socketio.on('whiteboard_page_change')
def handle_whiteboard_page_change(data):
    classroomId = data.get('classroomId')
    new_page_index = data.get('newPageIndex')
    action = data.get('action') # 'add_page' or just page change

    if not classroomId or new_page_index is None:
        print(f"Whiteboard page change missing data: {data}")
        return

    # If a new page is explicitly added by the admin, ensure it exists in DB
    if action == 'add_page':
        whiteboard_collection.update_one(
            {"classroomId": classroomId, "pageIndex": new_page_index},
            {"$setOnInsert": {"drawings": []}}, # Initialize with empty drawings if new
            upsert=True
        )
        print(f"Whiteboard: New page {new_page_index} ensured in classroom {classroomId}")

    # Broadcast page change to all other clients in the room
    emit('whiteboard_page_change', {'newPageIndex': new_page_index}, room=classroomId, include_sid=False)
    print(f"Whiteboard: Broadcasted page change to {new_page_index} for classroom {classroomId}")


@socketio.on('admin_broadcast_started')
def handle_admin_broadcast_started(data):
    classroomId = data.get('classroomId')
    stream_type = data.get('streamType')
    username = session.get('username', 'Admin') # Assuming admin is broadcasting
    if not classroomId or not stream_type:
        print(f"Admin broadcast started signal missing data: {data}")
        return
    # Notify all clients in the room that an admin has started a broadcast
    emit('admin_action_update', {
        'classroomId': classroomId,
        'message': f"{username} started a {stream_type} broadcast."
    }, room=classroomId)
    print(f"Admin: Broadcast started in classroom {classroomId} by {username} ({stream_type})")


@socketio.on('admin_broadcast_ended')
def handle_admin_broadcast_ended(data):
    classroomId = data.get('classroomId')
    username = session.get('username', 'Admin')
    if not classroomId:
        print(f"Admin broadcast ended signal missing data: {data}")
        return
    # Notify all clients in the room that an admin has ended a broadcast
    emit('admin_action_update', {
        'classroomId': classroomId,
        'message': f"{username} ended the broadcast."
    }, room=classroomId)
    print(f"Admin: Broadcast ended in classroom {classroomId} by {username}")


@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    recipient_id = data.get('recipient_id')
    classroomId = data.get('classroomId')
    offer = data.get('offer')
    sender_id = request.sid

    if not recipient_id or not offer or not classroomId:
        print(f"Missing data for webrtc_offer: {data}")
        return
    
    # Emit the offer to the specific recipient
    emit('webrtc_offer', {'offer': offer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    recipient_id = data.get('recipient_id')
    classroomId = data.get('classroomId')
    answer = data.get('answer')
    sender_id = request.sid

    if not recipient_id or not answer or not classroomId:
        print(f"Missing data for webrtc_answer: {data}")
        return
    
    # Emit the answer to the specific recipient
    emit('webrtc_answer', {'answer': answer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Answer from {sender_id} to {recipient_id} in classroom {classroomId}")


@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    recipient_id = data.get('recipient_id')
    classroomId = data.get('classroomId')
    candidate = data.get('candidate')
    sender_id = request.sid

    if not recipient_id or not candidate or not classroomId:
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


@socketio.on('disconnect')
def on_disconnect():
    user_id = session.get('user_id')
    username = session.get('username', 'Anonymous')
    role = session.get('role', 'user')
    classroomId = None # Need to find the classroom the user was in

    # Iterate through all rooms the user was in and identify classroom rooms
    for room_id in socketio.rooms(request.sid):
        if room_id != request.sid and room_id != app.sid: # Exclude personal room and main app room
            classroomId = room_id
            break

    if classroomId:
        leave_room(classroomId)
        print(f"User {username} ({request.sid}) left classroom {classroomId}")
        # Notify others in the room that a user has left
        emit('user_left', {'username': username, 'sid': request.sid}, room=classroomId, include_sid=False)
    else:
        print(f"User {username} ({request.sid}) disconnected from no specific classroom.")


# --- Main Run Block ---
if __name__ == '__main__':
    # When using Flask-SocketIO with gevent, you run the SocketIO instance
    # directly using socketio.run, which wraps the WSGI server.
    print("Server running on http://localhost:5000 (with Socket.IO)")
    socketio.run(app, debug=True, port=5000)
