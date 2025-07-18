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
        // This would handle the actual registration logic
        // For now, return a mock success response
        Response::from_json(&json!({
            "success": true,
            "booking_id": "BOOK-2025-001",
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