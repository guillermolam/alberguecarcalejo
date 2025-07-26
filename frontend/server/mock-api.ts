// Mock API data for development when WASM services aren't running
// This is pure data - no Express routing needed

export const mockDashboardStats = {
  occupancy: {
    available: 24,
    occupied: 8,
    total: 32
  },
  today_bookings: 3,
  revenue: 4500
};

export const mockPricing = {
  dormitory: 15,
  private_room: 35
};

export const mockBookings = [
  {
    id: "1",
    guest_name: "Juan Pérez",
    guest_email: "juan@example.com",
    guest_phone: "+34666123456",
    room_type: "dorm-a",
    check_in: "2024-01-15",
    check_out: "2024-01-16",
    num_guests: 1,
    total_price: 1500,
    status: "confirmed",
    payment_status: "paid"
  }
];