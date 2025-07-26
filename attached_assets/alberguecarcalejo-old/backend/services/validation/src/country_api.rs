use crate::rate_limiter::RateLimiter;
use crate::types::*;
use serde_json::json;
use std::collections::HashMap;
use worker::*;

pub struct CountryService {
    country_data: HashMap<String, CountryInfoResponse>,
}

impl CountryService {
    pub fn new() -> Self {
        let mut country_data = HashMap::new();

        // Pre-populate with common countries
        country_data.insert(
            "spain".to_string(),
            CountryInfoResponse {
                calling_code: "+34".to_string(),
                flag_url: "https://flagcdn.com/w320/es.png".to_string(),
                country_code: "ES".to_string(),
                country_name: "Spain".to_string(),
            },
        );

        country_data.insert(
            "france".to_string(),
            CountryInfoResponse {
                calling_code: "+33".to_string(),
                flag_url: "https://flagcdn.com/w320/fr.png".to_string(),
                country_code: "FR".to_string(),
                country_name: "France".to_string(),
            },
        );

        country_data.insert(
            "germany".to_string(),
            CountryInfoResponse {
                calling_code: "+49".to_string(),
                flag_url: "https://flagcdn.com/w320/de.png".to_string(),
                country_code: "DE".to_string(),
                country_name: "Germany".to_string(),
            },
        );

        country_data.insert(
            "italy".to_string(),
            CountryInfoResponse {
                calling_code: "+39".to_string(),
                flag_url: "https://flagcdn.com/w320/it.png".to_string(),
                country_code: "IT".to_string(),
                country_name: "Italy".to_string(),
            },
        );

        country_data.insert(
            "portugal".to_string(),
            CountryInfoResponse {
                calling_code: "+351".to_string(),
                flag_url: "https://flagcdn.com/w320/pt.png".to_string(),
                country_code: "PT".to_string(),
                country_name: "Portugal".to_string(),
            },
        );

        country_data.insert(
            "united kingdom".to_string(),
            CountryInfoResponse {
                calling_code: "+44".to_string(),
                flag_url: "https://flagcdn.com/w320/gb.png".to_string(),
                country_code: "GB".to_string(),
                country_name: "United Kingdom".to_string(),
            },
        );

        country_data.insert(
            "united states".to_string(),
            CountryInfoResponse {
                calling_code: "+1".to_string(),
                flag_url: "https://flagcdn.com/w320/us.png".to_string(),
                country_code: "US".to_string(),
                country_name: "United States".to_string(),
            },
        );

        Self { country_data }
    }

    pub async fn get_country_info(
        &self,
        mut req: Request,
        rate_limiter: &RateLimiter,
    ) -> Result<Response> {
        let client_id = self.get_client_fingerprint(&req);

        if !rate_limiter.check_limit(&client_id, "COUNTRY_API").await {
            return Response::from_json(&json!({
                "error": "Rate limit exceeded",
                "reset_time": chrono::Utc::now().timestamp_millis() + 60000
            }));
        }

        let body: CountryInfoRequest = req.json().await?;
        let normalized = body.country_name.to_lowercase().trim().to_string();

        match self.country_data.get(&normalized) {
            Some(country_info) => Response::from_json(country_info),
            None => {
                // Try to fetch from external API as fallback
                self.fetch_from_external_api(&body.country_name).await
            }
        }
    }

    async fn fetch_from_external_api(&self, country_name: &str) -> Result<Response> {
        // In a real implementation, this would call the RESTCountries API
        // For now, return a not found response
        Response::from_json(&json!({
            "error": "Country not found",
            "message": format!("Country '{}' not found in our database", country_name)
        }))
        .map(|mut r| {
            r.with_status(404);
            r
        })
    }

    fn get_client_fingerprint(&self, req: &Request) -> String {
        let ip = req.headers().get("CF-Connecting-IP").unwrap_or_else(|| {
            req.headers()
                .get("X-Forwarded-For")
                .unwrap_or("unknown".to_string())
        });
        let user_agent = req
            .headers()
            .get("User-Agent")
            .unwrap_or("unknown".to_string());

        format!(
            "{}_{}",
            ip,
            &user_agent[..std::cmp::min(user_agent.len(), 16)]
        )
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_')
        .collect()
    }
}
