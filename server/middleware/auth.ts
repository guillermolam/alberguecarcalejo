import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

// Middleware to protect admin routes
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  try {
    // In production, this would verify the JWT token from Auth0
    // For now, we'll use a simple check
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Middleware to protect BFF admin routes
export const requireBFFAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check if the request is coming through the BFF
  const bffToken = req.headers['x-bff-token'];
  
  if (!bffToken) {
    return res.status(401).json({ error: 'BFF authentication required' });
  }

  // In production, this would validate the BFF token
  // For now, we'll accept any BFF token
  next();
};