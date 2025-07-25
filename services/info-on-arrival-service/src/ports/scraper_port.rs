use crate::domain::ScrapedContent;
use shared::AlbergueResult;
use async_trait::async_trait;

#[async_trait]
pub trait ScraperPort: Send + Sync {
    async fn scrape_merida_attractions(&self) -> AlbergueResult<ScrapedContent>;
    async fn scrape_carrascalejo_info(&self) -> AlbergueResult<ScrapedContent>;
    async fn scrape_weather_info(&self, location: &str) -> AlbergueResult<ScrapedContent>;
    async fn scrape_local_events(&self, location: &str) -> AlbergueResult<ScrapedContent>;
}