"""
WorkforceIQ - Database Layer
SQLite for dev | Swap DATABASE_URL to use PostgreSQL/MySQL in production
"""

import sqlite3
import os
from datetime import datetime, timedelta
import random

DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'workforce.db')


def get_db(app=None):
    path = DATABASE_PATH
    if app:
        path = app.config.get('DATABASE', DATABASE_PATH)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(app=None):
    db = get_db(app)
    db.executescript(SCHEMA_SQL)
    db.commit()
    _seed_data(db)
    db.commit()
    print("[WorkforceIQ] Database initialized successfully.")


# ─────────────────────────────────────────────
# SQL SCHEMA
# ─────────────────────────────────────────────
SCHEMA_SQL = """
-- EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL,
    department  TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    phone       TEXT,
    hire_date   TEXT NOT NULL,
    status      TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','on_leave')),
    hourly_rate REAL DEFAULT 25.0,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS schedules (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_date  TEXT NOT NULL,
    start_time  TEXT NOT NULL,
    end_time    TEXT NOT NULL,
    shift_type  TEXT DEFAULT 'morning' CHECK(shift_type IN ('morning','afternoon','night')),
    week_start  TEXT NOT NULL,
    status      TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled','swapped')),
    notes       TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id  INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date         TEXT NOT NULL,
    check_in     TEXT,
    check_out    TEXT,
    hours_worked REAL,
    status       TEXT DEFAULT 'present' CHECK(status IN ('present','absent','late','half_day')),
    notes        TEXT,
    UNIQUE(employee_id, date)
);

-- LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS leave_requests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    leave_type  TEXT NOT NULL CHECK(leave_type IN ('sick','vacation','personal','emergency')),
    start_date  TEXT NOT NULL,
    end_date    TEXT NOT NULL,
    reason      TEXT,
    status      TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at  TEXT DEFAULT (datetime('now'))
);

-- PRODUCTIVITY METRICS TABLE
CREATE TABLE IF NOT EXISTS productivity_metrics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    week_start  TEXT NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    quality_score   REAL DEFAULT 0.0,
    efficiency_score REAL DEFAULT 0.0,
    peer_rating     REAL DEFAULT 0.0,
    notes           TEXT,
    UNIQUE(employee_id, week_start)
);
"""


# ─────────────────────────────────────────────
# SEED DATA
# ─────────────────────────────────────────────
def _seed_data(db):
    existing = db.execute("SELECT COUNT(*) as c FROM employees").fetchone()['c']
    if existing > 0:
        return  # Already seeded

    departments = ['Engineering', 'Marketing', 'Operations', 'HR', 'Sales', 'Finance']
    roles = {
        'Engineering': ['Software Engineer', 'DevOps Engineer', 'QA Engineer', 'Tech Lead'],
        'Marketing':   ['Marketing Manager', 'Content Strategist', 'SEO Analyst', 'Designer'],
        'Operations':  ['Operations Manager', 'Logistics Coordinator', 'Analyst'],
        'HR':          ['HR Manager', 'Recruiter', 'HR Analyst'],
        'Sales':       ['Sales Manager', 'Account Executive', 'Sales Rep'],
        'Finance':     ['Finance Manager', 'Accountant', 'Financial Analyst'],
    }
    names = [
        'Aarav Sharma','Priya Patel','Rohan Mehta','Sneha Joshi','Vikram Singh',
        'Ananya Reddy','Arjun Kumar','Kavya Nair','Siddharth Gupta','Pooja Iyer',
        'Rahul Verma','Deepika Rao','Amit Mishra','Sunita Tiwari','Karan Malhotra',
        'Neha Agarwal','Ravi Bansal','Anjali Shah','Suresh Pillai','Meera Ghosh'
    ]
    rates = {'Engineering':45,'Marketing':35,'Operations':30,'HR':32,'Sales':38,'Finance':40}

    emp_ids = []
    for i, name in enumerate(names):
        dept = departments[i % len(departments)]
        role_list = roles[dept]
        role = role_list[i % len(role_list)]
        hire = (datetime(2021,1,1) + timedelta(days=random.randint(0,900))).strftime('%Y-%m-%d')
        email = name.lower().replace(' ', '.') + '@workforceiq.com'
        db.execute(
            'INSERT OR IGNORE INTO employees (name,role,department,email,phone,hire_date,hourly_rate) VALUES (?,?,?,?,?,?,?)',
            (name, role, dept, email, f'9{random.randint(100000000,999999999)}', hire, rates[dept])
        )
        row = db.execute("SELECT id FROM employees WHERE email=?", (email,)).fetchone()
        if row:
            emp_ids.append(row['id'])

    # Seed 8 weeks of attendance
    today = datetime.today()
    for emp_id in emp_ids:
        for d in range(56):
            day = today - timedelta(days=d)
            if day.weekday() < 5:  # Mon-Fri
                check_in_h  = random.randint(8, 9)
                check_in_m  = random.randint(0, 59)
                hours = round(random.uniform(6.5, 9.5), 2)
                check_out_h = check_in_h + int(hours)
                check_out_m = check_in_m
                status = 'present' if random.random() > 0.08 else ('absent' if random.random() > 0.5 else 'late')
                db.execute(
                    'INSERT OR IGNORE INTO attendance (employee_id,date,check_in,check_out,hours_worked,status) VALUES (?,?,?,?,?,?)',
                    (emp_id, day.strftime('%Y-%m-%d'),
                     f'{check_in_h:02d}:{check_in_m:02d}:00',
                     f'{check_out_h:02d}:{check_out_m:02d}:00',
                     hours if status == 'present' else (hours/2 if status == 'late' else 0),
                     status)
                )

    # Seed productivity metrics
    for emp_id in emp_ids:
        for w in range(8):
            ws = (today - timedelta(weeks=w)).strftime('%Y-%m-%d')
            db.execute(
                'INSERT OR IGNORE INTO productivity_metrics (employee_id,week_start,tasks_completed,quality_score,efficiency_score,peer_rating) VALUES (?,?,?,?,?,?)',
                (emp_id, ws, random.randint(8,30),
                 round(random.uniform(70,100),1),
                 round(random.uniform(65,100),1),
                 round(random.uniform(3.5,5.0),1))
            )


if __name__ == '__main__':
    init_db()
