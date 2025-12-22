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
  type InsertBooking,
  dumpsterPricing,
  type DumpsterPricing,
  type InsertDumpsterPricing,
  hubs,
  type Hub,
  type InsertHub,
  additionalCharges,
  type AdditionalCharge,
  type InsertAdditionalCharge,
  paymentLinks,
  type PaymentLink,
  type InsertPaymentLink,
  legalDocuments,
  type LegalDocument,
  type InsertLegalDocument,
  businessSettings,
  type BusinessSetting,
  services,
  type Service,
  type InsertService,
  customerAccounts,
  type CustomerAccount,
  type InsertCustomerAccount,
  swapRequests,
  type SwapRequest,
  type InsertSwapRequest,
  customerCredits,
  type CustomerCredit,
  type InsertCustomerCredit,
  loadBillingConfig,
  type LoadBillingConfig,
  type InsertLoadBillingConfig,
  loadRecords,
  type LoadRecord,
  type InsertLoadRecord
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import * as bcrypt from 'bcryptjs';

// Database interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<boolean>;
  updateUserProfile(id: number, profile: { username: string; email: string }): Promise<boolean>;
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
  deleteBooking(id: number): Promise<boolean>;

  // Dumpster pricing methods
  getDumpsterPricing(dumpsterId: number): Promise<DumpsterPricing[]>;
  getAllDumpsterPricing(): Promise<DumpsterPricing[]>;
  createDumpsterPricing(pricing: InsertDumpsterPricing): Promise<DumpsterPricing>;
  updateDumpsterPricing(id: number, pricing: Partial<InsertDumpsterPricing>): Promise<DumpsterPricing | undefined>;
  deleteDumpsterPricing(id: number): Promise<boolean>;

  // Inventory management methods
  checkDumpsterAvailability(dumpsterId: number, deliveryDate: string, rentalDays: number): Promise<boolean>;
  getAvailableDumpsters(deliveryDate: string, rentalDays: number): Promise<Dumpster[]>;

  // Hub methods
  getHub(id: number): Promise<Hub | undefined>;
  listHubs(): Promise<Hub[]>;
  createHub(hub: InsertHub): Promise<Hub>;
  updateHub(id: number, hub: Partial<InsertHub>): Promise<Hub | undefined>;
  deleteHub(id: number): Promise<boolean>;
  unsetMainHub(): Promise<void>;
  getMainHub(): Promise<Hub | undefined>;

  // Additional charges methods
  getAdditionalCharges(bookingId: number): Promise<AdditionalCharge[]>;
  createAdditionalCharge(charge: InsertAdditionalCharge): Promise<AdditionalCharge>;
  updateAdditionalCharge(id: number, charge: Partial<InsertAdditionalCharge>): Promise<AdditionalCharge | undefined>;
  deleteAdditionalCharge(id: number): Promise<boolean>;

  // Payment links methods
  getPaymentLinks(bookingId: number): Promise<PaymentLink[]>;
  getPaymentLink(id: number): Promise<PaymentLink | undefined>;
  createPaymentLink(link: InsertPaymentLink): Promise<PaymentLink>;
  updatePaymentLinkStatus(id: number, status: string, paidAt?: Date): Promise<PaymentLink | undefined>;
  deletePaymentLink(id: number): Promise<boolean>;

  // Legal documents methods
  getLegalDocuments(): Promise<LegalDocument[]>;
  getLegalDocument(id: number): Promise<LegalDocument | undefined>;
  getLegalDocumentByType(type: string): Promise<LegalDocument | undefined>;
  createLegalDocument(document: InsertLegalDocument): Promise<LegalDocument>;
  updateLegalDocument(id: number, document: Partial<InsertLegalDocument>): Promise<LegalDocument | undefined>;
  deleteLegalDocument(id: number): Promise<boolean>;

  // Service methods
  listServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Business settings methods
  getBusinessSetting(key: string): Promise<string | undefined>;
  getAllBusinessSettings(): Promise<Record<string, string>>;
  setBusinessSetting(key: string, value: string, description?: string): Promise<void>;
  setBusinessSettings(settings: Record<string, string>): Promise<void>;

  // Customer account methods
  getCustomerAccount(id: number): Promise<CustomerAccount | undefined>;
  getCustomerAccountByEmail(email: string): Promise<CustomerAccount | undefined>;
  createCustomerAccount(account: InsertCustomerAccount): Promise<CustomerAccount>;
  verifyAccessCode(email: string, accessCode: string): Promise<CustomerAccount | null>;
  updateCustomerAccountLastLogin(id: number): Promise<void>;
  listCustomerAccounts(): Promise<CustomerAccount[]>;

  // Swap request methods
  getSwapRequest(id: number): Promise<SwapRequest | undefined>;
  listSwapRequests(): Promise<SwapRequest[]>;
  listSwapRequestsByBooking(bookingId: number): Promise<SwapRequest[]>;
  listSwapRequestsByStatus(status: string): Promise<SwapRequest[]>;
  createSwapRequest(request: InsertSwapRequest): Promise<SwapRequest>;
  updateSwapRequest(id: number, request: Partial<InsertSwapRequest>): Promise<SwapRequest | undefined>;

  // Customer credit methods
  getCustomerCredits(customerAccountId: number): Promise<CustomerCredit[]>;
  getAvailableCredits(customerAccountId: number): Promise<CustomerCredit[]>;
  createCustomerCredit(credit: InsertCustomerCredit): Promise<CustomerCredit>;
  useCustomerCredit(id: number, bookingId: number): Promise<CustomerCredit | undefined>;

  // Load billing methods
  getLoadBillingConfig(dumpsterId: number): Promise<LoadBillingConfig | undefined>;
  listLoadBillingConfigs(): Promise<LoadBillingConfig[]>;
  createLoadBillingConfig(config: InsertLoadBillingConfig): Promise<LoadBillingConfig>;
  updateLoadBillingConfig(id: number, config: Partial<InsertLoadBillingConfig>): Promise<LoadBillingConfig | undefined>;
  deleteLoadBillingConfig(id: number): Promise<boolean>;

  // Load record methods
  getLoadRecords(bookingId: number): Promise<LoadRecord[]>;
  createLoadRecord(record: InsertLoadRecord): Promise<LoadRecord>;

  // Booking lookup by email (for customer portal)
  listBookingsByEmail(email: string): Promise<Booking[]>;

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
      weightLimit: 4000, // 2 tons (4000 lbs)
      availability: 10,
      imageUrl: "/assets/dumpster-10yard.svg"
    });
    this.createDumpster({
      name: "15 Yard Dumpster",
      dimensions: "12' × 8' × 4.5' (LWH)",
      description: "Perfect for medium renovation projects or large cleanouts.",
      weightLimit: 6000, // 3 tons (6000 lbs)
      availability: 8,
      imageUrl: "/assets/dumpster-15yard.svg"
    });
    this.createDumpster({
      name: "20 Yard Dumpster",
      dimensions: "16' × 8' × 5' (LWH)",
      description: "Great for large remodeling or construction projects.",
      weightLimit: 8000, // 4 tons (8000 lbs)
      availability: 6,
      imageUrl: "/assets/dumpster-20yard.svg"
    });
    this.createDumpster({
      name: "30 Yard Dumpster",
      dimensions: "20' × 8' × 6' (LWH)",
      description: "For major construction or demolition projects.",
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

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookingsData.delete(id);
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    const PgStore = connectPgSimple(session);
    this.sessionStore = new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    });
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Only add default data if no users exist
    const users = await this.listUsers();
    if (users.length === 0) {
      // Create admin user
      await this.createUser({
        username: "admin",
        password: await bcrypt.hash("admin123", 10),
        email: "admin@dumpsterdirect.com",
        isAdmin: true,
      });

      // Create sample dumpsters
      const dumpster1 = await this.createDumpster({
        name: "10 Yard Dumpster",
        description: "Ideal for small projects like bathroom renovations or yard cleanups.",
        dimensions: "12' x 8' x 4'",
        weightLimit: 2000,
        availability: 5,
        imageUrl: "/images/10yard.jpg",
      });

      const dumpster2 = await this.createDumpster({
        name: "20 Yard Dumpster",
        description: "Perfect for medium-sized projects like kitchen renovations or deck removal.",
        dimensions: "16' x 8' x 5'",
        weightLimit: 3000,
        availability: 5,
        imageUrl: "/images/20yard.jpg",
      });

      const dumpster3 = await this.createDumpster({
        name: "30 Yard Dumpster",
        description: "Our largest option for major projects like home renovations or commercial cleanouts.",
        dimensions: "20' x 8' x 6'",
        weightLimit: 5000,
        availability: 5,
        imageUrl: "/images/30yard.jpg",
      });

      // Create dumpster pricing options
      // 15 Yard Dumpster pricing
      await this.createDumpsterPricing({
        dumpsterId: dumpster1.id,
        days: 1,
        price: 35000, // $350
        sortOrder: 1,
      });
      await this.createDumpsterPricing({
        dumpsterId: dumpster1.id,
        days: 3,
        price: 42000, // $420
        sortOrder: 2,
      });
      await this.createDumpsterPricing({
        dumpsterId: dumpster1.id,
        days: 7,
        price: 50000, // $500
        sortOrder: 3,
      });

      // 20 Yard Dumpster pricing
      await this.createDumpsterPricing({
        dumpsterId: dumpster2.id,
        days: 1,
        price: 42000, // $420
        sortOrder: 1,
      });
      await this.createDumpsterPricing({
        dumpsterId: dumpster2.id,
        days: 3,
        price: 50000, // $500
        sortOrder: 2,
      });
      await this.createDumpsterPricing({
        dumpsterId: dumpster2.id,
        days: 7,
        price: 60000, // $600
        sortOrder: 3,
      });

      // 30 Yard Dumpster pricing
      await this.createDumpsterPricing({
        dumpsterId: dumpster3.id,
        days: 1,
        price: 50000, // $500
        sortOrder: 1,
      });
      await this.createDumpsterPricing({
        dumpsterId: dumpster3.id,
        days: 3,
        price: 60000, // $600
        sortOrder: 2,
      });
      await this.createDumpsterPricing({
        dumpsterId: dumpster3.id,
        days: 7,
        price: 72000, // $720
        sortOrder: 3,
      });

      // Create rental durations
      await this.createRentalDuration({
        days: 3,
        additionalPrice: 0,
      });
      await this.createRentalDuration({
        days: 7,
        additionalPrice: 5000,
      });
      await this.createRentalDuration({
        days: 14,
        additionalPrice: 10000,
      });

      // Create service zones
      await this.createServiceZone({
        name: "Zone A - City Center",
        zipCodes: "10001,10002,10003,10004,10005,62401",
        deliveryFee: 4500 // $45
      });
      await this.createServiceZone({
        name: "Zone B - Suburban",
        zipCodes: "10006,10007,10008,10009,10010",
        deliveryFee: 5500 // $55
      });
      await this.createServiceZone({
        name: "Zone C - Outer Areas",
        zipCodes: "10011,10012,10013,10014,10015",
        deliveryFee: 6500 // $65
      });

      // Create add-ons
      await this.createAddOn({
        name: "Extra Weight",
        description: "Additional weight allowance (per 500 pounds)",
        price: 5000,
      });
      await this.createAddOn({
        name: "Dumpster Liner",
        description: "Protective liner for containing fine materials",
        price: 2500,
      });
      await this.createAddOn({
        name: "Driveway Protection",
        description: "Boards to protect your driveway from damage",
        price: 3000,
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async updateUserProfile(id: number, profile: { username: string; email: string }): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ 
        username: profile.username,
        email: profile.email
      })
      .where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Dumpster methods
  async getDumpster(id: number): Promise<Dumpster | undefined> {
    const [dumpster] = await db.select().from(dumpsters).where(eq(dumpsters.id, id));
    return dumpster;
  }

  async listDumpsters(): Promise<Dumpster[]> {
    return db.select().from(dumpsters).orderBy(dumpsters.sortOrder, dumpsters.id);
  }

  async createDumpster(insertDumpster: InsertDumpster): Promise<Dumpster> {
    const [dumpster] = await db.insert(dumpsters).values(insertDumpster).returning();
    return dumpster;
  }

  async updateDumpster(id: number, dumpsterUpdate: Partial<InsertDumpster>): Promise<Dumpster | undefined> {
    const [updatedDumpster] = await db
      .update(dumpsters)
      .set(dumpsterUpdate)
      .where(eq(dumpsters.id, id))
      .returning();
    return updatedDumpster;
  }

  async deleteDumpster(id: number): Promise<boolean> {
    const result = await db.delete(dumpsters).where(eq(dumpsters.id, id));
    return result.rowCount > 0;
  }

  // Add-on methods
  async getAddOn(id: number): Promise<AddOn | undefined> {
    const [addon] = await db.select().from(addOns).where(eq(addOns.id, id));
    return addon;
  }

  async listAddOns(): Promise<AddOn[]> {
    return db.select().from(addOns);
  }

  async createAddOn(insertAddOn: InsertAddOn): Promise<AddOn> {
    const [addon] = await db.insert(addOns).values(insertAddOn).returning();
    return addon;
  }

  async updateAddOn(id: number, addonUpdate: Partial<InsertAddOn>): Promise<AddOn | undefined> {
    const [updatedAddOn] = await db
      .update(addOns)
      .set(addonUpdate)
      .where(eq(addOns.id, id))
      .returning();
    return updatedAddOn;
  }

  async deleteAddOn(id: number): Promise<boolean> {
    const result = await db.delete(addOns).where(eq(addOns.id, id));
    return result.rowCount > 0;
  }

  // Service zone methods
  async getServiceZone(id: number): Promise<ServiceZone | undefined> {
    const [zone] = await db.select().from(serviceZones).where(eq(serviceZones.id, id));
    return zone;
  }

  async getServiceZoneByZipCode(zipCode: string): Promise<ServiceZone | undefined> {
    // Find zone that contains this zip code
    const zones = await db.select().from(serviceZones);
    return zones.find(zone => 
      zone.zipCodes.split(',').some(zip => zip.trim() === zipCode)
    );
  }

  async listServiceZones(): Promise<ServiceZone[]> {
    return db.select().from(serviceZones);
  }

  async createServiceZone(insertZone: InsertServiceZone): Promise<ServiceZone> {
    const [zone] = await db.insert(serviceZones).values(insertZone).returning();
    return zone;
  }

  async updateServiceZone(id: number, zoneUpdate: Partial<InsertServiceZone>): Promise<ServiceZone | undefined> {
    const [updatedZone] = await db
      .update(serviceZones)
      .set(zoneUpdate)
      .where(eq(serviceZones.id, id))
      .returning();
    return updatedZone;
  }

  async deleteServiceZone(id: number): Promise<boolean> {
    const result = await db.delete(serviceZones).where(eq(serviceZones.id, id));
    return result.rowCount > 0;
  }

  // Rental duration methods
  async getRentalDuration(id: number): Promise<RentalDuration | undefined> {
    const [duration] = await db.select().from(rentalDurations).where(eq(rentalDurations.id, id));
    return duration;
  }

  async listRentalDurations(): Promise<RentalDuration[]> {
    return db.select().from(rentalDurations);
  }

  async createRentalDuration(insertDuration: InsertRentalDuration): Promise<RentalDuration> {
    const [duration] = await db.insert(rentalDurations).values(insertDuration).returning();
    return duration;
  }

  async updateRentalDuration(id: number, durationUpdate: Partial<InsertRentalDuration>): Promise<RentalDuration | undefined> {
    const [updatedDuration] = await db
      .update(rentalDurations)
      .set(durationUpdate)
      .where(eq(rentalDurations.id, id))
      .returning();
    return updatedDuration;
  }

  async deleteRentalDuration(id: number): Promise<boolean> {
    const result = await db.delete(rentalDurations).where(eq(rentalDurations.id, id));
    return result.rowCount > 0;
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async listBookings(): Promise<Booking[]> {
    return db.select().from(bookings);
  }

  async listBookingsByStatus(status: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.status, status));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBooking(id: number, bookingUpdate: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(bookingUpdate)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async updateBookingPaymentStatus(id: number, paymentStatus: string, stripePaymentIntentId?: string): Promise<Booking | undefined> {
    const updates: Partial<InsertBooking> = { 
      paymentStatus: paymentStatus 
    };
    
    if (stripePaymentIntentId) {
      updates.stripePaymentIntentId = stripePaymentIntentId;
    }
    
    return this.updateBooking(id, updates);
  }

  async deleteBooking(id: number): Promise<boolean> {
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Dumpster pricing methods
  async getDumpsterPricing(dumpsterId: number): Promise<DumpsterPricing[]> {
    return await db.select().from(dumpsterPricing).where(eq(dumpsterPricing.dumpsterId, dumpsterId)).orderBy(dumpsterPricing.sortOrder, dumpsterPricing.days);
  }

  async getAllDumpsterPricing(): Promise<DumpsterPricing[]> {
    return await db.select().from(dumpsterPricing).orderBy(dumpsterPricing.dumpsterId, dumpsterPricing.sortOrder, dumpsterPricing.days);
  }

  async createDumpsterPricing(insertPricing: InsertDumpsterPricing): Promise<DumpsterPricing> {
    const [pricing] = await db
      .insert(dumpsterPricing)
      .values(insertPricing)
      .returning();
    return pricing;
  }

  async updateDumpsterPricing(id: number, pricingUpdate: Partial<InsertDumpsterPricing>): Promise<DumpsterPricing | undefined> {
    const [updated] = await db
      .update(dumpsterPricing)
      .set(pricingUpdate)
      .where(eq(dumpsterPricing.id, id))
      .returning();
    return updated;
  }

  async deleteDumpsterPricing(id: number): Promise<boolean> {
    const result = await db.delete(dumpsterPricing).where(eq(dumpsterPricing.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Inventory management methods
  async checkDumpsterAvailability(dumpsterId: number, deliveryDate: string, pricingId: number): Promise<boolean> {
    // Get the dumpster's total availability
    const dumpster = await this.getDumpster(dumpsterId);
    if (!dumpster) return false;

    // Get rental duration from pricing option
    const [pricing] = await db
      .select()
      .from(dumpsterPricing)
      .where(eq(dumpsterPricing.id, pricingId));
    
    if (!pricing) return false;

    // Calculate rental period
    const startDate = new Date(deliveryDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + pricing.days);

    // Get all active bookings for this dumpster that overlap with the requested period
    const overlappingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.dumpsterId, dumpsterId),
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'delivered')
          )
        )
      );

    // Count how many dumpsters are in use during the requested period
    let unitsInUse = 0;
    for (const booking of overlappingBookings) {
      const bookingStart = new Date(booking.deliveryDate);
      const bookingEnd = new Date(bookingStart);
      
      // Get the rental duration from the booking's pricing option
      const [bookingPricing] = await db
        .select()
        .from(dumpsterPricing)
        .where(eq(dumpsterPricing.id, booking.pricingId));
      
      if (bookingPricing) {
        bookingEnd.setDate(bookingEnd.getDate() + bookingPricing.days);
        
        // Check if periods overlap
        if (startDate < bookingEnd && endDate > bookingStart) {
          unitsInUse++;
        }
      }
    }

    return unitsInUse < dumpster.availability;
  }

  async getAvailabilityDetails(dumpsterId: number, deliveryDate: string, pricingId: number): Promise<{
    totalInventory: number;
    unitsInUse: number;
    availableUnits: number;
    conflictingBookings: Array<{ id: number; deliveryDate: Date; status: string }>;
  }> {
    // Get the dumpster's total availability
    const dumpster = await this.getDumpster(dumpsterId);
    if (!dumpster) {
      return {
        totalInventory: 0,
        unitsInUse: 0,
        availableUnits: 0,
        conflictingBookings: []
      };
    }

    // Get rental duration from pricing option
    const [pricing] = await db
      .select()
      .from(dumpsterPricing)
      .where(eq(dumpsterPricing.id, pricingId));
    
    if (!pricing) {
      return {
        totalInventory: dumpster.availability,
        unitsInUse: 0,
        availableUnits: dumpster.availability,
        conflictingBookings: []
      };
    }

    // Calculate rental period
    const startDate = new Date(deliveryDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + pricing.days);

    // Get all active bookings for this dumpster that overlap with the requested period
    const overlappingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.dumpsterId, dumpsterId),
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'delivered')
          )
        )
      );

    // Count conflicting bookings and collect details
    const conflictingBookings: Array<{ id: number; deliveryDate: Date; status: string }> = [];
    let unitsInUse = 0;

    for (const booking of overlappingBookings) {
      const bookingStart = new Date(booking.deliveryDate);
      const bookingEnd = new Date(bookingStart);
      
      // Get the rental duration from the booking's pricing option
      const [bookingPricing] = await db
        .select()
        .from(dumpsterPricing)
        .where(eq(dumpsterPricing.id, booking.pricingId));
      
      if (bookingPricing) {
        bookingEnd.setDate(bookingEnd.getDate() + bookingPricing.days);
        
        // Check if periods overlap
        if (startDate < bookingEnd && endDate > bookingStart) {
          unitsInUse++;
          conflictingBookings.push({
            id: booking.id,
            deliveryDate: booking.deliveryDate,
            status: booking.status
          });
        }
      }
    }

    return {
      totalInventory: dumpster.availability,
      unitsInUse,
      availableUnits: dumpster.availability - unitsInUse,
      conflictingBookings
    };
  }

  async getAvailableDumpsters(deliveryDate: string, pricingId: number): Promise<Dumpster[]> {
    const allDumpsters = await this.listDumpsters();
    const availableDumpsters: Dumpster[] = [];

    for (const dumpster of allDumpsters) {
      const isAvailable = await this.checkDumpsterAvailability(dumpster.id, deliveryDate, pricingId);
      if (isAvailable) {
        availableDumpsters.push(dumpster);
      }
    }

    return availableDumpsters;
  }

  // Hub methods
  async getHub(id: number): Promise<Hub | undefined> {
    const [hub] = await db.select().from(hubs).where(eq(hubs.id, id));
    return hub;
  }

  async listHubs(): Promise<Hub[]> {
    return db.select().from(hubs).where(eq(hubs.isActive, true));
  }

  async createHub(insertHub: InsertHub): Promise<Hub> {
    const [hub] = await db.insert(hubs).values(insertHub).returning();
    return hub;
  }

  async updateHub(id: number, hubUpdate: Partial<InsertHub>): Promise<Hub | undefined> {
    const [updatedHub] = await db
      .update(hubs)
      .set(hubUpdate)
      .where(eq(hubs.id, id))
      .returning();
    return updatedHub;
  }

  async deleteHub(id: number): Promise<boolean> {
    const result = await db.delete(hubs).where(eq(hubs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async unsetMainHub(): Promise<void> {
    await db.update(hubs).set({ isMainHub: false }).where(eq(hubs.isMainHub, true));
  }

  async getMainHub(): Promise<Hub | undefined> {
    const [hub] = await db.select().from(hubs).where(and(eq(hubs.isMainHub, true), eq(hubs.isActive, true)));
    return hub;
  }

  // Additional charges methods
  async getAdditionalCharges(bookingId: number): Promise<AdditionalCharge[]> {
    return db.select().from(additionalCharges).where(eq(additionalCharges.bookingId, bookingId));
  }

  async createAdditionalCharge(charge: InsertAdditionalCharge): Promise<AdditionalCharge> {
    const [newCharge] = await db.insert(additionalCharges).values(charge).returning();
    return newCharge;
  }

  async updateAdditionalCharge(id: number, charge: Partial<InsertAdditionalCharge>): Promise<AdditionalCharge | undefined> {
    const [updatedCharge] = await db
      .update(additionalCharges)
      .set(charge)
      .where(eq(additionalCharges.id, id))
      .returning();
    return updatedCharge;
  }

  async deleteAdditionalCharge(id: number): Promise<boolean> {
    const result = await db.delete(additionalCharges).where(eq(additionalCharges.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Payment links methods
  async getPaymentLinks(bookingId: number): Promise<PaymentLink[]> {
    return db.select().from(paymentLinks).where(eq(paymentLinks.bookingId, bookingId));
  }

  async getPaymentLink(id: number): Promise<PaymentLink | undefined> {
    const [link] = await db.select().from(paymentLinks).where(eq(paymentLinks.id, id));
    return link;
  }

  async createPaymentLink(link: InsertPaymentLink): Promise<PaymentLink> {
    const [newLink] = await db.insert(paymentLinks).values(link).returning();
    return newLink;
  }

  async updatePaymentLinkStatus(id: number, status: string, paidAt?: Date): Promise<PaymentLink | undefined> {
    const updateData: any = { status };
    if (paidAt) {
      updateData.paidAt = paidAt;
    }
    
    const [updatedLink] = await db
      .update(paymentLinks)
      .set(updateData)
      .where(eq(paymentLinks.id, id))
      .returning();
    return updatedLink;
  }

  async deletePaymentLink(id: number): Promise<boolean> {
    const result = await db.delete(paymentLinks).where(eq(paymentLinks.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Legal documents methods
  async getLegalDocuments(): Promise<LegalDocument[]> {
    return db.select().from(legalDocuments).where(eq(legalDocuments.isActive, true));
  }

  async getLegalDocument(id: number): Promise<LegalDocument | undefined> {
    const [document] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id));
    return document;
  }

  async getLegalDocumentByType(type: string): Promise<LegalDocument | undefined> {
    const [document] = await db.select().from(legalDocuments)
      .where(and(eq(legalDocuments.type, type), eq(legalDocuments.isActive, true)));
    return document;
  }

  async createLegalDocument(document: InsertLegalDocument): Promise<LegalDocument> {
    const [newDocument] = await db.insert(legalDocuments).values(document).returning();
    return newDocument;
  }

  async updateLegalDocument(id: number, documentUpdate: Partial<InsertLegalDocument>): Promise<LegalDocument | undefined> {
    const updateData = { ...documentUpdate, updatedAt: new Date() };
    const [updatedDocument] = await db
      .update(legalDocuments)
      .set(updateData)
      .where(eq(legalDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteLegalDocument(id: number): Promise<boolean> {
    const result = await db.delete(legalDocuments).where(eq(legalDocuments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Service methods
  async listServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(services.sortOrder, services.name);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(serviceData).returning();
    return service;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db.update(services).set(serviceData).where(eq(services.id, id)).returning();
    return service;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Business settings methods
  async getBusinessSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(businessSettings).where(eq(businessSettings.key, key));
    return setting?.value;
  }

  async getAllBusinessSettings(): Promise<Record<string, string>> {
    const settings = await db.select().from(businessSettings);
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }

  async setBusinessSetting(key: string, value: string, description?: string): Promise<void> {
    const [existing] = await db.select().from(businessSettings).where(eq(businessSettings.key, key));
    
    if (existing) {
      await db.update(businessSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(businessSettings.key, key));
    } else {
      await db.insert(businessSettings).values({ key, value, description });
    }
  }

  async setBusinessSettings(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.setBusinessSetting(key, value);
    }
  }

  // Customer account methods
  async getCustomerAccount(id: number): Promise<CustomerAccount | undefined> {
    const [account] = await db.select().from(customerAccounts).where(eq(customerAccounts.id, id));
    return account;
  }

  async getCustomerAccountByEmail(email: string): Promise<CustomerAccount | undefined> {
    const [account] = await db.select().from(customerAccounts).where(eq(customerAccounts.email, email.toLowerCase()));
    return account;
  }

  async createCustomerAccount(account: InsertCustomerAccount): Promise<CustomerAccount> {
    // Hash the access code like a password for security
    const bcrypt = await import("bcryptjs");
    const hashedAccessCode = await bcrypt.hash(account.accessCode, 10);
    
    const [newAccount] = await db.insert(customerAccounts).values({
      ...account,
      email: account.email.toLowerCase(),
      accessCode: hashedAccessCode
    }).returning();
    return newAccount;
  }

  async verifyAccessCode(email: string, accessCode: string): Promise<CustomerAccount | null> {
    const account = await this.getCustomerAccountByEmail(email);
    if (!account) return null;
    
    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(accessCode, account.accessCode);
    
    if (isValid) {
      await this.updateCustomerAccountLastLogin(account.id);
      return account;
    }
    return null;
  }

  async updateCustomerAccountLastLogin(id: number): Promise<void> {
    await db.update(customerAccounts)
      .set({ lastLoginAt: new Date() })
      .where(eq(customerAccounts.id, id));
  }

  async listCustomerAccounts(): Promise<CustomerAccount[]> {
    return db.select().from(customerAccounts);
  }

  // Swap request methods
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    const [request] = await db.select().from(swapRequests).where(eq(swapRequests.id, id));
    return request;
  }

  async listSwapRequests(): Promise<SwapRequest[]> {
    return db.select().from(swapRequests);
  }

  async listSwapRequestsByBooking(bookingId: number): Promise<SwapRequest[]> {
    return db.select().from(swapRequests).where(eq(swapRequests.bookingId, bookingId));
  }

  async listSwapRequestsByStatus(status: string): Promise<SwapRequest[]> {
    return db.select().from(swapRequests).where(eq(swapRequests.status, status));
  }

  async createSwapRequest(request: InsertSwapRequest): Promise<SwapRequest> {
    const [newRequest] = await db.insert(swapRequests).values(request).returning();
    return newRequest;
  }

  async updateSwapRequest(id: number, requestUpdate: Partial<InsertSwapRequest>): Promise<SwapRequest | undefined> {
    const updateData = { ...requestUpdate, updatedAt: new Date() };
    const [updatedRequest] = await db
      .update(swapRequests)
      .set(updateData)
      .where(eq(swapRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Customer credit methods
  async getCustomerCredits(customerAccountId: number): Promise<CustomerCredit[]> {
    return db.select().from(customerCredits).where(eq(customerCredits.customerAccountId, customerAccountId));
  }

  async getAvailableCredits(customerAccountId: number): Promise<CustomerCredit[]> {
    const now = new Date();
    const credits = await db.select().from(customerCredits)
      .where(eq(customerCredits.customerAccountId, customerAccountId));
    // Filter to only unused credits that haven't expired
    return credits.filter(credit => 
      !credit.usedAt && (!credit.expiresAt || new Date(credit.expiresAt) > now)
    );
  }

  async createCustomerCredit(credit: InsertCustomerCredit): Promise<CustomerCredit> {
    const [newCredit] = await db.insert(customerCredits).values(credit).returning();
    return newCredit;
  }

  async useCustomerCredit(id: number, bookingId: number): Promise<CustomerCredit | undefined> {
    const [updatedCredit] = await db
      .update(customerCredits)
      .set({ usedInBookingId: bookingId, usedAt: new Date() })
      .where(eq(customerCredits.id, id))
      .returning();
    return updatedCredit;
  }

  // Load billing methods
  async getLoadBillingConfig(dumpsterId: number): Promise<LoadBillingConfig | undefined> {
    const [config] = await db.select().from(loadBillingConfig)
      .where(and(eq(loadBillingConfig.dumpsterId, dumpsterId), eq(loadBillingConfig.isActive, true)));
    return config;
  }

  async listLoadBillingConfigs(): Promise<LoadBillingConfig[]> {
    return db.select().from(loadBillingConfig);
  }

  async createLoadBillingConfig(config: InsertLoadBillingConfig): Promise<LoadBillingConfig> {
    const [newConfig] = await db.insert(loadBillingConfig).values(config).returning();
    return newConfig;
  }

  async updateLoadBillingConfig(id: number, configUpdate: Partial<InsertLoadBillingConfig>): Promise<LoadBillingConfig | undefined> {
    const [updatedConfig] = await db
      .update(loadBillingConfig)
      .set(configUpdate)
      .where(eq(loadBillingConfig.id, id))
      .returning();
    return updatedConfig;
  }

  async deleteLoadBillingConfig(id: number): Promise<boolean> {
    const result = await db.delete(loadBillingConfig).where(eq(loadBillingConfig.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Load record methods
  async getLoadRecords(bookingId: number): Promise<LoadRecord[]> {
    return db.select().from(loadRecords).where(eq(loadRecords.bookingId, bookingId));
  }

  async createLoadRecord(record: InsertLoadRecord): Promise<LoadRecord> {
    const [newRecord] = await db.insert(loadRecords).values(record).returning();
    return newRecord;
  }

  // Booking lookup by email
  async listBookingsByEmail(email: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.customerEmail, email.toLowerCase()));
  }
}

export const storage = new DatabaseStorage();
