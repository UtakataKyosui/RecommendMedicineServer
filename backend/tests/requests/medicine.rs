use backend::app::App;
use loco_rs::testing::prelude::*;
use serial_test::serial;

#[tokio::test]
#[serial]
async fn can_get_medicines() {
    request::<App, _, _>(|request, _ctx| async move {
        let res = request.get("/api/medicines/").await;
        assert_eq!(res.status_code(), 200);
        
        // Check that response is JSON array
        let body = res.text();
        assert!(body.starts_with('['), "Response should be JSON array");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_create_medicine() {
    request::<App, _, _>(|request, _ctx| async move {
        let payload = serde_json::json!({
            "name": "Aspirin",
            "description": "Pain reliever",
            "dosage": "100",
            "unit": "mg",
            "user_id": 1,
            "active": true
        });

        let res = request.post("/api/medicines/").json(&payload).await;
        assert_eq!(res.status_code(), 200, "Medicine creation should succeed");
        
        // Verify response contains created medicine data
        let response_text = res.text();
        assert!(response_text.contains("Aspirin"), "Response should contain medicine name");
        assert!(response_text.contains("Pain reliever"), "Response should contain description");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_get_specific_medicine() {
    request::<App, _, _>(|request, _ctx| async move {
        // First create a medicine
        let payload = serde_json::json!({
            "name": "Test Medicine",
            "description": "Test description",
            "dosage": "50",
            "unit": "mg",
            "user_id": 1,
            "active": true
        });

        let create_res = request.post("/api/medicines/").json(&payload).await;
        assert_eq!(create_res.status_code(), 200);
        
        // Parse response to get ID
        let created_medicine: serde_json::Value = serde_json::from_str(&create_res.text()).unwrap();
        let medicine_id = created_medicine["id"].as_i64().unwrap();

        // Now get the specific medicine
        let get_res = request.get(&format!("/api/medicines/{}", medicine_id)).await;
        assert_eq!(get_res.status_code(), 200, "Getting specific medicine should succeed");
        
        let response_text = get_res.text();
        assert!(response_text.contains("Test Medicine"), "Response should contain medicine name");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_update_medicine() {
    request::<App, _, _>(|request, _ctx| async move {
        // First create a medicine
        let payload = serde_json::json!({
            "name": "Original Medicine",
            "description": "Original description", 
            "dosage": "25",
            "unit": "mg",
            "user_id": 1,
            "active": true
        });

        let create_res = request.post("/api/medicines/").json(&payload).await;
        assert_eq!(create_res.status_code(), 200);
        
        let created_medicine: serde_json::Value = serde_json::from_str(&create_res.text()).unwrap();
        let medicine_id = created_medicine["id"].as_i64().unwrap();

        // Update the medicine
        let update_payload = serde_json::json!({
            "name": "Updated Medicine",
            "description": "Updated description",
            "dosage": "50", 
            "unit": "mg",
            "user_id": 1,
            "active": false
        });

        let update_res = request.put(&format!("/api/medicines/{}", medicine_id))
            .json(&update_payload).await;
        assert_eq!(update_res.status_code(), 200, "Medicine update should succeed");
        
        let response_text = update_res.text();
        assert!(response_text.contains("Updated Medicine"), "Response should contain updated name");
        assert!(response_text.contains("Updated description"), "Response should contain updated description");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn can_delete_medicine() {
    request::<App, _, _>(|request, _ctx| async move {
        // First create a medicine
        let payload = serde_json::json!({
            "name": "Medicine to Delete",
            "description": "Will be deleted",
            "dosage": "10",
            "unit": "mg", 
            "user_id": 1,
            "active": true
        });

        let create_res = request.post("/api/medicines/").json(&payload).await;
        assert_eq!(create_res.status_code(), 200);
        
        let created_medicine: serde_json::Value = serde_json::from_str(&create_res.text()).unwrap();
        let medicine_id = created_medicine["id"].as_i64().unwrap();

        // Delete the medicine
        let delete_res = request.delete(&format!("/api/medicines/{}", medicine_id)).await;
        assert_eq!(delete_res.status_code(), 200, "Medicine deletion should succeed");

        // Verify medicine is deleted by trying to get it
        let get_res = request.get(&format!("/api/medicines/{}", medicine_id)).await;
        assert_eq!(get_res.status_code(), 404, "Deleted medicine should not be found");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn handles_invalid_medicine_data() {
    request::<App, _, _>(|request, _ctx| async move {
        // Test with missing required fields
        let invalid_payload = serde_json::json!({
            "description": "Missing name and user_id"
        });

        let res = request.post("/api/medicines/").json(&invalid_payload).await;
        assert_ne!(res.status_code(), 200, "Invalid medicine data should not succeed");
        let status = res.status_code();
        assert!(
            status == 400 || status == 422 || status == 500,
            "Should return client or server error for invalid data, got: {}", status
        );
    })
    .await;
}

#[tokio::test]
#[serial]
async fn handles_nonexistent_medicine() {
    request::<App, _, _>(|request, _ctx| async move {
        // Try to get non-existent medicine
        let get_res = request.get("/api/medicines/99999").await;
        assert_eq!(get_res.status_code(), 404, "Non-existent medicine should return 404");

        // Try to update non-existent medicine
        let update_payload = serde_json::json!({
            "name": "Updated",
            "user_id": 1
        });
        let update_res = request.put("/api/medicines/99999").json(&update_payload).await;
        assert_eq!(update_res.status_code(), 404, "Updating non-existent medicine should return 404");

        // Try to delete non-existent medicine
        let delete_res = request.delete("/api/medicines/99999").await;
        assert_eq!(delete_res.status_code(), 404, "Deleting non-existent medicine should return 404");
    })
    .await;
}
