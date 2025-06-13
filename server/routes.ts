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
  insertDumpsterPricingSchema,
  insertHubSchema,
  insertAdditionalChargeSchema
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

  // Get all dumpster pricing options
  app.get("/api/dumpster-pricing/all", async (_req, res) => {
    try {
      const allPricing = await storage.getAllDumpsterPricing();
      res.json(allPricing);
    } catch (error) {
      console.error("Error fetching all dumpster pricing:", error);
      res.status(500).json({ message: "Failed to fetch all dumpster pricing" });
    }
  });

  // Dumpster pricing routes
  app.get("/api/dumpster-pricing/:dumpsterId", async (req, res) => {
    try {
      const dumpsterId = parseInt(req.params.dumpsterId);
      if (isNaN(dumpsterId)) {
        return res.status(400).json({ message: "Invalid dumpster ID" });
      }
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

  // Helper function to check if a point is inside a polygon
  const isPointInPolygon = (lat: number, lng: number, polygon: { lat: number; lng: number }[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      
      if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Check service zone by coordinates (for geofenced zones)
  app.get("/api/zones/coordinates/:lat/:lng", async (req, res) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lng = parseFloat(req.params.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      const zones = await storage.listServiceZones();
      
      // Check geofenced zones first
      for (const zone of zones) {
        if (zone.useGeofencing && zone.polygonPath) {
          try {
            const polygon = JSON.parse(zone.polygonPath);
            if (Array.isArray(polygon) && isPointInPolygon(lat, lng, polygon)) {
              return res.json(zone);
            }
          } catch (error) {
            console.error("Error parsing polygon path for zone", zone.id, error);
          }
        }
      }
      
      return res.status(404).json({ message: "No service zone found for these coordinates" });
    } catch (err) {
      console.error("Error fetching service zone by coordinates:", err);
      res.status(500).json({ message: "Failed to fetch service zone by coordinates" });
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

  // Enhanced service zone lookup that checks both ZIP codes and coordinates
  app.post("/api/zones/lookup", async (req, res) => {
    try {
      const { zipCode, address, city } = req.body;
      
      // First try ZIP code lookup
      if (zipCode) {
        const zipZone = await storage.getServiceZoneByZipCode(zipCode);
        if (zipZone) {
          return res.json(zipZone);
        }
      }
      
      // If ZIP code lookup fails and we have address info, try geocoding + polygon check
      if (address && city) {
        // Use Google Maps Geocoding API to get coordinates
        const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          return res.status(404).json({ message: "No service zone found and geocoding unavailable" });
        }
        
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', ' + city)}&key=${apiKey}`;
        
        try {
          const geocodeResponse = await fetch(geocodeUrl);
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
            const location = geocodeData.results[0].geometry.location;
            const lat = location.lat;
            const lng = location.lng;
            
            // Check geofenced zones - only for zones without ZIP codes defined
            const zones = await storage.listServiceZones();
            for (const zone of zones) {
              // Only check custom boundaries for zones that don't have ZIP codes defined
              if (zone.useGeofencing && zone.polygonPath && (!zone.zipCodes || zone.zipCodes.trim() === '')) {
                try {
                  const polygon = JSON.parse(zone.polygonPath);
                  if (Array.isArray(polygon) && isPointInPolygon(lat, lng, polygon)) {
                    console.log(`Address lookup: coordinates (${lat}, ${lng}) found within custom boundary zone: ${zone.name}`);
                    return res.json(zone);
                  }
                } catch (error) {
                  console.error("Error parsing polygon path for zone", zone.id, error);
                }
              }
            }
          }
        } catch (geocodeError) {
          console.error("Geocoding error:", geocodeError);
        }
      }
      
      return res.status(404).json({ message: "No service zone found for this location" });
    } catch (err) {
      console.error("Error in zone lookup:", err);
      res.status(500).json({ message: "Failed to lookup service zone" });
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
      
      // Don't modify polygon data - preserve it regardless of useGeofencing state
      // The frontend will decide which data to use based on the useGeofencing flag
      
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

  // Hub management routes
  app.get("/api/hubs", async (_req, res) => {
    try {
      const hubs = await storage.listHubs();
      res.json(hubs);
    } catch (err) {
      console.error("Error fetching hubs:", err);
      res.status(500).json({ message: "Failed to fetch hubs" });
    }
  });

  app.post("/api/hubs", isAdmin, async (req, res) => {
    try {
      const validatedData = insertHubSchema.parse(req.body);
      
      // If this is being set as main hub, unset other main hubs first
      if (validatedData.isMainHub) {
        await storage.unsetMainHub();
      }
      
      const hub = await storage.createHub(validatedData);
      res.status(201).json(hub);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid hub data", errors: err.errors });
      }
      console.error("Error creating hub:", err);
      res.status(500).json({ message: "Failed to create hub" });
    }
  });

  app.put("/api/hubs/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertHubSchema.parse(req.body);
      
      // If this is being set as main hub, unset other main hubs first
      if (validatedData.isMainHub) {
        await storage.unsetMainHub();
      }
      
      const hub = await storage.updateHub(id, validatedData);
      if (!hub) {
        return res.status(404).json({ message: "Hub not found" });
      }
      res.json(hub);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid hub data", errors: err.errors });
      }
      console.error("Error updating hub:", err);
      res.status(500).json({ message: "Failed to update hub" });
    }
  });

  app.delete("/api/hubs/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const hub = await storage.getHub(id);
      if (!hub) {
        return res.status(404).json({ message: "Hub not found" });
      }
      
      await storage.deleteHub(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting hub:", err);
      res.status(500).json({ message: "Failed to delete hub" });
    }
  });

  app.post("/api/hubs/:id/set-main", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Unset all other main hubs first
      await storage.unsetMainHub();
      
      // Set this hub as main
      const hub = await storage.updateHub(id, { isMainHub: true });
      if (!hub) {
        return res.status(404).json({ message: "Hub not found" });
      }
      res.json(hub);
    } catch (err) {
      console.error("Error setting main hub:", err);
      res.status(500).json({ message: "Failed to set main hub" });
    }
  });

  // Geocode hub address
  app.post("/api/hubs/geocode", isAdmin, async (req, res) => {
    try {
      const { address, city, state, zipCode } = req.body;
      const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
      
      const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Geocoding service unavailable" });
      }
      
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
        const location = geocodeData.results[0].geometry.location;
        res.json({ lat: location.lat, lng: location.lng });
      } else {
        res.status(400).json({ message: "Could not geocode address" });
      }
    } catch (err) {
      console.error("Error geocoding address:", err);
      res.status(500).json({ message: "Failed to geocode address" });
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

      // Get service zone using enhanced lookup with proper priority
      let zone = null;
      
      // First try ZIP code lookup (highest priority when ZIP codes are defined)
      if (deliveryZipCode) {
        zone = await storage.getServiceZoneByZipCode(deliveryZipCode);
        if (zone) {
          console.log(`Found ZIP code zone for ${deliveryZipCode}: ${zone.name}`);
          // If zone has ZIP codes defined, accept it regardless of boundaries
          if (zone.zipCodes && zone.zipCodes.trim() !== '') {
            console.log(`ZIP code zone takes priority - accepting delivery for ${deliveryZipCode}`);
          }
        }
      }
      
      // If no ZIP code zone found, check custom boundary zones
      if (!zone && deliveryAddress && deliveryCity) {
        const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(deliveryAddress + ', ' + deliveryCity)}&key=${apiKey}`;
          
          try {
            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();
            
            if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
              const location = geocodeData.results[0].geometry.location;
              const lat = location.lat;
              const lng = location.lng;
              
              // Check geofenced zones - only for zones without ZIP codes
              const zones = await storage.listServiceZones();
              for (const checkZone of zones) {
                // Only check custom boundaries for zones that don't have ZIP codes defined
                if (checkZone.useGeofencing && checkZone.polygonPath && (!checkZone.zipCodes || checkZone.zipCodes.trim() === '')) {
                  try {
                    const polygon = JSON.parse(checkZone.polygonPath);
                    if (Array.isArray(polygon) && isPointInPolygon(lat, lng, polygon)) {
                      console.log(`Address at (${lat}, ${lng}) is within custom boundary zone: ${checkZone.name}`);
                      zone = checkZone;
                      break;
                    }
                  } catch (error) {
                    console.error("Error parsing polygon path for zone", checkZone.id, error);
                  }
                }
              }
            }
          } catch (geocodeError) {
            console.error("Geocoding error during price calculation:", geocodeError);
          }
        }
      }
      
      if (!zone) {
        return res.status(404).json({ message: "Service not available in this location" });
      }

      // Calculate initial total price using only the rental duration price
      let totalPrice = duration.additionalPrice;
      
      // Use the flat delivery fee set in the admin dashboard
      console.log('Using flat delivery fee from zone:', zone.deliveryFee);
      let deliveryFee = zone.deliveryFee;
      
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

      // Return pricing details
      res.json({ 
        totalPrice,
        rentalPrice: duration.additionalPrice,
        deliveryFee
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

  // Additional charges routes
  app.get("/api/bookings/:id/additional-charges", isAdmin, async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      const charges = await storage.getAdditionalCharges(bookingId);

      res.json(charges);
    } catch (err) {
      console.error("Error fetching additional charges:", err);
      res.status(500).json({ message: "Failed to fetch additional charges" });
    }
  });

  app.post("/api/bookings/:id/additional-charges", isAdmin, async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const validatedData = insertAdditionalChargeSchema.parse({
        ...req.body,
        bookingId,
        createdBy: userId,
      });

      const charge = await storage.createAdditionalCharge(validatedData);
      res.status(201).json(charge);
    } catch (err) {
      console.error("Error creating additional charge:", err);
      res.status(500).json({ message: "Failed to create additional charge" });
    }
  });

  app.put("/api/additional-charges/:id", isAdmin, async (req, res) => {
    try {
      const chargeId = Number(req.params.id);
      const { description, amount } = req.body;

      const charge = await storage.updateAdditionalCharge(chargeId, { description, amount });
      if (!charge) {
        return res.status(404).json({ message: "Additional charge not found" });
      }
      res.json(charge);
    } catch (err) {
      console.error("Error updating additional charge:", err);
      res.status(500).json({ message: "Failed to update additional charge" });
    }
  });

  app.delete("/api/additional-charges/:id", isAdmin, async (req, res) => {
    try {
      const chargeId = Number(req.params.id);
      const success = await storage.deleteAdditionalCharge(chargeId);
      if (!success) {
        return res.status(404).json({ message: "Additional charge not found" });
      }
      res.json({ message: "Additional charge deleted successfully" });
    } catch (err) {
      console.error("Error deleting additional charge:", err);
      res.status(500).json({ message: "Failed to delete additional charge" });
    }
  });

  // Payment link routes
  app.post("/api/bookings/:id/payment-link", isAdmin, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const bookingId = Number(req.params.id);
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get additional charges for this booking
      const additionalCharges = await storage.getAdditionalCharges(bookingId);
      const unpaidCharges = additionalCharges.filter(charge => !charge.isPaid);
      
      if (unpaidCharges.length === 0) {
        return res.status(400).json({ message: "No unpaid charges found" });
      }

      const totalAmount = unpaidCharges.reduce((sum, charge) => sum + charge.amount, 0);

      // Create Stripe products and prices first, then payment link
      const lineItems = [];
      
      for (const charge of unpaidCharges) {
        const product = await stripe.products.create({
          name: `Additional Charge: ${charge.description}`,
          metadata: {
            booking_id: bookingId.toString(),
            charge_id: charge.id.toString(),
          }
        });
        
        const price = await stripe.prices.create({
          currency: 'usd',
          unit_amount: charge.amount,
          product: product.id,
        });
        
        lineItems.push({
          price: price.id,
          quantity: 1,
        });
      }

      // Create Stripe payment link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: lineItems,
        metadata: {
          booking_id: bookingId.toString(),
          customer_name: booking.customerName,
          customer_email: booking.customerEmail,
        },
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${req.protocol}://${req.get('host')}/payment-success?booking=${bookingId}`,
          },
        },
        automatic_tax: { enabled: false },
        billing_address_collection: 'auto',
        shipping_address_collection: {
          allowed_countries: ['US'],
        },
      });

      // Store payment link in database
      const paymentLinkRecord = await storage.createPaymentLink({
        bookingId,
        stripePaymentLinkId: paymentLink.id,
        totalAmount,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });

      res.json({
        paymentLink: paymentLink.url,
        paymentLinkId: paymentLinkRecord.id,
        totalAmount,
        unpaidCharges,
      });
    } catch (err) {
      console.error("Error creating payment link:", err);
      res.status(500).json({ message: "Failed to create payment link" });
    }
  });

  app.get("/api/bookings/:id/payment-links", isAdmin, async (req, res) => {
    try {
      const bookingId = Number(req.params.id);
      const paymentLinks = await storage.getPaymentLinks(bookingId);

      res.json(paymentLinks);
    } catch (err) {
      console.error("Error fetching payment links:", err);
      res.status(500).json({ message: "Failed to fetch payment links" });
    }
  });

  // Send payment link via email/SMS
  app.post("/api/payment-links/:id/send", isAdmin, async (req, res) => {
    try {
      const paymentLinkId = Number(req.params.id);
      const { method, recipient } = req.body; // method: 'email' or 'sms', recipient: email or phone

      const paymentLinkRecord = await storage.getPaymentLink(paymentLinkId);
      if (!paymentLinkRecord) {
        return res.status(404).json({ message: "Payment link not found" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      // Get the actual Stripe payment link
      const stripePaymentLink = await stripe.paymentLinks.retrieve(paymentLinkRecord.stripePaymentLinkId);
      const booking = await storage.getBooking(paymentLinkRecord.bookingId);

      if (method === 'email') {
        // In a production environment, you would integrate with an email service
        // For now, we'll return the email content that should be sent
        const emailContent = {
          to: recipient,
          subject: `Payment Required - Additional Charges for Booking #${booking?.id}`,
          html: `
            <h2>Payment Required</h2>
            <p>Dear ${booking?.customerName},</p>
            <p>Additional charges have been added to your dumpster rental booking #${booking?.id}.</p>
            <p><strong>Total Amount Due:</strong> $${(paymentLinkRecord.totalAmount / 100).toFixed(2)}</p>
            <p>Please click the link below to complete your payment:</p>
            <a href="${stripePaymentLink.url}" style="background: #f7c948; color: black; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Pay Now</a>
            <p>This payment link will expire in 24 hours.</p>
            <p>Thank you for your business!</p>
          `,
          text: `Payment Required - Additional charges for booking #${booking?.id}. Amount due: $${(paymentLinkRecord.totalAmount / 100).toFixed(2)}. Pay now: ${stripePaymentLink.url}`
        };

        res.json({ 
          message: "Email content generated", 
          emailContent,
          note: "Integrate with email service to actually send"
        });
      } else if (method === 'sms') {
        // In a production environment, you would integrate with Twilio or similar SMS service
        const smsContent = `Payment required for dumpster rental booking #${booking?.id}. Amount due: $${(paymentLinkRecord.totalAmount / 100).toFixed(2)}. Pay now: ${stripePaymentLink.url}`;
        
        res.json({ 
          message: "SMS content generated", 
          smsContent,
          to: recipient,
          note: "Integrate with SMS service to actually send"
        });
      } else {
        res.status(400).json({ message: "Invalid method. Use 'email' or 'sms'" });
      }
    } catch (err) {
      console.error("Error sending payment link:", err);
      res.status(500).json({ message: "Failed to send payment link" });
    }
  });

  // Get payment link details for QR code page
  app.get("/api/payment-links/:id", async (req, res) => {
    try {
      const paymentLinkId = Number(req.params.id);
      const paymentLink = await storage.getPaymentLink(paymentLinkId);
      
      if (!paymentLink) {
        return res.status(404).json({ message: "Payment link not found" });
      }
      
      res.json(paymentLink);
    } catch (err) {
      console.error("Error fetching payment link:", err);
      res.status(500).json({ message: "Failed to fetch payment link" });
    }
  });

  // Get Stripe payment URL for a payment link
  app.get("/api/payment-links/:id/stripe-url", async (req, res) => {
    try {
      const paymentLinkId = Number(req.params.id);
      const paymentLink = await storage.getPaymentLink(paymentLinkId);
      
      if (!paymentLink) {
        return res.status(404).json({ message: "Payment link not found" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      // Get the Stripe payment link URL
      const stripePaymentLink = await stripe.paymentLinks.retrieve(paymentLink.stripePaymentLinkId);
      
      res.json({ url: stripePaymentLink.url });
    } catch (err) {
      console.error("Error fetching Stripe payment URL:", err);
      res.status(500).json({ message: "Failed to get payment URL" });
    }
  });

  // Stripe webhook to handle payment completion
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      
      if (!stripe || !sig) {
        return res.status(400).send('Missing signature');
      }

      // In production, you would verify the webhook signature here
      // For development, we'll process the event directly
      const event = req.body;

      console.log('Stripe webhook event:', event.type);

      // Handle the event
      switch (event.type) {
        case 'payment_link.paid':
          const paymentLinkEvent = event.data.object;
          
          // Find our payment link by Stripe payment link ID
          const paymentLinks = await storage.getPaymentLinks(0); // Get all payment links
          const ourPaymentLink = paymentLinks.find(link => 
            link.stripePaymentLinkId === paymentLinkEvent.id
          );
          
          if (ourPaymentLink) {
            // Update payment link status to paid
            await storage.updatePaymentLinkStatus(ourPaymentLink.id, 'paid', new Date());
            
            // Mark all associated additional charges as paid
            const charges = await storage.getAdditionalCharges(ourPaymentLink.bookingId);
            for (const charge of charges) {
              if (!charge.isPaid) {
                await storage.updateAdditionalCharge(charge.id, { isPaid: true });
              }
            }
            
            console.log(`Payment completed for booking ${ourPaymentLink.bookingId}`);
          }
          break;
          
        case 'checkout.session.completed':
          // Handle regular booking payments
          const session = event.data.object;
          if (session.metadata && session.metadata.booking_id) {
            const bookingId = parseInt(session.metadata.booking_id);
            await storage.updateBookingPaymentStatus(
              bookingId, 
              'paid', 
              session.payment_intent
            );
            console.log(`Booking payment completed for booking ${bookingId}`);
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  });

  // Manual payment status check endpoint (for testing/debugging)
  app.post("/api/payment-links/:id/check-status", async (req, res) => {
    try {
      const paymentLinkId = Number(req.params.id);
      const paymentLink = await storage.getPaymentLink(paymentLinkId);
      
      if (!paymentLink || !stripe) {
        return res.status(404).json({ message: "Payment link not found" });
      }

      // Check Stripe payment link status
      const stripePaymentLink = await stripe.paymentLinks.retrieve(paymentLink.stripePaymentLinkId);
      
      // If it's been paid in Stripe but not in our system, update it
      if (stripePaymentLink.metadata && paymentLink.status !== 'paid') {
        // Check if there are any successful payment sessions for this payment link
        const sessions = await stripe.checkout.sessions.list({
          payment_link: paymentLink.stripePaymentLinkId,
          limit: 10,
        });
        
        const paidSession = sessions.data.find(session => session.payment_status === 'paid');
        
        if (paidSession) {
          // Update our records
          await storage.updatePaymentLinkStatus(paymentLink.id, 'paid', new Date());
          
          // Mark charges as paid
          const charges = await storage.getAdditionalCharges(paymentLink.bookingId);
          for (const charge of charges) {
            if (!charge.isPaid) {
              await storage.updateAdditionalCharge(charge.id, { isPaid: true });
            }
          }
          
          res.json({ message: "Payment status updated to paid", updated: true });
        } else {
          res.json({ message: "Payment still pending", updated: false });
        }
      } else {
        res.json({ message: "Payment status is current", updated: false });
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  // Delete payment link
  app.delete("/api/payment-links/:id", isAdmin, async (req, res) => {
    try {
      const paymentLinkId = Number(req.params.id);
      const paymentLink = await storage.getPaymentLink(paymentLinkId);
      
      if (!paymentLink) {
        return res.status(404).json({ message: "Payment link not found" });
      }

      // Don't allow deletion of paid payment links
      if (paymentLink.status === 'paid') {
        return res.status(400).json({ message: "Cannot delete a paid payment link" });
      }

      // Delete from Stripe first (if possible)
      if (stripe) {
        try {
          // Note: Stripe doesn't allow deleting payment links, but we can mark them as inactive
          // For now, we'll just delete from our database
        } catch (stripeError) {
          console.warn("Could not update Stripe payment link:", stripeError);
        }
      }

      // Delete from our database
      const success = await storage.deletePaymentLink(paymentLinkId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete payment link" });
      }

      res.json({ message: "Payment link deleted successfully" });
    } catch (err) {
      console.error("Error deleting payment link:", err);
      res.status(500).json({ message: "Failed to delete payment link" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
