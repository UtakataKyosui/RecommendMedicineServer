use loco_rs::prelude::*;
use sea_orm::{EntityTrait, QueryFilter};
use sea_orm::ColumnTrait;
use serde::{Deserialize, Serialize};
use chrono::{Local, Duration, NaiveDate, Timelike};
use std::collections::HashMap;

use crate::models::{
    _entities::{users, medicines, medication_logs},
    users::Model as User,
    medication_logs::Model as MedicationLog,
};
use crate::workers::notification_worker::NotificationWorkerArgs;

#[derive(Debug, Deserialize, Serialize)]
pub struct ReportGeneratorArgs {
    pub user_id: i32,
    pub report_type: String, // "daily", "weekly", "monthly"
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub send_notification: bool,
}

#[derive(Debug, Serialize)]
pub struct MedicationReport {
    pub user_id: i32,
    pub report_type: String,
    pub period: String,
    pub summary: ReportSummary,
    pub medicines: Vec<MedicineReport>,
    pub recommendations: Vec<String>,
    pub generated_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize)]
pub struct ReportSummary {
    pub total_scheduled: i32,
    pub total_taken: i32,
    pub total_missed: i32,
    pub adherence_rate: f64, // 服薬遵守率（%）
    pub most_missed_time: Option<String>,
    pub best_adherence_medicine: Option<String>,
    pub worst_adherence_medicine: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct MedicineReport {
    pub medicine_id: i32,
    pub medicine_name: String,
    pub scheduled_count: i32,
    pub taken_count: i32,
    pub missed_count: i32,
    pub adherence_rate: f64,
    pub missed_times: Vec<String>,
}

pub struct ReportGeneratorWorker {
    pub ctx: AppContext,
}

#[async_trait]
impl BackgroundWorker<ReportGeneratorArgs> for ReportGeneratorWorker {
    fn build(ctx: &AppContext) -> Self {
        Self { ctx: ctx.clone() }
    }
    
    async fn perform(&self, args: ReportGeneratorArgs) -> Result<()> {
        tracing::info!("📊 Generating {} report for user {}", args.report_type, args.user_id);

        // ユーザー情報を取得
        let user = users::Entity::find_by_id(args.user_id)
            .one(&self.ctx.db)
            .await?
            .ok_or_else(|| loco_rs::Error::string("User not found"))?;

        // レポート期間を決定
        let (start_date, end_date) = self.determine_report_period(&args)?;

        // レポートを生成
        let report = self.generate_medication_report(
            &self.ctx.db,
            &user,
            &args.report_type,
            start_date,
            end_date,
        ).await?;

        // レポートを保存（ファイルまたはデータベース）
        if let Err(e) = self.save_report(&report).await {
            tracing::error!("Failed to save report: {}", e);
        }

        // 通知を送信（必要な場合）
        if args.send_notification {
            if let Err(e) = self.send_report_notification(&self.ctx, &user, &report).await {
                tracing::error!("Failed to send report notification: {}", e);
            }
        }

        tracing::info!("✅ Report generation completed for user {}", args.user_id);
        Ok(())
    }
}

impl ReportGeneratorWorker {
    /// レポート期間を決定
    fn determine_report_period(&self, args: &ReportGeneratorArgs) -> Result<(NaiveDate, NaiveDate)> {
        match (args.start_date, args.end_date) {
            (Some(start), Some(end)) => Ok((start, end)),
            _ => {
                let today = Local::now().date_naive();
                let (start, end) = match args.report_type.as_str() {
                    "daily" => (today, today),
                    "weekly" => {
                        let start = today - Duration::days(6);
                        (start, today)
                    }
                    "monthly" => {
                        let start = today - Duration::days(29);
                        (start, today)
                    }
                    _ => return Err(loco_rs::Error::string("Invalid report type")),
                };
                Ok((start, end))
            }
        }
    }

    /// 服薬レポートを生成
    async fn generate_medication_report(
        &self,
        db: &DatabaseConnection,
        user: &User,
        report_type: &str,
        start_date: NaiveDate,
        end_date: NaiveDate,
    ) -> Result<MedicationReport> {
        // 期間内の服薬ログを取得
        let start_datetime = start_date.and_hms_opt(0, 0, 0).unwrap();
        let end_datetime = end_date.and_hms_opt(23, 59, 59).unwrap();

        // 期間内の服薬ログを取得（まずユーザーの薬を取得してからフィルタリング）
        let user_medicines = medicines::Entity::find()
            .filter(medicines::Column::UserId.eq(user.id))
            .all(db)
            .await?;
        
        let medicine_ids: Vec<i32> = user_medicines.iter().map(|m| m.id).collect();
        
        let logs = medication_logs::Entity::find()
            .filter(medication_logs::Column::MedicineId.is_in(medicine_ids))
            .filter(medication_logs::Column::ScheduledTime.between(start_datetime, end_datetime))
            .all(db)
            .await?;

        // アクティブな薬のみをフィルタリング
        let medicines: Vec<_> = user_medicines.into_iter().filter(|m| m.active.unwrap_or(false)).collect();

        // 薬ごとのレポートを生成
        let mut medicine_reports = Vec::new();
        let mut total_scheduled = 0;
        let mut total_taken = 0;
        let mut total_missed = 0;

        for medicine in &medicines {
            let medicine_logs: Vec<&MedicationLog> = logs
                .iter()
                .filter(|log| log.medicine_id == medicine.id)
                .collect();

            let scheduled_count = medicine_logs.len() as i32;
            let taken_count = medicine_logs
                .iter()
                .filter(|log| log.status == "completed")
                .count() as i32;
            let missed_count = medicine_logs
                .iter()
                .filter(|log| log.status == "missed")
                .count() as i32;

            let adherence_rate = if scheduled_count > 0 {
                (taken_count as f64 / scheduled_count as f64) * 100.0
            } else {
                0.0
            };

            let missed_times: Vec<String> = medicine_logs
                .iter()
                .filter(|log| log.status == "missed")
                .map(|log| log.scheduled_time.format("%H:%M").to_string())
                .collect();

            medicine_reports.push(MedicineReport {
                medicine_id: medicine.id,
                medicine_name: medicine.name.clone(),
                scheduled_count,
                taken_count,
                missed_count,
                adherence_rate,
                missed_times,
            });

            total_scheduled += scheduled_count;
            total_taken += taken_count;
            total_missed += missed_count;
        }

        // 全体の遵守率を計算
        let overall_adherence_rate = if total_scheduled > 0 {
            (total_taken as f64 / total_scheduled as f64) * 100.0
        } else {
            0.0
        };

        // 最も服薬忘れが多い時間帯を分析
        let most_missed_time = self.analyze_most_missed_time(&logs);

        // 最も遵守率の高い/低い薬を特定
        let best_adherence_medicine = medicine_reports
            .iter()
            .filter(|m| m.scheduled_count > 0)
            .max_by(|a, b| a.adherence_rate.partial_cmp(&b.adherence_rate).unwrap())
            .map(|m| m.medicine_name.clone());

        let worst_adherence_medicine = medicine_reports
            .iter()
            .filter(|m| m.scheduled_count > 0)
            .min_by(|a, b| a.adherence_rate.partial_cmp(&b.adherence_rate).unwrap())
            .map(|m| m.medicine_name.clone());

        // レポートサマリーを作成
        let summary = ReportSummary {
            total_scheduled,
            total_taken,
            total_missed,
            adherence_rate: overall_adherence_rate,
            most_missed_time,
            best_adherence_medicine,
            worst_adherence_medicine,
        };

        // 推奨事項を生成
        let recommendations = self.generate_recommendations(&summary, &medicine_reports);

        // 期間文字列を作成
        let period = format!("{} ～ {}", start_date.format("%Y/%m/%d"), end_date.format("%Y/%m/%d"));

        Ok(MedicationReport {
            user_id: user.id,
            report_type: report_type.to_string(),
            period,
            summary,
            medicines: medicine_reports,
            recommendations,
            generated_at: chrono::Local::now().naive_local(),
        })
    }

    /// 最も服薬忘れが多い時間帯を分析
    fn analyze_most_missed_time(&self, logs: &[MedicationLog]) -> Option<String> {
        let mut time_miss_count: HashMap<String, i32> = HashMap::new();

        for log in logs {
            if log.status == "missed" {
                let hour = log.scheduled_time.hour();
                let time_range = match hour {
                    6..=11 => "朝（6-11時）",
                    12..=17 => "昼（12-17時）",
                    18..=23 => "夜（18-23時）",
                    _ => "深夜・早朝（0-5時）",
                };
                *time_miss_count.entry(time_range.to_string()).or_insert(0) += 1;
            }
        }

        time_miss_count
            .into_iter()
            .max_by_key(|(_, count)| *count)
            .map(|(time, _)| time)
    }

    /// 推奨事項を生成
    fn generate_recommendations(&self, summary: &ReportSummary, medicine_reports: &[MedicineReport]) -> Vec<String> {
        let mut recommendations = Vec::new();

        // 遵守率に基づく推奨
        if summary.adherence_rate >= 90.0 {
            recommendations.push("🎉 素晴らしい服薬遵守率です！この調子で継続しましょう。".to_string());
        } else if summary.adherence_rate >= 70.0 {
            recommendations.push("👍 良好な服薬習慣です。もう少し改善の余地があります。".to_string());
        } else if summary.adherence_rate >= 50.0 {
            recommendations.push("⚠️ 服薬遵守率に改善が必要です。アラーム設定や服薬管理アプリの活用を検討してください。".to_string());
        } else {
            recommendations.push("🚨 服薬遵守率が低い状態です。医師や薬剤師に相談することをお勧めします。".to_string());
        }

        // 時間帯別の推奨
        if let Some(missed_time) = &summary.most_missed_time {
            recommendations.push(format!("⏰ {}の服薬忘れが多く見られます。この時間帯のアラームを強化することをお勧めします。", missed_time));
        }

        // 薬別の推奨
        for medicine in medicine_reports {
            if medicine.adherence_rate < 60.0 && medicine.scheduled_count >= 3 {
                recommendations.push(format!(
                    "💊 「{}」の服薬遵守率が低下しています。服用タイミングの見直しを検討してください。",
                    medicine.medicine_name
                ));
            }
        }

        // 服薬忘れが多い場合の具体的なアドバイス
        if summary.total_missed > summary.total_taken / 2 {
            recommendations.push("📱 服薬管理アプリの活用、薬の配置場所の工夫、家族による声かけなどを試してみてください。".to_string());
        }

        // 推奨事項が空の場合のデフォルト
        if recommendations.is_empty() {
            recommendations.push("継続して服薬記録を取ることで、より詳細な分析が可能になります。".to_string());
        }

        recommendations
    }

    /// レポートを保存
    async fn save_report(&self, report: &MedicationReport) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // JSONファイルとして保存
        let filename = format!(
            "medication_report_user{}_{}_{}_{}.json",
            report.user_id,
            report.report_type,
            report.generated_at.format("%Y%m%d_%H%M%S"),
            fastrand::u32(..)
        );

        let json_content = serde_json::to_string_pretty(report)?;
        
        // レポートディレクトリを作成
        std::fs::create_dir_all("reports")?;
        
        // ファイルに保存
        std::fs::write(format!("reports/{}", filename), json_content)?;
        
        tracing::info!("Report saved to reports/{}", filename);
        Ok(())
    }

    /// レポート通知を送信
    async fn send_report_notification(
        &self,
        _ctx: &AppContext,
        user: &User,
        report: &MedicationReport,
    ) -> Result<()> {
        // Web Push通知システムを使用（LINE ID不要）

        // レポートサマリーメッセージを作成
        let message = self.create_report_summary_message(report);

        // 通知ワーカーをエンキュー
        let _notification_args = NotificationWorkerArgs {
            user_id: user.id,
            message,
            notification_type: "medication_report".to_string(),
            medicine_id: None,
            log_id: None,
            title: Some("📊 服薬レポート".to_string()),
        };

        // TODO: Queue::queue の実装を修正する必要があります
        // Queue::queue(&self.ctx.queue, NotificationWorker, &notification_args).await?;

        tracing::info!("Queued Web Push report notification for user {}", user.id);
        Ok(())
    }

    /// レポートサマリーメッセージを作成
    fn create_report_summary_message(&self, report: &MedicationReport) -> String {
        let adherence_emoji = if report.summary.adherence_rate >= 90.0 {
            "🎉"
        } else if report.summary.adherence_rate >= 70.0 {
            "👍"
        } else if report.summary.adherence_rate >= 50.0 {
            "⚠️"
        } else {
            "🚨"
        };

        let mut message = format!(
            "{} 服薬レポート（{}）\n\n📊 期間: {}\n\n📈 服薬状況:\n• 予定回数: {}回\n• 服薬完了: {}回\n• 飲み忘れ: {}回\n• 遵守率: {:.1}%\n",
            adherence_emoji,
            report.report_type,
            report.period,
            report.summary.total_scheduled,
            report.summary.total_taken,
            report.summary.total_missed,
            report.summary.adherence_rate
        );

        // 最初の推奨事項を追加
        if let Some(first_recommendation) = report.recommendations.first() {
            message.push_str(&format!("\n💡 {}\n", first_recommendation));
        }

        // 詳細な分析結果
        if let Some(best_medicine) = &report.summary.best_adherence_medicine {
            message.push_str(&format!("\n⭐ 最も良好: {}", best_medicine));
        }

        if let Some(worst_medicine) = &report.summary.worst_adherence_medicine {
            message.push_str(&format!("\n🔸 要注意: {}", worst_medicine));
        }

        message.push_str("\n\n詳細はWebアプリでご確認ください。");

        message
    }
}

