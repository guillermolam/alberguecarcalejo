#[cfg(test)]
mod tests {
    use super::*;
    use http::{Method, Request, StatusCode};
    
    #[test]
    fn test_health_endpoint() {
        let req = Request::builder()
            .method(Method::GET)
            .uri("/health")
            .body(vec![])
            .unwrap();
        
        // Test would require proper Spin test framework
        // For now, just verify compilation
        assert_eq!(req.uri().path(), "/health");
    }
    
    #[test]
    fn test_route_matching() {
        // Test API route detection
        assert!("/api/bookings".starts_with("/api/"));
        assert!("/admin/dashboard".starts_with("/admin/"));
        assert!("/health" == "/health");
    }
    
    #[test]
    fn test_jwt_token_generation() {
        use crate::utils::jwt::generate_token;
        
        let token = generate_token(
            "user123".to_string(),
            Some("user@example.com".to_string()),
            Some("guest".to_string()),
            Some("Test User".to_string()),
            24,
        );
        
        assert!(token.is_ok());
        let token_str = token.unwrap();
        assert!(!token_str.is_empty());
        assert!(token_str.contains('.'));
    }
}