import React from "react";

export default function Privacy() {
  return (
    <div className="static-page">
      <h1>Privacy Policy</h1>

      <p>
        Your privacy is important to us. This Privacy Policy explains how your
        data is collected and used within the Smart Vehicle Maintenance System.
      </p>

      <h3>Information We Collect</h3>
      <ul>
        <li>User registration details (name, email, phone)</li>
        <li>Vehicle and service booking information</li>
        <li>Service history and invoices</li>
      </ul>

      <h3>How We Use Your Data</h3>
      <ul>
        <li>To manage service bookings and job cards</li>
        <li>To generate invoices and service records</li>
        <li>To improve system performance and usability</li>
      </ul>

      <h3>Data Protection</h3>
      <p>
        All user data is securely stored and is not shared with third parties.
        This project follows standard data security practices suitable for
        academic and demonstration purposes.
      </p>
    </div>
  );
}
