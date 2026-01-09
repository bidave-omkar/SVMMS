// src/index.js
import React from "react";
import ReactDOM from "react-dom/client"; // react 18 entry
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Register from "./pages/Register";
import Login from "./pages/Login";
import "./index.css"; 
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Bookings from "./pages/Bookings";
import MyVehicle from "./pages/MyVehicle";
import ServiceCenterDashboard from "./pages/ServiceCenterDashboard";
import ServiceCenterBookings from "./pages/ServiceCenterBookings";
import Mechanics from "./pages/Mechanics";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminInventory from "./pages/AdminInventory.jsx";
import ServiceCenterInventory from "./pages/ServiceCenterInventory";
import ServiceCenterCreateJobCard from "./pages/ServiceCenterCreateJobCard.jsx";
import ServiceCenterInvoice from "./pages/ServiceCenterInvoice.jsx";
import UserInvoice from "./pages/UserInvoice";
import AdminReports from "./pages/AdminReports";
import OverviewReport from "./pages/reports/OverviewReport";
import ServiceActivityReport from "./pages/reports/ServiceActivityReport";
import InventoryReports from "./pages/reports/InventoryReports";
import RevenueReport from "./pages/reports/RevenueReport";
import StatusReport from "./pages/reports/StatusReport";
import FiltersExportReport from "./pages/reports/FiltersExportReport";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password/:token" element={<App />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/vehicles" element={<MyVehicle />} />
        <Route path="/user/job-cards/:id/invoice" element={<UserInvoice />} />
        <Route path="/service-center" element={<ServiceCenterDashboard />} />
        <Route path="/service-center/bookings" element={<ServiceCenterBookings />} />
        <Route path="/service-center/mechanics" element={<Mechanics />} />
        <Route path="/service-center/inventory" element={<ServiceCenterInventory />} />
        <Route path="/service-center/job-cards" element={<ServiceCenterCreateJobCard />} />
        <Route path="/service-center/job-cards/:id/invoice" element={<ServiceCenterInvoice />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /> </ProtectedRoute>} />
        <Route path="/admin/reports/overview" element={<ProtectedRoute><OverviewReport /></ProtectedRoute>} />
        <Route path="/admin/reports/service-activity" element={<ProtectedRoute><ServiceActivityReport /> </ProtectedRoute>} />
        <Route path="/admin/reports/inventory" element={<ProtectedRoute><InventoryReports /> </ProtectedRoute>} />
        <Route path="/admin/reports/revenue" element={<RevenueReport />} />
        <Route path="/admin/reports/status" element={<StatusReport />} />
        <Route path="/admin/reports/filters-export" element={<FiltersExportReport />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);