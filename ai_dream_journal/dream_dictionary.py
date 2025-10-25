import pandas as pd
import re

# Load and clean CSV
dict_path = r"C:\Users\amjad\Downloads\Research Papers 2025\Dream Journal\Datasets\cleaned_dream_interpretations.csv"
dream_dict_df = pd.read_csv(dict_path)

# Drop empty / unnamed columns (like index leftovers)
dream_dict_df = dream_dict_df.loc[:, ~dream_dict_df.columns.str.contains('^Unnamed|^$', case=False)]

# Normalize column names
dream_dict_df.columns = [c.strip().lower() for c in dream_dict_df.columns]

print("✅ Loaded dream dictionary")
print(dream_dict_df.head())

def interpret_dream_text(text, dream_dict_df):
    interpretations = []
    text_lower = text.lower()

    for _, row in dream_dict_df.iterrows():
        symbol = str(row['word']).lower().strip()
        meaning = str(row['interpretation']).strip()

        # Match whole word only
        if re.search(rf'\b{re.escape(symbol)}\b', text_lower):
            interpretations.append({"symbol": symbol, "meaning": meaning})

    return interpretations

# Example dream
sample_dream = """
I was walking through a forest at night and found a snake curled up on a golden key.
Then I climbed a mountain and saw a bright moon shining above.
"""

# Run once and print clearly
results = interpret_dream_text(sample_dream, dream_dict_df)

print("\n🔮 Symbols found in dream:")
for r in results:
    print(f"🜂 {r['symbol'].capitalize()} → {r['meaning'][:250]}...")  # show first 250 chars only

print(f"\n✅ Total symbols matched: {len(results)}")
