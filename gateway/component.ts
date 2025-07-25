import { Router } from "@fermyon/spin-sdk";

const router = new Router();

// Booking service routes - matching frontend API calls
router.get("/booking/dashboard/stats", async (req, res) => {
  const response = await fetch("http://booking-service.internal/dashboard/stats");
  const data = await response.json();
  res.json(data);
});

router.get("/booking/pricing", async (req, res) => {
  const response = await fetch("http://booking-service.internal/pricing");
  const data = await response.json();
  res.json(data);
});

router.get("/api/bookings", async (req, res) => {
  const response = await fetch("http://booking-service.internal/bookings");
  const data = await response.json();
  res.json(data);
});

router.post("/api/bookings", async (req, res) => {
  const body = await req.json();
  const response = await fetch("http://booking-service.internal/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  res.status(response.status).json(data);
});

router.get("/api/rooms", async (req, res) => {
  const response = await fetch("http://booking-service.internal/rooms");
  const data = await response.json();
  res.json(data);
});

router.get("/api/info-cards", async (req, res) => {
  const response = await fetch("http://info-on-arrival-service.internal/cards");
  const data = await response.json();
  res.json(data);
});

router.get("/api/info-cards/:category", async (req, res) => {
  const { category } = req.params;
  const response = await fetch(`http://info-on-arrival-service.internal/cards/${category}`);
  const data = await response.json();
  res.json(data);
});

// Validation service routes
router.post("/api/validate/document", async (req, res) => {
  const body = await req.json();
  const response = await fetch("http://validation-service.internal/validate/document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  res.status(response.status).json(data);
});

export default async function handleRequest(request: Request): Promise<Response> {
  // JWT validation could go here in the future
  // const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  
  return router.handle(request);
}