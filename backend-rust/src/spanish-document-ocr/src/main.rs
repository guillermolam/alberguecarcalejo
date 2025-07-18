mod models;
mod document_classifier;
mod image_processor;
mod ocr_engine;
mod spanish_validator;
mod passport_parser;
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
    
    // Auto-rotate if needed
    let processed_image = ImageProcessor::auto_rotate(&image);
    
    // Classify document type
    let doc_type = DocumentClassifier::classify(&processed_image, request.document_type);
    
    info!("Detected document type: {}", doc_type.to_string());
    
    // Preprocess image for OCR
    let preprocessed = ImageProcessor::preprocess(&processed_image)?;
    
    // Initialize OCR engine
    let mut ocr_engine = OCREngine::new()?;
    
    // Extract text
    let (extracted_text, confidence) = ocr_engine.extract_text_with_confidence(&preprocessed)?;
    
    if extracted_text.trim().is_empty() {
        warn!("No text extracted from image");
        return Ok(OCRResponse {
            success: false,
            document_type: doc_type.to_string(),
            data: None,
            error: Some("No text could be extracted from the image".to_string()),
            processing_time_ms: 0,
        });
    }
    
    info!("Extracted text length: {} chars, confidence: {:.2}", extracted_text.len(), confidence);
    
    // Parse document based on type
    let document_data = match doc_type {
        DocumentType::DniFront => SpanishValidator::parse_dni_front(&extracted_text),
        DocumentType::DniBack => SpanishValidator::parse_dni_back(&extracted_text),
        DocumentType::NieFront => SpanishValidator::parse_nie_front(&extracted_text),
        DocumentType::NieBack => SpanishValidator::parse_dni_back(&extracted_text), // Same as DNI back
        DocumentType::Passport => PassportParser::parse_passport(&extracted_text),
        DocumentType::Other => {
            // For other documents, just extract basic text information
            let mut data = SpanishValidator::parse_dni_front(&extracted_text);
            data.confidence_score = confidence;
            data
        }
    };
    
    // Ensure minimum confidence threshold
    let final_confidence = (confidence + document_data.confidence_score) / 2.0;
    
    if final_confidence < 0.3 {
        warn!("Low confidence extraction: {:.2}", final_confidence);
        return Ok(OCRResponse {
            success: false,
            document_type: doc_type.to_string(),
            data: None,
            error: Some("Document text quality too low for reliable extraction".to_string()),
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