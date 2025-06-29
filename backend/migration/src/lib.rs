#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;
mod m20220101_000001_users;

mod m20250608_050523_remove_colmun_from_users;
mod m20250608_055203_add_line_fields_to_users;
mod m20250608_062748_medicines;
mod m20250608_062839_medication_schedules;
mod m20250608_062931_medication_logs;
mod m20250608_063023_add_foreign_keys;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_users::Migration),
            Box::new(m20250608_050523_remove_colmun_from_users::Migration),
            Box::new(m20250608_055203_add_line_fields_to_users::Migration),
            Box::new(m20250608_062748_medicines::Migration),
            Box::new(m20250608_062839_medication_schedules::Migration),
            Box::new(m20250608_062931_medication_logs::Migration),
            Box::new(m20250608_063023_add_foreign_keys::Migration),
            // inject-above (do not remove this comment)
        ]
    }
}