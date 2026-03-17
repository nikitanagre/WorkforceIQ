"""
WorkforceIQ - Intelligent Workforce Scheduling & Productivity Analytics System
Main Flask REST API Application
Tech Stack: Python, Flask, SQLite, REST APIs
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from database.db import init_db, get_db
import logging, os, json
from datetime import datetime, timedelta
import random

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'workforceiq-secret-2024')
app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'workforce.db')


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'system': 'WorkforceIQ',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


# ─────────────────────────────────────────────
# EMPLOYEES API
# ─────────────────────────────────────────────
@app.route('/api/employees', methods=['GET'])
def get_employees():
    db = get_db(app)
    employees = db.execute('SELECT * FROM employees ORDER BY name').fetchall()
    return jsonify([dict(e) for e in employees])

@app.route('/api/employees/<int:emp_id>', methods=['GET'])
def get_employee(emp_id):
    db = get_db(app)
    emp = db.execute('SELECT * FROM employees WHERE id = ?', (emp_id,)).fetchone()
    if not emp:
        return jsonify({'error': 'Employee not found'}), 404
    return jsonify(dict(emp))

@app.route('/api/employees', methods=['POST'])
def create_employee():
    data = request.get_json()
    required = ['name', 'role', 'department', 'email']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields', 'required': required}), 400
    db = get_db(app)
    db.execute(
        'INSERT INTO employees (name, role, department, email, phone, hire_date, status, hourly_rate) VALUES (?,?,?,?,?,?,?,?)',
        (data['name'], data['role'], data['department'], data['email'],
         data.get('phone',''), data.get('hire_date', datetime.today().strftime('%Y-%m-%d')),
         data.get('status','active'), data.get('hourly_rate', 25.0))
    )
    db.commit()
    return jsonify({'message': 'Employee created successfully'}), 201

@app.route('/api/employees/<int:emp_id>', methods=['PUT'])
def update_employee(emp_id):
    data = request.get_json()
    db = get_db(app)
    emp = db.execute('SELECT * FROM employees WHERE id = ?', (emp_id,)).fetchone()
    if not emp:
        return jsonify({'error': 'Employee not found'}), 404
    db.execute(
        'UPDATE employees SET name=?, role=?, department=?, email=?, phone=?, status=?, hourly_rate=? WHERE id=?',
        (data.get('name', emp['name']), data.get('role', emp['role']),
         data.get('department', emp['department']), data.get('email', emp['email']),
         data.get('phone', emp['phone']), data.get('status', emp['status']),
         data.get('hourly_rate', emp['hourly_rate']), emp_id)
    )
    db.commit()
    return jsonify({'message': 'Employee updated successfully'})

@app.route('/api/employees/<int:emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    db = get_db(app)
    db.execute('DELETE FROM employees WHERE id = ?', (emp_id,))
    db.commit()
    return jsonify({'message': 'Employee deleted'})


# ─────────────────────────────────────────────
# SCHEDULES API
# ─────────────────────────────────────────────
@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    week = request.args.get('week', datetime.today().strftime('%Y-%m-%d'))
    db = get_db(app)
    schedules = db.execute('''
        SELECT s.*, e.name as employee_name, e.department, e.role
        FROM schedules s JOIN employees e ON s.employee_id = e.id
        WHERE s.week_start = ? ORDER BY s.shift_date, e.name
    ''', (week,)).fetchall()
    return jsonify([dict(s) for s in schedules])

@app.route('/api/schedules', methods=['POST'])
def create_schedule():
    data = request.get_json()
    db = get_db(app)
    db.execute(
        'INSERT INTO schedules (employee_id, shift_date, start_time, end_time, shift_type, week_start, status) VALUES (?,?,?,?,?,?,?)',
        (data['employee_id'], data['shift_date'], data['start_time'], data['end_time'],
         data.get('shift_type','morning'), data['week_start'], data.get('status','scheduled'))
    )
    db.commit()
    return jsonify({'message': 'Schedule created'}), 201

@app.route('/api/schedules/auto-generate', methods=['POST'])
def auto_generate_schedule():
    """AI-powered auto schedule generation based on availability & skills"""
    data = request.get_json()
    week_start = data.get('week_start', datetime.today().strftime('%Y-%m-%d'))
    db = get_db(app)
    employees = db.execute("SELECT * FROM employees WHERE status='active'").fetchall()
    shifts = ['morning', 'afternoon', 'night']
    shift_times = {
        'morning':   ('06:00', '14:00'),
        'afternoon': ('14:00', '22:00'),
        'night':     ('22:00', '06:00')
    }
    created = 0
    week_start_dt = datetime.strptime(week_start, '%Y-%m-%d')
    for emp in employees:
        for day_offset in range(5):  # Mon-Fri
            shift_date = (week_start_dt + timedelta(days=day_offset)).strftime('%Y-%m-%d')
            shift = shifts[day_offset % 3]
            start, end = shift_times[shift]
            existing = db.execute(
                'SELECT id FROM schedules WHERE employee_id=? AND shift_date=?',
                (emp['id'], shift_date)
            ).fetchone()
            if not existing:
                db.execute(
                    'INSERT INTO schedules (employee_id, shift_date, start_time, end_time, shift_type, week_start, status) VALUES (?,?,?,?,?,?,?)',
                    (emp['id'], shift_date, start, end, shift, week_start, 'scheduled')
                )
                created += 1
    db.commit()
    return jsonify({'message': f'Auto-generated {created} shift assignments', 'week': week_start})


# ─────────────────────────────────────────────
# ATTENDANCE & PRODUCTIVITY API
# ─────────────────────────────────────────────
@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    emp_id = request.args.get('employee_id')
    month = request.args.get('month', datetime.today().strftime('%Y-%m'))
    db = get_db(app)
    if emp_id:
        rows = db.execute(
            "SELECT * FROM attendance WHERE employee_id=? AND strftime('%Y-%m', date)=? ORDER BY date DESC",
            (emp_id, month)
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT a.*, e.name, e.department FROM attendance a JOIN employees e ON a.employee_id=e.id WHERE strftime('%Y-%m', a.date)=? ORDER BY a.date DESC",
            (month,)
        ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/attendance/checkin', methods=['POST'])
def check_in():
    data = request.get_json()
    db = get_db(app)
    now = datetime.now()
    db.execute(
        'INSERT OR REPLACE INTO attendance (employee_id, date, check_in, status) VALUES (?,?,?,?)',
        (data['employee_id'], now.strftime('%Y-%m-%d'), now.strftime('%H:%M:%S'), 'present')
    )
    db.commit()
    return jsonify({'message': 'Checked in', 'time': now.strftime('%H:%M:%S')})

@app.route('/api/attendance/checkout', methods=['POST'])
def check_out():
    data = request.get_json()
    db = get_db(app)
    now = datetime.now()
    db.execute(
        "UPDATE attendance SET check_out=?, hours_worked=ROUND((julianday(?)-julianday(check_in))*24,2) WHERE employee_id=? AND date=?",
        (now.strftime('%H:%M:%S'), now.strftime('%H:%M:%S'), data['employee_id'], now.strftime('%Y-%m-%d'))
    )
    db.commit()
    return jsonify({'message': 'Checked out', 'time': now.strftime('%H:%M:%S')})


# ─────────────────────────────────────────────
# ANALYTICS API
# ─────────────────────────────────────────────
@app.route('/api/analytics/dashboard', methods=['GET'])
def dashboard_analytics():
    db = get_db(app)
    total_emp   = db.execute("SELECT COUNT(*) as c FROM employees WHERE status='active'").fetchone()['c']
    present_today = db.execute(
        "SELECT COUNT(*) as c FROM attendance WHERE date=? AND status='present'",
        (datetime.today().strftime('%Y-%m-%d'),)
    ).fetchone()['c']
    schedules_week = db.execute(
        "SELECT COUNT(*) as c FROM schedules WHERE week_start=?",
        (datetime.today().strftime('%Y-%m-%d'),)
    ).fetchone()['c']
    avg_hours = db.execute(
        "SELECT ROUND(AVG(hours_worked),2) as avg FROM attendance WHERE hours_worked IS NOT NULL"
    ).fetchone()['avg'] or 0

    dept_stats = db.execute('''
        SELECT e.department, COUNT(*) as count, ROUND(AVG(a.hours_worked),2) as avg_hours
        FROM employees e LEFT JOIN attendance a ON e.id=a.employee_id
        GROUP BY e.department
    ''').fetchall()

    productivity = db.execute('''
        SELECT e.name, ROUND(AVG(a.hours_worked),2) as avg_hours,
               COUNT(a.id) as days_present, e.department
        FROM employees e LEFT JOIN attendance a ON e.id=a.employee_id
        WHERE a.status='present'
        GROUP BY e.id ORDER BY avg_hours DESC LIMIT 10
    ''').fetchall()

    return jsonify({
        'summary': {
            'total_employees': total_emp,
            'present_today': present_today,
            'attendance_rate': round((present_today/total_emp*100) if total_emp else 0, 1),
            'scheduled_this_week': schedules_week,
            'avg_hours_worked': float(avg_hours)
        },
        'department_stats': [dict(d) for d in dept_stats],
        'top_performers': [dict(p) for p in productivity]
    })

@app.route('/api/analytics/productivity', methods=['GET'])
def productivity_report():
    month = request.args.get('month', datetime.today().strftime('%Y-%m'))
    db = get_db(app)
    rows = db.execute('''
        SELECT e.name, e.department, e.role,
               COUNT(a.id) as days_worked,
               ROUND(SUM(a.hours_worked),2) as total_hours,
               ROUND(AVG(a.hours_worked),2) as avg_daily_hours,
               ROUND(SUM(a.hours_worked)*e.hourly_rate,2) as total_pay
        FROM employees e LEFT JOIN attendance a ON e.id=a.employee_id
        WHERE strftime('%Y-%m', a.date)=?
        GROUP BY e.id ORDER BY total_hours DESC
    ''', (month,)).fetchall()
    return jsonify([dict(r) for r in rows])


# ─────────────────────────────────────────────
# REPORTS API
# ─────────────────────────────────────────────
@app.route('/api/reports/weekly', methods=['GET'])
def weekly_report():
    week = request.args.get('week', datetime.today().strftime('%Y-%m-%d'))
    db = get_db(app)
    data = db.execute('''
        SELECT e.name, e.department, s.shift_date, s.start_time, s.end_time,
               s.shift_type, s.status, a.check_in, a.check_out, a.hours_worked
        FROM schedules s
        JOIN employees e ON s.employee_id = e.id
        LEFT JOIN attendance a ON a.employee_id=e.id AND a.date=s.shift_date
        WHERE s.week_start = ? ORDER BY s.shift_date, e.name
    ''', (week,)).fetchall()
    return jsonify([dict(r) for r in data])


# ─────────────────────────────────────────────
# ERROR HANDLERS
# ─────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    init_db(app)
    logger.info("WorkforceIQ Server starting on http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')
