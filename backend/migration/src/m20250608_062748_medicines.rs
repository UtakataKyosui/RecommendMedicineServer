use loco_rs::schema::*;
use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        create_table(m, "medicines",
            &[
            
            ("id", ColType::PkAuto),
            
            ("name", ColType::String),
            ("description", ColType::TextNull),
            ("dosage", ColType::StringNull),
            ("unit", ColType::StringNull),
            ("user_id", ColType::Integer),
            ("active", ColType::BooleanNull),
            ],
            &[
            ]
        ).await
    }

    async fn down(&self, m: &SchemaManager) -> Result<(), DbErr> {
        drop_table(m, "medicines").await
    }
}
