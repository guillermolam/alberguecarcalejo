use wasm_bindgen::prelude::*;
use web_sys::{window, Storage};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct RateLimitEntry {
    pub count: u32,
    pub window_start: DateTime<Utc>,
    pub last_request: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RateLimitStatus {
    pub client_id: String,
    pub operation_limits: HashMap<String, RateLimitInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RateLimitInfo {
    pub current_count: u32,
    pub limit: u32,
    pub window_seconds: u32,
    pub remaining: u32,
    pub reset_time: DateTime<Utc>,
}

static STORAGE_KEY: &str = "albergue_rate_limits";

pub fn init() {
    // Initialize rate limiter storage if needed
    if let Ok(storage) = get_storage() {
        if storage.get_item(STORAGE_KEY).unwrap_or(None).is_none() {
            let empty_limits: HashMap<String, HashMap<String, RateLimitEntry>> = HashMap::new();
            let serialized = serde_json::to_string(&empty_limits).unwrap_or_default();
            let _ = storage.set_item(STORAGE_KEY, &serialized);
        }
    }
}

pub fn check_rate_limit(client_id: &str, operation: &str, limit: u32, window_seconds: u32) -> bool {
    let storage = match get_storage() {
        Ok(s) => s,
        Err(_) => return true, // Allow if storage unavailable
    };

    let now = Utc::now();
    let mut all_limits = load_rate_limits(&storage);
    
    // Get or create client limits
    let client_limits = all_limits.entry(client_id.to_string()).or_insert_with(HashMap::new);
    
    // Check specific operation limit
    let entry = client_limits.entry(operation.to_string()).or_insert_with(|| RateLimitEntry {
        count: 0,
        window_start: now,
        last_request: now,
    });

    // Check if we need to reset the window
    let window_duration = chrono::Duration::seconds(window_seconds as i64);
    if now.signed_duration_since(entry.window_start) >= window_duration {
        entry.count = 0;
        entry.window_start = now;
    }

    // Check if limit exceeded
    if entry.count >= limit {
        return false;
    }

    // Update count and timestamp
    entry.count += 1;
    entry.last_request = now;

    // Save updated limits
    save_rate_limits(&storage, &all_limits);
    
    // Clean old entries periodically
    if entry.count % 10 == 0 {
        cleanup_old_entries(&storage, &mut all_limits);
    }

    true
}

pub fn get_status(client_id: &str) -> RateLimitStatus {
    let storage = match get_storage() {
        Ok(s) => s,
        Err(_) => return RateLimitStatus {
            client_id: client_id.to_string(),
            operation_limits: HashMap::new(),
        },
    };

    let all_limits = load_rate_limits(&storage);
    let client_limits = all_limits.get(client_id).cloned().unwrap_or_default();
    
    let mut operation_limits = HashMap::new();
    let now = Utc::now();

    // Standard operations and their limits
    let operations = [
        ("availability", 10, 60),
        ("registration", 3, 3600),
        ("validation", 20, 60),
    ];

    for (operation, limit, window_seconds) in operations.iter() {
        let entry = client_limits.get(*operation);
        let (current_count, reset_time) = if let Some(entry) = entry {
            let window_duration = chrono::Duration::seconds(*window_seconds as i64);
            if now.signed_duration_since(entry.window_start) >= window_duration {
                (0, now + window_duration)
            } else {
                (entry.count, entry.window_start + window_duration)
            }
        } else {
            (0, now + chrono::Duration::seconds(*window_seconds as i64))
        };

        operation_limits.insert(operation.to_string(), RateLimitInfo {
            current_count,
            limit: *limit,
            window_seconds: *window_seconds,
            remaining: limit.saturating_sub(current_count),
            reset_time,
        });
    }

    RateLimitStatus {
        client_id: client_id.to_string(),
        operation_limits,
    }
}

fn get_storage() -> Result<Storage, JsValue> {
    let window = window().ok_or("No global window")?;
    window
        .local_storage()
        .map_err(|_| "Failed to get localStorage")?
        .ok_or("localStorage not available".into())
}

fn load_rate_limits(storage: &Storage) -> HashMap<String, HashMap<String, RateLimitEntry>> {
    let data = storage
        .get_item(STORAGE_KEY)
        .unwrap_or(None)
        .unwrap_or_else(|| "{}".to_string());

    serde_json::from_str(&data).unwrap_or_default()
}

fn save_rate_limits(storage: &Storage, limits: &HashMap<String, HashMap<String, RateLimitEntry>>) {
    if let Ok(serialized) = serde_json::to_string(limits) {
        let _ = storage.set_item(STORAGE_KEY, &serialized);
    }
}

fn cleanup_old_entries(storage: &Storage, all_limits: &mut HashMap<String, HashMap<String, RateLimitEntry>>) {
    let now = Utc::now();
    let cleanup_threshold = chrono::Duration::hours(24);

    all_limits.retain(|_, client_limits| {
        client_limits.retain(|_, entry| {
            now.signed_duration_since(entry.last_request) < cleanup_threshold
        });
        !client_limits.is_empty()
    });

    save_rate_limits(storage, all_limits);
}

// Security measures for detecting abuse
pub fn detect_abuse_patterns(client_id: &str) -> bool {
    let storage = match get_storage() {
        Ok(s) => s,
        Err(_) => return false,
    };

    let all_limits = load_rate_limits(&storage);
    let client_limits = match all_limits.get(client_id) {
        Some(limits) => limits,
        None => return false,
    };

    let now = Utc::now();
    let mut suspicious_activity = false;

    // Check for rapid successive requests across operations
    let mut recent_requests = 0;
    for entry in client_limits.values() {
        if now.signed_duration_since(entry.last_request).num_seconds() < 1 {
            recent_requests += entry.count;
        }
    }

    if recent_requests > 50 {
        suspicious_activity = true;
    }

    // Check for patterns indicating bot behavior
    if client_limits.len() > 10 {
        suspicious_activity = true;
    }

    suspicious_activity
}

// IP-based additional protection (simplified for WASM environment)
pub fn get_client_fingerprint() -> String {
    let window = match window() {
        Some(w) => w,
        None => return "unknown".to_string(),
    };

    // Create a simple fingerprint based on available browser info
    let mut fingerprint_parts = Vec::new();

    if let Ok(navigator) = window.navigator() {
        if let Some(user_agent) = navigator.user_agent().ok() {
            fingerprint_parts.push(user_agent);
        }
        if let Some(language) = navigator.language() {
            fingerprint_parts.push(language);
        }
    }

    if let Some(screen) = window.screen().ok() {
        if let Ok(width) = screen.width() {
            if let Ok(height) = screen.height() {
                fingerprint_parts.push(format!("{}x{}", width, height));
            }
        }
    }

    if let Some(location) = window.location().hostname().ok() {
        fingerprint_parts.push(location);
    }

    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(fingerprint_parts.join("|"));
    let result = hasher.finalize();
    hex::encode(result)[..16].to_string()
}