use worker::*;

mod database;
mod database_service;
mod validation;
mod rate_limiter;
mod country_api;
mod security;
mod types;
mod ocr_service;

use database_service::DatabaseService;
use validation::ValidationService;
use rate_limiter::RateLimiter;
use country_api::CountryService;
use security::SecurityService;
use ocr_service::OCRService;

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    // Initialize services
    let db_service = DatabaseService::new(&env).await?;
    let validation_service = ValidationService::new();
    let mut rate_limiter = RateLimiter::new();
    let country_service = CountryService::new();
    let security_service = SecurityService::new();
    let mut ocr_service = OCRService::new();

    // Parse the request path
    let url = req.url()?;
    let path = url.path();
    
    // Add CORS headers
    let mut response = match (req.method(), path) {
        // Database operations
        (Method::Post, "/api/db/availability") => {
            db_service.check_availability(req).await
        },
        (Method::Get, "/api/db/stats") => {
            db_service.get_dashboard_stats(req).await
        },
        (Method::Post, "/api/db/register") => {
            db_service.register_pilgrim(req).await
        },
        
        // Validation services
        (Method::Post, "/api/validate/document") => {
            validation_service.validate_document(req, &rate_limiter).await
        },
        (Method::Post, "/api/validate/email") => {
            validation_service.validate_email(req, &rate_limiter).await
        },
        (Method::Post, "/api/validate/phone") => {
            validation_service.validate_phone(req, &rate_limiter).await
        },
        
        // Country information service
        (Method::Post, "/api/country/info") => {
            country_service.get_country_info(req, &rate_limiter).await
        },
        
        // Admin authentication
        (Method::Post, "/api/admin/auth") => {
            security_service.authenticate_admin(req, &rate_limiter).await
        },
        
        // OCR Services
        (Method::Post, "/api/ocr/dni") => {
            ocr_service.process_dni_nif(req, &mut rate_limiter).await
        },
        (Method::Post, "/api/ocr/nie") => {
            ocr_service.process_nie(req, &mut rate_limiter).await
        },
        (Method::Post, "/api/ocr/passport") => {
            ocr_service.process_passport(req, &mut rate_limiter).await
        },
        (Method::Post, "/api/ocr/other") => {
            ocr_service.process_other_document(req, &mut rate_limiter).await
        },
        
        // Health check
        (Method::Get, "/health") => {
            Response::ok("Backend services healthy")
        },
        
        _ => Response::error("Not Found", 404)
    }?;

    // Add CORS headers
    response.headers_mut().set("Access-Control-Allow-Origin", "*")?;
    response.headers_mut().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    response.headers_mut().set("Access-Control-Allow-Headers", "Content-Type")?;

    Ok(response)
}