import base64
import inspect
import json
import logging
import mimetypes
import os
import re
import secrets
import time
import token
import traceback
import urllib.request
from collections import namedtuple
from datetime import date, datetime, timedelta
from functools import wraps
from hashlib import sha256
from logging.handlers import RotatingFileHandler
from turtle import title
from uuid import uuid4

import dotenv
import flask_sqlalchemy
import jwt
import mysql.connector
import pandas as pd
import psycopg2
import pymysql
import pymysql.cursors
import requests
from dotenv import load_dotenv
from flask import (Flask, Response, abort, flash, jsonify, make_response,
                   redirect, render_template, request, send_file,
                   send_from_directory, session, url_for)
from flask_cors import CORS, cross_origin
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_redis import FlaskRedis
from flask_sqlalchemy import SQLAlchemy
from mysql.connector import Error
from mysql.connector.cursor import MySQLCursorDict as Cursor
from psycopg2 import DatabaseError, Error, ProgrammingError
from pymysql.cursors import DictCursor
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import safe_join, secure_filename

load_dotenv()

app = Flask(__name__)
app.secret_key = 'your_secret_key'
# ✅ Allow Authorization Header in CORS
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:5173", "allow_headers": ["Authorization", "Content-Type"]}})
is_local = os.environ.get("FLASK_ENV") == "development" 


app = Flask(__name__, static_folder='static')

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
app.config['FLASK_ENV'] = os.getenv("FLASK_ENV", "development")
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "fallback_secret_key")
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "fallback_jwt_key")
app.config['UNIVERSAL_SECRET_KEY'] = os.getenv("UNIVERSAL_SECRET_KEY", "fallback_universal_key")
app.config['MYSQL_HOST'] = os.getenv("MYSQL_HOST", "localhost")
app.config['MYSQL_USER'] = os.getenv("MYSQL_USER", "root")
app.config['MYSQL_PASSWORD'] = os.getenv("MYSQL_PASSWORD", "foulae0101@")
app.config['MYSQL_DB'] = os.getenv("MYSQL_DB", "library")
app.config['REDIS_URL'] = os.getenv("REDIS_URL", "redis://localhost:6379/0")



def image_to_base64(image_filename):
    """Convert an image file to a Base64-encoded string."""
    if not image_filename:
        return None

    absolute_path = os.path.join(app.root_path, 'static', 'images', image_filename)
    
    try:
        with open(absolute_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except FileNotFoundError:
        app.logger.warning(f"⚠️ Image not found: {image_filename}")
        return None
    except Exception as e:
        app.logger.error(f"❌ Error encoding image {image_filename}: {e}")
        return None
    

redis_store = FlaskRedis(app)

# Set the upload folder for storing images
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'static', 'images')

# Optionally, you can also limit the allowed file extensions
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}



# Configure MySQL connection
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'foulae0101@',
    'database': 'library'
}



# Configure MySQL connection
try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='foulae0101@',
        db='library',
        cursorclass=pymysql.cursors.DictCursor
    )

    cursor = connection.cursor()
    print("✅ Connected to the database!")

    # Path to your images directory
    image_folder = os.path.join(os.getcwd(), 'static', 'images')  # Ensure this path is correct
    if not os.path.exists(image_folder):
        print("⚠️ Image folder not found!")
        exit()

    image_files = os.listdir(image_folder)

    # Loop through image files and update database
    for image in image_files:
        if image.lower().endswith((".jpg", ".png", ".jpeg")):  # Only process image files
            formatted_name = image.replace("_", " ").rsplit(".", 1)[0].strip().lower()

            # Update the database (Assumes book title matches the filename)
            update_query = "UPDATE books SET image = %s WHERE LOWER(title) = %s"
            cursor.execute(update_query, (image, formatted_name))

    # Commit and close connection
    connection.commit()
    print("✅ Database image names updated successfully!")

except pymysql.MySQLError as e:
    print(f"❌ Database error: {e}")

finally:
    if 'cursor' in locals():
        cursor.close()
    if 'connection' in locals():
        connection.close()

        

# Configure logging
log_handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=3)
log_handler.setLevel(logging.INFO)
log_formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')
log_handler.setFormatter(log_formatter)

logger = logging.getLogger('tdm')
logger.setLevel(logging.INFO)
logging.basicConfig(level=logging.DEBUG)  # Set logging level to DEBUG
logger = logging.getLogger(__name__)
app.logger.setLevel(logging.DEBUG)
logger.addHandler(log_handler)

# 🔥 Define a secret key for signing JWTs (keep this secure)
SECRET_KEY = os.environ.get("SECRET_KEY", "your_very_secret_key")  # Use env variable if available



def get_db_connection():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='foulae0101@',
        db='library',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


def get_db():
    conn = mysql.connector.connect(
        host=app.config['MYSQL_HOST'],
        user=app.config['MYSQL_USER'],
        password=app.config['MYSQL_PASSWORD'],
        database=app.config['MYSQL_DB']
    )
    return conn


def init_db():
    """Initialize the database and create tables if they do not exist."""
    conn = None
    try:
        conn = get_db()  # Get database connection
        cursor = conn.cursor()

        # Create database if it doesn't exist
        cursor.execute(f'CREATE DATABASE IF NOT EXISTS {app.config["MYSQL_DB"]}')
        cursor.execute(f'USE {app.config["MYSQL_DB"]}')

        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(50),
                sex ENUM('M', 'F'),
                mobile_number VARCHAR(15),
                country_code VARCHAR(5)
            )
        ''')
        conn.commit()

        # Create books table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS books (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255) NOT NULL,
                available BOOLEAN DEFAULT TRUE
            )
        ''')
        conn.commit()

        # Create borrowed_books table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS borrowed_books (
                id INT AUTO_INCREMENT PRIMARY KEY,
                book_id INT NOT NULL,
                user_id INT NOT NULL,
                borrowed_date DATETIME NOT NULL,
                borrow_count INT DEFAULT 0,
                due_date DATETIME,
                FOREIGN KEY (book_id) REFERENCES books(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        conn.commit()

        # Create inventory table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                book_id INT,
                status ENUM('available', 'borrowed') NOT NULL DEFAULT 'available',
                FOREIGN KEY (book_id) REFERENCES books(id)
            )
        ''')
        conn.commit()

        print("✅ Database initialized successfully.")

    except pymysql.MySQLError as e:
        if conn:
            conn.rollback()  # Rollback changes if there's an error
        app.logger.error(f"❌ Database Initialization Failed: {e}")
        print(f"❌ Database Initialization Failed: {e}")

    finally:
        if conn:
            conn.close()  # Close database connection
            

@app.route("/set_cookie")
def set_cookie():
    response = make_response(jsonify({"message": "Cookie set"}))
    response.set_cookie(
    'token', 
    token, 
    httponly=True, 
    secure=False,  # Change to True if using HTTPS
    samesite='None',  # Try 'None' if accessing from a different origin
    path='/'  # Ensure it's accessible globally
)
    return response


# home route
@app.route('/')
def home():
    token = request.cookies.get('token')
    if token:
        return render_template('home.html', logged_in=True)
    else:
        return render_template('home.html', logged_in=False)


@app.route('/login', methods=['POST', 'GET', 'OPTIONS'])
@limiter.limit("5 per minute")
def login():
    if request.method == 'OPTIONS':
        return '', 204

    if request.method == 'POST':
        if request.content_type != 'application/json':
            return jsonify({"error": "Invalid Content-Type"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body!"}), 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            logger.warning('Missing username or password in request body')
            return jsonify({'message': 'Missing username or password in request body!'}), 400

        conn = None
        cursor = None
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT id, password, role FROM users WHERE username = %s', (username,))
            user = cursor.fetchone()
        except Exception as e:
            logger.error(f"Database error: {e}")
            return jsonify({"error": "Database error"}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

        if user and check_password_hash(user[1], password):
            user_id = user[0]
            role = user[2]
            session_id = str(uuid4())

            token_payload = {
                'user_id': user_id,
                    'session_id': session_id,
                    'exp': datetime.utcnow() + timedelta(hours=1),
                    'role': role
                }
            print("✅ Token Payload Before Encoding:", token_payload)  # 🔥 Debugging

            token = jwt.encode(token_payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')

            universal_token = jwt.encode({
                'user_id': user_id,
                'exp': datetime.utcnow() + timedelta(days=2)
            }, app.config['UNIVERSAL_SECRET_KEY'], algorithm='HS256')

            logger.info(f'Received token: {token}')
            logger.info(f'Received universal token: {universal_token}')

            token_hash = sha256(token.encode()).hexdigest()
            redis_store.setex(session_id, timedelta(hours=2), token_hash)

            session['session_id'] = session_id
            session['user_id'] = user_id
            session['role'] = role  

            response = make_response(jsonify({
                'token': token,  
                'universal_token': universal_token,  
                'user_role': role
            }))

            response.set_cookie('token', token, httponly=True, secure=True, samesite="None")
            response.set_cookie('universal_token', universal_token, httponly=True, secure=True, samesite="None")

            return response

        logger.warning('Invalid credentials provided')
        return jsonify({'message': 'Invalid credentials'}), 403

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT username FROM users')
        usernames = [row[0] for row in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

    return jsonify({'usernames': usernames})






@app.route('/api/usernames', methods=['GET'])
def api_usernames():
    query = request.args.get('query', '')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT username FROM users WHERE username LIKE %s', ('%' + query + '%',))
    usernames = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(usernames)

# Mapping to normalize country codes
COUNTRY_MAPPING = {
    "India": "IN", "IND": "IN", "+91": "IN",
    "United States": "US", "USA": "US", "+1": "US",
    "United Kingdom": "UK", "GB": "UK", "+44": "UK",
    "Canada": "CA", "+1": "CA",
    "Australia": "AU", "+61": "AU"
}

VALID_COUNTRY_CODES = set(COUNTRY_MAPPING.values())  # {"IN", "US", "UK", "CA", "AU"}

def normalize_country_code(country_code):
    """Normalize user input for country codes."""
    return COUNTRY_MAPPING.get(country_code, country_code)

def validate_country_code(code):
    """Ensure country code is valid before inserting into DB."""
    if code not in VALID_COUNTRY_CODES:
        raise ValueError(f"Invalid country code: {code}")
    

@app.route('/register', methods=['POST', 'GET', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 204

    if request.method == 'POST':
        # ✅ Detect JSON (API) request
        if request.content_type != 'application/json':
            return jsonify({"error": "Invalid Content-Type, expected application/json"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body!"}), 400

        logger.info(f"📌 Received Registration Data: {data}")  # ✅ Debugging

        # ✅ Required Fields
        required_fields = ['username', 'email', 'full_name', 'sex', 'mobile_number', 'country_code', 'password', 'confirm_password', 'role']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

        # ✅ Extract Data
        username = data['username']
        email = data['email']
        full_name = data['full_name']
        sex = data['sex']
        mobile_number = data['mobile_number']
        country_code = data['country_code']
        password = data['password']
        confirm_password = data['confirm_password']
        role = data.get('role', 'user')  # Default to 'user'

        # ✅ Normalize Country Code
        COUNTRY_MAPPING = {
            "India": "IN", "IND": "IN", "+91": "IN",
            "United States": "US", "USA": "US", "+1": "US",
            "United Kingdom": "UK", "GB": "UK", "+44": "UK",
            "Canada": "CA", "+1": "CA",
            "Australia": "AU", "+61": "AU"
        }

        VALID_COUNTRY_CODES = set(COUNTRY_MAPPING.values())  # {"IN", "US", "UK", "CA", "AU"}

        country_code = COUNTRY_MAPPING.get(country_code, country_code)  # Normalize input

        if country_code not in VALID_COUNTRY_CODES:
            return jsonify({"error": f"Invalid country code: {country_code}"}), 400

        # ✅ Validate Passwords
        if password != confirm_password:
            return jsonify({"error": "Passwords do not match!"}), 400

        if not is_complex_password(password):
            return jsonify({"error": "Password does not meet complexity requirements!"}), 400

        hashed_password = generate_password_hash(password)

        # ✅ Connect to Database
        conn = None
        cursor = None

        try:
            conn = get_db()
            cursor = conn.cursor()

            conn.start_transaction()

            # ✅ Check if it's the first user and set as admin
            cursor.execute('SELECT COUNT(*) FROM users')
            user_count = cursor.fetchone()[0]
            if user_count == 0:
                role = 'admin'

            # ✅ Insert New User
            cursor.execute('''
                INSERT INTO users (username, email, password, full_name, sex, mobile_number, country_code, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ''', (username, email, hashed_password, full_name, sex, mobile_number, country_code, role))

            conn.commit()

        except mysql.connector.IntegrityError:
            conn.rollback()
            return jsonify({"error": "Username or Email already exists!"}), 400

        except mysql.connector.DataError as e:
            conn.rollback()
            return jsonify({"error": f"Data error occurred: {str(e)}"}), 400

        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {e}")
            return jsonify({"error": "Database error"}), 500

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

        return jsonify({"message": "Registration successful! Please log in."}), 201

    # ✅ React expects JSON, not an HTML template
    return jsonify({"message": "Registration endpoint ready"}), 200






# ✅ Token Validation Route
@app.route('/auth/validate', methods=['POST'])
def validate_token():
    try:
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"valid": False, "error": "Token is missing or invalid"}), 401

        token = auth_header.split(" ")[1]  # Extract token after "Bearer"
        
        # Debug: Print token and secret key
        logger.info(f"Received Token: {token}")
        logger.info(f"Expected SECRET_KEY: {app.config['JWT_SECRET_KEY']}")

        try:
            decoded = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            return jsonify({"valid": True, "user_id": decoded["user_id"]}), 200
        except jwt.ExpiredSignatureError:
            return jsonify({"valid": False, "error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"valid": False, "error": "Invalid token"}), 401

    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500



# ✅ Catch all errors and return JSON
@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(500)
def handle_errors(error):
    """ ✅ Forces JSON response on all Flask errors """
    response = jsonify({"error": str(error.description)})
    response.status_code = error.code
    response.mimetype = "application/json"
    return response

# 🔹 Global CORS Handling
@app.after_request
def apply_cors(response):
    allowed_origins = ["http://localhost:5173", "https://your-production-url.com"]
    origin = request.headers.get("Origin")

    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin  

    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, DELETE, SEARCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"

    return response


# ✅ Ensure every response is JSON
# ✅ Ensure JSON response for all cases
@app.after_request
def force_json_response(response):
    response.headers["Content-Type"] = "application/json"
    return response


def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        # ✅ Allow OPTIONS requests (CORS)
        if request.method == 'OPTIONS':
            return '', 204

        token = request.cookies.get('token')
        universal_token = request.cookies.get('universal_token')

        if not token and not universal_token:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token and not universal_token:
            return jsonify({'message': 'Token is missing!'}), 401

        user_id = None
        role = None

        try:
            if token:
                data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
                print("🔍 Decoded Token Data:", data)

                session_id = data.get('session_id')
                user_id = data.get('user_id')
                role = data.get('role', 'user')

                token_hash = redis_store.get(session_id)

                # 🔥 Fix: Only invalidate if session exists but hash is incorrect
                if session_id and token_hash and token_hash != sha256(token.encode()).hexdigest():
                    print("⚠️ Session exists, but token is invalid. Trying universal token...")
                    token = None  

            if not token and universal_token:
                data = jwt.decode(universal_token, app.config['UNIVERSAL_SECRET_KEY'], algorithms=['HS256'])
                print("🔍 Decoded Universal Token Data:", data)

                user_id = data.get('user_id')
                role = data.get('role', role)  # 🔥 Preserve previous role if possible

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 401

        if user_id is None:
            return jsonify({'message': 'Authentication failed!'}), 401

        print(f"✅ Final Authenticated User: {user_id}, Role: {role}, Using: {'Token' if token else 'Universal Token'}")

        func_signature = inspect.signature(f).parameters
        if "role" in func_signature:
            return f(user_id, role, *args, **kwargs)
        return f(user_id, *args, **kwargs)

    return decorator



def generate_token(user):
    """Generate JWT token with user ID, session, and role."""
    token_payload = {
        "user_id": user.id,
        "session_id": user.session_id,
        "role": user.role,  # 🔥 MAKE SURE ROLE IS INCLUDED!
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }

    token = jwt.encode(token_payload, app.config["JWT_SECRET_KEY"], algorithm="HS256")
    print("✅ Generated Token Payload:", token_payload)  # Debugging log
    return token











# Dashboard route
@app.route('/dashboard', methods=['GET'])
@token_required
def dashboard(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    try:
        logger.debug('Fetching total number of books...')
        cursor.execute('SELECT COUNT(*) AS total FROM books')
        total_books = cursor.fetchone()
        total_books = total_books['total'] if total_books else 0

        logger.debug('Fetching total borrowed books for user...')
        cursor.execute('SELECT COUNT(*) AS total FROM borrowed_books WHERE user_id = %s', (user_id,))
        total_borrowed_books = cursor.fetchone()
        total_borrowed_books = total_borrowed_books['total'] if total_borrowed_books else 0

        logger.debug('Fetching borrowed books data...')
        cursor.execute('''
            SELECT b.title, b.author, bb.borrowed_date
            FROM borrowed_books bb
            JOIN books b ON bb.book_id = b.id
            WHERE bb.user_id = %s
        ''', (user_id,))
        borrowed_books = cursor.fetchall() or []  # ✅ Avoid None

        logger.debug('Fetching user role...')
        cursor.execute('SELECT role FROM users WHERE id = %s', (user_id,))
        role_data = cursor.fetchone()
        user_role = role_data['role'] if role_data else 'user'  # ✅ Default to 'user' if None

    except Exception as e:
        logger.error(f'❌ Error fetching dashboard data: {e}')
        return jsonify({'error': 'An error occurred while fetching dashboard data'}), 500

    finally:
        cursor.close()
        conn.close()

    dashboard_data = {
        'total_books': total_books,
        'total_borrowed_books': total_borrowed_books,
        'borrowed_books': borrowed_books,
        'user_role': user_role
    }

    logger.debug(f'✅ Dashboard JSON Response: {dashboard_data}')
    return jsonify(dashboard_data)



@app.route('/add_user', methods=['POST', 'OPTIONS'])
def add_user():
    if request.method == 'OPTIONS':
        return '', 204  # ✅ CORS preflight response

    if request.method == 'POST':
        # ✅ Ensure JSON content
        if request.content_type != 'application/json':
            return jsonify({"error": "Invalid Content-Type, expected application/json"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body!"}), 400

        # ✅ Extract user details
        full_name = data.get("full_name")
        username = data.get("username")
        password = data.get("password")
        email = data.get("email")
        mobile_number = data.get("mobile_number")
        country_code = data.get("country_code")
        role = data.get("role", "user")  # Default role

        if not all([full_name, username, password, email, mobile_number, country_code, role]):
            return jsonify({"error": "All fields are required!"}), 400

        # ✅ Hash the password
        hashed_password = generate_password_hash(password)

        # ✅ Insert user into DB
        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                '''INSERT INTO users (full_name, username, password, email, mobile_number, country_code, role)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)''',
                (full_name, username, hashed_password, email, mobile_number, country_code, role)
            )
            conn.commit()
            logger.info("✅ User added successfully!")
            return jsonify({"message": "User added successfully!"}), 201

        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Error adding user: {e}")
            return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()



# Delete User Route
@app.route('/delete_user', methods=['GET', 'DELETE'])
def delete_user():
    if 'role' not in session or session['role'] != 'admin':
        return jsonify({"error": "Access denied"}), 403  # ✅ Ensure JSON response

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        if request.method == 'DELETE':
            data = request.get_json()
            user_id = data.get("user_id")

            if not user_id:
                return jsonify({"error": "User ID is required"}), 400

            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()

            if not user:
                return jsonify({"error": "User not found"}), 404

            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            connection.commit()
            return jsonify({"message": "User deleted successfully!"}), 200

        # ✅ If GET, fetch users
        cursor.execute("SELECT id, username, full_name FROM users")
        users = cursor.fetchall()
        
        return jsonify({"users": users}), 200  

    except Exception as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        connection.close()





# viewing profile route
@app.route('/api/profile', methods=['GET'])
@token_required
def profile(user_id):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)  # Return results as dictionary
    cursor.execute('SELECT id, username, email, full_name, sex, mobile_number, country_code, created_at FROM users WHERE id = %s',
                   (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({'user': user}), 200



# ✅ Route to Fetch Users
@app.route('/view_users', methods=['GET'])
def view_users_roster():
    try:
        db = get_db_connection()
        cursor = db.cursor()

        # ✅ Fetch real users from the database
        cursor.execute("SELECT id, username, full_name, email, mobile_number, country_code, role FROM users")
        users_data = cursor.fetchall()

        # ✅ Extract column names
        columns = [desc[0] for desc in cursor.description]

        print("\n📢 DEBUG: Raw Data from DB (Tuple Format):", users_data)
        print("\n📢 DEBUG: Column Names:", columns)

        # ✅ Fix: Directly use fetched rows (no manual mapping needed)
        users = list(users_data)

        print("\n✅ DEBUG: Processed Users Data (Before Sending):", users)

        cursor.close()
        db.close()

        return jsonify({"users": users}), 200

    except mysql.connector.Error as e:
        print("❌ Database Error:", str(e))
        return jsonify({"error": "Database error occurred", "details": str(e)}), 500
    except Exception as e:
        print("❌ Internal Server Error:", str(e))
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500






# updating profile route
@app.route('/update_profile', methods=['POST'])
@token_required
def update_profile(user_id):
    # Retrieve JSON data
    data = request.get_json()

    # Validate data
    if not data or not all(key in data for key in ["full_name", "sex", "mobile_number", "country_code", "email"]):
        return jsonify({'message': 'Missing required fields'}), 400

    full_name = data["full_name"]
    sex = data["sex"]
    mobile_number = data["mobile_number"]
    country_code = data["country_code"]
    email = data["email"]

    conn = get_db()
    cursor = conn.cursor()
    try:
        # Begin transaction
        conn.start_transaction()

        cursor.execute('''
            UPDATE users
            SET full_name = %s, sex = %s, mobile_number = %s, country_code = %s, email = %s
            WHERE id = %s
        ''', (full_name, sex, mobile_number, country_code, email, user_id))

        # Commit transaction
        conn.commit()
    except mysql.connector.Error as e:
        conn.rollback()
        return jsonify({'message': f'Error occurred: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({'message': 'Profile updated successfully'}), 200



# deleting profile route
@app.route('/profile/delete', methods=['POST'])
@token_required
def delete_profile(user_id):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Begin transaction
        conn.start_transaction()

        cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))

        # Commit transaction
        conn.commit()
    except mysql.connector.Error as e:
        conn.rollback()
        return jsonify({'message': f'Error occurred: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

    # Log out user after deletion
    session.clear()
    response = make_response(redirect(url_for('home')))
    response.delete_cookie('token')
    response.delete_cookie('universal_token')

    return response


@app.route('/logout', methods=['POST'])
@token_required
def logout(user_id):
    session_id = session.get('session_id')
    if session_id:
        redis_store.delete(session_id)  # Delete token from Redis
    session.clear()  # Clear the session
    
    response = make_response(jsonify({'message': 'Logged out successfully'}))
    response.delete_cookie('token')  # Delete session token cookie
    response.delete_cookie('universal_token')  # Delete universal token cookie
    return response


# library app routes

# library home page route
@app.route('/library', methods=['GET'])
@token_required
def library(user_id):
    try:
        conn = get_db_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # Fetch total number of books
            cursor.execute("SELECT COUNT(*) AS book_count FROM books")
            result = cursor.fetchone()
            book_count = result['book_count'] if result else 0
            logger.info(f"Total number of books: {book_count}")

            # Fetch borrowed books for the user
            cursor.execute('''
                SELECT b.id AS book_id, b.title, b.author, bb.borrowed_date, bb.due_date
                FROM borrowed_books bb
                JOIN books b ON bb.book_id = b.id
                WHERE bb.user_id = %s
            ''', (user_id,))
            borrowed_books = cursor.fetchall()

            # Fetch username and role
            cursor.execute("SELECT username, role FROM users WHERE id = %s", (user_id,))
            user_result = cursor.fetchone()
            username = user_result['username'] if user_result else 'Guest'
            role = user_result['role'] if user_result else 'user'

            # Fine calculation settings
            fine_per_day = 10
            current_date = datetime.now().date()

            # Process overdue books
            for book in borrowed_books:
                borrowed_date = book['borrowed_date']
                due_date = book['due_date']

                # ✅ Handle `None` values safely
                if not due_date:
                    book['overdue_days'] = 0
                    book['fine'] = 0
                    continue

                # ✅ Ensure `due_date` is converted to `date` type
                if isinstance(due_date, datetime):
                    due_date = due_date.date()  # Convert `datetime.datetime` to `datetime.date`

                overdue_days = max(0, (current_date - due_date).days)
                fine = overdue_days * fine_per_day

                book['overdue_days'] = overdue_days
                book['fine'] = fine

    except Exception as e:
        logger.error(f"🔥 Error in /library route: {str(e)}", exc_info=True)
        return jsonify({'message': 'Internal Server Error', 'error': str(e)}), 500

    finally:
        conn.close()

    return jsonify({
        "book_count": book_count,
        "borrowed_books": borrowed_books,
        "user_id": user_id,
        "username": username,
        "role": role
    })






@app.route('/book/<int:book_id>', methods=['GET'])
@token_required
def book(book_id):
    try:
        conn = get_db()
        cursor = conn.cursor()

        # Fetch book details including image filename
        cursor.execute('SELECT title, author, image FROM books WHERE id = %s', (book_id,))
        book = cursor.fetchone()

        cursor.close()
        conn.close()

        if book:
            title, author, image_filename = book
            
            # Generate image URL
            image_url = url_for('serve_image', filename=image_filename, _external=True)

            logger.info(f"Book found: {title}, {author}, Image: {image_url}")
            return jsonify({
                'title': title,
                'author': author,
                'image_url': image_url
            }), 200
        
        logger.warning(f"Book not found for book_id: {book_id}")
        return jsonify({'message': 'Book not found'}), 404

    except Exception as e:
        logger.error(f"An error occurred while fetching book data: {e}")
        return jsonify({'message': 'Internal Server Error', 'error': str(e)}), 500



@app.route('/book_master', methods=['GET'])
@token_required
def book_master(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)  # Ensure dictionary format

    try:
        query = '''
            SELECT b.title, b.author,
                   COUNT(i.id) AS total_copies,
                   SUM(CASE WHEN i.status = 'available' THEN 1 ELSE 0 END) AS available_copies
            FROM books b
            LEFT JOIN inventory i ON b.id = i.book_id
            GROUP BY b.title, b.author
        '''
        cursor.execute(query)
        books = cursor.fetchall()

    except Exception as e:
        return jsonify({'message': 'Internal Server Error', 'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()

    return jsonify({'books': books})  # ✅ Return JSON instead of rendering HTML



# Add Books Route
@app.route('/add_books', methods=['POST'])
def add_books():
    role = session.get('role')
    if role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    # 🔍 DEBUG: Check if file is being received
    if 'excel_file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    excel_file = request.files['excel_file']
    
    if excel_file.filename == '':
        return jsonify({"error": "Empty file uploaded"}), 400

    try:
        df = pd.read_excel(excel_file)
        required_columns = ['title', 'author', 'image', 'total_copies']
        
        # 🔍 DEBUG: Print file columns
        print("Excel Columns:", df.columns)

        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": "Invalid columns"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        for _, row in df.iterrows():
            title, author, image, total_copies = row['title'], row['author'], row['image'], row['total_copies']
            cursor.execute(
                'INSERT INTO books (title, author, image, total_copies, available_copies) VALUES (%s, %s, %s, %s, %s)',
                (title, author, image, total_copies, total_copies)
            )

        conn.commit()

        return jsonify({"message": "Books added successfully"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ ERROR:", str(e))  # 🔍 Debugging
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()




# 📌 Handle CORS Preflight Requests
# Serve image from static folder
@app.route('/static/images/<filename>')
def serve_image(filename):
    logger.debug(f"🔍 Requested filename: {filename}")  # Debugging output

    # Secure file path
    image_path = os.path.join("static/images", filename)

    # Check if file exists
    if not os.path.exists(image_path):
        logger.error(f"⚠️ Image NOT FOUND: {image_path}")  # Debugging output
        abort(404)  # Return 404 if the file is missing

    # Guess MIME type
    mimetype, _ = mimetypes.guess_type(image_path)
    if not mimetype:
        mimetype = "application/octet-stream"

    # Send file with correct MIME type and prevent caching
    response = send_file(image_path, mimetype=mimetype)
    response.headers["Content-Type"] = mimetype
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    return response

# 📌 Main /view_books Route
@app.route("/view_books", methods=["GET"])
@token_required  # Ensure authentication
def view_books(user_id):
    search_query = request.args.get('search', '')

    connection = None
    cursor = None
    try:
        connection = get_db()  # Use shared DB connection
        cursor = connection.cursor(dictionary=True)

        # Check if the user is an admin
        role = session.get("role")  # ✅ Fetch role from session
        is_admin = (role == "admin")  # Convert to boolean

        # Query books from the database
        sql_query = """
        SELECT 
            id AS book_id,
            title,
            author,
            total_copies,
            available_copies
        FROM books
        WHERE title LIKE %s OR author LIKE %s
        ORDER BY id;
        """
        
        cursor.execute(sql_query, ('%' + search_query + '%', '%' + search_query + '%'))
        books = cursor.fetchall()

    except Exception as e:
        logger.error(f"Database error: {e}")
        return jsonify({"message": "Error fetching books", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

    # Image handling
    static_folder = os.path.join(os.getcwd(), "static/images")

    for book in books:
        original_title = book["title"].strip().lower()

        # Normalize filename: Replace special chars, keep lowercase
        base_filename = re.sub(r"[^\w]+", "_", original_title)
        base_filename = base_filename.replace("_s_", "s_")  # Fix possessives like "smuggler_s_"

        # 🛠️ Fix: Specific book title corrections
        if original_title == "diary of a wimpy kid: diary of a wimpy kid":
            base_filename = "diary_of_a_wimpy_kid"
        base_filename = base_filename.replace("thid_wheel", "third_wheel")
        base_filename = base_filename.replace("demon_s_rocks", "demons_rocks")

        image_url = url_for("static", filename="images/default.jpg", _external=True)  # Default image

        for ext in ["jpg", "jpeg", "png", "webp"]:
            formatted_title = f"{base_filename}.{ext}"
            image_path = os.path.join(static_folder, formatted_title)

            if os.path.exists(image_path):
                image_url = url_for("static", filename=f"images/{formatted_title}", _external=True)
                break

        book["image_url"] = image_url

    return jsonify({
        "books": books,
        "is_admin": is_admin  # ✅ Include admin status in response
    }), 200







# Deleting books route
@app.route('/delete_books', methods=['POST'])
@token_required
def delete_books(user_id):
    role = session.get('role')

    # Only admins are allowed to delete books
    if role != 'admin':
        return jsonify({"error": "You do not have permission to delete books."}), 403

    # Get selected book IDs from JSON request
    data = request.json
    book_ids = data.get('book_ids', [])

    if not book_ids:
        return jsonify({"error": "No books selected for deletion."}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        deleted_books = []
        for book_id in book_ids:
            if not isinstance(book_id, int):
                continue

            # Check the book in the database
            cursor.execute('SELECT available_copies, total_copies FROM books WHERE id = %s', (book_id,))
            book = cursor.fetchone()

            if book:
                available_copies = book['available_copies']
                total_copies = book['total_copies']

                # Decrement available copies if possible
                if available_copies > 0:
                    new_available_copies = available_copies - 1
                    cursor.execute('UPDATE books SET available_copies = %s WHERE id = %s', (new_available_copies, book_id))

                    # If no copies remain, delete from inventory & books table
                    if new_available_copies == 0 and total_copies == 1:
                        cursor.execute('DELETE FROM inventory WHERE book_id = %s', (book_id,))
                        cursor.execute('DELETE FROM books WHERE id = %s', (book_id,))

                    conn.commit()
                    deleted_books.append(book_id)

        return jsonify({"message": "Selected books deleted successfully.", "deleted_books": deleted_books}), 200

    except pymysql.MySQLError as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()




def is_book_available(book_id):
    """Check if the book is available."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT available FROM books WHERE id = %s", (book_id,))
            result = cursor.fetchone()
            if result:
                return result['available']
            return False
    except Exception as e:
        logger.error(f"An error occurred while checking availability: {e}")
        return False
    
@app.route('/validate-user', methods=['GET'])
@cross_origin(origin="http://127.0.0.1:5173", supports_credentials=True)
@token_required
def validate_user(user_id):  # ✅ Accept user_id
    user_input = request.args.get("user_input", "").strip()

    if not user_input:
        return jsonify({"error": "User ID or Username is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE id = %s OR username = %s", (user_input, user_input))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({"user_id": user["id"]}), 200


# Borrowing books route
@app.route('/borrow', methods=['GET', 'POST', 'OPTIONS'])
@token_required
def borrow_books(user_id):
    search_query = request.args.get('search', '').strip()
    role = session.get('role')  # Fetch user role from session

    conn = get_db_connection()
    cursor = conn.cursor()

    # ✅ Handle CORS preflight request
    if request.method == 'OPTIONS':
        return jsonify({"message": "CORS preflight OK"}), 204

    if request.method == 'POST':
        try:
            data = request.get_json()
            book_ids = data.get("book_ids", [])
            request_user_id = data.get("user_id")  # User ID or username from request

            if role == 'admin':
                if not request_user_id:
                    return jsonify({"error": "Admins must provide a valid user ID or username."}), 400
                
                # 🔍 Validate user ID or username
                cursor.execute("SELECT id FROM users WHERE id = %s OR username = %s", 
                               (request_user_id, request_user_id))
                user_record = cursor.fetchone()

                if not user_record:
                    return jsonify({"error": "User not found. Please enter a valid user ID or username."}), 400

                target_user_id = user_record["id"]
            else:
                target_user_id = user_id  # Regular users borrow for themselves

            if not book_ids or not all(isinstance(book_id, int) for book_id in book_ids):
                return jsonify({"error": "Invalid book ID(s)."}), 400

            borrowed_books = []
            for book_id in book_ids:
                cursor.execute("""
                    SELECT COUNT(*) AS borrow_count 
                    FROM borrowed_books 
                    WHERE book_id = %s AND user_id = %s
                """, (book_id, target_user_id))
                borrow_count = cursor.fetchone()["borrow_count"]

                if borrow_count >= 1:
                    return jsonify({"error": f"Book ID {book_id} is already borrowed by this user."}), 400

                cursor.execute("""
                    SELECT COUNT(*) AS available_copies
                    FROM inventory
                    WHERE book_id = %s AND status = 'available'
                """, (book_id,))
                available_copies = cursor.fetchone()["available_copies"]

                if available_copies < 1:
                    return jsonify({"error": f"No available copies of Book ID {book_id}."}), 400

                borrowed_date = datetime.now()
                due_date = borrowed_date + timedelta(days=14)

                cursor.execute("""
                    INSERT INTO borrowed_books (user_id, book_id, borrowed_date, due_date)
                    VALUES (%s, %s, %s, %s)
                """, (target_user_id, book_id, borrowed_date, due_date))

                cursor.execute("""
                    UPDATE inventory
                    SET status = 'borrowed'
                    WHERE book_id = %s AND status = 'available'
                    ORDER BY id ASC 
                    LIMIT 1
                """, (book_id,))

                cursor.execute("""
                    UPDATE books
                    SET available_copies = GREATEST(available_copies - 1, 0)
                    WHERE id = %s
                """, (book_id,))

                borrowed_books.append({
                    "book_id": book_id, 
                    "user_id": target_user_id,
                    "borrowed_date": str(borrowed_date), 
                    "due_date": str(due_date)
                })

            conn.commit()
            return jsonify({"message": "Books borrowed successfully!", "borrowed_books": borrowed_books}), 200

        except pymysql.MySQLError as e:
            conn.rollback()
            return jsonify({"error": f"Database error: {e}"}), 500

        finally:
            cursor.close()
            conn.close()

    else:  # **GET REQUEST TO FETCH BOOKS**
        try:
            if search_query:
                query = """
                    SELECT 
                        b.id, b.title, b.author, 
                        CONCAT('/static/images/', b.image) AS image, 
                        COALESCE(COUNT(i.id), 0) AS total_copies,
                        COALESCE(SUM(CASE WHEN i.status = 'available' THEN 1 ELSE 0 END), 0) AS available_copies
                    FROM books b
                    LEFT JOIN inventory i ON b.id = i.book_id
                    WHERE b.title LIKE %s OR b.author LIKE %s
                    GROUP BY b.id, b.title, b.author, b.image
                    ORDER BY b.id;
                """
                cursor.execute(query, (f"%{search_query}%", f"%{search_query}%"))
            else:
                query = """
                    SELECT 
                        b.id, b.title, b.author, 
                        CONCAT('/static/images/', b.image) AS image, 
                        COALESCE(COUNT(i.id), 0) AS total_copies,
                        COALESCE(SUM(CASE WHEN i.status = 'available' THEN 1 ELSE 0 END), 0) AS available_copies
                    FROM books b
                    LEFT JOIN inventory i ON b.id = i.book_id
                    GROUP BY b.id, b.title, b.author, b.image
                    ORDER BY b.id;
                """
                cursor.execute(query)

            books = cursor.fetchall()
            return jsonify({"books": books}), 200

        except pymysql.MySQLError as e:
            return jsonify({"error": f"Database error: {e}"}), 500

        finally:
            cursor.close()
            conn.close()








# View borrowed books route
@app.route("/view_borrowed_books", methods=["GET"])
@token_required
def view_borrowed_books(user_id):
    print("🔹 Request Headers:", request.headers)
    print("🔹 Extracted User ID:", user_id)

    borrowed_books = []
    book_title = request.args.get("book_title", "").strip()
    search_user_id = request.args.get("user_id", "").strip()

    try:
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                user = cursor.fetchone()
                if not user:
                    return jsonify({"error": "User not found"}), 404
                
                role = user["role"]

                extra_column = ", u.username" if role == "admin" else ""
                join_users = "JOIN users u ON bb.user_id = u.id" if role == "admin" else ""
                condition = "WHERE bb.user_id = %s" if role != "admin" else "WHERE 1=1"
                params = [user_id] if role != "admin" else []

                if book_title:
                    condition += " AND b.title LIKE %s"
                    params.append(f"%{book_title}%")
                
                if role == "admin" and search_user_id:
                    condition += " AND bb.user_id = %s"
                    params.append(search_user_id)
                
                query = f'''
                    SELECT b.id AS book_id, b.title, b.author, bb.borrowed_date, bb.due_date
                    {extra_column}
                    FROM borrowed_books bb
                    JOIN books b ON bb.book_id = b.id
                    {join_users}
                    {condition}
                '''
                
                cursor.execute(query, tuple(params))
                borrowed_books = cursor.fetchall()
                
                for book in borrowed_books:
                    book["borrowed_date"] = book["borrowed_date"].strftime("%Y-%m-%d") if book["borrowed_date"] else None
                    book["due_date"] = book["due_date"].strftime("%Y-%m-%d") if book["due_date"] else None

                print(f"✅ Borrowed books fetched for user_id {user_id}: {borrowed_books}")

    except pymysql.MySQLError as e:
        print(f"❌ Database error: {e}")
        return jsonify({"error": "Database error", "message": str(e)}), 500

    return jsonify({
        "borrowed_books": borrowed_books,
        "role": role,
        "user_id": user_id
    })



@app.route('/return_books', methods=['GET', 'POST', 'OPTIONS'])
@token_required
def return_books(user_id, role):
    print(f"🔹 User ID: {user_id}, Role: {role}")  # Debugging log
    conn = None
    cursor = None

    # 📌 Handle Preflight Request (OPTIONS)
    if request.method == 'OPTIONS':
        response = jsonify({"message": "CORS preflight OK"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type")
        return response

    # 📌 Handle Book Return (POST Request)
    if request.method == 'POST':
        data = request.json
        book_ids = data.get('book_ids', [])

        if not book_ids:
            return jsonify({"error": "No books selected"}), 400

        # ✅ Admin can specify `user_id`, regular users return only their books
        user_ids = data.get('user_ids', []) if role == 'admin' else [user_id] * len(book_ids)

        if role == 'admin' and len(user_ids) != len(book_ids):
            return jsonify({"error": "Admin must provide user_id for each book"}), 400

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            for i in range(len(book_ids)):
                book_id = book_ids[i]
                target_user_id = user_ids[i]

                # ✅ Check if book exists in borrowed records
                cursor.execute(
                    'SELECT id FROM borrowed_books WHERE book_id = %s AND user_id = %s',
                    (book_id, target_user_id)
                )
                borrowed_book = cursor.fetchone()

                if not borrowed_book:
                    return jsonify({"error": f"Book {book_id} not found for user {target_user_id}"}), 400

                # ✅ Delete from borrowed_books
                cursor.execute(
                    'DELETE FROM borrowed_books WHERE book_id = %s AND user_id = %s',
                    (book_id, target_user_id)
                )

                # ✅ Update inventory status
                cursor.execute(
                    'UPDATE inventory SET status = "available" WHERE book_id = %s',
                    (book_id,)
                )

                # ✅ Update available copies in books table
                cursor.execute(
                    'UPDATE books SET available_copies = available_copies + 1 WHERE id = %s',
                    (book_id,)
                )

            conn.commit()
            return jsonify({"message": "Books returned successfully"}), 200

        except pymysql.MySQLError as e:
            conn.rollback()
            return jsonify({"error": f"Database error: {str(e)}"}), 500

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    # 📌 Fetch Borrowed Books (Admin & User)
    try:
        conn = get_db_connection()
        cursor = conn.cursor(DictCursor)  # ✅ Uses DictCursor

        if role == 'admin':
            cursor.execute('''
                SELECT bb.book_id, b.title, b.author, bb.borrowed_date, bb.due_date, 
                       u.username, u.id AS user_id
                FROM borrowed_books bb
                JOIN books b ON bb.book_id = b.id
                JOIN users u ON bb.user_id = u.id
                ORDER BY u.username, bb.due_date
            ''')
        else:
            cursor.execute('''
                SELECT bb.book_id, b.title, b.author, bb.borrowed_date, bb.due_date
                FROM borrowed_books bb
                JOIN books b ON bb.book_id = b.id
                WHERE bb.user_id = %s
                ORDER BY bb.due_date
            ''', (user_id,))

        borrowed_books = cursor.fetchall()

        # ✅ Use dictionary format
        borrowed_books_list = []
        for record in borrowed_books:
            book_id = record["book_id"]
            title = record["title"]
            author = record["author"]
            borrowed_date = str(record["borrowed_date"])
            due_date = str(record["due_date"])

            if role == 'admin':
                username = record["username"]
                user_id = record["user_id"]
                borrowed_books_list.append({
                    "book_id": book_id,
                    "title": title,
                    "author": author,
                    "borrowed_date": borrowed_date,
                    "due_date": due_date,
                    "username": username,
                    "user_id": user_id
                })
            else:
                borrowed_books_list.append({
                    "book_id": book_id,
                    "title": title,
                    "author": author,
                    "borrowed_date": borrowed_date,
                    "due_date": due_date
                })

        # ✅ Always return an array (even if empty)
        return jsonify({"borrowed_books": borrowed_books_list}), 200

    except pymysql.MySQLError as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()













def is_complex_password(password):
    # Example password complexity rules
    if len(password) < 8:
        return False
    if not any(char.isupper() for char in password):
        return False
    if not any(char.islower() for char in password):
        return False
    if not any(char.isdigit() for char in password):
        return False
    if not any(char in "!@#$%^&*()_+-=[]{}|;:,.<>?/~" for char in password):
        return False
    return True


if __name__ == '__main__':
    init_db()
    app.run('host=0.0.0.0', port=5000, debug=True, threaded=True)