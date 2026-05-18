"""
@file model.py
@description DebugX ML classification model.

Uses TF-IDF vectorization + Naive Bayes classifier.

WHY TF-IDF + NAIVE BAYES:
  - TF-IDF: converts text to numerical vectors
    (Term Frequency - Inverse Document Frequency)
  - Naive Bayes: fast, works well with text classification
  - Together: lightweight, accurate for bug classification
  - No GPU needed, runs on any machine
"""

import pickle
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

# Path to save/load trained models
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
CATEGORY_MODEL_PATH = os.path.join(MODEL_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODEL_DIR, "priority_model.pkl")


class BugClassifier:
    """
    Classifies bugs by category and priority using ML.

    PIPELINE:
      text → TF-IDF vectorizer → Naive Bayes → prediction
    """

    def __init__(self):
        # Two separate pipelines: one for category, one for priority
        self.category_pipeline = None
        self.priority_pipeline = None
        self.is_trained = False

    def _build_pipeline(self):
        """
        Build a sklearn Pipeline with TF-IDF + Naive Bayes.

        Pipeline chains steps so fit/predict work seamlessly:
          1. TfidfVectorizer: text → numerical matrix
          2. MultinomialNB: classify the matrix
        """
        return Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2),   # Use single words AND pairs (bigrams)
                max_features=5000,    # Top 5000 most important terms
                stop_words="english", # Remove common words (the, is, at...)
                lowercase=True,
                strip_accents="unicode",
            )),
            ("classifier", MultinomialNB(
                alpha=0.1,  # Smoothing parameter (prevents zero probabilities)
            )),
        ])

    def train(self, texts, categories, priorities):
        """
        Train both classification models.

        @param texts: list of bug text strings
        @param categories: list of category labels
        @param priorities: list of priority labels
        """
        print(f"Training on {len(texts)} samples...")

        # Train category classifier
        self.category_pipeline = self._build_pipeline()
        self.category_pipeline.fit(texts, categories)

        # Train priority classifier
        self.priority_pipeline = self._build_pipeline()
        self.priority_pipeline.fit(texts, priorities)

        self.is_trained = True
        print("Training complete!")

    def predict(self, text):
        """
        Predict category and priority for a bug.

        @param text: bug title + description combined
        @returns dict with category, priority, and confidence scores
        """
        if not self.is_trained:
            raise Exception("Model not trained. Run train.py first.")

        # Get predictions
        category = self.category_pipeline.predict([text])[0]
        priority = self.priority_pipeline.predict([text])[0]

        # Get confidence scores (probability of each class)
        category_proba = self.category_pipeline.predict_proba([text])[0]
        priority_proba = self.priority_pipeline.predict_proba([text])[0]

        # Confidence = probability of the predicted class
        category_confidence = float(np.max(category_proba))
        priority_confidence = float(np.max(priority_proba))

        # Overall confidence = average of both
        overall_confidence = (category_confidence + priority_confidence) / 2

        return {
            "category": category,
            "priority": priority,
            "confidence": round(overall_confidence, 4),
            "details": {
                "category_confidence": round(category_confidence, 4),
                "priority_confidence": round(priority_confidence, 4),
            }
        }

    def save(self):
        """Save trained models to disk."""
        os.makedirs(MODEL_DIR, exist_ok=True)

        with open(CATEGORY_MODEL_PATH, "wb") as f:
            pickle.dump(self.category_pipeline, f)

        with open(PRIORITY_MODEL_PATH, "wb") as f:
            pickle.dump(self.priority_pipeline, f)

        print(f"Models saved to {MODEL_DIR}")

    def load(self):
        """Load trained models from disk."""
        if not os.path.exists(CATEGORY_MODEL_PATH):
            raise FileNotFoundError(
                "Trained models not found. Run: python train.py"
            )

        with open(CATEGORY_MODEL_PATH, "rb") as f:
            self.category_pipeline = pickle.load(f)

        with open(PRIORITY_MODEL_PATH, "rb") as f:
            self.priority_pipeline = pickle.load(f)

        self.is_trained = True
        print("Models loaded successfully!")
