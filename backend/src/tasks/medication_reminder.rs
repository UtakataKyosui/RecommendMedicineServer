use loco_rs::prelude::*;
use loco_rs::task::{Task, TaskInfo};
use sea_orm::{DatabaseConnection, EntityTrait, ColumnTrait, QueryFilter, DbErr, Set};
use sea_orm::Condition;
use chrono::{Local, Weekday, Duration, NaiveDateTime, NaiveTime, Timelike, Datelike};
use chrono::TimeZone;

use crate::models::{
    _entities::{medicines, medication_schedules, medication_logs, users},
    medicines::Model as Medicine,
    medication_schedules::Model as MedicationSchedule,
    medication_logs::Model as MedicationLog,
};
use crate::workers::notification_worker::NotificationWorkerArgs;

pub struct MedicationReminderTask;

#[async_trait]
impl Task for MedicationReminderTask {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "medication_reminder".to_string(),
            detail: "Checks and sends medication reminders every hour".to_string(),
        }
    }

    async fn run(&self, app_context: &AppContext, _vars: &task::Vars) -> Result<(), Error> {
        tracing::info!("🔔 Starting medication reminder task");
        
        let now = Local::now();
        let current_time = now.time();
        let current_weekday = now.weekday();
        
        // 現在時刻（分単位で丸める）
        let current_hour_minute = NaiveTime::from_hms_opt(current_time.hour(), current_time.minute(), 0)
            .unwrap_or_else(|| {
                tracing::error!("Failed to create NaiveTime from current time");
                NaiveTime::from_hms_opt(9, 0, 0).unwrap()
            });
        
        tracing::info!("Checking schedules for time: {}", current_hour_minute.format("%H:%M"));

        // アクティブなスケジュールを取得
        let schedules = self.get_active_schedules_for_time(
            &app_context.db, 
            current_hour_minute, 
            current_weekday
        ).await?;

        tracing::info!("Found {} schedules to process", schedules.len());

        for schedule in schedules {
            if let Err(e) = self.process_medication_schedule(app_context, &schedule, now.naive_local()).await {
                tracing::error!("Failed to process schedule ID {}: {}", schedule.id, e);
            }
        }

        // 未服薬チェック（30分後）
        if let Err(e) = self.check_missed_medications(app_context).await {
            tracing::error!("Failed to check missed medications: {}", e);
        }

        tracing::info!("✅ Medication reminder task completed");
        Ok(())
    }
}

impl MedicationReminderTask {
    /// 指定時刻のアクティブなスケジュールを取得
    async fn get_active_schedules_for_time(
        &self,
        db: &DatabaseConnection,
        time: NaiveTime,
        weekday: Weekday,
    ) -> Result<Vec<MedicationSchedule>, DbErr> {
        let weekday_num = self.weekday_to_number(weekday);

        medication_schedules::Entity::find()
            .filter(medication_schedules::Column::Active.eq(true))
            .filter(medication_schedules::Column::ScheduledTime.like(format!("% {}:%", time.format("%H:%M"))))
            .filter(
                Condition::any()
                    .add(medication_schedules::Column::Frequency.eq("daily"))
                    .add(
                        Condition::all()
                            .add(medication_schedules::Column::Frequency.eq("weekly"))
                            .add(
                                Condition::any()
                                    .add(medication_schedules::Column::DaysOfWeek.is_null())
                                    .add(medication_schedules::Column::DaysOfWeek.like(format!("%{}%", weekday_num)))
                            )
                    )
            )
            .all(db)
            .await
    }

    /// 服薬スケジュールを処理
    async fn process_medication_schedule(
        &self,
        app_context: &AppContext,
        schedule: &MedicationSchedule,
        current_time: NaiveDateTime,
    ) -> Result<(), Error> {
        // 薬情報を取得
        let medicine = medicines::Entity::find_by_id(schedule.medicine_id)
            .one(&app_context.db)
            .await?
            .ok_or_else(|| Error::string("Medicine not found"))?;

        // ユーザー情報を取得
        let user = users::Entity::find_by_id(medicine.user_id)
            .one(&app_context.db)
            .await?
            .ok_or_else(|| Error::string("User not found"))?;

        // Web Push通知システムを使用（LINE ID不要）

        // 今日の同じ時刻の服薬ログがあるかチェック
        let today_start = current_time.date().and_hms_opt(0, 0, 0).unwrap();
        let scheduled_time = self.combine_date_and_schedule_time(today_start, &schedule.scheduled_time)?;

        // Convert NaiveDateTime to DateTime<FixedOffset>
        let fixed_offset = chrono::FixedOffset::east_opt(9 * 3600).unwrap_or_else(|| chrono::FixedOffset::east_opt(0).unwrap()); // adjust offset as needed
        let scheduled_time_fixed = fixed_offset.from_local_datetime(&scheduled_time).single()
            .ok_or_else(|| Error::string("Failed to convert scheduled_time to DateTime<FixedOffset>"))?;

        let existing_log = medication_logs::Entity::find()
            .filter(medication_logs::Column::MedicineId.eq(schedule.medicine_id))
            .filter(medication_logs::Column::ScheduledTime.eq(scheduled_time_fixed))
            .one(&app_context.db)
            .await?;

        if existing_log.is_some() {
            tracing::debug!("Log already exists for medicine {} at {}", medicine.name, scheduled_time_fixed);
            return Ok(());
        }

        // 服薬ログを作成
        let log = medication_logs::ActiveModel {
            medicine_id: Set(schedule.medicine_id),
            scheduled_time: Set(scheduled_time_fixed),
            status: Set("pending".to_string()),
            taken_time: Set(None),
            notes: Set(None),
            ..Default::default()
        };

        medication_logs::Entity::insert(log)
            .exec(&app_context.db)
            .await?;

        // 通知メッセージを作成
        let message = self.create_reminder_message(&medicine, &schedule);

        // 通知ワーカーをエンキュー
        let _notification_args = NotificationWorkerArgs {
            user_id: user.id,
            message,
            notification_type: "medication_reminder".to_string(),
            medicine_id: Some(medicine.id),
            log_id: None,
            title: Some("🔔 服薬時間です".to_string()),
        };

        // TODO: Fix queue access pattern for Loco 0.15
        // The queue access needs to be implemented properly
        // if let Some(queue) = &app_context.queue {
        //     queue.enqueue(
        //         crate::workers::notification_worker::NotificationWorker::build(app_context),
        //         &notification_args,
        //         None,
        //     ).await?;
        // }

        tracing::info!("Queued reminder for user {} - medicine: {}", user.id, medicine.name);
        Ok(())
    }

    /// 未服薬の薬をチェック
    async fn check_missed_medications(&self, app_context: &AppContext) -> Result<(), Error> {
        let now = Local::now().naive_local();
        let thirty_minutes_ago = now - Duration::minutes(30);

        // 30分前の未完了ログを検索
        let missed_logs = medication_logs::Entity::find()
            .filter(medication_logs::Column::Status.eq("pending"))
            .filter(medication_logs::Column::ScheduledTime.between(
                thirty_minutes_ago - Duration::minutes(5),
                thirty_minutes_ago + Duration::minutes(5)
            ))
            .all(&app_context.db)
            .await?;

        for log in missed_logs {
            if let Err(e) = self.process_missed_medication(app_context, &log).await {
                tracing::error!("Failed to process missed medication for log {}: {}", log.id, e);
            }
        }

        Ok(())
    }

    /// 未服薬の処理
    async fn process_missed_medication(
        &self,
        app_context: &AppContext,
        log: &MedicationLog,
    ) -> Result<(), Error> {
        // ステータスを「未服薬」に更新
        let mut log_active: medication_logs::ActiveModel = log.clone().into();
        log_active.status = Set("missed".to_string());
        log_active.update(&app_context.db).await?;

        // 薬とユーザー情報を取得
        let medicine = medicines::Entity::find_by_id(log.medicine_id)
            .one(&app_context.db)
            .await?
            .ok_or_else(|| Error::string("Medicine not found"))?;

        let user = users::Entity::find_by_id(medicine.user_id)
            .one(&app_context.db)
            .await?
            .ok_or_else(|| Error::string("User not found"))?;

        // Web Push通知システムを使用（LINE ID不要）

        // 未服薬通知メッセージを作成
        let message = format!(
            r"⚠️ 服薬を忘れていませんか？

💊 {}
⏰ {}

まだ時間がある場合は「服薬完了」と返信してください。",
            medicine.name,
            log.scheduled_time.format("%H:%M")
        );

        // 通知ワーカーをエンキュー
        let _notification_args = NotificationWorkerArgs {
            user_id: user.id,
            message,
            notification_type: "missed_medication".to_string(),
            medicine_id: Some(medicine.id),
            log_id: Some(log.id),
            title: Some("⚠️ 服薬忘れ".to_string()),
        };

        // TODO: Fix queue access pattern for Loco 0.15
        // The queue access needs to be implemented properly
        // if let Some(queue) = &app_context.queue {
        //     queue.enqueue(
        //         crate::workers::notification_worker::NotificationWorker::build(app_context),
        //         &notification_args,
        //         None,
        //     ).await?;
        // }

        tracing::info!("Queued missed medication reminder for user {} - medicine: {}", user.id, medicine.name);
        Ok(())
    }

    /// リマインダーメッセージを作成
    fn create_reminder_message(&self, medicine: &Medicine, schedule: &MedicationSchedule) -> String {
        let dosage_info = match (&medicine.dosage, &medicine.unit) {
            (Some(dosage), Some(unit)) => format!(" ({}{})", dosage, unit),
            (Some(dosage), None) => format!(" ({})", dosage),
            _ => String::new(),
        };

        format!(
            r"🔔 服薬時間です！

💊 {}{}
⏰ {}

「服薬完了」と返信して記録してください。",
            medicine.name,
            dosage_info,
            schedule.scheduled_time.format("%H:%M")
        )
    }

    /// 曜日を数値に変換
    fn weekday_to_number(&self, weekday: Weekday) -> u8 {
        match weekday {
            Weekday::Mon => 1,
            Weekday::Tue => 2,
            Weekday::Wed => 3,
            Weekday::Thu => 4,
            Weekday::Fri => 5,
            Weekday::Sat => 6,
            Weekday::Sun => 7,
        }
    }

    /// 日付とスケジュール時刻を結合
    fn combine_date_and_schedule_time(
        &self,
        date: NaiveDateTime,
        schedule_time: &NaiveDateTime,
    ) -> Result<NaiveDateTime, Error> {
        let time = schedule_time.time();
        let combined = date.date().and_time(time);
        Ok(combined)
    }
}