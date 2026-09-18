const con = require('../config/db'); // Assuming mysql2/promise

const QUERIES = {
  // Added SELECT * (was missing) and a JOIN to get the city name
  getData: `
    SELECT 
      a.*, 
      c.name AS city_name, 
      c.state 
    FROM area a
    LEFT JOIN city c ON a.city_id = c.city_id
    WHERE a.deleted_at IS NULL
  `,

  // Removed trailing comma in columns and replaced created_at with NOW()
  addData: "INSERT INTO `area` (`area_name`, `city_id`, `latitude`, `longitude`, `created_uid`, `created_at`) VALUES (?, ?, ?, ?, ?, NOW())",

  // Replaced updated_at with NOW()
  updateData: "UPDATE `area` SET `area_name`=?, `city_id`=?, `latitude`=?, `longitude`=?, `updated_uid`=?, `updated_at`=NOW() WHERE `area_id`=?",

  // Replaced deleted_at with NOW()
  deleteData: "UPDATE `area` SET `deleted_uid`=?, `deleted_at`=NOW() WHERE `area_id`=?"
};

exports.getArea = async (req, res) => {
  try {
    const [result] = await con.query(QUERIES.getData);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error To Fetch Area :', error);
    return res.status(500).json({ error: 'Areas Not Found.' });
  }
};

exports.addArea = async (req, res) => {
  // Destructure the actual fields you expect from the frontend
  const { area_name, city_id, latitude, longitude } = req.body;

  if (!area_name || !city_id) {
    return res.status(400).json({ error: 'Area name and city_id are required.' });
  }

  try {
    // Extract the currently logged-in user's ID
    const currentUserId = req.user.user_id;

    const [result] = await con.query(QUERIES.addData, [
      area_name,
      city_id,
      latitude || null,
      longitude || null,
      currentUserId
    ]);

    return res.status(200).json({ message: 'Area Added Successfully.' });
  } catch (error) {
    console.error('Error To Add Area :', error);
    return res.status(500).json({ error: 'Area Not Added.' });
  }
};

exports.updateArea = async (req, res) => {
  const { area_name, city_id, latitude, longitude } = req.body;
  const area_id = req.params.id; // Fixed req.parms()

  if (!area_name || !city_id) {
    return res.status(400).json({ error: 'Area name and city_id are required.' });
  }

  try {
    const currentUserId = req.user.user_id;

    const [result] = await con.query(QUERIES.updateData, [
      area_name,
      city_id,
      latitude || null,
      longitude || null,
      currentUserId,
      area_id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Area not found.' });
    }

    return res.status(200).json({ message: 'Area Updated Successfully.' });
  } catch (error) {
    console.error('Error To Update Area :', error);
    return res.status(500).json({ error: 'Area Not Updated.' });
  }
};

// Fixed function name (was mistakenly named addArea)
exports.deleteArea = async (req, res) => {
  const area_id = req.params.id; // Fixed req.parms()

  try {
    const currentUserId = req.user.user_id;

    // Fixed: Call QUERIES.deleteData instead of addData
    const [result] = await con.query(QUERIES.deleteData, [
      currentUserId,
      area_id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Area not found or already deleted.' });
    }

    return res.status(200).json({ message: 'Area Deleted Successfully.' });
  } catch (error) {
    console.error('Error To Delete Area :', error);
    return res.status(500).json({ error: 'Area Not Deleted.' });
  }
};