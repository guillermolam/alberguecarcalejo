use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AvailabilityRequest {
    pub check_in_date: String,
    pub check_out_date: String,
    pub number_of_persons: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AvailabilityResponse {
    pub available: bool,
    pub total_beds: i32,
    pub available_beds: i32,
    pub occupied_beds: i32,
    pub suggested_dates: Option<Vec<String>>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentValidationRequest {
    pub document_type: String,
    pub document_number: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResponse {
    pub success: bool,
    pub data: ValidationData,
    pub rate_limited: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationData {
    pub valid: bool,
    pub message: Option<String>,
    pub checksum: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmailValidationRequest {
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PhoneValidationRequest {
    pub phone: String,
    pub country_code: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CountryInfoRequest {
    pub country_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CountryInfoResponse {
    pub calling_code: String,
    pub flag_url: String,
    pub country_code: String,
    pub country_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminAuthRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminAuthResponse {
    pub success: bool,
    pub token: Option<String>,
    pub rate_limited: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub occupancy: OccupancyStats,
    pub revenue: RevenueStats,
    pub compliance: ComplianceStats,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OccupancyStats {
    pub occupied: i32,
    pub available: i32,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RevenueStats {
    pub total: f64,
    pub currency: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComplianceStats {
    pub success_rate: f64,
    pub pending_submissions: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RateLimit {
    pub count: i32,
    pub reset_time: i64,
}

#[derive(Debug)]
pub struct RateLimitConfig {
    pub max_requests: i32,
    pub window_ms: i64,
}