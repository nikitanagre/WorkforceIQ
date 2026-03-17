"""
WorkforceIQ - Intelligent Scheduling Service
AI-powered scheduling logic: conflict detection, load balancing, recommendations
"""

from datetime import datetime, timedelta
from database.db import get_db
import random


class SchedulingService:

    def __init__(self, app=None):
        self.app = app

    def _db(self):
        return get_db(self.app)

    def detect_conflicts(self, employee_id, shift_date, start_time, end_time):
        """Check for schedule conflicts for an employee on a given day."""
        db = self._db()
        existing = db.execute(
            "SELECT * FROM schedules WHERE employee_id=? AND shift_date=? AND status != 'cancelled'",
            (employee_id, shift_date)
        ).fetchall()
        conflicts = []
        for e in existing:
            if not (end_time <= e['start_time'] or start_time >= e['end_time']):
                conflicts.append({
                    'conflict_id': e['id'],
                    'existing_start': e['start_time'],
                    'existing_end': e['end_time'],
                    'message': f"Time overlap with existing shift {e['start_time']}-{e['end_time']}"
                })
        return conflicts

    def check_overtime(self, employee_id, week_start, additional_hours=0):
        """Check if adding hours would exceed 40h/week."""
        db = self._db()
        result = db.execute(
            "SELECT SUM(hours_worked) as total FROM attendance WHERE employee_id=? AND date >= ?",
            (employee_id, week_start)
        ).fetchone()
        current = result['total'] or 0
        projected = current + additional_hours
        return {
            'current_hours': round(current, 2),
            'projected_hours': round(projected, 2),
            'is_overtime': projected > 40,
            'overtime_hours': max(0, round(projected - 40, 2))
        }

    def recommend_shifts(self, week_start, department=None):
        """Recommend optimal shift assignments based on workload balance."""
        db = self._db()
        query = "SELECT * FROM employees WHERE status='active'"
        params = []
        if department:
            query += " AND department=?"
            params.append(department)
        employees = db.execute(query, params).fetchall()

        recommendations = []
        shifts_cycle = ['morning', 'afternoon', 'night']
        week_dt = datetime.strptime(week_start, '%Y-%m-%d')

        for i, emp in enumerate(employees):
            for day in range(5):
                shift_date = (week_dt + timedelta(days=day)).strftime('%Y-%m-%d')
                shift_type = shifts_cycle[(i + day) % 3]
                recommendations.append({
                    'employee_id': emp['id'],
                    'employee_name': emp['name'],
                    'department': emp['department'],
                    'shift_date': shift_date,
                    'shift_type': shift_type,
                    'reason': f'Balanced rotation for {emp["department"]}'
                })
        return recommendations

    def get_coverage_gaps(self, week_start):
        """Find days/departments with insufficient coverage."""
        db = self._db()
        coverage = db.execute('''
            SELECT s.shift_date, e.department, COUNT(*) as staff_count
            FROM schedules s JOIN employees e ON s.employee_id=e.id
            WHERE s.week_start=? AND s.status != 'cancelled'
            GROUP BY s.shift_date, e.department
        ''', (week_start,)).fetchall()

        min_staff = 2
        gaps = []
        for row in coverage:
            if row['staff_count'] < min_staff:
                gaps.append({
                    'date': row['shift_date'],
                    'department': row['department'],
                    'current_staff': row['staff_count'],
                    'required_staff': min_staff,
                    'gap': min_staff - row['staff_count']
                })
        return gaps

    def calculate_labor_cost(self, week_start):
        """Calculate projected labor cost for a week."""
        db = self._db()
        result = db.execute('''
            SELECT e.name, e.department, e.hourly_rate,
                   COUNT(s.id) as shifts,
                   SUM(
                       (CAST(substr(s.end_time,1,2) AS INTEGER) - CAST(substr(s.start_time,1,2) AS INTEGER)) +
                       CASE WHEN s.end_time < s.start_time THEN 24 ELSE 0 END
                   ) as total_hours
            FROM schedules s JOIN employees e ON s.employee_id=e.id
            WHERE s.week_start=? AND s.status != 'cancelled'
            GROUP BY e.id
        ''', (week_start,)).fetchall()

        breakdown = []
        total_cost = 0
        for r in result:
            hours = r['total_hours'] or 0
            cost = hours * r['hourly_rate']
            total_cost += cost
            breakdown.append({
                'employee': r['name'],
                'department': r['department'],
                'shifts': r['shifts'],
                'hours': hours,
                'rate': r['hourly_rate'],
                'cost': round(cost, 2)
            })

        return {
            'week': week_start,
            'total_cost': round(total_cost, 2),
            'breakdown': breakdown
        }


class ProductivityAnalyzer:

    def __init__(self, app=None):
        self.app = app

    def _db(self):
        return get_db(self.app)

    def get_employee_score(self, employee_id, weeks=4):
        """Compute composite productivity score for an employee."""
        db = self._db()
        metrics = db.execute(
            "SELECT * FROM productivity_metrics WHERE employee_id=? ORDER BY week_start DESC LIMIT ?",
            (employee_id, weeks)
        ).fetchall()

        if not metrics:
            return {'score': 0, 'trend': 'no_data'}

        scores = [
            (m['quality_score'] * 0.4 + m['efficiency_score'] * 0.4 + (m['peer_rating'] / 5 * 100) * 0.2)
            for m in metrics
        ]
        avg_score = round(sum(scores) / len(scores), 2)
        trend = 'improving' if len(scores) > 1 and scores[0] > scores[-1] else \
                'declining' if len(scores) > 1 and scores[0] < scores[-1] else 'stable'

        return {
            'employee_id': employee_id,
            'avg_score': avg_score,
            'trend': trend,
            'weeks_analyzed': len(scores),
            'latest_score': round(scores[0], 2) if scores else 0
        }

    def department_leaderboard(self):
        """Rank departments by average productivity."""
        db = self._db()
        rows = db.execute('''
            SELECT e.department,
                   ROUND(AVG(pm.quality_score),1) as avg_quality,
                   ROUND(AVG(pm.efficiency_score),1) as avg_efficiency,
                   ROUND(AVG(pm.peer_rating),2) as avg_peer,
                   COUNT(DISTINCT e.id) as headcount
            FROM employees e
            JOIN productivity_metrics pm ON e.id=pm.employee_id
            GROUP BY e.department ORDER BY avg_quality DESC
        ''').fetchall()
        return [dict(r) for r in rows]

    def attendance_trends(self, months=3):
        """Get attendance trend data for charting."""
        db = self._db()
        rows = db.execute('''
            SELECT strftime('%Y-%m', date) as month,
                   COUNT(*) as total,
                   SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present,
                   SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent,
                   SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) as late,
                   ROUND(AVG(hours_worked),2) as avg_hours
            FROM attendance
            GROUP BY month ORDER BY month DESC LIMIT ?
        ''', (months,)).fetchall()
        return [dict(r) for r in rows]
