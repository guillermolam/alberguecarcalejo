import express from "express";
import { z } from "zod";
import type { IStorage } from "./storage";
import { insertBookingSchema } from "../shared/schema";

export function createRoutes(storage: IStorage) {
  const router = express.Router();

  // Get all bookings
  router.get("/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Get booking by ID
  router.get("/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // Create new booking
  router.post("/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Update booking
  router.patch("/bookings/:id", async (req, res) => {
    try {
      const partialSchema = insertBookingSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const booking = await storage.updateBooking(req.params.id, validatedData);
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // Delete booking
  router.delete("/bookings/:id", async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  // Get all rooms
  router.get("/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  // Get room by ID
  router.get("/rooms/:id", async (req, res) => {
    try {
      const room = await storage.getRoomById(req.params.id);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });

  // Update room availability
  router.patch("/rooms/:id/availability", async (req, res) => {
    try {
      const { available } = req.body;
      if (typeof available !== "boolean") {
        return res.status(400).json({ error: "Available must be a boolean" });
      }
      const room = await storage.updateRoomAvailability(req.params.id, available);
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: "Failed to update room availability" });
    }
  });

  // Get all info cards
  router.get("/info-cards", async (req, res) => {
    try {
      const cards = await storage.getInfoCards();
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch info cards" });
    }
  });

  // Get info cards by category
  router.get("/info-cards/:category", async (req, res) => {
    try {
      const cards = await storage.getInfoCardsByCategory(req.params.category);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch info cards" });
    }
  });

  return router;
}