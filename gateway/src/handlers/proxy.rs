use anyhow::Result;
use http::{Method, Request, StatusCode, Uri};
use spin_sdk::http::{IntoResponse, ResponseBuilder};
use spin_sdk::http::OutgoingRequest;

/// Proxy API requests to appropriate microservices
pub fn handle_api_proxy(req: Request<Vec<u8>>) -> Result<impl IntoResponse> {
    let path = req.uri().path();
    let method = req.method();
    
    // Route to appropriate service based on path
    let service_url = match path {
        path if path.starts_with("/api/bookings") => "http://booking-service.internal",
        path if path.starts_with("/api/validate") => "http://validation-service.internal", 
        path if path.starts_with("/api/countries") => "http://country-service.internal",
        path if path.starts_with("/api/security") => "http://security-service.internal",
        path if path.starts_with("/api/rate-limit") => "http://rate-limiter-service.internal",
        _ => {
            log::warn!("Unknown API route: {}", path);
            return Ok(ResponseBuilder::new(StatusCode::NOT_FOUND)
                .header("content-type", "application/json")
                .body(r#"{"error":"API endpoint not found"}"#)
                .build());
        }
    };
    
    // Strip /api prefix and forward to service
    let service_path = path.strip_prefix("/api").unwrap_or(path);
    let target_url = format!("{}{}", service_url, service_path);
    
    log::info!("Proxying {} {} to {}", method, path, target_url);
    
    // Forward the request to the target service
    forward_request(req, &target_url)
}

/// Proxy admin requests with additional security checks
pub fn handle_admin_proxy(req: Request<Vec<u8>>) -> Result<impl IntoResponse> {
    let path = req.uri().path();
    let method = req.method();
    
    // Admin routes are handled by booking service with admin context
    let service_url = "http://booking-service.internal";
    let service_path = path; // Keep full path for admin routes
    let target_url = format!("{}{}", service_url, service_path);
    
    log::info!("Proxying admin {} {} to {}", method, path, target_url);
    
    forward_request(req, &target_url)
}

/// Forward HTTP request to target service
fn forward_request(mut req: Request<Vec<u8>>, target_url: &str) -> Result<impl IntoResponse> {
    // Parse target URL
    let uri: Uri = target_url.parse()
        .map_err(|e| anyhow::anyhow!("Invalid target URL: {}", e))?;
    
    // Create outgoing request
    let mut outgoing_req = OutgoingRequest::new(req.method().clone(), uri);
    
    // Copy headers (excluding host)
    for (name, value) in req.headers() {
        if name != "host" {
            outgoing_req = outgoing_req.header(name, value);
        }
    }
    
    // Copy body
    let body = req.body();
    if !body.is_empty() {
        outgoing_req = outgoing_req.body(body);
    }
    
    // Send request and handle response
    match outgoing_req.send() {
        Ok(response) => {
            log::info!("Service responded with status: {}", response.status());
            
            // Convert response back to gateway response
            let mut builder = ResponseBuilder::new(response.status());
            
            // Copy response headers
            for (name, value) in response.headers() {
                builder = builder.header(name, value);
            }
            
            // Copy response body
            let body = response.body();
            Ok(builder.body(body).build())
        }
        Err(e) => {
            log::error!("Failed to proxy request: {}", e);
            Ok(ResponseBuilder::new(StatusCode::BAD_GATEWAY)
                .header("content-type", "application/json")
                .body(format!(r#"{{"error":"Service unavailable: {}"}}"#, e))
                .build())
        }
    }
}