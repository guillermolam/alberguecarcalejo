use crate::domain::Notification;
use shared::AlbergueResult;
use async_trait::async_trait;

#[async_trait]
pub trait TelegramPort: Send + Sync {
    async fn send_telegram(&self, notification: &Notification) -> AlbergueResult<String>;
    async fn verify_bot_connection(&self) -> AlbergueResult<bool>;
}