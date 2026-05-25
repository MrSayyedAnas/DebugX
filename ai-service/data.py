"""
@file data.py
@description Load real bug training data from processed dataset.

Dataset source: GitHub Bugs Prediction (Kaggle)
Original records: 66,827 real bug reports
Processed: 12,000 balanced samples across 6 categories
"""

import json
import os

def load_training_data():
    """
    Load real bug reports from processed dataset.
    Returns: list of dicts with 'text', 'category', 'priority'
    """
    data_path = os.path.join(os.path.dirname(__file__), 'real_bugs_processed.json')

    if not os.path.exists(data_path):
        raise FileNotFoundError(
            "real_bugs_processed.json not found. Run preprocess.py first."
        )

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} real bug reports from dataset")
    return data


# Keep old TRAINING_DATA for fallback
TRAINING_DATA = load_training_data()