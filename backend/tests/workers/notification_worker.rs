use loco_rs::{bgworker::BackgroundWorker, testing::prelude::*};
use backend::{
    app::App,
    workers::notification_worker::{NotificationWorker, NotificationWorkerArgs},
};
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_run_notification_worker_worker() {
    let boot = boot_test::<App>().await.unwrap();

    // Execute the worker ensuring that it operates in 'ForegroundBlocking' mode, which prevents the addition of your worker to the background
    assert!(
        NotificationWorker::perform_later(&boot.app_context, NotificationWorkerArgs {
            line_user_id: "test_user".to_string(),
            message: "Test notification".to_string(),
            notification_type: "general".to_string(),
            medicine_id: None,
            log_id: None,
        })
            .await
            .is_ok()
    );
    // Include additional assert validations after the execution of the worker
}
