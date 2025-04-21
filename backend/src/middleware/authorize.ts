import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';

// Custom interface to extend Express Request
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: UserRole;
  };
}

/**
 * Middleware to check if a user has one of the required roles
 * @param roles Array of allowed roles for the route
 * @returns Middleware function
 */
const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // If no role is specified, deny access
    if (!req.user.role) {
      return res.status(403).json({ msg: 'Access denied - invalid role' });
    }

    // Check if user's role is included in the roles array
    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ msg: 'Access denied - insufficient permissions' });
    }

    next();
  };
};

export default authorize; 