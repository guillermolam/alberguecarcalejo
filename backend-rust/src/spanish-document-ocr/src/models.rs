use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ImageUploadRequest {
    pub image_base64: String,
    pub document_type: Option<String>,
    pub side: Option<String>, // "front" or "back"
}

#[derive(Debug, Serialize)]
pub struct OCRResponse {
    pub success: bool,
    pub document_type: String,
    pub data: Option<DocumentData>,
    pub error: Option<String>,
    pub processing_time_ms: u64,
}

#[derive(Debug, Serialize)]
pub struct DocumentData {
    pub document_number: Option<String>,
    pub first_name: Option<String>,
    pub last_names: Option<String>,
    pub birth_date: Option<String>,
    pub expiry_date: Option<String>,
    pub nationality: Option<String>,
    pub address: Option<String>,
    pub postal_code: Option<String>,
    pub validation: ValidationResult,
    pub confidence_score: f32,
}

#[derive(Debug, Serialize)]
pub struct ValidationResult {
    pub format_valid: bool,
    pub checksum_valid: bool,
    pub confidence: f32,
}

#[derive(Debug, Clone)]
pub enum DocumentType {
    DniFront,
    DniBack,
    NieFront,
    NieBack,
    Passport,
    Other,
}

impl DocumentType {
    pub fn from_string(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "NIF" => Self::DniFront,
            "DNI" => Self::DniFront,
            "DNI_FRONT" => Self::DniFront,
            "DNI_BACK" => Self::DniBack,
            "NIE" => Self::NieFront,
            "NIE_FRONT" => Self::NieFront,
            "NIE_BACK" => Self::NieBack,
            "PAS" | "PASSPORT" => Self::Passport,
            _ => Self::Other,
        }
    }
    
    pub fn to_string(&self) -> String {
        match self {
            Self::DniFront => "DNI_FRONT".to_string(),
            Self::DniBack => "DNI_BACK".to_string(),
            Self::NieFront => "NIE_FRONT".to_string(),
            Self::NieBack => "NIE_BACK".to_string(),
            Self::Passport => "PASSPORT".to_string(),
            Self::Other => "OTHER".to_string(),
        }
    }
}