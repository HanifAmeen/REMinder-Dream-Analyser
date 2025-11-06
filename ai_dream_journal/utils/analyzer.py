from transformers import pipeline
from keybert import KeyBERT
import pandas as pd
import re
import string

# --- Load dream dictionary ---
dict_path = r"C:\Users\amjad\Downloads\Research Papers 2025\Dream Journal\Datasets\cleaned_dream_interpretations.csv"
dream_dict_df = pd.read_csv(dict_path)
dream_dict_df = dream_dict_df.loc[:, ~dream_dict_df.columns.str.contains('^Unnamed|^$', case=False)]
dream_dict_df.columns = [c.strip().lower() for c in dream_dict_df.columns]

# --- Initialize NLP models ---
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
emotion_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    return_all_scores=True
)
kw_model = KeyBERT()

# --- NLP Functions ---
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

# --- Dream Symbol Function ---
def interpret_symbols(text):
    """Identify dream symbols and their interpretations (accurate word-level matching)."""
    matches = []
    text_clean = text.lower().translate(str.maketrans('', '', string.punctuation))
    
    for _, row in dream_dict_df.iterrows():
        symbol = str(row['word']).lower().strip()
        meaning = str(row['interpretation']).strip()

        # Whole-word match only (prevents 'day' from matching 'yesterday')
        pattern = r'\b' + re.escape(symbol) + r'\b'
        if re.search(pattern, text_clean):
            matches.append({"symbol": symbol, "meaning": meaning})

    return matches

# --- Master Dream Analyzer ---
def analyze_dream(text, previous_dreams=None):
    """Analyze a dream: summary, emotion, themes, symbols."""
    summary = summarize_dream(text)
    emotion = detect_emotion(text)
    themes = extract_themes(text)
    symbols = interpret_symbols(text)

    return {
        "summary": summary,
        "emotions": {"dominant": emotion},
        "themes": themes,
        "symbols": symbols
    }
