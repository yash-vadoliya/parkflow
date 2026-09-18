const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const con = require('../config/db');
const { revokeToken } = require('../middleware/auth');

const pendingSignups = new Map();
const OTP_LIFETIME_MS = 5 * 60 * 1000;
const quote = String.fromCharCode(96);
const otpTemplate = fs.readFileSync(path.join(__dirname, '../templates/otpEmail.html'), 'utf8');
const mailer = nodemailer.createTransport(process.env.SMTP_HOST ? {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
} : {
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD },
});

const sendOtp = (email, name, otp) => mailer.sendMail({
  from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.MAIL_USER,
  to: email,
  subject: 'Your ParkFlow verification code',
  text: 'Hello ' + (name || 'there') + ', your ParkFlow email verification code is ' + otp + '. It expires in 5 minutes.',
  html: otpTemplate
    .replaceAll('{{NAME}}', String(name || 'there'))
    .replaceAll('{{OTP}}', otp)
    .replaceAll('{{YEAR}}', String(new Date().getFullYear())),
});

const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));

exports.requestSignupOtp = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
  if (name.length > 100) return res.status(400).json({ error: 'Name is too long.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });

  try {
    const [rows] = await con.query('SELECT user_id FROM `user` WHERE email=? AND deleted_at IS NULL LIMIT 1', [email]);
    if (rows.length) return res.status(409).json({ error: 'An account with this email already exists.' });

    const otp = makeOtp();
    pendingSignups.set(email, {
      name,
      phone: phone || null,
      otp,
      expiresAt: Date.now() + OTP_LIFETIME_MS,
    });
    await sendOtp(email, name, otp);
    return res.status(200).json({ success: true, email, message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('Signup OTP error:', error);
    return res.status(500).json({ error: 'Unable to send verification code. Check SMTP configuration.' });
  }
};

exports.verifySignupOtp = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  const pending = pendingSignups.get(email);
  if (!pending || pending.expiresAt < Date.now() || pending.otp !== otp) {
    return res.status(401).json({ error: 'Invalid or expired verification code.' });
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  pendingSignups.set(email, { ...pending, verified: true, verificationToken, expiresAt: Date.now() + OTP_LIFETIME_MS });
  return res.status(200).json({ success: true, email, verificationToken, message: 'Email verified. Set your password to finish.' });
};

exports.completeSignup = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const verificationToken = String(req.body.verificationToken || '');
  const pending = pendingSignups.get(email);
  if (!pending || !pending.verified || pending.expiresAt < Date.now() || pending.verificationToken !== verificationToken) {
    return res.status(401).json({ error: 'Please verify your email before setting a password.' });
  }
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const [existing] = await con.query('SELECT user_id FROM `user` WHERE email=? AND deleted_at IS NULL LIMIT 1', [email]);
    if (existing.length) return res.status(409).json({ error: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO `user` (plot_id, email, password, phone, name, profile_pic, user_role, created_at, create_uid, updated_at, updated_uid, deleted_at, deleted_uid) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, NULL, NULL)';
    const [result] = await con.query(query, [0, email, hash, pending.phone || 0, pending.name, '', 'user', 0, 0]);
    pendingSignups.delete(email);
    return res.status(201).json({ success: true, user_id: result.insertId, message: 'Account created successfully. You can now sign in.' });
  } catch (error) {
    console.error('Signup completion error:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists.' });
    return res.status(500).json({ error: 'Account could not be created.' });
  }
};

exports.loginUser = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  try {
    const [rows] = await con.query('SELECT user_id, email, password, name, user_role, plot_id FROM __BT__user__BT__ WHERE email=? AND deleted_at IS NULL LIMIT 1'.replaceAll('__BT__', quote), [email]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    const user = rows[0];
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid email or password.' });
    const role = String(user.user_role || '').trim().toLowerCase();
    const token = jwt.sign({ user_id: user.user_id, name: user.name, email: user.email, role, plot_id: user.plot_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ success: true, message: 'Login successful.', token, role, user: { user_id: user.user_id, email: user.email, name: user.name, user_role: user.user_role, plot_id: user.plot_id } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to complete login.' });
  }
};

exports.getProfile = async (req, res) => {
  const userId = req.user?.user_id;
  if (!userId) return res.status(401).json({ error: 'Authenticated user is required.' });
  try {
    const [[user], [vehicles], [bookings]] = await Promise.all([
      con.query('SELECT user_id, name, email, phone, user_role, created_at FROM `user` WHERE user_id=? AND deleted_at IS NULL LIMIT 1', [userId]),
      con.query('SELECT vehicle_id, vehicle_number, vehicle_type, created_at FROM vehicle WHERE user_id=? AND deleted_at IS NULL ORDER BY created_at DESC', [userId]),
      con.query(`SELECT b.booking_id, b.booking_ref, b.start_time, b.end_time, b.total_amount, b.status, b.created_at,
        v.vehicle_number, v.vehicle_type, p.plot_name, p.address,
        a.area_name, c.name AS city_name, c.state AS state_name, 'India' AS country_name
        FROM booking b
        LEFT JOIN vehicle v ON v.vehicle_id = b.vehicle_id
        LEFT JOIN parking_plot p ON p.plot_id = b.plot_id
        LEFT JOIN area a ON a.area_id = p.area_id
        LEFT JOIN city c ON c.city_id = a.city_id
        WHERE b.cust_id=? AND b.deleted_at IS NULL
        ORDER BY b.created_at DESC`, [userId]),
    ]);
    if (!user.length) return res.status(404).json({ error: 'User profile not found.' });
    return res.status(200).json({ success: true, user: user[0], vehicles, bookings, lastBooking: bookings[0] || null });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Profile could not be loaded.' });
  }
};

exports.logoutUser = async (req, res) => {
  revokeToken(req.token);
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

exports.resetUserPassword = async (req, res) => {
  console.log('Body', req.body);
  const email = String(req.body.email || '').trim().toLowerCase();
  const { newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required.' });
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const [result] = await con.query('UPDATE __BT__user__BT__ SET password=?, updated_at=NOW() WHERE email=? AND deleted_at IS NULL'.replaceAll('__BT__', quote), [hash, email]);
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
    return res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Password could not be reset.' });
  }
};
