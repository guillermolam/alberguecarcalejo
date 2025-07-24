use serde::{Deserialize, Serialize};
use chrono::{DateTime, NaiveDate, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pilgrim {
    pub id: Option<u32>,
    pub first_name: String,
    pub last_name_1: String,
    pub last_name_2: Option<String>,
    pub birth_date: NaiveDate,
    pub document_type: String,
    pub document_number: String,
    pub document_support: Option<String>,
    pub gender: String,
    pub nationality: Option<String>,
    pub phone: String,
    pub email: Option<String>,
    pub address_country: String,
    pub address_street: String,
    pub address_street_2: Option<String>,
    pub address_city: String,
    pub address_postal_code: String,
    pub address_municipality_code: Option<String>,
    pub id_photo_url: Option<String>,
    pub language: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Booking {
    pub id: Option<u32>,
    pub pilgrim_id: u32,
    pub reference_number: String,
    pub check_in_date: NaiveDate,
    pub check_out_date: NaiveDate,
    pub number_of_nights: u32,
    pub number_of_persons: u32,
    pub number_of_rooms: u32,
    pub has_internet: bool,
    pub status: String,
    pub bed_assignment_id: Option<u32>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bed {
    pub id: Option<u32>,
    pub bed_number: u32,
    pub room_number: u32,
    pub room_name: String,
    pub is_available: bool,
    pub status: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: Option<u32>,
    pub booking_id: u32,
    pub amount: String,
    pub payment_type: String,
    pub payment_status: String,
    pub currency: String,
    pub receipt_number: Option<String>,
    pub payment_date: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernmentSubmission {
    pub id: Option<u32>,
    pub booking_id: u32,
    pub xml_content: String,
    pub submission_status: String,
    pub response_data: Option<String>,
    pub attempts: u32,
    pub last_attempt: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AvailabilityRequest {
    pub check_in_date: String,
    pub check_out_date: String,
    pub number_of_persons: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AvailabilityResponse {
    pub available: bool,
    pub available_beds: u32,
    pub total_beds: u32,
    pub occupied_beds: u32,
    pub next_available_date: Option<String>,
    pub alternative_dates: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegistrationRequest {
    pub pilgrim: Pilgrim,
    pub booking: BookingRequest,
    pub payment: PaymentRequest,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BookingRequest {
    pub check_in_date: NaiveDate,
    pub check_out_date: NaiveDate,
    pub number_of_nights: u32,
    pub number_of_persons: u32,
    pub number_of_rooms: u32,
    pub has_internet: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentRequest {
    pub amount: String,
    pub payment_type: String,
    pub currency: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub occupancy: OccupancyStats,
    pub revenue: RevenueStats,
    pub compliance: ComplianceStats,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OccupancyStats {
    pub occupied: u32,
    pub available: u32,
    pub total: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RevenueStats {
    pub total: f64,
    pub currency: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComplianceStats {
    pub success_rate: u32,
    pub pending_submissions: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GovernmentSubmissionResult {
    pub success: bool,
    pub response: Option<String>,
    pub error: Option<String>,
}