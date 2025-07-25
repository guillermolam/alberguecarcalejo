use crate::ports::notification_sender::NotificationSender;
use crate::domain::entities::booking::Booking;
use shared::AlbergueResult;

pub struct ConsoleNotificationSender;

impl ConsoleNotificationSender {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait::async_trait(?Send)]
impl NotificationSender for ConsoleNotificationSender {
    async fn send_booking_confirmation(&self, booking: &Booking) -> AlbergueResult<()> {
        // In WASM context, log to console
        web_sys::console::log_1(&format!(
            "📧 Booking confirmation sent to {}: Booking ID {} for {} nights",
            booking.guest_email,
            booking.id,
            booking.duration_nights()
        ).into());
        Ok(())
    }

    async fn send_booking_cancellation(&self, booking: &Booking) -> AlbergueResult<()> {
        web_sys::console::log_1(&format!(
            "📧 Booking cancellation sent to {}: Booking ID {} has been cancelled",
            booking.guest_email,
            booking.id
        ).into());
        Ok(())
    }

    async fn send_payment_reminder(&self, booking: &Booking) -> AlbergueResult<()> {
        web_sys::console::log_1(&format!(
            "📧 Payment reminder sent to {}: Please complete payment for booking ID {}",
            booking.guest_email,
            booking.id
        ).into());
        Ok(())
    }
}