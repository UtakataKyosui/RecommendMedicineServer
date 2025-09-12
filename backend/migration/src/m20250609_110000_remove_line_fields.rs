use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // LINE関連のインデックスを削除
        let _ = manager
            .drop_index(
                Index::drop()
                    .name("idx_users_line_user_id")
                    .table(Users::Table)
                    .to_owned(),
            )
            .await;

        // LINE関連のフィールドを削除
        manager
            .alter_table(
                Table::alter()
                    .table(Users::Table)
                    .drop_column(Users::LineUserId)
                    .drop_column(Users::DisplayName)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ロールバック時にLINEフィールドを復元
        manager
            .alter_table(
                Table::alter()
                    .table(Users::Table)
                    .add_column_if_not_exists(ColumnDef::new(Users::LineUserId).string().null())
                    .add_column_if_not_exists(ColumnDef::new(Users::DisplayName).string().null())
                    .to_owned(),
            )
            .await?;

        // インデックスを復元
        manager
            .create_index(
                Index::create()
                    .name("idx_users_line_user_id")
                    .table(Users::Table)
                    .col(Users::LineUserId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Users {
    Table,
    LineUserId,
    DisplayName,
}