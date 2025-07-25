use anyhow::Result;
use http::{Method, Request, Response, StatusCode};
use spin_sdk::http::{IntoResponse, Params, ResponseBuilder};
use spin_sdk::http_component;

pub mod handlers;
pub mod utils;

use handlers::{auth, health, proxy, static_files};

/// Main HTTP handler for the Spin gateway component
#[http_component]
fn handle_request(req: Request<Vec<u8>>) -> Result<impl IntoResponse> {
    let method = req.method();
    let path = req.uri().path();
    
    log::info!("Gateway handling: {} {}", method, path);

    // Route matching logic
    match (method, path) {
        // Health check endpoint
        (&Method::GET, "/health") => health::handle_health(req),
        
        // Static file serving (frontend assets)
        (&Method::GET, path) if path.starts_with("/assets/") => static_files::handle_static(req),
        (&Method::GET, "/") | (&Method::GET, "/index.html") => static_files::handle_index(req),
        (&Method::GET, path) if path.starts_with("/src/") => static_files::handle_src(req),
        
        // API routes - require authentication and proxy to services
        (_, path) if path.starts_with("/api/") => {
            // First validate JWT token
            match auth::validate_jwt(&req) {
                Ok(_claims) => proxy::handle_api_proxy(req),
                Err(e) => {
                    log::warn!("JWT validation failed: {}", e);
                    Ok(ResponseBuilder::new(StatusCode::UNAUTHORIZED)
                        .header("content-type", "application/json")
                        .body(r#"{"error":"Unauthorized"}"#)
                        .build())
                }
            }
        }
        
        // Admin routes - require admin role
        (_, path) if path.starts_with("/admin/") => {
            match auth::validate_admin_jwt(&req) {
                Ok(_claims) => proxy::handle_admin_proxy(req),
                Err(e) => {
                    log::warn!("Admin JWT validation failed: {}", e);
                    Ok(ResponseBuilder::new(StatusCode::FORBIDDEN)
                        .header("content-type", "application/json")
                        .body(r#"{"error":"Admin access required"}"#)
                        .build())
                }
            }
        }
        
        // Default 404
        _ => {
            log::warn!("Route not found: {} {}", method, path);
            Ok(ResponseBuilder::new(StatusCode::NOT_FOUND)
                .header("content-type", "application/json")
                .body(r#"{"error":"Route not found"}"#)
                .build())
        }
    }
}

/// Helper function to extract path parameters
pub fn extract_path_param(path: &str, prefix: &str) -> Option<&str> {
    path.strip_prefix(prefix)
}