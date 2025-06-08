#![allow(clippy::missing_errors_doc)]
#![allow(clippy::unnecessary_struct_initialization)]
#![allow(clippy::unused_async)]
use loco_rs::prelude::*;

pub fn routes() -> Routes {
    Routes::new()
        .prefix("dashboards/")
}
