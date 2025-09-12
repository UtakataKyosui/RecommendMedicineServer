use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(PushSubscriptions::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(PushSubscriptions::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(PushSubscriptions::UserId)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PushSubscriptions::Endpoint)
                            .text()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PushSubscriptions::P256dhKey)
                            .text()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PushSubscriptions::AuthKey)
                            .text()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(PushSubscriptions::UserAgent)
                            .text()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(PushSubscriptions::Active)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new(PushSubscriptions::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(PushSubscriptions::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_push_subscriptions_user_id")
                            .from(PushSubscriptions::Table, PushSubscriptions::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .index(
                        Index::create()
                            .name("idx_push_subscriptions_user_id")
                            .col(PushSubscriptions::UserId),
                    )
                    .index(
                        Index::create()
                            .name("idx_push_subscriptions_endpoint")
                            .col(PushSubscriptions::Endpoint)
                            .unique(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(PushSubscriptions::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum PushSubscriptions {
    Table,
    Id,
    UserId,
    Endpoint,
    P256dhKey,
    AuthKey,
    UserAgent,
    Active,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}