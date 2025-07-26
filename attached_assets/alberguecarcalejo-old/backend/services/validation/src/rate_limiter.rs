use crate::types::{RateLimit, RateLimitConfig};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

pub struct RateLimiter {
    limits: HashMap<String, RateLimit>,
    configs: HashMap<String, RateLimitConfig>,
}

impl RateLimiter {
    pub fn new() -> Self {
        let mut configs = HashMap::new();

        configs.insert(
            "DOCUMENT_VALIDATION".to_string(),
            RateLimitConfig {
                max_requests: 10,
                window_ms: 5 * 60 * 1000, // 5 minutes
            },
        );

        configs.insert(
            "REGISTRATION".to_string(),
            RateLimitConfig {
                max_requests: 3,
                window_ms: 60 * 60 * 1000, // 1 hour
            },
        );

        configs.insert(
            "OCR_PROCESSING".to_string(),
            RateLimitConfig {
                max_requests: 5,
                window_ms: 10 * 60 * 1000, // 10 minutes
            },
        );

        configs.insert(
            "EMAIL_VALIDATION".to_string(),
            RateLimitConfig {
                max_requests: 20,
                window_ms: 60 * 60 * 1000, // 1 hour
            },
        );

        configs.insert(
            "PHONE_VALIDATION".to_string(),
            RateLimitConfig {
                max_requests: 20,
                window_ms: 60 * 60 * 1000, // 1 hour
            },
        );

        configs.insert(
            "ADMIN_AUTH".to_string(),
            RateLimitConfig {
                max_requests: 5,
                window_ms: 60 * 60 * 1000, // 1 hour
            },
        );

        configs.insert(
            "ADMIN_OPERATIONS".to_string(),
            RateLimitConfig {
                max_requests: 50,
                window_ms: 60 * 60 * 1000, // 1 hour
            },
        );

        Self {
            limits: HashMap::new(),
            configs,
        }
    }

    pub async fn check_limit(&mut self, client_id: &str, operation_type: &str) -> bool {
        let config = match self.configs.get(operation_type) {
            Some(config) => config,
            None => return true, // Allow if no config found
        };

        let now = Utc::now().timestamp_millis();
        let key = format!("{}:{}", client_id, operation_type);

        let existing = self.limits.get(&key);

        match existing {
            Some(limit) if now < limit.reset_time => {
                if limit.count >= config.max_requests {
                    false // Rate limit exceeded
                } else {
                    // Increment count
                    self.limits.insert(
                        key,
                        RateLimit {
                            count: limit.count + 1,
                            reset_time: limit.reset_time,
                        },
                    );
                    true
                }
            }
            _ => {
                // Create new or reset expired limit
                self.limits.insert(
                    key,
                    RateLimit {
                        count: 1,
                        reset_time: now + config.window_ms,
                    },
                );
                true
            }
        }
    }

    pub fn cleanup_expired(&mut self) {
        let now = Utc::now().timestamp_millis();
        self.limits.retain(|_, limit| now < limit.reset_time);
    }
}
