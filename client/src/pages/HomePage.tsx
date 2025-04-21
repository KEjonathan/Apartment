import React from 'react';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Apartment Management System</h1>
          <p>Manage your apartments with ease</p>
        </div>
      </section>
      
      <section className="features">
        <div className="feature">
          <h3>Easy Management</h3>
          <p>Simplify your apartment management process</p>
        </div>
        <div className="feature">
          <h3>Tenant Portal</h3>
          <p>Provide a seamless experience for your tenants</p>
        </div>
        <div className="feature">
          <h3>Financial Tracking</h3>
          <p>Keep track of rent payments and expenses</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 