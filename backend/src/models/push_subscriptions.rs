use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

pub use super::_entities::push_subscriptions::{ActiveModel, Column, Entity, Model, PrimaryKey, Relation};

impl ActiveModelBehavior for ActiveModel {
    // Custom behavior for the push_subscriptions model
    fn new() -> Self {
        Self {
            ..ActiveModelTrait::default()
        }
    }
}