use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use crate::spanish_validator::*;
use crate::types::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct OCRProcessingRequest {
    pub image_data: String, // base64 encoded image
    pub document_type_hint: Option<String>,
    pub document_side: Option<String>, // front/back
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComprehensiveOCRResult {
    // Personal Information
    pub first_name: Option<String>,
    pub last_name1: Option<String>,
    pub last_name2: Option<String>,
    pub document_number: Option<String>,
    pub document_type: Option<String>,
    pub document_support: Option<String>,
    pub birth_date: Option<String>,
    pub gender: Option<String>,
    pub nationality: Option<String>,

    // Address Information
    pub address_street: Option<String>,
    pub address_city: Option<String>,
    pub address_postal_code: Option<String>,
    pub address_country: Option<String>,

    // Processing metadata
    pub confidence: f64,
    pub processing_time: u64,
    pub detected_fields: Vec<String>,
    pub raw_text: String,
    pub is_valid: bool,
    pub errors: Vec<String>,
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
    pub async fn process_document(&self, request_json: &str) -> Result<String, JsValue> {
        let request: OCRProcessingRequest = serde_json::from_str(request_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid request: {}", e)))?;

        let start_time = js_sys::Date::now() as u64;

        // Decode base64 image
        let image_data = self.decode_base64_image(&request.image_data)?;

        // Process with enhanced OCR
        let raw_text = self.extract_text_from_image(&image_data).await?;
        let extracted_data = self.extract_all_document_data(&raw_text, &request);

        let processing_time = js_sys::Date::now() as u64 - start_time;

        let result = ComprehensiveOCRResult {
            first_name: extracted_data.first_name,
            last_name1: extracted_data.last_name1,
            last_name2: extracted_data.last_name2,
            document_number: extracted_data.document_number,
            document_type: extracted_data.document_type,
            document_support: extracted_data.document_support,
            birth_date: extracted_data.birth_date,
            gender: extracted_data.gender,
            nationality: extracted_data.nationality,
            address_street: extracted_data.address_street,
            address_city: extracted_data.address_city,
            address_postal_code: extracted_data.address_postal_code,
            address_country: extracted_data.address_country,
            confidence: extracted_data.confidence,
            processing_time,
            detected_fields: extracted_data.detected_fields,
            raw_text,
            is_valid: extracted_data.is_valid,
            errors: self.validate_extracted_data(&extracted_data),
        };

        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    fn decode_base64_image(&self, base64_data: &str) -> Result<Vec<u8>, JsValue> {
        // Remove data URL prefix if present
        let clean_data = if base64_data.starts_with("data:") {
            base64_data.split(',').nth(1).unwrap_or(base64_data)
        } else {
            base64_data
        };

        base64::decode(clean_data)
            .map_err(|e| JsValue::from_str(&format!("Base64 decode error: {}", e)))
    }

    async fn extract_text_from_image(&self, _image_data: &[u8]) -> Result<String, JsValue> {
        // In real implementation, this would use Tesseract or similar OCR engine
        // For now, return placeholder
        Ok("OCR TEXT EXTRACTION PLACEHOLDER".to_string())
    }

    fn extract_all_document_data(&self, text: &str, context: &OCRProcessingRequest) -> ExtractedDocumentData {
        let lines: Vec<&str> = text.lines().collect();
        let mut result = ExtractedDocumentData::default();
        let mut detected_fields = Vec::new();

        // Spanish document patterns
        let dni_pattern = regex::Regex::new(r"\b\d{8}[A-Z]\b").unwrap();
        let nie_pattern = regex::Regex::new(r"\b[XYZ]\d{7}[A-Z]\b").unwrap();
        let date_pattern = regex::Regex::new(r"\b\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{4}\b").unwrap();

        for line in &lines {
            let upper_line = line.to_uppercase();

            // Extract document number
            if let Some(dni_match) = dni_pattern.find(&upper_line) {
                result.document_number = Some(dni_match.as_str().to_string());
                result.document_type = Some("NIF".to_string());
                detected_fields.push("document_number".to_string());
                detected_fields.push("document_type".to_string());
            } else if let Some(nie_match) = nie_pattern.find(&upper_line) {
                result.document_number = Some(nie_match.as_str().to_string());
                result.document_type = Some("NIE".to_string());
                detected_fields.push("document_number".to_string());
                detected_fields.push("document_type".to_string());
            }

            // Extract birth date
            if let Some(date_match) = date_pattern.find(&upper_line) {
                if let Some(formatted_date) = self.format_date(date_match.as_str()) {
                    result.birth_date = Some(formatted_date);
                    detected_fields.push("birth_date".to_string());
                }
            }

            // Extract names
            if upper_line.contains("NOMBRE") || upper_line.contains("NAME") {
                let clean_line = upper_line.replace("NOMBRE", "").replace("NAME", "").trim().to_string();
                if !clean_line.is_empty() {
                    let parts: Vec<&str> = clean_line.split_whitespace().collect();
                    if !parts.is_empty() {
                        result.first_name = Some(self.capitalize_word(parts[0]));
                        detected_fields.push("first_name".to_string());
                    }
                }
            }

            if upper_line.contains("APELLIDOS") || upper_line.contains("SURNAME") {
                let clean_line = upper_line.replace("APELLIDOS", "").replace("SURNAME", "").trim().to_string();
                if !clean_line.is_empty() {
                    let parts: Vec<&str> = clean_line.split_whitespace().collect();
                    if !parts.is_empty() {
                        result.last_name1 = Some(self.capitalize_word(parts[0]));
                        detected_fields.push("last_name1".to_string());
                    }
                    if parts.len() > 1 {
                        result.last_name2 = Some(self.capitalize_word(parts[1]));
                        detected_fields.push("last_name2".to_string());
                    }
                }
            }

            // Extract gender
            if upper_line.contains("MASCULINO") || upper_line.contains("MALE") || upper_line.contains("HOMBRE") {
                result.gender = Some("H".to_string());
                detected_fields.push("gender".to_string());
            } else if upper_line.contains("FEMENINO") || upper_line.contains("FEMALE") || upper_line.contains("MUJER") {
                result.gender = Some("M".to_string());
                detected_fields.push("gender".to_string());
            }

            // Extract nationality
            if upper_line.contains("ESP") || upper_line.contains("ESPAÑA") || upper_line.contains("SPAIN") {
                result.nationality = Some("ESP".to_string());
                detected_fields.push("nationality".to_string());
            }
        }

        result.detected_fields = detected_fields;
        result.confidence = if result.detected_fields.len() > 3 { 0.9 } else { 0.6 };
        result.is_valid = !result.detected_fields.is_empty();

        result
    }

    fn format_date(&self, date_str: &str) -> Option<String> {
        let parts: Vec<&str> = date_str.split(['/', '-', '.']).collect();
        if parts.len() == 3 {
            let day = parts[0].parse::<u32>().ok()?;
            let month = parts[1].parse::<u32>().ok()?;
            let year = parts[2].parse::<u32>().ok()?;

            if day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100 {
                return Some(format!("{:04}-{:02}-{:02}", year, month, day));
            }
        }
        None
    }

    fn capitalize_word(&self, word: &str) -> String {
        let mut chars = word.chars();
        match chars.next() {
            None => String::new(),
            Some(first) => first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase(),
        }
    }

    fn validate_extracted_data(&self, data: &ExtractedDocumentData) -> Vec<String> {
        let mut errors = Vec::new();

        if let Some(ref birth_date) = data.birth_date {
            if let Some(year) = birth_date.split('-').next().and_then(|y| y.parse::<u32>().ok()) {
                let current_year = 2025; // js_sys::Date::new_0().get_full_year() as u32;
                if year < 1900 || year > current_year {
                    errors.push("Invalid birth year detected".to_string());
                }
            }
        }

        if let (Some(ref doc_num), Some(ref doc_type)) = (&data.document_number, &data.document_type) {
            if doc_type == "NIF" && !regex::Regex::new(r"^\d{8}[A-Z]$").unwrap().is_match(doc_num) {
                errors.push("Invalid DNI/NIF format".to_string());
            } else if doc_type == "NIE" && !regex::Regex::new(r"^[XYZ]\d{7}[A-Z]$").unwrap().is_match(doc_num) {
                errors.push("Invalid NIE format".to_string());
            }
        }

        errors
    }
}

#[derive(Debug, Default)]
struct ExtractedDocumentData {
    first_name: Option<String>,
    last_name1: Option<String>,
    last_name2: Option<String>,
    document_number: Option<String>,
    document_type: Option<String>,
    document_support: Option<String>,
    birth_date: Option<String>,
    gender: Option<String>,
    nationality: Option<String>,
    address_street: Option<String>,
    address_city: Option<String>,
    address_postal_code: Option<String>,
    address_country: Option<String>,
    confidence: f64,
    detected_fields: Vec<String>,
    is_valid: bool,
}