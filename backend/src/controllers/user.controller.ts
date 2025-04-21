import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/User';
import { notifySuperAdmins } from '../services/notificationService';
import { NotificationType } from '../models/Notification';

// Custom interface to extend Express Request
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: UserRole;
  };
}

// @desc    Register a user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Create new user (default role is tenant)
    user = new User({
      name,
      email,
      password,
      role: UserRole.TENANT // Default role
    });

    // Save user to database
    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // Sign JWT token
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Login user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // Sign JWT token
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, role: user.role });
      }
    );
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    // Find user by ID excluding password
    const user = await User.findById(req.user?.id)
      .select('-password')
      .populate('managedApartments', 'name address')
      .populate('assignedApartment', 'name address')
      .populate('assignedManager', 'name email');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error getting current user:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Create a new manager (by superadmin)
// @route   POST /api/users/managers
// @access  Private (SuperAdmin only)
export const createManager = async (req: AuthRequest, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Create new manager
    user = new User({
      name,
      email,
      password,
      role: UserRole.MANAGER
    });

    // Save manager to database
    await user.save();

    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.USER_CREATED,
      `New manager ${name} (${email}) has been created`,
      { relatedUser: user._id.toString() }
    );

    res.json({ msg: 'Manager created successfully', user: { id: user.id, name, email, role: user.role } });
  } catch (err) {
    console.error('Error creating manager:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Create a new tenant (by manager)
// @route   POST /api/users/tenants
// @access  Private (Manager only)
export const createTenant = async (req: AuthRequest, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, apartmentId } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Create new tenant
    user = new User({
      name,
      email,
      password,
      role: UserRole.TENANT,
      assignedManager: req.user?.id,
      assignedApartment: apartmentId
    });

    // Save tenant to database
    await user.save();

    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.TENANT_ADDED,
      `New tenant ${name} (${email}) has been added to apartment ID: ${apartmentId}`,
      { 
        relatedUser: user._id.toString(),
        relatedApartment: apartmentId
      }
    );

    res.json({ 
      msg: 'Tenant created successfully', 
      user: { 
        id: user.id, 
        name, 
        email, 
        role: user.role,
        assignedManager: req.user?.id,
        assignedApartment: apartmentId
      } 
    });
  } catch (err) {
    console.error('Error creating tenant:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get all managers
// @route   GET /api/users/managers
// @access  Private (SuperAdmin only)
export const getAllManagers = async (req: Request, res: Response) => {
  try {
    const managers = await User.find({ role: UserRole.MANAGER })
      .select('-password')
      .populate('managedApartments', 'name address');
    
    res.json(managers);
  } catch (err) {
    console.error('Error fetching managers:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get all tenants (by manager)
// @route   GET /api/users/tenants
// @access  Private (Manager only)
export const getManagerTenants = async (req: AuthRequest, res: Response) => {
  try {
    const tenants = await User.find({ 
      role: UserRole.TENANT,
      assignedManager: req.user?.id
    })
      .select('-password')
      .populate('assignedApartment', 'name address');
    
    res.json(tenants);
  } catch (err) {
    console.error('Error fetching tenants:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get all tenants (by superadmin)
// @route   GET /api/users/all-tenants
// @access  Private (SuperAdmin only)
export const getAllTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await User.find({ role: UserRole.TENANT })
      .select('-password')
      .populate('assignedApartment', 'name address')
      .populate('assignedManager', 'name email');
    
    res.json(tenants);
  } catch (err) {
    console.error('Error fetching all tenants:', err);
    res.status(500).send('Server error');
  }
}; 