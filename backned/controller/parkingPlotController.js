const con = require('../config/db'); // Assuming mysql2/promise

const QUERIES = {
  // JOIN query to get area (lat/long) and city (name/state/country) data
  getData: `
  SELECT
      p.plot_id, p.plot_name, p.address, p.approved,
      a.area_id, a.area_name, a.latitude, a.longitude,
      c.city_id, c.name AS city_name, c.state
    FROM parking_plot p
    LEFT JOIN area a ON p.area_id = a.area_id
    LEFT JOIN city c ON a.city_id = c.city_id
    WHERE p.deleted_at IS NULL
  `,

  // Replaced created_at parameter with MySQL's NOW()
  addData: 'INSERT INTO `parking_plot` (`plot_name`, `address`, `area_id`, `approved`, `created_uid`, `created_at`) VALUES (?, ?, ?, ?, ?, NOW())',

  // Removed trailing comma before WHERE and replaced updated_at with NOW()
  updateData: 'UPDATE `parking_plot` SET `plot_name`=?, `address`=?, `area_id`=?, `approved`=?, `updated_uid`=?, `updated_at`=NOW() WHERE `plot_id`=?',

  // Replaced deleted_at with NOW()
  deleteData: 'UPDATE `parking_plot` SET `deleted_uid`=?, `deleted_at`=NOW() WHERE `plot_id`=?'
};

const saveRates = async (plotId, rates, userId) => {
  if (!Array.isArray(rates)) return;
  for (const item of rates) {
    const vehicleTypeId = Number(item.vehicle_type_id);
    const hourlyRate = Number(item.rate_per_hour);
    if (![1, 2].includes(vehicleTypeId) || !Number.isFinite(hourlyRate) || hourlyRate < 0) continue;
    await con.query(
      `INSERT INTO plot_vehicle_rate (plot_id, vehicle_type_id, rate_per_hour, minimum_hours, extend_rate_per_hour, created_uid, updated_uid)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rate_per_hour=VALUES(rate_per_hour), minimum_hours=VALUES(minimum_hours), extend_rate_per_hour=VALUES(extend_rate_per_hour), updated_uid=VALUES(updated_uid), deleted_at=NULL`,
      [plotId, vehicleTypeId, hourlyRate, Number(item.minimum_hours) || 1, item.extend_rate_per_hour === '' || item.extend_rate_per_hour == null ? null : Number(item.extend_rate_per_hour), userId, userId],
    );
  }
};

exports.getParkingPlot = async (req, res) => {
  try {
    const role = String(req.user?.role || '').trim().toLowerCase();
    const isAssignedStaff = ['admin', 'gatekeeper'].includes(role);
    const plotId = req.user?.plot_id;
    const scope = isAssignedStaff ? ' AND p.plot_id = ?' : '';
    const params = isAssignedStaff ? [plotId || 0] : [];
    const [result] = await con.query(`${QUERIES.getData}${scope}`, params);
    const [rateRows] = await con.query('SELECT id, plot_id, vehicle_type_id, rate_per_hour, minimum_hours, extend_rate_per_hour FROM plot_vehicle_rate WHERE plot_id IN (?) AND deleted_at IS NULL ORDER BY vehicle_type_id', [result.map((plot) => plot.plot_id)]);
    const ratesByPlot = rateRows.reduce((map, rate) => {
      (map[rate.plot_id] ||= []).push({ ...rate, rate_per_hour: Number(rate.rate_per_hour), minimum_hours: Number(rate.minimum_hours), extend_rate_per_hour: rate.extend_rate_per_hour == null ? null : Number(rate.extend_rate_per_hour) });
      return map;
    }, {});
    result.forEach((plot) => {
      const baseRates = ratesByPlot[plot.plot_id] || [];
      plot.rates = baseRates.flatMap((rate) => [rate, { ...rate, vehicle_type_id: 2 }]);
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error To Fetch Parking Plot : ", error);
    return res.status(500).json({ error: 'Parking Plots Not Found.' });
  }
};

exports.addParkingPlot = async (req, res) => {
  const role = String(req.user?.role || '').trim().toLowerCase();
  if (['admin', 'gatekeeper'].includes(role)) return res.status(403).json({ error: 'You cannot create parking plots.' });
  // Extract data from the request body
  const { plot_name, address, area_id, approved, rates } = req.body;

  if (!plot_name || !area_id) {
    return res.status(400).json({ error: 'plot_name and area_id are required.' });
  }

  try {
    // Get the ID of the user creating the plot (Assumes auth middleware is used)
    const currentUserId = req.user.user_id;

    const [result] = await con.query(QUERIES.addData, [
      plot_name,
      address,
      area_id,
      approved || false, // Default to false if not provided
      currentUserId
    ]);

    await saveRates(result.insertId, rates, currentUserId);
    return res.status(200).json({ message: 'Parking Plot Inserted Successfully.' });
  } catch (error) {
    console.error("Error To Insert Parking Plot : ", error);
    return res.status(500).json({ error: 'Parking Plot Not Added Successfully.' });
  }
};

exports.UpdateParkingPlot = async (req, res) => {
  // Extract data from the request body
  const { plot_name, address, area_id, approved, rates } = req.body;

  // FIX: Access the ID from the URL parameters properly
  const plot_id = req.params.id;

  if (!plot_name || !area_id) {
    return res.status(400).json({ error: 'plot_name and area_id are required.' });
  }

  try {
    // Get the ID of the user updating the plot
    const currentUserId = req.user.user_id;

    const [result] = await con.query(QUERIES.updateData, [
      plot_name,
      address,
      area_id,
      approved,
      currentUserId,
      plot_id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Parking Plot not found.' });
    }

    await saveRates(plot_id, rates, currentUserId);

    return res.status(200).json({ message: 'Parking Plot Updated Successfully.' });
  } catch (error) {
    console.error("Error To Update Parking Plot : ", error);
    return res.status(500).json({ error: 'Parking Plot Not Updated Successfully.' });
  }
};

exports.deleteParkingPlot = async (req, res) => {
  // FIX: Access the ID from the URL parameters properly
  const plot_id = req.params.id;

  try {
    // Get the ID of the user deleting the plot
    const currentUserId = req.user.user_id;

    const [result] = await con.query(QUERIES.deleteData, [
      currentUserId,
      plot_id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Parking Plot not found or already deleted.' });
    }

    return res.status(200).json({ message: 'Parking Plot Deleted Successfully.' });
  } catch (error) {
    console.error("Error To Delete Parking Plot : ", error);
    return res.status(500).json({ error: 'Parking Plot Not Deleted Successfully.' });
  }
};
