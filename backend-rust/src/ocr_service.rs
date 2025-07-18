use serde::{Deserialize, Serialize};
use worker::*;
use crate::rate_limiter::RateLimiter;
use crate::security::SecurityService;

#[derive(Debug, Serialize, Deserialize)]
pub struct OCRRequest {
    pub document_type: String,
    pub document_side: Option<String>, // "front" | "back"
    pub file_data: Vec<u8>,
    pub file_name: String,
    pub mime_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OCRResponse {
    pub success: bool,
    pub extracted_data: ExtractedDocumentData,
    pub confidence: f32,
    pub processing_time_ms: u32,
    pub detected_fields: Vec<String>,
    pub errors: Vec<String>,
    pub raw_text: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExtractedDocumentData {
    // Personal Information
    pub first_name: Option<String>,
    pub last_name_1: Option<String>,
    pub last_name_2: Option<String>,
    pub document_number: Option<String>,
    pub document_type: Option<String>,
    pub document_support: Option<String>,
    pub birth_date: Option<String>,
    pub gender: Option<String>,
    pub nationality: Option<String>,
    
    // Address Information (primarily from back side of DNI/NIE)
    pub address_street: Option<String>,
    pub address_city: Option<String>,
    pub address_postal_code: Option<String>,
    pub address_country: Option<String>,
    pub address_province: Option<String>,
}

pub struct OCRService {
    rate_limiter: RateLimiter,
    security: SecurityService,
}

impl OCRService {
    pub fn new() -> Self {
        Self {
            rate_limiter: RateLimiter::new(),
            security: SecurityService::new(),
        }
    }

    // Process DNI/NIF request from HTTP endpoint
    pub async fn process_dni_nif(&mut self, mut req: Request, rate_limiter: &mut RateLimiter) -> Result<Response> {
        let client_id = self.get_client_id(&req);
        
        if !rate_limiter.check_rate_limit(&client_id, "ocr_dni", 5, 600) {
            return Response::error("Rate limit exceeded for DNI OCR processing", 429);
        }

        let ocr_request: OCRRequest = match req.json().await {
            Ok(data) => data,
            Err(_) => return Response::error("Invalid request body", 400),
        };

        match self.process_dni_nif_data(ocr_request, &client_id).await {
            Ok(response) => Response::from_json(&response),
            Err(error) => Response::error(&error, 500),
        }
    }

    // Process NIE request from HTTP endpoint
    pub async fn process_nie(&mut self, mut req: Request, rate_limiter: &mut RateLimiter) -> Result<Response> {
        let client_id = self.get_client_id(&req);
        
        if !rate_limiter.check_rate_limit(&client_id, "ocr_nie", 5, 600) {
            return Response::error("Rate limit exceeded for NIE OCR processing", 429);
        }

        let ocr_request: OCRRequest = match req.json().await {
            Ok(data) => data,
            Err(_) => return Response::error("Invalid request body", 400),
        };

        match self.process_nie_data(ocr_request, &client_id).await {
            Ok(response) => Response::from_json(&response),
            Err(error) => Response::error(&error, 500),
        }
    }

    // Process Passport request from HTTP endpoint
    pub async fn process_passport(&mut self, mut req: Request, rate_limiter: &mut RateLimiter) -> Result<Response> {
        let client_id = self.get_client_id(&req);
        
        if !rate_limiter.check_rate_limit(&client_id, "ocr_passport", 5, 600) {
            return Response::error("Rate limit exceeded for Passport OCR processing", 429);
        }

        let ocr_request: OCRRequest = match req.json().await {
            Ok(data) => data,
            Err(_) => return Response::error("Invalid request body", 400),
        };

        match self.process_passport_data(ocr_request, &client_id).await {
            Ok(response) => Response::from_json(&response),
            Err(error) => Response::error(&error, 500),
        }
    }

    // Process Other Document request from HTTP endpoint
    pub async fn process_other_document(&mut self, mut req: Request, rate_limiter: &mut RateLimiter) -> Result<Response> {
        let client_id = self.get_client_id(&req);
        
        if !rate_limiter.check_rate_limit(&client_id, "ocr_other", 3, 600) {
            return Response::error("Rate limit exceeded for other document OCR processing", 429);
        }

        #[derive(Deserialize)]
        struct MultiFileRequest {
            files: Vec<OCRRequest>,
        }

        let multi_request: MultiFileRequest = match req.json().await {
            Ok(data) => data,
            Err(_) => return Response::error("Invalid request body", 400),
        };

        match self.process_other_document_data(multi_request.files, &client_id).await {
            Ok(responses) => Response::from_json(&responses),
            Err(error) => Response::error(&error, 500),
        }
    }

    fn get_client_id(&self, req: &Request) -> String {
        // Generate client ID from headers or IP
        req.headers()
            .get("x-forwarded-for")
            .unwrap_or_else(|| req.headers().get("cf-connecting-ip").unwrap_or("unknown".to_string()))
    }

    // DNI/NIF OCR Processing (internal)
    pub async fn process_dni_nif_data(&mut self, request: OCRRequest, client_id: &str) -> Result<OCRResponse, String> {
        // Rate limiting: 5 OCR operations per 10 minutes
        if !self.rate_limiter.check_rate_limit(client_id, "ocr_dni", 5, 600) {
            return Err("Rate limit exceeded for DNI OCR processing".to_string());
        }

        // Security validation
        self.security.validate_file_upload(&request.file_data, &request.mime_type)?;

        let start_time = js_sys::Date::now() as u32;
        
        // Process based on document side
        let extracted_data = match request.document_side.as_deref() {
            Some("front") => self.extract_dni_front_data(&request.file_data).await?,
            Some("back") => self.extract_dni_back_data(&request.file_data).await?,
            _ => self.extract_dni_combined_data(&request.file_data).await?,
        };

        let processing_time = js_sys::Date::now() as u32 - start_time;

        Ok(OCRResponse {
            success: true,
            extracted_data,
            confidence: 0.85, // Placeholder - would use actual OCR confidence
            processing_time_ms: processing_time,
            detected_fields: self.get_detected_fields(&extracted_data),
            errors: vec![],
            raw_text: "".to_string(), // Would contain actual OCR text
        })
    }

    // NIE OCR Processing (internal)
    pub async fn process_nie_data(&mut self, request: OCRRequest, client_id: &str) -> Result<OCRResponse, String> {
        if !self.rate_limiter.check_rate_limit(client_id, "ocr_nie", 5, 600) {
            return Err("Rate limit exceeded for NIE OCR processing".to_string());
        }

        self.security.validate_file_upload(&request.file_data, &request.mime_type)?;

        let start_time = js_sys::Date::now() as u32;
        
        let extracted_data = match request.document_side.as_deref() {
            Some("front") => self.extract_nie_front_data(&request.file_data).await?,
            Some("back") => self.extract_nie_back_data(&request.file_data).await?,
            _ => self.extract_nie_combined_data(&request.file_data).await?,
        };

        let processing_time = js_sys::Date::now() as u32 - start_time;

        Ok(OCRResponse {
            success: true,
            extracted_data,
            confidence: 0.85,
            processing_time_ms: processing_time,
            detected_fields: self.get_detected_fields(&extracted_data),
            errors: vec![],
            raw_text: "".to_string(),
        })
    }

    // Passport OCR Processing (internal)
    pub async fn process_passport_data(&mut self, request: OCRRequest, client_id: &str) -> Result<OCRResponse, String> {
        if !self.rate_limiter.check_rate_limit(client_id, "ocr_passport", 5, 600) {
            return Err("Rate limit exceeded for Passport OCR processing".to_string());
        }

        self.security.validate_file_upload(&request.file_data, &request.mime_type)?;

        let start_time = js_sys::Date::now() as u32;
        let extracted_data = self.extract_passport_data(&request.file_data).await?;
        let processing_time = js_sys::Date::now() as u32 - start_time;

        Ok(OCRResponse {
            success: true,
            extracted_data,
            confidence: 0.80,
            processing_time_ms: processing_time,
            detected_fields: self.get_detected_fields(&extracted_data),
            errors: vec![],
            raw_text: "".to_string(),
        })
    }

    // Other Documents OCR Processing (internal - supports up to 2 files, PDF and DOCX)
    pub async fn process_other_document_data(&mut self, files: Vec<OCRRequest>, client_id: &str) -> Result<Vec<OCRResponse>, String> {
        if files.len() > 2 {
            return Err("Maximum 2 files allowed for other document processing".to_string());
        }

        if !self.rate_limiter.check_rate_limit(client_id, "ocr_other", 3, 600) {
            return Err("Rate limit exceeded for other document OCR processing".to_string());
        }

        let mut responses = Vec::new();

        for request in files {
            // Validate file type (PDF, DOCX, or images)
            if !self.is_supported_document_type(&request.mime_type) {
                return Err(format!("Unsupported file type: {}. Only PDF, DOCX, and images are supported.", request.mime_type));
            }

            self.security.validate_file_upload(&request.file_data, &request.mime_type)?;

            let start_time = js_sys::Date::now() as u32;
            let extracted_data = self.extract_other_document_data(&request.file_data, &request.mime_type).await?;
            let processing_time = js_sys::Date::now() as u32 - start_time;

            responses.push(OCRResponse {
                success: true,
                extracted_data,
                confidence: 0.75,
                processing_time_ms: processing_time,
                detected_fields: self.get_detected_fields(&extracted_data),
                errors: vec![],
                raw_text: "".to_string(),
            });
        }

        Ok(responses)
    }

    // DNI Front Side Data Extraction
    async fn extract_dni_front_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        // Simulate OCR processing - in real implementation would use Tesseract.js or similar
        // Front side of DNI contains: Name, surnames, document number, birth date, gender, nationality
        
        Ok(ExtractedDocumentData {
            first_name: Some("EXAMPLE".to_string()),
            last_name_1: Some("APELLIDO1".to_string()),
            last_name_2: Some("APELLIDO2".to_string()),
            document_number: Some("12345678Z".to_string()),
            document_type: Some("DNI".to_string()),
            document_support: Some("ESP".to_string()),
            birth_date: Some("01/01/1990".to_string()),
            gender: Some("H".to_string()),
            nationality: Some("ESP".to_string()),
            address_street: None,
            address_city: None,
            address_postal_code: None,
            address_country: None,
            address_province: None,
        })
    }

    // DNI Back Side Data Extraction
    async fn extract_dni_back_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        // Back side of DNI contains: Address information, municipality, province
        
        Ok(ExtractedDocumentData {
            first_name: None,
            last_name_1: None,
            last_name_2: None,
            document_number: None,
            document_type: None,
            document_support: None,
            birth_date: None,
            gender: None,
            nationality: None,
            address_street: Some("CALLE EJEMPLO 123".to_string()),
            address_city: Some("MADRID".to_string()),
            address_postal_code: Some("28001".to_string()),
            address_country: Some("ESPAÑA".to_string()),
            address_province: Some("MADRID".to_string()),
        })
    }

    async fn extract_dni_combined_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        // Combined processing for single-side capture
        let mut front_data = self.extract_dni_front_data(file_data).await?;
        let back_data = self.extract_dni_back_data(file_data).await?;
        
        // Merge data, preferring back side for address info
        front_data.address_street = back_data.address_street;
        front_data.address_city = back_data.address_city;
        front_data.address_postal_code = back_data.address_postal_code;
        front_data.address_country = back_data.address_country;
        front_data.address_province = back_data.address_province;
        
        Ok(front_data)
    }

    // NIE Processing Methods
    async fn extract_nie_front_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        Ok(ExtractedDocumentData {
            first_name: Some("EXAMPLE".to_string()),
            last_name_1: Some("SURNAME1".to_string()),
            last_name_2: Some("SURNAME2".to_string()),
            document_number: Some("X1234567L".to_string()),
            document_type: Some("NIE".to_string()),
            document_support: Some("ESP".to_string()),
            birth_date: Some("01/01/1990".to_string()),
            gender: Some("H".to_string()),
            nationality: Some("FRA".to_string()),
            address_street: None,
            address_city: None,
            address_postal_code: None,
            address_country: None,
            address_province: None,
        })
    }

    async fn extract_nie_back_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        Ok(ExtractedDocumentData {
            first_name: None,
            last_name_1: None,
            last_name_2: None,
            document_number: None,
            document_type: None,
            document_support: None,
            birth_date: None,
            gender: None,
            nationality: None,
            address_street: Some("AVENIDA EJEMPLO 456".to_string()),
            address_city: Some("BARCELONA".to_string()),
            address_postal_code: Some("08001".to_string()),
            address_country: Some("ESPAÑA".to_string()),
            address_province: Some("BARCELONA".to_string()),
        })
    }

    async fn extract_nie_combined_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        let mut front_data = self.extract_nie_front_data(file_data).await?;
        let back_data = self.extract_nie_back_data(file_data).await?;
        
        front_data.address_street = back_data.address_street;
        front_data.address_city = back_data.address_city;
        front_data.address_postal_code = back_data.address_postal_code;
        front_data.address_country = back_data.address_country;
        front_data.address_province = back_data.address_province;
        
        Ok(front_data)
    }

    // Passport Processing
    async fn extract_passport_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        Ok(ExtractedDocumentData {
            first_name: Some("JOHN".to_string()),
            last_name_1: Some("DOE".to_string()),
            last_name_2: None,
            document_number: Some("ABC123456".to_string()),
            document_type: Some("PAS".to_string()),
            document_support: Some("USA".to_string()),
            birth_date: Some("01/01/1985".to_string()),
            gender: Some("H".to_string()),
            nationality: Some("USA".to_string()),
            address_street: None,
            address_city: None,
            address_postal_code: None,
            address_country: Some("UNITED STATES".to_string()),
            address_province: None,
        })
    }

    // Other Document Processing
    async fn extract_other_document_data(&self, file_data: &[u8], mime_type: &str) -> Result<ExtractedDocumentData, String> {
        match mime_type {
            "application/pdf" => self.extract_pdf_data(file_data).await,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => self.extract_docx_data(file_data).await,
            _ => self.extract_image_data(file_data).await,
        }
    }

    async fn extract_pdf_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        // PDF text extraction logic would go here
        Ok(ExtractedDocumentData {
            first_name: Some("PDF_EXTRACTED".to_string()),
            last_name_1: Some("NAME".to_string()),
            last_name_2: None,
            document_number: Some("PDF123456".to_string()),
            document_type: Some("OTHER".to_string()),
            document_support: None,
            birth_date: None,
            gender: None,
            nationality: None,
            address_street: None,
            address_city: None,
            address_postal_code: None,
            address_country: None,
            address_province: None,
        })
    }

    async fn extract_docx_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        // DOCX text extraction logic would go here
        Ok(ExtractedDocumentData {
            first_name: Some("DOCX_EXTRACTED".to_string()),
            last_name_1: Some("NAME".to_string()),
            last_name_2: None,
            document_number: Some("DOC123456".to_string()),
            document_type: Some("OTHER".to_string()),
            document_support: None,
            birth_date: None,
            gender: None,
            nationality: None,
            address_street: None,
            address_city: None,
            address_postal_code: None,
            address_country: None,
            address_province: None,
        })
    }

    async fn extract_image_data(&self, file_data: &[u8]) -> Result<ExtractedDocumentData, String> {
        // Image OCR logic would go here
        Ok(ExtractedDocumentData {
            first_name: Some("IMAGE_EXTRACTED".to_string()),
            last_name_1: Some("NAME".to_string()),
            last_name_2: None,
            document_number: Some("IMG123456".to_string()),
            document_type: Some("OTHER".to_string()),
            document_support: None,
            birth_date: None,
            gender: None,
            nationality: None,
            address_street: None,
            address_city: None,
            address_postal_code: None,
            address_country: None,
            address_province: None,
        })
    }

    fn is_supported_document_type(&self, mime_type: &str) -> bool {
        matches!(mime_type, 
            "application/pdf" | 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" |
            "image/jpeg" | 
            "image/jpg" | 
            "image/png" | 
            "image/webp"
        )
    }

    fn get_detected_fields(&self, data: &ExtractedDocumentData) -> Vec<String> {
        let mut fields = Vec::new();
        
        if data.first_name.is_some() { fields.push("first_name".to_string()); }
        if data.last_name_1.is_some() { fields.push("last_name_1".to_string()); }
        if data.last_name_2.is_some() { fields.push("last_name_2".to_string()); }
        if data.document_number.is_some() { fields.push("document_number".to_string()); }
        if data.document_type.is_some() { fields.push("document_type".to_string()); }
        if data.birth_date.is_some() { fields.push("birth_date".to_string()); }
        if data.gender.is_some() { fields.push("gender".to_string()); }
        if data.nationality.is_some() { fields.push("nationality".to_string()); }
        if data.address_street.is_some() { fields.push("address_street".to_string()); }
        if data.address_city.is_some() { fields.push("address_city".to_string()); }
        if data.address_postal_code.is_some() { fields.push("address_postal_code".to_string()); }
        if data.address_country.is_some() { fields.push("address_country".to_string()); }
        
        fields
    }
}

// WASM Bindings
#[wasm_bindgen]
pub struct WasmOCRService {
    service: OCRService,
}

#[wasm_bindgen]
impl WasmOCRService {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            service: OCRService::new(),
        }
    }

    #[wasm_bindgen]
    pub async fn process_dni_nif(&mut self, request_json: &str, client_id: &str) -> String {
        let request: OCRRequest = match serde_json::from_str(request_json) {
            Ok(req) => req,
            Err(e) => return serde_json::to_string(&OCRResponse {
                success: false,
                extracted_data: ExtractedDocumentData {
                    first_name: None, last_name_1: None, last_name_2: None,
                    document_number: None, document_type: None, document_support: None,
                    birth_date: None, gender: None, nationality: None,
                    address_street: None, address_city: None, address_postal_code: None,
                    address_country: None, address_province: None,
                },
                confidence: 0.0,
                processing_time_ms: 0,
                detected_fields: vec![],
                errors: vec![format!("Invalid request: {}", e)],
                raw_text: "".to_string(),
            }).unwrap(),
        };

        match self.service.process_dni_nif(request, client_id).await {
            Ok(response) => serde_json::to_string(&response).unwrap(),
            Err(error) => serde_json::to_string(&OCRResponse {
                success: false,
                extracted_data: ExtractedDocumentData {
                    first_name: None, last_name_1: None, last_name_2: None,
                    document_number: None, document_type: None, document_support: None,
                    birth_date: None, gender: None, nationality: None,
                    address_street: None, address_city: None, address_postal_code: None,
                    address_country: None, address_province: None,
                },
                confidence: 0.0,
                processing_time_ms: 0,
                detected_fields: vec![],
                errors: vec![error],
                raw_text: "".to_string(),
            }).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub async fn process_nie(&mut self, request_json: &str, client_id: &str) -> String {
        let request: OCRRequest = match serde_json::from_str(request_json) {
            Ok(req) => req,
            Err(e) => return serde_json::to_string(&OCRResponse {
                success: false,
                extracted_data: ExtractedDocumentData {
                    first_name: None, last_name_1: None, last_name_2: None,
                    document_number: None, document_type: None, document_support: None,
                    birth_date: None, gender: None, nationality: None,
                    address_street: None, address_city: None, address_postal_code: None,
                    address_country: None, address_province: None,
                },
                confidence: 0.0,
                processing_time_ms: 0,
                detected_fields: vec![],
                errors: vec![format!("Invalid request: {}", e)],
                raw_text: "".to_string(),
            }).unwrap(),
        };

        match self.service.process_nie(request, client_id).await {
            Ok(response) => serde_json::to_string(&response).unwrap(),
            Err(error) => serde_json::to_string(&OCRResponse {
                success: false,
                extracted_data: ExtractedDocumentData {
                    first_name: None, last_name_1: None, last_name_2: None,
                    document_number: None, document_type: None, document_support: None,
                    birth_date: None, gender: None, nationality: None,
                    address_street: None, address_city: None, address_postal_code: None,
                    address_country: None, address_province: None,
                },
                confidence: 0.0,
                processing_time_ms: 0,
                detected_fields: vec![],
                errors: vec![error],
                raw_text: "".to_string(),
            }).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub async fn process_passport(&mut self, request_json: &str, client_id: &str) -> String {
        let request: OCRRequest = match serde_json::from_str(request_json) {
            Ok(req) => req,
            Err(e) => return serde_json::to_string(&OCRResponse {
                success: false,
                extracted_data: ExtractedDocumentData {
                    first_name: None, last_name_1: None, last_name_2: None,
                    document_number: None, document_type: None, document_support: None,
                    birth_date: None, gender: None, nationality: None,
                    address_street: None, address_city: None, address_postal_code: None,
                    address_country: None, address_province: None,
                },
                confidence: 0.0,
                processing_time_ms: 0,
                detected_fields: vec![],
                errors: vec![format!("Invalid request: {}", e)],
                raw_text: "".to_string(),
            }).unwrap(),
        };

        match self.service.process_passport(request, client_id).await {
            Ok(response) => serde_json::to_string(&response).unwrap(),
            Err(error) => serde_json::to_string(&OCRResponse {
                success: false,
                extracted_data: ExtractedDocumentData {
                    first_name: None, last_name_1: None, last_name_2: None,
                    document_number: None, document_type: None, document_support: None,
                    birth_date: None, gender: None, nationality: None,
                    address_street: None, address_city: None, address_postal_code: None,
                    address_country: None, address_province: None,
                },
                confidence: 0.0,
                processing_time_ms: 0,
                detected_fields: vec![],
                errors: vec![error],
                raw_text: "".to_string(),
            }).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub async fn process_other_document(&mut self, files_json: &str, client_id: &str) -> String {
        let files: Vec<OCRRequest> = match serde_json::from_str(files_json) {
            Ok(req) => req,
            Err(e) => return serde_json::to_string(&vec![OCRResponse {
                success: false,
                extracted_data: ExtractedDocumentData {
                    first_name: None, last_name_1: None, last_name_2: None,
                    document_number: None, document_type: None, document_support: None,
                    birth_date: None, gender: None, nationality: None,
                    address_street: None, address_city: None, address_postal_code: None,
                    address_country: None, address_province: None,
                },
                confidence: 0.0,
                processing_time_ms: 0,
                detected_fields: vec![],
                errors: vec![format!("Invalid request: {}", e)],
                raw_text: "".to_string(),
            }]).unwrap(),
        };

        match self.service.process_other_document(files, client_id).await {
            Ok(responses) => serde_json::to_string(&responses).unwrap(),
            Err(error) => serde_json::to_string(&vec![OCRResponse {
                success: false,
                extracted_data: ExtractedDocumentData {
                    first_name: None, last_name_1: None, last_name_2: None,
                    document_number: None, document_type: None, document_support: None,
                    birth_date: None, gender: None, nationality: None,
                    address_street: None, address_city: None, address_postal_code: None,
                    address_country: None, address_province: None,
                },
                confidence: 0.0,
                processing_time_ms: 0,
                detected_fields: vec![],
                errors: vec![error],
                raw_text: "".to_string(),
            }]).unwrap(),
        }
    }
}