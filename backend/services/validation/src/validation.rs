use worker::*;
use serde_json::json;
use regex::Regex;
use crate::types::*;
use crate::rate_limiter::RateLimiter;

pub struct ValidationService;

impl ValidationService {
    pub fn new() -> Self {
        Self
    }

    pub async fn validate_document(&self, mut req: Request, rate_limiter: &RateLimiter) -> Result<Response> {
        let client_id = self.get_client_fingerprint(&req);
        
        if !rate_limiter.check_limit(&client_id, "DOCUMENT_VALIDATION").await {
            return Response::from_json(&json!({
                "success": false,
                "data": { "valid": false },
                "rate_limited": true
            }));
        }

        let body: DocumentValidationRequest = req.json().await?;
        let validation_result = self.validate_document_number(&body.document_type, &body.document_number);

        Response::from_json(&ValidationResponse {
            success: true,
            data: ValidationData {
                valid: validation_result.valid,
                message: Some(validation_result.message),
                checksum: Some(validation_result.valid),
            },
            rate_limited: false,
        })
    }

    pub async fn validate_email(&self, mut req: Request, rate_limiter: &RateLimiter) -> Result<Response> {
        let client_id = self.get_client_fingerprint(&req);
        
        if !rate_limiter.check_limit(&client_id, "EMAIL_VALIDATION").await {
            return Response::from_json(&json!({
                "success": false,
                "data": { "valid": false },
                "rate_limited": true
            }));
        }

        let body: EmailValidationRequest = req.json().await?;
        let is_valid = self.validate_email_format(&body.email);

        Response::from_json(&ValidationResponse {
            success: true,
            data: ValidationData {
                valid: is_valid,
                message: if is_valid { Some("Valid email format".to_string()) } else { Some("Invalid email format".to_string()) },
                checksum: None,
            },
            rate_limited: false,
        })
    }

    pub async fn validate_phone(&self, mut req: Request, rate_limiter: &RateLimiter) -> Result<Response> {
        let client_id = self.get_client_fingerprint(&req);
        
        if !rate_limiter.check_limit(&client_id, "PHONE_VALIDATION").await {
            return Response::from_json(&json!({
                "success": false,
                "data": { "valid": false },
                "rate_limited": true
            }));
        }

        let body: PhoneValidationRequest = req.json().await?;
        let is_valid = self.validate_phone_number(&body.phone, &body.country_code);

        Response::from_json(&ValidationResponse {
            success: true,
            data: ValidationData {
                valid: is_valid,
                message: if is_valid { Some("Valid phone number".to_string()) } else { Some("Invalid phone number".to_string()) },
                checksum: None,
            },
            rate_limited: false,
        })
    }

    fn validate_document_number(&self, document_type: &str, document_number: &str) -> DocumentValidationResult {
        let sanitized = self.sanitize_input(document_number, 20);
        
        match document_type.to_uppercase().as_str() {
            "DNI" => self.validate_spanish_dni(&sanitized),
            "NIE" => self.validate_spanish_nie(&sanitized),
            "PASSPORT" => self.validate_passport(&sanitized),
            _ => DocumentValidationResult { valid: false, message: "Invalid document type".to_string() }
        }
    }

    fn validate_spanish_dni(&self, dni: &str) -> DocumentValidationResult {
        let dni_regex = Regex::new(r"^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$").unwrap();
        
        if !dni_regex.is_match(dni) {
            return DocumentValidationResult { valid: false, message: "DNI format is invalid".to_string() };
        }
        
        let numbers = &dni[..8];
        let letter = dni.chars().nth(8).unwrap().to_uppercase().next().unwrap();
        let valid_letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        let expected_letter = valid_letters.chars().nth((numbers.parse::<usize>().unwrap()) % 23).unwrap();
        
        if letter != expected_letter {
            return DocumentValidationResult { valid: false, message: "DNI check digit is invalid".to_string() };
        }
        
        DocumentValidationResult { valid: true, message: "DNI is valid".to_string() }
    }

    fn validate_spanish_nie(&self, nie: &str) -> DocumentValidationResult {
        let nie_regex = Regex::new(r"^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$").unwrap();
        
        if !nie_regex.is_match(nie) {
            return DocumentValidationResult { valid: false, message: "NIE format is invalid".to_string() };
        }
        
        let first_letter = nie.chars().nth(0).unwrap().to_uppercase().next().unwrap();
        let mut numbers = nie[1..8].to_string();
        
        match first_letter {
            'X' => numbers = format!("0{}", numbers),
            'Y' => numbers = format!("1{}", numbers),
            'Z' => numbers = format!("2{}", numbers),
            _ => return DocumentValidationResult { valid: false, message: "Invalid NIE prefix".to_string() }
        }
        
        let letter = nie.chars().nth(8).unwrap().to_uppercase().next().unwrap();
        let valid_letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        let expected_letter = valid_letters.chars().nth((numbers.parse::<usize>().unwrap()) % 23).unwrap();
        
        if letter != expected_letter {
            return DocumentValidationResult { valid: false, message: "NIE check digit is invalid".to_string() };
        }
        
        DocumentValidationResult { valid: true, message: "NIE is valid".to_string() }
    }

    fn validate_passport(&self, passport: &str) -> DocumentValidationResult {
        let passport_regex = Regex::new(r"^[A-Z0-9]{6,9}$").unwrap();
        
        if !passport_regex.is_match(passport) {
            return DocumentValidationResult { valid: false, message: "Passport format is invalid".to_string() };
        }
        
        DocumentValidationResult { valid: true, message: "Passport format is valid".to_string() }
    }

    fn validate_email_format(&self, email: &str) -> bool {
        let email_regex = Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
        email_regex.is_match(email)
    }

    fn validate_phone_number(&self, phone: &str, country_code: &str) -> bool {
        let cleaned = phone.chars().filter(|c| c.is_ascii_digit()).collect::<String>();
        
        if cleaned.len() < 7 || cleaned.len() > 15 {
            return false;
        }
        
        match country_code {
            "ES" => cleaned.len() == 9 && (cleaned.starts_with('6') || cleaned.starts_with('7') || cleaned.starts_with('9')),
            "FR" => cleaned.len() == 10 && cleaned.starts_with('0'),
            "DE" => cleaned.len() >= 10 && cleaned.len() <= 12,
            "IT" => cleaned.len() == 10 && cleaned.starts_with('3'),
            "PT" => cleaned.len() == 9 && cleaned.starts_with('9'),
            _ => true
        }
    }

    fn sanitize_input(&self, input: &str, max_length: usize) -> String {
        input
            .chars()
            .filter(|c| !matches!(c, '<' | '>' | '"' | '\'' | '&'))
            .filter(|c| c.is_ascii_graphic() || c.is_whitespace())
            .collect::<String>()
            .trim()
            .chars()
            .take(max_length)
            .collect()
    }

    fn get_client_fingerprint(&self, req: &Request) -> String {
        let ip = req.headers().get("CF-Connecting-IP")
            .unwrap_or_else(|| req.headers().get("X-Forwarded-For").unwrap_or("unknown".to_string()));
        let user_agent = req.headers().get("User-Agent").unwrap_or("unknown".to_string());
        
        format!("{}_{}", ip, &user_agent[..std::cmp::min(user_agent.len(), 16)])
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '_')
            .collect()
    }
}

struct DocumentValidationResult {
    valid: bool,
    message: String,
}