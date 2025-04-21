import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Apartment, { IApartment } from '../models/Apartment';
import User, { UserRole } from '../models/User';
import { notifySuperAdmins } from '../services/notificationService';
import { NotificationType } from '../models/Notification';
import mongoose from 'mongoose';

// Custom interface to extend Express Request
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: UserRole;
  };
}

// @desc    Get all apartments
// @route   GET /api/apartments
// @access  Public
export const getAllApartments = async (req: Request, res: Response) => {
  try {
    const apartments = await Apartment.find()
      .sort({ createdAt: -1 })
      .populate('owner', 'name email')
      .populate('manager', 'name email')
      .populate('tenants', 'name email');
    
    res.json(apartments);
  } catch (err) {
    console.error('Error fetching apartments:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get apartments managed by current manager
// @route   GET /api/apartments/managed
// @access  Private (Manager only)
export const getManagedApartments = async (req: AuthRequest, res: Response) => {
  try {
    const apartments = await Apartment.find({ manager: req.user?.id })
      .sort({ createdAt: -1 })
      .populate('owner', 'name email')
      .populate('tenants', 'name email');
    
    res.json(apartments);
  } catch (err) {
    console.error('Error fetching managed apartments:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get apartment by ID
// @route   GET /api/apartments/:id
// @access  Public
export const getApartmentById = async (req: Request, res: Response) => {
  try {
    const apartment = await Apartment.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('manager', 'name email')
      .populate('tenants', 'name email');
    
    if (!apartment) {
      return res.status(404).json({ msg: 'Apartment not found' });
    }
    
    res.json(apartment);
  } catch (err) {
    console.error('Error fetching apartment:', err);
    
    // Check if error is due to invalid ID format
    if ((err as any).kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Apartment not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// @desc    Create a new apartment (SuperAdmin only)
// @route   POST /api/apartments
// @access  Private (SuperAdmin only)
export const createApartment = async (req: AuthRequest, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    name,
    address,
    description,
    numberOfRooms,
    price,
    available,
    images,
    amenities,
    managerId // Optional manager assignment
  } = req.body;
  
  try {
    // Create new apartment
    const newApartment = new Apartment({
      name,
      address,
      description,
      numberOfRooms,
      price,
      available,
      owner: req.user?.id,
      ...(managerId && { manager: managerId }),
      images,
      amenities
    });
    
    // Save apartment to database
    const apartment = await newApartment.save();
    
    // If manager is assigned, update their managedApartments array
    if (managerId) {
      await User.findByIdAndUpdate(
        managerId,
        { $push: { managedApartments: apartment._id } }
      );

      // Notify superadmins
      await notifySuperAdmins(
        NotificationType.APARTMENT_CREATED,
        `New apartment '${name}' has been created and assigned to manager ID: ${managerId}`,
        { 
          relatedUser: managerId,
          relatedApartment: apartment._id.toString()
        }
      );
    } else {
      // Notify superadmins
      await notifySuperAdmins(
        NotificationType.APARTMENT_CREATED,
        `New apartment '${name}' has been created without a manager assigned`,
        { relatedApartment: apartment._id.toString() }
      );
    }
    
    res.json(apartment);
  } catch (err) {
    console.error('Error creating apartment:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Assign manager to apartment (SuperAdmin only)
// @route   PUT /api/apartments/:id/assign-manager
// @access  Private (SuperAdmin only)
export const assignManager = async (req: AuthRequest, res: Response) => {
  const { managerId } = req.body;
  
  if (!managerId) {
    return res.status(400).json({ msg: 'Manager ID is required' });
  }
  
  try {
    // Check if manager exists and has the manager role
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== UserRole.MANAGER) {
      return res.status(400).json({ msg: 'Invalid manager ID' });
    }
    
    // Check if apartment exists
    const apartment = await Apartment.findById(req.params.id);
    if (!apartment) {
      return res.status(404).json({ msg: 'Apartment not found' });
    }
    
    // Update apartment with new manager
    apartment.manager = new mongoose.Types.ObjectId(managerId);
    await apartment.save();
    
    // Update manager's managedApartments array
    await User.findByIdAndUpdate(
      managerId,
      { $addToSet: { managedApartments: apartment._id } }
    );
    
    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.APARTMENT_UPDATED,
      `Apartment '${apartment.name}' has been assigned to manager ID: ${managerId}`,
      { 
        relatedUser: managerId,
        relatedApartment: apartment._id.toString()
      }
    );
    
    res.json({ msg: 'Manager assigned successfully', apartment });
  } catch (err) {
    console.error('Error assigning manager:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Add tenant to apartment (Manager only)
// @route   PUT /api/apartments/:id/add-tenant
// @access  Private (Manager only)
export const addTenant = async (req: AuthRequest, res: Response) => {
  const { tenantId } = req.body;
  
  if (!tenantId) {
    return res.status(400).json({ msg: 'Tenant ID is required' });
  }
  
  try {
    // Check if tenant exists and has the tenant role
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== UserRole.TENANT) {
      return res.status(400).json({ msg: 'Invalid tenant ID' });
    }
    
    // Check if apartment exists and is managed by the current manager
    const apartment = await Apartment.findOne({
      _id: req.params.id,
      manager: req.user?.id
    });
    
    if (!apartment) {
      return res.status(404).json({ 
        msg: 'Apartment not found or you do not have permission to manage this apartment' 
      });
    }
    
    // Update apartment with new tenant
    await Apartment.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tenants: tenantId } }
    );
    
    // Update tenant's assignedApartment and assignedManager
    await User.findByIdAndUpdate(
      tenantId,
      { 
        assignedApartment: apartment._id,
        assignedManager: req.user?.id
      }
    );
    
    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.TENANT_ADDED,
      `Tenant ID: ${tenantId} has been added to apartment '${apartment.name}'`,
      { 
        relatedUser: tenantId,
        relatedApartment: apartment._id.toString()
      }
    );
    
    res.json({ msg: 'Tenant added successfully' });
  } catch (err) {
    console.error('Error adding tenant:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Remove tenant from apartment (Manager only)
// @route   PUT /api/apartments/:id/remove-tenant
// @access  Private (Manager only)
export const removeTenant = async (req: AuthRequest, res: Response) => {
  const { tenantId } = req.body;
  
  if (!tenantId) {
    return res.status(400).json({ msg: 'Tenant ID is required' });
  }
  
  try {
    // Check if tenant exists
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return res.status(400).json({ msg: 'Invalid tenant ID' });
    }
    
    // Check if apartment exists and is managed by the current manager
    const apartment = await Apartment.findOne({
      _id: req.params.id,
      manager: req.user?.id
    });
    
    if (!apartment) {
      return res.status(404).json({ 
        msg: 'Apartment not found or you do not have permission to manage this apartment' 
      });
    }
    
    // Update apartment to remove tenant
    await Apartment.findByIdAndUpdate(
      req.params.id,
      { $pull: { tenants: tenantId } }
    );
    
    // Update tenant to clear assignedApartment and assignedManager
    await User.findByIdAndUpdate(
      tenantId,
      { $unset: { assignedApartment: 1, assignedManager: 1 } }
    );
    
    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.TENANT_REMOVED,
      `Tenant ID: ${tenantId} has been removed from apartment '${apartment.name}'`,
      { 
        relatedUser: tenantId,
        relatedApartment: apartment._id.toString()
      }
    );
    
    res.json({ msg: 'Tenant removed successfully' });
  } catch (err) {
    console.error('Error removing tenant:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Update an apartment (SuperAdmin only)
// @route   PUT /api/apartments/:id
// @access  Private (SuperAdmin only)
export const updateApartment = async (req: AuthRequest, res: Response) => {
  try {
    let apartment = await Apartment.findById(req.params.id);
    
    if (!apartment) {
      return res.status(404).json({ msg: 'Apartment not found' });
    }
    
    // Build update object with only provided fields
    const updateFields: { [key: string]: any } = {};
    
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined && key !== 'manager' && key !== 'tenants') {
        updateFields[key] = value;
      }
    }
    
    // Update apartment
    apartment = await Apartment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.APARTMENT_UPDATED,
      `Apartment '${apartment!.name}' has been updated`,
      { relatedApartment: apartment!._id.toString() }
    );
    
    res.json(apartment);
  } catch (err) {
    console.error('Error updating apartment:', err);
    
    // Check if error is due to invalid ID format
    if ((err as any).kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Apartment not found' });
    }
    
    res.status(500).send('Server error');
  }
};

// @desc    Delete an apartment (SuperAdmin only)
// @route   DELETE /api/apartments/:id
// @access  Private (SuperAdmin only)
export const deleteApartment = async (req: AuthRequest, res: Response) => {
  try {
    const apartment = await Apartment.findById(req.params.id);
    
    if (!apartment) {
      return res.status(404).json({ msg: 'Apartment not found' });
    }
    
    // First, if there's a manager assigned, update the manager's managedApartments
    if (apartment.manager) {
      await User.findByIdAndUpdate(
        apartment.manager,
        { $pull: { managedApartments: apartment._id } }
      );
    }
    
    // If there are tenants, update each tenant
    if (apartment.tenants && apartment.tenants.length > 0) {
      await User.updateMany(
        { _id: { $in: apartment.tenants } },
        { $unset: { assignedApartment: 1 } }
      );
    }
    
    // Now delete the apartment
    await apartment.deleteOne();
    
    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.APARTMENT_UPDATED,
      `Apartment '${apartment.name}' has been deleted`,
      { relatedApartment: apartment._id.toString() }
    );
    
    res.json({ msg: 'Apartment removed' });
  } catch (err) {
    console.error('Error deleting apartment:', err);
    
    // Check if error is due to invalid ID format
    if ((err as any).kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Apartment not found' });
    }
    
    res.status(500).send('Server error');
  }
}; 