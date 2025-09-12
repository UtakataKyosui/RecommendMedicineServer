use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter};

use crate::models::_entities::users;
// use crate::models::_entities::push_subscriptions; // Will be available after migration
use crate::controllers::push_notifications::{PushNotificationRequest, send_push_to_user};

#[derive(Debug, Deserialize, Serialize)]
pub struct NotificationWorkerArgs {
    pub user_id: i32,
    pub message: String,
    pub notification_type: String, // "medication_reminder", "missed_medication", "general"
    pub medicine_id: Option<i32>,
    pub log_id: Option<i32>,
    pub title: Option<String>,
}

pub struct NotificationWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<NotificationWorkerArgs> for NotificationWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }
    
    async fn perform(&self, args: NotificationWorkerArgs) -> Result<()> {
        tracing::info!(
            "📱 Sending {} notification to user: {}",
            args.notification_type,
            args.user_id
        );

        let user = users::Entity::find_by_id(args.user_id)
            .one(&self.ctx.db)
            .await?
            .ok_or_else(|| Error::string("User not found"))?;

        // Web Push通知のみを送信
        match self.send_web_push_notification(&args).await {
            Ok(sent_count) => {
                if sent_count > 0 {
                    tracing::info!("✅ Web Push notification sent successfully to {} subscriptions", sent_count);
                } else {
                    tracing::warn!("📱 No active Web Push subscriptions found for user {}", args.user_id);
                    return Err(Error::string("No active notification subscriptions found"));
                }
            }
            Err(e) => {
                tracing::error!("❌ Failed to send Web Push notification to user {}: {}", args.user_id, e);
                return Err(Error::string(&format!("Web Push notification failed: {}", e)));
            }
        };

        // 通知履歴をデータベースに記録
        if let Err(e) = self.log_notification(&args).await {
            tracing::error!("Failed to log notification: {}", e);
        }

        Ok(())
    }
}

impl NotificationWorker {
    /// Web Push通知を送信
    async fn send_web_push_notification(&self, args: &NotificationWorkerArgs) -> Result<i32, Error> {
        let title = args.title.as_deref().unwrap_or_else(|| {
            match args.notification_type.as_str() {
                "medication_reminder" => "🔔 服薬時間です",
                "missed_medication" => "⚠️ 服薬を忘れていませんか？",
                _ => "💊 服薬管理"
            }
        });

        let notification = PushNotificationRequest {
            title: title.to_string(),
            body: args.message.clone(),
            icon: Some("/icons/icon-192x192.png".to_string()),
            badge: Some("/icons/badge-72x72.png".to_string()),
            tag: Some(format!("medication-{}", args.notification_type)),
            data: Some(json!({
                "notification_type": args.notification_type,
                "medicine_id": args.medicine_id,
                "log_id": args.log_id,
                "user_id": args.user_id,
                "url": "/dashboard"
            })),
            actions: Some(vec![
                crate::controllers::push_notifications::NotificationAction {
                    action: "complete".to_string(),
                    title: "服薬完了".to_string(),
                    icon: Some("/icons/check.png".to_string()),
                },
                crate::controllers::push_notifications::NotificationAction {
                    action: "snooze".to_string(),
                    title: "10分後".to_string(),
                    icon: Some("/icons/snooze.png".to_string()),
                },
            ]),
        };

        send_push_to_user(&self.ctx, args.user_id, &notification).await
    }

    // LINE Bot機能は完全に削除されました

    /// 通知履歴をデータベースに記録
    async fn log_notification(&self, args: &NotificationWorkerArgs) -> Result<(), DbErr> {
        // 通知履歴テーブルがあれば記録
        // 今回は簡単のためログ出力のみ
        tracing::info!(
            "Notification logged: user_id={}, type={}, medicine_id={:?}",
            args.user_id,
            args.notification_type,
            args.medicine_id
        );

        // 将来的には notification_logs テーブルを作成して記録
        /*
        let log = notification_logs::ActiveModel {
            line_user_id: Set(args.line_user_id.clone()),
            message: Set(args.message.clone()),
            notification_type: Set(args.notification_type.clone()),
            medicine_id: Set(args.medicine_id),
            sent_at: Set(chrono::Utc::now().naive_utc()),
            status: Set("sent".to_string()),
            ..Default::default()
        };

        notification_logs::Entity::insert(log)
            .exec(&self.ctx.db)
            .await?;
        */

        Ok(())
    }
}

