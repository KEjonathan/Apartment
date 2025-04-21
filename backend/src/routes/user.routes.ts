import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller';
import auth from '../middleware/auth';
import authorize from '../middleware/authorize';
import { UserRole } from '../models/User';

const router = express.Router();

// @route   POST api/users/register
// @desc    Register a user
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  userController.registerUser
);

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
  userController.loginUser
);

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, userController.getCurrentUser);

// @route   POST api/users/managers
// @desc    Create a new manager (SuperAdmin only)
// @access  Private
router.post(
  '/managers',
  [
    auth,
    authorize([UserRole.SUPERADMIN]),
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  userController.createManager
);

// @route   POST api/users/tenants
// @desc    Create a new tenant (Manager only)
// @access  Private
router.post(
  '/tenants',
  [
    auth,
    authorize([UserRole.MANAGER]),
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('apartmentId', 'Apartment ID is required').not().isEmpty(),
  ],
  userController.createTenant
);

// @route   GET api/users/managers
// @desc    Get all managers (SuperAdmin only)
// @access  Private
router.get(
  '/managers',
  [auth, authorize([UserRole.SUPERADMIN])],
  userController.getAllManagers
);

// @route   GET api/users/tenants
// @desc    Get manager's tenants (Manager only)
// @access  Private
router.get(
  '/tenants',
  [auth, authorize([UserRole.MANAGER])],
  userController.getManagerTenants
);

// @route   GET api/users/all-tenants
// @desc    Get all tenants (SuperAdmin only)
// @access  Private
router.get(
  '/all-tenants',
  [auth, authorize([UserRole.SUPERADMIN])],
  userController.getAllTenants
);

export default router; 