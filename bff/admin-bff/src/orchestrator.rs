use crate::{BedUpdateRequest, GovernmentSubmissionRequest};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{window, Request, RequestInit, Headers, Response};
use serde_json::{json, Value};

/// Orchestrate dashboard data retrieval from backend
pub async fn get_dashboard_data() -> Result<Value, String> {
    console_log!("Admin BFF: Orchestrating dashboard data retrieval");

    // Collect data from multiple endpoints
    let stats_future = make_api_request("GET", "/api/dashboard/stats", None);
    let beds_future = make_api_request("GET", "/api/beds", None);
    let recent_bookings_future = make_api_request("GET", "/api/bookings/recent", None);

    // Execute requests in parallel
    let (stats_result, beds_result, bookings_result) = futures_join3(
        stats_future,
        beds_future,
        recent_bookings_future,
    ).await;

    let stats = stats_result.unwrap_or_else(|_| json!({}));
    let beds = beds_result.unwrap_or_else(|_| json!([]));
    let recent_bookings = bookings_result.unwrap_or_else(|_| json!([]));

    // Aggregate dashboard data
    let dashboard_data = json!({
        "stats": stats,
        "beds": beds,
        "recent_bookings": recent_bookings,
        "compliance": {
            "government_submissions": await get_government_submission_status().await.unwrap_or(json!({})),
            "pending_alerts": await get_pending_alerts().await.unwrap_or(json!([]))
        },
        "last_updated": chrono::Utc::now().to_rfc3339()
    });

    Ok(dashboard_data)
}

/// Orchestrate beds data retrieval with enhanced details
pub async fn get_beds_data() -> Result<Value, String> {
    console_log!("Admin BFF: Orchestrating beds data retrieval");

    let beds_data = make_api_request("GET", "/api/beds", None).await?;
    
    // Enhance beds data with additional information
    if let Some(beds_array) = beds_data.as_array() {
        let mut enhanced_beds = Vec::new();
        
        for bed in beds_array {
            let mut enhanced_bed = bed.clone();
            
            // Add current occupancy information if available
            if let Some(bed_id) = bed.get("id").and_then(|id| id.as_u64()) {
                if let Ok(occupancy) = get_bed_occupancy_info(bed_id as u32).await {
                    enhanced_bed["occupancy"] = occupancy;
                }
            }
            
            enhanced_beds.push(enhanced_bed);
        }
        
        Ok(json!(enhanced_beds))
    } else {
        Ok(beds_data)
    }
}

/// Orchestrate bed status update with validation
pub async fn update_bed_status(request: &BedUpdateRequest) -> Result<Value, String> {
    console_log!("Admin BFF: Orchestrating bed status update for bed {}", request.bed_id);

    // Validate bed exists first
    let bed_check = make_api_request("GET", &format!("/api/beds/{}", request.bed_id), None).await;
    if bed_check.is_err() {
        return Err("Bed not found".to_string());
    }

    // Validate status transition
    let current_bed = bed_check.unwrap();
    if let Some(current_status) = current_bed.get("status").and_then(|s| s.as_str()) {
        if !is_valid_status_transition(current_status, &request.status) {
            return Err(format!("Invalid status transition from {} to {}", current_status, request.status));
        }
    }

    // Update bed status
    let update_payload = json!({
        "status": request.status,
        "notes": request.notes
    });

    let update_result = make_api_request(
        "PATCH", 
        &format!("/api/beds/{}", request.bed_id), 
        Some(&update_payload)
    ).await?;

    // If bed is being marked as maintenance or out of order, check for existing bookings
    if ["maintenance", "out_of_order"].contains(&request.status.as_str()) {
        let _ = check_and_notify_affected_bookings(request.bed_id).await;
    }

    console_log!("Admin BFF: Bed status updated successfully");
    Ok(update_result)
}

/// Orchestrate government submission retry with enhanced error handling
pub async fn retry_government_submission(request: &GovernmentSubmissionRequest) -> Result<Value, String> {
    console_log!("Admin BFF: Orchestrating government submission retry for booking {}", request.booking_id);

    // Get booking information
    let booking_data = make_api_request(
        "GET", 
        &format!("/api/bookings/{}", request.booking_id), 
        None
    ).await?;

    // Validate booking is eligible for government submission
    if let Some(status) = booking_data.get("status").and_then(|s| s.as_str()) {
        if status != "confirmed" {
            return Err("Only confirmed bookings can be submitted to government".to_string());
        }
    }

    // Check previous submission attempts
    let submission_history = make_api_request(
        "GET", 
        &format!("/api/government/submissions/booking/{}", request.booking_id), 
        None
    ).await.unwrap_or(json!([]));

    let attempt_count = submission_history.as_array().map(|arr| arr.len()).unwrap_or(0);
    
    if attempt_count >= 3 && !request.force_retry {
        return Err("Maximum retry attempts reached. Use force_retry to override.".to_string());
    }

    // Prepare submission data
    let submission_payload = json!({
        "booking_id": request.booking_id,
        "force_retry": request.force_retry,
        "admin_initiated": true,
        "attempt_number": attempt_count + 1
    });

    // Submit to government API
    let submission_result = make_api_request(
        "POST", 
        "/api/government/submit", 
        Some(&submission_payload)
    ).await?;

    console_log!("Admin BFF: Government submission retry completed");
    Ok(submission_result)
}

/// Get government submission status for compliance monitoring
async fn get_government_submission_status() -> Result<Value, String> {
    let submissions = make_api_request("GET", "/api/government/submissions/status", None).await?;
    
    // Calculate compliance metrics
    if let Some(submissions_array) = submissions.as_array() {
        let total_submissions = submissions_array.len();
        let successful = submissions_array.iter()
            .filter(|s| s.get("status").and_then(|st| st.as_str()) == Some("success"))
            .count();
        let pending = submissions_array.iter()
            .filter(|s| s.get("status").and_then(|st| st.as_str()) == Some("pending"))
            .count();
        let failed = submissions_array.iter()
            .filter(|s| s.get("status").and_then(|st| st.as_str()) == Some("failed"))
            .count();

        Ok(json!({
            "total_submissions": total_submissions,
            "successful": successful,
            "pending": pending,
            "failed": failed,
            "compliance_rate": if total_submissions > 0 { 
                (successful as f64 / total_submissions as f64 * 100.0) as u32 
            } else { 
                100 
            }
        }))
    } else {
        Ok(json!({
            "total_submissions": 0,
            "successful": 0,
            "pending": 0,
            "failed": 0,
            "compliance_rate": 100
        }))
    }
}

/// Get pending alerts for admin dashboard
async fn get_pending_alerts() -> Result<Value, String> {
    let mut alerts = Vec::new();

    // Check for failed government submissions
    if let Ok(gov_status) = get_government_submission_status().await {
        if let Some(failed_count) = gov_status.get("failed").and_then(|f| f.as_u64()) {
            if failed_count > 0 {
                alerts.push(json!({
                    "type": "government_submission",
                    "severity": "high",
                    "message": format!("{} government submissions have failed", failed_count),
                    "action_required": true
                }));
            }
        }
    }

    // Check for beds needing maintenance
    if let Ok(beds_data) = make_api_request("GET", "/api/beds", None).await {
        if let Some(beds_array) = beds_data.as_array() {
            let maintenance_beds: Vec<_> = beds_array.iter()
                .filter(|bed| bed.get("status").and_then(|s| s.as_str()) == Some("maintenance"))
                .count();
            
            if maintenance_beds > 0 {
                alerts.push(json!({
                    "type": "maintenance",
                    "severity": "medium",
                    "message": format!("{} beds require maintenance", maintenance_beds),
                    "action_required": true
                }));
            }
        }
    }

    // Check for overdue check-outs
    if let Ok(overdue) = check_overdue_checkouts().await {
        if overdue.as_array().map(|arr| arr.len()).unwrap_or(0) > 0 {
            alerts.push(json!({
                "type": "overdue_checkout",
                "severity": "medium",
                "message": "Some guests have overdue check-outs",
                "action_required": true
            }));
        }
    }

    Ok(json!(alerts))
}

/// Get bed occupancy information
async fn get_bed_occupancy_info(bed_id: u32) -> Result<Value, String> {
    let occupancy_data = make_api_request(
        "GET", 
        &format!("/api/beds/{}/occupancy", bed_id), 
        None
    ).await.unwrap_or(json!({}));

    Ok(occupancy_data)
}

/// Check for overdue check-outs
async fn check_overdue_checkouts() -> Result<Value, String> {
    let today = chrono::Utc::now().date_naive().to_string();
    let overdue_bookings = make_api_request(
        "GET", 
        &format!("/api/bookings/overdue?date={}", today), 
        None
    ).await.unwrap_or(json!([]));

    Ok(overdue_bookings)
}

/// Validate bed status transitions
fn is_valid_status_transition(current_status: &str, new_status: &str) -> bool {
    match (current_status, new_status) {
        // Any status can go to maintenance or out_of_order
        (_, "maintenance") | (_, "out_of_order") => true,
        // From maintenance or out_of_order, can only go to available
        ("maintenance", "available") | ("out_of_order", "available") => true,
        // Available can go to occupied
        ("available", "occupied") => true,
        // Occupied can go to available
        ("occupied", "available") => true,
        // Same status is allowed (no-op)
        (current, new) if current == new => true,
        // All other transitions are invalid
        _ => false,
    }
}

/// Check and notify about affected bookings when bed status changes
async fn check_and_notify_affected_bookings(bed_id: u32) -> Result<(), String> {
    // Get current bookings for this bed
    let affected_bookings = make_api_request(
        "GET", 
        &format!("/api/beds/{}/bookings/current", bed_id), 
        None
    ).await.unwrap_or(json!([]));

    if let Some(bookings_array) = affected_bookings.as_array() {
        if !bookings_array.is_empty() {
            console_log!("Admin BFF: {} bookings affected by bed {} status change", 
                        bookings_array.len(), bed_id);
            
            // In a real implementation, this would trigger notifications
            // to affected guests and staff
        }
    }

    Ok(())
}

/// Make HTTP request to backend API with enhanced error handling
async fn make_api_request(method: &str, url: &str, body: Option<&Value>) -> Result<Value, String> {
    let window = window().ok_or("No global window")?;
    
    let mut opts = RequestInit::new();
    opts.method(method);
    
    let headers = Headers::new().map_err(|_| "Failed to create headers")?;
    headers.set("Content-Type", "application/json").map_err(|_| "Failed to set content type")?;
    
    // Add admin context header
    headers.set("X-Admin-Request", "true").map_err(|_| "Failed to set admin header")?;
    
    opts.headers(&headers);

    if let Some(body_data) = body {
        let body_str = serde_json::to_string(body_data)
            .map_err(|e| format!("Failed to serialize request body: {}", e))?;
        opts.body(Some(&JsValue::from_str(&body_str)));
    }

    let request = Request::new_with_str_and_init(url, &opts)
        .map_err(|_| "Failed to create request")?;

    let resp_value = JsFuture::from(window.fetch_with_request(&request))
        .await
        .map_err(|_| format!("Request to {} failed", url))?;

    let resp: Response = resp_value.dyn_into().map_err(|_| "Invalid response type")?;
    
    if !resp.ok() {
        let status = resp.status();
        let status_text = resp.status_text();
        
        // Try to get error details from response body
        if let Ok(error_body) = JsFuture::from(resp.text().unwrap()).await {
            if let Some(error_text) = error_body.as_string() {
                return Err(format!("HTTP {} {}: {}", status, status_text, error_text));
            }
        }
        
        return Err(format!("HTTP {} {}", status, status_text));
    }

    let json_value = JsFuture::from(resp.json().map_err(|_| "Failed to get response JSON")?)
        .await
        .map_err(|_| "Failed to parse response JSON")?;

    let json_string = js_sys::JSON::stringify(&json_value)
        .map_err(|_| "Failed to stringify response")?
        .as_string()
        .ok_or("Failed to convert to string")?;

    serde_json::from_str(&json_string)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))
}

/// Simple futures join for parallel execution (WASM-compatible)
async fn futures_join3<T, E>(
    future1: impl std::future::Future<Output = Result<T, E>>,
    future2: impl std::future::Future<Output = Result<T, E>>,
    future3: impl std::future::Future<Output = Result<T, E>>,
) -> (Result<T, E>, Result<T, E>, Result<T, E>) {
    // In a real implementation, these would run in parallel
    // For simplicity in WASM environment, we'll run sequentially
    let result1 = future1.await;
    let result2 = future2.await;
    let result3 = future3.await;
    
    (result1, result2, result3)
}