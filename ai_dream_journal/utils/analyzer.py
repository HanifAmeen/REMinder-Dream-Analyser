from transformers import pipeline
from keybert import KeyBERT

# Initialize models
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
emotion_classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", return_all_scores=True)
kw_model = KeyBERT()

def summarize_dream(text):
    """Generate a short summary of the dream."""
    summary = summarizer(text, max_length=60, min_length=20, do_sample=False)
    return summary[0]['summary_text']

def detect_emotion(text):
    """Detect dominant emotion from dream text."""
    results = emotion_classifier(text)[0]
    top_emotion = max(results, key=lambda x: x['score'])
    return top_emotion['label']

def extract_themes(text):
    """Extract key themes or topics from the dream."""
    keywords = kw_model.extract_keywords(text, top_n=5)
    return [kw[0] for kw in keywords]
