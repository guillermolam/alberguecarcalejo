use anyhow::Result;
use serde::{Deserialize, Serialize};
use spin_sdk::{
    http::{IntoResponse, Request, Response},
    http_component,
};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone)]
pub struct Booking {
    pub id: String,
    pub guest_name: String,
    pub guest_email: String,
    pub check_in: String,
    pub check_out: String,
    pub bed_number: u32,
    pub dormitory: String,
    pub status: String,
    pub price: f32,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct BookingStats {
    pub total_bookings: u32,
    pub occupied_beds: u32,
    pub total_beds: u32,
    pub occupancy_rate: f32,
    pub revenue_today: f32,
    pub revenue_month: f32,
    pub average_stay: f32,
    pub guest_nationalities: HashMap<String, u32>,
}

#[derive(Serialize, Deserialize)]
pub struct PricingInfo {
    pub dormitory_price: f32,
    pub private_room_price: f32,
    pub currency: String,
    pub includes: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct AvailabilityResponse {
    pub date: String,
    pub available_beds: u32,
    pub dormitories: Vec<DormitoryInfo>,
}

#[derive(Serialize, Deserialize)]
pub struct DormitoryInfo {
    pub name: String,
    pub total_beds: u32,
    pub available_beds: u32,
    pub occupied_beds: Vec<u32>,
}

#[derive(Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
}

#[http_component]
async fn handle_request(req: Request) -> Result<impl IntoResponse> {
    let uri = req.uri();
    let path = uri.path();

    // Enable CORS
    let response_builder = Response::builder()
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        .header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if req.method().as_str() == "OPTIONS" {
        return Ok(response_builder.status(200).body(()).build());
    }

    match path {
        "/api/booking/stats" => handle_booking_stats().await,
        "/api/booking/dashboard/stats" => handle_dashboard_stats().await,
        "/api/booking/pricing" => handle_pricing().await,
        "/api/booking/availability" => handle_availability(&req).await,
        "/api/booking/create" => handle_create_booking(&req).await,
        "/api/booking/list" => handle_list_bookings().await,
        path if path.starts_with("/api/booking/") => {
            let booking_id = path.strip_prefix("/api/booking/").unwrap_or("");
            if !booking_id.is_empty() && req.method().as_str() == "GET" {
                handle_get_booking(booking_id).await
            } else {
                Ok(Response::builder()
                    .status(404)
                    .header("Content-Type", "application/json")
                    .body(serde_json::to_string(&ErrorResponse {
                        error: "Not Found".to_string(),
                        message: "Booking endpoint not found".to_string(),
                    })?)
                    .build())
            }
        }
        _ => Ok(Response::builder()
            .status(404)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Not Found".to_string(),
                message: "Booking endpoint not found".to_string(),
            })?)
            .build()),
    }
}

async fn handle_booking_stats() -> Result<impl IntoResponse> {
    let stats = BookingStats {
        total_bookings: 47,
        occupied_beds: 18,
        total_beds: 24,
        occupancy_rate: 75.0,
        revenue_today: 270.0,
        revenue_month: 8450.0,
        average_stay: 1.2,
        guest_nationalities: {
            let mut nationalities = HashMap::new();
            nationalities.insert("Spain".to_string(), 12);
            nationalities.insert("France".to_string(), 8);
            nationalities.insert("Germany".to_string(), 7);
            nationalities.insert("Italy".to_string(), 6);
            nationalities.insert("Portugal".to_string(), 5);
            nationalities.insert("United Kingdom".to_string(), 4);
            nationalities.insert("Netherlands".to_string(), 3);
            nationalities.insert("United States".to_string(), 2);
            nationalities
        },
    };

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&stats)?)
        .build())
}

async fn handle_dashboard_stats() -> Result<impl IntoResponse> {
    let dashboard_stats = serde_json::json!({
        "occupancy": {
            "occupied_beds": 18,
            "total_beds": 24,
            "occupancy_rate": 75.0
        },
        "revenue": {
            "today": 270.0,
            "this_week": 1890.0,
            "this_month": 8450.0
        },
        "bookings": {
            "today": 6,
            "pending": 2,
            "confirmed": 16,
            "cancelled": 1
        },
        "dormitories": [
            {
                "name": "Dormitorio 1",
                "total_beds": 8,
                "occupied": 6,
                "available": 2
            },
            {
                "name": "Dormitorio 2", 
                "total_beds": 8,
                "occupied": 7,
                "available": 1
            },
            {
                "name": "Dormitorio 3",
                "total_beds": 8,
                "occupied": 5,
                "available": 3
            }
        ]
    });

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(dashboard_stats.to_string())
        .build())
}

async fn handle_pricing() -> Result<impl IntoResponse> {
    let pricing = PricingInfo {
        dormitory_price: 15.0,
        private_room_price: 35.0,
        currency: "EUR".to_string(),
        includes: vec![
            "Bed in shared dormitory".to_string(),
            "Pilgrims credential stamp".to_string(),
            "Access to common areas".to_string(),
            "Kitchen facilities".to_string(),
            "WiFi".to_string(),
            "Hot shower".to_string(),
        ],
    };

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&pricing)?)
        .build())
}

async fn handle_availability(req: &Request) -> Result<impl IntoResponse> {
    let uri = req.uri();
    let query = uri.query().unwrap_or("");
    let params: HashMap<String, String> = url::form_urlencoded::parse(query.as_bytes()).collect();
    
    let date = params.get("date").cloned().unwrap_or_else(|| {
        chrono::Utc::now().format("%Y-%m-%d").to_string()
    });

    let availability = AvailabilityResponse {
        date: date.clone(),
        available_beds: 6,
        dormitories: vec![
            DormitoryInfo {
                name: "Dormitorio 1".to_string(),
                total_beds: 8,
                available_beds: 2,
                occupied_beds: vec![1, 2, 3, 4, 5, 6],
            },
            DormitoryInfo {
                name: "Dormitorio 2".to_string(),
                total_beds: 8,
                available_beds: 1,
                occupied_beds: vec![1, 2, 3, 4, 5, 6, 7],
            },
            DormitoryInfo {
                name: "Dormitorio 3".to_string(),
                total_beds: 8,
                available_beds: 3,
                occupied_beds: vec![1, 2, 3, 4, 5],
            },
        ],
    };

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&availability)?)
        .build())
}

async fn handle_create_booking(req: &Request) -> Result<impl IntoResponse> {
    if req.method().as_str() != "POST" {
        return Ok(Response::builder()
            .status(405)
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&ErrorResponse {
                error: "Method Not Allowed".to_string(),
                message: "Only POST method allowed for booking creation".to_string(),
            })?)
            .build());
    }

    // Simulate booking creation
    let booking = Booking {
        id: uuid::Uuid::new_v4().to_string(),
        guest_name: "New Pilgrim".to_string(),
        guest_email: "pilgrim@example.com".to_string(),
        check_in: chrono::Utc::now().format("%Y-%m-%d").to_string(),
        check_out: chrono::Utc::now().format("%Y-%m-%d").to_string(),
        bed_number: 1,
        dormitory: "Dormitorio 1".to_string(),
        status: "confirmed".to_string(),
        price: 15.0,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    Ok(Response::builder()
        .status(201)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&booking)?)
        .build())
}

async fn handle_list_bookings() -> Result<impl IntoResponse> {
    let bookings = vec![
        Booking {
            id: "booking_1".to_string(),
            guest_name: "María González".to_string(),
            guest_email: "maria@example.com".to_string(),
            check_in: "2024-07-25".to_string(),
            check_out: "2024-07-26".to_string(),
            bed_number: 1,
            dormitory: "Dormitorio 1".to_string(),
            status: "confirmed".to_string(),
            price: 15.0,
            created_at: "2024-07-24T10:00:00Z".to_string(),
        },
        Booking {
            id: "booking_2".to_string(),
            guest_name: "Jean-Pierre Dubois".to_string(),
            guest_email: "jean@example.com".to_string(),
            check_in: "2024-07-25".to_string(),
            check_out: "2024-07-26".to_string(),
            bed_number: 3,
            dormitory: "Dormitorio 2".to_string(),
            status: "confirmed".to_string(),
            price: 15.0,
            created_at: "2024-07-24T11:30:00Z".to_string(),
        },
    ];

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&bookings)?)
        .build())
}

async fn handle_get_booking(booking_id: &str) -> Result<impl IntoResponse> {
    let booking = Booking {
        id: booking_id.to_string(),
        guest_name: "Sample Guest".to_string(),
        guest_email: "guest@example.com".to_string(),
        check_in: "2024-07-25".to_string(),
        check_out: "2024-07-26".to_string(),
        bed_number: 1,
        dormitory: "Dormitorio 1".to_string(),
        status: "confirmed".to_string(),
        price: 15.0,
        created_at: "2024-07-24T10:00:00Z".to_string(),
    };

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&booking)?)
        .build())
}