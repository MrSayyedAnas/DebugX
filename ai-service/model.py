"""
@file model.py
@description DebugX ML classification model.
Uses BERT for better accuracy with emojis and special characters.
"""

import os
import numpy as np
import torch
import pickle
from torch import nn
from torch.utils.data import Dataset, DataLoader
from transformers import BertTokenizer, BertModel
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
CATEGORY_MODEL_PATH = os.path.join(MODEL_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODEL_DIR, "priority_model.pkl")


# ── Dataset ────────────────────────────────────────────────────────────────────
class BugDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids":      encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "label":          torch.tensor(self.labels[idx], dtype=torch.long),
        }


# ── BERT Classifier Head ────────────────────────────────────────────────────────
class BERTClassifier(nn.Module):
    def __init__(self, num_classes, dropout=0.3):
        super().__init__()
        self.bert = BertModel.from_pretrained("bert-base-uncased")
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_classes)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled = outputs.pooler_output          # [CLS] token representation
        return self.classifier(self.dropout(pooled))


# ── Main BugClassifier ──────────────────────────────────────────────────────────
class BugClassifier:
    def __init__(self, device=None):
        self.tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        self.category_model = None
        self.priority_model  = None
        self.category_encoder = LabelEncoder()
        self.priority_encoder  = LabelEncoder()
        self.is_trained = False

    # ── Internal train loop ────────────────────────────────────────────────────
    def _train_model(self, model, dataloader, epochs=3, lr=2e-5):
        model.to(self.device)
        optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
        loss_fn   = nn.CrossEntropyLoss()

        model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch in dataloader:
                optimizer.zero_grad()
                input_ids      = batch["input_ids"].to(self.device)
                attention_mask = batch["attention_mask"].to(self.device)
                labels         = batch["label"].to(self.device)

                logits = model(input_ids, attention_mask)
                loss   = loss_fn(logits, labels)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            avg = total_loss / len(dataloader)
            print(f"  Epoch {epoch+1}/{epochs} — loss: {avg:.4f}")

        return model

    # ── Public API ─────────────────────────────────────────────────────────────
    def train(self, texts, categories, priorities, epochs=3, batch_size=16):
        print(f"Training on {len(texts)} samples using {self.device}...")

        # Encode string labels → integers
        cat_labels  = self.category_encoder.fit_transform(categories)
        prio_labels = self.priority_encoder.fit_transform(priorities)

        # Category model
        print("Training category classifier...")
        cat_dataset    = BugDataset(texts, cat_labels, self.tokenizer)
        cat_loader     = DataLoader(cat_dataset, batch_size=batch_size, shuffle=True)
        self.category_model = BERTClassifier(num_classes=len(self.category_encoder.classes_))
        self._train_model(self.category_model, cat_loader, epochs)

        # Priority model
        print("Training priority classifier...")
        prio_dataset   = BugDataset(texts, prio_labels, self.tokenizer)
        prio_loader    = DataLoader(prio_dataset, batch_size=batch_size, shuffle=True)
        self.priority_model = BERTClassifier(num_classes=len(self.priority_encoder.classes_))
        self._train_model(self.priority_model, prio_loader, epochs)

        self.is_trained = True
        print("Training complete!")

    def evaluate(self, texts, categories, priorities):
        """
        Evaluate model accuracy on a held-out validation set.
        Always call this with data that was NOT used during training.

        Returns: dict with category_accuracy and priority_accuracy
        """
        if not self.is_trained:
            raise Exception("Model not trained. Run train.py first.")

        cat_labels  = self.category_encoder.transform(categories)
        prio_labels = self.priority_encoder.transform(priorities)

        cat_loader  = DataLoader(BugDataset(texts, cat_labels,  self.tokenizer), batch_size=16)
        prio_loader = DataLoader(BugDataset(texts, prio_labels, self.tokenizer), batch_size=16)

        def _eval(model, loader, encoder):
            model.eval()
            all_preds, all_labels = [], []
            with torch.no_grad():
                for batch in loader:
                    input_ids      = batch["input_ids"].to(self.device)
                    attention_mask = batch["attention_mask"].to(self.device)
                    labels         = batch["label"]

                    logits = model(input_ids, attention_mask)
                    preds  = torch.argmax(logits, dim=1).cpu().numpy()
                    all_preds.extend(preds)
                    all_labels.extend(labels.numpy())

            print(classification_report(all_labels, all_preds, target_names=encoder.classes_))
            return accuracy_score(all_labels, all_preds)

        print("\n── Category Model Evaluation ──")
        cat_acc = _eval(self.category_model, cat_loader, self.category_encoder)

        print("\n── Priority Model Evaluation ──")
        prio_acc = _eval(self.priority_model, prio_loader, self.priority_encoder)

        print(f"\nCategory Accuracy : {cat_acc:.2%}")
        print(f"Priority Accuracy : {prio_acc:.2%}")

        return {"category_accuracy": cat_acc, "priority_accuracy": prio_acc}

    def predict(self, text):
        if not self.is_trained:
            raise Exception("Model not trained. Run train.py first.")

        encoding = self.tokenizer(
            text,
            max_length=128,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        input_ids      = encoding["input_ids"].to(self.device)
        attention_mask = encoding["attention_mask"].to(self.device)

        def _infer(model, encoder):
            model.eval()
            with torch.no_grad():
                logits = model(input_ids, attention_mask)
                proba  = torch.softmax(logits, dim=1).cpu().numpy()[0]
                idx    = int(np.argmax(proba))
                return encoder.classes_[idx], float(np.max(proba))

        category, cat_conf   = _infer(self.category_model, self.category_encoder)
        priority,  prio_conf = _infer(self.priority_model,  self.priority_encoder)

        return {
            "category":   category,
            "priority":   priority,
            "confidence": round((cat_conf + prio_conf) / 2, 4),
            "details": {
                "category_confidence": round(cat_conf,  4),
                "priority_confidence": round(prio_conf, 4),
            }
        }

    def save(self):
        os.makedirs(MODEL_DIR, exist_ok=True)
        torch.save(self.category_model.state_dict(),
                   os.path.join(MODEL_DIR, "category_bert.pt"))
        torch.save(self.priority_model.state_dict(),
                   os.path.join(MODEL_DIR, "priority_bert.pt"))
        with open(CATEGORY_MODEL_PATH, "wb") as f:
            pickle.dump(self.category_encoder, f)
        with open(PRIORITY_MODEL_PATH, "wb") as f:
            pickle.dump(self.priority_encoder, f)
        print("Models saved to", MODEL_DIR)

    def load(self):
        with open(CATEGORY_MODEL_PATH, "rb") as f:
            self.category_encoder = pickle.load(f)
        with open(PRIORITY_MODEL_PATH, "rb") as f:
            self.priority_encoder = pickle.load(f)

        self.category_model = BERTClassifier(
            num_classes=len(self.category_encoder.classes_))
        self.category_model.load_state_dict(
            torch.load(os.path.join(MODEL_DIR, "category_bert.pt"),
                       map_location=self.device))
        self.category_model.to(self.device)

        self.priority_model = BERTClassifier(
            num_classes=len(self.priority_encoder.classes_))
        self.priority_model.load_state_dict(
            torch.load(os.path.join(MODEL_DIR, "priority_bert.pt"),
                       map_location=self.device))
        self.priority_model.to(self.device)

        self.is_trained = True
        print("Models loaded successfully!")