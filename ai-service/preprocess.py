"""
@file preprocess.py
@description Preprocess real GitHub bug dataset for DebugX AI model.

Dataset: GitHub Bugs Prediction (Kaggle - embold_train.json)
  Label 0 = Bug report      ← we use these
  Label 1 = Feature request ← ignored
  Label 2 = Question        ← ignored

Output: real_bugs_processed.json
  - Balanced by category (max 2000 per category)
  - Natural priority distribution preserved
"""

import json
import random


# ── Category Keywords ─────────────────────────────────────────────────────────
# Order matters — more specific categories are checked first
# to avoid overlapping matches

CATEGORY_KEYWORDS = {
    'security': [
        'sql injection', 'xss', 'csrf', 'vulnerability', 'exploit',
        'sanitize', 'injection', 'privilege escalation', 'unauthorized access',
        'malicious', 'attack', 'security breach', 'encryption', 'sensitive data',
    ],
    'database': [
        'database', 'mongodb', 'postgres', 'mysql', 'sqlite', 'redis',
        'query', 'migration', 'schema', 'table ', 'foreign key',
        'transaction', 'orm', 'seed', 'data corruption', 'connection pool',
        'db connection', 'database timeout', 'duplicate record', 'constraint violation',
    ],
    'network': [
        'cors', 'websocket', 'ssl certificate', 'proxy', 'api endpoint',
        'http request', 'fetch error', 'connection refused', 'network error',
        '404 error', '503 error', 'rest api', 'graphql', 'axios error',
        'request timeout', 'api call', 'socket',
    ],
    'performance': [
        'slow', 'memory leak', 'high cpu', 'performance issue', 'takes too long',
        'loading time', 'lag', 'freeze', 'unresponsive', 'bottleneck',
        'optimize', 'heavy load', 'seconds to load', 'timeout after',
        'high memory usage',
    ],
    'ui_bug': [
        'button', 'click', 'ui bug', 'layout broken', 'css', 'not displaying',
        'not visible', 'modal', 'dropdown', 'responsive', 'mobile view',
        'dark mode', 'theme', 'alignment', 'overlap', 'scroll',
        'render issue', 'visual bug', 'icon missing', 'style broken',
    ],
}

# ── Priority Keywords ─────────────────────────────────────────────────────────

PRIORITY_KEYWORDS = {
    'critical': [
        'crash', 'critical', 'blocker', 'security vulnerability', 'data loss',
        'corruption', 'injection', 'exploit', 'production down', 'fatal error',
        'cannot login', 'app crash', 'system crash', 'breaks everything',
    ],
    'high': [
        'error', 'fail', 'failure', 'exception', 'broken', 'wrong',
        'incorrect', 'missing feature', 'cannot', 'unable to', 'invalid',
        'regression', 'not working', 'does not work', 'bug', 'issue', 'problem',
    ],
    'low': [
        'typo', 'spelling', 'cosmetic', 'minor', 'trivial', 'nice to have',
        'suggestion', 'documentation', 'readme', 'comment', 'cleanup', 'refactor',
    ],
}


# ── Classifier Functions ──────────────────────────────────────────────────────

def categorize_bug(title, body):
    """Return DebugX category based on keyword matching."""
    text = (title + " " + body).lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return category
    return 'functionality'


def assign_priority(title, body):
    """Return priority based on keyword matching."""
    text = (title + " " + body).lower()

    if any(kw in text for kw in PRIORITY_KEYWORDS['critical']):
        return 'critical'

    # High requires at least 2 matches to reduce false positives
    if sum(1 for kw in PRIORITY_KEYWORDS['high'] if kw in text) >= 2:
        return 'high'

    if any(kw in text for kw in PRIORITY_KEYWORDS['low']):
        return 'low'

    return 'medium'


# ── Main ──────────────────────────────────────────────────────────────────────

def preprocess_dataset(
    input_file,
    output_file,
    max_per_category = 2000,
    max_per_priority = 10000,
):
    """
    Process raw bug dataset and save balanced training data.

    Args:
        input_file:        Path to embold_train.json
        output_file:       Output path for processed JSON
        max_per_category:  Max samples per category (for balance)
        max_per_priority:  Max samples per priority (use 10000 to skip)
    """
    print("Loading " + input_file + "...")
    with open(input_file, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    print("Total records: " + str(len(raw)))

    # Keep only real bug reports
    bugs = [d for d in raw if d['label'] == 0]
    print("Bug reports (label=0): " + str(len(bugs)))

    # Process
    processed = []
    for item in bugs:
        title = item.get('title', '').strip()
        body  = item.get('body',  '').strip()

        if len(title) < 5 or len(body) < 15:
            continue

        body = body[:600].replace('\r\n', ' ').replace('\r', ' ').replace('\n', ' ')

        processed.append({
            'text':     title + " " + body,
            'title':    title,
            'body':     body,
            'category': categorize_bug(title, body),
            'priority': assign_priority(title, body),
        })

    print("Processed: " + str(len(processed)))

    # Balance by category
    random.shuffle(processed)
    by_cat = {}
    cat_balanced = []
    for item in processed:
        c = item['category']
        by_cat.setdefault(c, [])
        if len(by_cat[c]) < max_per_category:
            by_cat[c].append(item)
            cat_balanced.append(item)

    # Balance by priority
    random.shuffle(cat_balanced)
    by_pri = {}
    final = []
    for item in cat_balanced:
        p = item['priority']
        by_pri.setdefault(p, [])
        if len(by_pri[p]) < max_per_priority:
            by_pri[p].append(item)
            final.append(item)

    random.shuffle(final)

    # Print final distribution
    print("\nFinal category distribution:")
    cat_dist = {}
    for item in final:
        cat_dist[item['category']] = cat_dist.get(item['category'], 0) + 1
    for k, v in sorted(cat_dist.items()):
        print("  " + k + ": " + str(v))

    print("\nFinal priority distribution:")
    pri_dist = {}
    for item in final:
        pri_dist[item['priority']] = pri_dist.get(item['priority'], 0) + 1
    for k, v in sorted(pri_dist.items()):
        print("  " + k + ": " + str(v))

    print("\nTotal samples: " + str(len(final)))

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final, f, indent=2)

    print("Saved to " + output_file)
    return final


if __name__ == "__main__":
    preprocess_dataset(
        input_file       = 'embold_train.json',
        output_file      = 'real_bugs_processed.json',
        max_per_category = 2000,
        max_per_priority = 10000,
    )