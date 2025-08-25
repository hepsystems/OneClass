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
        print(f"ADD QUESTIONS /api/assessments/<assessmentId>/questions: Forbidden - User {user_id} is not the creator of this assessment." )
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
        question_text = submitted_answer.get('question_text') # From frontend payload...
        
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
    
    # Check if the user is the student who made the submission or an admin.
    is_submission_owner = (submission.get('student_id') == user_id)

    # If user is not the owner, check if they are an admin and if they created the assessment.
    is_admin_creator = False
    if user_role == 'admin':
        assessment = assessments_collection.find_one({"id": submission['assessmentId']})
        if assessment and assessment.get('creator_id') == user_id:
            is_admin_creator = True

    if not is_submission_owner and not is_admin_creator:
        print(f"GET /api/submissions/<submissionId>: Forbidden - User {user_id} is not the student or the admin creator for this submission.")
        return jsonify({"error": "Forbidden: You do not have permission to view this submission."}), 403

    # Format datetime objects
    if 'submitted_at' in submission and isinstance(submission['submitted_at'], datetime):
        submission['submitted_at'] = submission['submitted_at'].isoformat()
    if 'marked_at' in submission and isinstance(submission['marked_at'], datetime):
        submission['marked_at'] = submission['marked_at'].isoformat()

    print(f"Fetched details for submission {submissionId} for user {user_id}.")
    return jsonify(submission), 200

@app.route('/api/submissions/<submissionId>/mark', methods=['POST'])
def mark_submission():
    """
    Allows an admin (who created the assessment) to mark or provide feedback on a submission.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')
    username = session.get('username')
    if not user_id or user_role != 'admin':
        print("MARK SUBMISSION /api/submissions/<submissionId>/mark: Unauthorized - Only admins can mark submissions.")
        return jsonify({"error": "Unauthorized: Only administrators can mark submissions."}), 401

    submission_id = request.view_args.get('submissionId') # Get ID from URL path.
    data = request.json
    feedback = data.get('feedback')
    new_score = data.get('score')
    
    if new_score is None:
        print(f"MARK SUBMISSION {submission_id}: Missing new 'score' in request.")
        return jsonify({"error": "Missing 'score' field"}), 400

    submission = assessment_submissions_collection.find_one({"id": submission_id})
    if not submission:
        print(f"MARK SUBMISSION {submission_id}: Submission not found.")
        return jsonify({"error": "Submission not found"}), 404

    # Ensure the admin marking the submission is the creator of the assessment.
    assessment = assessments_collection.find_one({"id": submission['assessmentId']})
    if not assessment or assessment.get('creator_id') != user_id:
        print(f"MARK SUBMISSION {submission_id}: Forbidden - Admin {user_id} is not the creator of this assessment.")
        return jsonify({"error": "Forbidden: You are not authorized to mark this submission."}), 403

    # Update the submission document with the new score, feedback, and timestamp.
    result = assessment_submissions_collection.update_one(
        {"id": submission_id},
        {"$set": {
            "score": new_score,
            "admin_feedback": feedback,
            "marked_by": username,
            "marked_at": datetime.utcnow()
        }}
    )

    if result.matched_count == 0:
        print(f"MARK SUBMISSION {submission_id}: Failed to update submission.")
        return jsonify({"error": "Failed to update submission"}), 500

    # Emit a real-time update to the student who owns the submission.
    student_id = submission.get('student_id')
    socketio.emit('submission_marked', {
        'submissionId': submission_id,
        'new_score': new_score,
        'feedback': feedback
    }, room=student_id) # Emits to the student's private room.

    print(f"Submission {submission_id} marked with score {new_score} by admin {username}.")
    return jsonify({"message": "Submission marked successfully"}), 200

# --- Classroom Management (API) ---

@app.route('/api/classrooms', methods=['POST'])
def create_classroom():
    """
    **UPDATED**: Creates a new classroom.
    Requires admin role. The creator is automatically added as a participant.
    """
    user_id = session.get('user_id')
    user_role = session.get('role')
    if not user_id or user_role != 'admin':
        print("CREATE /api/classrooms: Unauthorized - Only administrators can create classrooms.")
        return jsonify({"error": "Unauthorized: Only administrators can create classrooms."}), 401
    
    data = request.json
    title = data.get('title')
    description = data.get('description', '')
    
    if not title:
        print("CREATE /api/classrooms: Missing 'title' field.")
        return jsonify({"error": "Missing classroom title"}), 400
    
    classroom_id = str(uuid.uuid4())
    
    new_classroom = {
        "id": classroom_id,
        "title": title,
        "description": description,
        "creator_id": user_id,
        "created_at": datetime.utcnow(),
        # Add the creator to the participants list by default.
        "participants": [user_id] 
    }
    
    classrooms_collection.insert_one(new_classroom)
    print(f"Classroom '{title}' created by admin {user_id}. Classroom ID: {classroom_id}.")
    return jsonify({"message": "Classroom created successfully", "classroomId": classroom_id}), 201

@app.route('/api/classrooms', methods=['GET'])
def get_all_classrooms():
    """
    Retrieves a list of all classrooms the current user is a participant of.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/classrooms: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401
    
    # Find classrooms where the user's ID is in the participants array.
    classrooms = list(classrooms_collection.find({"participants": user_id}, {"_id": 0}))
    
    # Format datetime objects for JSON serialization.
    for classroom in classrooms:
        if 'created_at' in classroom and isinstance(classroom['created_at'], datetime):
            classroom['created_at'] = classroom['created_at'].isoformat()
    
    print(f"User {user_id} fetched {len(classrooms)} classrooms.")
    return jsonify(classrooms), 200

@app.route('/api/classrooms/<classroomId>', methods=['GET'])
def get_classroom_details(classroomId):
    """
    Retrieves details for a specific classroom.
    Requires the user to be a participant.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("GET /api/classrooms/<classroomId>: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401
    
    # Find the classroom, ensuring the user is a participant.
    classroom = classrooms_collection.find_one({"id": classroomId, "participants": user_id}, {"_id": 0})
    
    if not classroom:
        print(f"GET /api/classrooms/<classroomId>: Classroom {classroomId} not found or user {user_id} not a participant.")
        return jsonify({"error": "Classroom not found or access denied"}), 404

    # Format datetime objects.
    if 'created_at' in classroom and isinstance(classroom['created_at'], datetime):
        classroom['created_at'] = classroom['created_at'].isoformat()
    
    print(f"User {user_id} fetched details for classroom {classroomId}.")
    return jsonify(classroom), 200

@app.route('/api/classrooms/<classroomId>/join', methods=['POST'])
def join_classroom_via_invite(classroomId):
    """
    Allows a user to join a classroom if they are not already a participant.
    """
    user_id = session.get('user_id')
    if not user_id:
        print("JOIN /api/classrooms/<classroomId>/join: Unauthorized - No user_id in session.")
        return jsonify({"error": "Unauthorized"}), 401
    
    classroom = classrooms_collection.find_one({"id": classroomId})
    if not classroom:
        print(f"JOIN {classroomId}: Classroom not found.")
        return jsonify({"error": "Classroom not found"}), 404
        
    # Add the user's ID to the participants set to ensure uniqueness.
    # The $addToSet operator in MongoDB is atomic and ensures the ID is only added if not present.
    result = classrooms_collection.update_one(
        {"id": classroomId},
        {"$addToSet": {"participants": user_id}}
    )
    
    if result.modified_count > 0:
        print(f"User {user_id} successfully joined classroom {classroomId}.")
        # Emit a real-time event to the classroom to notify other participants.
        socketio.emit('participant_joined', {'classroomId': classroomId, 'userId': user_id}, room=classroomId)
    else:
        # This means the user was already a participant.
        print(f"User {user_id} is already a participant of classroom {classroomId}.")
    
    return jsonify({"message": "Joined classroom successfully"}), 200

# --- Socket.IO Handlers (Real-time Communication) ---

@socketio.on('connect')
def handle_connect():
    """
    Handles new client connections to Socket.IO.
    A user's `session['user_id']` is their private room name.
    """
    user_id = session.get('user_id')
    if user_id:
        # Join a private room with the user's ID so we can send direct messages.
        join_room(user_id)
        print(f"User {user_id} connected via Socket.IO and joined their private room.")
    else:
        print("A client connected with an unauthenticated session.")

@socketio.on('join_classroom')
def handle_join_classroom(data):
    """
    Handles a user joining a specific classroom room.
    Adds the user to the classroom's participants list in the DB if not already present.
    """
    user_id = session.get('user_id')
    class_room_id = data.get('classroomId')
    if not user_id or not class_room_id:
        print(f"Join classroom failed: Missing user ID or classroom ID. SID: {request.sid}")
        return
    
    # Add the user to the classroom's participants set in the DB.
    # $addToSet ensures the user is only added once.
    classrooms_collection.update_one(
        {"id": class_room_id},
        {"$addToSet": {"participants": user_id}}
    )
    
    # Join the Socket.IO room for the classroom.
    join_room(class_room_id)
    print(f"User {user_id} (SID: {request.sid}) joined classroom room {class_room_id}.")

    # Announce the new participant's connection to others in the room.
    emit('user_joined_room', {'userId': user_id, 'classroomId': class_room_id}, room=class_room_id)

@socketio.on('leave_classroom')
def handle_leave_classroom(data):
    """
    Handles a user leaving a specific classroom room.
    Note: We do not remove the user from the DB participants list here,
    as they might re-join later.
    """
    user_id = session.get('user_id')
    class_room_id = data.get('classroomId')
    if not user_id or not class_room_id:
        print("Leave classroom failed: Missing user ID or classroom ID.")
        return
    
    leave_room(class_room_id)
    print(f"User {user_id} (SID: {request.sid}) left classroom room {class_room_id}.")
    emit('user_left_room', {'userId': user_id, 'classroomId': class_room_id}, room=class_room_id)


@socketio.on('get_room_participants')
def handle_get_room_participants(data):
    """
    NEW HANDLER: Fetches and returns the list of all participants in a classroom.
    This is requested by the admin to start WebRTC offers.
    """
    user_id = session.get('user_id')
    class_room_id = data.get('classroomId')
    if not user_id or not class_room_id:
        print(f"get_room_participants failed: Missing user ID or classroom ID. SID: {request.sid}")
        return
    
    # Ensure the requesting user is a participant of the classroom.
    classroom = classrooms_collection.find_one({
        "id": class_room_id,
        "participants": user_id
    })

    if classroom:
        participants = classroom.get('participants', [])
        print(f"User {user_id} requested participants for classroom {class_room_id}. Found {len(participants)} participants.")
        # Emit the list of participants back to the requesting client's SID.
        emit('room_participants', {'participants': participants}, room=request.sid)
    else:
        print(f"get_room_participants failed: User {user_id} is not a participant of classroom {class_room_id}.")
        emit('error', {'message': 'You do not have permission to view this classroom\'s participants.'}, room=request.sid)


@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    """
    Handles a WebRTC offer signal from one peer to another.
    The signal is emitted to the recipient's private room.
    """
    sender_id = session.get('user_id')
    recipient_id = data.get('recipient_id') # NOTE: Frontend must send 'recipient_id'
    
    if not sender_id or not recipient_id:
        print(f"WebRTC offer failed: Missing sender ({sender_id}) or recipient ({recipient_id}) ID.")
        return

    # Check if both sender and recipient are in the same classroom to prevent
    # unauthorized connections.
    classroom_id = data.get('classroomId')
    classroom = classrooms_collection.find_one({
        "id": classroom_id, 
        "participants": {"$all": [sender_id, recipient_id]}
    })
    
    if classroom:
        # Forward the offer to the recipient's private room.
        emit('webrtc_offer', data, room=recipient_id)
        print(f"Forwarded WebRTC offer from {sender_id} to {recipient_id} in classroom {classroom_id}.")
        
        # Optionally, save the offer to the DB for offline delivery.
        webrtc_signals_collection.insert_one({
            "fromUserId": sender_id,
            "toUserId": recipient_id,
            "signal_type": "offer",
            "payload": data,
            "timestamp": datetime.utcnow()
        })
    else:
        print(f"WebRTC offer blocked: Users {sender_id} and {recipient_id} are not both in classroom {classroom_id}.")

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    """
    Handles a WebRTC answer signal.
    """
    sender_id = session.get('user_id')
    recipient_id = data.get('recipient_id') # NOTE: Frontend must send 'recipient_id'
    
    if not sender_id or not recipient_id:
        print(f"WebRTC answer failed: Missing sender ({sender_id}) or recipient ({recipient_id}) ID.")
        return

    # Forward the answer to the recipient's private room.
    emit('webrtc_answer', data, room=recipient_id)
    print(f"Forwarded WebRTC answer from {sender_id} to {recipient_id}.")
    
    # Optionally, save the answer for offline delivery.
    webrtc_signals_collection.insert_one({
        "fromUserId": sender_id,
        "toUserId": recipient_id,
        "signal_type": "answer",
        "payload": data,
        "timestamp": datetime.utcnow()
    })

@socketio.on('webrtc_candidate')
def handle_webrtc_candidate(data):
    """
    Handles an ICE candidate signal.
    """
    sender_id = session.get('user_id')
    recipient_id = data.get('recipient_id') # NOTE: Frontend must send 'recipient_id'
    
    if not sender_id or not recipient_id:
        print(f"WebRTC candidate failed: Missing sender ({sender_id}) or recipient ({recipient_id}) ID.")
        return
        
    # Forward the candidate to the recipient's private room.
    emit('webrtc_candidate', data, room=recipient_id)
    print(f"Forwarded WebRTC candidate from {sender_id} to {recipient_id}.")
    
    # Optionally, save the candidate for offline delivery.
    webrtc_signals_collection.insert_one({
        "fromUserId": sender_id,
        "toUserId": recipient_id,
        "signal_type": "candidate",
        "payload": data,
        "timestamp": datetime.utcnow()
    })

# --- Offline Signaling API ---
# This API is used by the frontend to retrieve signals that were sent while a user was offline.
@app.route('/api/webrtc-signals', methods=['GET'])
def get_webrtc_signals():
    """
    Retrieves all pending WebRTC signals for the current user.
    After fetching, the signals are deleted from the database.
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
    # Run the Flask app with Socket.IO. Host on 0.0.0.0 to make it accessible from other machines on the network.
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
