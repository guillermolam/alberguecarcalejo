import { pgTable, text, timestamp, uuid, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Bookings table
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone"),
  roomType: text("room_type").notNull(), // 'dorm-a', 'dorm-b', 'private-1', 'private-2'
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  numGuests: integer("num_guests").default(1),
  totalPrice: integer("total_price").notNull(), // in cents
  status: text("status").default("confirmed"), // 'pending', 'confirmed', 'cancelled'
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rooms availability table
export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'shared', 'private'
  capacity: integer("capacity").notNull(),
  pricePerNight: integer("price_per_night").notNull(), // in cents
  amenities: jsonb("amenities").default([]),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Info cards content table
export const infoCards = pgTable("info_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(), // 'restaurants', 'taxis', 'car-rentals', etc.
  title: text("title").notNull(),
  description: text("description"),
  content: jsonb("content").notNull(), // Store the card data as JSON
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertInfoCardSchema = createInsertSchema(infoCards).omit({
  id: true,
  updatedAt: true,
});

// Types
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type InfoCard = typeof infoCards.$inferSelect;
export type InsertInfoCard = z.infer<typeof insertInfoCardSchema>;