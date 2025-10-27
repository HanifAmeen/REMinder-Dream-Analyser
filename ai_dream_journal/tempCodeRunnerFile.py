from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import json

# AI analysis utilities
from utils.analyzer import summarize_dream, detect_emotion, extract_themes

# Dream dictionary analysis
from dream_dictionary import interpret_dream_text, dream_dict_df

# Initialize Flask app
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
    symbols = db.Column(db.Text)  # JSON string of symbols

# Initialize DB
with app.app_context():
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

    # Dream dictionary analysis
    try:
        symbols_list = interpret_dream_text(content, dream_dict_df)
        symbols_json = [{"symbol": s['symbol'], "interpretation": s['meaning']} for s in symbols_list]
    except Exception as e:
        print("Dream dictionary failed:", e)
        symbols_json = []

    # Save dream
    new_dream = Dream(
        title=title,
        content=content,
        mood=mood or ai_mood,
        summary=summary,
        themes=themes,
        symbols=json.dumps(symbols_json)
    )
    db.session.add(new_dream)
    db.session.commit()

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
    app.run(debug=True)
