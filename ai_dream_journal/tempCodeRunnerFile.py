from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dreams.db'
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

# Routes
@app.route('/add_dream', methods=['POST'])
def add_dream():
    data = request.get_json()
    new_dream = Dream(
        title=data.get('title'),
        content=data.get('content'),
        mood=data.get('mood', ''),
        summary='',
        themes=''
    )
    db.session.add(new_dream)
    db.session.commit()
    return jsonify({"message": "Dream added successfully"}), 201

@app.route('/get_dreams', methods=['GET'])
def get_dreams():
    dreams = Dream.query.order_by(Dream.date.desc()).all()
    return jsonify([
        {
            "id": d.id,
            "title": d.title,
            "content": d.content,
            "mood": d.mood,
            "summary": d.summary,
            "themes": d.themes,
            "date": d.date.strftime("%Y-%m-%d %H:%M:%S")
        }
        for d in dreams
    ])

@app.route('/delete_dream/<int:id>', methods=['DELETE'])
def delete_dream(id):
    dream = Dream.query.get_or_404(id)
    db.session.delete(dream)
    db.session.commit()
    return jsonify({"message": "Dream deleted successfully"})

if __name__ == '__main__':
    app.run(debug=True)
