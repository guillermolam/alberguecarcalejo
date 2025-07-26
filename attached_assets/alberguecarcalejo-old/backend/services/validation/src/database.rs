use crate::models::*;
use chrono::{DateTime, NaiveDate, Utc};
use serde_json::{json, Value};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use web_sys::Storage;

// Database abstraction layer using browser localStorage for persistence
pub struct Database {
    storage: Storage,
}

impl Database {
    pub fn new() -> Result<Self, JsValue> {
        let window = web_sys::window().ok_or("No global window exists")?;
        let storage = window
            .local_storage()
            .map_err(|_| "Failed to get localStorage")?
            .ok_or("localStorage not available")?;

        Ok(Database { storage })
    }

    // Pilgrim operations
    pub fn create_pilgrim(&self, mut pilgrim: Pilgrim) -> Result<Pilgrim, JsValue> {
        let id = self.get_next_id("pilgrims")?;
        pilgrim.id = Some(id);
        pilgrim.created_at = Some(Utc::now());
        pilgrim.updated_at = Some(Utc::now());

        let mut pilgrims = self.get_pilgrims()?;
        pilgrims.push(pilgrim.clone());
        self.save_pilgrims(&pilgrims)?;

        Ok(pilgrim)
    }

    pub fn get_pilgrim(&self, id: u32) -> Result<Option<Pilgrim>, JsValue> {
        let pilgrims = self.get_pilgrims()?;
        Ok(pilgrims.into_iter().find(|p| p.id == Some(id)))
    }

    pub fn get_pilgrim_by_document(
        &self,
        doc_type: &str,
        doc_number: &str,
    ) -> Result<Option<Pilgrim>, JsValue> {
        let pilgrims = self.get_pilgrims()?;
        Ok(pilgrims
            .into_iter()
            .find(|p| p.document_type == doc_type && p.document_number == doc_number))
    }

    // Booking operations
    pub fn create_booking(&self, mut booking: Booking) -> Result<Booking, JsValue> {
        let id = self.get_next_id("bookings")?;
        booking.id = Some(id);
        booking.created_at = Some(Utc::now());
        booking.updated_at = Some(Utc::now());

        let mut bookings = self.get_bookings()?;
        bookings.push(booking.clone());
        self.save_bookings(&bookings)?;

        Ok(booking)
    }

    pub fn get_booking(&self, id: u32) -> Result<Option<Booking>, JsValue> {
        let bookings = self.get_bookings()?;
        Ok(bookings.into_iter().find(|b| b.id == Some(id)))
    }

    pub fn get_bookings_by_date_range(
        &self,
        start_date: &NaiveDate,
        end_date: &NaiveDate,
    ) -> Result<Vec<Booking>, JsValue> {
        let bookings = self.get_bookings()?;
        Ok(bookings
            .into_iter()
            .filter(|b| b.check_in_date >= *start_date && b.check_out_date <= *end_date)
            .collect())
    }

    pub fn update_booking_status(&self, id: u32, status: &str) -> Result<(), JsValue> {
        let mut bookings = self.get_bookings()?;
        if let Some(booking) = bookings.iter_mut().find(|b| b.id == Some(id)) {
            booking.status = status.to_string();
            booking.updated_at = Some(Utc::now());
            self.save_bookings(&bookings)?;
        }
        Ok(())
    }

    pub fn assign_bed_to_booking(&self, booking_id: u32, bed_id: u32) -> Result<(), JsValue> {
        let mut bookings = self.get_bookings()?;
        if let Some(booking) = bookings.iter_mut().find(|b| b.id == Some(booking_id)) {
            booking.bed_assignment_id = Some(bed_id);
            booking.updated_at = Some(Utc::now());
            self.save_bookings(&bookings)?;
        }
        Ok(())
    }

    // Bed operations
    pub fn get_all_beds(&self) -> Result<Vec<Bed>, JsValue> {
        let beds = self.get_beds()?;
        if beds.is_empty() {
            return Ok(self.initialize_beds()?);
        }
        Ok(beds)
    }

    pub fn get_bed(&self, id: u32) -> Result<Option<Bed>, JsValue> {
        let beds = self.get_beds()?;
        Ok(beds.into_iter().find(|b| b.id == Some(id)))
    }

    pub fn update_bed_status(&self, id: u32, status: &str) -> Result<(), JsValue> {
        let mut beds = self.get_beds()?;
        if let Some(bed) = beds.iter_mut().find(|b| b.id == Some(id)) {
            bed.status = status.to_string();
            bed.is_available = status == "available";
            bed.updated_at = Some(Utc::now());
            self.save_beds(&beds)?;
        }
        Ok(())
    }

    pub fn get_available_beds(
        &self,
        check_in_date: &NaiveDate,
        check_out_date: &NaiveDate,
    ) -> Result<Vec<Bed>, JsValue> {
        let beds = self.get_all_beds()?;
        let bookings = self.get_bookings()?;

        // Find occupied bed IDs during the requested period
        let occupied_bed_ids: Vec<u32> = bookings
            .iter()
            .filter(|b| {
                b.check_out_date >= *check_in_date
                    && b.check_in_date <= *check_out_date
                    && b.status == "confirmed"
            })
            .filter_map(|b| b.bed_assignment_id)
            .collect();

        Ok(beds
            .into_iter()
            .filter(|bed| {
                bed.status == "available" && !occupied_bed_ids.contains(&bed.id.unwrap_or(0))
            })
            .collect())
    }

    // Payment operations
    pub fn create_payment(&self, mut payment: Payment) -> Result<Payment, JsValue> {
        let id = self.get_next_id("payments")?;
        payment.id = Some(id);
        payment.created_at = Some(Utc::now());

        let mut payments = self.get_payments()?;
        payments.push(payment.clone());
        self.save_payments(&payments)?;

        Ok(payment)
    }

    pub fn get_payments_by_booking(&self, booking_id: u32) -> Result<Vec<Payment>, JsValue> {
        let payments = self.get_payments()?;
        Ok(payments
            .into_iter()
            .filter(|p| p.booking_id == booking_id)
            .collect())
    }

    // Government submission operations
    pub fn create_government_submission(
        &self,
        mut submission: GovernmentSubmission,
    ) -> Result<GovernmentSubmission, JsValue> {
        let id = self.get_next_id("government_submissions")?;
        submission.id = Some(id);
        submission.created_at = Some(Utc::now());

        let mut submissions = self.get_government_submissions()?;
        submissions.push(submission.clone());
        self.save_government_submissions(&submissions)?;

        Ok(submission)
    }

    pub fn update_government_submission_status(
        &self,
        id: u32,
        status: &str,
        response_data: Option<&str>,
    ) -> Result<(), JsValue> {
        let mut submissions = self.get_government_submissions()?;
        if let Some(submission) = submissions.iter_mut().find(|s| s.id == Some(id)) {
            submission.submission_status = status.to_string();
            submission.response_data = response_data.map(|s| s.to_string());
            submission.last_attempt = Some(Utc::now());
            self.save_government_submissions(&submissions)?;
        }
        Ok(())
    }

    pub fn increment_submission_attempts(&self, id: u32) -> Result<(), JsValue> {
        let mut submissions = self.get_government_submissions()?;
        if let Some(submission) = submissions.iter_mut().find(|s| s.id == Some(id)) {
            submission.attempts += 1;
            submission.last_attempt = Some(Utc::now());
            self.save_government_submissions(&submissions)?;
        }
        Ok(())
    }

    // Analytics methods
    pub fn get_occupancy_stats(&self, date: &NaiveDate) -> Result<OccupancyStats, JsValue> {
        let beds = self.get_all_beds()?;
        let bookings = self.get_bookings()?;

        let occupied_count = bookings
            .iter()
            .filter(|b| {
                b.check_in_date <= *date && b.check_out_date >= *date && b.status == "confirmed"
            })
            .count() as u32;

        let total = beds.len() as u32;
        let available = total - occupied_count;

        Ok(OccupancyStats {
            occupied: occupied_count,
            available,
            total,
        })
    }

    pub fn get_revenue_stats(&self, date: &NaiveDate) -> Result<RevenueStats, JsValue> {
        let payments = self.get_payments()?;

        let total = payments
            .iter()
            .filter(|p| {
                if let Some(payment_date) = p.payment_date {
                    payment_date.date_naive() == *date && p.payment_status == "completed"
                } else {
                    false
                }
            })
            .filter_map(|p| p.amount.parse::<f64>().ok())
            .sum();

        Ok(RevenueStats {
            total,
            currency: "EUR".to_string(),
        })
    }

    pub fn get_compliance_stats(&self) -> Result<ComplianceStats, JsValue> {
        let submissions = self.get_government_submissions()?;

        let total_count = submissions.len();
        let success_count = submissions
            .iter()
            .filter(|s| s.submission_status == "success")
            .count();
        let pending_count = submissions
            .iter()
            .filter(|s| s.submission_status == "pending")
            .count();

        let success_rate = if total_count > 0 {
            ((success_count as f64 / total_count as f64) * 100.0) as u32
        } else {
            0
        };

        Ok(ComplianceStats {
            success_rate,
            pending_submissions: pending_count as u32,
        })
    }

    // Private helper methods
    fn initialize_beds(&self) -> Result<Vec<Bed>, JsValue> {
        let mut beds = Vec::new();
        let mut bed_id = 1;

        // Room 1: 8 beds
        for i in 1..=8 {
            beds.push(Bed {
                id: Some(bed_id),
                bed_number: i,
                room_number: 1,
                room_name: "Dormitorio 1".to_string(),
                is_available: true,
                status: "available".to_string(),
                created_at: Some(Utc::now()),
                updated_at: Some(Utc::now()),
            });
            bed_id += 1;
        }

        // Room 2: 8 beds
        for i in 1..=8 {
            beds.push(Bed {
                id: Some(bed_id),
                bed_number: i,
                room_number: 2,
                room_name: "Dormitorio 2".to_string(),
                is_available: true,
                status: "available".to_string(),
                created_at: Some(Utc::now()),
                updated_at: Some(Utc::now()),
            });
            bed_id += 1;
        }

        // Room 3: 8 beds
        for i in 1..=8 {
            beds.push(Bed {
                id: Some(bed_id),
                bed_number: i,
                room_number: 3,
                room_name: "Dormitorio 3".to_string(),
                is_available: true,
                status: "available".to_string(),
                created_at: Some(Utc::now()),
                updated_at: Some(Utc::now()),
            });
            bed_id += 1;
        }

        // Single room: 1 bed
        beds.push(Bed {
            id: Some(bed_id),
            bed_number: 1,
            room_number: 4,
            room_name: "Habitación Individual".to_string(),
            is_available: true,
            status: "available".to_string(),
            created_at: Some(Utc::now()),
            updated_at: Some(Utc::now()),
        });

        self.save_beds(&beds)?;
        Ok(beds)
    }

    fn get_next_id(&self, table: &str) -> Result<u32, JsValue> {
        let key = format!("{}_next_id", table);
        let current_id = self
            .storage
            .get_item(&key)
            .map_err(|_| "Failed to get next ID")?
            .unwrap_or_else(|| "1".to_string())
            .parse::<u32>()
            .unwrap_or(1);

        let next_id = current_id + 1;
        self.storage
            .set_item(&key, &next_id.to_string())
            .map_err(|_| "Failed to set next ID")?;

        Ok(current_id)
    }

    fn get_pilgrims(&self) -> Result<Vec<Pilgrim>, JsValue> {
        self.get_from_storage("pilgrims")
    }

    fn save_pilgrims(&self, pilgrims: &[Pilgrim]) -> Result<(), JsValue> {
        self.save_to_storage("pilgrims", pilgrims)
    }

    fn get_bookings(&self) -> Result<Vec<Booking>, JsValue> {
        self.get_from_storage("bookings")
    }

    fn save_bookings(&self, bookings: &[Booking]) -> Result<(), JsValue> {
        self.save_to_storage("bookings", bookings)
    }

    fn get_beds(&self) -> Result<Vec<Bed>, JsValue> {
        self.get_from_storage("beds")
    }

    fn save_beds(&self, beds: &[Bed]) -> Result<(), JsValue> {
        self.save_to_storage("beds", beds)
    }

    fn get_payments(&self) -> Result<Vec<Payment>, JsValue> {
        self.get_from_storage("payments")
    }

    fn save_payments(&self, payments: &[Payment]) -> Result<(), JsValue> {
        self.save_to_storage("payments", payments)
    }

    fn get_government_submissions(&self) -> Result<Vec<GovernmentSubmission>, JsValue> {
        self.get_from_storage("government_submissions")
    }

    fn save_government_submissions(
        &self,
        submissions: &[GovernmentSubmission],
    ) -> Result<(), JsValue> {
        self.save_to_storage("government_submissions", submissions)
    }

    fn get_from_storage<T>(&self, key: &str) -> Result<Vec<T>, JsValue>
    where
        T: for<'de> serde::Deserialize<'de>,
    {
        let data = self
            .storage
            .get_item(key)
            .map_err(|_| "Failed to get from storage")?
            .unwrap_or_else(|| "[]".to_string());

        serde_json::from_str(&data).map_err(|e| format!("Failed to parse JSON: {}", e).into())
    }

    fn save_to_storage<T>(&self, key: &str, data: &[T]) -> Result<(), JsValue>
    where
        T: serde::Serialize,
    {
        let json =
            serde_json::to_string(data).map_err(|e| format!("Failed to serialize: {}", e))?;

        self.storage
            .set_item(key, &json)
            .map_err(|_| "Failed to save to storage")?;

        Ok(())
    }
}
