"""
@file app.py
@description DebugX AI Microservice — Flask REST API.

Endpoints:
  POST /classify   → Classify a bug
  GET  /health     → Health check
  GET  /model/info → Model information

Run with:
  python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from model import BugClassifier
import os

app = Flask(__name__)
CORS(app)  # Allow requests from Node.js backend

# ── Load Model ────────────────────────────────────────────────────────────────
classifier = BugClassifier()

try:
    classifier.load()
    print("✅ AI Model loaded successfully")
except FileNotFoundError:
    print("⚠️  Model not found. Run: python train.py")

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "success": True,
        "service": "DebugX AI Service",
        "model_loaded": classifier.is_trained,
        "status": "running"
    })


@app.route("/classify", methods=["POST"])
def classify():
    """
    Classify a bug by category and priority.

    Request body:
    {
      "title": "Login button not working",
      "description": "When user clicks login on mobile nothing happens"
    }

    Response:
    {
      "success": true,
      "data": {
        "category": "ui_bug",
        "priority": "high",
        "confidence": 0.89
      }
    }
    """
    # Validate request
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()

    if not title:
        return jsonify({
            "success": False,
            "message": "title is required"
        }), 400

    if not classifier.is_trained:
        return jsonify({
            "success": False,
            "message": "Model not loaded. Run python train.py first."
        }), 503

    # Combine title + description for better classification
    text = f"{title} {description}".strip()

    # Get prediction
    result = classifier.predict(text)

    return jsonify({
        "success": True,
        "data": {
            "category": result["category"],
            "priority": result["priority"],
            "confidence": result["confidence"],
            "details": result["details"]
        }
    })


@app.route("/model/info", methods=["GET"])
def model_info():
    """Get information about the loaded model."""
    return jsonify({
        "success": True,
        "data": {
            "model_type": "TF-IDF + Naive Bayes",
            "categories": [
                "ui_bug", "performance", "security",
                "functionality", "database", "network", "other"
            ],
            "priorities": ["low", "medium", "high", "critical"],
            "is_trained": classifier.is_trained,
        }
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "message": "Route not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "message": "Internal server error"}), 500


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"🤖 DebugX AI Service running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
