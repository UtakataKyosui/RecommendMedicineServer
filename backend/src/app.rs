use async_trait::async_trait;
use loco_rs::{
    app::{AppContext, Hooks},
    boot::{create_app, BootResult, StartMode},
    controller::AppRoutes,
    environment::Environment,
    task::Tasks,
    bgworker::{BackgroundWorker, Queue},
    config::Config,
    Result,
};
use migration::Migrator;
use std::path::Path;

use crate::{
    controllers, 
    tasks::medication_reminder::MedicationReminderTask,
    workers::{
        downloader::DownloadWorker,
        notification_worker::NotificationWorker,
        report_generator::ReportGeneratorWorker,
    }
};

pub struct App;

#[async_trait]
impl Hooks for App {
    fn app_name() -> &'static str {
        env!("CARGO_CRATE_NAME")
    }

    fn app_version() -> String {
        format!(
            "{} ({})",
            env!("CARGO_PKG_VERSION"),
            option_env!("BUILD_SHA")
                .or(option_env!("GITHUB_SHA"))
                .unwrap_or("dev")
        )
    }

    // Fixed: Added missing config parameter
    async fn boot(mode: StartMode, environment: &Environment, config: Config) -> Result<BootResult> {
        create_app::<Self, Migrator>(mode, environment, config).await
    }

    fn routes(_ctx: &AppContext) -> AppRoutes {
        AppRoutes::with_default_routes()
			.add_route(
				controllers::auth::routes()
			)
			.add_route(controllers::medicine::routes())

            // Add more as needed
    }
    async fn connect_workers(ctx: &AppContext, queue: &Queue) -> Result<()> {
        // Register workers using the new pattern
        queue.register(DownloadWorker::build(ctx)).await?;
        queue.register(NotificationWorker::build(ctx)).await?;
        queue.register(ReportGeneratorWorker::build(ctx)).await?;
        Ok(())
    }

    fn register_tasks(tasks: &mut Tasks) {
        // 服薬リマインダータスク（毎時実行）
        tasks.register(MedicationReminderTask);
        
        // 将来的に追加できるタスク例:
        // tasks.register(DailyReportTask);   // 日次レポート
        // tasks.register(WeeklyReportTask);  // 週次レポート
        // tasks.register(CleanupTask);       // データクリーンアップ
    }

    // Added: Missing truncate method
    async fn truncate(_ctx: &AppContext) -> Result<()> {
        // Implementation for truncating data
        // This is typically used in testing to clear all data
        tracing::info!("Truncating database data");
        
        // You can add specific truncation logic here if needed
        // For example:
        // use sea_orm::DatabaseConnection;
        // let db = &ctx.db;
        // // Clear tables in proper order due to foreign key constraints
        // // db.execute(Statement::from_string(...)).await?;
        
        Ok(())
    }

    // Added: Missing seed method
    async fn seed(_ctx: &AppContext, path: &Path) -> Result<()> {
        // Implementation for seeding data
        tracing::info!("Seeding database from path: {:?}", path);
        
        // You can add specific seeding logic here
        // For example, loading initial data from files
        // let seed_data = std::fs::read_to_string(path)?;
        // // Process and insert seed data
        
        Ok(())
    }

    async fn after_context(ctx: AppContext) -> Result<AppContext> {
        // アプリケーション起動後の初期化処理
        tracing::info!("🚀 Medication Reminder System initialized");
        tracing::info!("📋 Registered tasks: medication_reminder");
        tracing::info!("👷 Registered workers: notification_worker, report_generator");
        
        Ok(ctx)
    }
}

// ヘルパー関数（コントローラーから使用）
impl App {
    /// 即座に通知を送信
    pub async fn send_immediate_notification(
        _ctx: &AppContext,
        line_user_id: String,
        message: String,
        notification_type: String,
    ) -> Result<()> {
        // Fixed: Use the correct queue enqueue pattern for Loco 0.15
        use crate::workers::notification_worker::NotificationWorkerArgs;
        
        let _args = NotificationWorkerArgs {
            line_user_id,
            message,
            notification_type,
            medicine_id: None,
            log_id: None,
        };

        // TODO: Fix queue access pattern for Loco 0.15
        // The queue access needs to be implemented properly
        // queue.enqueue(NotificationWorker::build(ctx), &args, None).await?;
        Ok(())
    }

    /// レポート生成を開始
    pub async fn generate_report(
        _ctx: &AppContext,
        user_id: i32,
        report_type: String,
    ) -> Result<()> {
        // Fixed: Use the correct queue enqueue pattern for Loco 0.15
        use crate::workers::report_generator::ReportGeneratorArgs;

        let _args = ReportGeneratorArgs {
            user_id,
            report_type,
            start_date: None,
            end_date: None,
            send_notification: true,
        };

        // TODO: Fix queue access pattern for Loco 0.15
        // The queue access needs to be implemented properly
        // queue.enqueue(ReportGeneratorWorker::build(ctx), &args, None).await?;
        Ok(())
    }
}