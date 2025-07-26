use anyhow::Result;
use serde::{Deserialize, Serialize};
use spin_sdk::{
    http::{IntoResponse, Request, Response},
    http_component,
    variables,
};

#[derive(Serialize, Deserialize)]
struct SecurityResponse {
    authenticated: bool,
    user_id: Option<String>,
    roles: Vec<String>,
    message: String,
}

#[derive(Serialize, Deserialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

#[http_component]
async fn handle_request(req: Request) -> Result<impl IntoResponse> {
    let uri = req.uri();
    let path = uri.path();

    // Enable CORS
    let response_builder = Response::builder()
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if req.method().as_str() == "OPTIONS" {
        return Ok(response_builder.status(200).body(()).build());
    }

    match path {
        "/api/security/verify" => handle_verify_token(&req).await,
        "/api/security/login" => handle_login().await,
        "/api/security/logout" => handle_logout().await,
        _ => Ok(Response::builder()
            .status(404)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Not Found".to_string(),
                message: "Security endpoint not found".to_string(),
            })?)
            .build()),
    }
}

async fn handle_verify_token(req: &Request) -> Result<impl IntoResponse> {
    let auth_header = req
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok());

    if let Some(auth_header) = auth_header {
        if auth_header.starts_with("Bearer ") {
            let token = &auth_header[7..];
            
            // Basic JWT validation
            match verify_jwt_token(token) {
                Ok(claims) => {
                    let response = SecurityResponse {
                        authenticated: true,
                        user_id: claims.get("sub").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        roles: vec!["user".to_string()],
                        message: "Token valid".to_string(),
                    };
                    
                    return Ok(Response::builder()
                        .status(200)
                        .header("Content-Type", "application/json")
                        .body(serde_json::to_string(&response)?)
                        .build());
                }
                Err(_) => {
                    let response = SecurityResponse {
                        authenticated: false,
                        user_id: None,
                        roles: vec![],
                        message: "Invalid token".to_string(),
                    };
                    
                    return Ok(Response::builder()
                        .status(401)
                        .header("Content-Type", "application/json")
                        .body(serde_json::to_string(&response)?)
                        .build());
                }
            }
        }
    }

    let response = SecurityResponse {
        authenticated: false,
        user_id: None,
        roles: vec![],
        message: "No valid authorization header".to_string(),
    };

    Ok(Response::builder()
        .status(401)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&response)?)
        .build())
}

async fn handle_login() -> Result<impl IntoResponse> {
    let auth0_domain = variables::get("auth0_domain")?;
    let client_id = variables::get("auth0_client_id")?;
    
    let login_url = format!(
        "https://{}/authorize?response_type=code&client_id={}&redirect_uri=https://alberguecarrascalejo.fermyon.app/callback&scope=openid profile email",
        auth0_domain, client_id
    );

    Ok(Response::builder()
        .status(302)
        .header("Location", &login_url)
        .body(())
        .build())
}

async fn handle_logout() -> Result<impl IntoResponse> {
    let auth0_domain = variables::get("auth0_domain")?;
    let client_id = variables::get("auth0_client_id")?;
    
    let logout_url = format!(
        "https://{}/v2/logout?client_id={}&returnTo=https://alberguecarrascalejo.fermyon.app",
        auth0_domain, client_id
    );

    Ok(Response::builder()
        .status(302)
        .header("Location", &logout_url)
        .body(())
        .build())
}

fn verify_jwt_token(token: &str) -> Result<serde_json::Value> {
    // Basic JWT validation - decode payload
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err(anyhow::anyhow!("Invalid JWT format"));
    }

    let payload_b64 = parts[1];
    let payload_bytes = base64::decode_config(payload_b64, base64::URL_SAFE_NO_PAD)?;
    let payload: serde_json::Value = serde_json::from_slice(&payload_bytes)?;

    // Check expiration
    if let Some(exp) = payload.get("exp").and_then(|e| e.as_u64()) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs();
        
        if exp < now {
            return Err(anyhow::anyhow!("Token expired"));
        }
    }

    Ok(payload)
}