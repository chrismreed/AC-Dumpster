import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import Stripe from "stripe";
import { z } from "zod";
import { 
  insertDumpsterSchema, 
  insertAddOnSchema, 
  insertServiceZoneSchema,
  insertRentalDurationSchema,
  insertBookingSchema,
  insertDumpsterPricingSchema 
} from "@shared/schema";

// Check for Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: Missing STRIPE_SECRET_KEY environment variable. Stripe payments will not work.');
}

// Initialize Stripe if key available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : undefined;

// Admin middleware
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Dumpster routes
  app.get("/api/dumpsters", async (_req, res) => {
    try {
      const dumpsters = await storage.listDumpsters();
      res.json(dumpsters);
    } catch (err) {
      console.error("Error fetching dumpsters:", err);
      res.status(500).json({ message: "Failed to fetch dumpsters" });
    }
  });

  app.get("/api/dumpsters/:id", async (req, res) => {
    try {
      const dumpster = await storage.getDumpster(Number(req.params.id));
      if (!dumpster) {
        return res.status(404).json({ message: "Dumpster not found" });
      }
      res.json(dumpster);
    } catch (err) {
      console.error("Error fetching dumpster:", err);
      res.status(500).json({ message: "Failed to fetch dumpster" });
    }
  });

  app.post("/api/dumpsters", isAdmin, async (req, res) => {
    try {
      const validatedData = insertDumpsterSchema.parse(req.body);
      const dumpster = await storage.createDumpster(validatedData);
      res.status(201).json(dumpster);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid dumpster data", errors: err.errors });
      }
      console.error("Error creating dumpster:", err);
      res.status(500).json({ message: "Failed to create dumpster" });
    }
  });

  app.put("/api/dumpsters/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const dumpster = await storage.getDumpster(id);
      if (!dumpster) {
        return res.status(404).json({ message: "Dumpster not found" });
      }
      
      const validatedData = insertDumpsterSchema.partial().parse(req.body);
      const updatedDumpster = await storage.updateDumpster(id, validatedData);
      res.json(updatedDumpster);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid dumpster data", errors: err.errors });
      }
      console.error("Error updating dumpster:", err);
      res.status(500).json({ message: "Failed to update dumpster" });
    }
  });

  app.delete("/api/dumpsters/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const dumpster = await storage.getDumpster(id);
      if (!dumpster) {
        return res.status(404).json({ message: "Dumpster not found" });
      }
      
      await storage.deleteDumpster(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting dumpster:", err);
      res.status(500).json({ message: "Failed to delete dumpster" });
    }
  });

  // Add-on routes
  app.get("/api/addons", async (_req, res) => {
    try {
      const addons = await storage.listAddOns();
      res.json(addons);
    } catch (err) {
      console.error("Error fetching add-ons:", err);
      res.status(500).json({ message: "Failed to fetch add-ons" });
    }
  });

  app.get("/api/addons/:id", async (req, res) => {
    try {
      const addon = await storage.getAddOn(Number(req.params.id));
      if (!addon) {
        return res.status(404).json({ message: "Add-on not found" });
      }
      res.json(addon);
    } catch (err) {
      console.error("Error fetching add-on:", err);
      res.status(500).json({ message: "Failed to fetch add-on" });
    }
  });

  app.post("/api/addons", isAdmin, async (req, res) => {
    try {
      const validatedData = insertAddOnSchema.parse(req.body);
      const addon = await storage.createAddOn(validatedData);
      res.status(201).json(addon);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid add-on data", errors: err.errors });
      }
      console.error("Error creating add-on:", err);
      res.status(500).json({ message: "Failed to create add-on" });
    }
  });

  app.put("/api/addons/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const addon = await storage.getAddOn(id);
      if (!addon) {
        return res.status(404).json({ message: "Add-on not found" });
      }
      
      const validatedData = insertAddOnSchema.partial().parse(req.body);
      const updatedAddon = await storage.updateAddOn(id, validatedData);
      res.json(updatedAddon);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid add-on data", errors: err.errors });
      }
      console.error("Error updating add-on:", err);
      res.status(500).json({ message: "Failed to update add-on" });
    }
  });

  app.delete("/api/addons/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const addon = await storage.getAddOn(id);
      if (!addon) {
        return res.status(404).json({ message: "Add-on not found" });
      }
      
      await storage.deleteAddOn(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting add-on:", err);
      res.status(500).json({ message: "Failed to delete add-on" });
    }
  });

  // Dumpster pricing routes
  app.get("/api/dumpster-pricing/:dumpsterId", isAdmin, async (req, res) => {
    try {
      const dumpsterId = parseInt(req.params.dumpsterId);
      const pricing = await storage.getDumpsterPricing(dumpsterId);
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching dumpster pricing:", error);
      res.status(500).json({ message: "Failed to fetch dumpster pricing" });
    }
  });

  // Get individual pricing option by ID
  app.get("/api/dumpster-pricing/item/:pricingId", async (req, res) => {
    try {
      const pricingId = parseInt(req.params.pricingId);
      const allPricing = await storage.getAllDumpsterPricing();
      const pricing = allPricing.find((p: any) => p.id === pricingId);
      
      if (!pricing) {
        return res.status(404).json({ message: "Pricing option not found" });
      }
      
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching pricing option:", error);
      res.status(500).json({ message: "Failed to fetch pricing option" });
    }
  });

  app.post("/api/dumpster-pricing", isAdmin, async (req, res) => {
    try {
      const validatedData = insertDumpsterPricingSchema.parse(req.body);
      const pricing = await storage.createDumpsterPricing(validatedData);
      res.json(pricing);
    } catch (error) {
      console.error("Error creating dumpster pricing:", error);
      res.status(500).json({ message: "Failed to create dumpster pricing" });
    }
  });

  app.put("/api/dumpster-pricing/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDumpsterPricingSchema.partial().parse(req.body);
      const pricing = await storage.updateDumpsterPricing(id, validatedData);
      if (!pricing) {
        return res.status(404).json({ message: "Dumpster pricing not found" });
      }
      res.json(pricing);
    } catch (error) {
      console.error("Error updating dumpster pricing:", error);
      res.status(500).json({ message: "Failed to update dumpster pricing" });
    }
  });

  app.delete("/api/dumpster-pricing/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDumpsterPricing(id);
      if (!success) {
        return res.status(404).json({ message: "Dumpster pricing not found" });
      }
      res.json({ message: "Dumpster pricing deleted successfully" });
    } catch (error) {
      console.error("Error deleting dumpster pricing:", error);
      res.status(500).json({ message: "Failed to delete dumpster pricing" });
    }
  });

  // Update dumpster sort order
  app.put("/api/dumpsters/sort-order", isAdmin, async (req, res) => {
    try {
      const { dumpsterOrders } = req.body; // Array of { id, sortOrder }
      
      for (const order of dumpsterOrders) {
        const id = parseInt(order.id);
        const sortOrder = parseInt(order.sortOrder);
        
        if (isNaN(id) || isNaN(sortOrder)) {
          console.error("Invalid ID or sortOrder:", order);
          continue;
        }
        
        await storage.updateDumpster(id, { sortOrder });
      }
      
      res.json({ message: "Dumpster sort order updated successfully" });
    } catch (error) {
      console.error("Error updating dumpster sort order:", error);
      res.status(500).json({ message: "Failed to update dumpster sort order" });
    }
  });

  // Update dumpster pricing sort order
  app.put("/api/dumpster-pricing/sort-order", isAdmin, async (req, res) => {
    try {
      const { pricingOrders } = req.body; // Array of { id, sortOrder }
      
      for (const order of pricingOrders) {
        const id = parseInt(order.id);
        const sortOrder = parseInt(order.sortOrder);
        
        if (isNaN(id) || isNaN(sortOrder)) {
          console.error("Invalid ID or sortOrder:", order);
          continue;
        }
        
        await storage.updateDumpsterPricing(id, { sortOrder });
      }
      
      res.json({ message: "Pricing sort order updated successfully" });
    } catch (error) {
      console.error("Error updating pricing sort order:", error);
      res.status(500).json({ message: "Failed to update pricing sort order" });
    }
  });

  // Service zone routes
  app.get("/api/zones", async (_req, res) => {
    try {
      const zones = await storage.listServiceZones();
      res.json(zones);
    } catch (err) {
      console.error("Error fetching service zones:", err);
      res.status(500).json({ message: "Failed to fetch service zones" });
    }
  });

  app.get("/api/zones/:id", async (req, res) => {
    try {
      const zone = await storage.getServiceZone(Number(req.params.id));
      if (!zone) {
        return res.status(404).json({ message: "Service zone not found" });
      }
      res.json(zone);
    } catch (err) {
      console.error("Error fetching service zone:", err);
      res.status(500).json({ message: "Failed to fetch service zone" });
    }
  });

  app.get("/api/zones/zipcode/:zipcode", async (req, res) => {
    try {
      const zone = await storage.getServiceZoneByZipCode(req.params.zipcode);
      if (!zone) {
        return res.status(404).json({ message: "No service zone found for this ZIP code" });
      }
      res.json(zone);
    } catch (err) {
      console.error("Error fetching service zone by ZIP code:", err);
      res.status(500).json({ message: "Failed to fetch service zone by ZIP code" });
    }
  });

  app.post("/api/zones", isAdmin, async (req, res) => {
    try {
      const validatedData = insertServiceZoneSchema.parse(req.body);
      const zone = await storage.createServiceZone(validatedData);
      res.status(201).json(zone);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service zone data", errors: err.errors });
      }
      console.error("Error creating service zone:", err);
      res.status(500).json({ message: "Failed to create service zone" });
    }
  });

  app.put("/api/zones/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const zone = await storage.getServiceZone(id);
      if (!zone) {
        return res.status(404).json({ message: "Service zone not found" });
      }
      
      console.log("Updating zone with data:", req.body);
      const validatedData = insertServiceZoneSchema.partial().parse(req.body);
      const updatedZone = await storage.updateServiceZone(id, validatedData);
      res.json(updatedZone);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.log("Validation errors:", err.errors);
        return res.status(400).json({ message: "Invalid service zone data", errors: err.errors });
      }
      console.error("Error updating service zone:", err);
      res.status(500).json({ message: "Failed to update service zone" });
    }
  });

  app.delete("/api/zones/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const zone = await storage.getServiceZone(id);
      if (!zone) {
        return res.status(404).json({ message: "Service zone not found" });
      }
      
      await storage.deleteServiceZone(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting service zone:", err);
      res.status(500).json({ message: "Failed to delete service zone" });
    }
  });

  // Rental duration routes
  app.get("/api/durations", async (_req, res) => {
    try {
      const durations = await storage.listRentalDurations();
      res.json(durations);
    } catch (err) {
      console.error("Error fetching rental durations:", err);
      res.status(500).json({ message: "Failed to fetch rental durations" });
    }
  });

  app.post("/api/durations", isAdmin, async (req, res) => {
    try {
      const validatedData = insertRentalDurationSchema.parse(req.body);
      const duration = await storage.createRentalDuration(validatedData);
      res.status(201).json(duration);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rental duration data", errors: err.errors });
      }
      console.error("Error creating rental duration:", err);
      res.status(500).json({ message: "Failed to create rental duration" });
    }
  });

  app.put("/api/durations/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const duration = await storage.getRentalDuration(id);
      if (!duration) {
        return res.status(404).json({ message: "Rental duration not found" });
      }
      
      const validatedData = insertRentalDurationSchema.partial().parse(req.body);
      const updatedDuration = await storage.updateRentalDuration(id, validatedData);
      res.json(updatedDuration);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rental duration data", errors: err.errors });
      }
      console.error("Error updating rental duration:", err);
      res.status(500).json({ message: "Failed to update rental duration" });
    }
  });

  // Booking routes
  app.get("/api/bookings", isAdmin, async (_req, res) => {
    try {
      const bookings = await storage.listBookings();
      res.json(bookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Public availability endpoint for booking form
  app.get("/api/availability", async (_req, res) => {
    try {
      const bookings = await storage.listBookings();
      // Only return active bookings (not cancelled or completed) with minimal data needed for availability
      const activeBookings = bookings
        .filter(booking => booking.status !== 'cancelled' && booking.status !== 'completed')
        .map(booking => ({
          deliveryDate: booking.deliveryDate,
          dumpsterId: booking.dumpsterId
        }));
      res.json(activeBookings);
    } catch (err) {
      console.error("Error fetching availability:", err);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (err) {
      console.error("Error fetching booking:", err);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: err.errors });
      }
      console.error("Error creating booking:", err);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const validatedData = insertBookingSchema.partial().parse(req.body);
      const updatedBooking = await storage.updateBooking(id, validatedData);
      res.json(updatedBooking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: err.errors });
      }
      console.error("Error updating booking:", err);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.patch("/api/bookings/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const validatedData = insertBookingSchema.partial().parse(req.body);
      const updatedBooking = await storage.updateBooking(id, validatedData);
      res.json(updatedBooking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: err.errors });
      }
      console.error("Error updating booking:", err);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // For now, we'll use the updateBooking method to mark it as deleted
      // In a production system, you might want to soft delete or archive instead
      const success = await storage.deleteBooking ? 
        await storage.deleteBooking(id) : 
        await storage.updateBooking(id, { status: 'cancelled' });
      
      if (success) {
        res.json({ message: "Booking deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete booking" });
      }
    } catch (err) {
      console.error("Error deleting booking:", err);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });
  
  // Endpoint to update booking payment status for customer checkout
  app.patch("/api/bookings/:id/payment-status", async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const { status } = req.body;
      if (!status || !["pending", "paid", "failed", "canceled"].includes(status)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }
      
      const updatedBooking = await storage.updateBookingPaymentStatus(
        bookingId,
        status,
        booking.stripePaymentIntentId || undefined
      );
      
      res.json(updatedBooking);
    } catch (err) {
      console.error("Error updating booking payment status:", err);
      res.status(500).json({ message: "Failed to update booking payment status" });
    }
  });

  // Calculate price route
  app.post("/api/calculate-price", async (req, res) => {
    try {
      const { 
        dumpsterId, 
        rentalDurationId, 
        pricingId,
        deliveryZipCode, 
        deliveryAddress, 
        deliveryCity, 
        selectedAddOns 
      } = req.body;
      
      if (!dumpsterId || (!rentalDurationId && !pricingId) || !deliveryZipCode) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get dumpster
      const dumpster = await storage.getDumpster(Number(dumpsterId));
      if (!dumpster) {
        return res.status(404).json({ message: "Dumpster not found" });
      }

      let duration;
      if (pricingId) {
        // Get rental duration from dumpster pricing
        const pricingOptions = await storage.getDumpsterPricing(Number(dumpsterId));
        const selectedPricing = pricingOptions.find(p => p.id === Number(pricingId));
        if (!selectedPricing) {
          return res.status(404).json({ message: "Pricing option not found" });
        }
        // Create a duration object with the pricing data
        duration = {
          id: selectedPricing.id,
          days: selectedPricing.days,
          additionalPrice: selectedPricing.price
        };
      } else {
        // Get rental duration directly
        duration = await storage.getRentalDuration(Number(rentalDurationId));
        if (!duration) {
          return res.status(404).json({ message: "Rental duration not found" });
        }
      }

      // Get service zone
      const zone = await storage.getServiceZoneByZipCode(deliveryZipCode);
      if (!zone) {
        return res.status(404).json({ message: "Service not available in this ZIP code" });
      }

      // Calculate initial total price using only the rental duration price
      let totalPrice = duration.additionalPrice;
      
      // Calculate delivery fee - Use geofencing if enabled and address is provided
      let deliveryFee = zone.deliveryFee;
      let drivingTime = null;
      let drivingDistance = null;
      let geofencingApplied = false;
      
      // Log geofencing info for debugging
      console.log(`Checking if geofencing should be applied: zone.useGeofencing=${zone.useGeofencing}, deliveryAddress=${!!deliveryAddress}, deliveryCity=${!!deliveryCity}`);
      console.log('Zone details:', JSON.stringify(zone, null, 2));
      
      // If geofencing is enabled and we have full address details, calculate better fee
      if (zone.useGeofencing && deliveryAddress && deliveryCity) {
        console.log('Geofencing conditions met, will calculate distance-based fee');
        try {
          // Import distance service
          const { calculateDistanceFee } = await import('./services/distance-service');
          
          // Calculate fee based on actual driving distance/time
          const distanceData = await calculateDistanceFee(
            deliveryAddress, 
            deliveryCity, 
            deliveryZipCode,
            zone.deliveryFee // Pass the base zone fee as fallback
          );
          
          // If the address is within a service area, use the calculated fee
          if (distanceData.inServiceArea) {
            deliveryFee = distanceData.fee;
            drivingTime = distanceData.drivingTime;
            drivingDistance = distanceData.drivingDistance;
            geofencingApplied = true;
            
            // Log if we're using the fallback fee
            if (distanceData.usingFallback) {
              console.log('Using fallback zone fee due to Google Maps API limitations:', deliveryFee);
            }
          }
          // Otherwise, fall back to zone-based pricing
        } catch (error) {
          console.error('Error in geofencing calculation:', error);
          // Fall back to zone-based pricing if geofencing fails
        }
      }
      
      // Add delivery fee to total price
      totalPrice += deliveryFee;

      // Add add-ons if any
      if (selectedAddOns && selectedAddOns.length > 0) {
        const addOnItems = await Promise.all(selectedAddOns.map((item: { addonId: string | number, quantity?: number }) => {
          const { addonId, quantity = 1 } = item;
          return storage.getAddOn(Number(addonId));
        }));

        // Filter out any undefined add-ons and calculate prices
        addOnItems
          .filter(addon => addon !== undefined)
          .forEach((addon, index) => {
            if (addon) {
              const { quantity = 1 } = selectedAddOns[index];
              totalPrice += addon.price * quantity;
            }
          });
      }

      // Return comprehensive pricing details
      res.json({ 
        totalPrice,
        rentalPrice: duration.additionalPrice,
        deliveryFee,
        ...(geofencingApplied ? { 
          geofencingApplied,
          drivingTime,
          drivingDistance,
          // Include fallback status flag if geofencing was applied but we used fallback
          usingFallbackPricing: drivingTime === null
        } : {})
      });
    } catch (err) {
      console.error("Error calculating price:", err);
      res.status(500).json({ message: "Failed to calculate price" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      console.log("Creating payment intent with body:", req.body);
      
      if (!stripe) {
        console.error("Stripe not configured - missing STRIPE_SECRET_KEY");
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const { amount, bookingId } = req.body;
      
      if (!amount) {
        console.error("Amount is required for payment intent");
        return res.status(400).json({ message: "Amount is required" });
      }

      // Make sure amount is an integer (in cents) for Stripe
      const amountInteger = Math.round(Number(amount));
      
      console.log(`Creating payment intent for amount: ${amountInteger} cents, bookingId: ${bookingId || 'none'}`);
      
      if (process.env.STRIPE_SECRET_KEY) {
        console.log(`Using Stripe secret key starting with: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...`);
      } else {
        console.error("STRIPE_SECRET_KEY is missing or empty");
      }
      
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: amountInteger,
          currency: "usd",
          metadata: {
            bookingId: bookingId ? String(bookingId) : null
          },
          // Only use one of these options, not both
          // payment_method_types: ['card'],
          automatic_payment_methods: {
            enabled: true,
          }
        });

        console.log("Payment intent created successfully:", {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret ? "exists" : "missing"
        });
        
        // If bookingId is provided, update the booking with the paymentIntentId
        if (bookingId) {
          await storage.updateBookingPaymentStatus(
            Number(bookingId),
            "pending",
            paymentIntent.id
          );
          console.log(`Updated booking ${bookingId} with payment intent ${paymentIntent.id}`);
        }

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (stripeError: any) {
        console.error("Stripe API error:", stripeError.message);
        console.error("Stripe error type:", stripeError.type);
        
        return res.status(400).json({
          message: `Stripe API error: ${stripeError.message}`,
          type: stripeError.type
        });
      }
    } catch (err) {
      console.error("Error creating payment intent:", err);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Webhook for Stripe events
  app.post('/api/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const sig = req.headers['stripe-signature'];

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: "Missing Stripe signature or webhook secret" });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message || 'Unknown error'}`);
    }

    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update booking status if bookingId exists in metadata
        if (paymentIntent.metadata?.bookingId) {
          const bookingId = Number(paymentIntent.metadata.bookingId);
          await storage.updateBookingPaymentStatus(bookingId, "paid", paymentIntent.id);
          console.log(`Payment for booking ${bookingId} succeeded`);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        
        // Update booking status if bookingId exists in metadata
        if (failedPaymentIntent.metadata?.bookingId) {
          const bookingId = Number(failedPaymentIntent.metadata.bookingId);
          await storage.updateBookingPaymentStatus(bookingId, "failed", failedPaymentIntent.id);
          console.log(`Payment for booking ${bookingId} failed`);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
