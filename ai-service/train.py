"""
@file train.py
@description Train DebugX AI model on real GitHub bug reports.
"""

import numpy as np
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

from data import TRAINING_DATA
from model import BugClassifier

def train():
    print("=" * 60)
    print("  DebugX AI Model Training — Real Dataset")
    print("=" * 60)

    texts      = [item["text"]     for item in TRAINING_DATA]
    categories = [item["category"] for item in TRAINING_DATA]
    priorities = [item["priority"] for item in TRAINING_DATA]

    print("\nDataset: " + str(len(texts)) + " real bug reports")

    print("\nCategory distribution:")
    for cat in sorted(set(categories)):
        count = categories.count(cat)
        print("  " + cat + ": " + str(count))

    print("\nPriority distribution:")
    for pri in sorted(set(priorities)):
        count = priorities.count(pri)
        print("  " + pri + ": " + str(count))

    print("\n── Evaluating Model Accuracy ──")

    cat_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=10000,
            stop_words="english"
        )),
        ("clf", MultinomialNB(alpha=0.1)),
    ])
    cat_scores = cross_val_score(cat_pipeline, texts, categories, cv=5, scoring="accuracy")
    print("Category Accuracy: " + str(round(np.mean(cat_scores) * 100, 2)) + "%")

    pri_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=10000,
            stop_words="english"
        )),
        ("clf", MultinomialNB(alpha=0.1)),
    ])
    pri_scores = cross_val_score(pri_pipeline, texts, priorities, cv=5, scoring="accuracy")
    print("Priority Accuracy:  " + str(round(np.mean(pri_scores) * 100, 2)) + "%")

    print("\n── Training Final Model ──")
    classifier = BugClassifier()
    classifier.train(texts, categories, priorities)
    classifier.save()

    print("\n── Test Predictions ──")
    test_cases = [
        ("Login button not working on mobile Safari click event not firing", "ui_bug", "high"),
        ("SQL injection vulnerability in search field input not sanitized", "security", "critical"),
        ("Page takes 30 seconds to load memory usage 100 percent CPU spike", "performance", "high"),
        ("Database connection timeout pool exhausted too many connections", "database", "critical"),
        ("CORS error when making API request from frontend cross origin blocked", "network", "high"),
        ("User registration failing with valid email address server error 500", "functionality", "critical"),
    ]

    correct_cat = 0
    correct_pri = 0

    for text, exp_cat, exp_pri in test_cases:
        result = classifier.predict(text)
        cat_ok = result["category"] == exp_cat
        pri_ok = result["priority"] == exp_pri
        if cat_ok:
            correct_cat += 1
        if pri_ok:
            correct_pri += 1
        print("\nText: " + text[:60])
        print("  Category: " + result["category"] + (" OK" if cat_ok else " WRONG expected=" + exp_cat))
        print("  Priority: " + result["priority"] + (" OK" if pri_ok else " WRONG expected=" + exp_pri))
        print("  Confidence: " + str(round(result["confidence"] * 100, 2)) + "%")

    print("\n── Results ──")
    print("Category: " + str(correct_cat) + "/" + str(len(test_cases)))
    print("Priority: " + str(correct_pri) + "/" + str(len(test_cases)))
    print("\n" + "=" * 60)
    print("  Training Complete!")
    print("  Category CV Accuracy: " + str(round(np.mean(cat_scores) * 100, 2)) + "%")
    print("  Priority CV Accuracy: " + str(round(np.mean(pri_scores) * 100, 2)) + "%")
    print("  Model saved to models/")
    print("  Now run: python app.py")
    print("=" * 60)

if __name__ == "__main__":
    train()