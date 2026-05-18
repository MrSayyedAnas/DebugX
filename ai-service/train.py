"""
@file train.py
@description Train the DebugX bug classification model.

Run this ONCE to train and save the model:
  python train.py

The trained model is saved to models/ folder.
"""

from data import TRAINING_DATA
from model import BugClassifier
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import numpy as np

def train():
    print("=" * 50)
    print("  DebugX AI Model Training")
    print("=" * 50)

    # ── Prepare Data ─────────────────────────────────────────────────────────
    texts = [item["text"] for item in TRAINING_DATA]
    categories = [item["category"] for item in TRAINING_DATA]
    priorities = [item["priority"] for item in TRAINING_DATA]

    print(f"\nDataset: {len(texts)} samples")
    print(f"Categories: {set(categories)}")
    print(f"Priorities: {set(priorities)}")

    # ── Cross Validation (evaluate model accuracy) ────────────────────────────
    print("\n── Evaluating Model Accuracy ──")

    # Category accuracy
    cat_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000,
                                   stop_words="english")),
        ("clf", MultinomialNB(alpha=0.1)),
    ])
    cat_scores = cross_val_score(cat_pipeline, texts, categories, cv=3, scoring="accuracy")
    print(f"Category Classification Accuracy: {np.mean(cat_scores):.2%} (+/- {np.std(cat_scores):.2%})")

    # Priority accuracy
    pri_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000,
                                   stop_words="english")),
        ("clf", MultinomialNB(alpha=0.1)),
    ])
    pri_scores = cross_val_score(pri_pipeline, texts, priorities, cv=3, scoring="accuracy")
    print(f"Priority Classification Accuracy:  {np.mean(pri_scores):.2%} (+/- {np.std(pri_scores):.2%})")

    # ── Train Final Model ─────────────────────────────────────────────────────
    print("\n── Training Final Model ──")
    classifier = BugClassifier()
    classifier.train(texts, categories, priorities)

    # ── Save Model ────────────────────────────────────────────────────────────
    classifier.save()

    # ── Test Prediction ───────────────────────────────────────────────────────
    print("\n── Test Predictions ──")
    test_cases = [
        "Login button not working on mobile device click event not firing",
        "SQL injection vulnerability in search field input not sanitized",
        "Page takes 30 seconds to load performance issue slow response",
        "Database connection timeout too many connections pool exhausted",
        "CORS error when making API request from frontend cross origin",
    ]

    for text in test_cases:
        result = classifier.predict(text)
        print(f"\nText: {text[:60]}...")
        print(f"  → Category: {result['category']}")
        print(f"  → Priority: {result['priority']}")
        print(f"  → Confidence: {result['confidence']:.2%}")

    print("\n" + "=" * 50)
    print("  Training Complete! Model saved to models/")
    print("  Now run: python app.py")
    print("=" * 50)

if __name__ == "__main__":
    train()
