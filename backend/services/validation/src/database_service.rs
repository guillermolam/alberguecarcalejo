use worker::*;
use serde_json::json;
use crate::types::*;

pub struct DatabaseService {
    connection_string: String,
}

impl DatabaseService {
    pub async fn new(env: &Env) -> Result<Self> {
        let connection_string = env.secret("DATABASE_URL")?.to_string();
        Ok(Self { connection_string })
    }

    pub async fn check_availability(&self, mut req: Request) -> Result<Response> {
        let body: AvailabilityRequest = req.json().await?;
        
        // Validate dates
        if let Err(msg) = self.validate_dates(&body.check_in_date, &body.check_out_date) {
            return Response::from_json(&json!({
                "error": "Invalid request",
                "details": msg
            })).map(|mut r| { r.with_status(400); r });
        }

        // Mock availability check (in production, query actual database)
        let total_beds = 25;
        let occupied_beds = 0; // Would be calculated from database
        let available_beds = total_beds - occupied_beds;
        let available = available_beds >= body.number_of_persons;

        let response = AvailabilityResponse {
            available,
            total_beds,
            available_beds,
            occupied_beds,
            suggested_dates: if !available { Some(vec!["2025-07-21".to_string(), "2025-07-22".to_string()]) } else { None },
            message: if available {
                format!("{} bed(s) available for your stay.", available_beds)
            } else {
                "No beds available for the selected dates. Please consider the suggested alternative dates.".to_string()
            },
        };

        Response::from_json(&response)
    }

    pub async fn get_dashboard_stats(&self, _req: Request) -> Result<Response> {
        // Mock dashboard stats (in production, query actual database)
        let stats = DashboardStats {
            occupancy: OccupancyStats {
                occupied: 0,
                available: 25,
                total: 25,
            },
            revenue: RevenueStats {
                total: 0.0,
                currency: "EUR".to_string(),
            },
            compliance: ComplianceStats {
                success_rate: 0.0,
                pending_submissions: 0,
            },
        };

        Response::from_json(&stats)
    }

    pub async fn register_pilgrim(&self, mut req: Request) -> Result<Response> {
        let body: serde_json::Value = req.json().await?;
        
        // Extract pilgrim, booking, and payment data
        let pilgrim_data = body.get("pilgrim").ok_or("Missing pilgrim data")?;
        let booking_data = body.get("booking").ok_or("Missing booking data")?;
        let payment_data = body.get("payment").ok_or("Missing payment data")?;
        
        // Validate required fields
        if let Some(document_number) = pilgrim_data.get("documentNumber").and_then(|v| v.as_str()) {
            if document_number.is_empty() {
                return Response::from_json(&json!({
                    "success": false,
                    "error": "Document number is required"
                })).map(|mut r| { r.with_status(400); r });
            }
        } else {
            return Response::from_json(&json!({
                "success": false,
                "error": "Document number is required"
            })).map(|mut r| { r.with_status(400); r });
        }
        
        // Generate booking reference
        let booking_id = format!("BOOK-{}", chrono::Utc::now().timestamp());
        let reference_number = format!("ALB-{}", chrono::Utc::now().timestamp().to_string().chars().rev().take(6).collect::<String>());
        
        // In a real implementation, this would:
        // 1. Connect to PostgreSQL database using self.connection_string
        // 2. Insert pilgrim data (or update if exists)
        // 3. Create booking record
        // 4. Process payment
        // 5. Assign bed automatically
        // 6. Generate government compliance XML
        
        // For now, return success with mock data structure
        Response::from_json(&json!({
            "success": true,
            "data": {
                "pilgrim": {
                    "id": chrono::Utc::now().timestamp(),
                    "firstName": pilgrim_data.get("firstName"),
                    "lastName1": pilgrim_data.get("lastName1"),
                    "documentNumber": pilgrim_data.get("documentNumber")
                },
                "booking": {
                    "id": booking_id,
                    "referenceNumber": reference_number,
                    "checkInDate": booking_data.get("checkInDate"),
                    "checkOutDate": booking_data.get("checkOutDate"),
                    "totalAmount": booking_data.get("totalAmount"),
                    "status": "confirmed"
                },
                "payment": {
                    "id": format!("PAY-{}", chrono::Utc::now().timestamp()),
                    "amount": payment_data.get("amount"),
                    "paymentType": payment_data.get("paymentType"),
                    "status": "pending"
                },
                "bedAssignment": {
                    "bedId": booking_data.get("selectedBedId"),
                    "bedNumber": format!("BED-{}", booking_data.get("selectedBedId").unwrap_or(&json!(108))),
                    "roomType": "dormitory"
                },
                "referenceNumber": reference_number
            },
            "message": "Registration completed successfully"
        }))
    }

    fn validate_dates(&self, check_in: &str, check_out: &str) -> Result<(), String> {
        // Basic date validation
        let check_in_date = chrono::NaiveDate::parse_from_str(check_in, "%Y-%m-%d")
            .map_err(|_| "Invalid check-in date format")?;
        let check_out_date = chrono::NaiveDate::parse_from_str(check_out, "%Y-%m-%d")
            .map_err(|_| "Invalid check-out date format")?;

        if check_in_date >= check_out_date {
            return Err("Check-out date must be after check-in date".to_string());
        }

        let today = chrono::Utc::now().date_naive();
        if check_in_date < today {
            return Err("Check-in date cannot be in the past".to_string());
        }

        Ok(())
    }
}