use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "medication_logs",
            &[
            
            ("id", ColType::PkAuto),
            
            ("medicine_id", ColType::Integer),
            ("scheduled_time", ColType::TimestampWithTimeZone),
            ("taken_time", ColType::TimestampWithTimeZoneNull),
            ("status", ColType::String),
            ("notes", ColType::TextNull),
            ],
            &[
            ]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "medication_logs").await
    }
}
