const con = require('../config/db');

const isSuperAdmin = (role) => ['super_admin', 'superadmin'].includes(String(role || '').toLowerCase());

const currentPlotId = async (userId) => {
  const [rows] = await con.query('SELECT plot_id FROM `user` WHERE user_id=? AND deleted_at IS NULL LIMIT 1', [userId]);
  return rows[0]?.plot_id ?? null;
};

const canUsePlot = async (req, plotId) => {
  if (!plotId) return false;
  if (isSuperAdmin(req.user.role)) return true;
  const assigned = await currentPlotId(req.user.user_id);
  return String(assigned) === String(plotId);
};

exports.getRates = async (req, res) => {
  try {
    const params = [];
    let scope = '';
    if (!isSuperAdmin(req.user.role)) {
      const plotId = await currentPlotId(req.user.user_id);
      if (!plotId) return res.json({ success: true, data: [] });
      scope = ' AND r.plot_id=?';
      params.push(plotId);
    }
    const [rows] = await con.query(
      `SELECT r.id, r.plot_id, r.vehicle_type_id, r.rate_per_hour, r.minimum_hours, r.extend_rate_per_hour,
              p.plot_name
       FROM plot_vehicle_rate r
       INNER JOIN parking_plot p ON p.plot_id=r.plot_id AND p.deleted_at IS NULL
       WHERE r.deleted_at IS NULL${scope} ORDER BY p.plot_name, r.vehicle_type_id`,
      params,
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching vehicle rates:', error);
    return res.status(500).json({ error: 'Vehicle rates could not be loaded.' });
  }
};

exports.saveRate = async (req, res) => {
  const plotId = Number(req.body.plot_id);
  const vehicleTypeId = Number(req.body.vehicle_type_id);
  const rate = Number(req.body.rate_per_hour);
  const minimumHours = Number(req.body.minimum_hours || 1);
  const extendRate = req.body.extend_rate_per_hour === '' || req.body.extend_rate_per_hour == null ? null : Number(req.body.extend_rate_per_hour);
  if (!plotId || ![1, 2].includes(vehicleTypeId) || !Number.isFinite(rate) || rate < 0 || !Number.isFinite(minimumHours) || minimumHours <= 0 || (extendRate != null && (!Number.isFinite(extendRate) || extendRate < 0))) {
    return res.status(400).json({ error: 'Valid plot, vehicle type, hourly rate and minimum hours are required.' });
  }
  try {
    if (!await canUsePlot(req, plotId)) return res.status(403).json({ error: 'You can only manage rates for your assigned parking plot.' });
    await con.query(
      `INSERT INTO plot_vehicle_rate (plot_id, vehicle_type_id, rate_per_hour, minimum_hours, extend_rate_per_hour, created_uid, updated_uid)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rate_per_hour=VALUES(rate_per_hour), minimum_hours=VALUES(minimum_hours), extend_rate_per_hour=VALUES(extend_rate_per_hour), updated_uid=VALUES(updated_uid), deleted_at=NULL`,
      [plotId, vehicleTypeId, rate, minimumHours, extendRate, req.user.user_id, req.user.user_id],
    );
    return res.status(200).json({ success: true, message: 'Vehicle rate saved successfully.' });
  } catch (error) {
    console.error('Error saving vehicle rate:', error);
    return res.status(500).json({ error: 'Vehicle rate could not be saved.' });
  }
};
