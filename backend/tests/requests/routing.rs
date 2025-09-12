use backend::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_all_routes_registration() {
    request::<App, _, _>(|request, _ctx| async move {
        // Test auth routes
        let auth_response = request.post("/api/auth/register").await;
        assert_ne!(auth_response.status_code(), 404, "Auth routes should be registered");

        // Test medicine routes
        let medicine_response = request.get("/api/medicines/").await;
        assert_eq!(medicine_response.status_code(), 200, "Medicine routes should be registered");

        // Test medication_schedule routes
        let schedule_response = request.get("/api/medication_schedules/").await;
        assert_eq!(schedule_response.status_code(), 200, "Schedule routes should be registered");

        // Test medication_log routes
        let log_response = request.get("/api/medication_logs/").await;
        assert_eq!(log_response.status_code(), 200, "Log routes should be registered");

        // Test webhook_line routes
        let webhook_response = request.get("/api/webhook_lines/").await;
        assert_eq!(webhook_response.status_code(), 200, "Webhook routes should be registered");

        // Test reports routes
        let reports_response = request.get("/api/reports/").await;
        assert_eq!(reports_response.status_code(), 200, "Reports routes should be registered");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn test_auth_endpoints() {
    request::<App, _, _>(|request, _ctx| async move {
        // Test register endpoint
        let register_response = request.post("/api/auth/register").await;
        assert_ne!(register_response.status_code(), 404, "/api/auth/register should exist");

        // Test login endpoint  
        let login_response = request.post("/api/auth/login").await;
        assert_ne!(login_response.status_code(), 404, "/api/auth/login should exist");

        // Test forgot endpoint
        let forgot_response = request.post("/api/auth/forgot").await;
        assert_ne!(forgot_response.status_code(), 404, "/api/auth/forgot should exist");

        // Test reset endpoint
        let reset_response = request.post("/api/auth/reset").await;
        assert_ne!(reset_response.status_code(), 404, "/api/auth/reset should exist");

        // Test current endpoint (requires auth, so 401/422 is expected)
        let current_response = request.get("/api/auth/current").await;
        let status = current_response.status_code();
        assert!(
            status == 401 || status == 422,
            "/api/auth/current should exist but require auth, got: {}", status
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn test_medicine_crud_endpoints() {
    request::<App, _, _>(|request, _ctx| async move {
        // Test list medicines
        let list_response = request.get("/api/medicines/").await;
        assert_eq!(list_response.status_code(), 200, "GET /api/medicines/ should work");

        // Test create medicine (without data, expect validation error)
        let create_response = request.post("/api/medicines/").await;
        assert_ne!(create_response.status_code(), 404, "POST /api/medicines/ should exist");

        // Test get specific medicine (non-existent ID, expect 404 or similar)
        let get_response = request.get("/api/medicines/999").await;
        assert_ne!(get_response.status_code(), 500, "GET /api/medicines/999 should not crash");

        // Test update medicine (non-existent ID)
        let update_response = request.put("/api/medicines/999").await;
        assert_ne!(update_response.status_code(), 500, "PUT /api/medicines/999 should not crash");

        // Test delete medicine (non-existent ID)
        let delete_response = request.delete("/api/medicines/999").await;
        assert_ne!(delete_response.status_code(), 500, "DELETE /api/medicines/999 should not crash");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn test_medication_schedule_crud_endpoints() {
    request::<App, _, _>(|request, _ctx| async move {
        // Test list schedules
        let list_response = request.get("/api/medication_schedules/").await;
        assert_eq!(list_response.status_code(), 200, "GET /api/medication_schedules/ should work");

        // Test create schedule
        let create_response = request.post("/api/medication_schedules/").await;
        assert_ne!(create_response.status_code(), 404, "POST /api/medication_schedules/ should exist");

        // Test other CRUD operations
        let get_response = request.get("/api/medication_schedules/999").await;
        assert_ne!(get_response.status_code(), 500, "GET /api/medication_schedules/999 should not crash");

        let update_response = request.put("/api/medication_schedules/999").await;
        assert_ne!(update_response.status_code(), 500, "PUT /api/medication_schedules/999 should not crash");

        let delete_response = request.delete("/api/medication_schedules/999").await;
        assert_ne!(delete_response.status_code(), 500, "DELETE /api/medication_schedules/999 should not crash");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn test_medication_log_crud_endpoints() {
    request::<App, _, _>(|request, _ctx| async move {
        // Test list logs
        let list_response = request.get("/api/medication_logs/").await;
        assert_eq!(list_response.status_code(), 200, "GET /api/medication_logs/ should work");

        // Test create log
        let create_response = request.post("/api/medication_logs/").await;
        assert_ne!(create_response.status_code(), 404, "POST /api/medication_logs/ should exist");

        // Test other CRUD operations
        let get_response = request.get("/api/medication_logs/999").await;
        assert_ne!(get_response.status_code(), 500, "GET /api/medication_logs/999 should not crash");

        let update_response = request.put("/api/medication_logs/999").await;
        assert_ne!(update_response.status_code(), 500, "PUT /api/medication_logs/999 should not crash");

        let delete_response = request.delete("/api/medication_logs/999").await;
        assert_ne!(delete_response.status_code(), 500, "DELETE /api/medication_logs/999 should not crash");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn test_webhook_and_reports_endpoints() {
    request::<App, _, _>(|request, _ctx| async move {
        // Test webhook endpoint
        let webhook_response = request.get("/api/webhook_lines/").await;
        assert_eq!(webhook_response.status_code(), 200, "GET /api/webhook_lines/ should work");

        // Test reports endpoint
        let reports_response = request.get("/api/reports/").await;
        assert_eq!(reports_response.status_code(), 200, "GET /api/reports/ should work");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn test_nonexistent_routes() {
    request::<App, _, _>(|request, _ctx| async move {
        // Test non-existent routes return 404
        let response1 = request.get("/api/nonexistent").await;
        assert_eq!(response1.status_code(), 404, "Non-existent route should return 404");

        let response2 = request.get("/api/medicines/invalid/route").await;
        assert_eq!(response2.status_code(), 404, "Invalid medicine route should return 404");

        let response3 = request.get("/api/unknown_controller/").await;
        assert_eq!(response3.status_code(), 404, "Unknown controller should return 404");
    })
    .await;
}