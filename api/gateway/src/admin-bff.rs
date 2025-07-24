use wasm_bindgen::prelude::*;
use web_sys::console;
use std::collections::HashMap;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Date)]
    fn now() -> f64;
}

// Admin-specific rate limiting (stricter than regular validation)
const ADMIN_AUTH_LIMIT: u32 = 5; // per hour
const ADMIN_OPERATION_LIMIT: u32 = 50; // per hour
const ADMIN_EXPORT_LIMIT: u32 = 10; // per hour

#[wasm_bindgen]
pub struct AdminBFF {
    rate_limits: HashMap<String, RateLimit>,
    auth_attempts: HashMap<String, AuthAttempt>,
}

#[derive(Clone)]
struct RateLimit {
    count: u32,
    reset_time: f64,
    max_attempts: u32,
    window_ms: f64,
}

#[derive(Clone)]
struct AuthAttempt {
    failed_attempts: u32,
    lockout_until: f64,
}

#[wasm_bindgen]
pub struct AdminResult {
    allowed: bool,
    error_message: Option<String>,
    lockout_time: Option<f64>,
}

#[wasm_bindgen]
impl AdminResult {
    #[wasm_bindgen(getter)]
    pub fn allowed(&self) -> bool {
        self.allowed
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> Option<String> {
        self.error_message.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn lockout_time(&self) -> Option<f64> {
        self.lockout_time
    }
}

#[wasm_bindgen]
impl AdminBFF {
    #[wasm_bindgen(constructor)]
    pub fn new() -> AdminBFF {
        AdminBFF {
            rate_limits: HashMap::new(),
            auth_attempts: HashMap::new(),
        }
    }

    fn check_rate_limit(&mut self, client_id: &str, action: &str) -> bool {
        let key = format!("admin:{}:{}", client_id, action);
        let now = now();
        
        let (max_attempts, window_ms) = match action {
            "auth" => (ADMIN_AUTH_LIMIT, 60.0 * 60.0 * 1000.0), // 1 hour
            "operation" => (ADMIN_OPERATION_LIMIT, 60.0 * 60.0 * 1000.0), // 1 hour
            "export" => (ADMIN_EXPORT_LIMIT, 60.0 * 60.0 * 1000.0), // 1 hour
            _ => (10, 60.0 * 60.0 * 1000.0), // default
        };

        let rate_limit = self.rate_limits.entry(key).or_insert(RateLimit {
            count: 0,
            reset_time: now + window_ms,
            max_attempts,
            window_ms,
        });

        // Reset if window expired
        if now > rate_limit.reset_time {
            rate_limit.count = 0;
            rate_limit.reset_time = now + window_ms;
        }

        if rate_limit.count >= max_attempts {
            return false;
        }

        rate_limit.count += 1;
        true
    }

    fn is_locked_out(&self, client_id: &str) -> bool {
        if let Some(auth_attempt) = self.auth_attempts.get(client_id) {
            return now() < auth_attempt.lockout_until;
        }
        false
    }

    fn record_auth_failure(&mut self, client_id: &str) {
        let now_time = now();
        let auth_attempt = self.auth_attempts.entry(client_id.to_string()).or_insert(AuthAttempt {
            failed_attempts: 0,
            lockout_until: 0.0,
        });

        auth_attempt.failed_attempts += 1;

        // Progressive lockout: 5 minutes for 3 failures, 30 minutes for 5+ failures
        if auth_attempt.failed_attempts >= 5 {
            auth_attempt.lockout_until = now_time + (30.0 * 60.0 * 1000.0); // 30 minutes
        } else if auth_attempt.failed_attempts >= 3 {
            auth_attempt.lockout_until = now_time + (5.0 * 60.0 * 1000.0); // 5 minutes
        }
    }

    fn sanitize_admin_input(&self, input: &str, max_length: usize) -> String {
        input
            .trim()
            .chars()
            .take(max_length)
            .filter(|c| c.is_alphanumeric() || *c == '@' || *c == '.' || *c == '-' || *c == '_')
            .collect::<String>()
            .replace(&['<', '>', '"', '\'', '&', ';', '(', ')', '{', '}'][..], "")
    }

    #[wasm_bindgen]
    pub fn check_auth_attempt(&mut self, client_id: &str, username: &str, password_hash: &str) -> AdminResult {
        // Check if client is locked out
        if self.is_locked_out(client_id) {
            return AdminResult {
                allowed: false,
                error_message: Some("Account temporarily locked due to failed login attempts".to_string()),
                lockout_time: self.auth_attempts.get(client_id).map(|a| a.lockout_until),
            };
        }

        // Check rate limit
        if !self.check_rate_limit(client_id, "auth") {
            return AdminResult {
                allowed: false,
                error_message: Some("Too many authentication attempts. Please try again later.".to_string()),
                lockout_time: None,
            };
        }

        // Sanitize inputs
        let clean_username = self.sanitize_admin_input(username, 50);
        let clean_password_hash = self.sanitize_admin_input(password_hash, 128);

        // Basic validation (actual auth would be handled by backend)
        if clean_username.is_empty() || clean_password_hash.is_empty() {
            self.record_auth_failure(client_id);
            return AdminResult {
                allowed: false,
                error_message: Some("Invalid credentials".to_string()),
                lockout_time: None,
            };
        }

        if clean_username.len() < 3 || clean_password_hash.len() < 32 {
            self.record_auth_failure(client_id);
            return AdminResult {
                allowed: false,
                error_message: Some("Invalid credentials format".to_string()),
                lockout_time: None,
            };
        }

        // If we reach here, inputs are valid format-wise
        // Backend will handle actual authentication
        AdminResult {
            allowed: true,
            error_message: None,
            lockout_time: None,
        }
    }

    #[wasm_bindgen]
    pub fn check_admin_operation(&mut self, client_id: &str, operation: &str) -> AdminResult {
        // Check rate limit
        if !self.check_rate_limit(client_id, "operation") {
            return AdminResult {
                allowed: false,
                error_message: Some("Rate limit exceeded for admin operations".to_string()),
                lockout_time: None,
            };
        }

        // Validate operation type
        let allowed_operations = [
            "view_dashboard", "view_bookings", "update_bed_status", 
            "generate_report", "view_pilgrim", "update_booking"
        ];

        if !allowed_operations.contains(&operation) {
            return AdminResult {
                allowed: false,
                error_message: Some("Unauthorized operation".to_string()),
                lockout_time: None,
            };
        }

        AdminResult {
            allowed: true,
            error_message: None,
            lockout_time: None,
        }
    }

    #[wasm_bindgen]
    pub fn check_export_request(&mut self, client_id: &str, export_type: &str) -> AdminResult {
        // Check rate limit for exports (more restrictive)
        if !self.check_rate_limit(client_id, "export") {
            return AdminResult {
                allowed: false,
                error_message: Some("Export rate limit exceeded".to_string()),
                lockout_time: None,
            };
        }

        // Validate export type
        let allowed_exports = ["pilgrim_list", "bookings_csv", "government_xml", "occupancy_report"];
        
        if !allowed_exports.contains(&export_type) {
            return AdminResult {
                allowed: false,
                error_message: Some("Invalid export type".to_string()),
                lockout_time: None,
            };
        }

        AdminResult {
            allowed: true,
            error_message: None,
            lockout_time: None,
        }
    }

    #[wasm_bindgen]
    pub fn reset_auth_failures(&mut self, client_id: &str) {
        self.auth_attempts.remove(client_id);
    }
}

// Initialize the Admin BFF
#[wasm_bindgen(start)]
pub fn main() {
    console::log_1(&"Admin BFF initialized".into());
}