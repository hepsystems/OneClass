from flask import Flask, request, jsonify, send_from_directory
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
import os
import uuid
from datetime import datetime
from flask_sock import Sock # For WebSockets

app = Flask(__name__, static_folder='.') # Serve static files from current directory
app.config["MONGO_URI"] = "mongodb+srv://your_user:your_password@your_cluster.mongodb.net/virtual_classroom?retryWrites=true&w=majority"
mongo = PyMongo(app)
sock = Sock(app)

# MongoDB Collections
users_collection = mongo.db.users
classrooms_collection = mongo.db.classrooms
library_files_collection = mongo.db.library_files
assessments_collection = mongo.db.assessments

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

    # In a real app, you'd generate a JWT token here.
    # For simplicity, we're returning user data directly.
    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "role": user['role']
        }
    }), 200

@app.route('/api/update-profile', methods=['POST'])
# This endpoint would ideally require authentication (e.g., JWT token validation)
def update_profile():
    data = request.json
    user_id = data.get('userId') # Assuming client sends user ID
    new_username = data.get('username')

    if not user_id or not new_username:
        return jsonify({"error": "Missing user ID or new username"}), 400

    result = users_collection.update_one(
        {"id": user_id},
        {"$set": {"username": new_username, "updated_at": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404
    if result.modified_count == 0:
        return jsonify({"message": "No changes made"}), 200 # No error if same username
    return jsonify({"message": "Profile updated successfully"}), 200

@app.route('/api/upload-library-files', methods=['POST'])
# This endpoint would ideally require authentication (e.g., JWT token validation)
def upload_library_files():
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
                "uploaded_at": datetime.utcnow()
            })
            uploaded_file_info.append({"filename": file.filename, "url": f"/uploads/{filename}"})
    return jsonify({"message": "Files uploaded successfully", "files": uploaded_file_info}), 201

@app.route('/api/library-files/<classroomId>', methods=['GET'])
def get_library_files(classroomId):
    files = list(library_files_collection.find({"classroomId": classroomId}, {"_id": 0, "original_filename": 1, "url": 1}))
    # Rename 'original_filename' to 'filename' for client consistency
    for file in files:
        file['filename'] = file.pop('original_filename')
    return jsonify(files), 200

@app.route('/api/create-assessment', methods=['POST'])
def create_assessment():
    data = request.json
    class_room_id = data.get('classroomId')
    title = data.get('title')
    description = data.get('description')
    creator = data.get('creator')

    if not all([class_room_id, title, creator]):
        return jsonify({"error": "Missing required fields"}), 400

    assessment_id = str(uuid.uuid4())
    assessments_collection.insert_one({
        "id": assessment_id,
        "classroomId": class_room_id,
        "title": title,
        "description": description,
        "creator": creator,
        "created_at": datetime.utcnow()
    })
    return jsonify({"message": "Assessment created successfully", "id": assessment_id}), 201

@app.route('/api/assessments/<classroomId>', methods=['GET'])
def get_assessments(classroomId):
    assessments = list(assessments_collection.find({"classroomId": classroomId}, {"_id": 0}))
    return jsonify(assessments), 200

# --- WebSocket Functionality ---
# Store active WebSocket connections by classroom ID
connected_websockets = {} # {classroomId: {user_id: websocket_object}}

@sock.route('/ws/chat')
def chat_websocket(ws):
    class_room_id = request.args.get('classroomId')
    username = request.args.get('username', 'Anonymous')

    if not class_room_id:
        ws.close(code=1003, reason="Classroom ID is required")
        return

    # Add this WebSocket to the group for the specific classroom
    if class_room_id not in connected_websockets:
        connected_websockets[class_room_id] = {}
    
    # Store by a unique identifier, e.g., username + a unique ID for multiple tabs
    ws_id = f"{username}-{uuid.uuid4()}"
    connected_websockets[class_room_id][ws_id] = ws
    print(f"WebSocket connected: {username} to classroom {class_room_id}")

    try:
        while True:
            message = ws.receive()
            if message:
                data = json.loads(message)
                data['username'] = username # Add sender's username
                data['classroomId'] = class_room_id # Ensure classroom ID is in message
                
                # Broadcast message to all participants in the same classroom
                for _ws_id, client_ws in connected_websockets.get(class_room_id, {}).items():
                    if client_ws != ws: # Don't send back to sender
                        client_ws.send(json.dumps(data))
                    else: # Acknowledge for sender for certain message types (e.g., whiteboard)
                         if data.get('type') == 'whiteboard-data' or data.get('type') == 'whiteboard-clear':
                             # For whiteboard data, the sender's client already updates,
                             # so no need to send back to sender unless for confirmation.
                             pass


    except Exception as e:
        print(f"WebSocket error for {username} in classroom {class_room_id}: {e}")
    finally:
        # Remove this WebSocket when it closes
        if class_room_id in connected_websockets and ws_id in connected_websockets[class_room_id]:
            del connected_websockets[class_room_id][ws_id]
            if not connected_websockets[class_room_id]:
                del connected_websockets[class_room_id]
        print(f"WebSocket disconnected: {username} from classroom {class_room_id}")

if __name__ == '__main__':
    import json # Import json for WebSocket handling

    # To run with Flask-Sock, you typically use a production-ready WSGI server like Gunicorn or Gevent.
    # For development, you can run it directly:
    # app.run(debug=True, port=5000)
    # However, `flask run` (which uses Werkzeug) doesn't fully support WebSockets natively without
    # an additional layer. For simple testing, you *might* get away with it, but for robust WS,
    # use a dedicated server.
    # Example for development using Gevent with Flask-Sock:
    from gevent.pywsgi import WSGIServer
    from geventwebsocket.handler import WebSocketHandler

    http_server = WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
    print("Server running on http://localhost:5000")
    http_server.serve_forever()

    # Remember to install: pip install Flask Flask-PyMongo Flask-Sock pymongo Werkzeug gevent gevent-websocket
