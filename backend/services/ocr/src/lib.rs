use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use regex::Regex;
use base64::{Engine as _, engine::general_purpose};

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[derive(Serialize, Deserialize, Debug)]
pub struct OCRResponse {
    pub success: bool,
    pub extracted_data: Option<serde_json::Value>,
    pub confidence: f32,
    pub processing_time: u32,
    pub detected_fields: Vec<String>,
    pub raw_text: String,
    pub is_valid: bool,
    pub errors: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ExtractedData {
    pub first_name: Option<String>,
    pub last_name1: Option<String>,
    pub last_name2: Option<String>,
    pub document_number: Option<String>,
    pub birth_date: Option<String>,
    pub nationality: Option<String>,
    pub gender: Option<String>,
    pub issue_date: Option<String>,
    pub expiry_date: Option<String>,
}

#[wasm_bindgen]
pub struct OCRService;

#[wasm_bindgen]
impl OCRService {
    #[wasm_bindgen(constructor)]
    pub fn new() -> OCRService {
        OCRService
    }

    #[wasm_bindgen]
    pub async fn process_dni(&self, image_data: &str) -> Result<String, JsValue> {
        // Mock DNI processing - in a real implementation, this would use WASM-compiled OCR
        let start_time = js_sys::Date::now() as u32;
        
        // Simulate processing delay
        let promise = js_sys::Promise::resolve(&JsValue::from(42));
        wasm_bindgen_futures::JsFuture::from(promise).await?;

        let extracted_data = ExtractedData {
            first_name: Some("MARIA".to_string()),
            last_name1: Some("GARCIA".to_string()),
            last_name2: Some("LOPEZ".to_string()),
            document_number: Some("12345678Z".to_string()),
            birth_date: Some("01/01/1985".to_string()),
            nationality: Some("ESP".to_string()),
            gender: Some("F".to_string()),
            issue_date: Some("01/01/2020".to_string()),
            expiry_date: Some("01/01/2030".to_string()),
        };

        let processing_time = js_sys::Date::now() as u32 - start_time;

        let response = OCRResponse {
            success: true,
            extracted_data: Some(serde_json::to_value(&extracted_data).unwrap()),
            confidence: 0.95,
            processing_time,
            detected_fields: vec![
                "first_name".to_string(),
                "last_name1".to_string(), 
                "last_name2".to_string(),
                "document_number".to_string(),
                "birth_date".to_string(),
            ],
            raw_text: "DOCUMENTO NACIONAL DE IDENTIDAD\nMARIA GARCIA LOPEZ\n12345678Z\n01/01/1985".to_string(),
            is_valid: true,
            errors: vec![],
        };

        Ok(serde_json::to_string(&response).unwrap())
    }

    #[wasm_bindgen]
    pub async fn process_nie(&self, image_data: &str) -> Result<String, JsValue> {
        let start_time = js_sys::Date::now() as u32;
        
        let extracted_data = ExtractedData {
            first_name: Some("JOHN".to_string()),
            last_name1: Some("SMITH".to_string()),
            last_name2: None,
            document_number: Some("X1234567L".to_string()),
            birth_date: Some("15/03/1990".to_string()),
            nationality: Some("USA".to_string()),
            gender: Some("M".to_string()),
            issue_date: Some("01/06/2021".to_string()),
            expiry_date: Some("01/06/2031".to_string()),
        };

        let processing_time = js_sys::Date::now() as u32 - start_time;

        let response = OCRResponse {
            success: true,
            extracted_data: Some(serde_json::to_value(&extracted_data).unwrap()),
            confidence: 0.88,
            processing_time,
            detected_fields: vec![
                "first_name".to_string(),
                "last_name1".to_string(),
                "document_number".to_string(),
                "birth_date".to_string(),
            ],
            raw_text: "NUMERO DE IDENTIDAD DE EXTRANJERO\nJOHN SMITH\nX1234567L\n15/03/1990".to_string(),
            is_valid: true,
            errors: vec![],
        };

        Ok(serde_json::to_string(&response).unwrap())
    }

    #[wasm_bindgen]
    pub async fn process_passport(&self, image_data: &str) -> Result<String, JsValue> {
        let start_time = js_sys::Date::now() as u32;
        
        let extracted_data = ExtractedData {
            first_name: Some("PIERRE".to_string()),
            last_name1: Some("MARTIN".to_string()),
            last_name2: None,
            document_number: Some("09AX12345".to_string()),
            birth_date: Some("20/07/1988".to_string()),
            nationality: Some("FRA".to_string()),
            gender: Some("M".to_string()),
            issue_date: Some("12/04/2019".to_string()),
            expiry_date: Some("12/04/2029".to_string()),
        };

        let processing_time = js_sys::Date::now() as u32 - start_time;

        let response = OCRResponse {
            success: true,
            extracted_data: Some(serde_json::to_value(&extracted_data).unwrap()),
            confidence: 0.92,
            processing_time,
            detected_fields: vec![
                "first_name".to_string(),
                "last_name1".to_string(),
                "document_number".to_string(),
                "birth_date".to_string(),
                "nationality".to_string(),
            ],
            raw_text: "PASSPORT\nMARTIN<<PIERRE\n09AX12345FRA8807203M2904125<<<<<<<<<<<<<<04".to_string(),
            is_valid: true,
            errors: vec![],
        };

        Ok(serde_json::to_string(&response).unwrap())
    }

    #[wasm_bindgen]
    pub async fn process_other_document(&self, image_data: &str) -> Result<String, JsValue> {
        let start_time = js_sys::Date::now() as u32;
        
        let extracted_data = ExtractedData {
            first_name: Some("EXTRACTED".to_string()),
            last_name1: Some("NAME".to_string()),
            last_name2: None,
            document_number: Some("UNKNOWN".to_string()),
            birth_date: None,
            nationality: None,
            gender: None,
            issue_date: None,
            expiry_date: None,
        };

        let processing_time = js_sys::Date::now() as u32 - start_time;

        let response = OCRResponse {
            success: true,
            extracted_data: Some(serde_json::to_value(&extracted_data).unwrap()),
            confidence: 0.65,
            processing_time,
            detected_fields: vec!["first_name".to_string(), "last_name1".to_string()],
            raw_text: "Generic document text extraction".to_string(),
            is_valid: false,
            errors: vec!["Document type not specifically supported".to_string()],
        };

        Ok(serde_json::to_string(&response).unwrap())
    }

    #[wasm_bindgen]
    pub fn validate_document_number(&self, document_number: &str, document_type: &str) -> bool {
        match document_type.to_uppercase().as_str() {
            "DNI" => self.validate_dni_checksum(document_number),
            "NIE" => self.validate_nie_checksum(document_number),
            "PASSPORT" => document_number.len() >= 6 && document_number.len() <= 9,
            _ => false,
        }
    }

    fn validate_dni_checksum(&self, document_number: &str) -> bool {
        let dni_regex = Regex::new(r"^(\d{8})([A-Z])$").unwrap();
        
        if let Some(caps) = dni_regex.captures(document_number) {
            let numbers = &caps[1];
            let letter = &caps[2];
            
            let letters = "TRWAGMYFPDXBNJZSQVHLCKE";
            let number: u32 = numbers.parse().unwrap_or(0);
            let expected_letter = letters.chars().nth((number % 23) as usize).unwrap_or('X');
            
            letter.chars().next().unwrap() == expected_letter
        } else {
            false
        }
    }

    fn validate_nie_checksum(&self, document_number: &str) -> bool {
        let nie_regex = Regex::new(r"^([XYZ])(\d{7})([A-Z])$").unwrap();
        
        if let Some(caps) = nie_regex.captures(document_number) {
            let prefix = &caps[1];
            let numbers = &caps[2];
            let letter = &caps[3];
            
            let prefix_num = match prefix {
                "X" => "0",
                "Y" => "1",
                "Z" => "2",
                _ => "0",
            };
            
            let full_number = format!("{}{}", prefix_num, numbers);
            let number: u32 = full_number.parse().unwrap_or(0);
            
            let letters = "TRWAGMYFPDXBNJZSQVHLCKE";
            let expected_letter = letters.chars().nth((number % 23) as usize).unwrap_or('X');
            
            letter.chars().next().unwrap() == expected_letter
        } else {
            false
        }
    }
}