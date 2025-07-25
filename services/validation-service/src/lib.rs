pub mod domain;
pub mod application;
pub mod ports;
pub mod adapters;
pub mod infrastructure;

use wasm_bindgen::prelude::*;
use application::validation_service::ValidationService;
use shared::{ValidationRequest, ValidationResponse, AlbergueResult};

// WASM bindings
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub struct ValidationServiceWasm {
    service: ValidationService,
}

#[wasm_bindgen]
impl ValidationServiceWasm {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();
        Self {
            service: ValidationService::new(),
        }
    }

    #[wasm_bindgen]
    pub async fn validate_document(&self, request_json: &str) -> String {
        let request: ValidationRequest = match serde_json::from_str(request_json) {
            Ok(req) => req,
            Err(e) => {
                console_log!("Failed to parse validation request: {}", e);
                return serde_json::to_string(&ValidationResponse {
                    is_valid: false,
                    extracted_data: Default::default(),
                    confidence_score: 0.0,
                    errors: vec![format!("Invalid request format: {}", e)],
                }).unwrap_or_default();
            }
        };

        match self.service.validate_document(request).await {
            Ok(response) => serde_json::to_string(&response).unwrap_or_default(),
            Err(e) => {
                console_log!("Validation error: {}", e);
                serde_json::to_string(&ValidationResponse {
                    is_valid: false,
                    extracted_data: Default::default(),
                    confidence_score: 0.0,
                    errors: vec![e.to_string()],
                }).unwrap_or_default()
            }
        }
    }
}