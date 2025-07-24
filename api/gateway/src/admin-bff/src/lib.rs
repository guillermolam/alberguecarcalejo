mod rate_limiter;
mod auth;
mod orchestrator;
mod database;

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
pub struct AdminBFFResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
    pub rate_limited: bool,
    pub retry_after: Option<u64>,
    pub requires_auth: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminCredentials {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BedUpdateRequest {
    pub bed_id: u32,
    pub status: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BookingUpdateRequest {
    pub booking_id: u32,
    pub status: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GovernmentSubmissionRequest {
    pub booking_id: u32,
    pub force_retry: bool,
}

#[wasm_bindgen(start)]
pub fn init() {
    console_log!("Admin BFF initialized");
    
    // Initialize rate limiter, auth, and database
    rate_limiter::init();
    auth::init();
    database::init_database();
}

/// Admin authentication with rate limiting
#[wasm_bindgen]
pub async fn authenticate_admin(credentials: &str, client_id: &str) -> Result<JsValue, JsValue> {
    console_log!("Admin BFF: Authentication attempt for client: {}", client_id);
    
    // Strict rate limiting for authentication attempts (5 per hour)
    if !rate_limiter::check_rate_limit(client_id, "auth", 5, 3600) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Authentication rate limit exceeded. Please try again later.".to_string()),
            rate_limited: true,
            retry_after: Some(3600),
            requires_auth: false,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Parse credentials
    let creds: AdminCredentials = match serde_json::from_str(credentials) {
        Ok(c) => c,
        Err(e) => {
            let response = AdminBFFResponse {
                success: false,
                data: None,
                error: Some(format!("Invalid credentials format: {}", e)),
                rate_limited: false,
                retry_after: None,
                requires_auth: true,
            };
            return Ok(serde_wasm_bindgen::to_value(&response)?);
        }
    };

    // Validate credentials
    match auth::validate_credentials(&creds.username, &creds.password) {
        Ok(session_token) => {
            console_log!("Admin BFF: Authentication successful");
            let response = AdminBFFResponse {
                success: true,
                data: Some(serde_json::json!({
                    "token": session_token,
                    "expires_in": 3600
                })),
                error: None,
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
        Err(e) => {
            console_error!("Admin BFF: Authentication failed: {}", e);
            let response = AdminBFFResponse {
                success: false,
                data: None,
                error: Some("Invalid credentials".to_string()),
                rate_limited: false,
                retry_after: None,
                requires_auth: true,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
    }
}

/// Get dashboard statistics with authentication
#[wasm_bindgen]
pub async fn get_dashboard_stats(auth_token: &str, client_id: &str) -> Result<JsValue, JsValue> {
    console_log!("Admin BFF: Getting dashboard stats for client: {}", client_id);
    
    // Rate limiting for dashboard requests (60 per hour)
    if !rate_limiter::check_rate_limit(client_id, "dashboard", 60, 3600) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Dashboard rate limit exceeded".to_string()),
            rate_limited: true,
            retry_after: Some(3600),
            requires_auth: false,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Validate authentication
    if !auth::validate_session_token(auth_token) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Invalid or expired session".to_string()),
            rate_limited: false,
            retry_after: None,
            requires_auth: true,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Orchestrate dashboard data retrieval
    match orchestrator::get_dashboard_data().await {
        Ok(dashboard_data) => {
            let response = AdminBFFResponse {
                success: true,
                data: Some(dashboard_data),
                error: None,
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
        Err(e) => {
            console_error!("Admin BFF: Dashboard stats failed: {}", e);
            let response = AdminBFFResponse {
                success: false,
                data: None,
                error: Some(e),
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
    }
}

/// Get all beds with authentication
#[wasm_bindgen]
pub async fn get_beds(auth_token: &str, client_id: &str) -> Result<JsValue, JsValue> {
    console_log!("Admin BFF: Getting beds for client: {}", client_id);
    
    // Rate limiting for bed requests (30 per hour)
    if !rate_limiter::check_rate_limit(client_id, "beds", 30, 3600) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Beds rate limit exceeded".to_string()),
            rate_limited: true,
            retry_after: Some(3600),
            requires_auth: false,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Validate authentication
    if !auth::validate_session_token(auth_token) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Invalid or expired session".to_string()),
            rate_limited: false,
            retry_after: None,
            requires_auth: true,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Orchestrate beds data retrieval
    match orchestrator::get_beds_data().await {
        Ok(beds_data) => {
            let response = AdminBFFResponse {
                success: true,
                data: Some(beds_data),
                error: None,
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
        Err(e) => {
            console_error!("Admin BFF: Get beds failed: {}", e);
            let response = AdminBFFResponse {
                success: false,
                data: None,
                error: Some(e),
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
    }
}

/// Update bed status with authentication
#[wasm_bindgen]
pub async fn update_bed_status(
    request_data: &str,
    auth_token: &str,
    client_id: &str,
) -> Result<JsValue, JsValue> {
    console_log!("Admin BFF: Updating bed status for client: {}", client_id);
    
    // Rate limiting for bed updates (20 per hour)
    if !rate_limiter::check_rate_limit(client_id, "bed_update", 20, 3600) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Bed update rate limit exceeded".to_string()),
            rate_limited: true,
            retry_after: Some(3600),
            requires_auth: false,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Validate authentication
    if !auth::validate_session_token(auth_token) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Invalid or expired session".to_string()),
            rate_limited: false,
            retry_after: None,
            requires_auth: true,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Parse request data
    let request: BedUpdateRequest = match serde_json::from_str(request_data) {
        Ok(req) => req,
        Err(e) => {
            let response = AdminBFFResponse {
                success: false,
                data: None,
                error: Some(format!("Invalid request format: {}", e)),
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            return Ok(serde_wasm_bindgen::to_value(&response)?);
        }
    };

    // Validate bed status
    if !["available", "occupied", "maintenance", "out_of_order"].contains(&request.status.as_str()) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Invalid bed status".to_string()),
            rate_limited: false,
            retry_after: None,
            requires_auth: false,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Orchestrate bed update
    match orchestrator::update_bed_status(&request).await {
        Ok(update_result) => {
            let response = AdminBFFResponse {
                success: true,
                data: Some(update_result),
                error: None,
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
        Err(e) => {
            console_error!("Admin BFF: Bed update failed: {}", e);
            let response = AdminBFFResponse {
                success: false,
                data: None,
                error: Some(e),
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
    }
}

/// Force government submission retry with authentication
#[wasm_bindgen]
pub async fn retry_government_submission(
    request_data: &str,
    auth_token: &str,
    client_id: &str,
) -> Result<JsValue, JsValue> {
    console_log!("Admin BFF: Retrying government submission for client: {}", client_id);
    
    // Rate limiting for government operations (10 per hour)
    if !rate_limiter::check_rate_limit(client_id, "gov_retry", 10, 3600) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Government retry rate limit exceeded".to_string()),
            rate_limited: true,
            retry_after: Some(3600),
            requires_auth: false,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Validate authentication
    if !auth::validate_session_token(auth_token) {
        let response = AdminBFFResponse {
            success: false,
            data: None,
            error: Some("Invalid or expired session".to_string()),
            rate_limited: false,
            retry_after: None,
            requires_auth: true,
        };
        return Ok(serde_wasm_bindgen::to_value(&response)?);
    }

    // Parse request data
    let request: GovernmentSubmissionRequest = match serde_json::from_str(request_data) {
        Ok(req) => req,
        Err(e) => {
            let response = AdminBFFResponse {
                success: false,
                data: None,
                error: Some(format!("Invalid request format: {}", e)),
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            return Ok(serde_wasm_bindgen::to_value(&response)?);
        }
    };

    // Orchestrate government submission retry
    match orchestrator::retry_government_submission(&request).await {
        Ok(retry_result) => {
            let response = AdminBFFResponse {
                success: true,
                data: Some(retry_result),
                error: None,
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
        Err(e) => {
            console_error!("Admin BFF: Government retry failed: {}", e);
            let response = AdminBFFResponse {
                success: false,
                data: None,
                error: Some(e),
                rate_limited: false,
                retry_after: None,
                requires_auth: false,
            };
            Ok(serde_wasm_bindgen::to_value(&response)?)
        }
    }
}

/// Get admin rate limit status
#[wasm_bindgen]
pub fn get_admin_rate_limit_status(client_id: &str) -> Result<JsValue, JsValue> {
    let status = rate_limiter::get_admin_status(client_id);
    Ok(serde_wasm_bindgen::to_value(&status)?)
}

/// Admin logout (invalidate session)
#[wasm_bindgen]
pub fn logout_admin(auth_token: &str) -> Result<JsValue, JsValue> {
    auth::invalidate_session(auth_token);
    
    let response = AdminBFFResponse {
        success: true,
        data: Some(serde_json::json!({"message": "Logged out successfully"})),
        error: None,
        rate_limited: false,
        retry_after: None,
        requires_auth: false,
    };
    
    Ok(serde_wasm_bindgen::to_value(&response)?)
}