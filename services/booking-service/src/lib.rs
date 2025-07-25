pub mod domain;
pub mod application;
pub mod ports;
pub mod adapters;
pub mod infrastructure;

use wasm_bindgen::prelude::*;
use application::create_booking::CreateBookingUseCase;
use shared::{BookingDto, AlbergueResult};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub struct BookingServiceWasm {
    create_booking_use_case: CreateBookingUseCase,
}

#[wasm_bindgen]
impl BookingServiceWasm {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();
        Self {
            create_booking_use_case: CreateBookingUseCase::new(),
        }
    }

    #[wasm_bindgen]
    pub async fn create_booking(&self, booking_json: &str) -> String {
        let booking_request: Result<BookingDto, _> = serde_json::from_str(booking_json);
        
        match booking_request {
            Ok(booking) => {
                match self.create_booking_use_case.execute(booking).await {
                    Ok(result) => serde_json::to_string(&result).unwrap_or_default(),
                    Err(e) => {
                        console_log!("Booking creation error: {}", e);
                        format!("{{\"error\": \"{}\"}}", e)
                    }
                }
            },
            Err(e) => {
                console_log!("Invalid booking request: {}", e);
                format!("{{\"error\": \"Invalid request format: {}\"}}", e)
            }
        }
    }

    #[wasm_bindgen]
    pub async fn get_availability(&self, from_date: &str, to_date: &str) -> String {
        // Mock availability check
        let availability = serde_json::json!({
            "available_beds": 15,
            "dorm_a_available": 8,
            "dorm_b_available": 5,
            "private_rooms_available": 2,
            "from_date": from_date,
            "to_date": to_date
        });
        
        availability.to_string()
    }
}