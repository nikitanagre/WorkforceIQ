"""
WorkforceIQ - Data Models (Pydantic-style dataclasses)
Used for validation and serialization throughout the system.
"""

from dataclasses import dataclass, field, asdict
from typing import Optional
from datetime import datetime


@dataclass
class Employee:
    name: str
    role: str
    department: str
    email: str
    phone: str = ''
    hire_date: str = field(default_factory=lambda: datetime.today().strftime('%Y-%m-%d'))
    status: str = 'active'
    hourly_rate: float = 25.0
    id: Optional[int] = None
    created_at: Optional[str] = None

    def validate(self):
        errors = []
        if not self.name or len(self.name.strip()) < 2:
            errors.append('Name must be at least 2 characters')
        if '@' not in self.email:
            errors.append('Invalid email address')
        if self.hourly_rate <= 0:
            errors.append('Hourly rate must be positive')
        if self.status not in ('active', 'inactive', 'on_leave'):
            errors.append('Invalid status value')
        return errors

    def to_dict(self):
        return asdict(self)


@dataclass
class Schedule:
    employee_id: int
    shift_date: str
    start_time: str
    end_time: str
    week_start: str
    shift_type: str = 'morning'
    status: str = 'scheduled'
    notes: str = ''
    id: Optional[int] = None

    def calculate_hours(self):
        """Calculate shift duration in hours"""
        fmt = '%H:%M'
        try:
            s = datetime.strptime(self.start_time[:5], fmt)
            e = datetime.strptime(self.end_time[:5], fmt)
            diff = (e - s).seconds / 3600
            return diff if diff > 0 else diff + 24  # handle overnight
        except Exception:
            return 0.0

    def to_dict(self):
        d = asdict(self)
        d['duration_hours'] = self.calculate_hours()
        return d


@dataclass
class Attendance:
    employee_id: int
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    hours_worked: float = 0.0
    status: str = 'present'
    notes: str = ''
    id: Optional[int] = None

    def is_late(self, expected_start='09:00'):
        if self.check_in:
            return self.check_in > expected_start + ':00'
        return False

    def to_dict(self):
        return asdict(self)


@dataclass
class LeaveRequest:
    employee_id: int
    leave_type: str
    start_date: str
    end_date: str
    reason: str = ''
    status: str = 'pending'
    id: Optional[int] = None

    def duration_days(self):
        s = datetime.strptime(self.start_date, '%Y-%m-%d')
        e = datetime.strptime(self.end_date, '%Y-%m-%d')
        return (e - s).days + 1

    def to_dict(self):
        d = asdict(self)
        d['duration_days'] = self.duration_days()
        return d


@dataclass
class ProductivityMetric:
    employee_id: int
    week_start: str
    tasks_completed: int = 0
    quality_score: float = 0.0
    efficiency_score: float = 0.0
    peer_rating: float = 0.0
    notes: str = ''
    id: Optional[int] = None

    def overall_score(self):
        return round(
            (self.quality_score * 0.4 +
             self.efficiency_score * 0.4 +
             (self.peer_rating / 5.0 * 100) * 0.2), 2
        )

    def to_dict(self):
        d = asdict(self)
        d['overall_score'] = self.overall_score()
        return d
