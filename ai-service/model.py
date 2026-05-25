"""
@file model.py
@description Improved DebugX ML classification model.
Uses TF-IDF + Logistic Regression for better accuracy.
"""

import pickle
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
CATEGORY_MODEL_PATH = os.path.join(MODEL_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODEL_DIR, "priority_model.pkl")


class BugClassifier:
    def __init__(self):
        self.category_pipeline = None
        self.priority_pipeline = None
        self.is_trained = False

    def _build_pipeline(self):
        return Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 3),
                max_features=20000,
                stop_words="english",
                lowercase=True,
                strip_accents="unicode",
                sublinear_tf=True,
                min_df=2,
                max_df=0.95,
            )),
            ("classifier", LogisticRegression(
                max_iter=1000,
                C=5.0,
                solver="lbfgs",
            )),
        ])

    def train(self, texts, categories, priorities):
        print("Training on " + str(len(texts)) + " samples...")

        self.category_pipeline = self._build_pipeline()
        self.category_pipeline.fit(texts, categories)

        self.priority_pipeline = self._build_pipeline()
        self.priority_pipeline.fit(texts, priorities)

        self.is_trained = True
        print("Training complete!")

    def predict(self, text):
        if not self.is_trained:
            raise Exception("Model not trained. Run train.py first.")

        category = self.category_pipeline.predict([text])[0]
        priority = self.priority_pipeline.predict([text])[0]

        category_proba = self.category_pipeline.predict_proba([text])[0]
        priority_proba = self.priority_pipeline.predict_proba([text])[0]

        category_confidence = float(np.max(category_proba))
        priority_confidence = float(np.max(priority_proba))
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
        os.makedirs(MODEL_DIR, exist_ok=True)
        with open(CATEGORY_MODEL_PATH, "wb") as f:
            pickle.dump(self.category_pipeline, f)
        with open(PRIORITY_MODEL_PATH, "wb") as f:
            pickle.dump(self.priority_pipeline, f)
        print("Models saved to " + MODEL_DIR)

    def load(self):
        if not os.path.exists(CATEGORY_MODEL_PATH):
            raise FileNotFoundError("Trained models not found. Run: python train.py")
        with open(CATEGORY_MODEL_PATH, "rb") as f:
            self.category_pipeline = pickle.load(f)
        with open(PRIORITY_MODEL_PATH, "rb") as f:
            self.priority_pipeline = pickle.load(f)
        self.is_trained = True
        print("Models loaded successfully!")