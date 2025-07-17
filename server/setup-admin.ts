import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { z } from "zod";

const adminSetupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  email: z.string().email("Invalid email address").optional(),
});

export async function setupAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername("admin");
    
    if (existingAdmin) {
      // Check if it's still using default password
      const isDefaultPassword = await bcrypt.compare("admin123", existingAdmin.password);
      
      if (isDefaultPassword) {
        console.warn("⚠️  WARNING: Admin account is using default password 'admin123'");
        console.warn("⚠️  This is a security risk! Please change it immediately.");
        console.warn("⚠️  You can change it through the admin dashboard or by setting environment variables:");
        console.warn("⚠️  ADMIN_USERNAME=your_username ADMIN_PASSWORD=your_secure_password");
        return false;
      }
    } else {
      // Create admin user from environment variables or use defaults
      const username = process.env.ADMIN_USERNAME || "admin";
      const password = process.env.ADMIN_PASSWORD || "admin123";
      const email = process.env.ADMIN_EMAIL || "admin@example.com";
      
      // Validate admin credentials
      const validatedData = adminSetupSchema.parse({ username, password, email });
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create admin user
      await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
        email: validatedData.email,
        isAdmin: true,
      });
      
      if (password === "admin123") {
        console.warn("⚠️  WARNING: Admin account created with default password 'admin123'");
        console.warn("⚠️  Please change this password immediately for security!");
      } else {
        console.log("✅ Admin account created successfully");
      }
    }
    
    return true;
  } catch (error) {
    console.error("Failed to setup admin account:", error);
    return false;
  }
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}