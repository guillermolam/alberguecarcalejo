// Booking service implementation

use anyhow::Result;
use spin_sdk::http::{Request, Response};
use serde_json::json;

pub async fn handle(req: &Request) -> Result<Response> {
    let path = req.uri().path();

    match path {
        "/api/booking/stats" => get_stats().await,
        "/api/booking/availability" => get_availability(req).await,
        "/api/booking/pricing" => get_pricing().await,
        p if p.starts_with("/api/booking/") => {
            Ok(Response::builder()
                .status(404)
                .header("Content-Type", "application/json")
                .body(serde_json::to_string(&json!({
                    "error": "Booking endpoint not found",
                    "path": p
                }))?)
                .build())
        }
        _ => {
            Ok(Response::builder()
                .status(400)
                .header("Content-Type", "application/json") 
                .body(serde_json::to_string(&json!({
                    "error": "Invalid booking request"
                }))?)
                .build())
        }
    }
}

async fn get_stats() -> Result<Response> {
    let stats = json!({
        "occupancy": {
            "available": 24,
            "occupied": 0,
            "total": 24
        },
        "today_bookings": 3,
        "revenue": 4500,
        "dormitorios": {
            "Dormitorio 1": {"beds": 8, "available": 8},
            "Dormitorio 2": {"beds": 8, "available": 8}, 
            "Dormitorio 3": {"beds": 8, "available": 8}
        }
    });

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&stats)?)
        .build())
}

async fn get_availability(_req: &Request) -> Result<Response> {
    let availability = json!({
        "dates": {
            "2025-07-26": {"available": 24, "price": 15},
            "2025-07-27": {"available": 20, "price": 15},
            "2025-07-28": {"available": 24, "price": 15}
        },
        "dormitorios": [
            {"id": "dorm-1", "name": "Dormitorio 1", "beds": 8, "available": 8, "price": 15},
            {"id": "dorm-2", "name": "Dormitorio 2", "beds": 8, "available": 8, "price": 15},
            {"id": "dorm-3", "name": "Dormitorio 3", "beds": 8, "available": 8, "price": 15}
        ]
    });

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&availability)?)
        .build())
}

async fn get_pricing() -> Result<Response> {
    let pricing = json!({
        "dormitory": {
            "price": 15,
            "currency": "EUR",
            "per": "night"
        },
        "private_room": {
            "price": 35,
            "currency": "EUR", 
            "per": "night"
        },
        "total_beds": 24,
        "dormitorios": 3
    });

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", "application/json")
        .body(serde_json::to_string(&pricing)?)
        .build())
}