use anyhow::Result;
use spin_sdk::{
    http::{IntoResponse, Request, Response, ResponseBuilder},
    http_component,
    variables,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
struct Auth0Config {
    domain: String,
    client_id: String,
    client_secret: String,
    booking_api_url: String,
    reviews_api_url: String,
}

impl Auth0Config {
    fn from_variables() -> Result<Self> {
        Ok(Self {
            domain: variables::get("auth0_domain")?,
            client_id: variables::get("auth0_client_id")?,
            client_secret: variables::get("auth0_client_secret")?,
            booking_api_url: variables::get("booking_api_url")?,
            reviews_api_url: variables::get("reviews_api_url")?,
        })
    }
}

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
    message: Option<String>,
    auth_url: Option<String>,
}

#[http_component]
async fn handle_request(req: Request) -> Result<impl IntoResponse> {
    let config = Auth0Config::from_variables()?;
    let uri = req.uri();
    let path = uri.path();
    let query = uri.query().unwrap_or("");

    // Enable CORS for all responses
    let mut response_builder = ResponseBuilder::new(200);
    response_builder
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        .header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    if req.method().as_str() == "OPTIONS" {
        return Ok(response_builder.body(()).build());
    }

    match path {
        "/login" => handle_login(&config, query).await,
        "/callback" => handle_callback(&config, query).await,
        "/logout" => handle_logout(&config, query).await,
        "/health" => handle_health().await,
        path if path.starts_with("/booking/dashboard") || path.starts_with("/booking/admin") => {
            // Protected routes - require Auth0 authentication
            match verify_auth0_token(&req, &config).await {
                Ok(_) => proxy_to_service(&req, &config.booking_api_url).await,
                Err(e) => handle_auth_error(&config, &e).await,
            }
        }
        path if path.starts_with("/booking") => {
            proxy_to_service(&req, &config.booking_api_url).await
        }
        path if path.starts_with("/reviews") => {
            proxy_to_service(&req, &config.reviews_api_url).await
        }
        _ => Ok(Response::builder()
            .status(404)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Not found".to_string(),
                message: None,
                auth_url: None,
            })?)
            .build()),
    }
}

async fn handle_login(config: &Auth0Config, query: &str) -> Result<impl IntoResponse> {
    let params: HashMap<String, String> = url::form_urlencoded::parse(query.as_bytes()).collect();
    
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
        config.domain,
        config.client_id,
        urlencoding::encode(&redirect_uri),
        urlencoding::encode(&state)
    );

    println!("🔐 Auth0 Login redirect to: {}", auth_url);

    Ok(Response::builder()
        .status(302)
        .header("Location", &auth_url)
        .body(())
        .build())
}

async fn handle_callback(config: &Auth0Config, query: &str) -> Result<impl IntoResponse> {
    let params: HashMap<String, String> = url::form_urlencoded::parse(query.as_bytes()).collect();
    
    if let Some(error) = params.get("error") {
        println!("🔐 Auth0 Callback error: {}", error);
        return Ok(Response::builder()
            .status(400)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Authentication failed".to_string(),
                message: Some(error.clone()),
                auth_url: None,
            })?)
            .build());
    }

    let code = params.get("code").ok_or_else(|| {
        anyhow::anyhow!("Authorization code not provided")
    })?;

    println!("🔐 Auth0 Callback received code: {}", code.len() > 0);

    // Exchange code for token
    let token_request = TokenRequest {
        grant_type: "authorization_code".to_string(),
        client_id: config.client_id.clone(),
        client_secret: config.client_secret.clone(),
        code: code.clone(),
        redirect_uri: "https://alberguecarrascalejo.fermyon.app/callback".to_string(),
    };

    let token_url = format!("https://{}/oauth/token", config.domain);
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
                message: Some(error_body.to_string()),
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

async fn handle_logout(config: &Auth0Config, query: &str) -> Result<impl IntoResponse> {
    let params: HashMap<String, String> = url::form_urlencoded::parse(query.as_bytes()).collect();
    
    let return_to = params
        .get("returnTo")
        .cloned()
        .unwrap_or_else(|| "https://alberguecarrascalejo.fermyon.app".to_string());

    let logout_url = format!(
        "https://{}/v2/logout?client_id={}&returnTo={}",
        config.domain,
        config.client_id,
        urlencoding::encode(&return_to)
    );

    println!("🔐 Auth0 Logout redirect to: {}", logout_url);

    Ok(Response::builder()
        .status(302)
        .header("Location", &logout_url)
        .body(())
        .build())
}

async fn handle_health() -> Result<impl IntoResponse> {
    let health_data = serde_json::json!({
        "status": "Gateway running",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "auth0_configured": true
    });

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(health_data.to_string())
        .build())
}

async fn verify_auth0_token(req: &Request, config: &Auth0Config) -> Result<()> {
    let auth_header = req
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| anyhow::anyhow!("Missing authorization header"))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(anyhow::anyhow!("Invalid authorization header format"));
    }

    let token = &auth_header[7..];
    
    // Basic JWT validation (decode payload)
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err(anyhow::anyhow!("Invalid JWT format"));
    }

    // Decode the payload (basic validation)
    let payload_b64 = parts[1];
    let payload_bytes = base64::decode_config(payload_b64, base64::URL_SAFE_NO_PAD)
        .map_err(|_| anyhow::anyhow!("Invalid JWT payload encoding"))?;
    
    let payload: serde_json::Value = serde_json::from_slice(&payload_bytes)
        .map_err(|_| anyhow::anyhow!("Invalid JWT payload JSON"))?;

    // Check expiration
    if let Some(exp) = payload.get("exp").and_then(|e| e.as_u64()) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs();
        
        if exp < now {
            return Err(anyhow::anyhow!("Token expired"));
        }
    }

    // Check audience
    if let Some(aud) = payload.get("aud").and_then(|a| a.as_str()) {
        if aud != config.client_id {
            return Err(anyhow::anyhow!("Invalid audience"));
        }
    }

    // Check issuer
    if let Some(iss) = payload.get("iss").and_then(|i| i.as_str()) {
        let expected_issuer = format!("https://{}/", config.domain);
        if iss != expected_issuer {
            return Err(anyhow::anyhow!("Invalid issuer"));
        }
    }

    Ok(())
}

async fn handle_auth_error(config: &Auth0Config, error: &anyhow::Error) -> Result<impl IntoResponse> {
    let auth_url = format!(
        "https://{}/authorize?response_type=code&client_id={}&redirect_uri={}&scope=openid%20profile%20email",
        config.domain,
        config.client_id,
        urlencoding::encode("https://alberguecarrascalejo.fermyon.app/callback")
    );

    let error_response = ErrorResponse {
        error: "Authentication required".to_string(),
        message: Some(error.to_string()),
        auth_url: Some(auth_url),
    };

    Ok(Response::builder()
        .status(401)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&error_response)?)
        .build())
}

async fn proxy_to_service(req: &Request, target_base: &str) -> Result<impl IntoResponse> {
    let uri = req.uri();
    let target_url = format!("{}{}", target_base, uri.path_and_query().map(|pq| pq.as_str()).unwrap_or("/"));

    let mut proxy_request = Request::builder()
        .method(req.method())
        .uri(&target_url);

    // Copy headers
    for (name, value) in req.headers() {
        proxy_request = proxy_request.header(name, value);
    }

    let proxy_request = if req.method() == "GET" || req.method() == "HEAD" {
        proxy_request.body(())?
    } else {
        proxy_request.body(req.body().to_vec())?
    };

    match spin_sdk::http::send(proxy_request.build()).await {
        Ok(response) => {
            let mut response_builder = Response::builder().status(response.status());
            
            // Copy response headers
            for (name, value) in response.headers() {
                response_builder = response_builder.header(name, value);
            }
            
            Ok(response_builder.body(response.body().to_vec()).build())
        }
        Err(e) => Ok(Response::builder()
            .status(500)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Service unavailable".to_string(),
                message: Some(e.to_string()),
                auth_url: None,
            })?)
            .build()),
    }
}