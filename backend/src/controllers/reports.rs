#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;
use axum::debug_handler;
use axum::extract::Query;
use serde::{Deserialize, Serialize};
use chrono::{Local, Duration, NaiveDate, Datelike, TimeZone};
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, DatabaseConnection, DbErr};

use crate::models::_entities::{medicines, medication_logs, users};

#[derive(Debug, Serialize, Deserialize)]
pub struct ReportRequest {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub report_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdherenceReport {
    pub period: String,
    pub start_date: String,
    pub end_date: String,
    pub total_scheduled: u64,
    pub completed: u64,
    pub missed: u64,
    pub skipped: u64,
    pub adherence_percentage: f32,
    pub daily_breakdown: Vec<DailyAdherence>,
    pub medicine_breakdown: Vec<MedicineAdherence>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailyAdherence {
    pub date: String,
    pub scheduled: u64,
    pub completed: u64,
    pub percentage: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MedicineAdherence {
    pub medicine_name: String,
    pub scheduled: u64,
    pub completed: u64,
    pub percentage: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WeeklyReport {
    pub week_start: String,
    pub week_end: String,
    pub total_medications: u64,
    pub adherence_rate: f32,
    pub best_day: String,
    pub worst_day: String,
    pub improvement_suggestions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlyReport {
    pub month: String,
    pub year: i32,
    pub total_medications: u64,
    pub adherence_rate: f32,
    pub weekly_breakdown: Vec<WeeklyReport>,
    pub trending: String, // "improving", "declining", "stable"
}

#[debug_handler]
pub async fn get_adherence_report(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Query(params): Query<ReportRequest>,
) -> Result<Response> {
    let user = users::Entity::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    
    let (start_date, end_date) = parse_date_range(&params)?;
    let report = generate_adherence_report(&ctx.db, user.id, start_date, end_date).await?;
    
    format::json(report)
}

#[debug_handler]
pub async fn get_weekly_report(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Query(params): Query<ReportRequest>,
) -> Result<Response> {
    let user = users::Entity::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    
    let week_start = params.start_date
        .and_then(|d| NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())
        .unwrap_or_else(|| {
            let now = Local::now().date_naive();
            now - Duration::days(now.weekday().num_days_from_monday() as i64)
        });
    
    let week_end = week_start + Duration::days(6);
    let report = generate_weekly_report(&ctx.db, user.id, week_start, week_end).await?;
    
    format::json(report)
}

#[debug_handler]
pub async fn get_monthly_report(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Query(params): Query<ReportRequest>,
) -> Result<Response> {
    let user = users::Entity::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    
    let now = Local::now().date_naive();
    let target_date = params.start_date
        .and_then(|d| NaiveDate::parse_from_str(&d, "%Y-%m-%d").ok())
        .unwrap_or(now);
    
    let month_start = NaiveDate::from_ymd_opt(target_date.year(), target_date.month(), 1).unwrap();
    let month_end = if target_date.month() == 12 {
        NaiveDate::from_ymd_opt(target_date.year() + 1, 1, 1).unwrap() - Duration::days(1)
    } else {
        NaiveDate::from_ymd_opt(target_date.year(), target_date.month() + 1, 1).unwrap() - Duration::days(1)
    };
    
    let report = generate_monthly_report(&ctx.db, user.id, month_start, month_end).await?;
    
    format::json(report)
}

#[debug_handler]
pub async fn export_csv(
    auth: auth::JWT,
    State(ctx): State<AppContext>,
    Query(params): Query<ReportRequest>,
) -> Result<Response> {
    let user = users::Entity::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    
    let (start_date, end_date) = parse_date_range(&params)?;
    let csv_data = generate_csv_report(&ctx.db, user.id, start_date, end_date).await?;
    
    Ok(Response::builder()
        .header("Content-Type", "text/csv")
        .header("Content-Disposition", "attachment; filename=\"medication_report.csv\"")
        .body(csv_data.into())
        .unwrap())
}

fn parse_date_range(params: &ReportRequest) -> Result<(NaiveDate, NaiveDate), Error> {
    let end_date = params.end_date
        .as_ref()
        .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .unwrap_or_else(|| Local::now().date_naive());
    
    let start_date = params.start_date
        .as_ref()
        .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .unwrap_or_else(|| end_date - Duration::days(30));
    
    Ok((start_date, end_date))
}

async fn generate_adherence_report(
    db: &DatabaseConnection,
    user_id: i32,
    start_date: NaiveDate,
    end_date: NaiveDate,
) -> Result<AdherenceReport, DbErr> {
    let start_datetime = start_date.and_hms_opt(0, 0, 0).unwrap();
    let end_datetime = end_date.and_hms_opt(23, 59, 59).unwrap();
    
    let fixed_offset = chrono::FixedOffset::east_opt(9 * 3600).unwrap_or_else(|| chrono::FixedOffset::east_opt(0).unwrap());
    let start_fixed = fixed_offset.from_local_datetime(&start_datetime).single().unwrap();
    let end_fixed = fixed_offset.from_local_datetime(&end_datetime).single().unwrap();

    // Get all logs for the period with medicine info via subquery
    let logs = medication_logs::Entity::find()
        .filter(medication_logs::Column::ScheduledTime.between(start_fixed, end_fixed))
        .all(db)
        .await?;

    // Filter logs by user_id by checking each medicine separately
    let mut user_logs = Vec::new();
    for log in logs {
        let medicine = medicines::Entity::find_by_id(log.medicine_id)
            .one(db)
            .await?;
        if let Some(med) = medicine {
            if med.user_id == user_id {
                user_logs.push((log, med));
            }
        }
    }

    let total_scheduled = user_logs.len() as u64;
    let completed = user_logs.iter().filter(|(log, _)| log.status == "completed").count() as u64;
    let missed = user_logs.iter().filter(|(log, _)| log.status == "missed").count() as u64;
    let skipped = user_logs.iter().filter(|(log, _)| log.status == "skipped").count() as u64;

    let adherence_percentage = if total_scheduled > 0 {
        (completed as f32 / total_scheduled as f32) * 100.0
    } else {
        0.0
    };

    // Generate daily breakdown
    let mut daily_breakdown = Vec::new();
    let mut current_date = start_date;
    while current_date <= end_date {
        let day_logs: Vec<_> = user_logs.iter()
            .filter(|(log, _)| log.scheduled_time.date_naive() == current_date)
            .collect();
        
        let day_scheduled = day_logs.len() as u64;
        let day_completed = day_logs.iter()
            .filter(|(log, _)| log.status == "completed")
            .count() as u64;
        
        let day_percentage = if day_scheduled > 0 {
            (day_completed as f32 / day_scheduled as f32) * 100.0
        } else {
            0.0
        };

        daily_breakdown.push(DailyAdherence {
            date: current_date.format("%Y-%m-%d").to_string(),
            scheduled: day_scheduled,
            completed: day_completed,
            percentage: day_percentage,
        });

        current_date += Duration::days(1);
    }

    // Generate medicine breakdown
    let mut medicine_stats = std::collections::HashMap::new();
    for (log, medicine) in &user_logs {
        let entry = medicine_stats.entry(&medicine.name).or_insert((0u64, 0u64));
        entry.0 += 1; // scheduled
        if log.status == "completed" {
            entry.1 += 1; // completed
        }
    }

    let medicine_breakdown: Vec<MedicineAdherence> = medicine_stats
        .into_iter()
        .map(|(name, (scheduled, completed))| {
            let percentage = if scheduled > 0 {
                (completed as f32 / scheduled as f32) * 100.0
            } else {
                0.0
            };
            MedicineAdherence {
                medicine_name: name.clone(),
                scheduled,
                completed,
                percentage,
            }
        })
        .collect();

    Ok(AdherenceReport {
        period: format!("{} to {}", start_date.format("%Y-%m-%d"), end_date.format("%Y-%m-%d")),
        start_date: start_date.format("%Y-%m-%d").to_string(),
        end_date: end_date.format("%Y-%m-%d").to_string(),
        total_scheduled,
        completed,
        missed,
        skipped,
        adherence_percentage,
        daily_breakdown,
        medicine_breakdown,
    })
}

async fn generate_weekly_report(
    db: &DatabaseConnection,
    user_id: i32,
    week_start: NaiveDate,
    week_end: NaiveDate,
) -> Result<WeeklyReport, DbErr> {
    let start_datetime = week_start.and_hms_opt(0, 0, 0).unwrap();
    let end_datetime = week_end.and_hms_opt(23, 59, 59).unwrap();
    
    let fixed_offset = chrono::FixedOffset::east_opt(9 * 3600).unwrap_or_else(|| chrono::FixedOffset::east_opt(0).unwrap());
    let start_fixed = fixed_offset.from_local_datetime(&start_datetime).single().unwrap();
    let end_fixed = fixed_offset.from_local_datetime(&end_datetime).single().unwrap();

    let logs = medication_logs::Entity::find()
        .filter(medication_logs::Column::ScheduledTime.between(start_fixed, end_fixed))
        .all(db)
        .await?;

    // Filter logs by user_id by checking each medicine separately
    let mut user_logs = Vec::new();
    for log in logs {
        let medicine = medicines::Entity::find_by_id(log.medicine_id)
            .one(db)
            .await?;
        if let Some(med) = medicine {
            if med.user_id == user_id {
                user_logs.push((log, med));
            }
        }
    }

    let total_medications = user_logs.len() as u64;
    let completed = user_logs.iter().filter(|(log, _)| log.status == "completed").count() as u64;
    
    let adherence_rate = if total_medications > 0 {
        (completed as f32 / total_medications as f32) * 100.0
    } else {
        0.0
    };

    // Find best and worst days
    let mut daily_rates = Vec::new();
    let mut current_date = week_start;
    while current_date <= week_end {
        let day_logs: Vec<_> = user_logs.iter()
            .filter(|(log, _)| log.scheduled_time.date_naive() == current_date)
            .collect();
        
        let day_total = day_logs.len() as u64;
        let day_completed = day_logs.iter()
            .filter(|(log, _)| log.status == "completed")
            .count() as u64;
        
        let day_rate = if day_total > 0 {
            (day_completed as f32 / day_total as f32) * 100.0
        } else {
            0.0
        };

        daily_rates.push((current_date.format("%A").to_string(), day_rate));
        current_date += Duration::days(1);
    }

    let best_day = daily_rates.iter()
        .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
        .map(|(day, _)| day.clone())
        .unwrap_or_else(|| "No data".to_string());

    let worst_day = daily_rates.iter()
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
        .map(|(day, _)| day.clone())
        .unwrap_or_else(|| "No data".to_string());

    // Generate improvement suggestions
    let mut suggestions = Vec::new();
    if adherence_rate < 80.0 {
        suggestions.push("Consider setting more reminders throughout the day".to_string());
        suggestions.push("Try linking medication times to daily routines".to_string());
    }
    if adherence_rate < 60.0 {
        suggestions.push("Speak with your healthcare provider about your medication schedule".to_string());
    }
    if suggestions.is_empty() {
        suggestions.push("Great job maintaining your medication schedule!".to_string());
    }

    Ok(WeeklyReport {
        week_start: week_start.format("%Y-%m-%d").to_string(),
        week_end: week_end.format("%Y-%m-%d").to_string(),
        total_medications,
        adherence_rate,
        best_day,
        worst_day,
        improvement_suggestions: suggestions,
    })
}

async fn generate_monthly_report(
    db: &DatabaseConnection,
    user_id: i32,
    month_start: NaiveDate,
    month_end: NaiveDate,
) -> Result<MonthlyReport, DbErr> {
    let start_datetime = month_start.and_hms_opt(0, 0, 0).unwrap();
    let end_datetime = month_end.and_hms_opt(23, 59, 59).unwrap();
    
    let fixed_offset = chrono::FixedOffset::east_opt(9 * 3600).unwrap_or_else(|| chrono::FixedOffset::east_opt(0).unwrap());
    let start_fixed = fixed_offset.from_local_datetime(&start_datetime).single().unwrap();
    let end_fixed = fixed_offset.from_local_datetime(&end_datetime).single().unwrap();

    let logs = medication_logs::Entity::find()
        .filter(medication_logs::Column::ScheduledTime.between(start_fixed, end_fixed))
        .all(db)
        .await?;

    // Filter logs by user_id by checking each medicine separately
    let mut user_logs = Vec::new();
    for log in logs {
        let medicine = medicines::Entity::find_by_id(log.medicine_id)
            .one(db)
            .await?;
        if let Some(med) = medicine {
            if med.user_id == user_id {
                user_logs.push((log, med));
            }
        }
    }

    let total_medications = user_logs.len() as u64;
    let completed = user_logs.iter().filter(|(log, _)| log.status == "completed").count() as u64;
    
    let adherence_rate = if total_medications > 0 {
        (completed as f32 / total_medications as f32) * 100.0
    } else {
        0.0
    };

    // Generate weekly breakdown
    let mut weekly_breakdown = Vec::new();
    let mut current_week_start = month_start;
    
    while current_week_start <= month_end {
        let current_week_end = std::cmp::min(
            current_week_start + Duration::days(6),
            month_end
        );
        
        let week_report = generate_weekly_report(db, user_id, current_week_start, current_week_end).await?;
        weekly_breakdown.push(week_report);
        
        current_week_start += Duration::days(7);
    }

    // Determine trending
    let trending = if weekly_breakdown.len() >= 2 {
        let last_week = weekly_breakdown.last().unwrap().adherence_rate;
        let prev_week = weekly_breakdown[weekly_breakdown.len() - 2].adherence_rate;
        
        if last_week > prev_week + 5.0 {
            "improving".to_string()
        } else if last_week < prev_week - 5.0 {
            "declining".to_string()
        } else {
            "stable".to_string()
        }
    } else {
        "insufficient_data".to_string()
    };

    Ok(MonthlyReport {
        month: month_start.format("%B").to_string(),
        year: month_start.year(),
        total_medications,
        adherence_rate,
        weekly_breakdown,
        trending,
    })
}

async fn generate_csv_report(
    db: &DatabaseConnection,
    user_id: i32,
    start_date: NaiveDate,
    end_date: NaiveDate,
) -> Result<String, DbErr> {
    let start_datetime = start_date.and_hms_opt(0, 0, 0).unwrap();
    let end_datetime = end_date.and_hms_opt(23, 59, 59).unwrap();
    
    let fixed_offset = chrono::FixedOffset::east_opt(9 * 3600).unwrap_or_else(|| chrono::FixedOffset::east_opt(0).unwrap());
    let start_fixed = fixed_offset.from_local_datetime(&start_datetime).single().unwrap();
    let end_fixed = fixed_offset.from_local_datetime(&end_datetime).single().unwrap();

    let logs = medication_logs::Entity::find()
        .filter(medication_logs::Column::ScheduledTime.between(start_fixed, end_fixed))
        .all(db)
        .await?;

    let mut csv_content = String::from("Date,Medicine,Scheduled Time,Status,Taken Time,Notes\n");
    
    // Filter logs by user_id by checking each medicine separately
    let mut user_logs = Vec::new();
    for log in logs {
        let medicine = medicines::Entity::find_by_id(log.medicine_id)
            .one(db)
            .await?;
        if let Some(med) = medicine {
            if med.user_id == user_id {
                user_logs.push((log, med));
            }
        }
    }

    for (log, medicine) in user_logs {
        let taken_time = log.taken_time
            .map(|t| t.format("%Y-%m-%d %H:%M:%S").to_string())
            .unwrap_or_else(|| "".to_string());
        
        let notes = log.notes.unwrap_or_else(|| "".to_string());
        
        csv_content.push_str(&format!(
            "{},{},{},{},{},{}\n",
            log.scheduled_time.format("%Y-%m-%d"),
            medicine.name,
            log.scheduled_time.format("%H:%M:%S"),
            log.status,
            taken_time,
            notes
        ));
    }

    Ok(csv_content)
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/reports/")
        .add("/adherence", get(get_adherence_report))
        .add("/weekly", get(get_weekly_report))
        .add("/monthly", get(get_monthly_report))
        .add("/export/csv", get(export_csv))
}
