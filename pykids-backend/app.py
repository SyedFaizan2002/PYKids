from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import auth, credentials
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import json

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})  # Allow frontend origin

cred = credentials.Certificate('pykids-f144c-firebase-adminsdk-fbsvc-d72760ae50.json')
firebase_admin.initialize_app(cred)

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
        
        cursor.execute(
            """
            SELECT id FROM users WHERE id = %s
            """,
            (userId,)
        )
        user_exists = cursor.fetchone()
        
        if user_exists:
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

@app.route('/api/users/<userId>/progress', methods=['PUT'])
def update_user_progress(userId):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        if decoded_token['uid'] != userId:
            return jsonify({"error": "Unauthorized: User ID does not match token"}), 403
        
        data = request.get_json()
        module_id = data.get('moduleId')
        topic_id = data.get('topicId')
        completed = data.get('completed')
        score = data.get('score')
        
        if not module_id or not topic_id or completed is null:
            return jsonify({"error": "moduleId, topicId, and completed are required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            """
            SELECT progress, total_score 
            FROM users 
            WHERE id = %s
            """,
            (userId,)
        )
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404
        
        current_progress = user['progress'] or {}
        is_new_completion = completed and (not current_progress.get(module_id, {}).get(topic_id, {}).get('completed', False))
        
        if module_id not in current_progress:
            current_progress[module_id] = {}
        current_progress[module_id][topic_id] = {
            'completed': completed,
            'score': score if score is not None else current_progress.get(module_id, {}).get(topic_id, {}).get('score', 0),
            'completedAt': datetime.now().isoformat() if completed else current_progress.get(module_id, {}).get(topic_id, {}).get('completedAt')
        }
        
        new_score = score if is_new_completion and score is not None else 0
        total_score = user['total_score'] + new_score
        
        last_active_lesson = {'moduleId': module_id, 'topicId': topic_id}
        
        cursor.execute(
            """
            UPDATE users 
            SET progress = %s, total_score = %s, last_active_lesson = %s
            WHERE id = %s
            RETURNING id, email, selected_avatar AS selectedAvatar, progress, 
                      total_score AS totalScore, last_active_lesson AS lastActiveLesson
            """,
            (json.dumps(current_progress), total_score, json.dumps(last_active_lesson), userId)
        )
        
        updated_user = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        if not updated_user:
            return jsonify({"error": "Failed to update progress"}), 500
        return jsonify(updated_user), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)