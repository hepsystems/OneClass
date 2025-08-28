# server.py

# --- IMPORTANT: Gevent Monkey Patching MUST be at the very top ---
# Gevent monkey patching is essential for Flask-SocketIO to work efficiently
# with concurrent I/O operations, especially for WebRTC and long-polling.
import gevent.monkey
gevent.monkey.patch_all()

# --- Standard Imports ---
# Flask for web framework functionalities like routing, requests, jsonify, sessions.
from flask import Flask, request, jsonify, send_from_directory, session
# Flask-PyMongo for MongoDB integration.
from flask_pymongo import PyMongo
# Werkzeug for password hashing and checking, crucial for secure authentication.
from werkzeug.security import generate_password_hash, check_password_hash
# OS module for operating system dependent functionalities, e.g., file paths.
import os
# UUID for generating universally unique identifiers for various entities (users, classrooms, files).
import uuid
# Datetime for handling date and time objects, used for timestamps and scheduling.
from datetime import datetime, timedelta
# ObjectId from BSON is typically used for MongoDB's default primary key, but we'll primarily use UUID strings.
from bson.objectid import ObjectId

# Import Flask-SocketIO and SocketIO for real-time, bidirectional communication.
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
# Flask-CORS for handling Cross-Origin Resource Sharing, necessary for frontend-backend communication.
from flask_cors import CORS

# --- APScheduler and GeventExecutor for background scheduled tasks ---
# GeventScheduler is a job scheduler that works well with Gevent's async nature.
from apscheduler.schedulers.gevent import GeventScheduler
# GeventExecutor ensures scheduled jobs run in a Gevent-compatible way.
from apscheduler.executors.gevent import GeventExecutor

# --- Flask-Caching for in-memory or Redis-based caching ---
from flask_caching import Cache

# --- Flask App Initialization ---
# Initialize Flask app, serving static files from the current directory.
app = Flask(__name__, static_folder='.')

# --- Flask App Configuration ---
# SECRET_KEY is crucial for session security, used for signing session cookies.
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_for_sessions')
# MONGO_URI specifies the MongoDB connection string.
app.config["MONGO_URI"] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/oneclass_db')
# Sets the lifetime of permanent sessions, making user sessions persist across browser restarts.
app.permanent_session_lifetime = timedelta(days=7)

# --- CORS and SocketIO Setup ---
# CORS allows cross-origin requests from any origin during development,
# and supports credentials (cookies/sessions).
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}}, supports_credentials=True)
# Initialize SocketIO with CORS enabled for all origins, using gevent for async,
# with logging enabled for debugging, and session management integrated.
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent', logger=True, engineio_logger=True, manage_session=True)

# --- Cache Configuration (using Redis for production, local for dev fallback) ---
# Configures Flask-Caching to use Redis as the backend for caching.
app.config['CACHE_TYPE'] = 'RedisCache'
# Specifies the Redis connection URL, defaulting to a local Redis instance.
app.config['CACHE_REDIS_URL'] = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
# Initializes the cache manager.
cache = Cache(app)

# --- MongoDB Setup ---
# Initializes Flask-PyMongo to connect to the MongoDB database configured in app.config.
mongo = PyMongo(app)

# --- MongoDB Collections Definitions ---
# Defines references to various MongoDB collections for different data types.
users_collection = mongo.db.users
classrooms_collection = mongo.db.classrooms
library_files_collection = mongo.db.library_files
assessments_collection = mongo.db.assessments
assessment_questions_collection = mongo.db.assessment_questions
assessment_submissions_collection = mongo.db.assessment_submissions
# Collection to store whiteboard drawing commands, organized by page.
whiteboard_collection = mongo.db.whiteboard_drawings_pages
chat_messages_collection = mongo.db.chat_messages
# Collection for persistent WebRTC signaling data.
webrtc_signals_collection = mongo.db.webrtc_signals

# --- File Uploads Configuration ---
# Defines the folder where uploaded files will be stored.
UPLOAD_FOLDER = 'uploads'
# Creates the upload folder if it doesn't already exist.
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# Adds the upload folder path to Flask's configuration for easy access.
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- APScheduler Setup ---
# Initializes the GeventScheduler for background tasks.
scheduler = GeventScheduler()
# Adds the GeventExecutor to the scheduler, making it compatible with Gevent's concurrency model.
scheduler.add_executor(GeventExecutor(), 'default')
# Starts the scheduler.
scheduler.start()

# --- Scheduled Job Example ---
def delete_old_classrooms():
    """
    Placeholder function for a scheduled job to delete old, inactive classrooms.
    In a real application, this would involve logic to determine 'inactivity'
    based on last activity timestamp, number of participants, etc.
    """
    print(f"[{datetime.utcnow()}] Running scheduled job: delete_old_classrooms (Placeholder)")
    # Example: Delete classrooms not updated in 30 days
    # thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    # result = classrooms_collection.delete_many({"last_activity": {"$lt": thirty_days_ago}})
    # if result.deleted_count > 0:
    #     print(f"Deleted {result.deleted_count} old classrooms.")
    pass

# Adds the `delete_old_classrooms` function as a job to run every 60 minutes.
scheduler.add_job(delete_old_classrooms, 'interval', minutes=60)

# --- Helper Functions ---
def get_user_data(user_id):
    """
    Fetches user data by their UUID string 'id' from the database.
    Utilizes caching to reduce database load for frequently accessed user data.
    Excludes the 'password' hash and MongoDB's '_id' from the returned data.

    Args:
        user_id (str): The UUID string ID of the user.

    Returns:
        dict: A dictionary containing user data (id, username, email, role), or None if not found.
    """
    # Attempt to retrieve user data from cache first.
    user_data = cache.get(f"user_{user_id}")
    if user_data:
        print(f"Fetched user data for {user_id} from cache.")
        return user_data

    # If not in cache, fetch from MongoDB using the 'id' field.
    # Project (exclude) 'password' and '_id' for security and consistency.
    user = users_collection.find_one({"id": user_id}, {"password": 0, "_id": 0})
    if user:
        # Store the fetched user data in cache for 1 hour.
        cache.set(f"user_{user_id}", user, timeout=3600)
        print(f"Fetched user data for {user_id} from DB and cached it.")
        return user
    return None

# --- API Endpoints ---
# Routes for serving static files required by the frontend.

@app.route('/')
def index():
    """Serves the main HTML file for the application."""
    print("Serving index.html")
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def serve_css():
    """Serves the main CSS stylesheet."""
    print("Serving style.css")
    return send_from_directory('.', 'style.css')

@app.route('/app.js')
def serve_js():
    """Serves the main JavaScript application logic."""
    print("Serving app.js")
    return send_from_directory('.', 'app.js')

@app.route('/classroom/<classroomId>')
def serve_classroom_page(classroomId):
    """
    Serves the main HTML file for direct access to a classroom via a shareable link.
    The frontend JavaScript will handle loading the specific classroom content.
    """
    print(f"Serving index.html for classroom {classroomId} direct access.")
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """
    Generic route to serve any other static files (e.g., images, fonts, other JS/CSS).
    Prevents 404s for common static assets.
    """
    print(f"Serving static file: {path}")
    return send_from_directory('.', path)

@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    """Serves uploaded files from the UPLOAD_FOLDER."""
    print(f"Serving uploaded file: {filename}")
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- User Authentication & Management ---

@app.route('/api/register', methods=['POST'])
def register():
    """
    Handles new user registration.
    Expects 'username', 'email', 'password', and optionally 'role' in the request JSON.
    Hashes the password before storing and assigns a unique UUID 'id' to the user.
    """
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')  # Default role is 'user' if not specified.

    # Basic validation for required fields.
    if not all([username, email, password]):
        print(f"Registration failed: Missing required fields for username={username}, email={email}")
        return jsonify({"error": "Missing required fields (username, email, password)"}), 400

    # Check if email already exists to prevent duplicate registrations.
    if users_collection.find_one({"email": email}):
        print(f"Registration failed: Email '{email}' already registered.")
        return jsonify({"error": "Email already registered"}), 409

    # Hash the password for security before storing it.
    hashed_password = generate_password_hash(password)
    user_id = str(uuid.uuid4())  # Generate a unique UUID for the new user.

    # Insert new user document into the 'users' collection.
    users_collection.insert_one({
        "id": user_id,
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": role,
        "created_at": datetime.utcnow()
    })
    print(f"User '{username}' ({role}) registered successfully with ID: {user_id}")
    # Return limited user data for the frontend to store in session/local storage.
    return jsonify({"message": "User registered successfully", "user": {"id": user_id, "username": username, "email": email, "role": role}}), 201

@app.route('/api/login', methods=['POST'])
def login():
    """
    Handles user login.
    Expects 'email' and 'password' in the request JSON.
    Verifies credentials and sets session variables for the authenticated user.
    """
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # Basic validation for required fields.
    if not all([email, password]):
        print("Login failed: Missing email or password in request.")
        return jsonify({"error": "Missing email or password"}), 400

    # Find user by email.
    user = users_collection.find_one({"email": email})
    # Verify if user exists and password is correct.
    if not user or not check_password_hash(user['password'], password):
        print(f"Login failed: Invalid email '{email}' or password.")
        return jsonify({"error": "Invalid email or password"}), 401

    # Set session variables for the authenticated user.
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['role'] = user['role']
    session.permanent = True  # Make the session persist for the configured lifetime.
    print(f"User '{user['username']}' ({user['role']}) logged in. Session set for ID: {user['id']}.")

    # Return user data (excluding password) to the frontend.
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
    """
    Handles user logout by clearing session variables.
    """
    user_id = session.get('user_id')
    if user_id:
        print(f"User '{session.get('username')}' ({user_id}) logging out. Clearing session.")
    # Remove all user-related information from the session.
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None)
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/@me', methods=['GET'])
def get_current_user():
    """
    Retrieves the current authenticated user's details based on their session.
    Uses the caching helper function `get_user_data`.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/@me: No user_id in session. Unauthorized.")
        return jsonify({"error": "Unauthorized"}), 401

    user = get_user_data(user_id)
    if user:
        print(f"Current user session check: '{user.get('username')}' ({user.get('role')}) for ID: {user_id}")
        return jsonify(user)

    # If user_id is in session but user not found in DB (e.g., deleted), clear session.
    print(f"GET /api/@me: User ID {user_id} found in session but not in DB. Clearing session.")
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('role', None)
    return jsonify({"error": "User not found"}), 404

@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    """
    **UPDATED**: Handles user profile updates.
    Expects 'username' and 'email' in the request JSON.
    Updates the user's information in the database and session.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("UPDATE /api/update-profile: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    new_username = data.get('username')
    new_email = data.get('email') # Frontend now sends email

    update_fields = {}
    if new_username:
        update_fields["username"] = new_username
    if new_email:
        # Check if the new email is already taken by another user (excluding the current user).
        if users_collection.find_one({"email": new_email, "id": {"$ne": user_id}}):
            print(f"UPDATE /api/update-profile: Email '{new_email}' already registered by another user.")
            return jsonify({"error": "Email already registered by another user"}), 409
        update_fields["email"] = new_email
    
    if not update_fields:
        print("UPDATE /api/update-profile: No update data provided.")
        return jsonify({"error": "No update data provided"}), 400

    update_fields["updated_at"] = datetime.utcnow() # Add an update timestamp

    # Perform the update operation in MongoDB.
    result = users_collection.update_one(
        {"id": user_id},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        print(f"UPDATE /api/update-profile: User ID {user_id} not found for update.")
        return jsonify({"error": "User not found"}), 404
    
    # Update session variables if username or email was changed.
    if "username" in update_fields:
        session['username'] = new_username
    # Note: Flask's session might not automatically reflect email changes unless manually updated or re-logged in.
    # For now, we update session['username'] and rely on frontend to refresh full user object.

    cache.delete(f"user_{user_id}") # Invalidate user cache to force refresh on next access.
    print(f"Profile for user {user_id} updated. Fields: {update_fields}.")
    return jsonify({"message": "Profile updated successfully"}), 200

# --- Library File Management ---

# Moved from /api/upload-library-files to match app.js
@app.route('/api/library-files/<classroomId>/upload', methods=['POST'])
def upload_library_files(classroomId): # classroomId is now a URL path parameter.
    """
    **UPDATED**: Handles uploading of library files to a specific classroom.
    Requires admin role. Files are stored with unique UUID filenames.
    The classroom ID is now expected as a URL path parameter.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        print("UPLOAD /api/library-files: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401
    
    if user_role != 'admin':
        print(f"UPLOAD /api/library-files: Forbidden - User {user_id} is not an admin.")
        return jsonify({"error": "Forbidden: Only administrators can upload files."}), 403

    # Check if 'files' part exists in the request.
    if 'files' not in request.files:
        print("UPLOAD /api/library-files: No 'files' part in request.")
        return jsonify({"error": "No files part"}), 400

    files = request.files.getlist('files') # Get list of all files uploaded under 'files' key.

    # Validate classroomId (from URL path).
    if not classroomId:
        print("UPLOAD /api/library-files: Classroom ID is missing from URL path.")
        return jsonify({"error": "Classroom ID is missing"}), 400

    uploaded_file_info = []
    for file in files:
        if file.filename == '':
            print("UPLOAD /api/library-files: Empty filename detected.")
            return jsonify({"error": "No selected file"}), 400
        if file:
            original_filename = file.filename # Store original name for display.
            # Generate a unique filename using UUID to prevent collisions.
            filename = str(uuid.uuid4()) + os.path.splitext(original_filename)[1]
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath) # Save the file to the server's filesystem.
            
            file_id = str(uuid.uuid4()) # Generate a unique ID for the database record.
            # Insert file metadata into the 'library_files' collection.
            library_files_collection.insert_one({
                "id": file_id,
                "classroomId": classroomId, # Use classroomId from URL.
                "original_filename": original_filename,
                "stored_filename": filename, # Unique filename on server.
                "url": f"/uploads/{filename}", # URL to access the file.
                "uploaded_at": datetime.utcnow(),
                "uploaded_by": user_id
            })
            uploaded_file_info.append({"id": file_id, "filename": original_filename, "url": f"/uploads/{filename}"})
    
    # Emit an admin action update to all clients in the classroom via Socket.IO.
    socketio.emit('admin_action_update', {
        'classroomId': classroomId,
        'message': f"Admin {session.get('username')} uploaded new file(s) to the library."
    }, room=classroomId)

    print(f"Files uploaded to classroom {classroomId} by {session.get('username')}. Total files: {len(files)}.")
    return jsonify({"message": "Files uploaded successfully", "files": uploaded_file_info}), 201

@app.route('/api/library-files/<classroomId>', methods=['GET'])
def get_library_files(classroomId):
    """
    Retrieves a list of library files for a specific classroom.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/library-files: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    # Check if user is a participant of the classroom
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        print(f"GET /api/library-files: Classroom {classroomId} not found or user {user_id} not a participant.")
        return jsonify({"error": "Classroom not found or access denied"}), 404


    # Fetch all files associated with the classroom, excluding MongoDB's '_id'.
    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0}))
    
    # Ensure 'filename' key is consistently present for frontend.
    for file in files:
        if 'original_filename' in file:
            file['filename'] = file['original_filename']
        else: # Fallback if original_filename wasn't stored (older entries)
            file['filename'] = file.get('stored_filename', 'untitled_file')

    print(f"Fetched {len(files)} library files for classroom {classroomId}.")
    return jsonify(files), 200

@app.route('/api/library-files/<fileId>', methods=['DELETE'])
def delete_library_file(fileId):
    """
    Deletes a specific library file by its ID.
    Requires admin role. Deletes both the database record and the file from the filesystem.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        print("DELETE /api/library-files: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401
    
    if user_role != 'admin':
        print(f"DELETE /api/library-files: Forbidden - User {user_id} is not an admin.")
        return jsonify({"error": "Forbidden: Only administrators can delete files."}), 403

    # Find the file data to get its stored filename and classroom ID.
    file_data = library_files_collection.find_one({"id": fileId})
    if not file_data:
        print(f"DELETE /api/library-files: File ID {fileId} not found in DB.")
        return jsonify({"error": "File not found"}), 404

    # Construct the full path and delete the file from the server's filesystem.
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file_data['stored_filename'])
    if os.path.exists(filepath):
        os.remove(filepath)
        print(f"File '{file_data['stored_filename']}' deleted from filesystem.")
    else:
        print(f"Warning: File '{file_data['stored_filename']}' not found on filesystem for deletion.")
    
    # Delete the file's record from the database.
    result = library_files_collection.delete_one({"id": fileId})
    if result.deleted_count > 0:
        # Emit an admin action update to clients in the relevant classroom.
        socketio.emit('admin_action_update', {
            'classroomId': file_data.get('classroomId'),
            'message': f"Admin {session.get('username')} deleted file '{file_data.get('original_filename', file_data.get('stored_filename'))}' from the library."
        }, room=file_data.get('classroomId'))
        print(f"File {fileId} deleted by {session.get('username')} from DB.")
        return jsonify({"message": "File deleted successfully"}), 200
    
    print(f"Attempted to delete file {fileId} but not found in DB (after filesystem check).")
    return jsonify({"error": "File not found"}), 404

# --- Assessment Management ---

@app.route('/api/assessments', methods=['POST'])
def create_assessment():
    """
    Creates a new assessment for a classroom.
    Requires admin role. Stores assessment details and associated questions.
    """
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        print("CREATE /api/assessments: Unauthorized - Only administrators can create assessments.")
        return jsonify({"error": "Unauthorized: Only administrators can create assessments."}), 401

    data = request.json
    class_room_id = data.get('classroomId')
    title = data.get('title')
    description = data.get('description')
    scheduled_at_str = data.get('scheduled_at') # Expected ISO format string.
    duration_minutes = data.get('duration_minutes')
    questions_data = data.get('questions')

    # Validate all required fields are present.
    if not all([class_room_id, title, scheduled_at_str, duration_minutes is not None, questions_data is not None]):
        print(f"CREATE /api/assessments: Missing required fields for classroomId={class_room_id}, title={title}, scheduled_at={scheduled_at_str}, duration_minutes={duration_minutes is not None}, questions={questions_data is not None}")
        return jsonify({"error": "Missing required fields: classroomId, title, scheduled_at, duration_minutes, or questions"}), 400
    
    # Validate questions data is a non-empty list.
    if not isinstance(questions_data, list) or not questions_data:
        print("CREATE /api/assessments: Questions must be a non-empty list.")
        return jsonify({"error": "Questions must be a non-empty list"}), 400

    try:
        # Convert ISO format string to datetime object (UTC assumed from frontend .toISOString()).
        scheduled_at = datetime.fromisoformat(scheduled_at_str.replace('Z', '+00:00')) # Handle 'Z' for UTC.
    except ValueError:
        print(f"CREATE /api/assessments: Invalid scheduled_at format: '{scheduled_at_str}'. Expected ISO 8601.")
        return jsonify({"error": "Invalid scheduled_at format. Expected YYYY-MM-DDTHH:MM:SS.sssZ (ISO 8601 UTC)"}), 400

    # Validate duration is a positive integer.
    if not isinstance(duration_minutes, int) or duration_minutes <= 0:
        print(f"CREATE /api/assessments: Invalid duration_minutes: '{duration_minutes}'. Must be a positive integer.")
        return jsonify({"error": "Duration must be a positive integer"}), 400

    assessment_id = str(uuid.uuid4()) # Generate unique ID for the assessment.
    
    print(f"Creating assessment: ID={assessment_id}, title='{title}', scheduled_at='{scheduled_at}', duration_minutes='{duration_minutes}'")

    # Insert new assessment document.
    assessments_collection.insert_one({
        "id": assessment_id,
        "classroomId": class_room_id,
        "title": title,
        "description": description,
        "scheduled_at": scheduled_at,
        "duration_minutes": duration_minutes,
        "creator_id": user_id,
        "creator_username": username,
        "creator_role": user_role,
        "created_at": datetime.utcnow()
    })

    inserted_question_ids = []
    for q_data in questions_data:
        question_id = str(uuid.uuid4())
        # Construct question document. Remove None values to avoid storing empty fields.
        question_doc = {
            "id": question_id,
            "assessmentId": assessment_id,
            "classroomId": class_room_id,
            "question_text": q_data.get('question_text'),
            "question_type": q_data.get('question_type'),
            "options": q_data.get('options'),
            "correct_answer": q_data.get('correct_answer')
        }
        question_doc = {k: v for k, v in question_doc.items() if v is not None} # Filter out None values.
        
        assessment_questions_collection.insert_one(question_doc)
        inserted_question_ids.append(question_id)

    # Emit admin action update to the classroom.
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"Admin {session.get('username')} created a new assessment: '{title}' with {len(questions_data)} questions."
    }, room=class_room_id)

    print(f"Assessment '{title}' created by {username} in classroom {class_room_id} with {len(questions_data)} questions. Question IDs: {inserted_question_ids}.")
    return jsonify({"message": "Assessment created successfully", "id": assessment_id}), 201

# This endpoint is kept for potential future use if adding questions to an existing assessment.
@app.route('/api/assessments/<assessmentId>/questions', methods=['POST'])
def add_questions_to_assessment(assessmentId):
    """
    Adds questions to an existing assessment. (Currently not used by frontend in its primary flow).
    Requires admin role and that the admin is the creator of the assessment.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        print("ADD QUESTIONS /api/assessments/<assessmentId>/questions: Unauthorized - Only administrators can add questions.")
        return jsonify({"error": "Unauthorized: Only administrators can add questions."}), 401

    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        print(f"ADD QUESTIONS /api/assessments/<assessmentId>/questions: Assessment {assessmentId} not found.")
        return jsonify({"error": "Assessment not found"}), 404

    # Ensure admin creating questions is the creator of the assessment.
    if assessment['creator_id'] != user_id:
        print(f"ADD QUESTIONS /api/assessments/<assessmentId>/questions: Forbidden - User {user_id} is not the creator of assessment {assessmentId}.")
        return jsonify({"error": "Forbidden: You are not the creator of this assessment."}), 403

    data = request.json
    questions_data = data.get('questions')

    if not isinstance(questions_data, list) or not questions_data:
        print("ADD QUESTIONS /api/assessments/<assessmentId>/questions: Questions must be a non-empty list.")
        return jsonify({"error": "Questions must be a non-empty list"}), 400

    inserted_question_ids = []
    for q_data in questions_data:
        question_id = str(uuid.uuid4())
        question_doc = {
            "id": question_id,
            "assessmentId": assessmentId,
            "classroomId": assessment['classroomId'],
            "question_text": q_data.get('question_text'),
            "question_type": q_data.get('question_type'),
            "options": q_data.get('options'),
            "correct_answer": q_data.get('correct_answer')
        }
        question_doc = {k: v for k, v in question_doc.items() if v is not None}

        assessment_questions_collection.insert_one(question_doc)
        inserted_question_ids.append(question_id)

    socketio.emit('admin_action_update', {
        'classroomId': assessment.get('classroomId'),
        'message': f"Admin {session.get('username')} added {len(questions_data)} questions to assessment '{assessment.get('title')}'."
    }, room=assessment.get('classroomId'))

    print(f"Added {len(questions_data)} questions to assessment {assessmentId}. Question IDs: {inserted_question_ids}.")
    return jsonify({"message": "Questions added successfully", "question_ids": inserted_question_ids}), 201

@app.route('/api/assessments/<classroomId>', methods=['GET'])
def get_assessments(classroomId):
    """
    Retrieves a list of all assessments for a given classroom.
    Formats datetime objects to ISO strings for frontend consumption.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/assessments/<classroomId>: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401
    
    # Check if user is a participant of the classroom
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        print(f"GET /api/assessments/<classroomId>: Classroom {classroomId} not found or user {user_id} not a participant.")
        return jsonify({"error": "Classroom not found or access denied"}), 404


    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"_id": 0}))
    
    # Convert datetime objects to ISO format strings.
    for assessment in assessments:
        if 'scheduled_at' in assessment and isinstance(assessment['scheduled_at'], datetime):
            assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
        if 'created_at' in assessment and isinstance(assessment['created_at'], datetime):
            assessment['created_at'] = assessment['created_at'].isoformat()
        # Add a field to indicate if the current user has already submitted
        submission = assessment_submissions_collection.find_one({
            "assessmentId": assessment['id'],
            "student_id": user_id
        })
        assessment['has_submitted'] = bool(submission)

    print(f"Fetched {len(assessments)} assessments (list view) for classroom {classroomId} for user {user_id}.")
    return jsonify(assessments), 200

@app.route('/api/assessments/<assessmentId>', methods=['GET'])
def get_assessment_details(assessmentId):
    """
    Retrieves detailed information for a specific assessment, including its questions.
    Checks assessment status (active, upcoming, ended) and emits 'assessment_started'
    event if a new student is viewing an active assessment.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/assessments/<assessmentId>: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401
    
    assessment = assessments_collection.find_one({"id": assessmentId}, {"_id": 0})
    if not assessment:
        print(f"GET /api/assessments/<assessmentId>: Assessment {assessmentId} not found.")
        return jsonify({"error": "Assessment not found"}), 404
    
    # Ensure user is a participant of the classroom where the assessment belongs
    classroom = classrooms_collection.find_one({"id": assessment['classroomId'], "participants": user_id})
    if not classroom:
        print(f"GET /api/assessments/<assessmentId>: User {user_id} not a participant of classroom {assessment['classroomId']}.")
        return jsonify({"error": "Access denied to assessment's classroom"}), 403


    print(f"Raw assessment details from DB for {assessmentId}: scheduled_at={assessment.get('scheduled_at')}, duration_minutes={assessment.get('duration_minutes')}")

    now = datetime.utcnow()
    scheduled_at = assessment.get('scheduled_at')
    duration_minutes = assessment.get('duration_minutes')

    # Basic validation for scheduling data consistency.
    if not isinstance(scheduled_at, datetime) or not isinstance(duration_minutes, (int, float)) or duration_minutes <= 0:
        print(f"GET /api/assessments/<assessmentId>: Invalid scheduled_at ({scheduled_at}) or duration_minutes ({duration_minutes}) for assessment {assessmentId}. Cannot calculate end time.")
        return jsonify({"error": "Assessment scheduling data is invalid. Please contact an administrator."}), 500

    end_time = scheduled_at + timedelta(minutes=duration_minutes)

    # If the assessment is currently active and the user hasn't submitted,
    # emit an 'assessment_started' event to them to kick off their client-side timer.
    if scheduled_at <= now < end_time:
        existing_submission = assessment_submissions_collection.find_one({
            "assessmentId": assessmentId,
            "student_id": user_id
        })
        # Only emit if no existing submission for this user, and they are viewing it for the first time
        if not existing_submission:
            socketio.emit('assessment_started', {
                'classroomId': assessment['classroomId'],
                'assessmentId': assessmentId,
                'title': assessment['title'],
                'endTime': end_time.isoformat()
            }, room=request.sid) # Emit only to the requesting client's Socket.IO SID.
            print(f"Emitted 'assessment_started' to {request.sid} for assessment {assessmentId}.")

    # Fetch all questions for this assessment, excluding '_id'.
    assessment['questions'] = list(assessment_questions_collection.find({"assessmentId": assessmentId}, {"_id": 0}))
    
    # Convert datetime objects to ISO format strings.
    if 'scheduled_at' in assessment and isinstance(assessment['scheduled_at'], datetime):
        assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
    if 'created_at' in assessment and isinstance(assessment['created_at'], datetime):
        assessment['created_at'] = assessment['created_at'].isoformat()

    print(f"Fetched details for assessment {assessmentId} including {len(assessment['questions'])} questions for user {user_id}.")
    return jsonify(assessment), 200

@app.route('/api/assessments/<assessmentId>/submit', methods=['POST'])
def submit_assessment():
    """
    Handles student submission of an assessment.
    Calculates score for MCQ questions and stores the submission.
    Prevents multiple submissions and late submissions (unless auto-submitted).
    """
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')
    if not user_id:
        print("SUBMIT /api/assessments/<assessmentId>/submit: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    assessment_id = data.get('assessmentId')
    class_room_id = data.get('classroomId')
    answers = data.get('answers')
    is_auto_submit = data.get('is_auto_submit', False) # Flag for automatic submission.

    # Validate required fields.
    if not all([assessment_id, class_room_id, answers is not None]):
        print(f"SUBMIT /api/assessments/<assessmentId>/submit: Missing required fields for assessmentId={assessment_id}, classroomId={class_room_id}, answers={answers is not None}.")
        return jsonify({"error": "Missing required fields: assessmentId, classroomId, or answers"}), 400
    
    if not isinstance(answers, list):
        print("SUBMIT /api/assessments/<assessmentId>/submit: Answers must be a list.")
        return jsonify({"error": "Answers must be a list"}), 400

    assessment_details = assessments_collection.find_one({"id": assessment_id})
    if not assessment_details:
        print(f"SUBMIT /api/assessments/<assessmentId>/submit: Assessment {assessment_id} not found.")
        return jsonify({"error": "Assessment not found"}), 404

    now = datetime.utcnow()
    scheduled_at = assessment_details['scheduled_at']
    duration_minutes = assessment_details['duration_minutes']
    end_time = scheduled_at + timedelta(minutes=duration_minutes)

    # Prevent manual submission if time has passed. Auto-submissions are allowed.
    if not is_auto_submit and now > end_time:
        print(f"SUBMIT /api/assessments/<assessmentId>/submit: Manual submission for assessment {assessment_id} failed, time has passed.")
        return jsonify({"error": "Assessment submission time has passed. Your answers might have been auto-submitted."}), 403

    # Prevent multiple submissions.
    existing_submission = assessment_submissions_collection.find_one({
        "assessmentId": assessment_id,
        "student_id": user_id
    })
    if existing_submission:
        print(f"SUBMIT /api/assessments/<assessmentId>/submit: User {user_id} has already submitted assessment {assessment_id}.")
        return jsonify({"error": "You have already submitted this assessment."}), 409

    submission_id = str(uuid.uuid4()) # Generate unique ID for the submission.
    
    score = 0
    total_questions = 0
    graded_answers = [] # Stores user's answers along with grading info.

    for submitted_answer in answers:
        question_id = submitted_answer.get('question_id')
        user_answer = submitted_answer.get('user_answer')
        question_text = submitted_answer.get('question_text') # From frontend payload
        
        if question_id:
            question = assessment_questions_collection.find_one({"id": question_id})
            if question:
                total_questions += 1
                is_correct = False
                # Only automatically grade MCQ questions. Text answers require manual review.
                if question.get('question_type') == 'mcq':
                    db_correct_answer = question.get('correct_answer')
                    if db_correct_answer and user_answer is not None and \
                       str(user_answer).strip().lower() == str(db_correct_answer).strip().lower():
                        score += 1
                        is_correct = True
                
                graded_answers.append({
                    "question_id": question_id,
                    "question_text": question_text, # Use question text from frontend for consistency
                    "question_type": question.get('question_type'), # Store question type for clarity
                    "user_answer": user_answer,
                    "correct_answer": question.get('correct_answer'),
                    "is_correct": is_correct if question.get('question_type') == 'mcq' else None, # Only set for MCQs
                    "admin_feedback": None # Initialized as None, to be filled by admin.
                })
            else:
                print(f"SUBMIT /api/assessments/<assessmentId>/submit: Question ID {question_id} not found in DB for assessment {assessment_id}.")

    # Insert the new submission document.
    assessment_submissions_collection.insert_one({
        "id": submission_id,
        "assessmentId": assessment_id,
        "classroomId": class_room_id,
        "student_id": user_id,
        "student_username": username,
        "student_role": user_role,
        "submitted_at": datetime.utcnow(),
        "answers": graded_answers,
        "score": score,
        "total_questions": total_questions,
        "is_auto_submit": is_auto_submit,
        "marked_by": None,
        "marked_at": None
    })

    # Emit an admin action update to the classroom.
    socketio.emit('admin_action_update', {
        'classroomId': class_room_id,
        'message': f"User {username} submitted an assessment for '{assessment_details.get('title')}'."
    }, room=class_room_id)

    print(f"Assessment {assessment_id} submitted by {username}. Score: {score}/{total_questions}. Auto-submit: {is_auto_submit}.")
    return jsonify({"message": "Assessment submitted successfully", "submission_id": submission_id, "score": score, "total_questions": total_questions}), 201

@app.route('/api/assessments/<assessmentId>/submissions', methods=['GET'])
def get_assessment_submissions(assessmentId):
    """
    Retrieves all submissions for a specific assessment.
    Admins can view all submissions; regular users can only view their own.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id:
        print("GET /api/assessments/<assessmentId>/submissions: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        print(f"GET /api/assessments/<assessmentId>/submissions: Assessment {assessmentId} not found.")
        return jsonify({"error": "Assessment not found"}), 404
    
    # Check if user is a participant of the classroom
    classroom = classrooms_collection.find_one({"id": assessment['classroomId'], "participants": user_id})
    if not classroom:
        print(f"GET /api/assessments/<assessmentId>/submissions: User {user_id} not a participant of classroom {assessment['classroomId']}.")
        return jsonify({"error": "Access denied to assessment's classroom"}), 403


    query = {"assessmentId": assessmentId}
    if user_role != 'admin':
        # Non-admins can only see their own submissions.
        query["student_id"] = user_id
        print(f"GET /api/assessments/<assessmentId>/submissions: User {user_id} (non-admin) fetching their own submission for {assessmentId}.")
    else:
        # Admins can see all submissions for assessments they created or manage.
        print(f"GET /api/assessments/<assessmentId>/submissions: Admin {user_id} fetching all submissions for {assessmentId}.")


    submissions = list(assessment_submissions_collection.find(query, {"_id": 0}).sort("submitted_at", -1))
    
    # Add assessment title to each submission for easier frontend display.
    for submission in submissions:
        submission['assessment_title'] = assessment.get('title')
        # Format datetime objects
        if 'submitted_at' in submission and isinstance(submission['submitted_at'], datetime):
            submission['submitted_at'] = submission['submitted_at'].isoformat()
        if 'marked_at' in submission and isinstance(submission['marked_at'], datetime):
            submission['marked_at'] = submission['marked_at'].isoformat()
            
    print(f"Fetched {len(submissions)} submissions for assessment {assessmentId}.")
    return jsonify(submissions), 200

@app.route('/api/submissions/<submissionId>', methods=['GET'])
def get_single_submission(submissionId):
    """
    Retrieves details of a single submission.
    Access restricted: admin (creator of assessment) or the student who made the submission.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id:
        print("GET /api/submissions/<submissionId>: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    submission = assessment_submissions_collection.find_one({"id": submissionId}, {"_id": 0})
    if not submission:
        print(f"GET /api/submissions/<submissionId>: Submission {submissionId} not found.")
        return jsonify({"error": "Submission not found"}), 404

    assessment = assessments_collection.find_one({"id": submission['assessmentId']})
    if not assessment:
        print(f"GET /api/submissions/<submissionId>: Associated assessment for submission {submissionId} not found.")
        return jsonify({"error": "Associated assessment not found"}), 404

    # Authorization logic:
    # Admin can view if they created the assessment.
    # Regular user can view if it's their own submission.
    if user_role == 'admin' and assessment['creator_id'] == user_id:
        print(f"GET /api/submissions/<submissionId>: Admin {user_id} viewing submission {submissionId}.")
        # Format datetime objects
        if 'submitted_at' in submission and isinstance(submission['submitted_at'], datetime):
            submission['submitted_at'] = submission['submitted_at'].isoformat()
        if 'marked_at' in submission and isinstance(submission['marked_at'], datetime):
            submission['marked_at'] = submission['marked_at'].isoformat()
        return jsonify(submission), 200
    elif user_role == 'user' and submission['student_id'] == user_id:
        print(f"GET /api/submissions/<submissionId>: Student {user_id} viewing their own submission {submissionId}.")
        # Format datetime objects
        if 'submitted_at' in submission and isinstance(submission['submitted_at'], datetime):
            submission['submitted_at'] = submission['submitted_at'].isoformat()
        if 'marked_at' in submission and isinstance(submission['marked_at'], datetime):
            submission['marked_at'] = submission['marked_at'].isoformat()
        return jsonify(submission), 200
    else:
        print(f"GET /api/submissions/<submissionId>: Forbidden - User {user_id} does not have permission to view submission {submissionId}.")
        return jsonify({"error": "Forbidden: You do not have permission to view this submission."}), 403

@app.route('/api/assessments/<assessmentId>/mark-submission/<submissionId>', methods=['POST'])
def mark_submission(assessmentId, submissionId):
    """
    **UPDATED**: Allows an administrator to mark a student's submission,
    assigning correctness and adding feedback to individual answers.
    Updates the submission's score and 'marked_at' timestamp.
    Emits 'submission_marked' event to the student and 'admin_action_update' to the classroom.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        print("MARK SUBMISSION /api/assessments/<assessmentId>/mark-submission/<submissionId>: Unauthorized - Only administrators can mark submissions.")
        return jsonify({"error": "Unauthorized: Only administrators can mark submissions."}), 401

    assessment = assessments_collection.find_one({"id": assessmentId})
    # Admin must be the creator of the assessment to mark submissions for it.
    if not assessment or assessment['creator_id'] != user_id:
        print(f"MARK SUBMISSION /api/assessments/<assessmentId>/mark-submission/<submissionId>: Forbidden - Admin {user_id} is not the creator of assessment {assessmentId}.")
        return jsonify({"error": "Forbidden: You are not the creator of this assessment."}), 403

    submission = assessment_submissions_collection.find_one({"id": submissionId, "assessmentId": assessmentId})
    if not submission:
        print(f"MARK SUBMISSION /api/assessments/<assessmentId>/mark-submission/<submissionId>: Submission {submissionId} not found for assessment {assessmentId}.")
        return jsonify({"error": "Submission not found for this assessment."}), 404

    data = request.json
    updated_answers_payload = data.get('updated_answers') # List of {question_id, is_correct, admin_feedback}

    if not isinstance(updated_answers_payload, list):
        print("MARK SUBMISSION /api/assessments/<assessmentId>/mark-submission/<submissionId>: 'updated_answers' must be a list.")
        return jsonify({"error": "'updated_answers' must be a list"}), 400

    # Create a map for quick lookup of existing answers in the submission.
    existing_answers_map = {ans['question_id']: ans for ans in submission['answers']}

    new_score = 0
    final_answers_list = []

    for updated_ans_data in updated_answers_payload:
        q_id = updated_ans_data.get('question_id')
        is_correct = updated_ans_data.get('is_correct')
        admin_feedback = updated_ans_data.get('admin_feedback')

        if q_id and q_id in existing_answers_map:
            original_answer_doc = existing_answers_map[q_id]
            
            # Update the specific fields from the admin's input.
            original_answer_doc['is_correct'] = bool(is_correct) # Ensure boolean type.
            original_answer_doc['admin_feedback'] = admin_feedback if admin_feedback else None # Store None if empty string.

            if original_answer_doc['is_correct']:
                new_score += 1
            
            final_answers_list.append(original_answer_doc)
        else:
            print(f"Warning: Question ID {q_id} from payload not found in original submission {submissionId}. Skipping.")

    # Update the submission document with the new answers, score, and marking details.
    result = assessment_submissions_collection.update_one(
        {"id": submissionId},
        {"$set": {
            "answers": final_answers_list,
            "score": new_score,
            "marked_by": user_id,
            "marked_at": datetime.utcnow()
        }}
    )

    if result.modified_count > 0:
        # Emit 'submission_marked' event to the student who made the submission.
        socketio.emit('submission_marked', {
            'assessmentId': assessmentId,
            'assessmentTitle': assessment['title'],
            'submissionId': submissionId,
            'studentId': submission['student_id'],
            'score': new_score,
            'total_questions': submission['total_questions']
        }, room=submission['student_id']) # Emit directly to the student's personal room.

        # Emit 'admin_action_update' to the classroom.
        socketio.emit('admin_action_update', {
            'classroomId': assessment.get('classroomId'),
            'message': f"Admin {session.get('username')} marked a submission for '{assessment.get('title')}'."
        }, room=assessment.get('classroomId'))

        print(f"Submission {submissionId} for assessment {assessmentId} marked by admin {user_id}. New score: {new_score}/{submission['total_questions']}.")
        return jsonify({"message": "Submission marked successfully", "new_score": new_score}), 200
    
    print(f"No changes were made to submission {submissionId} during marking process.")
    return jsonify({"message": "No changes made to submission"}), 200

@app.route('/api/assessments/<assessmentId>', methods=['DELETE'])
def delete_assessment(assessmentId):
    """
    Deletes an assessment and all associated questions and submissions.
    Requires admin role and that the admin is the creator of the assessment.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        print("DELETE /api/assessments/<assessmentId>: Unauthorized - Only admins can delete assessments.")
        return jsonify({"error": "Unauthorized: Only admins can delete assessments"}), 403

    assessment = assessments_collection.find_one({"id": assessmentId})
    if not assessment:
        print(f"DELETE /api/assessments/<assessmentId>: Assessment {assessmentId} not found.")
        return jsonify({"error": "Assessment not found"}), 404
    
    # Ensure admin deleting is the creator of the assessment.
    if assessment['creator_id'] != user_id:
        print(f"DELETE /api/assessments/<assessmentId>: Forbidden - Admin {user_id} is not the creator of assessment {assessmentId}.")
        return jsonify({"error": "Forbidden: You are not the creator of this assessment."}), 403


    # Delete associated questions and submissions first.
    assessment_questions_collection.delete_many({"assessmentId": assessmentId})
    assessment_submissions_collection.delete_many({"assessmentId": assessmentId})
    result = assessments_collection.delete_one({"id": assessmentId}) # Then delete the assessment itself.

    if result.deleted_count > 0:
        # Emit admin action update to the classroom.
        socketio.emit('admin_action_update', {
            'classroomId': assessment.get('classroomId'),
            'message': f"Admin {session.get('username')} deleted assessment '{assessment.get('title')}' and all its data."
        }, room=assessment.get('classroomId'))
        print(f"Assessment {assessmentId} and related data deleted by {session.get('username')}.")
        return jsonify({"message": "Assessment and its related data deleted successfully"}), 200
    
    print(f"Attempted to delete assessment {assessmentId} but not found in DB (after initial check).")
    return jsonify({"error": "Assessment not found"}), 404

# --- Classroom Management ---

@app.route('/api/classrooms', methods=['POST'])
def create_classroom():
    """
    Creates a new classroom.
    Requires admin role. The creator is automatically added as a participant.
    """
    user_id = session.get('user_id')
    username = session.get('username')
    user_role = session.get('role')

    if not user_id or user_role != 'admin':
        print("CREATE /api/classrooms: Unauthorized - Only administrators can create classrooms.")
        return jsonify({"error": "Unauthorized: Only administrators can create classrooms."}), 401

    data = request.json
    classroom_name = data.get('name')

    if not classroom_name:
        print("CREATE /api/classrooms: Classroom name is required.")
        return jsonify({"error": "Classroom name is required"}), 400

    classroom_id = str(uuid.uuid4()) # Generate unique ID for the classroom.
    classrooms_collection.insert_one({
        "id": classroom_id,
        "name": classroom_name,
        "creator_id": user_id,
        "creator_username": username,
        "created_at": datetime.utcnow(),
        "participants": [user_id] # Creator is automatically a participant.
    })

    # Invalidate cached classroom lists to ensure the new classroom appears.
    cache.delete_memoized(get_classrooms)

    # Emit admin action update (to all connected clients, not just the classroom itself yet).
    socketio.emit('admin_action_update', {
        'classroomId': classroom_id, # Can be used by frontend to filter
        'message': f"Admin {username} created a new classroom: '{classroom_name}'."
    })
    print(f"Classroom '{classroom_name}' created by {username}. ID: {classroom_id}.")
    return jsonify({"message": "Classroom created successfully", "classroom": {"id": classroom_id, "name": classroom_name}}), 201

@app.route('/api/classrooms', methods=['GET'])
@cache.cached(timeout=60, query_string=True) # Cache for 60 seconds, varies by query string parameters.
def get_classrooms():
    """
    **UPDATED**: Retrieves a list of classrooms based on filters.
    Supports 'joined' (classrooms the user is a participant of) or 'all' (all classrooms).
    Includes search functionality by classroom name.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/classrooms: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    # Get the 'type' parameter from the URL query string (e.g., ?type=joined), defaulting to 'all'.
    list_type = request.args.get('type', 'all') # Defaulting to 'all' to show all available.
    search_query = request.args.get('search', '')

    query_filter = {}

    # Build query filter based on list_type.
    if list_type == 'joined':
        query_filter["participants"] = user_id
    elif list_type == 'all':
        # No participant filter needed for 'all' classrooms.
        pass
    else:
        print(f"GET /api/classrooms: Invalid classroom list type '{list_type}'.")
        return jsonify({"error": "Invalid classroom list type"}), 400

    # Add search query if provided. Case-insensitive regex match on classroom 'name'.
    if search_query:
        query_filter["name"] = {"$regex": search_query, "$options": "i"}

    classrooms = list(classrooms_collection.find(query_filter, {"_id": 0})) # Exclude MongoDB's '_id'.
    
    print(f"Fetched {len(classrooms)} classrooms for list type '{list_type}' for user {user_id} with search query '{search_query}'.")
    return jsonify(classrooms), 200

@app.route('/api/classrooms/<classroomId>', methods=['GET'])
def get_classroom_details(classroomId):
    """
    Retrieves comprehensive details for a specific classroom,
    including its chat messages, library files, assessments, and current whiteboard state.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/classrooms/<classroomId>: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    # Ensure user is a participant of the classroom they are requesting details for.
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id}, {"_id": 0})
    if not classroom:
        print(f"GET /api/classrooms/<classroomId>: Classroom {classroomId} not found or user {user_id} not a participant.")
        return jsonify({"error": "Classroom not found or access denied"}), 404

    # Fetch recent chat messages, sorted by timestamp.
    chat_messages = list(chat_messages_collection.find({"classroomId": classroomId}, {"_id": 0}).sort("timestamp", 1).limit(100))
    # Format timestamps for frontend.
    for msg in chat_messages:
        if 'timestamp' in msg and isinstance(msg['timestamp'], datetime):
            msg['timestamp'] = msg['timestamp'].isoformat()

    # Fetch library files.
    library_files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0}))

    # Fetch assessments, formatting timestamps.
    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"_id": 0}))
    for assessment in assessments:
        if 'scheduled_at' in assessment and isinstance(assessment['scheduled_at'], datetime):
            assessment['scheduled_at'] = assessment['scheduled_at'].isoformat()
        if 'created_at' in assessment and isinstance(assessment['created_at'], datetime):
            assessment['created_at'] = assessment['created_at'].isoformat()

    # Get the latest whiteboard snapshot (or all history, depending on frontend needs).
    # The frontend `app.js` now calls `/api/whiteboard-history/<classroomId>` separately.
    # So `current_whiteboard` here might be redundant for the primary whiteboard view.
    # For now, let's just include a flag or simplified state.
    has_whiteboard_history = whiteboard_collection.count_documents({"classroomId": classroomId}) > 0

    classroom_details = {
        "classroom": classroom,
        "chat_messages": chat_messages,
        "library_files": library_files,
        "assessments": assessments,
        "has_whiteboard_history": has_whiteboard_history # Simplified for overall classroom details.
    }
    print(f"Fetched comprehensive details for classroom {classroomId} for user {user_id}.")
    return jsonify(classroom_details), 200

@app.route('/api/classrooms/<classroomId>/join', methods=['POST'])
def join_classroom(classroomId):
    """
    Allows a user to join a classroom (become a participant).
    **Client-side `app.js` should call this specific endpoint path.**
    """
    user_id = session.get('user_id')
    username = session.get('username')
    if not user_id:
        print("JOIN /api/classrooms/<classroomId>/join: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        print(f"JOIN /api/classrooms/<classroomId>/join: Classroom {classroomId} not found.")
        return jsonify({"error": "Classroom not found"}), 404

    # Add user to participants if they are not already in the list.
    if user_id not in classroom.get('participants', []):
        classrooms_collection.update_one(
            {"id": classroomId},
            {"$addToSet": {"participants": user_id}, "$set": {"updated_at": datetime.utcnow()}} # Update timestamp
        )
        cache.delete_memoized(get_classrooms) # Invalidate classroom cache.
        print(f"User {username} ({user_id}) joined classroom {classroomId}.")
        return jsonify({"message": "Joined classroom successfully"}), 200
    else:
        print(f"User {username} ({user_id}) already in classroom {classroomId}.")
        return jsonify({"message": "Already a participant"}), 200

@app.route('/api/classrooms/<classroomId>/leave', methods=['POST'])
def leave_classroom(classroomId):
    """
    Allows a user to leave a classroom (remove themselves from participants).
    """
    user_id = session.get('user_id')
    username = session.get('username')
    if not user_id:
        print("LEAVE /api/classrooms/<classroomId>/leave: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        print(f"LEAVE /api/classrooms/<classroomId>/leave: Classroom {classroomId} not found.")
        return jsonify({"error": "Classroom not found"}), 404

    # Remove user from participants list if they are in it.
    if user_id in classroom.get('participants', []):
        classrooms_collection.update_one(
            {"id": classroomId},
            {"$pull": {"participants": user_id}, "$set": {"updated_at": datetime.utcnow()}} # Update timestamp
        )
        cache.delete_memoized(get_classrooms) # Invalidate classroom cache.
        print(f"User {username} ({user_id}) left classroom {classroomId}.")
        return jsonify({"message": "Left classroom successfully"}), 200
    else:
        print(f"User {username} ({user_id}) was not in classroom {classroomId}.")
        return jsonify({"message": "Not a participant"}), 200

@app.route('/api/classrooms/<classroomId>/participants', methods=['GET'])
def get_classroom_participants(classroomId):
    """
    Retrieves a list of all participants for a specific classroom.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/classrooms/<classroomId>/participants: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    # Find classroom and ensure the requesting user is a participant.
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id}, {"_id": 0, "participants": 1})
    if not classroom:
        print(f"GET /api/classrooms/<classroomId>/participants: Classroom {classroomId} not found or user {user_id} not a participant.")
        return jsonify({"error": "Classroom not found or access denied"}), 404

    participant_ids = classroom.get('participants', [])
    # Fetch details for each participant, excluding password and '_id'.
    participants = list(users_collection.find({"id": {"$in": participant_ids}}, {"_id": 0, "password": 0}))
    print(f"Fetched {len(participants)} participants for classroom {classroomId}.")
    return jsonify(participants), 200

@app.route('/api/classrooms/<classroomId>', methods=['DELETE'])
def delete_classroom(classroomId):
    """
    Deletes a classroom and all associated data (library files, assessments, chat, whiteboard).
    Requires admin role and the admin must be the creator of the classroom.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        print("DELETE /api/classrooms/<classroomId>: Unauthorized - Only admins can delete classrooms.")
        return jsonify({"error": "Unauthorized: Only admins can delete classrooms"}), 403

    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        print(f"DELETE /api/classrooms/<classroomId>: Classroom {classroomId} not found.")
        return jsonify({"error": "Classroom not found"}), 404
    
    # Ensure admin deleting is the creator of the classroom.
    if classroom['creator_id'] != user_id:
        print(f"DELETE /api/classrooms/<classroomId>: Forbidden - Admin {user_id} is not the creator of classroom {classroomId}.")
        return jsonify({"error": "Forbidden: You are not the creator of this classroom."}), 403


    # Delete associated library files from filesystem and DB.
    library_files = list(library_files_collection.find({"classroomId": classroomId}, {"stored_filename": 1}))
    for file in library_files:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file['stored_filename'])
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"Deleted library file '{file['stored_filename']}' from filesystem.")
    library_files_collection.delete_many({"classroomId": classroomId})
    print(f"Deleted library file records for classroom {classroomId}.")

    # Delete associated assessments, questions, and submissions.
    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"id": 1}))
    assessment_ids = [a['id'] for a in assessments]
    assessment_questions_collection.delete_many({"classroomId": classroomId})
    assessment_submissions_collection.delete_many({"classroomId": classroomId})
    assessments_collection.delete_many({"classroomId": classroomId})
    print(f"Deleted {len(assessment_ids)} assessments and related questions/submissions for classroom {classroomId}.")

    # Delete whiteboard data and chat messages.
    whiteboard_collection.delete_many({"classroomId": classroomId})
    chat_messages_collection.delete_many({"classroomId": classroomId})
    print(f"Deleted whiteboard data and chat messages for classroom {classroomId}.")

    # Finally, delete the classroom itself.
    result = classrooms_collection.delete_one({"id": classroomId})
    if result.deleted_count > 0:
        cache.delete_memoized(get_classrooms) # Invalidate classroom cache.
        # Emit admin action update.
        socketio.emit('admin_action_update', {
            'classroomId': classroomId,
            'message': f"Admin {session.get('username')} deleted classroom '{classroom.get('name')}' and all its data."
        })
        print(f"Classroom {classroomId} and all related data deleted by {session.get('username')}.")
        return jsonify({"message": "Classroom and all related data deleted successfully"}), 200
    
    print(f"Attempted to delete classroom {classroomId} but not found in DB (after initial check).")
    return jsonify({"error": "Classroom not found"}), 404

# --- Whiteboard API Endpoints ---

@app.route('/api/whiteboard-history/<classroomId>', methods=['GET'])
def get_whiteboard_history(classroomId):
    """
    **UPDATED**: Retrieves the complete whiteboard drawing history for a classroom,
    organized into an array of pages. Each page is an array of drawing commands.
    This format directly matches what the frontend `app.js` expects.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/whiteboard-history/<classroomId>: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    # Ensure user is a participant of the classroom.
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id})
    if not classroom:
        print(f"GET /api/whiteboard-history/<classroomId>: Classroom {classroomId} not found or user {user_id} not a participant.")
        return jsonify({"error": "Classroom not found or access denied"}), 404

    # Fetch all whiteboard actions, sorted by timestamp to ensure correct order of operations.
    whiteboard_actions = list(whiteboard_collection.find(
        {"classroomId": classroomId},
        {"_id": 0, "action": 1, "data": 1, "pageIndex": 1, "timestamp": 1} # Project only necessary fields.
    ).sort("timestamp", 1))

    # Reconstruct the whiteboard state page by page.
    pages_data = {} # Dictionary to hold drawing commands for each page index.
    max_page_index = 0

    for action_doc in whiteboard_actions:
        page_index = action_doc.get('pageIndex', 0) # Default to page 0 if not specified.
        action_type = action_doc.get('action')
        drawing_data = action_doc.get('data')

        max_page_index = max(max_page_index, page_index) # Keep track of highest page index.

        if page_index not in pages_data:
            pages_data[page_index] = [] # Initialize page if it doesn't exist.
        
        if action_type == 'draw' and drawing_data:
            # For 'draw' actions, append the drawing data.
            pages_data[page_index].append(drawing_data)
        elif action_type == 'clear':
            # For 'clear' actions, clear all previous actions on that page.
            pages_data[page_index] = []
        # Other actions (e.g., page_change itself) are not drawing commands, so not stored here.
    
    # Format the reconstructed pages into a list of lists, as expected by app.js.
    history = []
    for i in range(max_page_index + 1):
        # Ensure all pages up to max_page_index are included, even if empty.
        history.append(pages_data.get(i, []))

    print(f"Fetched whiteboard history for classroom {classroomId}. Total pages reconstructed: {len(history)}.")
    return jsonify({"history": history}), 200

# --- Socket.IO Event Handlers ---
# These handlers enable real-time communication between the server and connected clients.

@socketio.on('connect')
def handle_connect():
    """
    Handles new Socket.IO client connections.
    If the user is authenticated, they join a personal room named after their user_id.
    """
    user_id = session.get('user_id')
    username = session.get('username')
    if user_id:
        # Join a private room for the user, allowing direct messages.
        join_room(user_id)
        print(f"User '{username}' ({user_id}) connected with SID: {request.sid}. Joined personal room '{user_id}'.")
    else:
        print(f"Unauthenticated user connected with SID: {request.sid}.")

@socketio.on('disconnect')
def handle_disconnect():
    """
    Handles Socket.IO client disconnections.
    Logs the disconnection and can be extended for cleanup.
    """
    user_id = session.get('user_id')
    username = session.get('username')
    if user_id:
        # Implicitly leaves rooms on disconnect, but explicit logic can be added.
        print(f"User '{username}' ({user_id}) disconnected. SID: {request.sid}.")
    else:
        print(f"Unauthenticated user disconnected. SID: {request.sid}.")

@socketio.on('join')
def handle_join_classroom(data):
    """
    Handles a user joining a specific classroom's Socket.IO room.
    Emits 'user_joined' to other participants and sends chat history to the joining user.
    """
    user_id = session.get('user_id')
    username = session.get('username')
    role = session.get('role') # Get role from session
    classroom_id = data.get('classroomId')
    
    # Validate required data from session and payload.
    if not all([user_id, username, role, classroom_id]):
        print(f"Socket.IO 'join' failed: Missing required data for user_id={user_id}, username={username}, role={role}, classroom_id={classroom_id}.")
        return

    # Verify that the user is actually a participant of the classroom in the DB.
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": user_id})
    if classroom:
        join_room(classroom_id) # Join the Socket.IO room for the classroom.
        print(f"User '{username}' ({user_id}) joined Socket.IO room for classroom {classroom_id} from SID: {request.sid}.")
        
        # Emit 'user_joined' event to all other participants in the classroom (excluding self).
        emit('user_joined', {
            'sid': request.sid,
            'user_id': user_id,
            'username': username,
            'role': role
        }, room=classroom_id, include_self=False)
        
        # Send recent chat history to the newly joined user.
        chat_messages = list(chat_messages_collection.find(
            {"classroomId": classroom_id},
            {"_id": 0} # Exclude MongoDB's _id.
        ).sort("timestamp", 1).limit(100)) # Fetch up to 100 most recent messages.
        
        # Format timestamps before sending.
        for msg in chat_messages:
            if 'timestamp' in msg and isinstance(msg['timestamp'], datetime):
                msg['timestamp'] = msg['timestamp'].isoformat()
        
        emit('chat_history', chat_messages, room=request.sid) # Emit only to the requesting client.
        
    else:
        print(f"User '{username}' ({user_id}) attempted to join classroom {classroom_id} without access. SID: {request.sid}.")

@socketio.on('leave')
def handle_leave_classroom(data):
    """
    Handles a user explicitly leaving a classroom's Socket.IO room.
    Emits 'user_left' to other participants.
    """
    user_id = session.get('user_id')
    username = session.get('username')
    classroom_id = data.get('classroomId')
    
    # Validate required data.
    if not all([user_id, username, classroom_id]):
        print(f"Socket.IO 'leave' failed: Missing required data for user_id={user_id}, username={username}, classroom_id={classroom_id}.")
        return

    # Verify user is a participant.
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": user_id})
    if classroom:
        leave_room(classroom_id) # Leave the Socket.IO room.
        print(f"User '{username}' ({user_id}) left Socket.IO room for classroom {classroom_id} from SID: {request.sid}.")
        
        # Emit 'user_left' event to all other participants in the classroom (excluding self).
        emit('user_left', {
            'sid': request.sid,
            'user_id': user_id,
            'username': username
        }, room=classroom_id, include_self=False)
    else:
        print(f"User '{username}' ({user_id}) attempted to leave classroom {classroom_id} but was not a participant or classroom not found. SID: {request.sid}.")


@socketio.on('message')
def handle_chat_message(data):
    """
    Handles incoming chat messages from clients.
    Stores the message in the database and broadcasts it to all participants in the classroom.
    """
    user_id = session.get('user_id')
    username = session.get('username')
    role = session.get('role')
    classroom_id = data.get('classroomId')
    message_text = data.get('message')

    # Validate all required fields from session and payload.
    if not all([user_id, username, role, classroom_id, message_text]):
        print(f"Socket.IO 'message' failed: Missing required data for user_id={user_id}, username={username}, role={role}, classroom_id={classroom_id}, message_text={message_text}.")
        return

    # Verify user is a participant before processing and broadcasting message.
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": user_id})
    if not classroom:
        print(f"User '{username}' ({user_id}) attempted to send message to classroom {classroom_id} without access.")
        return

    chat_message_id = str(uuid.uuid4()) # Generate unique ID for the chat message.
    current_timestamp = datetime.utcnow()

    chat_message = {
        "id": chat_message_id,
        "classroomId": classroom_id,
        "user_id": user_id,
        "username": username,
        "role": role,
        "message": message_text,
        "timestamp": current_timestamp
    }
    
    chat_messages_collection.insert_one(chat_message) # Store message in DB.
    
    # Emit the message to all users in the classroom, formatting timestamp to ISO string.
    emit('message', {
        "id": chat_message_id,
        "user_id": user_id,
        "username": username,
        "role": role,
        "message": message_text,
        "timestamp": current_timestamp.isoformat()
    }, room=classroom_id)
    
    print(f"Chat message from '{username}' ({user_id}) in classroom {classroom_id}: '{message_text}'.")

# --- Whiteboard Socket.IO Event Handlers ---
@socketio.on('draw')
def handle_draw(data):
    """
    Handles whiteboard drawing events.
    Receives drawing data and broadcasts it to all other participants in the same classroom.
    """
    classroomId = data.get('classroomId')
    if classroomId:
        emit('draw', data, room=classroomId, include_self=False)
        print(f"Whiteboard draw data received and broadcasted to room {classroomId}")
    else:
        print("Warning: Received draw event without a classroomId.")

@socketio.on('whiteboard_clear')
def handle_whiteboard_clear(data):
    """
    Handles whiteboard clear events.
    Broadcasts the clear event to all participants in the same classroom.
    """
    classroomId = data.get('classroomId')
    if classroomId:
        emit('whiteboard_clear', data, room=classroomId, include_self=False)
        print(f"Whiteboard clear event broadcasted to room {classroomId}")
    else:
        print("Warning: Received whiteboard_clear event without a classroomId.")

@socketio.on('whiteboard_undo_redo')
def handle_undo_redo(data):
    """
    Handles whiteboard undo/redo events.
    Broadcasts the new page state to all participants in the same classroom.
    """
    classroomId = data.get('classroomId')
    if classroomId:
        emit('whiteboard_undo_redo', data, room=classroomId, include_self=False)
        print(f"Whiteboard undo/redo event broadcasted to room {classroomId}")
    else:
        print("Warning: Received whiteboard_undo_redo event without a classroomId.")
@socketio.on('whiteboard_data')
def handle_whiteboard_data(data):
    """
    **UPDATED**: Handles incoming whiteboard drawing data from clients.
    Stores the drawing command in the database and broadcasts it to all participants in the classroom.
    Includes page indexing.
    """
    user_id = session.get('user_id')
    username = session.get('username')
    classroom_id = data.get('classroomId')
    action = data.get('action') # e.g., 'draw', 'clear'
    drawing_data = data.get('data') # The actual drawing command (points, shape, text, etc.)
    page_index = data.get('pageIndex', 0) # Page index, default to 0.

    # Validate required fields.
    if not all([user_id, classroom_id, action]):
        print(f"Socket.IO 'whiteboard_data' failed: Missing required fields for user_id={user_id}, classroom_id={classroom_id}, action={action}.")
        return
    
    # Ensure drawing_data is present for 'draw' action.
    if action == 'draw' and not drawing_data:
        print(f"Socket.IO 'whiteboard_data' failed: Missing 'data' for 'draw' action by user {user_id} in classroom {classroom_id}.")
        return


    # Verify user is a participant of the classroom.
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": user_id})
    if not classroom:
        print(f"User '{username}' ({user_id}) attempted to send whiteboard data to classroom {classroom_id} without access.")
        return
    
    # Role-based access for drawing: Only admins can draw/clear.
    user_role = session.get('role')
    if user_role != 'admin':
        print(f"User '{username}' ({user_id}) (role: {user_role}) attempted whiteboard {action} but is not an admin.")
        return # Silently ignore non-admin drawing attempts.

    current_timestamp = datetime.utcnow()

    # Store whiteboard data in the database.
    whiteboard_doc = {
        "id": str(uuid.uuid4()), # Unique ID for each whiteboard action document
        "classroomId": classroom_id,
        "action": action,
        "data": drawing_data, # This contains the actual pen strokes, shape data, etc.
        "pageIndex": page_index,
        "userId": user_id,
        "username": username,
        "timestamp": current_timestamp
    }
    
    whiteboard_collection.insert_one(whiteboard_doc)

    # Broadcast the whiteboard data to all users in the classroom (including sender for immediate feedback).
    emit('whiteboard_data', {
        'action': action,
        'data': drawing_data,
        'pageIndex': page_index,
        'userId': user_id,
        'username': username,
        'timestamp': current_timestamp.isoformat()
    }, room=classroom_id, include_self=True) # include_self=True for real-time local feedback.
    
    print(f"Whiteboard '{action}' from '{username}' ({user_id}) in classroom {classroom_id}, page {page_index}.")




@socketio.on('whiteboard_page_change')
def handle_whiteboard_page_change(data):
    """
    **UPDATED**: Handles requests to change the active whiteboard page or create a new one.
    Broadcasts the page change to all participants in the classroom.
    Only admins can initiate page changes.
    """
    user_id = session.get('user_id')
    username = session.get('username')
    classroom_id = data.get('classroomId')
    new_page_index = data.get('newPageIndex')
    # The 'action' here (e.g., 'navigate', 'add_page') is purely client-side intent
    # and is not necessarily stored or acted upon by the server beyond broadcasting.
    client_action = data.get('action', 'navigate') # For logging purposes.

    # Validate required fields.
    if not all([user_id, classroom_id, new_page_index is not None]):
        print(f"Socket.IO 'whiteboard_page_change' failed: Missing required data for user_id={user_id}, classroom_id={classroom_id}, new_page_index={new_page_index}.")
        return

    # Verify user is a participant.
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": user_id})
    if not classroom:
        print(f"User '{username}' ({user_id}) attempted to change page in classroom {classroom_id} without access.")
        return

    # Only admins can change/create pages.
    user_role = session.get('role')
    if user_role != 'admin':
        print(f"User '{username}' ({user_id}) (role: {user_role}) attempted whiteboard page change but is not an admin.")
        return # Silently ignore non-admin page change attempts.

    # Broadcast page change to all users in the classroom (excluding sender, as sender already updated UI locally).
    emit('whiteboard_page_change', {
        'newPageIndex': new_page_index,
        'action': client_action,
        'userId': user_id,
        'username': username
    }, room=classroom_id, include_self=False)
    
    print(f"Whiteboard page change to index {new_page_index} by '{username}' in classroom {classroom_id}. Client action: {client_action}.")

# --- WebRTC Signaling Socket.IO Handlers ---
# These handlers facilitate the exchange of WebRTC offers, answers, and ICE candidates
# between peers, enabling real-time video/audio communication.

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    """
    Handles a WebRTC offer from one peer to another.
    Stores the signal in the DB (for persistence/offline delivery) and forwards it to the recipient.
    """
    user_id = session.get('user_id') # This is the user_id of the offerer (e.g., admin)
    username = session.get('username')
    recipient_user_id = data.get('recipient_id') # The user_id of the intended recipient (e.g., student)
    classroom_id = data.get('classroomId')
    offer = data.get('offer') # The SDP offer.

    # Validate required data.
    if not all([user_id, username, recipient_user_id, classroom_id, offer]):
        print(f"Socket.IO 'webrtc_offer' failed: Missing required data from user {user_id}.")
        return

    # Ensure both sender and recipient are participants of the classroom.
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": {"$all": [user_id, recipient_user_id]}})
    if not classroom:
        print(f"WebRTC offer from {username} ({user_id}) to {recipient_user_id} in classroom {classroom_id} failed: One or both not participants.")
        return

    signal_id = str(uuid.uuid4())
    webrtc_signals_collection.insert_one({
        "id": signal_id,
        "type": "offer",
        "classroomId": classroom_id,
        "fromUserId": user_id,
        "fromUsername": username,
        "toUserId": recipient_user_id,
        "signalData": offer,
        "timestamp": datetime.utcnow()
    })

    # Emit the offer directly to the recipient's personal Socket.IO room (joined on connect).
    emit('webrtc_offer', {
        'offerer_socket_id': request.sid,       # The Socket.IO SID of the offerer (for client-side PC lookup)
        'offerer_user_id': user_id,             # The USER_ID of the offerer (for client to send answer back to)
        'offer': offer,
        'username': username
    }, room=recipient_user_id) # Send to the recipient's user_id room.
    
    print(f"WebRTC offer from '{username}' ({user_id}) (SID: {request.sid}) to user {recipient_user_id} in classroom {classroom_id}.")

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    """
    Handles a WebRTC answer from one peer to another.
    Stores the signal in the DB and forwards it to the original offerer.
    """
    user_id = session.get('user_id') # This is the user_id of the answerer (e.g., student)
    username = session.get('username')
    recipient_user_id = data.get('recipient_id') # The user_id of the original offerer (e.g., admin)
    classroom_id = data.get('classroomId')
    answer = data.get('answer') # The SDP answer.

    # Validate required data.
    if not all([user_id, username, recipient_user_id, classroom_id, answer]):
        print(f"Socket.IO 'webrtc_answer' failed: Missing required data from user {user_id}.")
        return

    # Ensure both sender and recipient are participants.
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": {"$all": [user_id, recipient_user_id]}})
    if not classroom:
        print(f"WebRTC answer from {username} ({user_id}) to {recipient_user_id} in classroom {classroom_id} failed: One or both not participants.")
        return

    signal_id = str(uuid.uuid4())
    webrtc_signals_collection.insert_one({
        "id": signal_id,
        "type": "answer",
        "classroomId": classroom_id,
        "fromUserId": user_id,
        "fromUsername": username,
        "toUserId": recipient_user_id,
        "signalData": answer,
        "timestamp": datetime.utcnow()
    })

    # Emit the answer directly back to the original offerer's personal Socket.IO room (recipient_user_id is the offerer's user_id).
    emit('webrtc_answer', {
        'sender_socket_id': request.sid,        # The Socket.IO SID of the answerer (for offerer's PC lookup)
        'sender_user_id': user_id,              # The USER_ID of the answerer
        'answer': answer,
        'username': username
    }, room=recipient_user_id) # Send to the recipient's user_id room.
    
    print(f"WebRTC answer from '{username}' ({user_id}) (SID: {request.sid}) to user {recipient_user_id} in classroom {classroom_id}.")

@socketio.on('webrtc_ice_candidate')
def handle_webrtc_ice_candidate(data):
    """
    Handles WebRTC ICE candidates.
    Stores the candidate in the DB and forwards it to the other peer.
    """
    user_id = session.get('user_id') # This is the user_id of the sender
    username = session.get('username')
    recipient_user_id = data.get('recipient_id') # The user_id of the other peer.
    classroom_id = data.get('classroomId')
    candidate = data.get('candidate') # The ICE candidate data.

    # Validate required data.
    if not all([user_id, username, recipient_user_id, classroom_id, candidate]):
        print(f"Socket.IO 'webrtc_ice_candidate' failed: Missing required data from user {user_id}.")
        return

    # Ensure both sender and recipient are participants.
    classroom = classrooms_collection.find_one({"id": classroom_id, "participants": {"$all": [user_id, recipient_user_id]}})
    if not classroom:
        print(f"WebRTC ICE candidate from {username} ({user_id}) to {recipient_user_id} in classroom {classroom_id} failed: One or both not participants.")
        return

    signal_id = str(uuid.uuid4())
    webrtc_signals_collection.insert_one({
        "id": signal_id,
        "type": "ice_candidate",
        "classroomId": classroom_id,
        "fromUserId": user_id,
        "fromUsername": username,
        "toUserId": recipient_user_id,
        "signalData": candidate,
        "timestamp": datetime.utcnow()
    })

    # Emit the ICE candidate directly to the other peer's personal Socket.IO room.
    emit('webrtc_ice_candidate', {
        'sender_socket_id': request.sid,        # The Socket.IO SID of the sender
        'sender_user_id': user_id,              # The USER_ID of the sender
        'candidate': candidate,
        'username': username
    }, room=recipient_user_id) # Send to the recipient's user_id room.
    
    print(f"WebRTC ICE candidate from '{username}' ({user_id}) (SID: {request.sid}) to user {recipient_user_id} in classroom {classroom_id}.")


@socketio.on('broadcast_status_update')
def handle_broadcast_status_update(data):
    """
    Handles broadcast status updates from the admin and relays them to all
    other participants in the classroom.
    """
    user_id = session.get('user_id') # The admin's user_id from the session
    classroom_id = data.get('classroomId')
    message = data.get('message')
    is_broadcasting = data.get('isBroadcasting')
    admin_username = data.get('adminUsername')

    # Basic validation for required data from the client
    if not all([user_id, classroom_id, message, admin_username, is_broadcasting is not None]):
        print(f"Socket.IO 'broadcast_status_update' failed: Missing required data from user {user_id}. Data: {data}")
        return

    # Optional but good practice: Verify the sender is an admin and in the classroom
    # You would need access to your 'users_collection' and 'classrooms_collection' here.
    # For now, we'll assume the client-side emitting is done by an authenticated admin.
    # user = users_collection.find_one({"id": user_id, "role": "admin"})
    # classroom = classrooms_collection.find_one({"id": classroom_id, "participants": user_id})
    # if not user or not classroom:
    #     print(f"Broadcast status update from non-admin or non-participant {user_id} in classroom {classroom_id} blocked.")
    #     return

    # Emit the update to all clients in the specified classroom, excluding the sender (the admin)
    emit('broadcast_status_update', {
        'message': message,
        'isBroadcasting': is_broadcasting,
        'adminUsername': admin_username,
        'adminUserId': user_id # Include admin's user ID for client-side cleanup if needed
    }, room=classroom_id, include_self=False)

    print(f"Broadcast status update from Admin '{admin_username}' ({user_id}) in classroom {classroom_id}: '{message}'.")



@socketio.on('webrtc_peer_disconnected')
def handle_webrtc_peer_disconnected(data):
    """
    Handles a signal that a WebRTC peer has disconnected.
    Broadcasts this information to all other peers in the classroom.
    """
    # The client now sends 'peer_user_id' instead of 'peer_id' (SID)
    peer_user_id = data.get('peer_user_id') 
    classroom_id = data.get('classroomId')
    
    # Validate required data.
    if not all([peer_user_id, classroom_id]):
        print(f"Socket.IO 'webrtc_peer_disconnected' failed: Missing peer_user_id or classroom_id. Data: {data}.")
        return

    # Broadcast to all users in the classroom (excluding the sender, if sender is still connected).
    emit('webrtc_peer_disconnected', {
        'peer_user_id': peer_user_id
    }, room=classroom_id, include_self=False)
    
    print(f"WebRTC peer disconnected signal broadcast for peer UserID: {peer_user_id} in classroom {classroom_id}.")

@app.route('/api/webrtc-signals', methods=['GET'])
def get_pending_webrtc_signals():
    """
    Endpoint for clients to fetch any pending WebRTC signals (offers, answers, candidates)
    that were sent while they were offline or before their Socket.IO connection was fully established.
    Clears fetched signals from the database.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/webrtc-signals: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401

    # Find all signals intended for the current user, sorted by timestamp.
    signals = list(webrtc_signals_collection.find({"toUserId": user_id}, {"_id": 0}).sort("timestamp", 1))
    
    # After fetching, delete these signals from the database as they have been delivered.
    webrtc_signals_collection.delete_many({"toUserId": user_id})
    print(f"Fetched {len(signals)} pending WebRTC signals for user {user_id}. Signals cleared from DB.")
    return jsonify(signals), 200

# --- Error Handling ---
# Custom error handlers for common HTTP status codes.

@app.errorhandler(404)
def not_found(e):
    """Handles 404 Not Found errors."""
    print(f"404 Error: Endpoint not found for request path: {request.path}.")
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    """Handles 500 Internal Server Errors."""
    print(f"500 Error: Internal server error for request path: {request.path}. Error: {e}")
    return jsonify({"error": "Internal server error"}), 500

# --- Main Entry Point ---
if __name__ == '__main__':
    print("Starting OneClass server...")
    # Run the Flask app with Socket.IO. Host on 0.0.0.0 to be accessible externally, port 5000.
    # Debug mode provides detailed error messages and auto-reloading.
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
