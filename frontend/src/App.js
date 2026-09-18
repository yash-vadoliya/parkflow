import "./App.css";
import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet
} from "react-router-dom";
import { useLocation } from "react-router-dom";

// Components
import Splashscreen from "./Components/Splashscreen";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import Footer from "./Components/Footer";

// Pages
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import User from "./Pages/User";
import Home from "./Pages/Home";
import ParkingPlot from "./Pages/ParkingPlot";
import ParkingPlotRequest from "./Pages/ParkingPlotRequest";
import City from "./Pages/City";
import Booking from "./Pages/Booking";
import Slots from "./Pages/Slots";
import GatekeeperSession from "./Pages/GatekeeperSession";
import AlignmentSuggestion from "./Pages/AlignmentSuggestion";
import Profile from "./Pages/Profile";
import AdminBookings from "./Pages/AdminBookings";
import VehicleRates from "./Pages/VehicleRates";

function AdminLayout() {
  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: '#14171c' }}>
      <Sidebar />
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Splashscreen />} />
        <Route path="/login" element={<Login />} />

        <Route element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/profile" element={<Profile />} />
        </Route >

        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user" element={<User />} />
          <Route path="/parking_plot" element={<ParkingPlot />} />
          <Route path="/parking_plot_request" element={<ParkingPlotRequest />} />
          <Route path="/city" element={<City />} />
          <Route path="/slots" element={<Slots />} />
          <Route path="/vehicle_rates" element={<VehicleRates />} />
          <Route path="/bookings" element={<AdminBookings />} />
          <Route path="/gatekeeper_session" element={<GatekeeperSession />} />
          <Route path="/alignment_suggestions" element={<AlignmentSuggestion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
