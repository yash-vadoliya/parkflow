const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const con = require('../config/db');

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const pendingAdminUsers = new Map();
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

const allowedRolesFor = (role) => ['super_admin', 'superadmin'].includes(role)
  ? ['superadmin', 'admin', 'gatekeeper']
  : role === 'admin' ? ['admin', 'gatekeeper'] : [];

const pendingKey = (req, email) => `${req.user.user_id}:${email}`;

const sendAdminOtp = (email, name, otp) => mailer.sendMail({
  from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.MAIL_USER,
  to: email,
  subject: 'Verify ParkFlow user email',
  text: `Hello ${name || 'there'}, your ParkFlow email verification code is ${otp}. It expires in 5 minutes.`,
  html: otpTemplate.replaceAll('{{NAME}}', String(name || 'there')).replaceAll('{{OTP}}', otp).replaceAll('{{YEAR}}', String(new Date().getFullYear())),
});

const columns = 'u.user_id, u.plot_id, u.email, u.phone, u.name, u.user_role, u.created_at, u.updated_at, p.plot_name';

const getCurrentUserPlot = async (userId) => {
  const [rows] = await con.query(
    'SELECT plot_id FROM `user` WHERE user_id=? AND deleted_at IS NULL LIMIT 1',
    [userId],
  );
  return rows[0]?.plot_id ?? null;
};

const validateAssignedPlot = async (req, plotId) => {
  if (plotId === null || plotId === undefined || plotId === '') {
    return { valid: false, error: 'A parking plot must be assigned.' };
  }

  const [plots] = await con.query(
    'SELECT plot_id FROM parking_plot WHERE plot_id=? AND deleted_at IS NULL LIMIT 1',
    [plotId],
  );
  if (!plots[0]) return { valid: false, error: 'Selected parking plot is not available.' };

  if (String(req.user.role).toLowerCase() === 'admin') {
    const currentPlotId = await getCurrentUserPlot(req.user.user_id);
    if (currentPlotId === null || String(currentPlotId) !== String(plotId)) {
      return { valid: false, error: 'You can only assign users to your parking plot.' };
    }
  }
  return { valid: true };
};

exports.getUsers = async (req, res) => {
  try {
    const params = [];
    let scope = '';
    if (req.user.role === 'admin') {
      scope = ' AND u.plot_id = (SELECT plot_id FROM `user` WHERE user_id = ?)';
      params.push(req.user.user_id);
    }
    const query = 'SELECT ' + columns + ' FROM `user` u LEFT JOIN parking_plot p ON p.plot_id = u.plot_id AND p.deleted_at IS NULL WHERE u.deleted_at IS NULL' + scope + ' ORDER BY u.created_at DESC';
    const [rows] = await con.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Users could not be loaded.' });
  }
};

exports.requestAdminUserOtp = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const name = String(req.body.name || '').trim();
  const userRole = String(req.body.user_role || '').trim().toLowerCase();
  const allowedRoles = allowedRolesFor(req.user.role);
  if (!email || !name || !userRole) return res.status(400).json({ error: 'Name, email and role are required.' });
  if (!allowedRoles.includes(userRole)) return res.status(403).json({ error: 'You cannot create this user role.' });
  try {
    const [existing] = await con.query('SELECT user_id FROM `user` WHERE email=? AND deleted_at IS NULL LIMIT 1', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already exists.' });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    pendingAdminUsers.set(pendingKey(req, email), { email, name, userRole, otp, expiresAt: Date.now() + OTP_LIFETIME_MS });
    await sendAdminOtp(email, name, otp);
    return res.status(200).json({ success: true, message: 'Verification code sent.' });
  } catch (error) {
    console.error('Admin user OTP error:', error);
    return res.status(500).json({ error: 'Unable to send verification code.' });
  }
};

exports.verifyAdminUserOtp = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  const pending = pendingAdminUsers.get(pendingKey(req, email));
  if (!pending || pending.expiresAt < Date.now() || pending.otp !== otp) return res.status(401).json({ error: 'Invalid or expired verification code.' });
  const verificationToken = crypto.randomBytes(32).toString('hex');
  pendingAdminUsers.set(pendingKey(req, email), { ...pending, verified: true, verificationToken, expiresAt: Date.now() + OTP_LIFETIME_MS });
  return res.status(200).json({ success: true, verificationToken, message: 'Email verified.' });
};

exports.addUser = async (req, res) => {
  const { email, password, password_confirmation, phone, name, user_role, plot_id, verificationToken } = req.body;
  if (!email || !password || !name || !user_role) return res.status(400).json({ error: 'email, password, name and user_role are required.' });
  if (password !== password_confirmation) return res.status(400).json({ error: 'Passwords do not match.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  if (!allowedRolesFor(req.user.role).includes(String(user_role).toLowerCase())) return res.status(403).json({ error: 'You cannot create this user role.' });
  const assignedPlot = await validateAssignedPlot(req, plot_id);
  if (!assignedPlot.valid) return res.status(400).json({ error: assignedPlot.error });
  const normalizedEmail = email.trim().toLowerCase();
  const pending = pendingAdminUsers.get(pendingKey(req, normalizedEmail));
  if (!pending || !pending.verified || pending.expiresAt < Date.now() || pending.verificationToken !== verificationToken || pending.userRole !== String(user_role).toLowerCase()) {
    return res.status(401).json({ error: 'Verify the user email before creating the account.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO `user` (plot_id, email, password, phone, name, profile_pic, user_role, created_at, create_uid, updated_at, updated_uid, deleted_at, deleted_uid) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, NULL, NULL)';
    const [result] = await con.query(query, [plot_id, normalizedEmail, hash, phone || 0, name.trim(), '', user_role, req.user.user_id, req.user.user_id]);
    pendingAdminUsers.delete(pendingKey(req, normalizedEmail));
    return res.status(201).json({ success: true, user_id: result.insertId, message: 'User created successfully.' });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists.' });
    return res.status(500).json({ error: 'User could not be created.' });
  }
};

exports.updateUser = async (req, res) => {
  const { email, password, phone, name, user_role, plot_id } = req.body;
  if (!email || !name || !user_role) return res.status(400).json({ error: 'email, name and user_role are required.' });
  if (!allowedRolesFor(req.user.role).includes(String(user_role).toLowerCase())) return res.status(403).json({ error: 'You cannot assign this user role.' });
  try {
    const assignedPlot = await validateAssignedPlot(req, plot_id);
    if (!assignedPlot.valid) return res.status(400).json({ error: assignedPlot.error });
    const values = [email.trim().toLowerCase(), phone || null, name.trim(), user_role, plot_id || null, req.user.user_id];
    let query = 'UPDATE `user` SET email=?, phone=?, name=?, user_role=?, plot_id=?, updated_uid=?, updated_at=NOW()';
    if (password) { query += ', password=?'; values.push(await bcrypt.hash(password, 10)); }
    query += ' WHERE user_id=? AND deleted_at IS NULL';
    values.push(req.params.id);
    const [result] = await con.query(query, values);
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
    return res.status(200).json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists.' });
    return res.status(500).json({ error: 'User could not be updated.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const [result] = await con.query('UPDATE `user` SET deleted_uid=?, deleted_at=NOW() WHERE user_id=? AND deleted_at IS NULL', [req.user.user_id, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'User could not be deleted.' });
  }
};
