use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use web_sys::{window, Storage};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AdminSession {
    pub token: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub client_fingerprint: String,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct AdminCredentialsHash {
    pub username_hash: String,
    pub password_hash: String,
    pub salt: String,
}

static SESSIONS_STORAGE_KEY: &str = "albergue_admin_sessions";
static CREDENTIALS_STORAGE_KEY: &str = "albergue_admin_credentials";

// Default admin credentials (should be changed in production)
static DEFAULT_USERNAME: &str = "admin";
static DEFAULT_PASSWORD: &str = "albergue2025!";

pub fn init() {
    // Initialize admin authentication storage
    if let Ok(storage) = get_storage() {
        // Initialize sessions storage
        if storage
            .get_item(SESSIONS_STORAGE_KEY)
            .unwrap_or(None)
            .is_none()
        {
            let empty_sessions: HashMap<String, AdminSession> = HashMap::new();
            let serialized = serde_json::to_string(&empty_sessions).unwrap_or_default();
            let _ = storage.set_item(SESSIONS_STORAGE_KEY, &serialized);
        }

        // Initialize default credentials if not set
        if storage
            .get_item(CREDENTIALS_STORAGE_KEY)
            .unwrap_or(None)
            .is_none()
        {
            setup_default_credentials(&storage);
        }
    }
}

pub fn validate_credentials(username: &str, password: &str) -> Result<String, String> {
    let storage = get_storage().map_err(|_| "Storage unavailable")?;

    // Load stored credentials
    let stored_creds = load_credentials(&storage);

    // Hash provided credentials
    let username_hash = hash_string(&format!("{}:{}", username, stored_creds.salt));
    let password_hash = hash_string(&format!("{}:{}", password, stored_creds.salt));

    // Verify credentials
    if username_hash != stored_creds.username_hash || password_hash != stored_creds.password_hash {
        return Err("Invalid credentials".to_string());
    }

    // Create new session
    let session_token = generate_session_token();
    let client_fingerprint = crate::rate_limiter::get_admin_client_fingerprint();

    let session = AdminSession {
        token: session_token.clone(),
        created_at: Utc::now(),
        expires_at: Utc::now() + Duration::hours(1), // 1 hour session
        client_fingerprint,
        is_active: true,
    };

    // Store session
    let mut sessions = load_sessions(&storage);
    sessions.insert(session_token.clone(), session);
    save_sessions(&storage, &sessions);

    // Clean up old sessions
    cleanup_expired_sessions(&storage);

    console_log!("Admin auth: New session created for {}", username);
    Ok(session_token)
}

pub fn validate_session_token(token: &str) -> bool {
    let storage = match get_storage() {
        Ok(s) => s,
        Err(_) => return false,
    };

    let sessions = load_sessions(&storage);

    if let Some(session) = sessions.get(token) {
        let now = Utc::now();

        // Check if session is active and not expired
        if session.is_active && now < session.expires_at {
            // Optional: Verify client fingerprint for additional security
            let current_fingerprint = crate::rate_limiter::get_admin_client_fingerprint();
            if session.client_fingerprint == current_fingerprint {
                return true;
            } else {
                console_error!("Admin auth: Client fingerprint mismatch for session");
            }
        } else {
            console_log!("Admin auth: Session expired or inactive");
        }
    }

    false
}

pub fn invalidate_session(token: &str) {
    let storage = match get_storage() {
        Ok(s) => s,
        Err(_) => return,
    };

    let mut sessions = load_sessions(&storage);

    if let Some(session) = sessions.get_mut(token) {
        session.is_active = false;
        console_log!("Admin auth: Session invalidated");
    }

    save_sessions(&storage, &sessions);
}

pub fn change_admin_credentials(
    current_password: &str,
    new_username: &str,
    new_password: &str,
) -> Result<(), String> {
    let storage = get_storage().map_err(|_| "Storage unavailable")?;

    // Verify current credentials first
    let stored_creds = load_credentials(&storage);
    let current_password_hash = hash_string(&format!("{}:{}", current_password, stored_creds.salt));

    if current_password_hash != stored_creds.password_hash {
        return Err("Current password is incorrect".to_string());
    }

    // Validate new credentials
    if new_username.len() < 3 || new_username.len() > 20 {
        return Err("Username must be between 3 and 20 characters".to_string());
    }

    if new_password.len() < 8 {
        return Err("Password must be at least 8 characters".to_string());
    }

    if !validate_password_strength(new_password) {
        return Err(
            "Password must contain uppercase, lowercase, number, and special character".to_string(),
        );
    }

    // Generate new salt and hash new credentials
    let new_salt = generate_salt();
    let new_username_hash = hash_string(&format!("{}:{}", new_username, new_salt));
    let new_password_hash = hash_string(&format!("{}:{}", new_password, new_salt));

    let new_creds = AdminCredentialsHash {
        username_hash: new_username_hash,
        password_hash: new_password_hash,
        salt: new_salt,
    };

    save_credentials(&storage, &new_creds);

    // Invalidate all existing sessions
    invalidate_all_sessions(&storage);

    console_log!("Admin auth: Credentials updated successfully");
    Ok(())
}

fn setup_default_credentials(storage: &Storage) {
    let salt = generate_salt();
    let username_hash = hash_string(&format!("{}:{}", DEFAULT_USERNAME, salt));
    let password_hash = hash_string(&format!("{}:{}", DEFAULT_PASSWORD, salt));

    let creds = AdminCredentialsHash {
        username_hash,
        password_hash,
        salt,
    };

    save_credentials(storage, &creds);
    console_log!("Admin auth: Default credentials initialized");
}

fn generate_session_token() -> String {
    let timestamp = Utc::now().timestamp_nanos_opt().unwrap_or(0);
    let random_data = js_sys::Math::random().to_string();
    let token_data = format!("admin_session_{}_{}", timestamp, random_data);

    let mut hasher = Sha256::new();
    hasher.update(token_data.as_bytes());
    let result = hasher.finalize();

    format!("adm_{}", hex::encode(result)[..32].to_string())
}

fn generate_salt() -> String {
    let timestamp = Utc::now().timestamp_nanos_opt().unwrap_or(0);
    let random_data = js_sys::Math::random().to_string();
    let salt_data = format!("salt_{}_{}", timestamp, random_data);

    let mut hasher = Sha256::new();
    hasher.update(salt_data.as_bytes());
    let result = hasher.finalize();

    hex::encode(result)[..16].to_string()
}

fn hash_string(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

fn validate_password_strength(password: &str) -> bool {
    let has_uppercase = password.chars().any(|c| c.is_uppercase());
    let has_lowercase = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_special = password
        .chars()
        .any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c));

    has_uppercase && has_lowercase && has_digit && has_special
}

fn cleanup_expired_sessions(storage: &Storage) {
    let mut sessions = load_sessions(storage);
    let now = Utc::now();

    let initial_count = sessions.len();
    sessions.retain(|_, session| session.is_active && now < session.expires_at);

    let cleaned_count = initial_count - sessions.len();
    if cleaned_count > 0 {
        console_log!("Admin auth: Cleaned up {} expired sessions", cleaned_count);
        save_sessions(storage, &sessions);
    }
}

fn invalidate_all_sessions(storage: &Storage) {
    let mut sessions = load_sessions(storage);
    for session in sessions.values_mut() {
        session.is_active = false;
    }
    save_sessions(storage, &sessions);
    console_log!("Admin auth: All sessions invalidated");
}

fn get_storage() -> Result<Storage, JsValue> {
    let window = window().ok_or("No global window")?;
    window
        .local_storage()
        .map_err(|_| "Failed to get localStorage")?
        .ok_or("localStorage not available".into())
}

fn load_sessions(storage: &Storage) -> HashMap<String, AdminSession> {
    let data = storage
        .get_item(SESSIONS_STORAGE_KEY)
        .unwrap_or(None)
        .unwrap_or_else(|| "{}".to_string());

    serde_json::from_str(&data).unwrap_or_default()
}

fn save_sessions(storage: &Storage, sessions: &HashMap<String, AdminSession>) {
    if let Ok(serialized) = serde_json::to_string(sessions) {
        let _ = storage.set_item(SESSIONS_STORAGE_KEY, &serialized);
    }
}

fn load_credentials(storage: &Storage) -> AdminCredentialsHash {
    let data = storage
        .get_item(CREDENTIALS_STORAGE_KEY)
        .unwrap_or(None)
        .unwrap_or_else(|| "{}".to_string());

    serde_json::from_str(&data).unwrap_or_else(|_| {
        // If loading fails, return default (this should not happen in normal operation)
        let salt = generate_salt();
        AdminCredentialsHash {
            username_hash: hash_string(&format!("{}:{}", DEFAULT_USERNAME, salt)),
            password_hash: hash_string(&format!("{}:{}", DEFAULT_PASSWORD, salt)),
            salt,
        }
    })
}

fn save_credentials(storage: &Storage, credentials: &AdminCredentialsHash) {
    if let Ok(serialized) = serde_json::to_string(credentials) {
        let _ = storage.set_item(CREDENTIALS_STORAGE_KEY, &serialized);
    }
}

// Session management utilities
pub fn get_active_sessions_count() -> u32 {
    let storage = match get_storage() {
        Ok(s) => s,
        Err(_) => return 0,
    };

    let sessions = load_sessions(&storage);
    let now = Utc::now();

    sessions
        .values()
        .filter(|session| session.is_active && now < session.expires_at)
        .count() as u32
}

pub fn extend_session(token: &str, additional_hours: i64) -> Result<(), String> {
    let storage = get_storage().map_err(|_| "Storage unavailable")?;
    let mut sessions = load_sessions(&storage);

    if let Some(session) = sessions.get_mut(token) {
        if session.is_active {
            session.expires_at = session.expires_at + Duration::hours(additional_hours);
            save_sessions(&storage, &sessions);
            console_log!("Admin auth: Session extended by {} hours", additional_hours);
            return Ok(());
        }
    }

    Err("Session not found or inactive".to_string())
}

// Security logging and monitoring
pub fn log_security_event(event_type: &str, details: &str) {
    let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
    console_log!("SECURITY [{}]: {} - {}", timestamp, event_type, details);
}
