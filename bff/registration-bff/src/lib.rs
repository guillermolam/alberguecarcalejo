mod rate_limiter;
mod validator;
mod orchestrator;

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use web_sys::console;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

macro_rules! console_error {
    ($($t:tt)*) => (error(&format_args!($($t)*).to_string()))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BFFResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
    pub rate_limited: bool,
    pub retry_after: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegistrationData {
    pub pilgrim: PilgrimData,
    pub booking: BookingData,
    pub payment: PaymentData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PilgrimData {
    pub first_name: String,
    pub last_name_1: String,
    pub last_name_2: Option<String>,
    pub birth_date: String,
    pub document_type: String,
    pub document_number: String,
    pub document_support: Option<String>,
    pub gender: String,
    pub nationality: Option<String>,
    pub phone: String,
    pub email: Option<String>,
    pub address_country: String,
    pub address_street: String,
    pub address_street_2: Option<String>,
    pub address_city: String,
    pub address_postal_code: String,
    pub address_municipality_code: Option<String>,
    pub language: String,
    pub id_photo_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BookingData {
    pub check_in_date: String,
    pub check_out_date: String,
    pub number_of_nights: u32,
    pub number_of_persons: u32,
    pub number_of_rooms: u32,
    pub has_internet: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentData {
    pub amount: String,
    pub payment_type: String,
    pub currency: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AvailabilityRequest {
    pub check_in_date: String,
    pub check_out_date: String,
    pub number_of_persons: u32,
}

#[wasm_bindgen(start)]
pub fn init() {
    console_log!("Registration BFF initialized");
    
    // Initialize rate limiter
    rate_limiter::init();
}

/// Check bed availability with rate limiting
#[wasm_bindgen]
pub async fn check_availability(data: &str, client_id: &str) -> Result<JsValue, JsValue> {
    console_log!("BFF: Checking availability for client: {}", client_id);
    
    // Rate limiting check
    if !rate_limiter::check_rate_limit(client_id, "availability", 10, 60) {
        let response = BFFResponse {
            success: false,
            data: None,
            error: Some("Rate limit exceeded for availability checks".to_string()),
            rate_limited: true,
            retry_after: Some(60),
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Parse and validate request
    let request: AvailabilityRequest = match serde_json::from_str(data) {
        Ok(req) => req,
        Err(e) => {
            let response = BFFResponse {
                success: false,
                data: None,
                error: Some(format!("Invalid request format: {}", e)),
                rate_limited: false,
                retry_after: None,
            };
            return Ok(serde_wasm_bindgen::to_value(&response)?);
        }
    };

    // Validate dates
    if let Err(validation_error) = validator::validate_dates(&request.check_in_date, &request.check_out_date) {
        let response = BFFResponse {
            success: false,
            data: None,
            error: Some(validation_error),
            rate_limited: false,
            retry_after: None,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Orchestrate availability check
    match orchestrator::check_availability(&request).await {
        Ok(availability_data) => {
            let response = BFFResponse {
                success: true,
                data: Some(availability_data),
                error: None,
                rate_limited: false,
                retry_after: None,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
        Err(e) => {
            console_error!("BFF: Availability check failed: {}", e);
            let response = BFFResponse {
                success: false,
                data: None,
                error: Some(e),
                rate_limited: false,
                retry_after: None,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
    }
}

/// Process pilgrim registration with comprehensive validation and rate limiting
#[wasm_bindgen]
pub async fn register_pilgrim(data: &str, client_id: &str) -> Result<JsValue, JsValue> {
    console_log!("BFF: Processing registration for client: {}", client_id);
    
    // Strict rate limiting for registrations (3 per hour)
    if !rate_limiter::check_rate_limit(client_id, "registration", 3, 3600) {
        let response = BFFResponse {
            success: false,
            data: None,
            error: Some("Registration rate limit exceeded. Please try again later.".to_string()),
            rate_limited: true,
            retry_after: Some(3600),
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Parse and validate registration data
    let registration_data: RegistrationData = match serde_json::from_str(data) {
        Ok(data) => data,
        Err(e) => {
            let response = BFFResponse {
                success: false,
                data: None,
                error: Some(format!("Invalid registration data: {}", e)),
                rate_limited: false,
                retry_after: None,
            };
            return Ok(serde_wasm_bindgen::to_value(&response)?);
        }
    };

    // Comprehensive validation
    if let Err(validation_errors) = validator::validate_registration(&registration_data) {
        let response = BFFResponse {
            success: false,
            data: None,
            error: Some(validation_errors.join("; ")),
            rate_limited: false,
            retry_after: None,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Orchestrate registration process
    match orchestrator::process_registration(&registration_data).await {
        Ok(registration_result) => {
            console_log!("BFF: Registration successful for {}", registration_data.pilgrim.document_number);
            let response = BFFResponse {
                success: true,
                data: Some(registration_result),
                error: None,
                rate_limited: false,
                retry_after: None,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
        Err(e) => {
            console_error!("BFF: Registration failed: {}", e);
            let response = BFFResponse {
                success: false,
                data: None,
                error: Some(e),
                rate_limited: false,
                retry_after: None,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
    }
}

/// Validate Spanish document with rate limiting
#[wasm_bindgen]
pub fn validate_document(doc_type: &str, doc_number: &str, client_id: &str) -> Result<JsValue, JsValue> {
    // Rate limiting for document validation (20 per minute)
    if !rate_limiter::check_rate_limit(client_id, "validation", 20, 60) {
        let response = BFFResponse {
            success: false,
            data: None,
            error: Some("Document validation rate limit exceeded".to_string()),
            rate_limited: true,
            retry_after: Some(60),
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    let is_valid = validator::validate_spanish_document(doc_type, doc_number);
    let response = BFFResponse {
        success: true,
        data: Some(serde_json::json!({ "valid": is_valid })),
        error: None,
        rate_limited: false,
        retry_after: None,
    };
    
    Ok(serde_wasm_bindgen::to_value(&response)?)
}

/// Get rate limit status for debugging
#[wasm_bindgen]
pub fn get_rate_limit_status(client_id: &str) -> Result<JsValue, JsValue> {
    let status = rate_limiter::get_status(client_id);
    Ok(serde_wasm_bindgen::to_value(&status)?)
}