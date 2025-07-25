use anyhow::Result;
use http::{Request, StatusCode};
use spin_sdk::http::{IntoResponse, ResponseBuilder};

/// Serve the main index.html for the frontend SPA
pub fn handle_index(_req: Request<Vec<u8>>) -> Result<impl IntoResponse> {
    let index_html = include_str!("../../../frontend/public/index.html");
    
    Ok(ResponseBuilder::new(StatusCode::OK)
        .header("content-type", "text/html; charset=utf-8")
        .header("cache-control", "no-cache")
        .body(index_html)
        .build())
}

/// Serve static assets (CSS, JS, images)
pub fn handle_static(req: Request<Vec<u8>>) -> Result<impl IntoResponse> {
    let path = req.uri().path();
    
    log::info!("Serving static asset: {}", path);
    
    // For now, return 404 for missing static assets
    // In production, these would be embedded or served from a CDN
    Ok(ResponseBuilder::new(StatusCode::NOT_FOUND)
        .header("content-type", "text/plain")
        .body("Static asset not found")
        .build())
}

/// Serve frontend source files during development
pub fn handle_src(req: Request<Vec<u8>>) -> Result<impl IntoResponse> {
    let path = req.uri().path();
    
    log::info!("Serving source file: {}", path);
    
    // In development, we might want to proxy to Vite dev server
    // For now, return a helpful message
    Ok(ResponseBuilder::new(StatusCode::NOT_FOUND)
        .header("content-type", "application/json")
        .body(r#"{"error":"Frontend should be served by Vite dev server"}"#)
        .build())
}