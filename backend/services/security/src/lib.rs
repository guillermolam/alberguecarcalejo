use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::collections::HashMap;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AuthResponse {
    pub success: bool,
    pub token: Option<String>,
    pub user_id: Option<String>,
    pub error: Option<String>,
    pub locked_until: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RateLimitResponse {
    pub allowed: bool,
    pub remaining: u32,
    pub reset_time: String,
    pub error: Option<String>,
}

#[wasm_bindgen]
pub struct SecurityService {
    rate_limits: HashMap<String, RateLimit>,
    failed_attempts: HashMap<String, FailedAttempts>,
}

#[derive(Debug, Clone)]
struct RateLimit {
    count: u32,
    window_start: f64,
    limit: u32,
    window_ms: u32,
}

#[derive(Debug, Clone)]
struct FailedAttempts {
    count: u32,
    last_attempt: f64,
    locked_until: Option<f64>,
}

#[wasm_bindgen]
impl SecurityService {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SecurityService {
        SecurityService {
            rate_limits: HashMap::new(),
            failed_attempts: HashMap::new(),
        }
    }

    #[wasm_bindgen]
    pub fn hash_password(&self, password: &str, salt: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(format!("{}{}", password, salt));
        let result = hasher.finalize();
        base64::encode(result)
    }

    #[wasm_bindgen]
    pub fn verify_password(&self, password: &str, salt: &str, hash: &str) -> bool {
        let computed_hash = self.hash_password(password, salt);
        computed_hash == hash
    }

    #[wasm_bindgen]
    pub fn authenticate(&mut self, username: &str, password: &str) -> String {
        let now = js_sys::Date::now();
        let key = format!("auth_{}", username);

        // Check if account is locked
        if let Some(attempts) = self.failed_attempts.get(&key) {
            if let Some(locked_until) = attempts.locked_until {
                if now < locked_until {
                    return serde_json::to_string(&AuthResponse {
                        success: false,
                        token: None,
                        user_id: None,
                        error: Some("Account temporarily locked".to_string()),
                        locked_until: Some(locked_until.to_string()),
                    }).unwrap();
                }
            }
        }

        // Check rate limiting
        if !self.check_rate_limit(&key, 5, 3600000) { // 5 attempts per hour
            return serde_json::to_string(&AuthResponse {
                success: false,
                token: None,
                user_id: None,
                error: Some("Too many authentication attempts".to_string()),
                locked_until: None,
            }).unwrap();
        }

        // Mock authentication - in reality, this would check against database
        let is_valid = username == "admin" && password == "admin123";

        if is_valid {
            // Clear failed attempts on success
            self.failed_attempts.remove(&key);
            
            // Generate mock token (in reality, use proper JWT or session)
            let token = format!("token_{}", uuid::Uuid::new_v4());
            
            serde_json::to_string(&AuthResponse {
                success: true,
                token: Some(token),
                user_id: Some(username.to_string()),
                error: None,
                locked_until: None,
            }).unwrap()
        } else {
            // Track failed attempt
            let attempts = self.failed_attempts.entry(key).or_insert(FailedAttempts {
                count: 0,
                last_attempt: now,
                locked_until: None,
            });

            attempts.count += 1;
            attempts.last_attempt = now;

            // Progressive lockout
            if attempts.count >= 5 {
                attempts.locked_until = Some(now + 1800000.0); // 30 minutes
            } else if attempts.count >= 3 {
                attempts.locked_until = Some(now + 300000.0); // 5 minutes
            }

            serde_json::to_string(&AuthResponse {
                success: false,
                token: None,
                user_id: None,
                error: Some("Invalid credentials".to_string()),
                locked_until: attempts.locked_until.map(|t| t.to_string()),
            }).unwrap()
        }
    }

    #[wasm_bindgen]
    pub fn check_rate_limit(&mut self, key: &str, limit: u32, window_ms: u32) -> bool {
        let now = js_sys::Date::now();
        
        let rate_limit = self.rate_limits.entry(key.to_string()).or_insert(RateLimit {
            count: 0,
            window_start: now,
            limit,
            window_ms,
        });

        // Check if window has expired
        if now - rate_limit.window_start > window_ms as f64 {
            rate_limit.count = 0;
            rate_limit.window_start = now;
        }

        if rate_limit.count >= rate_limit.limit {
            false
        } else {
            rate_limit.count += 1;
            true
        }
    }

    #[wasm_bindgen]
    pub fn get_rate_limit_info(&self, key: &str) -> String {
        let now = js_sys::Date::now();
        
        if let Some(rate_limit) = self.rate_limits.get(key) {
            let remaining = if rate_limit.count >= rate_limit.limit {
                0
            } else {
                rate_limit.limit - rate_limit.count
            };

            let reset_time = rate_limit.window_start + rate_limit.window_ms as f64;

            serde_json::to_string(&RateLimitResponse {
                allowed: remaining > 0,
                remaining,
                reset_time: reset_time.to_string(),
                error: None,
            }).unwrap()
        } else {
            serde_json::to_string(&RateLimitResponse {
                allowed: true,
                remaining: 10, // Default limit
                reset_time: (now + 3600000.0).to_string(), // 1 hour from now
                error: None,
            }).unwrap()
        }
    }

    #[wasm_bindgen]
    pub fn generate_session_token(&self) -> String {
        uuid::Uuid::new_v4().to_string()
    }

    #[wasm_bindgen]
    pub fn validate_session_token(&self, token: &str) -> bool {
        // Mock validation - in reality, check against session store
        token.starts_with("token_") && token.len() > 10
    }
}