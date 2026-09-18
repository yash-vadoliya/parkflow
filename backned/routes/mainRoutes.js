const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Ready to be used for image uploads
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// --- Controllers ---
const user_login_controller = require('../controller/userLoginController');
const user_controller = require('../controller/userController');
const prking_plot = require('../controller/parkingPlotController');
const city = require('../controller/cityController');
const area = require('../controller/areaController');
const booking = require('../controller/bookingController');
const vehicleRate = require('../controller/vehicleRateController');

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// User Auth
router.post('/userlogin', user_login_controller.loginUser);
router.post('/signup/request-otp', user_login_controller.requestSignupOtp);
router.post('/signup/verify-otp', user_login_controller.verifySignupOtp);
router.post('/signup/complete', user_login_controller.completeSignup);
router.post('/userlogout', authenticateToken, user_login_controller.logoutUser);
router.get('/profile', authenticateToken, user_login_controller.getProfile);
router.post('/userreset-password', user_login_controller.resetUserPassword); // Note: POST is fine, but PUT is also common here


// ==========================================
// ADMIN USER ROUTES
// ==========================================
// Fixed: Added quotes around roles. Variables without quotes cause ReferenceErrors.
router.get('/user', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), user_controller.getUsers);
router.post('/user/request-otp', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), user_controller.requestAdminUserOtp);
router.post('/user/verify-otp', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), user_controller.verifyAdminUserOtp);
router.post('/user', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), user_controller.addUser);
router.put('/user/:id', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), user_controller.updateUser);
router.put('/user/delete/:id', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), user_controller.deleteUser);


// ==========================================
// PARKING PLOT ROUTES
// ==========================================
// Parking data is read-only reference data. Any authenticated role may view it.
router.get('/parkingplot', authenticateToken, prking_plot.getParkingPlot);
router.post('/parkingplot', authenticateToken, prking_plot.addParkingPlot);
router.put('/parkingplot/:id', authenticateToken, authorizeRoles('super_admin', 'superadmin'), prking_plot.UpdateParkingPlot);
router.put('/parkingplot/delete/:id', authenticateToken, authorizeRoles('super_admin', 'superadmin'), prking_plot.deleteParkingPlot);


// ==========================================
// CITY ROUTES
// ==========================================
// City and area data are also required by booking screens for every role.
router.get('/city', authenticateToken, city.getCity);
router.post('/city', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), city.addCity);
router.put('/city/:id', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), city.updateCity);
router.put('/city/delete/:id', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), city.deleteCity);


// ==========================================
// AREA ROUTES
// ==========================================
router.get('/area', authenticateToken, area.getArea);
router.post('/area', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), area.addArea);
router.put('/area/:id', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), area.updateArea);
router.put('/area/delete/:id', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), area.deleteArea);


// ==========================================
// BOOKING ROUTES
// ==========================================
router.get('/booking', authenticateToken, booking.getBookings);
router.post('/booking', authenticateToken, booking.addBooking);
router.put('/booking/:id/status', authenticateToken, authorizeRoles('gatekeeper'), booking.updateBookingStatus);
router.get('/vehicle', authenticateToken, booking.getVehicles);
router.post('/vehicle', authenticateToken, booking.addVehicle);

// Vehicle rates are available to super admins and plot admins only.
router.get('/vehicle-rate', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), vehicleRate.getRates);
router.post('/vehicle-rate', authenticateToken, authorizeRoles('super_admin', 'superadmin', 'admin'), vehicleRate.saveRate);

module.exports = router;
