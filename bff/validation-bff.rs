use wasm_bindgen::prelude::*;
use web_sys::console;
use std::collections::HashMap;
use regex::Regex;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Date)]
    fn now() -> f64;
}

// Rate limiting configuration
const DOCUMENT_VALIDATION_LIMIT: u32 = 10; // per 5 minutes
const REGISTRATION_LIMIT: u32 = 3; // per hour
const OCR_LIMIT: u32 = 5; // per 10 minutes

#[wasm_bindgen]
pub struct ValidationBFF {
    rate_limits: HashMap<String, RateLimit>,
}

#[derive(Clone)]
struct RateLimit {
    count: u32,
    reset_time: f64,
    max_attempts: u32,
    window_ms: f64,
}

#[wasm_bindgen]
pub struct ValidationResult {
    is_valid: bool,
    error_message: Option<String>,
    normalized_number: Option<String>,
    rate_limit_exceeded: bool,
}

#[wasm_bindgen]
impl ValidationResult {
    #[wasm_bindgen(getter)]
    pub fn is_valid(&self) -> bool {
        self.is_valid
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> Option<String> {
        self.error_message.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn normalized_number(&self) -> Option<String> {
        self.normalized_number.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn rate_limit_exceeded(&self) -> bool {
        self.rate_limit_exceeded
    }
}

#[wasm_bindgen]
impl ValidationBFF {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ValidationBFF {
        ValidationBFF {
            rate_limits: HashMap::new(),
        }
    }

    fn check_rate_limit(&mut self, client_id: &str, action: &str) -> bool {
        let key = format!("{}:{}", client_id, action);
        let now = now();
        
        let (max_attempts, window_ms) = match action {
            "document_validation" => (DOCUMENT_VALIDATION_LIMIT, 5.0 * 60.0 * 1000.0), // 5 minutes
            "registration" => (REGISTRATION_LIMIT, 60.0 * 60.0 * 1000.0), // 1 hour
            "ocr" => (OCR_LIMIT, 10.0 * 60.0 * 1000.0), // 10 minutes
            _ => (10, 5.0 * 60.0 * 1000.0), // default
        };

        let rate_limit = self.rate_limits.entry(key).or_insert(RateLimit {
            count: 0,
            reset_time: now + window_ms,
            max_attempts,
            window_ms,
        });

        // Reset if window expired
        if now > rate_limit.reset_time {
            rate_limit.count = 0;
            rate_limit.reset_time = now + window_ms;
        }

        if rate_limit.count >= max_attempts {
            return false;
        }

        rate_limit.count += 1;
        true
    }

    fn sanitize_input(&self, input: &str, max_length: usize) -> String {
        input
            .trim()
            .chars()
            .take(max_length)
            .filter(|c| c.is_alphanumeric() || *c == '-' || *c == ' ')
            .collect::<String>()
            .replace(&['<', '>', '"', '\'', '&'][..], "")
    }

    fn validate_dni(&self, dni: &str) -> bool {
        let dni_letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        let dni_regex = Regex::new(r"^\d{8}[A-Z]$").unwrap();
        
        if !dni_regex.is_match(dni) {
            return false;
        }

        let number_part: u32 = dni[..8].parse().unwrap_or(0);
        let letter_part = &dni[8..9];
        let expected_letter = dni_letters.chars().nth((number_part % 23) as usize).unwrap();

        letter_part == expected_letter.to_string()
    }

    fn validate_nie(&self, nie: &str) -> bool {
        let nie_letters = "TRWAGMYFPDXBNJZSQVHLCKE";
        let nie_regex = Regex::new(r"^[XYZ]\d{7}[A-Z]$").unwrap();
        
        if !nie_regex.is_match(nie) {
            return false;
        }

        let first_letter = &nie[0..1];
        let number_part = &nie[1..8];
        let letter_part = &nie[8..9];

        let prefix = match first_letter {
            "X" => 0,
            "Y" => 1,
            "Z" => 2,
            _ => return false,
        };

        let full_number = format!("{}{}", prefix, number_part);
        let number: u32 = full_number.parse().unwrap_or(0);
        let expected_letter = nie_letters.chars().nth((number % 23) as usize).unwrap();

        letter_part == expected_letter.to_string()
    }

    fn validate_passport(&self, passport: &str) -> bool {
        let passport_regex = Regex::new(r"^[A-Z0-9]{6,9}$").unwrap();
        passport_regex.is_match(passport)
    }

    #[wasm_bindgen]
    pub fn validate_document(&mut self, client_id: &str, document_type: &str, document_number: &str) -> ValidationResult {
        // Check rate limit first
        if !self.check_rate_limit(client_id, "document_validation") {
            return ValidationResult {
                is_valid: false,
                error_message: Some("Rate limit exceeded. Please try again later.".to_string()),
                normalized_number: None,
                rate_limit_exceeded: true,
            };
        }

        // Sanitize inputs
        let clean_type = self.sanitize_input(document_type, 10).to_uppercase();
        let clean_number = self.sanitize_input(document_number, 20).to_uppercase().replace(" ", "").replace("-", "");

        // Input validation
        if clean_type.is_empty() || clean_number.is_empty() {
            return ValidationResult {
                is_valid: false,
                error_message: Some("Document type and number are required".to_string()),
                normalized_number: None,
                rate_limit_exceeded: false,
            };
        }

        if clean_number.len() < 3 || clean_number.len() > 20 {
            return ValidationResult {
                is_valid: false,
                error_message: Some("Document number must be between 3 and 20 characters".to_string()),
                normalized_number: None,
                rate_limit_exceeded: false,
            };
        }

        // Validate based on document type
        let (is_valid, error_msg) = match clean_type.as_str() {
            "NIF" | "DNI" => {
                if self.validate_dni(&clean_number) {
                    (true, None)
                } else {
                    (false, Some("Invalid DNI/NIF format or check digit".to_string()))
                }
            },
            "NIE" => {
                if self.validate_nie(&clean_number) {
                    (true, None)
                } else {
                    (false, Some("Invalid NIE format or check digit".to_string()))
                }
            },
            "PAS" | "PASSPORT" => {
                if self.validate_passport(&clean_number) {
                    (true, None)
                } else {
                    (false, Some("Invalid passport format".to_string()))
                }
            },
            "OTRO" => {
                let other_regex = Regex::new(r"^[A-Z0-9]{3,20}$").unwrap();
                if other_regex.is_match(&clean_number) {
                    (true, None)
                } else {
                    (false, Some("Document must contain only alphanumeric characters".to_string()))
                }
            },
            _ => (false, Some("Unsupported document type".to_string())),
        };

        ValidationResult {
            is_valid,
            error_message: error_msg,
            normalized_number: if is_valid { Some(clean_number) } else { None },
            rate_limit_exceeded: false,
        }
    }

    #[wasm_bindgen]
    pub fn validate_email(&mut self, client_id: &str, email: &str) -> ValidationResult {
        if !self.check_rate_limit(client_id, "email_validation") {
            return ValidationResult {
                is_valid: false,
                error_message: Some("Rate limit exceeded".to_string()),
                normalized_number: None,
                rate_limit_exceeded: true,
            };
        }

        let clean_email = self.sanitize_input(email, 100);
        let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();

        let is_valid = email_regex.is_match(&clean_email) && clean_email.len() <= 100;
        
        ValidationResult {
            is_valid,
            error_message: if is_valid { None } else { Some("Invalid email format".to_string()) },
            normalized_number: if is_valid { Some(clean_email) } else { None },
            rate_limit_exceeded: false,
        }
    }

    #[wasm_bindgen]
    pub fn validate_phone(&mut self, client_id: &str, phone: &str, country_code: &str) -> ValidationResult {
        if !self.check_rate_limit(client_id, "phone_validation") {
            return ValidationResult {
                is_valid: false,
                error_message: Some("Rate limit exceeded".to_string()),
                normalized_number: None,
                rate_limit_exceeded: true,
            };
        }

        let clean_phone = phone.chars().filter(|c| c.is_numeric() || *c == '+').collect::<String>();
        
        let pattern = match country_code {
            "ESP" => r"^(\+34|0034|34)?[6789]\d{8}$",
            "FRA" => r"^(\+33|0033|33)?[67]\d{8}$",
            "DEU" => r"^(\+49|0049|49)?1[5-7]\d{8,9}$",
            "ITA" => r"^(\+39|0039|39)?3\d{8,9}$",
            "PRT" => r"^(\+351|00351|351)?9[1236]\d{7}$",
            "USA" => r"^(\+1|001|1)?[2-9]\d{2}[2-9]\d{2}\d{4}$",
            "GBR" => r"^(\+44|0044|44)?7\d{9}$",
            _ => r"^(\+\d{1,4})?\d{7,15}$",
        };

        let phone_regex = Regex::new(pattern).unwrap();
        let is_valid = phone_regex.is_match(&clean_phone);

        ValidationResult {
            is_valid,
            error_message: if is_valid { None } else { Some(format!("Invalid phone number for {}", country_code)) },
            normalized_number: if is_valid { Some(clean_phone) } else { None },
            rate_limit_exceeded: false,
        }
    }

    #[wasm_bindgen]
    pub fn check_registration_rate_limit(&mut self, client_id: &str) -> bool {
        self.check_rate_limit(client_id, "registration")
    }

    #[wasm_bindgen]
    pub fn check_ocr_rate_limit(&mut self, client_id: &str) -> bool {
        self.check_rate_limit(client_id, "ocr")
    }
}

// Initialize the BFF
#[wasm_bindgen(start)]
pub fn main() {
    console::log_1(&"Validation BFF initialized".into());
}