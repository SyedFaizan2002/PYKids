from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import auth, credentials
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow frontend to connect

# Initialize Firebase
cred = credentials.Certificate('pykids-f144c-firebase-adminsdk-fbsvc-b2e057bd7c.json')
firebase_admin.initialize_app(cred)

# Database connection configuration
DB_CONFIG = {
    'dbname': 'pykids',
    'user': 'postgres',
    'password': 'Faizan@123',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the PyKIDS backend! Try /api/users/test123/profile"}), 200

@app.route('/api/users/<userId>/profile', methods=['GET'])
def get_user_profile(userId):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        if decoded_token['uid'] != userId:
            return jsonify({"error": "Unauthorized: User ID does not match token"}), 403
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            SELECT id, email, selected_avatar AS selectedAvatar, progress, 
                   total_score AS totalScore, created_at AS createdAt, 
                   last_active_lesson AS lastActiveLesson 
            FROM users 
            WHERE id = %s
            """, 
            (userId,)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<userId>/profile', methods=['POST'])
def update_user_profile(userId):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        if decoded_token['uid'] != userId:
            return jsonify({"error": "Unauthorized: User ID does not match token"}), 403
        data = request.get_json()
        selected_avatar = data.get('selectedAvatar')
        email = data.get('email')
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if user exists
        cursor.execute(
            """
            SELECT id FROM users WHERE id = %s
            """,
            (userId,)
        )
        user_exists = cursor.fetchone()
        
        if user_exists:
            # Update existing user
            if not selected_avatar:
                return jsonify({"error": "selectedAvatar is required"}), 400
            cursor.execute(
                """
                UPDATE users 
                SET selected_avatar = %s 
                WHERE id = %s 
                RETURNING id, email, selected_avatar AS selectedAvatar
                """,
                (selected_avatar, userId)
            )
        else:
            # Create new user
            cursor.execute(
                """
                INSERT INTO users (id, email, selected_avatar, progress, total_score, created_at, last_active_lesson)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, email, selected_avatar AS selectedAvatar
                """,
                (userId, email or decoded_token.get('email', ''), selected_avatar, '{}', 0, datetime.now(), None)
            )
        
        user = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({"error": "Failed to update or create user"}), 500
        return jsonify(user), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)