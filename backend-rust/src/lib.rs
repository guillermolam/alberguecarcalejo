mod api;
mod database;
mod models;
mod services;
mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Albergue WASM Backend initialized");
}

// Export main API functions
#[wasm_bindgen]
pub async fn check_availability(
    check_in_date: &str,
    check_out_date: &str,
    number_of_persons: u32,
) -> Result<JsValue, JsValue> {
    api::availability::check_availability(check_in_date, check_out_date, number_of_persons).await
}

#[wasm_bindgen]
pub async fn register_pilgrim(data: &str) -> Result<JsValue, JsValue> {
    api::registration::register_pilgrim(data).await
}

#[wasm_bindgen]
pub async fn get_dashboard_stats() -> Result<JsValue, JsValue> {
    api::dashboard::get_dashboard_stats().await
}

#[wasm_bindgen]
pub async fn get_beds() -> Result<JsValue, JsValue> {
    api::beds::get_all_beds().await
}

#[wasm_bindgen]
pub async fn update_bed_status(bed_id: u32, status: &str) -> Result<JsValue, JsValue> {
    api::beds::update_bed_status(bed_id, status).await
}

#[wasm_bindgen]
pub async fn submit_to_government(xml_content: &str) -> Result<JsValue, JsValue> {
    api::government::submit_parte_viajeros(xml_content).await
}

#[wasm_bindgen]
pub async fn validate_spanish_document(doc_type: &str, doc_number: &str) -> Result<bool, JsValue> {
    utils::validation::validate_spanish_document(doc_type, doc_number)
}

#[wasm_bindgen]
pub fn generate_xml_submission(pilgrim_data: &str, booking_data: &str, payment_data: &str) -> Result<String, JsValue> {
    services::xml_generator::generate_parte_viajeros_xml(pilgrim_data, booking_data, payment_data)
}