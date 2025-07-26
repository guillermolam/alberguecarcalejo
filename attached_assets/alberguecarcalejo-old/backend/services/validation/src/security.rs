use crate::rate_limiter::RateLimiter;
use crate::types::*;
use base64::{engine::general_purpose, Engine as _};
use serde_json::json;
use sha2::{Digest, Sha256};
use worker::*;

pub struct SecurityService;

impl SecurityService {
    pub fn new() -> Self {
        Self
    }

    pub async fn authenticate_admin(
        &self,
        mut req: Request,
        rate_limiter: &RateLimiter,
    ) -> Result<Response> {
        let client_id = self.get_client_fingerprint(&req);

        if !rate_limiter.check_limit(&client_id, "ADMIN_AUTH").await {
            return Response::from_json(&AdminAuthResponse {
                success: false,
                token: None,
                rate_limited: true,
                message: "Too many authentication attempts. Please try again later.".to_string(),
            });
        }

        let body: AdminAuthRequest = req.json().await?;

        // Validate credentials (in production, use proper password hashing)
        let is_valid = self.verify_admin_credentials(&body.username, &body.password);

        if is_valid {
            let token = self.generate_auth_token(&body.username);
            Response::from_json(&AdminAuthResponse {
                success: true,
                token: Some(token),
                rate_limited: false,
                message: "Authentication successful".to_string(),
            })
        } else {
            Response::from_json(&AdminAuthResponse {
                success: false,
                token: None,
                rate_limited: false,
                message: "Invalid credentials".to_string(),
            })
        }
    }

    fn verify_admin_credentials(&self, username: &str, password: &str) -> bool {
        // In production, this would check against secure stored hashes
        // For demo purposes, using simple validation
        username == "admin" && !password.is_empty()
    }

    fn generate_auth_token(&self, username: &str) -> String {
        let timestamp = chrono::Utc::now().timestamp();
        let payload = format!("{}:{}", username, timestamp);

        let mut hasher = Sha256::new();
        hasher.update(payload.as_bytes());
        hasher.update(b"secret_key"); // In production, use proper secret management
        let result = hasher.finalize();

        general_purpose::STANDARD.encode(result)
    }

    pub fn verify_auth_token(&self, token: &str) -> bool {
        // In production, implement proper JWT verification
        !token.is_empty()
    }

    pub fn hash_password(&self, password: &str, salt: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(password.as_bytes());
        hasher.update(salt.as_bytes());
        let result = hasher.finalize();

        general_purpose::STANDARD.encode(result)
    }

    fn get_client_fingerprint(&self, req: &Request) -> String {
        let ip = req.headers().get("CF-Connecting-IP").unwrap_or_else(|| {
            req.headers()
                .get("X-Forwarded-For")
                .unwrap_or("unknown".to_string())
        });
        let user_agent = req
            .headers()
            .get("User-Agent")
            .unwrap_or("unknown".to_string());

        format!(
            "{}_{}",
            ip,
            &user_agent[..std::cmp::min(user_agent.len(), 16)]
        )
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_')
        .collect()
    }
}
