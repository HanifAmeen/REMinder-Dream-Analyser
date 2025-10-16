from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

# Import AI analysis utilities
from utils.analyzer import summarize_dream, detect_emotion, extract_themes

# Initialize app
app = Flask(__name__)
CORS(app)

# Database setup
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dreams.db")
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Dream model
class Dream(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    mood = db.Column(db.String(50))
    summary = db.Column(db.Text)
    themes = db.Column(db.Text)

# Initialize DB
with app.app_context():
    db.create_all()

# --- FRONTEND ROUTE ---
@app.route('/')
def index():
    return render_template('index.html')

# --- API ROUTES ---

# Add dream with AI analysis
@app.route('/add_dream', methods=['POST'])
def add_dream():
    data = request.get_json()
    content = data.get('content')
    mood = data.get('mood', '')

    if not data.get('title') or not content:
        return jsonify({"error": "Title and content are required"}), 400

    # AI analysis
    try:
        summary = summarize_dream(content)
        ai_mood = detect_emotion(content)
        themes = ", ".join(extract_themes(content))
    except Exception as e:
        print("AI analysis failed:", e)
        summary = ""
        ai_mood = mood
        themes = ""

    new_dream = Dream(
        title=data.get('title'),
        content=content,
        mood=mood or ai_mood,   # user mood if provided, else AI mood
        summary=summary,
        themes=themes
    )

    db.session.add(new_dream)
    db.session.commit()
    return jsonify({"message": "Dream added successfully"}), 201


# Get all dreams
@app.route('/get_dreams', methods=['GET'])
def get_dreams():
    dreams = Dream.query.order_by(Dream.date.desc()).all()
    return jsonify([{
        "id": d.id,
        "title": d.title,
        "content": d.content,
        "mood": d.mood,
        "summary": d.summary,
        "themes": d.themes,
        "date": d.date.strftime("%Y-%m-%d %H:%M:%S")
    } for d in dreams])


# Delete dream by ID
@app.route('/delete_dream/<int:id>', methods=['DELETE'])
def delete_dream(id):
    dream = Dream.query.get_or_404(id)
    db.session.delete(dream)
    db.session.commit()
    return jsonify({"message": "Dream deleted successfully"})


# --- RUN APP ---
if __name__ == '__main__':
    app.run(debug=True)
