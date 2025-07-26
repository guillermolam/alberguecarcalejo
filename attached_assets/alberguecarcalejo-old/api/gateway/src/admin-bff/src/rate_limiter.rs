use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use web_sys::{window, Storage};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AdminRateLimitEntry {
    pub count: u32,
    pub window_start: DateTime<Utc>,
    pub last_request: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminRateLimitStatus {
    pub client_id: String,
    pub admin_limits: HashMap<String, AdminRateLimitInfo>,
    pub is_locked_out: bool,
    pub lockout_expires: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminRateLimitInfo {
    pub current_count: u32,
    pub limit: u32,
    pub window_seconds: u32,
    pub remaining: u32,
    pub reset_time: DateTime<Utc>,
}

static ADMIN_STORAGE_KEY: &str = "albergue_admin_rate_limits";
static LOCKOUT_STORAGE_KEY: &str = "albergue_admin_lockouts";

pub fn init() {
    // Initialize admin rate limiter storage if needed
    if let Ok(storage) = get_storage() {
        if storage
            .get_item(ADMIN_STORAGE_KEY)
            .unwrap_or(None)
            .is_none()
        {
            let empty_limits: HashMap<String, HashMap<String, AdminRateLimitEntry>> =
                HashMap::new();
            let serialized = serde_json::to_string(&empty_limits).unwrap_or_default();
            let _ = storage.set_item(ADMIN_STORAGE_KEY, &serialized);
        }

        if storage
            .get_item(LOCKOUT_STORAGE_KEY)
            .unwrap_or(None)
            .is_none()
        {
            let empty_lockouts: HashMap<String, DateTime<Utc>> = HashMap::new();
            let serialized = serde_json::to_string(&empty_lockouts).unwrap_or_default();
            let _ = storage.set_item(LOCKOUT_STORAGE_KEY, &serialized);
        }
    }
}

pub fn check_rate_limit(client_id: &str, operation: &str, limit: u32, window_seconds: u32) -> bool {
    let storage = match get_storage() {
        Ok(s) => s,
        Err(_) => return true, // Allow if storage unavailable
    };

    // Check if client is locked out
    if is_locked_out(client_id, &storage) {
        return false;
    }

    let now = Utc::now();
    let mut all_limits = load_admin_rate_limits(&storage);

    // Get or create client limits
    let client_limits = all_limits
        .entry(client_id.to_string())
        .or_insert_with(HashMap::new);

    // Check specific operation limit
    let entry = client_limits
        .entry(operation.to_string())
        .or_insert_with(|| AdminRateLimitEntry {
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
        // For authentication failures, implement progressive lockout
        if operation == "auth" && entry.count >= limit {
            implement_lockout(client_id, &storage);
        }
        return false;
    }

    // Update count and timestamp
    entry.count += 1;
    entry.last_request = now;

    // Save updated limits
    save_admin_rate_limits(&storage, &all_limits);

    // Clean old entries periodically
    if entry.count % 5 == 0 {
        cleanup_old_admin_entries(&storage, &mut all_limits);
    }

    true
}

pub fn get_admin_status(client_id: &str) -> AdminRateLimitStatus {
    let storage = match get_storage() {
        Ok(s) => s,
        Err(_) => {
            return AdminRateLimitStatus {
                client_id: client_id.to_string(),
                admin_limits: HashMap::new(),
                is_locked_out: false,
                lockout_expires: None,
            }
        }
    };

    let all_limits = load_admin_rate_limits(&storage);
    let client_limits = all_limits.get(client_id).cloned().unwrap_or_default();

    let mut admin_limits = HashMap::new();
    let now = Utc::now();

    // Admin operations and their stricter limits
    let operations = [
        ("auth", 5, 3600),            // 5 auth attempts per hour
        ("dashboard", 60, 3600),      // 60 dashboard requests per hour
        ("beds", 30, 3600),           // 30 bed requests per hour
        ("bed_update", 20, 3600),     // 20 bed updates per hour
        ("gov_retry", 10, 3600),      // 10 government retries per hour
        ("booking_update", 15, 3600), // 15 booking updates per hour
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

        admin_limits.insert(
            operation.to_string(),
            AdminRateLimitInfo {
                current_count,
                limit: *limit,
                window_seconds: *window_seconds,
                remaining: limit.saturating_sub(current_count),
                reset_time,
            },
        );
    }

    let (is_locked_out, lockout_expires) = check_lockout_status(client_id, &storage);

    AdminRateLimitStatus {
        client_id: client_id.to_string(),
        admin_limits,
        is_locked_out,
        lockout_expires,
    }
}

fn is_locked_out(client_id: &str, storage: &Storage) -> bool {
    let lockouts = load_lockouts(storage);
    if let Some(lockout_time) = lockouts.get(client_id) {
        let now = Utc::now();
        // Lockout duration: 1 hour for first offense, escalating
        let lockout_duration = chrono::Duration::hours(1);
        return now < *lockout_time + lockout_duration;
    }
    false
}

fn implement_lockout(client_id: &str, storage: &Storage) {
    let mut lockouts = load_lockouts(storage);
    lockouts.insert(client_id.to_string(), Utc::now());
    save_lockouts(storage, &lockouts);

    console_log!(
        "Admin BFF: Client {} locked out due to repeated auth failures",
        client_id
    );
}

fn check_lockout_status(client_id: &str, storage: &Storage) -> (bool, Option<DateTime<Utc>>) {
    let lockouts = load_lockouts(storage);
    if let Some(lockout_time) = lockouts.get(client_id) {
        let now = Utc::now();
        let lockout_duration = chrono::Duration::hours(1);
        let lockout_expires = *lockout_time + lockout_duration;

        if now < lockout_expires {
            return (true, Some(lockout_expires));
        } else {
            // Lockout expired, clean it up
            let mut updated_lockouts = lockouts.clone();
            updated_lockouts.remove(client_id);
            save_lockouts(storage, &updated_lockouts);
        }
    }
    (false, None)
}

fn get_storage() -> Result<Storage, JsValue> {
    let window = window().ok_or("No global window")?;
    window
        .local_storage()
        .map_err(|_| "Failed to get localStorage")?
        .ok_or("localStorage not available".into())
}

fn load_admin_rate_limits(
    storage: &Storage,
) -> HashMap<String, HashMap<String, AdminRateLimitEntry>> {
    let data = storage
        .get_item(ADMIN_STORAGE_KEY)
        .unwrap_or(None)
        .unwrap_or_else(|| "{}".to_string());

    serde_json::from_str(&data).unwrap_or_default()
}

fn save_admin_rate_limits(
    storage: &Storage,
    limits: &HashMap<String, HashMap<String, AdminRateLimitEntry>>,
) {
    if let Ok(serialized) = serde_json::to_string(limits) {
        let _ = storage.set_item(ADMIN_STORAGE_KEY, &serialized);
    }
}

fn load_lockouts(storage: &Storage) -> HashMap<String, DateTime<Utc>> {
    let data = storage
        .get_item(LOCKOUT_STORAGE_KEY)
        .unwrap_or(None)
        .unwrap_or_else(|| "{}".to_string());

    serde_json::from_str(&data).unwrap_or_default()
}

fn save_lockouts(storage: &Storage, lockouts: &HashMap<String, DateTime<Utc>>) {
    if let Ok(serialized) = serde_json::to_string(lockouts) {
        let _ = storage.set_item(LOCKOUT_STORAGE_KEY, &serialized);
    }
}

fn cleanup_old_admin_entries(
    storage: &Storage,
    all_limits: &mut HashMap<String, HashMap<String, AdminRateLimitEntry>>,
) {
    let now = Utc::now();
    let cleanup_threshold = chrono::Duration::hours(12); // More aggressive cleanup for admin

    all_limits.retain(|_, client_limits| {
        client_limits
            .retain(|_, entry| now.signed_duration_since(entry.last_request) < cleanup_threshold);
        !client_limits.is_empty()
    });

    save_admin_rate_limits(storage, all_limits);

    // Also cleanup old lockouts
    let mut lockouts = load_lockouts(storage);
    let lockout_threshold = chrono::Duration::hours(24);
    lockouts.retain(|_, lockout_time| now.signed_duration_since(*lockout_time) < lockout_threshold);
    save_lockouts(storage, &lockouts);
}

// Security monitoring for admin operations
pub fn detect_admin_abuse_patterns(client_id: &str) -> bool {
    let storage = match get_storage() {
        Ok(s) => s,
        Err(_) => return false,
    };

    let all_limits = load_admin_rate_limits(&storage);
    let client_limits = match all_limits.get(client_id) {
        Some(limits) => limits,
        None => return false,
    };

    let now = Utc::now();
    let mut suspicious_activity = false;

    // Check for rapid successive admin requests
    let mut recent_admin_requests = 0;
    for entry in client_limits.values() {
        if now.signed_duration_since(entry.last_request).num_seconds() < 5 {
            recent_admin_requests += entry.count;
        }
    }

    if recent_admin_requests > 20 {
        suspicious_activity = true;
        console_error!(
            "Admin BFF: Suspicious rapid requests detected from {}",
            client_id
        );
    }

    // Check for failed authentication patterns
    if let Some(auth_entry) = client_limits.get("auth") {
        if auth_entry.count > 3
            && now
                .signed_duration_since(auth_entry.window_start)
                .num_minutes()
                < 10
        {
            suspicious_activity = true;
            console_error!(
                "Admin BFF: Suspicious auth failure pattern from {}",
                client_id
            );
        }
    }

    suspicious_activity
}

// Enhanced client fingerprinting for admin security
pub fn get_admin_client_fingerprint() -> String {
    let window = match window() {
        Some(w) => w,
        None => return "unknown_admin".to_string(),
    };

    let mut fingerprint_parts = Vec::new();

    if let Ok(navigator) = window.navigator() {
        if let Some(user_agent) = navigator.user_agent().ok() {
            fingerprint_parts.push(user_agent);
        }
        if let Some(language) = navigator.language() {
            fingerprint_parts.push(language);
        }
        if let Some(platform) = navigator.platform().ok() {
            fingerprint_parts.push(platform);
        }
    }

    if let Some(screen) = window.screen().ok() {
        if let Ok(width) = screen.width() {
            if let Ok(height) = screen.height() {
                fingerprint_parts.push(format!("{}x{}", width, height));
            }
        }
        if let Ok(color_depth) = screen.color_depth() {
            fingerprint_parts.push(format!("color:{}", color_depth));
        }
    }

    if let Some(location) = window.location().hostname().ok() {
        fingerprint_parts.push(location);
    }

    // Add timestamp component for admin sessions
    fingerprint_parts.push(format!("admin:{}", chrono::Utc::now().timestamp()));

    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(fingerprint_parts.join("|"));
    let result = hasher.finalize();
    format!("admin_{}", hex::encode(result)[..20].to_string())
}
