use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Import panic hook for better error messages
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Pilgrim {
    pub id: Option<String>,
    pub first_name: String,
    pub last_name1: String, 
    pub last_name2: Option<String>,
    pub birth_date: String,
    pub document_number: String,
    pub document_type: String,
    pub phone: String,
    pub email: String,
    pub address_street: Option<String>,
    pub address_city: Option<String>,
    pub address_postal_code: Option<String>,
    pub address_country: Option<String>,
    pub nationality: Option<String>,
    pub gender: Option<String>,
    pub consent_given: bool,
    pub consent_date: String,
    pub data_retention_until: String,
    pub last_access_date: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Booking {
    pub id: Option<String>,
    pub pilgrim_id: String,
    pub check_in_date: String,
    pub check_out_date: String,
    pub bed_id: Option<String>,
    pub status: String, // reserved, confirmed, expired, cancelled
    pub payment_status: String, // awaiting_payment, completed, cancelled, expired
    pub payment_deadline: String,
    pub total_amount: f64,
    pub currency: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Bed {
    pub id: String,
    pub bed_number: String,
    pub room_type: String, // dormitory, private
    pub room_name: String,
    pub status: String, // available, reserved, occupied, maintenance, cleaning
    pub reserved_until: Option<String>,
    pub price_per_night: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[wasm_bindgen]
pub struct DatabaseService {
    database_url: String,
}

#[wasm_bindgen]
impl DatabaseService {
    #[wasm_bindgen(constructor)]
    pub fn new(database_url: String) -> DatabaseService {
        DatabaseService { database_url }
    }

    #[wasm_bindgen]
    pub async fn create_pilgrim(&self, pilgrim_data: &str) -> Result<String, JsValue> {
        let pilgrim: Pilgrim = serde_json::from_str(pilgrim_data)
            .map_err(|e| JsValue::from_str(&format!("Invalid pilgrim data: {}", e)))?;

        // TODO: Implement actual database connection and insertion
        // For now, return mock response
        let response = DatabaseResponse {
            success: true,
            data: Some(serde_json::to_value(&pilgrim).unwrap()),
            error: None,
        };

        Ok(serde_json::to_string(&response).unwrap())
    }

    #[wasm_bindgen]
    pub async fn create_booking(&self, booking_data: &str) -> Result<String, JsValue> {
        let booking: Booking = serde_json::from_str(booking_data)
            .map_err(|e| JsValue::from_str(&format!("Invalid booking data: {}", e)))?;

        let response = DatabaseResponse {
            success: true,
            data: Some(serde_json::to_value(&booking).unwrap()),
            error: None,
        };

        Ok(serde_json::to_string(&response).unwrap())
    }

    #[wasm_bindgen]
    pub async fn get_bed_availability(&self, check_in: &str, check_out: &str) -> Result<String, JsValue> {
        // Mock bed availability response
        let beds = vec![
            Bed {
                id: "bed_1".to_string(),
                bed_number: "A1".to_string(),
                room_type: "dormitory".to_string(),
                room_name: "Dormitorio A".to_string(),
                status: "available".to_string(),
                reserved_until: None,
                price_per_night: 15.0,
            },
            Bed {
                id: "bed_2".to_string(),
                bed_number: "B1".to_string(),
                room_type: "private".to_string(),
                room_name: "Private Room 1".to_string(),
                status: "available".to_string(),
                reserved_until: None,
                price_per_night: 35.0,
            }
        ];

        let response = DatabaseResponse {
            success: true,
            data: Some(serde_json::to_value(&beds).unwrap()),
            error: None,
        };

        Ok(serde_json::to_string(&response).unwrap())
    }

    #[wasm_bindgen]
    pub async fn assign_bed(&self, booking_id: &str, bed_id: &str) -> Result<String, JsValue> {
        let response = DatabaseResponse {
            success: true,
            data: Some(serde_json::json!({
                "booking_id": booking_id,
                "bed_id": bed_id,
                "status": "confirmed"
            })),
            error: None,
        };

        Ok(serde_json::to_string(&response).unwrap())
    }
}

// Export types for JavaScript
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}