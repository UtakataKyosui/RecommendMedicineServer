use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Deserialize, Serialize)]
pub struct NotificationWorkerArgs {
    pub line_user_id: String,
    pub message: String,
    pub notification_type: String, // "medication_reminder", "missed_medication", "general"
    pub medicine_id: Option<i32>,
    pub log_id: Option<i32>,
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
            "📱 Sending {} notification to LINE user: {}",
            args.notification_type,
            args.line_user_id
        );

        // LINE Bot APIを通じて通知を送信
        match self.send_line_notification(&args).await {
            Ok(_) => {
                tracing::info!("✅ LINE notification sent successfully to {}", args.line_user_id);
                
                // 通知履歴をデータベースに記録
                if let Err(e) = self.log_notification(&args).await {
                    tracing::error!("Failed to log notification: {}", e);
                }
            }
            Err(e) => {
                tracing::error!("❌ Failed to send LINE notification to {}: {}", args.line_user_id, e);
                return Err(loco_rs::Error::string(&format!("LINE notification failed: {}", e)));
            }
        }

        Ok(())
    }
}

impl NotificationWorker {
    /// LINE Bot APIに通知を送信
    async fn send_line_notification(&self, args: &NotificationWorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let channel_access_token = std::env::var("LINE_CHANNEL_ACCESS_TOKEN")
            .map_err(|_| "LINE_CHANNEL_ACCESS_TOKEN environment variable not found")?;

        if channel_access_token == "YOUR_LINE_CHANNEL_ACCESS_TOKEN" {
            tracing::warn!("LINE_CHANNEL_ACCESS_TOKEN is not properly configured. Skipping notification.");
            return Ok(());
        }

        let client = reqwest::Client::new();
        
        // メッセージタイプに応じてLINE Flexメッセージまたは通常テキストを使い分け
        let message_payload = match args.notification_type.as_str() {
            "medication_reminder" => self.create_medication_reminder_flex_message(args),
            "missed_medication" => self.create_missed_medication_flex_message(args),
            _ => json!({
                "type": "text",
                "text": args.message
            })
        };

        let push_message = json!({
            "to": args.line_user_id,
            "messages": [message_payload]
        });

        let response = client
            .post("https://api.line.me/v2/bot/message/push")
            .header("Authorization", format!("Bearer {}", channel_access_token))
            .header("Content-Type", "application/json")
            .json(&push_message)
            .send()
            .await?;

        if response.status().is_success() {
            tracing::debug!("LINE API response: {}", response.status());
            Ok(())
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            tracing::error!("LINE API error: {} - {}", status, error_text);
            Err(format!("LINE API error: {} - {}", status, error_text).into())
        }
    }

    /// 服薬リマインダー用のFlexメッセージを作成
    fn create_medication_reminder_flex_message(&self, args: &NotificationWorkerArgs) -> serde_json::Value {
        json!({
            "type": "flex",
            "altText": "服薬リマインダー",
            "contents": {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "🔔 服薬時間です",
                            "weight": "bold",
                            "size": "lg",
                            "color": "#2E86AB"
                        }
                    ],
                    "backgroundColor": "#F3F7FA"
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": args.message,
                            "wrap": true,
                            "size": "md"
                        }
                    ]
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "button",
                            "action": {
                                "type": "message",
                                "label": "服薬完了",
                                "text": "服薬完了"
                            },
                            "style": "primary",
                            "color": "#28a745"
                        },
                        {
                            "type": "button",
                            "action": {
                                "type": "message",
                                "label": "後で通知",
                                "text": "後で通知"
                            },
                            "style": "secondary"
                        }
                    ],
                    "spacing": "sm"
                }
            }
        })
    }

    /// 未服薬警告用のFlexメッセージを作成
    fn create_missed_medication_flex_message(&self, args: &NotificationWorkerArgs) -> serde_json::Value {
        json!({
            "type": "flex",
            "altText": "服薬忘れ通知",
            "contents": {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "⚠️ 服薬忘れ",
                            "weight": "bold",
                            "size": "lg",
                            "color": "#DC3545"
                        }
                    ],
                    "backgroundColor": "#FDF2F2"
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": args.message,
                            "wrap": true,
                            "size": "md"
                        }
                    ]
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "button",
                            "action": {
                                "type": "message",
                                "label": "今から飲む",
                                "text": "服薬完了"
                            },
                            "style": "primary",
                            "color": "#28a745"
                        },
                        {
                            "type": "button",
                            "action": {
                                "type": "message",
                                "label": "飲み忘れ記録",
                                "text": "飲み忘れ"
                            },
                            "style": "secondary",
                            "color": "#6c757d"
                        }
                    ],
                    "spacing": "sm"
                }
            }
        })
    }

    /// 通知履歴をデータベースに記録
    async fn log_notification(&self, args: &NotificationWorkerArgs) -> Result<(), DbErr> {
        // 通知履歴テーブルがあれば記録
        // 今回は簡単のためログ出力のみ
        tracing::info!(
            "Notification logged: user={}, type={}, medicine_id={:?}",
            args.line_user_id,
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

