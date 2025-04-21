import express from 'express';
import { body } from 'express-validator';
import * as apartmentController from '../controllers/apartment.controller';
import auth from '../middleware/auth';
import authorize from '../middleware/authorize';
import { UserRole } from '../models/User';

const router = express.Router();

// @route   GET api/apartments
// @desc    Get all apartments
// @access  Public
router.get('/', apartmentController.getAllApartments);

// @route   GET api/apartments/managed
// @desc    Get apartments managed by current manager
// @access  Private (Manager only)
router.get(
  '/managed',
  [auth, authorize([UserRole.MANAGER])],
  apartmentController.getManagedApartments
);

// @route   GET api/apartments/:id
// @desc    Get apartment by ID
// @access  Public
router.get('/:id', apartmentController.getApartmentById);

// @route   POST api/apartments
// @desc    Create a new apartment (SuperAdmin only)
// @access  Private
router.post(
  '/',
  [
    auth,
    authorize([UserRole.SUPERADMIN]),
    body('name', 'Name is required').not().isEmpty(),
    body('address', 'Address is required').not().isEmpty(),
    body('numberOfRooms', 'Number of rooms is required').isNumeric(),
    body('price', 'Price is required and must be a number').isNumeric(),
  ],
  apartmentController.createApartment
);

// @route   PUT api/apartments/:id/assign-manager
// @desc    Assign manager to apartment (SuperAdmin only)
// @access  Private
router.put(
  '/:id/assign-manager',
  [
    auth,
    authorize([UserRole.SUPERADMIN]),
    body('managerId', 'Manager ID is required').not().isEmpty()
  ],
  apartmentController.assignManager
);

// @route   PUT api/apartments/:id/add-tenant
// @desc    Add tenant to apartment (Manager only)
// @access  Private
router.put(
  '/:id/add-tenant',
  [
    auth,
    authorize([UserRole.MANAGER]),
    body('tenantId', 'Tenant ID is required').not().isEmpty()
  ],
  apartmentController.addTenant
);

// @route   PUT api/apartments/:id/remove-tenant
// @desc    Remove tenant from apartment (Manager only)
// @access  Private
router.put(
  '/:id/remove-tenant',
  [
    auth,
    authorize([UserRole.MANAGER]),
    body('tenantId', 'Tenant ID is required').not().isEmpty()
  ],
  apartmentController.removeTenant
);

// @route   PUT api/apartments/:id
// @desc    Update an apartment (SuperAdmin only)
// @access  Private
router.put(
  '/:id',
  [auth, authorize([UserRole.SUPERADMIN])],
  apartmentController.updateApartment
);

// @route   DELETE api/apartments/:id
// @desc    Delete an apartment (SuperAdmin only)
// @access  Private
router.delete(
  '/:id',
  [auth, authorize([UserRole.SUPERADMIN])],
  apartmentController.deleteApartment
);

export default router; 