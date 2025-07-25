use anyhow::Result;
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
    pub email: Option<String>,
    pub role: Option<String>,
    pub name: Option<String>,
}

/// Generate a JWT token for a user
pub fn generate_token(
    user_id: String,
    email: Option<String>,
    role: Option<String>,
    name: Option<String>,
    expires_in_hours: u64,
) -> Result<String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs() as usize;
    
    let exp = now + (expires_in_hours * 3600) as usize;
    
    let claims = JwtClaims {
        sub: user_id,
        exp,
        iat: now,
        email,
        role,
        name,
    };
    
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "dev-secret-key".to_string());
    
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_ref()),
    )?;
    
    Ok(token)
}

/// Extract user information from JWT claims
pub fn extract_user_info(claims: &JwtClaims) -> (String, Option<String>, Option<String>) {
    (
        claims.sub.clone(),
        claims.email.clone(),
        claims.role.clone(),
    )
}

/// Check if token is expired
pub fn is_token_expired(claims: &JwtClaims) -> bool {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize;
    
    claims.exp < now
}