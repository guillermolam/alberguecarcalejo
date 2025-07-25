use anyhow::{anyhow, Result};
use http::Request;
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
    pub email: Option<String>,
    pub role: Option<String>,
}

/// Extract and validate JWT token from Authorization header
pub fn validate_jwt(req: &Request<Vec<u8>>) -> Result<Claims> {
    let auth_header = req
        .headers()
        .get("authorization")
        .ok_or_else(|| anyhow!("Missing Authorization header"))?
        .to_str()
        .map_err(|_| anyhow!("Invalid Authorization header format"))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| anyhow!("Invalid Authorization header format"))?;

    // TODO: Get JWT secret from environment or config
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-secret-key".to_string());
    
    let validation = Validation::new(Algorithm::HS256);
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_ref()),
        &validation,
    )
    .map_err(|e| anyhow!("JWT validation failed: {}", e))?;

    Ok(token_data.claims)
}

/// Validate JWT and check for admin role
pub fn validate_admin_jwt(req: &Request<Vec<u8>>) -> Result<Claims> {
    let claims = validate_jwt(req)?;
    
    match claims.role.as_deref() {
        Some("admin") | Some("hostel_owner") => Ok(claims),
        _ => Err(anyhow!("Admin role required")),
    }
}

/// Extract user ID from validated JWT claims
pub fn get_user_id(claims: &Claims) -> &str {
    &claims.sub
}

/// Check if user has specific role
pub fn has_role(claims: &Claims, required_role: &str) -> bool {
    claims.role.as_deref() == Some(required_role)
}