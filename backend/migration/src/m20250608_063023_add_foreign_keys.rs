use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // medicines.user_id -> users.id の外部キー制約
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_medicines_user_id")
                    .from(Medicines::Table, Medicines::UserId)
                    .to(Users::Table, Users::Id)
                    .on_delete(ForeignKeyAction::Cascade)
                    .on_update(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await?;

        // medication_schedules.medicine_id -> medicines.id の外部キー制約
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_medication_schedules_medicine_id")
                    .from(MedicationSchedules::Table, MedicationSchedules::MedicineId)
                    .to(Medicines::Table, Medicines::Id)
                    .on_delete(ForeignKeyAction::Cascade)
                    .on_update(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await?;

        // medication_logs.medicine_id -> medicines.id の外部キー制約
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_medication_logs_medicine_id")
                    .from(MedicationLogs::Table, MedicationLogs::MedicineId)
                    .to(Medicines::Table, Medicines::Id)
                    .on_delete(ForeignKeyAction::Cascade)
                    .on_update(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 外部キー制約を削除（逆順）
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_medication_logs_medicine_id")
                    .table(MedicationLogs::Table)
                    .to_owned(),
            )
            .await?;

        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_medication_schedules_medicine_id")
                    .table(MedicationSchedules::Table)
                    .to_owned(),
            )
            .await?;

        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_medicines_user_id")
                    .table(Medicines::Table)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

// テーブル定義
#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Medicines {
    Table,
    Id,
    UserId,
}

#[derive(DeriveIden)]
enum MedicationSchedules {
    Table,
    MedicineId,
}

#[derive(DeriveIden)]
enum MedicationLogs {
    Table,
    MedicineId,
}