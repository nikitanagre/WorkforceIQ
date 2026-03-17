package com.workforceiq;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * WorkforceIQ - Java REST API Client
 * Calls the Python Flask REST API from Java.
 * Demonstrates Java integration with REST APIs.
 */
public class ApiClient {

    private static final String BASE_URL = "http://localhost:5000/api";
    private final HttpClient client;

    public ApiClient() {
        this.client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public String get(String endpoint) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + endpoint))
            .header("Content-Type", "application/json")
            .GET()
            .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    public String post(String endpoint, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + endpoint))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    // ─── Convenience methods ───
    public String getEmployees()                    throws Exception { return get("/employees"); }
    public String getDashboard()                    throws Exception { return get("/analytics/dashboard"); }
    public String getSchedules(String weekStart)    throws Exception { return get("/schedules?week=" + weekStart); }
    public String getAttendance(String month)       throws Exception { return get("/attendance?month=" + month); }
    public String healthCheck()                     throws Exception { return get("/health"); }

    public static void main(String[] args) {
        ApiClient api = new ApiClient();
        System.out.println("=== WorkforceIQ Java API Client ===\n");
        try {
            System.out.println("Health: "    + api.healthCheck());
            System.out.println("Dashboard: " + api.getDashboard());
        } catch (Exception e) {
            System.out.println("API not running. Start with: cd backend && python app.py");
            System.out.println("Error: " + e.getMessage());
        }
    }
}
