use shared::AlbergueResult;
use crate::domain::entities::booking::Booking;

#[async_trait::async_trait(?Send)]
pub trait NotificationSender {
    async fn send_booking_confirmation(&self, booking: &Booking) -> AlbergueResult<()>;
    async fn send_booking_cancellation(&self, booking: &Booking) -> AlbergueResult<()>;
    async fn send_payment_reminder(&self, booking: &Booking) -> AlbergueResult<()>;
}