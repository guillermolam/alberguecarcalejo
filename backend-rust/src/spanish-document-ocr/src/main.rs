mod models;
mod document_classifier;
mod image_processor;
mod ocr_engine;
mod spanish_validator;
mod passport_parser;
mod dni_parser;
mod utils;
mod http_handler;

use lambda_web::{lambda_web, Request, RequestExt, Response};
use serde_json::{json, Value};
use std::time::Instant;
use tracing::{info, error, warn};

use crate::models::{ImageUploadRequest, OCRResponse, DocumentType};
use crate::document_classifier::DocumentClassifier;
use crate::image_processor::ImageProcessor;
use crate::ocr_engine::OCREngine;
use crate::spanish_validator::SpanishValidator;
use crate::passport_parser::PassportParser;
use crate::dni_parser::SpanishDNIParser;
use crate::utils::Utils;

#[lambda_web]
async fn function_handler(request: Request) -> Result<Response<String>, lambda_web::Error> {
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
    
    info!("Processing OCR request");
    
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
    
    // Validate image size (10MB limit for Lambda)
    let max_size_mb = 10.0;
    
    // Process the document
    match process_document(request_data, max_size_mb).await {
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

async fn process_document(
    request: ImageUploadRequest,
    max_size_mb: f32,
) -> Result<OCRResponse, Box<dyn std::error::Error>> {
    
    // Decode the base64 image
    let image = Utils::decode_base64_image(&request.image_base64)?;
    
    // Validate image size
    Utils::validate_image_size(&image, max_size_mb)?;
    
    // Classify document type first
    let doc_type = DocumentClassifier::classify(&image, request.document_type);
    info!("Detected document type: {}", doc_type.to_string());
    
    // Parse document based on type using specialized parsers
    let document_data = match doc_type {
        DocumentType::DniFront | DocumentType::DniBack | 
        DocumentType::NieFront | DocumentType::NieBack => {
            // Use the new Spanish DNI parser
            let mut dni_parser = SpanishDNIParser::new()?;
            match dni_parser.parse_dni(&image, &doc_type) {
                Ok(data) => data,
                Err(e) => {
                    error!("DNI parsing failed: {}", e);
                    return Ok(OCRResponse {
                        success: false,
                        document_type: doc_type.to_string(),
                        data: None,
                        error: Some(format!("DNI parsing failed: {}", e)),
                        processing_time_ms: 0,
                    });
                }
            }
        },
        DocumentType::Passport => {
            // Use passport parser with improved preprocessing
            let processed_image = ImageProcessor::preprocess_for_ocr(&image)?;
            let mut ocr_engine = OCREngine::new()?;
            let extracted_text = ocr_engine.extract_text(&processed_image)?;
            PassportParser::parse_passport(&extracted_text)
        },
        DocumentType::Other => {
            // Try DNI parsing first as fallback
            let mut dni_parser = SpanishDNIParser::new()?;
            match dni_parser.parse_dni(&image, &DocumentType::DniFront) {
                Ok(data) => data,
                Err(_) => {
                    // If DNI parsing fails, try passport parsing
                    let processed_image = ImageProcessor::preprocess_for_ocr(&image)?;
                    let mut ocr_engine = OCREngine::new()?;
                    let extracted_text = ocr_engine.extract_text(&processed_image)?;
                    PassportParser::parse_passport(&extracted_text)
                }
            }
        }
    };
    
    info!("Parsed document with confidence: {:.2}", document_data.confidence_score);
    
    // Check if we got meaningful data
    if document_data.confidence_score < 0.2 {
        warn!("Very low confidence extraction: {:.2}", document_data.confidence_score);
        return Ok(OCRResponse {
            success: false,
            document_type: doc_type.to_string(),
            data: Some(document_data), // Still return data for debugging
            error: Some("Document quality too low for reliable extraction. Please ensure good lighting and focus.".to_string()),
            processing_time_ms: 0,
        });
    }
    
    Ok(OCRResponse {
        success: true,
        document_type: doc_type.to_string(),
        data: Some(document_data),
        error: None,
        processing_time_ms: 0,
    })
}

#[tokio::main]
async fn main() -> Result<(), lambda_web::Error> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .json()
        .init();
    
    lambda_web::run(function_handler).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    
    #[tokio::test]
    async fn test_invalid_request() {
        let event = LambdaEvent {
            payload: json!({"invalid": "data"}),
            context: lambda_runtime::Context::default(),
        };
        
        let result = function_handler(event).await.unwrap();
        let response: OCRResponse = serde_json::from_value(result).unwrap();
        
        assert!(!response.success);
        assert!(response.error.is_some());
    }
}