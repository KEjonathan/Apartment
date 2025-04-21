import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/User';

dotenv.config();

// Custom interface to extend Express Request
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: UserRole;
  };
}

// Middleware function to authenticate user using JWT
const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret') as {
      user: { id: string };
    };

    // Add user id from token payload to request object
    req.user = decoded.user;

    // Fetch user from database to get the role
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    // Add user role to request object
    req.user.role = user.role as UserRole;

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default auth; 