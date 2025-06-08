use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Users::Table)
                    // LINE Bot用のフィールドを追加
                    .add_column_if_not_exists(string_null(Users::LineUserId))
                    .add_column_if_not_exists(string_null(Users::DisplayName))
                    .add_column_if_not_exists(string_null(Users::Timezone))
                    .add_column_if_not_exists(boolean_null(Users::NotificationEnabled))
                    .add_column_if_not_exists(timestamp_null(Users::LastLoginAt))
                    .to_owned(),
            )
            .await?;

        // LINE User IDにインデックスを追加（検索性能向上のため）
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

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // インデックスを削除
        manager
            .drop_index(
                Index::drop()
                    .name("idx_users_line_user_id")
                    .table(Users::Table)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Users::Table)
                    .drop_column(Users::LineUserId)
                    .drop_column(Users::DisplayName)
                    .drop_column(Users::Timezone)
                    .drop_column(Users::NotificationEnabled)
                    .drop_column(Users::LastLoginAt)
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
    Timezone,
    NotificationEnabled,
    LastLoginAt,
}