use crate::domain::ScrapedContent;
use crate::ports::ScraperPort;
use shared::{AlbergueError, AlbergueResult};
use async_trait::async_trait;
use reqwest::Client;
use chrono::Utc;

pub struct MeridaScraperAdapter {
    client: Client,
}

impl MeridaScraperAdapter {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    async fn scrape_url(&self, url: &str) -> AlbergueResult<String> {
        #[cfg(target_arch = "wasm32")]
        {
            // In WASM, we can't do direct HTTP scraping due to CORS
            // Return default content instead
            Ok("Contenido por defecto para WASM".to_string())
        }

        #[cfg(not(target_arch = "wasm32"))]
        {
            let response = self
                .client
                .get(url)
                .header("User-Agent", "Mozilla/5.0 (compatible; AlbergueBot/1.0)")
                .send()
                .await
                .map_err(|e| AlbergueError::ExternalServiceError(format!("Failed to fetch {}: {}", url, e)))?;

            if response.status().is_success() {
                response
                    .text()
                    .await
                    .map_err(|e| AlbergueError::ExternalServiceError(format!("Failed to read response: {}", e)))
            } else {
                Err(AlbergueError::ExternalServiceError(format!(
                    "HTTP error {}: {}",
                    response.status(),
                    url
                )))
            }
        }
    }

    fn extract_attractions_from_html(&self, html: &str) -> Vec<String> {
        // Simple text extraction - in a real implementation this would use scraper crate
        vec![
            "Teatro Romano - Espectacular teatro del siglo I a.C.".to_string(),
            "Anfiteatro Romano - Donde luchaban los gladiadores".to_string(),
            "Puente Romano - Uno de los más largos de la antigüedad".to_string(),
            "Museo Nacional de Arte Romano - Diseñado por Rafael Moneo".to_string(),
            "Casa del Mitreo - Villa romana con mosaicos".to_string(),
            "Alcazaba Árabe - Fortaleza del siglo IX".to_string(),
        ]
    }
}

#[async_trait]
impl ScraperPort for MeridaScraperAdapter {
    async fn scrape_merida_attractions(&self) -> AlbergueResult<ScrapedContent> {
        let url = "https://www.consorciomerida.org/";
        
        match self.scrape_url(url).await {
            Ok(html) => {
                let attractions = self.extract_attractions_from_html(&html);
                let content = attractions.join("\n• ");
                
                Ok(ScrapedContent {
                    source_url: url.to_string(),
                    title: "Atracciones de Mérida".to_string(),
                    content: format!("• {}", content),
                    links: vec![url.to_string()],
                    images: Vec::new(),
                    last_scraped: Utc::now(),
                    scraping_successful: true,
                    error_message: None,
                })
            }
            Err(e) => {
                // Return fallback content if scraping fails
                Ok(ScrapedContent {
                    source_url: url.to_string(),
                    title: "Atracciones de Mérida".to_string(),
                    content: "• Teatro Romano - Patrimonio UNESCO\n• Anfiteatro Romano - Espectáculos de gladiadores\n• Puente Romano - Cruce del río Guadiana\n• Museo Nacional de Arte Romano - Arquitectura de Rafael Moneo".to_string(),
                    links: vec![url.to_string()],
                    images: Vec::new(),
                    last_scraped: Utc::now(),
                    scraping_successful: false,
                    error_message: Some(e.to_string()),
                })
            }
        }
    }

    async fn scrape_carrascalejo_info(&self) -> AlbergueResult<ScrapedContent> {
        // Static content for Carrascalejo since it's a small village with limited web presence
        Ok(ScrapedContent {
            source_url: "https://www.carrascalejo.es/".to_string(),
            title: "Información de Carrascalejo".to_string(),
            content: "Pequeño pueblo extremeño en la Vía de la Plata con gran tradición peregrina".to_string(),
            links: Vec::new(),
            images: Vec::new(),
            last_scraped: Utc::now(),
            scraping_successful: true,
            error_message: None,
        })
    }

    async fn scrape_weather_info(&self, location: &str) -> AlbergueResult<ScrapedContent> {
        let url = format!("https://www.aemet.es/es/eltiempo/prediccion/municipios/{}", location.to_lowercase());
        
        // For demo purposes, return mock weather data
        Ok(ScrapedContent {
            source_url: url,
            title: format!("Tiempo en {}", location),
            content: "Tiempo soleado, temperatura máxima 25°C, mínima 12°C. Viento suave del oeste.".to_string(),
            links: Vec::new(),
            images: Vec::new(),
            last_scraped: Utc::now(),
            scraping_successful: true,
            error_message: None,
        })
    }

    async fn scrape_local_events(&self, location: &str) -> AlbergueResult<ScrapedContent> {
        // Mock local events data
        Ok(ScrapedContent {
            source_url: format!("https://www.{}.es/eventos", location.to_lowercase()),
            title: format!("Eventos en {}", location),
            content: "No hay eventos programados para esta semana.".to_string(),
            links: Vec::new(),
            images: Vec::new(),
            last_scraped: Utc::now(),
            scraping_successful: true,
            error_message: None,
        })
    }
}