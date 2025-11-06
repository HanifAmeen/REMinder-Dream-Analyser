from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import json

# --- AI analysis utilities ---
from utils.analyzer import analyze_dream

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# --- Database setup ---
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dreams.db")
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Dream model ---
class Dream(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    mood = db.Column(db.String(50))
    summary = db.Column(db.Text)
    themes = db.Column(db.Text)
    symbols = db.Column(db.Text)  # JSON string

# Initialize DB
with app.app_context():
    # Ensure DB exists; no automatic deletion to avoid Windows file lock issues
    db.create_all()

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_dream', methods=['POST'])
def add_dream():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    mood = data.get('mood', '')

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    # --- Fetch previous dreams for context if needed ---
    previous_dreams = [d.content for d in Dream.query.all()]

    # --- AI analysis ---
    try:
        analysis = analyze_dream(content, previous_dreams=previous_dreams)
        summary = analysis.get("summary", "")
        emotions = analysis.get("emotions", {})
        dominant_emotion = emotions.get("dominant", mood)
        themes = ", ".join(analysis.get("themes", []))
        symbols = analysis.get("symbols", [])
    except Exception as e:
        print("AI analysis failed:", e)
        summary = ""
        dominant_emotion = mood
        themes = ""
        symbols = []

    # --- Save dream ---
    new_dream = Dream(
        title=title,
        content=content,
        mood=dominant_emotion,
        summary=summary,
        themes=themes,
        symbols=json.dumps(symbols)
    )
    db.session.add(new_dream)
    db.session.commit()
    print("Dream saved with symbols:", symbols)

    return jsonify({"message": "Dream added successfully"}), 201

@app.route('/get_dreams', methods=['GET'])
def get_dreams():
    dreams = Dream.query.order_by(Dream.date.desc()).all()
    result = []

    for d in dreams:
        try:
            symbols = json.loads(d.symbols) if d.symbols else []
        except Exception as e:
            print("Error loading symbols:", e)
            symbols = []

        result.append({
            "id": d.id,
            "title": d.title,
            "content": d.content,
            "mood": d.mood,
            "themes": d.themes,
            "summary": d.summary,
            "symbols": symbols,
            "date": d.date.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify(result)

@app.route('/delete_dream/<int:id>', methods=['DELETE'])
def delete_dream(id):
    dream = Dream.query.get_or_404(id)
    db.session.delete(dream)
    db.session.commit()
    return jsonify({"message": "Dream deleted successfully"})

if __name__ == '__main__':
    # Flask app ready to run without deleting DB automatically
    app.run(debug=True)
