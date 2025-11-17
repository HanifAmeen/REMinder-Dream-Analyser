from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import json
import traceback
import jwt
import bcrypt
from functools import wraps

# --- AI analysis utilities ---
from utils.analyzer import analyze_dream

# ---------------------------------------
# CONFIG
# ---------------------------------------
SECRET_KEY = "supersecretkey123"   # Change later!

app = Flask(__name__)
CORS(app)

# Database setup
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dreams.db")
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# ---------------------------------------
# USER MODEL
# ---------------------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ---------------------------------------
# DREAM MODEL
# ---------------------------------------
class Dream(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    mood = db.Column(db.String(50))
    summary = db.Column(db.Text)
    themes = db.Column(db.Text)
    symbols = db.Column(db.Text)
    combined_insights = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)


# Create database
with app.app_context():
    db.create_all()


# ---------------------------------------
# AUTH DECORATOR (NOT ENABLED YET)
# ---------------------------------------
def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):

        # TEMPORARY BYPASS FOR DEVELOPMENT
        request.user_id = 1
        return f(*args, **kwargs)

        """
        # REAL AUTH (ENABLE LATER)
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Missing token"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_id = data["user_id"]
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401
        return f(*args, **kwargs)
        """

    return wrapper


# ---------------------------------------
# AUTH ROUTES (Not required for now)
# ---------------------------------------
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not email or not username or not password:
        return jsonify({"error": "All fields required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    new_user = User(email=email, username=username, password_hash=hashed)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"})


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode(
        {"user_id": user.id},
        SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({"token": token})


# ---------------------------------------
# ROUTES — TEMPORARILY USING user_id=1
# ---------------------------------------
@app.route('/add_dream', methods=['POST'])
@require_auth
def add_dream():
    data = request.get_json() or {}
    title = data.get('title')
    content = data.get('content')
    mood_input = data.get('mood', '')

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    # Get only this user's previous dreams
    previous_dreams = []
    try:
        all_dreams = Dream.query.filter_by(user_id=request.user_id).order_by(Dream.date.desc()).all()
        for d in all_dreams:
            try:
                prev_symbols = json.loads(d.symbols) if d.symbols else []
            except:
                prev_symbols = []
            previous_dreams.append({
                "content": d.content,
                "symbols": prev_symbols
            })
    except:
        previous_dreams = []

    # Analyze dream
    try:
        analysis = analyze_dream(content, previous_dreams=previous_dreams) or {}
    except Exception as e:
        traceback.print_exc()
        analysis = {}

    summary = analysis.get("summary", "")
    emotions = analysis.get("emotions", {})
    dominant_emotion = emotions.get("dominant", mood_input)
    themes_list = analysis.get("themes", [])
    symbols_list = analysis.get("symbols", [])
    combined_insights = analysis.get("combined_insights", [])

    # Save dream
    try:
        new_dream = Dream(
            title=title,
            content=content,
            mood=dominant_emotion,
            summary=summary,
            themes=json.dumps(themes_list),
            symbols=json.dumps(symbols_list),
            combined_insights=json.dumps(combined_insights),
            user_id=request.user_id  # TEMPORARY FIX
        )
        db.session.add(new_dream)
        db.session.commit()
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Failed to save dream"}), 500

    return jsonify({
        "message": "Dream added successfully",
        "summary": summary,
        "emotions": emotions,
        "themes": themes_list,
        "symbols": symbols_list,
        "combined_insights": combined_insights
    })


@app.route('/get_dreams', methods=['GET'])
@require_auth
def get_dreams():
    dreams = Dream.query.filter_by(user_id=request.user_id).order_by(Dream.date.desc()).all()

    result = []
    for d in dreams:
        try:
            symbols = json.loads(d.symbols) if d.symbols else []
            combined_insights = json.loads(d.combined_insights) if d.combined_insights else []
            themes = json.loads(d.themes) if d.themes else []
        except:
            symbols, combined_insights, themes = [], [], []

        result.append({
            "id": d.id,
            "title": d.title,
            "content": d.content,
            "mood": d.mood,
            "themes": themes,
            "summary": d.summary,
            "symbols": symbols,
            "combined_insights": combined_insights,
            "date": d.date.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify(result)


@app.route('/delete_dream/<int:id>', methods=['DELETE'])
@require_auth
def delete_dream(id):
    dream = Dream.query.get_or_404(id)
    if dream.user_id != request.user_id:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(dream)
    db.session.commit()
    return jsonify({"message": "Dream deleted successfully"})


if __name__ == '__main__':
    app.run(debug=True, threaded=True)
