
use spin_sdk::http::{IntoResponse, Request, Response};
use spin_sdk::http_component;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Serialize)]
pub struct InfoCard {
    pub id: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub location: Option<String>,
    pub contact: Option<String>,
}

#[derive(Serialize)]
pub struct InfoResponse {
    pub cards: Vec<InfoCard>,
    pub total: usize,
}

#[http_component]
fn handle_info_service(req: Request) -> Result<impl IntoResponse> {
    let method = req.method();
    let path = req.uri().path();

    match (method.as_str(), path) {
        ("GET", "/info/cards") => get_info_cards(req),
        ("GET", "/info/eat") => get_restaurant_info(req),
        ("GET", "/info/transport") => get_transport_info(req),
        ("GET", "/info/health") => Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(r#"{"status": "healthy"}"#)?),
        _ => Ok(Response::builder()
            .status(404)
            .body("Not Found")?),
    }
}

fn get_info_cards(req: Request) -> Result<impl IntoResponse> {
    let cards = vec![
        InfoCard {
            id: "eat_1".to_string(),
            title: "Local Restaurants".to_string(),
            description: "Best places to eat near the albergue".to_string(),
            category: "food".to_string(),
            location: Some("Carrascalejo".to_string()),
            contact: None,
        },
        InfoCard {
            id: "transport_1".to_string(),
            title: "Bus Services".to_string(),
            description: "Local bus connections and schedules".to_string(),
            category: "transport".to_string(),
            location: Some("Carrascalejo".to_string()),
            contact: Some("+34 XXX XXX XXX".to_string()),
        },
    ];

    let response = InfoResponse {
        total: cards.len(),
        cards,
    };

    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(serde_json::to_string(&response)?)?)
}

fn get_restaurant_info(req: Request) -> Result<impl IntoResponse> {
    // TODO: Implement restaurant info retrieval
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(r#"{"restaurants": []}"#)?)
}

fn get_transport_info(req: Request) -> Result<impl IntoResponse> {
    // TODO: Implement transport info retrieval
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(r#"{"transport": []}"#)?)
}
