const con = require('../config/db');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const confirmationTemplate = fs.readFileSync(path.join(__dirname, '../templates/bookingConfirmation.html'), 'utf8');
const mailer = nodemailer.createTransport(process.env.SMTP_HOST ? {
  host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
} : { service: 'gmail', auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD } });

const sendBookingStatusEmail = (booking) => {
  const isApproved = booking.status === 'approved';
  const html = confirmationTemplate.replaceAll('{{NAME}}', String(booking.customer_name || 'there'))
    .replaceAll('{{BOOKING_REF}}', String(booking.booking_ref || ''))
    .replaceAll('{{PLOT_NAME}}', String(booking.plot_name || 'Parking plot'))
    .replaceAll('{{PLOT_DETAILS}}', `${booking.address || ''}${booking.area_name ? `, ${booking.area_name}` : ''}${booking.city_name ? `, ${booking.city_name}` : ''}${booking.state_name ? `, ${booking.state_name}` : ''}`)
    .replaceAll('{{VEHICLE}}', `${booking.vehicle_number || ''} (${booking.vehicle_type || ''})`)
    .replaceAll('{{START_TIME}}', new Date(booking.start_time).toLocaleString('en-IN'))
    .replaceAll('{{END_TIME}}', new Date(booking.end_time).toLocaleString('en-IN'))
    .replaceAll('{{AMOUNT}}', Number(booking.total_amount || 0).toFixed(2))
    .replaceAll('{{APPROVED_BY}}', String(booking.approved_by_name || 'Gatekeeper'))
    .replaceAll('{{APPROVED_BY_PHONE}}', String(booking.approved_by_phone || 'Not available'))
    .replaceAll('{{STATUS_TITLE}}', isApproved ? 'Your booking is confirmed' : 'Your booking was rejected')
    .replaceAll('{{STATUS_MESSAGE}}', isApproved ? 'your parking booking has been approved.' : 'your parking booking was rejected by the parking gatekeeper.')
    .replaceAll('{{YEAR}}', String(new Date().getFullYear()));
  return mailer.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.MAIL_USER, to: booking.customer_email, subject: `ParkFlow booking confirmed · ${booking.booking_ref}`, html });
};

const getUserId = (req) => req.user?.cust_id || req.user?.user_id;

const getAssignedPlotId = async (userId) => {
  const [rows] = await con.query('SELECT plot_id FROM `user` WHERE user_id=? AND deleted_at IS NULL LIMIT 1', [userId]);
  return rows[0]?.plot_id ?? null;
};

exports.getVehicles = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authenticated user is required.' });
  try {
    const [rows] = await con.query(
      'SELECT vehicle_id, vehicle_number, vehicle_type, created_at FROM vehicle WHERE user_id=? AND deleted_at IS NULL ORDER BY created_at DESC',
      [userId],
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({ error: 'Vehicles could not be loaded.' });
  }
};

exports.addVehicle = async (req, res) => {
  const userId = getUserId(req);
  const vehicleNumber = String(req.body.vehicle_number || '').trim().toUpperCase();
  const vehicleType = String(req.body.vehicle_type || '').trim().toLowerCase();
  if (!userId) return res.status(401).json({ error: 'Authenticated user is required.' });
  if (!vehicleNumber || !['car', 'bike'].includes(vehicleType)) {
    return res.status(400).json({ error: 'vehicle_number and a valid vehicle_type are required.' });
  }
  try {
    const [result] = await con.query(
      'INSERT INTO vehicle (vehicle_number, vehicle_type, user_id, created_uid, updated_uid, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [vehicleNumber, vehicleType, userId, userId, userId],
    );
    const [rows] = await con.query(
      'SELECT vehicle_id, vehicle_number, vehicle_type, created_at FROM vehicle WHERE vehicle_id=? AND user_id=? LIMIT 1',
      [result.insertId, userId],
    );
    return res.status(201).json({ success: true, data: rows[0], message: 'Vehicle added successfully.' });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This vehicle number already exists.' });
    return res.status(500).json({ error: 'Vehicle could not be added.' });
  }
};

const getBookingsQuery = `
  SELECT
    b.booking_id, b.booking_ref, b.vehicle_id, b.cust_id, b.plot_id,
    b.start_time, b.end_time, b.total_amount, b.status,
    b.created_at, b.updated_at,
    v.vehicle_number, v.vehicle_type,
    p.plot_name, p.address,
    a.area_name,
    c.city_id, c.name AS city_name, c.state AS state_name,
    'India' AS country_name,
    customer.name AS customer_name,
    customer.email AS customer_username,
    customer.email AS customer_email
  FROM booking b
  LEFT JOIN vehicle v ON v.vehicle_id = b.vehicle_id
  LEFT JOIN parking_plot p ON p.plot_id = b.plot_id
  LEFT JOIN area a ON a.area_id = p.area_id
  LEFT JOIN city c ON c.city_id = a.city_id
  LEFT JOIN \`user\` customer ON customer.user_id = b.cust_id
  WHERE b.deleted_at IS NULL
`;

exports.getBookings = async (req, res) => {
  const userId = getUserId(req);
  const role = String(req.user?.role || '').trim().toLowerCase();
  const isSuperAdmin = ['superadmin', 'super_admin'].includes(role);
  const isPlotAdmin = ['admin', 'gatekeeper'].includes(role);

  if (!userId) return res.status(401).json({ error: 'Authenticated user is required.' });

  try {
    let scope = '';
    let params = [];

    // Super admins can see the complete booking register. Facility admins and
    // gatekeepers can only see bookings for the plot assigned to their login.
    if (isPlotAdmin) {
      const assignedPlotId = await getAssignedPlotId(userId);
      if (assignedPlotId === null || assignedPlotId === undefined || assignedPlotId === '') {
        return res.status(200).json({ success: true, data: [] });
      }
      scope = ' AND b.plot_id = ?';
      params = [assignedPlotId];
    } else if (!isSuperAdmin) {
      scope = ' AND b.cust_id = ?';
      params = [userId];
    }

    const [rows] = await con.query(
      `${getBookingsQuery}${scope} ORDER BY b.created_at DESC`,
      params,
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Bookings not found.' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const role = String(req.user?.role || '').trim().toLowerCase();
  const bookingId = req.params.id;
  const status = String(req.body.status || '').trim().toLowerCase();

  if (role !== 'gatekeeper') return res.status(403).json({ error: 'Only gatekeepers can update booking status.' });
  if (!['approved', 'reject'].includes(status)) return res.status(400).json({ error: 'Status must be approved or reject.' });

  try {
    const plotId = await getAssignedPlotId(req.user.user_id);
    if (plotId === null || plotId === undefined || plotId === '') return res.status(403).json({ error: 'No parking plot is assigned to this gatekeeper.' });
    const [matchingBookings] = await con.query('SELECT booking_id, status FROM booking WHERE booking_id=? AND plot_id=? AND deleted_at IS NULL LIMIT 1', [bookingId, plotId]);
    if (!matchingBookings[0]) return res.status(404).json({ error: 'Booking not found for your assigned parking plot.' });
    if (matchingBookings[0].status === status) return res.status(200).json({ success: true, message: `Booking already ${status}.`, status, emailSent: true });
    const [result] = await con.query(
      'UPDATE booking SET status=?, updated_uid=?, updated_at=NOW() WHERE booking_id=? AND plot_id=? AND deleted_at IS NULL',
      [status, req.user.user_id, bookingId, plotId],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Booking not found for your assigned parking plot.' });
    let emailSent = false;
    if (['approved', 'reject'].includes(status)) {
      const [bookingRows] = await con.query(`${getBookingsQuery} AND b.booking_id=? LIMIT 1`, [bookingId]);
      const [approverRows] = await con.query('SELECT name, phone FROM `user` WHERE user_id=? AND deleted_at IS NULL LIMIT 1', [req.user.user_id]);
      const booking = bookingRows[0];
      const [customerRows] = booking
        ? await con.query('SELECT name, email FROM `user` WHERE user_id=? AND deleted_at IS NULL LIMIT 1', [booking.cust_id])
        : [[]];
      const customer = customerRows[0];
      if (booking) {
        // Resolve the recipient from the booking owner, matching the customer
        // record shown in the gatekeeper table.
        booking.customer_name = customer?.name || booking.customer_name;
        booking.customer_email = customer?.email || booking.customer_email || booking.customer_username;
      }
      if (booking?.customer_email) {
        booking.approved_by_name = approverRows[0]?.name || req.user.name;
        booking.approved_by_phone = approverRows[0]?.phone || req.user.phone;
        try {
          await sendBookingStatusEmail(booking);
          emailSent = true;
          console.info(`Booking ${booking.booking_ref} ${status} email sent to ${booking.customer_email}`);
        } catch (error) {
          console.error(`Booking ${booking.booking_ref} ${status} email error:`, error);
        }
      } else {
        console.error(`Booking ${bookingId} ${status} email skipped: customer email was not found.`);
      }
    }
    return res.status(200).json({ success: true, message: `Booking ${status}.`, status, emailSent });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ error: 'Booking status could not be updated.' });
  }
};

exports.addBooking = async (req, res) => {
  const custId = getUserId(req);
  const {
    vehicle_id,
    vehicle_number,
    vehicle_type,
    plot_id,
    start_time,
    end_time,
    total_amount = 0,
  } = req.body;

  if (!custId) return res.status(401).json({ error: 'Authenticated user is required.' });
  if (!plot_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'plot_id, start_time and end_time are required.' });
  }
  if (!vehicle_id && (!vehicle_number || !vehicle_type)) {
    return res.status(400).json({ error: 'vehicle_id or vehicle_number and vehicle_type are required.' });
  }

  const start = new Date(start_time);
  const end = new Date(end_time);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({ error: 'end_time must be later than start_time.' });
  }

  const connection = await con.getConnection();
  try {
    await connection.beginTransaction();

    let selectedVehicleId = vehicle_id;
    let selectedVehicleType = String(vehicle_type || '').toLowerCase();
    if (selectedVehicleId) {
      const [ownedVehicles] = await connection.query(
        'SELECT vehicle_id, vehicle_number, vehicle_type FROM vehicle WHERE vehicle_id=? AND user_id=? AND deleted_at IS NULL LIMIT 1',
        [selectedVehicleId, custId],
      );
      if (!ownedVehicles[0]) {
        await connection.rollback();
        return res.status(403).json({ error: 'You can only book with your own vehicle.' });
      }
      selectedVehicleType = String(ownedVehicles[0].vehicle_type || '').toLowerCase();
    } else {
      const [vehicles] = await connection.query(
        'SELECT vehicle_id FROM vehicle WHERE vehicle_number = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1',
        [vehicle_number.trim().toUpperCase(), custId],
      );

      if (vehicles[0]) {
        selectedVehicleId = vehicles[0].vehicle_id;
        selectedVehicleType = String(vehicle_type || '').toLowerCase();
      } else {
        const [vehicleResult] = await connection.query(
          'INSERT INTO vehicle (vehicle_number, vehicle_type, user_id, created_uid, updated_uid, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [vehicle_number.trim().toUpperCase(), vehicle_type, custId, custId, custId],
        );
        selectedVehicleId = vehicleResult.insertId;
      }
    }

    const [plotRows] = await connection.query(
      'SELECT plot_id FROM parking_plot WHERE plot_id = ? AND approved = 1 AND deleted_at IS NULL LIMIT 1',
      [plot_id],
    );
    if (!plotRows[0]) {
      await connection.rollback();
      return res.status(400).json({ error: 'Selected parking plot is not available.' });
    }

    const [rateRows] = await connection.query(
      'SELECT rate_per_hour FROM plot_vehicle_rate WHERE plot_id=? AND vehicle_type_id=? AND deleted_at IS NULL LIMIT 1',
      [plot_id, selectedVehicleType === 'bike' ? 2 : 1],
    );
    if (!rateRows[0]) {
      await connection.rollback();
      return res.status(400).json({ error: 'No rate is configured for the selected vehicle at this parking plot.' });
    }
    const calculatedAmount = Math.ceil((end - start) / (1000 * 60 * 60)) * Number(rateRows[0].rate_per_hour);

    const bookingRef = `BK-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const [result] = await connection.query(
      `INSERT INTO booking
        (booking_ref, vehicle_id, cust_id, plot_id, start_time, end_time, total_amount, status, created_uid, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [bookingRef, selectedVehicleId, custId, plot_id, start_time, end_time, calculatedAmount, custId],
    );

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      booking_id: result.insertId,
      booking_ref: bookingRef,
      status: 'pending',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating booking:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Vehicle number already exists.' });
    return res.status(500).json({ error: 'Booking could not be created.' });
  } finally {
    connection.release();
  }
};
