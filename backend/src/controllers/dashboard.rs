#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use axum::debug_handler;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, FixedOffset, Local, Duration, TimeZone};
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, DatabaseConnection, DbErr};

use crate::models::_entities::{medicines, medication_schedules, medication_logs, users};

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardData {
    pub user_stats: UserStats,
    pub today_medications: Vec<TodayMedication>,
    pub adherence_stats: AdherenceStats,
    pub upcoming_schedules: Vec<UpcomingSchedule>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserStats {
    pub total_medicines: u64,
    pub active_schedules: u64,
    pub total_logs_today: u64,
    pub completed_today: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TodayMedication {
    pub id: i32,
    pub medicine_name: String,
    pub scheduled_time: DateTime<FixedOffset>,
    pub status: String,
    pub taken_time: Option<DateTime<FixedOffset>>,
    pub dosage: Option<String>,
    pub unit: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdherenceStats {
    pub this_week_percentage: f32,
    pub this_month_percentage: f32,
    pub completed_count: u64,
    pub total_count: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpcomingSchedule {
    pub medicine_name: String,
    pub next_time: DateTime<FixedOffset>,
    pub dosage: Option<String>,
    pub unit: Option<String>,
}

#[debug_handler]
pub async fn get_dashboard(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    // ユーザー情報を取得
    let user = users::Entity::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    
    // ダッシュボードデータを構築
    let dashboard_data = DashboardData {
        user_stats: get_user_stats(&ctx.db, user.id).await?,
        today_medications: get_today_medications(&ctx.db, user.id).await?,
        adherence_stats: get_adherence_stats(&ctx.db, user.id).await?,
        upcoming_schedules: get_upcoming_schedules(&ctx.db, user.id).await?,
    };

    format::json(dashboard_data)
}

#[debug_handler]
pub async fn get_user_summary(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let user = users::Entity::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    let stats = get_user_stats(&ctx.db, user.id).await?;
    
    format::json(stats)
}

#[debug_handler]
pub async fn get_today_schedule(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
) -> Result<Response> {
    let user = users::Entity::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    let today_meds = get_today_medications(&ctx.db, user.id).await?;
    
    format::json(today_meds)
}

async fn get_user_stats(db: &DatabaseConnection, user_id: i32) -> Result<UserStats, DbErr> {
    let total_medicines = medicines::Entity::find()
        .filter(medicines::Column::UserId.eq(user_id))
        .filter(medicines::Column::Active.eq(true))
        .count(db)
        .await?;

    let active_schedules = medication_schedules::Entity::find()
        .inner_join(medicines::Entity)
        .filter(medicines::Column::UserId.eq(user_id))
        .filter(medication_schedules::Column::Active.eq(true))
        .filter(medicines::Column::Active.eq(true))
        .count(db)
        .await?;

    let today = Local::now().date_naive();
    let today_start = today.and_hms_opt(0, 0, 0).unwrap();
    let today_end = today.and_hms_opt(23, 59, 59).unwrap();
    
    let fixed_offset = chrono::FixedOffset::east_opt(9 * 3600).unwrap_or_else(|| chrono::FixedOffset::east_opt(0).unwrap());
    let today_start_fixed = fixed_offset.from_local_datetime(&today_start).single().unwrap();
    let today_end_fixed = fixed_offset.from_local_datetime(&today_end).single().unwrap();

    let total_logs_today = medication_logs::Entity::find()
        .inner_join(medicines::Entity)
        .filter(medicines::Column::UserId.eq(user_id))
        .filter(medication_logs::Column::ScheduledTime.between(today_start_fixed, today_end_fixed))
        .count(db)
        .await?;

    let completed_today = medication_logs::Entity::find()
        .inner_join(medicines::Entity)
        .filter(medicines::Column::UserId.eq(user_id))
        .filter(medication_logs::Column::ScheduledTime.between(today_start_fixed, today_end_fixed))
        .filter(medication_logs::Column::Status.eq("completed"))
        .count(db)
        .await?;

    Ok(UserStats {
        total_medicines,
        active_schedules,
        total_logs_today,
        completed_today,
    })
}

async fn get_today_medications(db: &DatabaseConnection, user_id: i32) -> Result<Vec<TodayMedication>, DbErr> {
    let today = Local::now().date_naive();
    let today_start = today.and_hms_opt(0, 0, 0).unwrap();
    let today_end = today.and_hms_opt(23, 59, 59).unwrap();
    
    let fixed_offset = chrono::FixedOffset::east_opt(9 * 3600).unwrap_or_else(|| chrono::FixedOffset::east_opt(0).unwrap());
    let today_start_fixed = fixed_offset.from_local_datetime(&today_start).single().unwrap();
    let today_end_fixed = fixed_offset.from_local_datetime(&today_end).single().unwrap();

    // Find all medication logs for today for this user
    let logs = medication_logs::Entity::find()
        .filter(medication_logs::Column::ScheduledTime.between(today_start_fixed, today_end_fixed))
        .all(db)
        .await?;

    let mut today_medications = Vec::new();
    for log in logs {
        let medicine = medicines::Entity::find_by_id(log.medicine_id)
            .one(db)
            .await?;
        if let Some(med) = medicine {
            if med.user_id == user_id {
                today_medications.push(TodayMedication {
                    id: log.id,
                    medicine_name: med.name,
                    scheduled_time: log.scheduled_time,
                    status: log.status,
                    taken_time: log.taken_time,
                    dosage: med.dosage,
                    unit: med.unit,
                });
            }
        }
    }

    // Sort by scheduled time
    today_medications.sort_by(|a, b| a.scheduled_time.cmp(&b.scheduled_time));
    
    Ok(today_medications)
}

async fn get_adherence_stats(db: &DatabaseConnection, user_id: i32) -> Result<AdherenceStats, DbErr> {
    let now = Local::now();
    let week_ago = now - Duration::days(7);
    let month_ago = now - Duration::days(30);
    
    let fixed_offset = chrono::FixedOffset::east_opt(9 * 3600).unwrap_or_else(|| chrono::FixedOffset::east_opt(0).unwrap());
    let week_ago_fixed = fixed_offset.from_local_datetime(&week_ago.naive_local()).single().unwrap();
    let month_ago_fixed = fixed_offset.from_local_datetime(&month_ago.naive_local()).single().unwrap();
    let now_fixed = fixed_offset.from_local_datetime(&now.naive_local()).single().unwrap();

    // This week stats
    let week_total = medication_logs::Entity::find()
        .inner_join(medicines::Entity)
        .filter(medicines::Column::UserId.eq(user_id))
        .filter(medication_logs::Column::ScheduledTime.between(week_ago_fixed, now_fixed))
        .count(db)
        .await?;

    let week_completed = medication_logs::Entity::find()
        .inner_join(medicines::Entity)
        .filter(medicines::Column::UserId.eq(user_id))
        .filter(medication_logs::Column::ScheduledTime.between(week_ago_fixed, now_fixed))
        .filter(medication_logs::Column::Status.eq("completed"))
        .count(db)
        .await?;

    // This month stats
    let month_total = medication_logs::Entity::find()
        .inner_join(medicines::Entity)
        .filter(medicines::Column::UserId.eq(user_id))
        .filter(medication_logs::Column::ScheduledTime.between(month_ago_fixed, now_fixed))
        .count(db)
        .await?;

    let month_completed = medication_logs::Entity::find()
        .inner_join(medicines::Entity)
        .filter(medicines::Column::UserId.eq(user_id))
        .filter(medication_logs::Column::ScheduledTime.between(month_ago_fixed, now_fixed))
        .filter(medication_logs::Column::Status.eq("completed"))
        .count(db)
        .await?;

    let week_percentage = if week_total > 0 {
        (week_completed as f32 / week_total as f32) * 100.0
    } else {
        0.0
    };

    let month_percentage = if month_total > 0 {
        (month_completed as f32 / month_total as f32) * 100.0
    } else {
        0.0
    };

    Ok(AdherenceStats {
        this_week_percentage: week_percentage,
        this_month_percentage: month_percentage,
        completed_count: month_completed,
        total_count: month_total,
    })
}

async fn get_upcoming_schedules(db: &DatabaseConnection, user_id: i32) -> Result<Vec<UpcomingSchedule>, DbErr> {
    let now = Local::now();
    let next_24_hours = now + Duration::hours(24);
    
    let fixed_offset = chrono::FixedOffset::east_opt(9 * 3600).unwrap_or_else(|| chrono::FixedOffset::east_opt(0).unwrap());
    let now_fixed = fixed_offset.from_local_datetime(&now.naive_local()).single().unwrap();
    let next_24_hours_fixed = fixed_offset.from_local_datetime(&next_24_hours.naive_local()).single().unwrap();

    // Find upcoming medication logs
    let upcoming_logs = medication_logs::Entity::find()
        .filter(medication_logs::Column::ScheduledTime.between(now_fixed, next_24_hours_fixed))
        .filter(medication_logs::Column::Status.eq("pending"))
        .all(db)
        .await?;

    let mut upcoming = Vec::new();
    for log in upcoming_logs {
        let medicine = medicines::Entity::find_by_id(log.medicine_id)
            .one(db)
            .await?;
        if let Some(med) = medicine {
            if med.user_id == user_id {
                upcoming.push(UpcomingSchedule {
                    medicine_name: med.name,
                    next_time: log.scheduled_time,
                    dosage: med.dosage,
                    unit: med.unit,
                });
            }
        }
    }

    // Sort by time
    upcoming.sort_by(|a, b| a.next_time.cmp(&b.next_time));
    
    // Limit to next 5 upcoming medications
    upcoming.truncate(5);
    
    Ok(upcoming)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/dashboard/")
        .add("/", get(get_dashboard))
        .add("/summary", get(get_user_summary))
        .add("/today", get(get_today_schedule))
}
