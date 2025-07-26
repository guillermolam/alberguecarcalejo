use anyhow::Result;
use serde::{Deserialize, Serialize};
use spin_sdk::{
    http::{IntoResponse, Request, Response},
    http_component,
    variables,
};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
struct TokenRequest {
    grant_type: String,
    client_id: String,
    client_secret: String,
    code: String,
    redirect_uri: String,
}

#[derive(Serialize, Deserialize)]
struct TokenResponse {
    access_token: String,
    id_token: Option<String>,
    token_type: String,
    expires_in: u64,
}

#[derive(Serialize, Deserialize)]
struct ErrorResponse {
    error: String,
    message: String,
    auth_url: Option<String>,
}

#[http_component]
async fn handle_request(req: Request) -> Result<impl IntoResponse> {
    let uri = req.uri();
    let path = uri.path();
    let query = uri.query().unwrap_or("");

    // Enable CORS
    let response_builder = Response::builder()
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if req.method().as_str() == "OPTIONS" {
        return Ok(response_builder.status(200).body(()).build());
    }

    match path {
        "/api/auth/login" => handle_login(query).await,
        "/api/auth/callback" => handle_callback(query).await,
        "/api/auth/logout" => handle_logout(query).await,
        "/api/auth/verify" => handle_verify(&req).await,
        _ => Ok(Response::builder()
            .status(404)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Not Found".to_string(),
                message: "Auth endpoint not found".to_string(),
                auth_url: None,
            })?)
            .build()),
    }
}

async fn handle_login(query: &str) -> Result<impl IntoResponse> {
    let params: HashMap<String, String> = url::form_urlencoded::parse(query.as_bytes()).collect();
    
    let auth0_domain = variables::get("auth0_domain")?;
    let client_id = variables::get("auth0_client_id")?;
    
    let redirect_uri = params
        .get("redirect_uri")
        .cloned()
        .unwrap_or_else(|| "https://alberguecarrascalejo.fermyon.app/callback".to_string());
    
    let state = params
        .get("state")
        .cloned()
        .unwrap_or_else(|| "default".to_string());

    let auth_url = format!(
        "https://{}/authorize?response_type=code&client_id={}&redirect_uri={}&scope=openid%20profile%20email&state={}",
        auth0_domain,
        client_id,
        urlencoding::encode(&redirect_uri),
        urlencoding::encode(&state)
    );

    Ok(Response::builder()
        .status(302)
        .header("Location", &auth_url)
        .body(())
        .build())
}

async fn handle_callback(query: &str) -> Result<impl IntoResponse> {
    let params: HashMap<String, String> = url::form_urlencoded::parse(query.as_bytes()).collect();
    
    if let Some(error) = params.get("error") {
        return Ok(Response::builder()
            .status(400)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Authentication failed".to_string(),
                message: error.clone(),
                auth_url: None,
            })?)
            .build());
    }

    let code = params.get("code").ok_or_else(|| {
        anyhow::anyhow!("Authorization code not provided")
    })?;

    let auth0_domain = variables::get("auth0_domain")?;
    let client_id = variables::get("auth0_client_id")?;
    let client_secret = variables::get("auth0_client_secret")?;

    // Exchange code for token
    let token_request = TokenRequest {
        grant_type: "authorization_code".to_string(),
        client_id: client_id.clone(),
        client_secret: client_secret.clone(),
        code: code.clone(),
        redirect_uri: "https://alberguecarrascalejo.fermyon.app/callback".to_string(),
    };

    let token_url = format!("https://{}/oauth/token", auth0_domain);
    let token_body = serde_json::to_string(&token_request)?;

    let token_response = spin_sdk::http::send(
        Request::builder()
            .method("POST")
            .uri(&token_url)
            .header("Content-Type", "application/json")
            .body(token_body)?
            .build(),
    ).await?;

    if token_response.status().as_u16() != 200 {
        let error_body = String::from_utf8_lossy(token_response.body());
        return Ok(Response::builder()
            .status(500)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Token exchange failed".to_string(),
                message: error_body.to_string(),
                auth_url: None,
            })?)
            .build());
    }

    let token_data: TokenResponse = serde_json::from_slice(token_response.body())?;

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&token_data)?)
        .build())
}

async fn handle_logout(query: &str) -> Result<impl IntoResponse> {
    let params: HashMap<String, String> = url::form_urlencoded::parse(query.as_bytes()).collect();
    
    let auth0_domain = variables::get("auth0_domain")?;
    let client_id = variables::get("auth0_client_id")?;
    
    let return_to = params
        .get("returnTo")
        .cloned()
        .unwrap_or_else(|| "https://alberguecarrascalejo.fermyon.app".to_string());

    let logout_url = format!(
        "https://{}/v2/logout?client_id={}&returnTo={}",
        auth0_domain,
        client_id,
        urlencoding::encode(&return_to)
    );

    Ok(Response::builder()
        .status(302)
        .header("Location", &logout_url)
        .body(())
        .build())
}

async fn handle_verify(req: &Request) -> Result<impl IntoResponse> {
    let auth_header = req
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok());

    if let Some(auth_header) = auth_header {
        if auth_header.starts_with("Bearer ") {
            let token = &auth_header[7..];
            
            match verify_jwt_token(token) {
                Ok(payload) => {
                    return Ok(Response::builder()
                        .status(200)
                        .header("Content-Type", "application/json")
                        .body(serde_json::to_string(&serde_json::json!({
                            "valid": true,
                            "user": payload
                        }))?)
                        .build());
                }
                Err(e) => {
                    return Ok(Response::builder()
                        .status(401)
                        .header("Content-Type", "application/json")
                        .body(serde_json::to_string(&ErrorResponse {
                            error: "Invalid token".to_string(),
                            message: e.to_string(),
                            auth_url: None,
                        })?)
                        .build());
                }
            }
        }
    }

    Ok(Response::builder()
        .status(401)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&ErrorResponse {
            error: "No token provided".to_string(),
            message: "Authorization header missing or invalid".to_string(),
            auth_url: None,
        })?)
        .build())
}

fn verify_jwt_token(token: &str) -> Result<serde_json::Value> {
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