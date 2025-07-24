use lambda_web::{lambda_web, Request, RequestExt, Response};
use serde_json::{json, Value};
use crate::models::{ImageUploadRequest, OCRResponse};
use crate::process_document;
use std::time::Instant;
use tracing::{info, error};

#[lambda_web]
pub async fn http_handler(request: Request) -> Result<Response<String>, lambda_web::Error> {
    let start_time = Instant::now();
    
    // Handle CORS preflight
    if request.method() == "OPTIONS" {
        return Ok(Response::builder()
            .status(200)
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "POST, OPTIONS")
            .header("Access-Control-Allow-Headers", "Content-Type, Origin, Accept, Authorization")
            .header("Access-Control-Max-Age", "86400")
            .body("".to_string())?);
    }
    
    // Only allow POST requests
    if request.method() != "POST" {
        return Ok(Response::builder()
            .status(405)
            .header("Access-Control-Allow-Origin", "*")
            .header("Content-Type", "application/json")
            .body(json!({
                "success": false,
                "error": "Method not allowed"
            }).to_string())?);
    }
    
    // Parse request body
    let body = request.body();
    let request_data: ImageUploadRequest = match serde_json::from_str(body) {
        Ok(req) => req,
        Err(e) => {
            error!("Failed to parse request: {}", e);
            return Ok(Response::builder()
                .status(400)
                .header("Access-Control-Allow-Origin", "*")
                .header("Content-Type", "application/json")
                .body(json!({
                    "success": false,
                    "error": "Invalid request format",
                    "processing_time_ms": start_time.elapsed().as_millis()
                }).to_string())?);
        }
    };
    
    // Process the document
    match process_document(request_data, 10.0).await {
        Ok(response) => {
            let processing_time = start_time.elapsed().as_millis();
            info!("OCR processing completed in {}ms", processing_time);
            
            let final_response = OCRResponse {
                processing_time_ms: processing_time as u64,
                ..response
            };
            
            Ok(Response::builder()
                .status(200)
                .header("Access-Control-Allow-Origin", "*")
                .header("Content-Type", "application/json")
                .body(serde_json::to_string(&final_response)?)?)
        }
        Err(e) => {
            let processing_time = start_time.elapsed().as_millis();
            error!("OCR processing failed: {}", e);
            
            Ok(Response::builder()
                .status(500)
                .header("Access-Control-Allow-Origin", "*")
                .header("Content-Type", "application/json")
                .body(json!({
                    "success": false,
                    "error": e.to_string(),
                    "processing_time_ms": processing_time
                }).to_string())?)
        }
    }
}