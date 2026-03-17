# WorkforceIQ 🧠
### Intelligent Workforce Scheduling & Productivity Analytics System

> A full-stack workforce management platform built with Python, REST APIs, SQL, HTML/CSS/JavaScript, and Java.

![Tech Stack](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square&logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)
![Java](https://img.shields.io/badge/Java-11+-orange?style=flat-square&logo=openjdk)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?style=flat-square&logo=sqlite)

---

## 🌟 Features

| Feature | Description |
|---|---|
| 📅 Smart Scheduling | Auto-generate balanced shift schedules with conflict detection |
| 👥 Employee Management | Full CRUD — add, edit, delete, filter employees |
| ⏱ Attendance Tracking | Check-in/check-out with real-time hour calculation |
| 📊 Analytics Dashboard | KPI cards, trend charts, department stats |
| 💰 Labor Cost Analysis | Projected costs broken down by department |
| 📋 Report Generation | Weekly, productivity, attendance, and cost reports |
| ⚡ REST API | 20+ endpoints for all core operations |
| ☕ Java Integration | Scheduler utility + REST API client in Java |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, Flask, Flask-CORS |
| Database | SQLite (SQL schema with 5 tables) |
| REST API | 20+ endpoints (GET, POST, PUT, DELETE) |
| Frontend | HTML5, CSS3 (CSS Variables), Vanilla JavaScript ES6+ |
| Charts | Chart.js 4 |
| Java | Java 11+, HttpClient, SchedulerUtil |
| Version Control | Git / GitHub |

---

## 📁 Project Structure

```
WorkforceIQ/
├── backend/
│   ├── app.py                    # Flask REST API (main entry point)
│   ├── requirements.txt
│   ├── database/
│   │   └── db.py                 # SQLite schema + seed data
│   ├── models/
│   │   └── models.py             # Data models / validation
│   └── services/
│       └── scheduling_service.py # AI scheduling logic + analytics
│
├── frontend/
│   ├── index.html                # Single-page dashboard
│   ├── css/
│   │   └── style.css             # Dark industrial theme
│   └── js/
│       └── app.js                # All frontend logic + Chart.js
│
├── java/
│   └── src/main/java/com/workforceiq/
│       ├── SchedulerUtil.java    # Shift generation, conflict detection
│       └── ApiClient.java        # Java REST API client
│
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/WorkforceIQ.git
cd WorkforceIQ
```

### 2. Set Up Python Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# Server starts at http://localhost:5000
```

### 3. Open the Frontend
```bash
# Just open in browser — no build step needed!
open frontend/index.html
# OR use Live Server in VS Code
```

### 4. Run Java Utilities
```bash
cd java/src/main/java/com/workforceiq
javac SchedulerUtil.java && java com.workforceiq.SchedulerUtil
javac ApiClient.java     && java com.workforceiq.ApiClient
```

---

## 🔌 REST API Endpoints

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/employees` | List all employees |
| GET    | `/api/employees/:id` | Get single employee |
| POST   | `/api/employees` | Create employee |
| PUT    | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |

### Schedules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/schedules?week=YYYY-MM-DD` | Get weekly schedule |
| POST   | `/api/schedules` | Create shift |
| POST   | `/api/schedules/auto-generate` | AI auto-generate week |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/attendance?month=YYYY-MM` | Get attendance records |
| POST   | `/api/attendance/checkin` | Record check-in |
| POST   | `/api/attendance/checkout` | Record check-out |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/analytics/dashboard` | Dashboard KPIs |
| GET    | `/api/analytics/productivity` | Productivity report |
| GET    | `/api/reports/weekly` | Weekly summary report |
| GET    | `/api/health` | Health check |

---

## 🗄 Database Schema

```sql
employees           -- Staff profiles, roles, rates
schedules           -- Shift assignments per week
attendance          -- Daily check-in/check-out
leave_requests      -- Leave management
productivity_metrics -- Weekly KPI scores
```

---

## 💡 Interview Talking Points

1. **REST API Design** — RESTful conventions, proper HTTP verbs, status codes
2. **SQL** — Normalized schema, JOINs, aggregations, subqueries
3. **Python** — Flask routing, blueprints, data models with dataclasses
4. **JavaScript** — Fetch API, async/await, DOM manipulation, Chart.js
5. **Java** — OOP with records, Java HttpClient for REST calls
6. **Git** — Feature branching, meaningful commits, `.gitignore`
7. **Full-Stack** — How frontend → REST API → database layers connect

---

## 📸 Screenshots

| Dashboard | Employees | Analytics |
|-----------|-----------|-----------|
| KPI cards + live charts | Full CRUD table | Productivity charts |

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ for workforce intelligence*
