import type { Booking, InsertBooking, Room, InfoCard } from "../shared/schema";

export interface IStorage {
  // Bookings
  getBookings(): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | null>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;

  // Rooms
  getRooms(): Promise<Room[]>;
  getRoomById(id: string): Promise<Room | null>;
  updateRoomAvailability(id: string, available: boolean): Promise<Room>;

  // Info Cards
  getInfoCards(): Promise<InfoCard[]>;
  getInfoCardsByCategory(category: string): Promise<InfoCard[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private bookings: Booking[] = [];
  private rooms: Room[] = [
    {
      id: "1",
      name: "Dormitorio A",
      type: "shared",
      capacity: 12,
      pricePerNight: 1500, // €15.00
      amenities: ["Taquillas", "Enchufes", "Ventanas"],
      available: true,
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "Dormitorio B",
      type: "shared",
      capacity: 10,
      pricePerNight: 1500, // €15.00
      amenities: ["Taquillas", "Enchufes", "Aire acondicionado"],
      available: true,
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "Habitación Privada 1",
      type: "private",
      capacity: 2,
      pricePerNight: 3500, // €35.00
      amenities: ["Baño privado", "TV", "Aire acondicionado"],
      available: true,
      createdAt: new Date(),
    },
    {
      id: "4",
      name: "Habitación Privada 2",
      type: "private",
      capacity: 2,
      pricePerNight: 3500, // €35.00
      amenities: ["Baño privado", "TV", "Terraza"],
      available: false,
      createdAt: new Date(),
    },
  ];
  private infoCards: InfoCard[] = [
    {
      id: "1",
      category: "restaurants",
      title: "Restaurantes en Mérida",
      description: "Los mejores lugares para comer en Mérida",
      content: {
        restaurants: [
          {
            name: "Atrio Restaurante",
            rating: 5,
            priceRange: "€€€€",
            address: "Plaza de Santa Clara, 10, Cáceres",
            phone: "+34 927 242 928",
            description: "Restaurante galardonado con estrella Michelin. Experiencia gastronómica única."
          },
          {
            name: "Tabula Calda",
            rating: 4,
            priceRange: "€€",
            address: "Calle José Ramón Mélida, 40",
            phone: "+34 924 304 512",
            description: "Cocina romana tradicional cerca del Teatro Romano. Ambiente histórico."
          }
        ]
      },
      isActive: true,
      updatedAt: new Date(),
    },
  ];

  async getBookings(): Promise<Booking[]> {
    return [...this.bookings];
  }

  async getBookingById(id: string): Promise<Booking | null> {
    return this.bookings.find(b => b.id === id) || null;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const newBooking: Booking = {
      ...booking,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bookings.push(newBooking);
    return newBooking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking> {
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error("Booking not found");
    }
    
    this.bookings[index] = {
      ...this.bookings[index],
      ...booking,
      updatedAt: new Date(),
    };
    
    return this.bookings[index];
  }

  async deleteBooking(id: string): Promise<void> {
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error("Booking not found");
    }
    this.bookings.splice(index, 1);
  }

  async getRooms(): Promise<Room[]> {
    return [...this.rooms];
  }

  async getRoomById(id: string): Promise<Room | null> {
    return this.rooms.find(r => r.id === id) || null;
  }

  async updateRoomAvailability(id: string, available: boolean): Promise<Room> {
    const index = this.rooms.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error("Room not found");
    }
    
    this.rooms[index].available = available;
    return this.rooms[index];
  }

  async getInfoCards(): Promise<InfoCard[]> {
    return this.infoCards.filter(card => card.isActive);
  }

  async getInfoCardsByCategory(category: string): Promise<InfoCard[]> {
    return this.infoCards.filter(card => card.category === category && card.isActive);
  }
}