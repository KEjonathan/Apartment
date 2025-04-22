# Apartment Management System

A comprehensive full-stack application for managing apartments, tenants, and maintenance requests. Built with React, Node.js, Express, TypeScript, and MongoDB.

## Features

- **User Role Management**: Support for Super Admin, Property Managers, and Tenants
- **Property Management**: Add, update, and manage apartment properties
- **Tenant Portal**: Allow tenants to submit maintenance requests and pay rent
- **Financial Tracking**: Track rent payments and maintenance expenses
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React.js with TypeScript
- React Router for navigation
- CSS for styling

### Backend
- Node.js with Express
- TypeScript
- MongoDB for database
- JWT for authentication
- Express Validator for request validation

## Project Structure

- `client/`: React frontend application
- `backend/`: Node.js backend API
- `docker-compose.yml`: Docker configuration (optional)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (local installation or MongoDB Atlas account)

### Local Development Setup

#### Setting up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   The backend uses a `.env` file for configuration. A sample is already provided with the following settings:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/apartment
   JWT_SECRET=3273ea7f155e2853cd3c6c9b0d12e6acf815029cb82a3c6b96963c93d5d86a42
   JWT_EXPIRES_IN=30d
   
   # SuperAdmin credentials
   SUPERADMIN_EMAIL=admin@apartmentmanager.com
   SUPERADMIN_PASSWORD=Admin@123
   ```
   
   Make sure your MongoDB is running locally on port 27017 or modify the connection string as needed.

4. Run the development server:
   ```bash
   npm run dev
   ```
   
   The backend API will be available at http://localhost:5000
   
5. To check if the server is running properly, visit:
   ```
   http://localhost:5000/health
   ```
   It should show the server and database status.

#### Setting up the Frontend

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   
   The frontend will be available at http://localhost:3000

### Database Setup

The application uses MongoDB. You have two options:

1. **Local MongoDB**: Install MongoDB Community Edition on your machine
   - Windows: https://www.mongodb.com/try/download/community
   - Mac (with Homebrew): `brew install mongodb-community`
   - Start the MongoDB service after installation

2. **MongoDB Atlas (Cloud)**:
   - Create a free account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster
   - Configure network access to allow your IP
   - Create a database user
   - Get your connection string and update the MONGODB_URI in the backend/.env file

### Login Information

After starting the application, you can log in with the pre-configured Super Admin account:
- Email: admin@apartmentmanager.com
- Password: Admin@123

## Docker Setup (Optional)

If you prefer using Docker:

1. Make sure Docker and Docker Compose are installed
2. Uncomment the `mongodb://mongodb:27017/apartment` line in the backend/.env file
3. Comment out the `mongodb://localhost:27017/apartment` line
4. Run `docker-compose up` to start all services
5. The application will be available at the same ports as in local development

## API Documentation

The backend API provides endpoints for:
- User authentication (login/register)
- Apartment management
- Tenant management
- Maintenance requests
- Rent payment tracking

Visit `/api` routes to access these endpoints.

## Troubleshooting

- **MongoDB Connection Issues**: Make sure MongoDB is running locally or your Atlas connection string is correct
- **TypeScript Build Errors**: Run `npm run build` in the backend directory to check for compilation errors
- **JWT Errors**: Ensure the JWT_SECRET is properly set in the .env file

## License

This project is licensed under the MIT License. 