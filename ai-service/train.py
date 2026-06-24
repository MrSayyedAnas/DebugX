"""
@file train.py
@description Train DebugX AI model on real GitHub bug reports.
"""

from sklearn.model_selection import train_test_split

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

    # ── Split BEFORE training ──────────────────────────────────────────────────
    # 80% train, 20% validation — model never sees val data during training
    # stratify=categories ensures every category is proportionally represented
    (train_texts, val_texts,
     train_cats,  val_cats,
     train_prios, val_prios) = train_test_split(
        texts, categories, priorities,
        test_size=0.2,
        random_state=42,
        stratify=categories
    )

    print(f"\nTraining on {len(train_texts)} samples")
    print(f"Validating on {len(val_texts)} samples")

    # ── Train BERT on training split only ─────────────────────────────────────
    print("\n── Training Final Model ──")
    classifier = BugClassifier()
    classifier.train(train_texts, train_cats, train_prios)

    # ── Evaluate on unseen validation split ───────────────────────────────────
    print("\n── Evaluating Model Accuracy ──")
    metrics = classifier.evaluate(val_texts, val_cats, val_prios)

    # ── Save ──────────────────────────────────────────────────────────────────
    classifier.save()

    print("\n" + "=" * 60)
    print("  Training Complete!")
    print(f"  Category Accuracy : {metrics['category_accuracy']:.2%}")
    print(f"  Priority Accuracy : {metrics['priority_accuracy']:.2%}")
    print("  Model saved to models/")
    print("  Now run: python app.py")
    print("=" * 60)


if __name__ == "__main__":
    train()