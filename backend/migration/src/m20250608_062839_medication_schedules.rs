use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "medication_schedules",
            &[
            
            ("id", ColType::PkAuto),
            
            ("medicine_id", ColType::Integer),
            ("scheduled_time", ColType::DateTime),
            ("frequency", ColType::String),
            ("active", ColType::BooleanNull),
            ("days_of_week", ColType::StringNull),
            ],
            &[
            ]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "medication_schedules").await
    }
}
