import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "mission-control-secret-key-2024";
const JWT_EXPIRES_IN = "7d";

export interface AuthRequest extends Request {
  userId?: number;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(`[SECURITY ALERT] Unauthorized access attempt from ${req.ip} - Missing credentials`);
      return res.status(401).json({ message: "Access denied: Invalid credentials" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log(`[SECURITY ALERT] Invalid token from ${req.ip} - JWT verification failed`);
      return res.status(401).json({ message: "Access denied: Invalid credentials" });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      console.log(`[SECURITY ALERT] Token for non-existent agent ${decoded.userId} from ${req.ip}`);
      return res.status(401).json({ message: "Access denied: Agent credentials revoked" });
    }

    req.userId = decoded.userId;
    console.log(`[SECURITY] Agent ${decoded.userId} authenticated from ${req.ip} at ${new Date().toISOString()}`);
    next();
  } catch (error) {
    console.log(`[SECURITY ERROR] Authentication failure from ${req.ip}:`, error);
    res.status(401).json({ message: "Access denied: Authentication failed" });
  }
}