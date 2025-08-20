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
from bson.objectid import ObjectId # To handle MongoDB's _id

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
from gevent.threadpool import ThreadPool
thread_pool = ThreadPool(10) # Adjust pool size as needed
mongo = PyMongo(app) # Initialize PyMongo after app config

# MongoDB Collections
users_collection = mongo.db.users
classrooms_collection = mongo.db.classrooms
files_collection = mongo.db.files
assessments_collection = mongo.db.assessments
submissions_collection = mongo.db.submissions


# --- API Routes ---

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # This route handles all other static files like CSS, JS, etc.
    return send_from_directory('.', path)

@app.route('/classroom/<string:classroomId>')
def serve_classroom(classroomId):
    # This route serves the single-page application for a specific classroom URL
    return send_from_directory('.', 'index.html')


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Missing username, email, or password"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    # Set the role to 'admin' for the first user, otherwise 'user'
    is_first_user = users_collection.count_documents({}) == 0
    role = 'admin' if is_first_user else 'user'
    
    hashed_password = generate_password_hash(password)
    new_user = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": role # Assign role
    }
    users_collection.insert_one(new_user)
    return jsonify({"message": "User registered successfully"}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({"email": email})
    if user and check_password_hash(user['password'], password):
        # Successful login, create a session
        session.permanent = True
        session['user_id'] = str(user['_id'])
        session['username'] = user['username']
        session['role'] = user['role'] # Store the user's role in the session

        return jsonify({
            "message": "Login successful",
            "user": {
                "id": str(user['_id']),
                "username": user['username'],
                "email": user['email'],
                "role": user['role']
            }
        }), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/create-classroom', methods=['POST'])
def create_classroom():
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can create classrooms."}), 401

    data = request.json
    name = data.get('name')
    description = data.get('description', '')

    if not name:
        return jsonify({"error": "Missing classroom name"}), 400

    classroom_id = str(uuid.uuid4())
    classrooms_collection.insert_one({
        "id": classroom_id,
        "name": name,
        "description": description,
        "creator_id": user_id,
        "participants": [user_id], # Add the creator to the participants list
        "created_at": datetime.utcnow()
    })

    print(f"Classroom '{name}' created by admin {session.get('username')}")
    return jsonify({"message": "Classroom created successfully", "classroomId": classroom_id}), 201


@app.route('/api/classrooms', methods=['GET'])
def get_classrooms():
    # Only authenticated users can see classrooms
    if not session.get('user_id'):
        return jsonify({"error": "Unauthorized"}), 401

    all_classrooms = classrooms_collection.find({})
    classroom_list = [{
        "id": cls["id"],
        "name": cls["name"],
        "creator_id": cls["creator_id"],
        "participants": cls.get("participants", []),
        "created_at": cls["created_at"].isoformat()
    } for cls in all_classrooms]
    return jsonify(classroom_list), 200


@app.route('/api/classrooms/<string:classroomId>', methods=['GET'])
def get_classroom(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    return jsonify({
        "id": classroom["id"],
        "name": classroom["name"],
        "description": classroom.get("description", ""),
        "creator_id": classroom["creator_id"],
        "participants": classroom.get("participants", [])
    }), 200


@app.route('/api/join-classroom', methods=['POST'])
def join_classroom():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    classroomId = data.get('classroomId')
    if not classroomId:
        return jsonify({"error": "Missing classroom ID"}), 400

    result = classrooms_collection.update_one(
        {"id": classroomId},
        {"$addToSet": {"participants": user_id}}
    )

    if result.modified_count == 0 and result.matched_count == 0:
        return jsonify({"error": "Classroom not found"}), 404
    elif result.modified_count == 0:
        return jsonify({"message": "Already a participant in this classroom"}), 200
    else:
        return jsonify({"message": "Joined classroom successfully"}), 200


@app.route('/api/classrooms/<string:classroomId>/users', methods=['GET'])
def get_classroom_users(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        return jsonify({"error": "Classroom not found"}), 404

    # Fetch user details for each participant in the classroom
    participant_ids = classroom.get('participants', [])
    participants = users_collection.find({"_id": {"$in": [ObjectId(uid) for uid in participant_ids]}})
    
    user_list = []
    for user in participants:
        user_list.append({
            "id": str(user['_id']),
            "username": user['username'],
            "role": user['role']
        })
    
    return jsonify(user_list), 200


@app.route('/api/classrooms/<string:classroomId>/files', methods=['GET'])
def get_files_in_classroom(classroomId):
    if not session.get('user_id'):
        return jsonify({"error": "Unauthorized"}), 401
    
    files_in_class = files_collection.find({"classroomId": classroomId}).sort("uploaded_at", -1)
    file_list = []
    for f in files_in_class:
        uploader = users_collection.find_one({"_id": ObjectId(f['uploader_id'])})
        file_list.append({
            "_id": str(f['_id']),
            "filename": f['filename'],
            "url": f['url'],
            "uploader_name": uploader['username'] if uploader else 'Unknown',
            "uploaded_at": f['uploaded_at'].isoformat()
        })
    return jsonify(file_list), 200


@app.route('/api/classrooms/<string:classroomId>/files', methods=['POST'])
def upload_file_to_classroom(classroomId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can upload files."}), 401
    
    if 'files' not in request.files:
        return jsonify({"error": "No file part"}), 400

    files = request.files.getlist('files')
    if not files or all(f.filename == '' for f in files):
        return jsonify({"error": "No selected file"}), 400

    uploaded_files = []
    for file in files:
        if file.filename:
            filename = file.filename
            # Store the file in a directory or a service like S3. For this example, we'll simulate.
            # In a real app, this would be a more robust storage solution.
            file_id = str(uuid.uuid4())
            file_url = f"/uploads/{file_id}-{filename}"
            # Save the file to a local directory for this example
            if not os.path.exists('uploads'):
                os.makedirs('uploads')
            file.save(os.path.join('uploads', f"{file_id}-{filename}"))
            
            file_record = {
                "classroomId": classroomId,
                "uploader_id": user_id,
                "filename": filename,
                "url": file_url,
                "uploaded_at": datetime.utcnow()
            }
            inserted_file = files_collection.insert_one(file_record)
            
            # Emit socket event for the new file
            uploader = users_collection.find_one({"_id": ObjectId(user_id)})
            socketio.emit('new_library_file', {
                "classroomId": classroomId,
                "file": {
                    "_id": str(inserted_file.inserted_id),
                    "filename": filename,
                    "url": file_url,
                    "uploader_name": uploader['username'] if uploader else 'Unknown'
                }
            }, room=classroomId, include_sid=False)
            
            uploaded_files.append({"filename": filename, "url": file_url})
            
    return jsonify({"message": "File(s) uploaded successfully", "files": uploaded_files}), 201


@app.route('/api/classrooms/<string:classroomId>/files/<string:fileId>', methods=['DELETE'])
def delete_file_from_classroom(classroomId, fileId):
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can delete files."}), 401
    
    try:
        file_obj = files_collection.find_one({"_id": ObjectId(fileId), "classroomId": classroomId})
        if not file_obj:
            return jsonify({"error": "File not found"}), 404

        # In a real-world app, you would also delete the file from storage (e.g., S3 or local disk)
        # For now, we'll just delete the database record.
        files_collection.delete_one({"_id": ObjectId(fileId), "classroomId": classroomId})

        socketio.emit('file_deleted_confirmation', {
            "classroomId": classroomId,
            "filename": file_obj['filename'],
            "fileId": fileId
        }, room=classroomId, include_sid=False)

        return jsonify({"message": "File deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting file: {e}")
        return jsonify({"error": "An error occurred while deleting the file."}), 500


@app.route('/api/classrooms/<string:classroomId>/assessments', methods=['GET'])
def get_assessments_in_classroom(classroomId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    assessments = assessments_collection.find({"classroomId": classroomId}).sort("scheduled_at", -1)
    assessment_list = []
    for assessment in assessments:
        assessment_list.append({
            "_id": str(assessment['_id']),
            "title": assessment['title'],
            "description": assessment.get('description', ''),
            "scheduled_at": assessment['scheduled_at'].isoformat(),
            "duration_minutes": assessment['duration_minutes']
        })
    return jsonify(assessment_list), 200


@app.route('/api/classrooms/<string:classroomId>/assessments', methods=['POST'])
def create_assessment(classroomId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can create assessments."}), 401

    data = request.json
    title = data.get('title')
    description = data.get('description', '')
    scheduled_at = data.get('scheduled_at')
    duration_minutes = data.get('duration_minutes')
    questions = data.get('questions', [])

    if not title or not scheduled_at or not duration_minutes or not questions:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        scheduled_dt = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00')) # Handle timezone
    except ValueError:
        return jsonify({"error": "Invalid scheduled date/time format"}), 400

    new_assessment = {
        "classroomId": classroomId,
        "title": title,
        "description": description,
        "scheduled_at": scheduled_dt,
        "duration_minutes": duration_minutes,
        "questions": questions,
        "creator_id": user_id
    }

    assessments_collection.insert_one(new_assessment)
    
    socketio.emit('new_assessment', {
        "classroomId": classroomId,
        "title": title
    }, room=classroomId, include_sid=False)
    
    return jsonify({"message": "Assessment created successfully"}), 201


@app.route('/api/classrooms/<string:classroomId>/assessments/<string:assessmentId>', methods=['GET'])
def get_assessment(classroomId, assessmentId):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        assessment = assessments_collection.find_one({"_id": ObjectId(assessmentId), "classroomId": classroomId})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404

        # Strip correct answers for non-admin users
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user and user['role'] != 'admin':
            for q in assessment['questions']:
                if 'correct_answer' in q:
                    del q['correct_answer']

        return jsonify({
            "_id": str(assessment['_id']),
            "title": assessment['title'],
            "description": assessment['description'],
            "scheduled_at": assessment['scheduled_at'].isoformat(),
            "duration_minutes": assessment['duration_minutes'],
            "questions": assessment['questions']
        }), 200
    except Exception as e:
        print(f"Error getting assessment: {e}")
        return jsonify({"error": "Invalid assessment ID"}), 400


@app.route('/api/classrooms/<string:classroomId>/assessments/<string:assessmentId>', methods=['DELETE'])
def delete_assessment(classroomId, assessmentId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can delete assessments."}), 401

    try:
        assessment = assessments_collection.find_one({"_id": ObjectId(assessmentId), "classroomId": classroomId})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404

        # Delete the assessment and all associated submissions
        assessments_collection.delete_one({"_id": ObjectId(assessmentId)})
        submissions_collection.delete_many({"assessmentId": assessmentId})

        socketio.emit('assessment_deleted_confirmation', {
            "classroomId": classroomId,
            "title": assessment['title']
        }, room=classroomId, include_sid=False)

        return jsonify({"message": "Assessment and its submissions deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting assessment: {e}")
        return jsonify({"error": "An error occurred while deleting the assessment."}), 500


@app.route('/api/classrooms/<string:classroomId>/assessments/<string:assessmentId>/submit', methods=['POST'])
def submit_assessment(classroomId, assessmentId):
    user_id = session.get('user_id')
    user_username = session.get('username')
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    answers = data.get('answers', {})

    if not answers:
        return jsonify({"error": "No answers provided"}), 400

    new_submission = {
        "classroomId": classroomId,
        "assessmentId": assessmentId,
        "user_id": user_id,
        "username": user_username,
        "answers": answers,
        "submitted_at": datetime.utcnow()
    }
    submissions_collection.insert_one(new_submission)

    # Notify admins about the new submission
    assessment = assessments_collection.find_one({"_id": ObjectId(assessmentId)})
    if assessment:
        socketio.emit('new_submission', {
            "classroomId": classroomId,
            "title": assessment['title'],
            "username": user_username
        }, room=classroomId, include_sid=False)
    
    return jsonify({"message": "Submission successful"}), 201


@app.route('/api/classrooms/<string:classroomId>/assessments/<string:assessmentId>/submissions', methods=['GET'])
def get_submissions_for_assessment(classroomId, assessmentId):
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        return jsonify({"error": "Unauthorized: Only administrators can view submissions."}), 401

    submissions = submissions_collection.find({"classroomId": classroomId, "assessmentId": assessmentId}).sort("submitted_at", 1)
    submission_list = []
    for s in submissions:
        submission_list.append({
            "_id": str(s['_id']),
            "user_id": s['user_id'],
            "username": s.get('username', 'Unknown User'),
            "submitted_at": s['submitted_at'].isoformat(),
            "answers": s['answers']
        })
    return jsonify(submission_list), 200


# --- SocketIO Events ---

@socketio.on('join')
def on_join(data):
    classroomId = data.get('classroomId')
    username = data.get('username')
    
    if not classroomId or not username:
        print("Missing data for join event")
        return
        
    join_room(classroomId)
    emit('status_message', {'message': f'{username} has entered the room.'}, room=classroomId)
    print(f"User {username} joined classroom {classroomId}")
    
@socketio.on('chat_message')
def handle_chat_message(data):
    classroomId = data.get('classroomId')
    message = data.get('message')
    username = data.get('username')
    role = data.get('role')
    
    if not classroomId or not message or not username:
        print("Missing data for chat_message event")
        return
        
    emit('new_chat_message', {'username': username, 'role': role, 'message': message}, room=classroomId, include_sid=False)


@socketio.on('whiteboard_draw')
def handle_whiteboard_draw(data):
    classroomId = data.get('classroomId')
    command = data.get('command')
    sender_sid = request.sid
    
    if not classroomId or not command:
        print("Missing data for whiteboard_draw event")
        return
    
    # Store the command in the database
    # This would require a more complex schema, e.g., a 'whiteboard_commands' collection
    # For now, we'll just broadcast the command
    
    # Re-emit the command to everyone in the room except the sender
    emit('whiteboard_draw_command', command, room=classroomId, include_sid=False)


@socketio.on('request_whiteboard_state')
def handle_request_whiteboard_state(data):
    classroomId = data.get('classroomId')
    # In a real app, you would fetch the current whiteboard state from the database
    # For this example, we'll simulate a simple state
    initial_state = {
        'pages': [[]], # A list of pages, each page is a list of commands
        'currentPageIndex': 0
    }
    emit('whiteboard_state', initial_state, room=request.sid)


@socketio.on('file_deleted')
def handle_file_deleted_signal(data):
    classroomId = data.get('classroomId')
    filename = data.get('filename')
    fileId = data.get('fileId')
    
    if not classroomId or not filename or not fileId:
        print(f"Missing data for file_deleted: {data}")
        return
    
    # Re-emit the confirmation to all clients to update their lists
    emit('file_deleted_confirmation', {
        'classroomId': classroomId,
        'filename': filename
    }, room=classroomId, include_sid=False)


@socketio.on('new_assessment_created')
def handle_new_assessment_created(data):
    classroomId = data.get('classroomId')
    title = data.get('title')
    if not classroomId or not title:
        print(f"Missing data for new_assessment_created: {data}")
        return
    emit('new_assessment', {'title': title}, room=classroomId, include_sid=False)


@socketio.on('assessment_deleted')
def handle_assessment_deleted(data):
    classroomId = data.get('classroomId')
    title = data.get('title')
    if not classroomId or not title:
        print(f"Missing data for assessment_deleted: {data}")
        return
    emit('assessment_deleted_confirmation', {'title': title}, room=classroomId, include_sid=False)


@socketio.on('new_assessment_submission')
def handle_new_assessment_submission(data):
    classroomId = data.get('classroomId')
    title = data.get('title')
    if not classroomId or not title:
        print(f"Missing data for new_assessment_submission: {data}")
        return
    emit('new_submission', {'title': title}, room=classroomId, include_sid=False)


# WebRTC Signaling Handlers
@socketio.on('webrtc_peer_offer')
def handle_webrtc_offer(data):
    recipient_id = data.get('recipient_id')
    offer = data.get('offer')
    classroomId = data.get('classroomId')
    sender_id = request.sid

    if not recipient_id or not offer or not classroomId:
        print(f"Missing data for webrtc_peer_offer: {data}")
        return

    emit('webrtc_peer_offer', {'offer': offer, 'sender_id': sender_id}, room=recipient_id)
    print(f"WEBRTC: Offer from {sender_id} to {recipient_id} in classroom {classroomId}")


@socketio.on('webrtc_peer_answer')
def handle_webrtc_answer(data):
    recipient_id = data.get('recipient_id')
    answer = data.get('answer')
    classroomId = data.get('classroomId')
    sender_id = request.sid
    
    if not recipient_id or not answer or not classroomId:
        print(f"Missing data for webrtc_peer_answer: {data}")
        return
        
    emit('webrtc_peer_answer', {'answer': answer, 'sender_id': sender_id}, room=recipient_id)
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
        print(f"Admin action update from {session.get('username')} in classroom {classroomId}: {message}")


@socketio.on('disconnect')
def on_disconnect():
    print(f"Client disconnected: {request.sid}")


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=os.environ.get('PORT', 5000))
