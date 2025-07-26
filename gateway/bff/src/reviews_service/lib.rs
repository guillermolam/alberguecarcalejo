
use spin_sdk::http::{IntoResponse, Request, Response};
use spin_sdk::http_component;
use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Deserialize)]
pub struct ReviewRequest {
    pub user_id: String,
    pub rating: i32,
    pub comment: String,
    pub booking_id: Option<String>,
}

#[derive(Serialize)]
pub struct Review {
    pub id: String,
    pub user_id: String,
    pub rating: i32,
    pub comment: String,
    pub created_at: String,
    pub verified: bool,
}

#[derive(Serialize)]
pub struct ReviewsResponse {
    pub reviews: Vec<Review>,
    pub total: usize,
    pub average_rating: f64,
}

#[http_component]
fn handle_reviews_service(req: Request) -> Result<impl IntoResponse> {
    let method = req.method();
    let path = req.uri().path();

    match (method.as_str(), path) {
        ("GET", "/reviews") => get_reviews(req),
        ("POST", "/reviews") => create_review(req),
        ("GET", "/reviews/stats") => get_review_stats(req),
        ("DELETE", "/reviews/:id") => delete_review(req),
        ("GET", "/reviews/health") => Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(r#"{"status": "healthy"}"#)?),
        _ => Ok(Response::builder()
            .status(404)
            .body("Not Found")?),
    }
}

fn get_reviews(req: Request) -> Result<impl IntoResponse> {
    let reviews = vec![
        Review {
            id: "rev_1".to_string(),
            user_id: "user_123".to_string(),
            rating: 5,
            comment: "Excellent albergue with great facilities!".to_string(),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            verified: true,
        },
        Review {
            id: "rev_2".to_string(),
            user_id: "user_456".to_string(),
            rating: 4,
            comment: "Very clean and comfortable stay.".to_string(),
            created_at: "2024-01-02T00:00:00Z".to_string(),
            verified: true,
        },
    ];

    let response = ReviewsResponse {
        total: reviews.len(),
        average_rating: 4.5,
        reviews,
    };

    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(serde_json::to_string(&response)?)?)
}

fn create_review(req: Request) -> Result<impl IntoResponse> {
    // TODO: Implement review creation logic
    let review = Review {
        id: "rev_new".to_string(),
        user_id: "user_new".to_string(),
        rating: 5,
        comment: "Great experience!".to_string(),
        created_at: "2024-01-03T00:00:00Z".to_string(),
        verified: false,
    };

    Ok(Response::builder()
        .status(201)
        .header("content-type", "application/json")
        .body(serde_json::to_string(&review)?)?)
}

fn get_review_stats(req: Request) -> Result<impl IntoResponse> {
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(r#"{"total": 2, "average_rating": 4.5, "five_star": 1, "four_star": 1}"#)?)
}

fn delete_review(req: Request) -> Result<impl IntoResponse> {
    // TODO: Implement review deletion logic
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(r#"{"deleted": true}"#)?)
}
