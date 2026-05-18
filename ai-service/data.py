"""
@file data.py
@description Training dataset for the DebugX AI classification model.

Each entry has:
  - text: bug title + description combined
  - category: one of (ui_bug, performance, security, functionality, database, network, other)
  - priority: one of (low, medium, high, critical)
"""

TRAINING_DATA = [
    # ── UI Bugs ────────────────────────────────────────────────────────────────
    {
        "text": "Button not responding on mobile screen click event not firing on touch devices",
        "category": "ui_bug", "priority": "high"
    },
    {
        "text": "Login page layout broken on Safari browser CSS styles not rendering correctly",
        "category": "ui_bug", "priority": "medium"
    },
    {
        "text": "Modal dialog not closing when clicking outside overlay remains visible",
        "category": "ui_bug", "priority": "medium"
    },
    {
        "text": "Dropdown menu items overlapping with content z-index issue on Firefox",
        "category": "ui_bug", "priority": "low"
    },
    {
        "text": "Form validation error messages not displaying correctly below input fields",
        "category": "ui_bug", "priority": "medium"
    },
    {
        "text": "Navigation menu disappears on mobile viewport responsive design broken",
        "category": "ui_bug", "priority": "high"
    },
    {
        "text": "Images not loading on product page broken image placeholder shown",
        "category": "ui_bug", "priority": "medium"
    },
    {
        "text": "Text overlapping on small screens responsive layout issue",
        "category": "ui_bug", "priority": "medium"
    },
    {
        "text": "Scrollbar not appearing when content overflows container",
        "category": "ui_bug", "priority": "low"
    },
    {
        "text": "Button color does not change on hover CSS hover state broken",
        "category": "ui_bug", "priority": "low"
    },
    {
        "text": "Checkbox not toggling when clicked in form submission page",
        "category": "ui_bug", "priority": "medium"
    },
    {
        "text": "Date picker calendar not opening on click input field unresponsive",
        "category": "ui_bug", "priority": "medium"
    },

    # ── Performance Bugs ───────────────────────────────────────────────────────
    {
        "text": "Page takes 15 seconds to load dashboard slow response time timeout",
        "category": "performance", "priority": "high"
    },
    {
        "text": "Application freezes when loading large dataset memory usage 100 percent",
        "category": "performance", "priority": "critical"
    },
    {
        "text": "API response time exceeds 10 seconds for search query slow database",
        "category": "performance", "priority": "high"
    },
    {
        "text": "Memory leak in background process CPU usage keeps increasing",
        "category": "performance", "priority": "critical"
    },
    {
        "text": "Report generation takes too long timeout error for large reports",
        "category": "performance", "priority": "high"
    },
    {
        "text": "Slow loading time on homepage too many HTTP requests performance issue",
        "category": "performance", "priority": "medium"
    },
    {
        "text": "Application crashes when uploading files larger than 10MB out of memory",
        "category": "performance", "priority": "high"
    },
    {
        "text": "Database query taking 30 seconds missing index slow query",
        "category": "performance", "priority": "high"
    },

    # ── Security Bugs ──────────────────────────────────────────────────────────
    {
        "text": "SQL injection vulnerability in search field user input not sanitized",
        "category": "security", "priority": "critical"
    },
    {
        "text": "Password stored in plain text in database no hashing encryption",
        "category": "security", "priority": "critical"
    },
    {
        "text": "XSS vulnerability in comment section script injection possible",
        "category": "security", "priority": "critical"
    },
    {
        "text": "Authentication token exposed in URL query parameter security risk",
        "category": "security", "priority": "critical"
    },
    {
        "text": "User can access admin panel without proper authorization role check missing",
        "category": "security", "priority": "critical"
    },
    {
        "text": "CSRF protection missing on form submission cross site request forgery",
        "category": "security", "priority": "high"
    },
    {
        "text": "Sensitive data exposed in API response password email visible",
        "category": "security", "priority": "high"
    },
    {
        "text": "Session not invalidated after logout user stays logged in",
        "category": "security", "priority": "high"
    },

    # ── Functionality Bugs ─────────────────────────────────────────────────────
    {
        "text": "Login button not working authentication fails with correct credentials",
        "category": "functionality", "priority": "critical"
    },
    {
        "text": "Cannot submit form button click does nothing no response",
        "category": "functionality", "priority": "high"
    },
    {
        "text": "File upload not working error message when selecting file",
        "category": "functionality", "priority": "high"
    },
    {
        "text": "Email notifications not being sent after user registration",
        "category": "functionality", "priority": "medium"
    },
    {
        "text": "Search feature returning wrong results incorrect filtering logic",
        "category": "functionality", "priority": "high"
    },
    {
        "text": "User registration failing with valid email address error 500",
        "category": "functionality", "priority": "critical"
    },
    {
        "text": "Password reset link not working expired token error",
        "category": "functionality", "priority": "high"
    },
    {
        "text": "Export to PDF not working download button does nothing",
        "category": "functionality", "priority": "medium"
    },
    {
        "text": "Sorting feature not working table order unchanged after click",
        "category": "functionality", "priority": "medium"
    },
    {
        "text": "Delete button not removing item from list refresh required",
        "category": "functionality", "priority": "medium"
    },

    # ── Database Bugs ──────────────────────────────────────────────────────────
    {
        "text": "Duplicate records being created in database unique constraint violation",
        "category": "database", "priority": "high"
    },
    {
        "text": "Data not persisting after save changes lost on page refresh database",
        "category": "database", "priority": "critical"
    },
    {
        "text": "Foreign key constraint error when deleting parent record cascade",
        "category": "database", "priority": "high"
    },
    {
        "text": "Database connection timeout too many connections pool exhausted",
        "category": "database", "priority": "critical"
    },
    {
        "text": "Migration script failing database schema update error",
        "category": "database", "priority": "high"
    },
    {
        "text": "Data corruption after concurrent writes race condition database",
        "category": "database", "priority": "critical"
    },
    {
        "text": "Query returning null for existing records database inconsistency",
        "category": "database", "priority": "high"
    },

    # ── Network Bugs ───────────────────────────────────────────────────────────
    {
        "text": "API endpoint returning 503 service unavailable network error",
        "category": "network", "priority": "critical"
    },
    {
        "text": "CORS error when making request from frontend cross origin blocked",
        "category": "network", "priority": "high"
    },
    {
        "text": "WebSocket connection dropping frequently reconnection needed",
        "category": "network", "priority": "high"
    },
    {
        "text": "API timeout after 30 seconds network request not completing",
        "category": "network", "priority": "high"
    },
    {
        "text": "SSL certificate expired HTTPS connection refused security warning",
        "category": "network", "priority": "critical"
    },
    {
        "text": "Request failing with 404 endpoint not found route missing",
        "category": "network", "priority": "medium"
    },

    # ── Other ──────────────────────────────────────────────────────────────────
    {
        "text": "Documentation link broken returns 404 page not found",
        "category": "other", "priority": "low"
    },
    {
        "text": "Typo in error message spelling mistake in user facing text",
        "category": "other", "priority": "low"
    },
    {
        "text": "Console warning about deprecated API usage needs update",
        "category": "other", "priority": "low"
    },
    {
        "text": "Unit tests failing after recent code changes test suite broken",
        "category": "other", "priority": "medium"
    },
]
