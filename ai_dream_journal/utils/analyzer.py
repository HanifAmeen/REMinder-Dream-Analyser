from transformers import pipeline
from keybert import KeyBERT
import pandas as pd
import re
import string
from itertools import combinations
import random

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

# --- NEW: Smarter Combined Symbol Insight Generator ---
def generate_combined_insights(symbols, dominant_emotion=None):
    """
    Generate Jung/Freud-style symbolic insights for combinations of dream symbols.
    Optionally uses dominant emotion to bias interpretation.
    """
    if not symbols or len(symbols) < 2:
        return []

    insights = []
    symbol_pairs = list(combinations(symbols, 2))

    # Jungian and Freudian symbolic interpretations
    jungian_themes = [
        "represents the integration of unconscious and conscious aspects of the self",
        "suggests a process of individuation or personal transformation",
        "symbolizes the confrontation between inner conflict and outer reality",
        "points to the merging of instinctual drives with higher awareness",
        "reflects tension between control and surrender",
    ]

    freudian_themes = [
        "indicates repressed desires surfacing through symbolic imagery",
        "relates to unresolved childhood emotions being projected",
        "hints at internal struggle between id and superego impulses",
        "reveals transformation of anxiety into symbolic meaning",
        "may represent displaced emotional energy seeking release",
    ]

    for s1, s2 in symbol_pairs:
        sym1, sym2 = s1["symbol"], s2["symbol"]
        meaning1, meaning2 = s1["meaning"], s2["meaning"]

        # Base interpretive frame
        base_line = (
            f"Dreaming of **{sym1}** and **{sym2}** together unites the themes of "
            f"'{meaning1[:80].lower()}...' and '{meaning2[:80].lower()}...'. "
        )

        # Bias selection based on dominant emotion (optional)
        if dominant_emotion:
            # Simple heuristic: 'fear', 'anger' → Freudian, else Jungian
            if dominant_emotion.lower() in ['fear', 'anger', 'disgust', 'sadness']:
                layer = random.choice(freudian_themes)
                school = "Freudian"
            else:
                layer = random.choice(jungian_themes)
                school = "Jungian"
        else:
            if random.random() > 0.5:
                layer = random.choice(jungian_themes)
                school = "Jungian"
            else:
                layer = random.choice(freudian_themes)
                school = "Freudian"

        insight = (
            f"{base_line} From a {school} perspective, this {layer}, "
            f"suggesting these symbols interact as mirrors of your inner state."
        )

        insights.append({
            "symbols": [sym1, sym2],
            "insight": insight
        })

    return insights

# --- Master Dream Analyzer ---
def analyze_dream(text, previous_dreams=None):
    """
    Analyze a dream: summary, emotion, themes, symbols, and combined symbolic insights.
    """
    summary = summarize_dream(text)
    emotion = detect_emotion(text)
    themes = extract_themes(text)
    symbols = interpret_symbols(text)
    combined_insights = generate_combined_insights(symbols, dominant_emotion=emotion)

    return {
        "summary": summary,
        "emotions": {"dominant": emotion},
        "themes": themes,
        "symbols": symbols,
        "combined_insights": combined_insights
    }
