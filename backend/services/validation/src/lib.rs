use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use regex::Regex;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ValidationResponse {
    pub is_valid: bool,
    pub normalized_value: Option<String>,
    pub error_message: Option<String>,
    pub checksum_valid: Option<bool>,
}

#[wasm_bindgen]
pub struct ValidationService;

#[wasm_bindgen]
impl ValidationService {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ValidationService {
        ValidationService
    }

    #[wasm_bindgen]
    pub fn validate_dni(&self, document_number: &str) -> String {
        let cleaned = document_number.trim().to_uppercase();
        
        // DNI format: 8 digits + 1 letter
        let dni_regex = Regex::new(r"^(\d{8})([A-Z])$").unwrap();
        
        if let Some(caps) = dni_regex.captures(&cleaned) {
            let numbers = &caps[1];
            let letter = &caps[2];
            
            // Validate checksum using mod-23 algorithm
            let letters = "TRWAGMYFPDXBNJZSQVHLCKE";
            let number: u32 = numbers.parse().unwrap_or(0);
            let expected_letter = letters.chars().nth((number % 23) as usize).unwrap_or('X');
            
            let is_valid = letter.chars().next().unwrap() == expected_letter;
            
            let response = ValidationResponse {
                is_valid,
                normalized_value: if is_valid { Some(cleaned) } else { None },
                error_message: if is_valid { None } else { Some("Invalid DNI checksum".to_string()) },
                checksum_valid: Some(is_valid),
            };
            
            serde_json::to_string(&response).unwrap()
        } else {
            let response = ValidationResponse {
                is_valid: false,
                normalized_value: None,
                error_message: Some("Invalid DNI format. Expected: 12345678Z".to_string()),
                checksum_valid: Some(false),
            };
            
            serde_json::to_string(&response).unwrap()
        }
    }

    #[wasm_bindgen]
    pub fn validate_nie(&self, document_number: &str) -> String {
        let cleaned = document_number.trim().to_uppercase();
        
        // NIE format: X/Y/Z + 7 digits + 1 letter
        let nie_regex = Regex::new(r"^([XYZ])(\d{7})([A-Z])$").unwrap();
        
        if let Some(caps) = nie_regex.captures(&cleaned) {
            let prefix = &caps[1];
            let numbers = &caps[2];
            let letter = &caps[3];
            
            // Convert prefix to number for checksum
            let prefix_num = match prefix {
                "X" => "0",
                "Y" => "1", 
                "Z" => "2",
                _ => "0",
            };
            
            let full_number = format!("{}{}", prefix_num, numbers);
            let number: u32 = full_number.parse().unwrap_or(0);
            
            // Validate checksum using mod-23 algorithm
            let letters = "TRWAGMYFPDXBNJZSQVHLCKE";
            let expected_letter = letters.chars().nth((number % 23) as usize).unwrap_or('X');
            
            let is_valid = letter.chars().next().unwrap() == expected_letter;
            
            let response = ValidationResponse {
                is_valid,
                normalized_value: if is_valid { Some(cleaned) } else { None },
                error_message: if is_valid { None } else { Some("Invalid NIE checksum".to_string()) },
                checksum_valid: Some(is_valid),
            };
            
            serde_json::to_string(&response).unwrap()
        } else {
            let response = ValidationResponse {
                is_valid: false,
                normalized_value: None,
                error_message: Some("Invalid NIE format. Expected: X1234567L".to_string()),
                checksum_valid: Some(false),
            };
            
            serde_json::to_string(&response).unwrap()
        }
    }

    #[wasm_bindgen]
    pub fn validate_passport(&self, document_number: &str) -> String {
        let cleaned = document_number.trim().to_uppercase();
        
        // Basic passport validation - alphanumeric, 6-9 characters
        let passport_regex = Regex::new(r"^[A-Z0-9]{6,9}$").unwrap();
        
        let is_valid = passport_regex.is_match(&cleaned);
        
        let response = ValidationResponse {
            is_valid,
            normalized_value: if is_valid { Some(cleaned) } else { None },
            error_message: if is_valid { None } else { Some("Invalid passport format".to_string()) },
            checksum_valid: None,
        };
        
        serde_json::to_string(&response).unwrap()
    }

    #[wasm_bindgen]
    pub fn validate_email(&self, email: &str) -> String {
        let email_regex = Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
        let is_valid = email_regex.is_match(email);
        
        let response = ValidationResponse {
            is_valid,
            normalized_value: if is_valid { Some(email.to_lowercase()) } else { None },
            error_message: if is_valid { None } else { Some("Invalid email format".to_string()) },
            checksum_valid: None,
        };
        
        serde_json::to_string(&response).unwrap()
    }

    #[wasm_bindgen]
    pub fn validate_phone(&self, phone: &str, country_code: &str) -> String {
        // Clean phone number
        let cleaned = phone.chars().filter(|c| c.is_ascii_digit()).collect::<String>();
        
        // Basic phone validation - 6-15 digits
        let is_valid = cleaned.len() >= 6 && cleaned.len() <= 15;
        
        let normalized = if is_valid {
            Some(format!("{}{}", country_code, cleaned))
        } else {
            None
        };
        
        let response = ValidationResponse {
            is_valid,
            normalized_value: normalized,
            error_message: if is_valid { None } else { Some("Invalid phone number length".to_string()) },
            checksum_valid: None,
        };
        
        serde_json::to_string(&response).unwrap()
    }
}