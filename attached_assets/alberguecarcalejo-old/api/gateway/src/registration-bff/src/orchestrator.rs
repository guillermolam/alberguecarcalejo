use crate::validator;
use crate::{AvailabilityRequest, RegistrationData};
use serde_json::{json, Value};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{window, Headers, Request, RequestInit, Response};

/// Orchestrate availability check with backend
pub async fn check_availability(request: &AvailabilityRequest) -> Result<Value, String> {
    // First check with backend API
    let api_url = "/api/availability";

    let request_body = json!({
        "checkInDate": request.check_in_date,
        "checkOutDate": request.check_out_date,
        "numberOfPersons": request.number_of_persons
    });

    match make_api_request("POST", api_url, Some(&request_body)).await {
        Ok(response) => Ok(response),
        Err(e) => {
            console_error!("BFF: Availability check failed: {}", e);
            Err(format!("Failed to check availability: {}", e))
        }
    }
}

/// Orchestrate the full registration process
pub async fn process_registration(data: &RegistrationData) -> Result<Value, String> {
    console_log!("BFF: Starting registration orchestration");

    // Step 1: Final validation before processing
    if let Err(validation_errors) = validator::validate_registration(data) {
        return Err(format!(
            "Validation failed: {}",
            validation_errors.join(", ")
        ));
    }

    // Step 2: Check availability again to ensure no race conditions
    let availability_check = AvailabilityRequest {
        check_in_date: data.booking.check_in_date.clone(),
        check_out_date: data.booking.check_out_date.clone(),
        number_of_persons: data.booking.number_of_persons,
    };

    let availability = check_availability(&availability_check).await?;
    if !availability
        .get("available")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
    {
        return Err("No beds available for selected dates".to_string());
    }

    // Step 3: Process registration with backend
    let registration_payload = json!({
        "pilgrim": {
            "firstName": data.pilgrim.first_name,
            "lastName1": data.pilgrim.last_name_1,
            "lastName2": data.pilgrim.last_name_2,
            "birthDate": data.pilgrim.birth_date,
            "documentType": data.pilgrim.document_type,
            "documentNumber": data.pilgrim.document_number,
            "documentSupport": data.pilgrim.document_support,
            "gender": data.pilgrim.gender,
            "nationality": data.pilgrim.nationality,
            "phone": data.pilgrim.phone,
            "email": data.pilgrim.email,
            "addressCountry": data.pilgrim.address_country,
            "addressStreet": data.pilgrim.address_street,
            "addressStreet2": data.pilgrim.address_street_2,
            "addressCity": data.pilgrim.address_city,
            "addressPostalCode": data.pilgrim.address_postal_code,
            "addressMunicipalityCode": data.pilgrim.address_municipality_code,
            "language": data.pilgrim.language,
            "idPhotoUrl": data.pilgrim.id_photo_url
        },
        "booking": {
            "checkInDate": data.booking.check_in_date,
            "checkOutDate": data.booking.check_out_date,
            "numberOfNights": data.booking.number_of_nights,
            "numberOfPersons": data.booking.number_of_persons,
            "numberOfRooms": data.booking.number_of_rooms,
            "hasInternet": data.booking.has_internet
        },
        "payment": {
            "amount": data.payment.amount,
            "paymentType": data.payment.payment_type,
            "currency": data.payment.currency
        }
    });

    match make_api_request("POST", "/api/register", Some(&registration_payload)).await {
        Ok(response) => {
            console_log!("BFF: Registration successful");

            // Step 4: If registration successful, trigger government submission
            if let Some(booking_id) = response.get("bookingId").and_then(|v| v.as_u64()) {
                let _ = trigger_government_submission(booking_id as u32).await;
            }

            Ok(response)
        }
        Err(e) => {
            console_error!("BFF: Registration failed: {}", e);
            Err(format!("Registration failed: {}", e))
        }
    }
}

/// Trigger government submission (async, don't wait for completion)
async fn trigger_government_submission(booking_id: u32) -> Result<(), String> {
    console_log!(
        "BFF: Triggering government submission for booking {}",
        booking_id
    );

    let submission_payload = json!({
        "bookingId": booking_id,
        "autoSubmit": true
    });

    // Fire and forget - don't block registration on government submission
    match make_api_request("POST", "/api/government/submit", Some(&submission_payload)).await {
        Ok(_) => {
            console_log!("BFF: Government submission initiated");
            Ok(())
        }
        Err(e) => {
            console_error!("BFF: Government submission failed: {}", e);
            // Don't return error as this shouldn't block registration
            Ok(())
        }
    }
}

/// Make HTTP request to backend API
async fn make_api_request(method: &str, url: &str, body: Option<&Value>) -> Result<Value, String> {
    let window = window().ok_or("No global window")?;

    let mut opts = RequestInit::new();
    opts.method(method);

    let headers = Headers::new().map_err(|_| "Failed to create headers")?;
    headers
        .set("Content-Type", "application/json")
        .map_err(|_| "Failed to set content type")?;
    opts.headers(&headers);

    if let Some(body_data) = body {
        let body_str = serde_json::to_string(body_data)
            .map_err(|e| format!("Failed to serialize request body: {}", e))?;
        opts.body(Some(&JsValue::from_str(&body_str)));
    }

    let request =
        Request::new_with_str_and_init(url, &opts).map_err(|_| "Failed to create request")?;

    let resp_value = JsFuture::from(window.fetch_with_request(&request))
        .await
        .map_err(|_| "Request failed")?;

    let resp: Response = resp_value.dyn_into().map_err(|_| "Invalid response type")?;

    if !resp.ok() {
        let status = resp.status();
        let status_text = resp.status_text();
        return Err(format!("HTTP {} {}", status, status_text));
    }

    let json_value = JsFuture::from(resp.json().map_err(|_| "Failed to get response JSON")?)
        .await
        .map_err(|_| "Failed to parse response JSON")?;

    let json_string = js_sys::JSON::stringify(&json_value)
        .map_err(|_| "Failed to stringify response")?
        .as_string()
        .ok_or("Failed to convert to string")?;

    serde_json::from_str(&json_string).map_err(|e| format!("Failed to parse JSON response: {}", e))
}

/// Health check for backend connectivity
pub async fn health_check() -> Result<bool, String> {
    match make_api_request("GET", "/api/health", None).await {
        Ok(_) => Ok(true),
        Err(e) => {
            console_error!("BFF: Health check failed: {}", e);
            Ok(false)
        }
    }
}

/// Get system status for debugging
pub async fn get_system_status() -> Result<Value, String> {
    make_api_request("GET", "/api/system/status", None).await
}

/// Process OCR document through backend
pub async fn process_ocr_backend(request: &crate::OCRProcessingRequest) -> Result<Value, String> {
    let payload = serde_json::to_value(request)
        .map_err(|e| format!("Failed to serialize OCR request: {}", e))?;

    make_api_request("POST", "/api/ocr/process", Some(payload)).await
}

/// Validate document through backend
pub async fn validate_document_backend(doc_type: &str, doc_number: &str) -> Result<Value, String> {
    let payload = serde_json::json!({
        "document_type": doc_type,
        "document_number": doc_number
    });

    make_api_request("POST", "/api/validate/document", Some(payload)).await
}

/// Get country information through backend
pub async fn get_country_info(country_code: &str) -> Result<Value, String> {
    make_api_request("GET", &format!("/api/countries/{}", country_code), None).await
}

/// Security wrapper for sensitive operations
pub async fn secure_operation<F, T>(operation: F, operation_name: &str) -> Result<T, String>
where
    F: std::future::Future<Output = Result<T, String>>,
{
    console_log!("BFF: Starting secure operation: {}", operation_name);

    // Add timing to detect potential attacks
    let start_time = js_sys::Date::now();

    let result = operation.await;

    let end_time = js_sys::Date::now();
    let duration = end_time - start_time;

    // Log timing for security monitoring
    console_log!(
        "BFF: Operation {} completed in {}ms",
        operation_name,
        duration
    );

    // Check for suspiciously fast operations (potential automated attacks)
    if duration < 100.0 {
        console_error!(
            "BFF: Suspiciously fast operation detected: {}",
            operation_name
        );
    }

    result
}

/// Retry mechanism for critical operations
pub async fn retry_operation<F, T>(
    operation: F,
    max_retries: u32,
    operation_name: &str,
) -> Result<T, String>
where
    F: Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, String>>>>,
{
    let mut last_error = String::new();

    for attempt in 1..=max_retries {
        console_log!(
            "BFF: Attempt {} of {} for {}",
            attempt,
            max_retries,
            operation_name
        );

        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                last_error = e;
                if attempt < max_retries {
                    // Exponential backoff
                    let delay_ms = 1000 * (2_u32.pow(attempt - 1));
                    console_log!("BFF: Retrying {} in {}ms", operation_name, delay_ms);

                    // Simple delay using setTimeout (simplified for WASM)
                    let promise = js_sys::Promise::new(&mut |resolve, _| {
                        let window = window().unwrap();
                        window
                            .set_timeout_with_callback_and_timeout_and_arguments_0(
                                &resolve,
                                delay_ms as i32,
                            )
                            .unwrap();
                    });
                    let _ = JsFuture::from(promise).await;
                }
            }
        }
    }

    Err(format!(
        "Operation {} failed after {} attempts: {}",
        operation_name, max_retries, last_error
    ))
}
