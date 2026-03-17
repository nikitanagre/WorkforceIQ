package com.workforceiq;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;

/**
 * WorkforceIQ - Java Scheduling Utilities
 * Handles shift validation, conflict detection, and schedule generation.
 * Integrates with the Python REST API backend via HTTP.
 */
public class SchedulerUtil {

    // ─── Shift Types ───
    public enum ShiftType {
        MORNING("06:00", "14:00"),
        AFTERNOON("14:00", "22:00"),
        NIGHT("22:00", "06:00");

        public final String startTime;
        public final String endTime;

        ShiftType(String start, String end) {
            this.startTime = start;
            this.endTime   = end;
        }
    }

    // ─── Employee Record ───
    public static class Employee {
        public int    id;
        public String name;
        public String department;
        public String role;
        public double hourlyRate;
        public String status;

        public Employee(int id, String name, String department, String role, double hourlyRate) {
            this.id          = id;
            this.name        = name;
            this.department  = department;
            this.role        = role;
            this.hourlyRate  = hourlyRate;
            this.status      = "active";
        }

        @Override
        public String toString() {
            return String.format("Employee{id=%d, name='%s', dept='%s', role='%s', rate=%.2f}",
                id, name, department, role, hourlyRate);
        }
    }

    // ─── Shift Record ───
    public static class Shift {
        public int        employeeId;
        public String     employeeName;
        public LocalDate  date;
        public ShiftType  type;
        public String     status;

        public Shift(int employeeId, String employeeName, LocalDate date, ShiftType type) {
            this.employeeId   = employeeId;
            this.employeeName = employeeName;
            this.date         = date;
            this.type         = type;
            this.status       = "scheduled";
        }

        public double getDurationHours() {
            LocalTime start = LocalTime.parse(type.startTime);
            LocalTime end   = LocalTime.parse(type.endTime);
            if (end.isBefore(start)) return 24.0 - start.getHour() + end.getHour();
            return end.getHour() - start.getHour();
        }

        public double getLaborCost(double hourlyRate) {
            return getDurationHours() * hourlyRate;
        }

        @Override
        public String toString() {
            return String.format("Shift{employee='%s', date=%s, type=%s, %s-%s}",
                employeeName, date, type, type.startTime, type.endTime);
        }
    }

    // ─── Schedule Generator ───
    public static List<Shift> generateWeeklySchedule(List<Employee> employees, LocalDate weekStart) {
        List<Shift>   schedule   = new ArrayList<>();
        ShiftType[]   shiftCycle = ShiftType.values();
        List<Employee> active    = employees.stream()
            .filter(e -> "active".equals(e.status))
            .collect(Collectors.toList());

        for (int empIdx = 0; empIdx < active.size(); empIdx++) {
            Employee emp = active.get(empIdx);
            for (int dayOffset = 0; dayOffset < 5; dayOffset++) {
                LocalDate shiftDate = weekStart.plusDays(dayOffset);
                if (shiftDate.getDayOfWeek() == DayOfWeek.SATURDAY ||
                    shiftDate.getDayOfWeek() == DayOfWeek.SUNDAY) continue;

                ShiftType shiftType = shiftCycle[(empIdx + dayOffset) % shiftCycle.length];
                schedule.add(new Shift(emp.id, emp.name, shiftDate, shiftType));
            }
        }
        return schedule;
    }

    // ─── Conflict Detector ───
    public static List<String> detectConflicts(List<Shift> schedule) {
        List<String> conflicts = new ArrayList<>();
        Map<String, List<Shift>> byEmployeeDay = new HashMap<>();

        for (Shift s : schedule) {
            String key = s.employeeId + "_" + s.date.toString();
            byEmployeeDay.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }

        for (Map.Entry<String, List<Shift>> entry : byEmployeeDay.entrySet()) {
            if (entry.getValue().size() > 1) {
                conflicts.add(String.format(
                    "CONFLICT: Employee %s has %d shifts on %s",
                    entry.getValue().get(0).employeeName,
                    entry.getValue().size(),
                    entry.getValue().get(0).date
                ));
            }
        }
        return conflicts;
    }

    // ─── Overtime Calculator ───
    public static Map<String, Double> calculateWeeklyHours(List<Shift> schedule) {
        Map<String, Double> hoursMap = new HashMap<>();
        for (Shift s : schedule) {
            hoursMap.merge(s.employeeName, s.getDurationHours(), Double::sum);
        }
        return hoursMap;
    }

    // ─── Labor Cost Report ───
    public static double calculateTotalLaborCost(List<Shift> schedule, Map<Integer, Double> rates) {
        return schedule.stream()
            .mapToDouble(s -> s.getLaborCost(rates.getOrDefault(s.employeeId, 25.0)))
            .sum();
    }

    // ─── Coverage Validator ───
    public static Map<String, Integer> getDailyCoverage(List<Shift> schedule) {
        Map<String, Integer> coverage = new TreeMap<>();
        for (Shift s : schedule) {
            coverage.merge(s.date.toString(), 1, Integer::sum);
        }
        return coverage;
    }

    // ─── Main Demo ───
    public static void main(String[] args) {
        System.out.println("=== WorkforceIQ Java Scheduler ===\n");

        // Sample employees
        List<Employee> employees = Arrays.asList(
            new Employee(1, "Aarav Sharma",   "Engineering", "Software Engineer", 45.0),
            new Employee(2, "Priya Patel",    "Marketing",   "Marketing Manager", 35.0),
            new Employee(3, "Rohan Mehta",    "Operations",  "Operations Manager",30.0),
            new Employee(4, "Sneha Joshi",    "HR",          "HR Manager",        32.0),
            new Employee(5, "Vikram Singh",   "Sales",       "Account Executive", 38.0),
            new Employee(6, "Ananya Reddy",   "Finance",     "Financial Analyst", 40.0)
        );

        LocalDate weekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        System.out.println("Generating schedule for week: " + weekStart + "\n");

        List<Shift> schedule = generateWeeklySchedule(employees, weekStart);

        // Print schedule
        schedule.forEach(s -> System.out.printf("%-20s | %-12s | %s | %s-%s | %.1fh%n",
            s.employeeName, s.date, s.type, s.type.startTime, s.type.endTime, s.getDurationHours()));

        // Conflict check
        List<String> conflicts = detectConflicts(schedule);
        System.out.println("\n--- Conflict Check ---");
        if (conflicts.isEmpty()) System.out.println("No conflicts detected ✓");
        else conflicts.forEach(System.out::println);

        // Weekly hours
        System.out.println("\n--- Weekly Hours ---");
        Map<String, Double> weeklyHours = calculateWeeklyHours(schedule);
        weeklyHours.forEach((name, hrs) ->
            System.out.printf("%-20s : %.1f hours %s%n", name, hrs, hrs > 40 ? "[OVERTIME]" : ""));

        // Coverage
        System.out.println("\n--- Daily Coverage ---");
        getDailyCoverage(schedule).forEach((date, count) ->
            System.out.printf("%s : %d employees%n", date, count));

        // Labor cost
        Map<Integer, Double> rates = new HashMap<>();
        employees.forEach(e -> rates.put(e.id, e.hourlyRate));
        double totalCost = calculateTotalLaborCost(schedule, rates);
        System.out.printf("%n--- Total Labor Cost: $%.2f ----%n", totalCost);
    }
}
