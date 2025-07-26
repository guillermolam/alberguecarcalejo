use anyhow::Result;
use serde::{Deserialize, Serialize};
use spin_sdk::{
    http::{IntoResponse, Request, Response},
    http_component,
};

#[derive(Serialize, Deserialize)]
struct Review {
    id: String,
    author_name: String,
    rating: u8,
    text: String,
    date: String,
    source: String,
    verified: bool,
    helpful_count: u32,
}

#[derive(Serialize, Deserialize)]
struct ReviewsResponse {
    reviews: Vec<Review>,
    total_count: u32,
    average_rating: f32,
    source_breakdown: std::collections::HashMap<String, u32>,
}

#[http_component]
async fn handle_request(req: Request) -> Result<impl IntoResponse> {
    let path = req.uri().path();
    
    // Add CORS headers
    let mut response_builder = Response::builder()
        .header("Access-Control-Allow-Origin", "*")
        .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if req.method().as_str() == "OPTIONS" {
        return Ok(response_builder.status(200).body("").build());
    }

    match path {
        "/api/health" => {
            let health = serde_json::json!({
                "status": "ok",
                "service": "gateway-bff",
                "version": "0.1.0"
            });
            Ok(response_builder
                .status(200)
                .header("Content-Type", "application/json")
                .body(health.to_string())
                .build())
        }
        "/api/reviews/all" => {
            let reviews = vec![
                Review {
                    id: "1".to_string(),
                    author_name: "María González".to_string(),
                    rating: 5,
                    text: "Excelente albergue! La hospitalidad de los hospitaleros es excepcional. Las instalaciones están muy limpias y la ubicación es perfecta para descansar después de una larga etapa desde Mérida.".to_string(),
                    date: "2024-03-15".to_string(),
                    source: "Google".to_string(),
                    verified: true,
                    helpful_count: 12,
                },
                Review {
                    id: "2".to_string(),
                    author_name: "Jean-Pierre Martin".to_string(),
                    rating: 4,
                    text: "Très bon accueil et infrastructure moderne. La cuisine est bien équipée et l'ambiance entre pèlerins est formidable. Petit-déjeuner correct.".to_string(),
                    date: "2024-03-12".to_string(),
                    source: "Booking.com".to_string(),
                    verified: true,
                    helpful_count: 8,
                },
                Review {
                    id: "3".to_string(),
                    author_name: "Carlos Ruiz".to_string(),
                    rating: 5,
                    text: "Un oasis en el camino. Después de caminar desde Mérida bajo el sol, encontrar este albergue fue una bendición. Duchas calientes, camas cómodas y un trato familiar excepcional.".to_string(),
                    date: "2024-03-10".to_string(),
                    source: "Google".to_string(),
                    verified: true,
                    helpful_count: 15,
                },
                Review {
                    id: "4".to_string(),
                    author_name: "Anne Williams".to_string(),
                    rating: 4,
                    text: "Clean facilities and friendly staff. The dormitories are well organized and quiet during rest hours. Great value for money at €15 per night.".to_string(),
                    date: "2024-03-08".to_string(),
                    source: "Google".to_string(),
                    verified: true,
                    helpful_count: 7,
                },
                Review {
                    id: "5".to_string(),
                    author_name: "Luigi Rossi".to_string(),
                    rating: 5,
                    text: "Ospitalità incredibile! I gestori sono molto attenti alle esigenze dei pellegrini. Cucina attrezzata e atmosfera accogliente. Consigliatissimo!".to_string(),
                    date: "2024-03-05".to_string(),
                    source: "Booking.com".to_string(),
                    verified: true,
                    helpful_count: 11,
                },
                Review {
                    id: "6".to_string(),
                    author_name: "Ana Fernández".to_string(),
                    rating: 4,
                    text: "Muy buena experiencia. Las instalaciones están bien mantenidas y el ambiente es muy acogedor. La lavadora funciona perfectamente y hay buen espacio para secar la ropa.".to_string(),
                    date: "2024-03-03".to_string(),
                    source: "Google".to_string(),
                    verified: false,
                    helpful_count: 5,
                },
            ];

            let mut source_breakdown = std::collections::HashMap::new();
            source_breakdown.insert("Google".to_string(), 28);
            source_breakdown.insert("Booking.com".to_string(), 19);

            let response = ReviewsResponse {
                reviews,
                total_count: 47,
                average_rating: 4.6,
                source_breakdown,
            };

            Ok(response_builder
                .status(200)
                .header("Content-Type", "application/json")
                .body(serde_json::to_string(&response)?)
                .build())
        }
        _ => {
            Ok(response_builder
                .status(404)
                .header("Content-Type", "application/json")
                .body(r#"{"error":"Not Found","message":"API endpoint not found"}"#)
                .build())
        }
    }
}