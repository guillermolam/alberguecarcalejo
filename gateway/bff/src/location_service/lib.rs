
use spin_sdk::http::{IntoResponse, Request, Response};
use spin_sdk::http_component;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Deserialize)]
pub struct LocationRequest {
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Serialize)]
pub struct LocationResponse {
    pub address: String,
    pub city: String,
    pub country: String,
    pub postal_code: Option<String>,
}

#[derive(Serialize)]
pub struct NearbyPlace {
    pub name: String,
    pub distance: f64,
    pub category: String,
}

#[http_component]
fn handle_location_service(req: Request) -> Result<impl IntoResponse> {
    let method = req.method();
    let path = req.uri().path();

    match (method.as_str(), path) {
        ("POST", "/location/geocode") => geocode_location(req),
        ("POST", "/location/reverse") => reverse_geocode(req),
        ("GET", "/location/nearby") => get_nearby_places(req),
        ("GET", "/location/health") => Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(r#"{"status": "healthy"}"#)?),
        _ => Ok(Response::builder()
            .status(404)
            .body("Not Found")?),
    }
}

fn geocode_location(req: Request) -> Result<impl IntoResponse> {
    // TODO: Implement geocoding logic
    let response = LocationResponse {
        address: "Calle Principal, 1".to_string(),
        city: "Carrascalejo".to_string(),
        country: "Spain".to_string(),
        postal_code: Some("10920".to_string()),
    };

    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(serde_json::to_string(&response)?)?)
}

fn reverse_geocode(req: Request) -> Result<impl IntoResponse> {
    // TODO: Implement reverse geocoding logic
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(r#"{"address": "Unknown location"}"#)?)
}

fn get_nearby_places(req: Request) -> Result<impl IntoResponse> {
    let places = vec![
        NearbyPlace {
            name: "Supermercado Local".to_string(),
            distance: 0.2,
            category: "grocery".to_string(),
        },
        NearbyPlace {
            name: "Farmacia".to_string(),
            distance: 0.3,
            category: "health".to_string(),
        },
    ];

    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(serde_json::to_string(&places)?)?)
}
