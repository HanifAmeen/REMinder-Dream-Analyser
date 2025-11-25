# app.py (UPDATED FOR SYMBOL BUCKETS)
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import bcrypt
from functools import wraps
import traceback
import json
import os

# --- AI analysis utilities ---
from utils.analyzer_upgraded import analyze_dream

# ---------------------------------------
# CONFIG
# ---------------------------------------
SECRET_KEY = "CHANGE_THIS_TO_A_RANDOM_SECRET"

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

    # Structured fields
    events = db.Column(db.Text, nullable=True)
    entities = db.Column(db.Text, nullable=True)
    people = db.Column(db.Text, nullable=True)
    locations = db.Column(db.Text, nullable=True)
    objects = db.Column(db.Text, nullable=True)
    cause_effect = db.Column(db.Text, nullable=True)
    conflicts = db.Column(db.Text, nullable=True)
    desires = db.Column(db.Text, nullable=True)
    emotional_arc = db.Column(db.Text, nullable=True)
    narrative = db.Column(db.Text, nullable=True)
    analysis_version = db.Column(db.String(80), nullable=True)


with app.app_context():
    db.create_all()


# ---------------------------------------
# JWT HELPERS
# ---------------------------------------
def make_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token.decode("utf-8") if isinstance(token, bytes) else token


def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])["user_id"]
    except Exception:
        return None


def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Missing token"}), 401

        token = header.split(" ", 1)[1].strip()
        user_id = decode_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        request.user_id = user_id
        return f(*args, **kwargs)
    return wrapper


# ---------------------------------------
# AUTH ROUTES
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
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(email=email, username=username, password_hash=hashed)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User created"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    token = make_token(user.id)

    return jsonify({
        "token": token,
        "user": {"id": user.id, "email": user.email, "username": user.username}
    })


# ---------------------------------------
# MAIN ROUTES
# ---------------------------------------
@app.route('/')
def index():
    return "Dream Journal Backend Running"


@app.route('/add_dream', methods=['POST'])
@auth_required
def add_dream():
    data = request.get_json() or {}

    title = data.get('title')
    content = data.get('content')
    mood_input = data.get('mood', '')

    if not title or not content:
        return jsonify({"error": "Title and content required"}), 400

    # previous dreams for recurrence detection
    previous = []
    for d in Dream.query.filter_by(user_id=request.user_id).all():
        try:
            prev_symbols = json.loads(d.symbols) if d.symbols else []
        except:
            prev_symbols = []
        previous.append({"content": d.content, "symbols": prev_symbols})

    # run analyzer
    try:
        analysis = analyze_dream(content, previous_dreams=previous)
    except Exception:
        traceback.print_exc()
        analysis = {}

    # --------------------------
    # Pull analysis fields
    # --------------------------
    summary = analysis.get("summary", "")
    emotions = analysis.get("emotions", {})
    dominant_emotion = emotions.get("dominant", mood_input)
    themes_list = analysis.get("themes", [])
    symbols_list = analysis.get("symbols", [])

    # NEW BUCKETS
    symbols_primary = analysis.get("symbols_primary", [])
    symbols_secondary = analysis.get("symbols_secondary", [])
    symbols_noise = analysis.get("symbols_noise", [])

    combined_insights_list = analysis.get("combined_insights", [])

    # structured fields
    events = analysis.get("events", [])
    entities = analysis.get("entities", [])
    people = analysis.get("people", [])
    locations = analysis.get("locations", [])
    objects = analysis.get("objects", [])
    cause_effect = analysis.get("cause_effect", [])
    conflicts = analysis.get("conflicts", [])
    desires = analysis.get("desires", [])
    emotional_arc = analysis.get("emotional_arc", {})
    narrative = analysis.get("narrative", {})
    analysis_version = analysis.get("analysis_version", "analyzer_upgraded_v2")

    # --------------------------
    # Save dream
    # --------------------------
    dream = Dream(
        title=title,
        content=content,
        mood=dominant_emotion,
        summary=summary,
        themes=json.dumps(themes_list),
        symbols=json.dumps(symbols_list),  # keep main list
        combined_insights=json.dumps(combined_insights_list),
        user_id=request.user_id,

        # structured fields
        events=json.dumps(events),
        entities=json.dumps(entities),
        people=json.dumps(people),
        locations=json.dumps(locations),
        objects=json.dumps(objects),
        cause_effect=json.dumps(cause_effect),
        conflicts=json.dumps(conflicts),
        desires=json.dumps(desires),
        emotional_arc=json.dumps(emotional_arc),
        narrative=json.dumps(narrative),
        analysis_version=analysis_version
    )

    db.session.add(dream)
    db.session.commit()

    # --------------------------
    # Return API response (NOW INCLUDES BUCKETS)
    # --------------------------
    return jsonify({
        "message": "Dream saved",
        "summary": summary,
        "emotions": emotions,
        "themes": themes_list,

        # symbols
        "symbols": symbols_list,
        "symbols_primary": symbols_primary,
        "symbols_secondary": symbols_secondary,
        "symbols_noise": symbols_noise,

        "combined_insights": combined_insights_list,

        # structured
        "events": events,
        "entities": entities,
        "people": people,
        "locations": locations,
        "objects": objects,
        "cause_effect": cause_effect,
        "conflicts": conflicts,
        "desires": desires,
        "emotional_arc": emotional_arc,
        "narrative": narrative,

        "analysis_version": analysis_version
    })


@app.route('/get_dreams', methods=['GET'])
@auth_required
def get_dreams():
    dreams = Dream.query.filter_by(user_id=request.user_id).order_by(Dream.date.desc()).all()
    result = []

    for d in dreams:
        # legacy fields
        try:
            symbols = json.loads(d.symbols) if d.symbols else []
            insights = json.loads(d.combined_insights) if d.combined_insights else []
            themes = json.loads(d.themes) if d.themes else []
        except:
            symbols, insights, themes = [], [], []

        # structured
        def safe_json(txt):
            try: return json.loads(txt) if txt else None
            except: return None

        events = safe_json(d.events) or []
        entities = safe_json(d.entities) or []
        people = safe_json(d.people) or []
        locations = safe_json(d.locations) or []
        objects = safe_json(d.objects) or []
        cause_effect = safe_json(d.cause_effect) or []
        conflicts = safe_json(d.conflicts) or []
        desires = safe_json(d.desires) or []
        emotional_arc = safe_json(d.emotional_arc) or {}
        narrative = safe_json(d.narrative) or {}
        analysis_version = d.analysis_version

        # IMPORTANT:
        # Older dreams will NOT have bucket fields saved.
        # We recompute them from ranked symbols on frontend OR leave empty.
        # For now we return empty arrays for old dreams.
        symbols_primary = []
        symbols_secondary = []
        symbols_noise = []

        result.append({
            "id": d.id,
            "title": d.title,
            "content": d.content,
            "mood": d.mood,
            "summary": d.summary,
            "themes": themes,

            "symbols": symbols,
            "symbols_primary": symbols_primary,
            "symbols_secondary": symbols_secondary,
            "symbols_noise": symbols_noise,

            "combined_insights": insights,
            "date": d.date.strftime("%Y-%m-%d %H:%M:%S"),

            "events": events,
            "entities": entities,
            "people": people,
            "locations": locations,
            "objects": objects,
            "cause_effect": cause_effect,
            "conflicts": conflicts,
            "desires": desires,
            "emotional_arc": emotional_arc,
            "narrative": narrative,
            "analysis_version": analysis_version
        })

    return jsonify(result)


@app.route('/delete_dream/<int:id>', methods=['DELETE'])
@auth_required
def delete_dream(id):
    dream = Dream.query.get_or_404(id)
    if dream.user_id != request.user_id:
        return jsonify({"error": "Unauthorized"}), 403
    db.session.delete(dream)
    db.session.commit()
    return jsonify({"message": "Dream deleted"})


if __name__ == '__main__':
    app.run(debug=True, threaded=True)
