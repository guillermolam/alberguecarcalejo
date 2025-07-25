wit_bindgen::generate!({
    world: "http-handler",
});

use exports::wasi::http::incoming_handler::Guest;
use wasi::http::types::{
    IncomingRequest, ResponseOutparam, OutgoingResponse, OutgoingBody, Headers,
    IncomingBody, Method
};

struct Gateway;

impl Guest for Gateway {
    fn handle(request: IncomingRequest, response_out: ResponseOutparam) {
        let headers = request.headers();
        let path_with_query = request.path_with_query().unwrap_or("/".to_string());
        
        // Route API requests to appropriate services
        let response = if path_with_query.starts_with("/api/validation") {
            route_to_validation_service(&path_with_query, &request)
        } else if path_with_query.starts_with("/api/booking") {
            route_to_booking_service(&path_with_query, &request)
        } else if path_with_query.starts_with("/api/country") {
            route_to_country_service(&path_with_query, &request)
        } else if path_with_query.starts_with("/api/security") {
            route_to_security_service(&path_with_query, &request)
        } else if path_with_query.starts_with("/api/rate-limit") {
            route_to_rate_limiter_service(&path_with_query, &request)
        } else {
            // Serve static frontend content
            serve_frontend(&path_with_query)
        };

        let outgoing_response = OutgoingResponse::new(response.headers);
        outgoing_response.set_status_code(response.status).unwrap();
        
        let outgoing_body = outgoing_response.body().unwrap();
        outgoing_body.write().unwrap().blocking_write_and_flush(response.body.as_bytes()).unwrap();
        OutgoingBody::finish(outgoing_body, None).unwrap();
        
        ResponseOutparam::set(response_out, Ok(outgoing_response));
    }
}

struct Response {
    status: u16,
    headers: Headers,
    body: String,
}

fn route_to_validation_service(path: &str, request: &IncomingRequest) -> Response {
    // TODO: Forward request to validation service
    Response {
        status: 200,
        headers: Headers::new(),
        body: r#"{"message":"Validation service endpoint"}"#.to_string(),
    }
}

fn route_to_booking_service(path: &str, request: &IncomingRequest) -> Response {
    // TODO: Forward request to booking service
    Response {
        status: 200,
        headers: Headers::new(),
        body: r#"{"message":"Booking service endpoint"}"#.to_string(),
    }
}

fn route_to_country_service(path: &str, request: &IncomingRequest) -> Response {
    // TODO: Forward request to country service
    Response {
        status: 200,
        headers: Headers::new(),
        body: r#"{"message":"Country service endpoint"}"#.to_string(),
    }
}

fn route_to_security_service(path: &str, request: &IncomingRequest) -> Response {
    // TODO: Forward request to security service
    Response {
        status: 200,
        headers: Headers::new(),
        body: r#"{"message":"Security service endpoint"}"#.to_string(),
    }
}

fn route_to_rate_limiter_service(path: &str, request: &IncomingRequest) -> Response {
    // TODO: Forward request to rate limiter service
    Response {
        status: 200,
        headers: Headers::new(),
        body: r#"{"message":"Rate limiter service endpoint"}"#.to_string(),
    }
}

fn serve_frontend(path: &str) -> Response {
    // Serve the main frontend app
    let content = if path == "/" || path.starts_with("/admin") || path.starts_with("/customer") {
        include_str!("../../client/dist/index.html")
    } else {
        r#"{"error":"Not found"}"#
    };
    
    Response {
        status: 200,
        headers: Headers::new(),
        body: content.to_string(),
    }
}

export!(Gateway);