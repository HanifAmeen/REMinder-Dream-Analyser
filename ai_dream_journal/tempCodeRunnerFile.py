from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import json
import traceback

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
    themes = db.Column(db.Text)  # JSON string
    symbols = db.Column(db.Text)  # JSON string
    combined_insights = db.Column(db.Text)  # JSON string

# Initialize DB (no automatic deletion)
with app.app_context():
    db.create_all()

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_dream', methods=['POST'])
def add_dream():
    data = request.get_json() or {}
    title = data.get('title')
    content = data.get('content')
    mood_input = data.get('mood', '')

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    # Build previous_dreams as list of dicts with symbols parsed for compare_with_previous
    previous_dreams = []
    try:
        all_dreams = Dream.query.order_by(Dream.date.desc()).all()
        for d in all_dreams:
            try:
                prev_symbols = json.loads(d.symbols) if d.symbols else []
            except Exception:
                prev_symbols = []
            previous_dreams.append({
                "content": d.content,
                "symbols": prev_symbols
            })
    except Exception as e:
        print("[app] error loading previous dreams:", e)
        previous_dreams = []

    # --- AI analysis ---
    try:
        analysis = analyze_dream(content, previous_dreams=previous_dreams) or {}
    except Exception as e:
        print("[app] analyze_dream raised exception:", e)
        traceback.print_exc()
        analysis = {}

    # Ensure typed defaults (avoid storing wrong types)
    summary = analysis.get("summary", "") or ""
    emotions = analysis.get("emotions", {}) or {}
    dominant_emotion = emotions.get("dominant", mood_input) or mood_input or ""
    themes_list = analysis.get("themes", []) or []
    symbols_list = analysis.get("symbols", []) or []
    combined_insights_list = analysis.get("combined_insights", []) or []

    # --- Save dream (store JSON strings for arrays) ---
    try:
        new_dream = Dream(
            title=title,
            content=content,
            mood=dominant_emotion,
            summary=summary,
            themes=json.dumps(themes_list),
            symbols=json.dumps(symbols_list),
            combined_insights=json.dumps(combined_insights_list)
        )
        db.session.add(new_dream)
        db.session.commit()
    except Exception as e:
        print("[app] error saving dream:", e)
        traceback.print_exc()
        return jsonify({"error": "Failed to save dream"}), 500

    # Return analysis back to frontend for immediate display
    return jsonify({
        "message": "Dream added successfully",
        "summary": summary,
        "emotions": emotions,
        "themes": themes_list,
        "symbols": symbols_list,
        "combined_insights": combined_insights_list
    }), 201

@app.route('/get_dreams', methods=['GET'])
def get_dreams():
    try:
        dreams = Dream.query.order_by(Dream.date.desc()).all()
    except Exception as e:
        print("[app] error querying dreams:", e)
        return jsonify([])

    result = []
    for d in dreams:
        try:
            symbols = json.loads(d.symbols) if d.symbols else []
        except Exception as e:
            print("[app] error loading symbols JSON:", e)
            symbols = []
        try:
            combined_insights = json.loads(d.combined_insights) if d.combined_insights else []
        except Exception as e:
            print("[app] error loading combined_insights JSON:", e)
            combined_insights = []
        try:
            themes = json.loads(d.themes) if d.themes else []
        except Exception as e:
            print("[app] error loading themes JSON:", e)
            themes = []

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
def delete_dream(id):
    try:
        dream = Dream.query.get_or_404(id)
        db.session.delete(dream)
        db.session.commit()
        return jsonify({"message": "Dream deleted successfully"})
    except Exception as e:
        print("[app] delete error:", e)
        return jsonify({"error": "Delete failed"}), 500

if __name__ == '__main__':
    # threaded=True helps handle requests while heavy model loads occur
    app.run(debug=True, threaded=True)
