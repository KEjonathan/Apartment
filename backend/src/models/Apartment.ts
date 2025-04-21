import mongoose, { Schema, Document } from 'mongoose';

export interface IApartment extends Document {
  name: string;
  address: string;
  description?: string;
  numberOfRooms: number;
  price: number;
  available: boolean;
  owner: mongoose.Types.ObjectId;  // Owner is the SuperAdmin
  manager?: mongoose.Types.ObjectId; // Reference to the manager
  tenants?: mongoose.Types.ObjectId[]; // Reference to tenants
  images?: string[];
  amenities?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ApartmentSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name for the apartment'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide an address'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    numberOfRooms: {
      type: Number,
      required: [true, 'Please specify the number of rooms'],
      min: [1, 'Must have at least 1 room'],
    },
    price: {
      type: Number,
      required: [true, 'Please specify the price'],
      min: [0, 'Price cannot be negative'],
    },
    available: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the owner'],
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tenants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    images: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for searching
ApartmentSchema.index({ name: 'text', description: 'text', address: 'text' });

export default mongoose.model<IApartment>('Apartment', ApartmentSchema); 