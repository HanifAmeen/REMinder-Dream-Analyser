import joblib
from transformers import pipeline
from keybert import KeyBERT

# --- Load your trained models ---
model = joblib.load("models/dream_emotion_model.pkl")
vectorizer = joblib.load("models/tfidf_vectorizer.pkl")
label_encoder = joblib.load("models/label_encoder.pkl")

# --- Pretrained models for summarization and keyword extraction ---
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
kw_model = KeyBERT()

def summarize_dream(text):
    """Generate a short summary of the dream."""
    summary = summarizer(text, max_length=60, min_length=20, do_sample=False)
    return summary[0]['summary_text']

def detect_emotion(text):
    """Detect dominant emotion from dream text using your trained model."""
    X_vec = vectorizer.transform([text])
    pred_encoded = model.predict(X_vec)[0]
    emotion = label_encoder.inverse_transform([pred_encoded])[0]
    return emotion

def extract_themes(text):
    """Extract key themes or topics from the dream."""
    keywords = kw_model.extract_keywords(text, top_n=5)
    return [kw[0] for kw in keywords]
