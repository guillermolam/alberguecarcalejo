use crate::domain::Notification;
use shared::AlbergueResult;
use async_trait::async_trait;

#[async_trait]
pub trait EmailPort: Send + Sync {
    async fn send_email(&self, notification: &Notification) -> AlbergueResult<String>;
    async fn verify_smtp_connection(&self) -> AlbergueResult<bool>;
}