use anyhow::Result;
use http::{Request, StatusCode};
use serde_json::json;
use spin_sdk::http::{IntoResponse, ResponseBuilder};
use std::time::{SystemTime, UNIX_EPOCH};

/// Health check endpoint for monitoring
pub fn handle_health(_req: Request<Vec<u8>>) -> Result<impl IntoResponse> {
    let health_status = json!({
        "status": "healthy",
        "service": "albergue-gateway",
        "version": "0.1.0",
        "timestamp": SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        "components": {
            "gateway": "ok",
            "auth": "ok",
            "proxy": "ok"
        }
    });

    Ok(ResponseBuilder::new(StatusCode::OK)
        .header("content-type", "application/json")
        .header("cache-control", "no-cache")
        .body(health_status.to_string())
        .build())
}