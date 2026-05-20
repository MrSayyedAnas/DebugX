# 🐛 DebugX — AI-Powered Bug Management System

> Final Year Capstone Project | Node.js + Python AI + CI/CD Automation

[![CI/CD](https://github.com/MrSayyedAnas/DebugX/actions/workflows/debugx-ci.yml/badge.svg)](https://github.com/MrSayyedAnas/DebugX/actions)
[![Live](https://img.shields.io/badge/Backend-Live%20on%20Render-brightgreen)](https://debugx.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📌 Overview

DebugX is an AI-powered bug management system that eliminates the manual overhead of traditional bug trackers like Jira and GitHub Issues.

### Problem Solved
- Traditional bug trackers require developers to **manually classify** bugs (category, priority)
- This leads to **inconsistency**, human error, and wasted time
- No automatic connection between **code commits and bug status**

### DebugX Solution
- 🤖 **AI automatically classifies** bugs when created (category + priority)
- 🔄 **CI/CD automatically updates** bug status when code is pushed
- 📊 **Developer analytics** tracks team productivity
- 🗂️ **Complete bug lifecycle** management in one system

---

## 🏗️ Architecture

```
Developer/User
      │
      ▼
React Frontend (Coming Soon)
      │
      ▼
Node.js Backend (Express REST API)
https://debugx.onrender.com
      │
      ├──────────────────────────────┐
      ▼                              ▼
MongoDB Atlas                Python AI Service
(Cloud Database)              Flask + TF-IDF + Naive Bayes
                              https://debugx-ai-service.onrender.com

GitHub Actions
      │
      ▼ (webhook on push)
Node.js Backend
      │
      ▼
Auto-update bug status
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Authentication | JWT + bcryptjs |
| Validation | Joi |
| Logging | Winston |
| Security | Helmet, CORS, Rate Limiting |
| AI Service | Python (Flask + TF-IDF + Naive Bayes) |
| CI/CD | GitHub Actions |
| Hosting | Render |

---

## 🚀 Live Demo

- **Backend API:** https://debugx.onrender.com
- **AI Service:** https://debugx-ai-service.onrender.com
- **Health Check:** https://debugx.onrender.com/api/health

### Test Account
```
Email:    anas@debugx.com
Password: secret123
```

---

## 📁 Project Structure

```
DebugX/
├── .github/
│   └── workflows/
│       └── debugx-ci.yml        # CI/CD pipeline
├── ai-service/                   # Python AI Microservice
│   ├── app.py                   # Flask API
│   ├── model.py                 # ML model class
│   ├── train.py                 # Training script
│   ├── data.py                  # Training dataset (55 samples)
│   ├── requirements.txt
│   ├── runtime.txt
│   └── models/
│       ├── category_model.pkl   # Trained category classifier
│       └── priority_model.pkl   # Trained priority classifier
├── src/
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── env.js               # Environment config
│   ├── controllers/             # Route handlers
│   ├── middlewares/             # Auth, validation, webhook
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # Express routes
│   ├── services/                # Business logic
│   ├── utils/                   # Helpers & utilities
│   ├── validations/             # Joi schemas
│   └── app.js                   # Express app factory
├── .env.example
├── package.json
├── render.yaml
└── server.js
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/MrSayyedAnas/DebugX.git
cd DebugX
```

### 2. Install Node.js dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
WEBHOOK_SECRET=your_webhook_secret
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:3000
```

### 4. Start the backend
```bash
npm start
```

### 5. Setup & run the AI service
```bash
cd ai-service
pip install -r requirements.txt
python train.py        # Train the model
python app.py          # Start AI service on port 8000
```

---

## 🤖 AI Classification (Capstone Objective 1)

The AI service uses **TF-IDF vectorization** and **Naive Bayes classification** to automatically classify bugs.

### How it works
1. Bug title + description → combined into text
2. TF-IDF converts text into numerical features
3. Naive Bayes predicts category and priority
4. Results saved to bug with confidence score

### Categories
`ui_bug` | `performance` | `security` | `functionality` | `database` | `network` | `other`

### Priorities
`low` | `medium` | `high` | `critical`

### Example
```bash
POST https://debugx-ai-service.onrender.com/classify
{
  "title": "Login button not working on mobile",
  "description": "When user clicks login on mobile nothing happens"
}

Response:
{
  "success": true,
  "data": {
    "category": "ui_bug",
    "priority": "high",
    "confidence": 0.93
  }
}
```

---

## 🔄 CI/CD Integration (Capstone Objective 2)

GitHub Actions automatically updates bug status when code is pushed.

### Convention
Include the bug ID in your commit message:
```bash
git commit -m "fix: #BUGID description of fix"
```

### What happens
1. Push code → GitHub Actions triggers
2. Tests run (`npm test`)
3. Webhook fires to DebugX backend with HMAC-SHA256 signature
4. Bug status auto-updates:
   - Build success → `resolved`
   - Build failure → `reopened` / `in_progress`
5. Commit SHA linked to bug

### Required GitHub Secrets
| Secret | Value |
|--------|-------|
| `DEBUGX_API_URL` | `https://debugx.onrender.com` |
| `WEBHOOK_SECRET` | Your webhook secret from `.env` |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Get current user (protected) |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects` | List all projects |
| GET | `/api/v1/projects/:id` | Get project |
| PATCH | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |
| POST | `/api/v1/projects/:id/members` | Add member |

### Bugs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bugs` | Create bug (AI auto-classifies) |
| GET | `/api/v1/bugs/project/:projectId` | List bugs |
| GET | `/api/v1/bugs/:id` | Get bug |
| PATCH | `/api/v1/bugs/:id` | Update bug |
| DELETE | `/api/v1/bugs/:id` | Delete bug |
| PATCH | `/api/v1/bugs/:id/status` | Update status |
| PATCH | `/api/v1/bugs/:id/assign` | Assign to developer |
| GET | `/api/v1/bugs/:id/comments` | Get comments |
| POST | `/api/v1/bugs/:id/comments` | Add comment |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/developer/:userId` | Developer metrics |
| GET | `/api/v1/analytics/project/:projectId` | Project analytics |
| GET | `/api/v1/analytics/trends/:projectId` | Bug trends |
| GET | `/api/v1/analytics/team/:projectId` | Team performance |

### CI/CD
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ci/health` | CI service health |
| POST | `/api/v1/ci/webhook` | GitHub Actions webhook |
| GET | `/api/v1/ci/history/:bugId` | CI history for bug |

---

## 📊 Developer Analytics

- Total assigned / resolved / pending bugs
- Resolution rate (%)
- Average resolution time
- Fastest / slowest resolution
- Bug trends over time (weekly)
- Team performance comparison
- Top performer identification

---

## 🔐 Security Features

- JWT authentication with expiry
- Password hashing with bcryptjs (salt rounds: 12)
- HMAC-SHA256 webhook signature verification
- Helmet HTTP security headers
- CORS protection
- Rate limiting (100 req / 15 min globally, stricter on auth)
- Role-based access control (admin / developer / tester)
- Input validation with Joi on all endpoints

---

## 🗺️ Bug Status Workflow

```
open → in_progress → resolved → closed
                  ↑               │
                  └── reopened ←──┘
```

---

## 👨‍💻 Author

**Sayyad Anas**
Final Year Capstone Project
GitHub: [@MrSayyedAnas](https://github.com/MrSayyedAnas)

---

## 📄 License

MIT License — feel free to use this project for learning purposes.