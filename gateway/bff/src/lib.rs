// Gateway BFF (Backend for Frontend) entry point
// Routes: security → rate → auth → booking → reviews

use anyhow::Result;
use spin_sdk::{
    http::{Request, Response, IntoResponse},
    http_component,
};

mod auth_verify;

#[path = "booking_service/lib.rs"]
mod booking_service;

#[path = "rate_limiter_service/lib.rs"] 
mod rate_limiter_service;

#[path = "security_service/lib.rs"]
mod security_service;

#[http_component]
async fn handle_request(req: Request) -> Result<impl IntoResponse> {
    let path = req.path();

    // Enable CORS for all responses
    let cors_headers = vec![
        ("Access-Control-Allow-Origin", "*"),
        ("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"),
        ("Access-Control-Allow-Headers", "Content-Type, Authorization"),
    ];

    // Handle preflight requests
    if *req.method() == spin_sdk::http::Method::Options {
        let mut response = Response::builder().status(200);
        for (key, value) in cors_headers {
            response = response.header(key, value);
        }
        return Ok(response.body(()).build());
    }

    // Route to appropriate service
    let result = match path {
        p if p.starts_with("/api/security/") => {
            security_service::handle(&req).await
        }
        p if p.starts_with("/api/rate-limit/") => {
            // First check rate limits
            let rate_check = rate_limiter_service::check_rate_limit(&req).await?;
            if !rate_check {
                return Ok(Response::builder()
                    .status(429)
                    .header("Content-Type", "application/json")
                    .body(serde_json::to_string(&serde_json::json!({
                        "error": "Rate limit exceeded",
                        "message": "Too many requests"
                    }))?)
                    .build());
            }
            rate_limiter_service::handle(&req).await
        }
        p if p.starts_with("/api/auth/") => {
            // Security check first
            security_service::verify_if_needed(&req).await?;
            auth_verify::handle(&req).await
        }
        p if p.starts_with("/api/booking/") => {
            // Full security pipeline
            security_service::verify_if_needed(&req).await?;
            let rate_check = rate_limiter_service::check_rate_limit(&req).await?;
            if !rate_check {
                return Ok(Response::builder()
                    .status(429)
                    .header("Content-Type", "application/json")
                    .body(serde_json::to_string(&serde_json::json!({
                        "error": "Rate limit exceeded"
                    }))?)
                    .build());
            }
            booking_service::handle(&req).await
        }
        _ => {
            return Ok(Response::builder()
                .status(404)
                .header("Content-Type", "application/json")
                .body(serde_json::to_string(&serde_json::json!({
                    "error": "Endpoint not found",
                    "path": path
                }))?)
                .build());
        }
    };

    // Add CORS headers to response
    match result {
        Ok(mut response) => {
            // Add CORS headers to existing response
            for (key, value) in cors_headers {
                response.headers_mut().insert(key.try_into()?, value.try_into()?);
            }
            Ok(response)
        }
        Err(e) => {
            let mut error_response = Response::builder()
                .status(500)
                .header("Content-Type", "application/json");
            
            for (key, value) in cors_headers {
                error_response = error_response.header(key, value);
            }
            
            Ok(error_response.body(serde_json::to_string(&serde_json::json!({
                "error": "Internal server error",
                "message": e.to_string()
            }))?)
            .build())
        }
    }
}