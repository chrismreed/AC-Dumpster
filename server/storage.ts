import { 
  users, 
  type User, 
  type InsertUser,
  dumpsters,
  type Dumpster,
  type InsertDumpster,
  addOns,
  type AddOn,
  type InsertAddOn,
  serviceZones,
  type ServiceZone,
  type InsertServiceZone,
  rentalDurations,
  type RentalDuration,
  type InsertRentalDuration,
  bookings,
  type Booking,
  type InsertBooking
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Database interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;

  // Dumpster methods
  getDumpster(id: number): Promise<Dumpster | undefined>;
  listDumpsters(): Promise<Dumpster[]>;
  createDumpster(dumpster: InsertDumpster): Promise<Dumpster>;
  updateDumpster(id: number, dumpster: Partial<InsertDumpster>): Promise<Dumpster | undefined>;
  deleteDumpster(id: number): Promise<boolean>;

  // Add-on methods
  getAddOn(id: number): Promise<AddOn | undefined>;
  listAddOns(): Promise<AddOn[]>;
  createAddOn(addon: InsertAddOn): Promise<AddOn>;
  updateAddOn(id: number, addon: Partial<InsertAddOn>): Promise<AddOn | undefined>;
  deleteAddOn(id: number): Promise<boolean>;

  // Service zone methods
  getServiceZone(id: number): Promise<ServiceZone | undefined>;
  getServiceZoneByZipCode(zipCode: string): Promise<ServiceZone | undefined>;
  listServiceZones(): Promise<ServiceZone[]>;
  createServiceZone(zone: InsertServiceZone): Promise<ServiceZone>;
  updateServiceZone(id: number, zone: Partial<InsertServiceZone>): Promise<ServiceZone | undefined>;
  deleteServiceZone(id: number): Promise<boolean>;

  // Rental duration methods
  getRentalDuration(id: number): Promise<RentalDuration | undefined>;
  listRentalDurations(): Promise<RentalDuration[]>;
  createRentalDuration(duration: InsertRentalDuration): Promise<RentalDuration>;
  updateRentalDuration(id: number, duration: Partial<InsertRentalDuration>): Promise<RentalDuration | undefined>;
  deleteRentalDuration(id: number): Promise<boolean>;

  // Booking methods
  getBooking(id: number): Promise<Booking | undefined>;
  listBookings(): Promise<Booking[]>;
  listBookingsByStatus(status: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  updateBookingPaymentStatus(id: number, paymentStatus: string, stripePaymentIntentId?: string): Promise<Booking | undefined>;

  // Session store
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private dumpstersData: Map<number, Dumpster>;
  private addOnsData: Map<number, AddOn>;
  private serviceZonesData: Map<number, ServiceZone>;
  private rentalDurationsData: Map<number, RentalDuration>;
  private bookingsData: Map<number, Booking>;

  private userId: number;
  private dumpsterId: number;
  private addOnId: number;
  private serviceZoneId: number;
  private rentalDurationId: number;
  private bookingId: number;

  sessionStore: session.SessionStore;

  constructor() {
    this.usersData = new Map();
    this.dumpstersData = new Map();
    this.addOnsData = new Map();
    this.serviceZonesData = new Map();
    this.rentalDurationsData = new Map();
    this.bookingsData = new Map();

    this.userId = 1;
    this.dumpsterId = 1;
    this.addOnId = 1;
    this.serviceZoneId = 1;
    this.rentalDurationId = 1;
    this.bookingId = 1;

    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with sample data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$dQkTmQg5JO6FDBVBiGDvIuA0xycJWgJHOP7tOVMvDnZNZ1XRlCVA.", // "admin123"
      email: "admin@dumpsterdirect.com",
      isAdmin: true,
    });

    // Create default rental durations
    this.createRentalDuration({
      days: 3,
      additionalPrice: 0 // Standard
    });
    this.createRentalDuration({
      days: 7,
      additionalPrice: 5000 // +$50
    });
    this.createRentalDuration({
      days: 14,
      additionalPrice: 10000 // +$100
    });

    // Create default dumpsters
    this.createDumpster({
      name: "10 Yard Dumpster",
      dimensions: "12' × 8' × 3.5' (LWH)",
      description: "Ideal for small remodeling projects or garage cleanouts.",
      basePrice: 29900, // $299
      weightLimit: 4000, // 2 tons (4000 lbs)
      availability: 10,
      imageUrl: "/assets/dumpster-10yard.svg"
    });
    this.createDumpster({
      name: "15 Yard Dumpster",
      dimensions: "12' × 8' × 4.5' (LWH)",
      description: "Perfect for medium renovation projects or large cleanouts.",
      basePrice: 34900, // $349
      weightLimit: 6000, // 3 tons (6000 lbs)
      availability: 8,
      imageUrl: "/assets/dumpster-15yard.svg"
    });
    this.createDumpster({
      name: "20 Yard Dumpster",
      dimensions: "16' × 8' × 5' (LWH)",
      description: "Great for large remodeling or construction projects.",
      basePrice: 39900, // $399
      weightLimit: 8000, // 4 tons (8000 lbs)
      availability: 6,
      imageUrl: "/assets/dumpster-20yard.svg"
    });
    this.createDumpster({
      name: "30 Yard Dumpster",
      dimensions: "20' × 8' × 6' (LWH)",
      description: "For major construction or demolition projects.",
      basePrice: 49900, // $499
      weightLimit: 10000, // 5 tons (10000 lbs)
      availability: 4,
      imageUrl: "/assets/dumpster-30yard.svg"
    });

    // Create default add-ons
    this.createAddOn({
      name: "Same-Day Delivery",
      description: "Get your dumpster delivered on the same day when you order before 10 AM (subject to availability).",
      price: 7500, // $75
      isActive: true
    });
    this.createAddOn({
      name: "Driveway Protection",
      description: "We'll place wood boards under the dumpster to protect your driveway surface.",
      price: 3500, // $35
      isActive: true
    });
    this.createAddOn({
      name: "Additional Weight Allowance",
      description: "Add an extra ton to your weight limit to avoid overage charges.",
      price: 5000, // $50 per ton
      isActive: true
    });
    this.createAddOn({
      name: "Rental Extension",
      description: "Add extra days to your rental period now and save.",
      price: 2000, // $20 per day
      isActive: true
    });
    this.createAddOn({
      name: "Cleanup Assistance",
      description: "Our team will help load the dumpster for 1 hour (laborers only, no heavy equipment).",
      price: 12000, // $120
      isActive: true
    });

    // Create default service zones
    this.createServiceZone({
      name: "Zone A - City Center",
      zipCodes: "10001,10002,10003,10004,10005,62401",
      deliveryFee: 4500 // $45
    });
    this.createServiceZone({
      name: "Zone B - Suburban",
      zipCodes: "10006,10007,10008,10009,10010",
      deliveryFee: 5500 // $55
    });
    this.createServiceZone({
      name: "Zone C - Outer Areas",
      zipCodes: "10011,10012,10013,10014,10015",
      deliveryFee: 6500 // $65
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: timestamp
    };
    this.usersData.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }

  // Dumpster methods
  async getDumpster(id: number): Promise<Dumpster | undefined> {
    return this.dumpstersData.get(id);
  }

  async listDumpsters(): Promise<Dumpster[]> {
    return Array.from(this.dumpstersData.values());
  }

  async createDumpster(insertDumpster: InsertDumpster): Promise<Dumpster> {
    const id = this.dumpsterId++;
    const timestamp = new Date();
    const dumpster: Dumpster = {
      ...insertDumpster,
      id,
      createdAt: timestamp
    };
    this.dumpstersData.set(id, dumpster);
    return dumpster;
  }

  async updateDumpster(id: number, dumpsterUpdate: Partial<InsertDumpster>): Promise<Dumpster | undefined> {
    const dumpster = this.dumpstersData.get(id);
    if (!dumpster) return undefined;
    
    const updatedDumpster: Dumpster = {
      ...dumpster,
      ...dumpsterUpdate
    };
    
    this.dumpstersData.set(id, updatedDumpster);
    return updatedDumpster;
  }

  async deleteDumpster(id: number): Promise<boolean> {
    return this.dumpstersData.delete(id);
  }

  // Add-on methods
  async getAddOn(id: number): Promise<AddOn | undefined> {
    return this.addOnsData.get(id);
  }

  async listAddOns(): Promise<AddOn[]> {
    return Array.from(this.addOnsData.values());
  }

  async createAddOn(insertAddOn: InsertAddOn): Promise<AddOn> {
    const id = this.addOnId++;
    const timestamp = new Date();
    const addon: AddOn = {
      ...insertAddOn,
      id,
      createdAt: timestamp
    };
    this.addOnsData.set(id, addon);
    return addon;
  }

  async updateAddOn(id: number, addonUpdate: Partial<InsertAddOn>): Promise<AddOn | undefined> {
    const addon = this.addOnsData.get(id);
    if (!addon) return undefined;
    
    const updatedAddOn: AddOn = {
      ...addon,
      ...addonUpdate
    };
    
    this.addOnsData.set(id, updatedAddOn);
    return updatedAddOn;
  }

  async deleteAddOn(id: number): Promise<boolean> {
    return this.addOnsData.delete(id);
  }

  // Service zone methods
  async getServiceZone(id: number): Promise<ServiceZone | undefined> {
    return this.serviceZonesData.get(id);
  }

  async getServiceZoneByZipCode(zipCode: string): Promise<ServiceZone | undefined> {
    // If no matching zone, return the first zone (for demo purposes)
    const matchedZone = Array.from(this.serviceZonesData.values()).find(
      (zone) => zone.zipCodes.split(',').includes(zipCode)
    );
    
    // For demonstration, always return a zone (first one if no match)
    // In a production app, you would return undefined if no match
    return matchedZone || this.serviceZonesData.get(1);
  }

  async listServiceZones(): Promise<ServiceZone[]> {
    return Array.from(this.serviceZonesData.values());
  }

  async createServiceZone(insertZone: InsertServiceZone): Promise<ServiceZone> {
    const id = this.serviceZoneId++;
    const timestamp = new Date();
    const zone: ServiceZone = {
      ...insertZone,
      id,
      createdAt: timestamp
    };
    this.serviceZonesData.set(id, zone);
    return zone;
  }

  async updateServiceZone(id: number, zoneUpdate: Partial<InsertServiceZone>): Promise<ServiceZone | undefined> {
    const zone = this.serviceZonesData.get(id);
    if (!zone) return undefined;
    
    const updatedZone: ServiceZone = {
      ...zone,
      ...zoneUpdate
    };
    
    this.serviceZonesData.set(id, updatedZone);
    return updatedZone;
  }

  async deleteServiceZone(id: number): Promise<boolean> {
    return this.serviceZonesData.delete(id);
  }

  // Rental duration methods
  async getRentalDuration(id: number): Promise<RentalDuration | undefined> {
    return this.rentalDurationsData.get(id);
  }

  async listRentalDurations(): Promise<RentalDuration[]> {
    return Array.from(this.rentalDurationsData.values());
  }

  async createRentalDuration(insertDuration: InsertRentalDuration): Promise<RentalDuration> {
    const id = this.rentalDurationId++;
    const timestamp = new Date();
    const duration: RentalDuration = {
      ...insertDuration,
      id,
      createdAt: timestamp
    };
    this.rentalDurationsData.set(id, duration);
    return duration;
  }

  async updateRentalDuration(id: number, durationUpdate: Partial<InsertRentalDuration>): Promise<RentalDuration | undefined> {
    const duration = this.rentalDurationsData.get(id);
    if (!duration) return undefined;
    
    const updatedDuration: RentalDuration = {
      ...duration,
      ...durationUpdate
    };
    
    this.rentalDurationsData.set(id, updatedDuration);
    return updatedDuration;
  }

  async deleteRentalDuration(id: number): Promise<boolean> {
    return this.rentalDurationsData.delete(id);
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookingsData.get(id);
  }

  async listBookings(): Promise<Booking[]> {
    return Array.from(this.bookingsData.values());
  }

  async listBookingsByStatus(status: string): Promise<Booking[]> {
    return Array.from(this.bookingsData.values()).filter(
      booking => booking.status === status
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingId++;
    const timestamp = new Date();
    const booking: Booking = {
      ...insertBooking,
      id,
      createdAt: timestamp
    };
    this.bookingsData.set(id, booking);
    return booking;
  }

  async updateBooking(id: number, bookingUpdate: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookingsData.get(id);
    if (!booking) return undefined;
    
    const updatedBooking: Booking = {
      ...booking,
      ...bookingUpdate
    };
    
    this.bookingsData.set(id, updatedBooking);
    return updatedBooking;
  }

  async updateBookingPaymentStatus(
    id: number, 
    paymentStatus: string, 
    stripePaymentIntentId?: string
  ): Promise<Booking | undefined> {
    const booking = this.bookingsData.get(id);
    if (!booking) return undefined;
    
    const updatedBooking: Booking = {
      ...booking,
      paymentStatus,
      ...(stripePaymentIntentId && { stripePaymentIntentId })
    };
    
    this.bookingsData.set(id, updatedBooking);
    return updatedBooking;
  }
}

export const storage = new MemStorage();
