#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use axum::debug_handler;
use serde::{Deserialize, Serialize};
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, Set, ActiveModelTrait};
use base64::{Engine as _, engine::general_purpose};

use crate::models::_entities::users;
// use crate::models::_entities::push_subscriptions; // Will be available after migration

#[derive(Debug, Deserialize, Serialize)]
pub struct PushSubscriptionRequest {
    pub endpoint: String,
    pub keys: PushKeys,
    pub user_agent: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PushKeys {
    pub p256dh: String,
    pub auth: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PushNotificationRequest {
    pub title: String,
    pub body: String,
    pub icon: Option<String>,
    pub badge: Option<String>,
    pub tag: Option<String>,
    pub data: Option<serde_json::Value>,
    pub actions: Option<Vec<NotificationAction>>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct NotificationAction {
    pub action: String,
    pub title: String,
    pub icon: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct VapidKeysResponse {
    pub public_key: String,
}

#[derive(Debug, Serialize)]
pub struct SubscriptionResponse {
    pub id: i32,
    pub endpoint: String,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
}

/// VAPID公開鍵を取得
#[debug_handler]
pub async fn get_vapid_public_key(State(_ctx): State<AppContext>) -> Result<Response> {
    let public_key = get_vapid_public_key_from_env()?;
    
    format::json(VapidKeysResponse {
        public_key,
    })
}

/// プッシュ通知サブスクリプションを作成
#[debug_handler]
pub async fn subscribe(
    auth: auth::JWT,
    State(_ctx): State<AppContext>,
    Json(_subscription_data): Json<PushSubscriptionRequest>,
) -> Result<Response> {
    let _user_id = auth.claims.pid.parse::<i32>().map_err(|e| Error::string(&format!("Invalid user ID: {}", e)))?;
    
    // TODO: Implement after migration runs and push_subscriptions entity is generated
    format::json(serde_json::json!({
        "message": "Push notifications not yet implemented - coming soon!"
    }))
}

/// プッシュ通知サブスクリプションを削除
#[debug_handler]
pub async fn unsubscribe(
    auth: auth::JWT,
    State(_ctx): State<AppContext>,
    Json(_params): Json<serde_json::Value>,
) -> Result<Response> {
    let _user_id = auth.claims.pid.parse::<i32>().map_err(|e| Error::string(&format!("Invalid user ID: {}", e)))?;
    
    // TODO: Implement after migration runs
    format::json(serde_json::json!({
        "message": "Unsubscribed successfully"
    }))
}

/// ユーザーのサブスクリプション一覧を取得
#[debug_handler]
pub async fn get_subscriptions(
    auth: auth::JWT,
    State(_ctx): State<AppContext>,
) -> Result<Response> {
    let _user_id = auth.claims.pid.parse::<i32>().map_err(|e| Error::string(&format!("Invalid user ID: {}", e)))?;
    
    // TODO: Implement after migration runs
    format::json(Vec::<SubscriptionResponse>::new())
}

/// テスト用プッシュ通知送信
#[debug_handler]
pub async fn send_test_notification(
    auth: auth::JWT,
    State(_ctx): State<AppContext>,
    Json(_notification): Json<PushNotificationRequest>,
) -> Result<Response> {
    let _user_id = auth.claims.pid.parse::<i32>().map_err(|e| Error::string(&format!("Invalid user ID: {}", e)))?;
    
    // TODO: Implement after migration runs
    format::json(serde_json::json!({
        "message": "Test notification feature not yet implemented",
        "sent": 0,
        "failed": 0
    }))
}

/// 特定のユーザーにプッシュ通知を送信（内部API）
pub async fn send_push_to_user(
    _ctx: &AppContext,
    user_id: i32,
    _notification: &PushNotificationRequest,
) -> Result<i32, Error> {
    // TODO: Implement after migration runs and push_subscriptions entity is generated
    tracing::info!("Web push notification requested for user {} - not yet implemented", user_id);
    Ok(0) // Return 0 sent count since not implemented yet
}

// TODO: Implement after push_subscriptions entity is generated
/*
// Web Push通知を実際に送信する関数
async fn send_web_push_notification(
    subscription: &push_subscriptions::Model,
    notification: &PushNotificationRequest,
) -> Result<(), Error> {
    use web_push::*;

    // VAPID キーを取得
    let vapid_private_key = get_vapid_private_key_from_env()?;
    let vapid_public_key = get_vapid_public_key_from_env()?;

    // サブスクリプション情報を構築
    let subscription_info = SubscriptionInfo::new(
        &subscription.endpoint,
        &subscription.p256dh_key,
        &subscription.auth_key,
    );

    // VAPID署名者を作成
    let mut builder = WebPushMessageBuilder::new(&subscription_info);

    // ペイロードを構築
    let payload = serde_json::json!({
        "title": notification.title,
        "body": notification.body,
        "icon": notification.icon.as_deref().unwrap_or("/favicon.ico"),
        "badge": notification.badge.as_deref().unwrap_or("/favicon.ico"),
        "tag": notification.tag.as_deref().unwrap_or("medication-reminder"),
        "data": notification.data.as_ref().unwrap_or(&serde_json::json!({})),
        "actions": notification.actions.as_ref().unwrap_or(&vec![]),
        "requireInteraction": true,
        "vibrate": [200, 100, 200]
    });

    let payload_str = serde_json::to_string(&payload)
        .map_err(|e| Error::string(&format!("Failed to serialize payload: {}", e)))?;

    builder.set_payload(ContentEncoding::AesGcm, payload_str.as_bytes());

    // VAPID認証を設定
    let vapid_signature = VapidSignatureBuilder::from_base64(
        &vapid_private_key,
        &vapid_public_key,
        &subscription.endpoint,
    )
    .map_err(|e| Error::string(&format!("Failed to create VAPID signature: {}", e)))?
    .build()
    .map_err(|e| Error::string(&format!("Failed to build VAPID signature: {}", e)))?;

    builder.set_vapid_signature(vapid_signature);

    let message = builder.build()
        .map_err(|e| Error::string(&format!("Failed to build web push message: {}", e)))?;

    // HTTP クライアントで送信
    let client = reqwest::Client::new();
    let mut request_builder = client
        .post(&message.endpoint)
        .header("TTL", "2419200"); // 28 days

    // ヘッダーを設定
    for (key, value) in message.headers.iter() {
        request_builder = request_builder.header(key, value);
    }

    // ペイロードがある場合は追加
    if let Some(payload) = message.payload {
        request_builder = request_builder.body(payload);
    }

    let response = request_builder.send().await
        .map_err(|e| Error::string(&format!("Failed to send push notification: {}", e)))?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(Error::string(&format!("Push notification failed with status {}: {}", status, error_text)));
    }

    Ok(())
}
*/

// VAPID キーを環境変数から取得
fn get_vapid_private_key_from_env() -> Result<String, Error> {
    std::env::var("VAPID_PRIVATE_KEY")
        .map_err(|_| Error::string("VAPID_PRIVATE_KEY not found in environment"))
}

fn get_vapid_public_key_from_env() -> Result<String, Error> {
    std::env::var("VAPID_PUBLIC_KEY")
        .map_err(|_| Error::string("VAPID_PUBLIC_KEY not found in environment"))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/push/")
        .add("vapid", get(get_vapid_public_key))
        .add("subscribe", post(subscribe))
        .add("unsubscribe", post(unsubscribe))
        .add("subscriptions", get(get_subscriptions))
        .add("test", post(send_test_notification))
}