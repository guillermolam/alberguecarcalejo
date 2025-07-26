use anyhow::Result;
use serde::{Deserialize, Serialize};
use spin_sdk::{
    http::{IntoResponse, Request, Response},
    http_component,
};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
struct RateLimitResponse {
    allowed: bool,
    limit: u32,
    remaining: u32,
    reset_time: u64,
    message: String,
}

#[derive(Serialize, Deserialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

// Simple in-memory rate limiting (in production would use Redis or similar)
static mut RATE_LIMITS: Option<HashMap<String, RateLimit>> = None;

#[derive(Clone)]
struct RateLimit {
    count: u32,
    reset_time: u64,
    limit: u32,
}

#[http_component]
async fn handle_request(req: Request) -> Result<impl IntoResponse> {
    let uri = req.uri();
    let path = uri.path();

    // Enable CORS
    let response_builder = Response::builder()
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Forwarded-For");

    if req.method().as_str() == "OPTIONS" {
        return Ok(response_builder.status(200).body(()).build());
    }

    match path {
        "/api/rate-limit/check" => handle_rate_limit_check(&req).await,
        "/api/rate-limit/status" => handle_rate_limit_status(&req).await,
        "/api/rate-limit/reset" => handle_rate_limit_reset(&req).await,
        _ => Ok(Response::builder()
            .status(404)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Not Found".to_string(),
                message: "Rate limit endpoint not found".to_string(),
            })?)
            .build()),
    }
}

async fn handle_rate_limit_check(req: &Request) -> Result<impl IntoResponse> {
    let client_ip = get_client_ip(req);
    let endpoint = req.headers()
        .get("x-endpoint")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("default");
    
    let key = format!("{}:{}", client_ip, endpoint);
    let limit = get_limit_for_endpoint(endpoint);
    
    let rate_limit_result = check_rate_limit(&key, limit);
    
    let response = RateLimitResponse {
        allowed: rate_limit_result.allowed,
        limit: rate_limit_result.limit,
        remaining: rate_limit_result.remaining,
        reset_time: rate_limit_result.reset_time,
        message: if rate_limit_result.allowed {
            "Request allowed".to_string()
        } else {
            "Rate limit exceeded".to_string()
        },
    };

    let status_code = if rate_limit_result.allowed { 200 } else { 429 };

    Ok(Response::builder()
        .status(status_code)
        .header("Content-Type", "application/json")
        .header("X-RateLimit-Limit", &rate_limit_result.limit.to_string())
        .header("X-RateLimit-Remaining", &rate_limit_result.remaining.to_string())
        .header("X-RateLimit-Reset", &rate_limit_result.reset_time.to_string())
        .body(serde_json::to_string(&response)?)
        .build())
}

async fn handle_rate_limit_status(req: &Request) -> Result<impl IntoResponse> {
    let client_ip = get_client_ip(req);
    let endpoint = req.headers()
        .get("x-endpoint")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("default");
    
    let key = format!("{}:{}", client_ip, endpoint);
    let limit = get_limit_for_endpoint(endpoint);
    
    let current_status = get_rate_limit_status(&key, limit);
    
    let response = RateLimitResponse {
        allowed: current_status.remaining > 0,
        limit: current_status.limit,
        remaining: current_status.remaining,
        reset_time: current_status.reset_time,
        message: "Current rate limit status".to_string(),
    };

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&response)?)
        .build())
}

async fn handle_rate_limit_reset(_req: &Request) -> Result<impl IntoResponse> {
    // Reset all rate limits (admin function)
    unsafe {
        RATE_LIMITS = Some(HashMap::new());
    }

    let response = serde_json::json!({
        "message": "All rate limits reset",
        "timestamp": chrono::Utc::now().timestamp()
    });

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(response.to_string())
        .build())
}

fn get_client_ip(req: &Request) -> String {
    req.headers()
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

fn get_limit_for_endpoint(endpoint: &str) -> u32 {
    match endpoint {
        "booking" => 10,      // 10 requests per minute for booking
        "auth" => 5,          // 5 requests per minute for auth
        "reviews" => 30,      // 30 requests per minute for reviews
        "dashboard" => 20,    // 20 requests per minute for dashboard
        _ => 15,              // Default 15 requests per minute
    }
}

struct RateLimitResult {
    allowed: bool,
    limit: u32,
    remaining: u32,
    reset_time: u64,
}

fn check_rate_limit(key: &str, limit: u32) -> RateLimitResult {
    let now = chrono::Utc::now().timestamp() as u64;
    let window_start = (now / 60) * 60; // 1-minute windows
    let reset_time = window_start + 60;

    unsafe {
        if RATE_LIMITS.is_none() {
            RATE_LIMITS = Some(HashMap::new());
        }

        let rate_limits = RATE_LIMITS.as_mut().unwrap();

        let rate_limit = rate_limits.entry(key.to_string()).or_insert(RateLimit {
            count: 0,
            reset_time: reset_time,
            limit,
        });

        // Reset if we're in a new time window
        if now >= rate_limit.reset_time {
            rate_limit.count = 0;
            rate_limit.reset_time = reset_time;
        }

        let allowed = rate_limit.count < limit;
        
        if allowed {
            rate_limit.count += 1;
        }

        RateLimitResult {
            allowed,
            limit,
            remaining: limit.saturating_sub(rate_limit.count),
            reset_time: rate_limit.reset_time,
        }
    }
}

fn get_rate_limit_status(key: &str, limit: u32) -> RateLimitResult {
    let now = chrono::Utc::now().timestamp() as u64;
    let window_start = (now / 60) * 60;
    let reset_time = window_start + 60;

    unsafe {
        if RATE_LIMITS.is_none() {
            RATE_LIMITS = Some(HashMap::new());
        }

        let rate_limits = RATE_LIMITS.as_ref().unwrap();

        if let Some(rate_limit) = rate_limits.get(key) {
            if now >= rate_limit.reset_time {
                // Would be reset
                RateLimitResult {
                    allowed: true,
                    limit,
                    remaining: limit,
                    reset_time,
                }
            } else {
                RateLimitResult {
                    allowed: rate_limit.count < limit,
                    limit,
                    remaining: limit.saturating_sub(rate_limit.count),
                    reset_time: rate_limit.reset_time,
                }
            }
        } else {
            RateLimitResult {
                allowed: true,
                limit,
                remaining: limit,
                reset_time,
            }
        }
    }
}