use loco_rs::{bgworker::BackgroundWorker, testing::prelude::*};
use backend::{
    app::App,
    workers::report_generator::{ReportGeneratorWorker, ReportGeneratorArgs},
};
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_run_report_generator_worker() {
    let boot = boot_test::<App>().await.unwrap();

    // Execute the worker ensuring that it operates in 'ForegroundBlocking' mode, which prevents the addition of your worker to the background
    assert!(
        ReportGeneratorWorker::perform_later(&boot.app_context, ReportGeneratorArgs {
            user_id: 1,
            report_type: "daily".to_string(),
            start_date: None,
            end_date: None,
            send_notification: false,
        })
            .await
            .is_ok()
    );
    // Include additional assert validations after the execution of the worker
}
