const con = require('../config/db'); // Assuming mysql2/promise

const QUERIES = {
  getData: "SELECT * FROM `city` WHERE `deleted_at` IS NULL",

  // Removed trailing commas and added NOW() for timestamps
  addData: "INSERT INTO `city` (`name`, `state`, `created_uid`, `created_at`) VALUES (?, ?, ?, NOW())",

  updateData: "UPDATE `city` SET `name`=?, `state`=?, `updated_uid`=?, `updated_at`=NOW() WHERE `city_id`=?",

  deleteData: "UPDATE `city` SET `deleted_uid`=?, `deleted_at`=NOW() WHERE `city_id`=?"
};

exports.getCity = async (req, res) => {
  try {
    const [result] = await con.query(QUERIES.getData);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error To Fetch City :', error);
    return res.status(500).json({ error: 'City Not Found.' });
  }
};

exports.addCity = async (req, res) => {
  const { name, state } = req.body;

  if (!name || !state) {
    return res.status(400).json({ error: 'Name and state are required.' });
  }

  try {
    // Get the ID of the logged-in user (from your auth middleware)
    const currentUserId = req.user.user_id;

    const [result] = await con.query(QUERIES.addData, [
      name,
      state,
      currentUserId  // Passes to created_uid
    ]);

    return res.status(200).json({ message: 'City Added Successfully.' });
  } catch (error) {
    console.error('Error To Add City :', error);
    return res.status(500).json({ error: 'City Not Added.' });
  }
};

exports.updateCity = async (req, res) => {
  const { name, state } = req.body;
  const city_id = req.params.id; // Fixed req.parms()

  if (!name || !state) {
    return res.status(400).json({ error: 'Name and state are required.' });
  }

  try {
    // Get the ID of the logged-in user
    const currentUserId = req.user.user_id;

    // Fixed: Call QUERIES.updateData instead of addData
    const [result] = await con.query(QUERIES.updateData, [
      name,
      state,
      currentUserId, // Passes to updated_uid
      city_id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'City not found.' });
    }

    return res.status(200).json({ message: 'City Updated Successfully.' });
  } catch (error) {
    console.error('Error To Update City :', error);
    return res.status(500).json({ error: 'City Not Updated.' });
  }
};

// Fixed function name (was mistakenly named updateCity)
exports.deleteCity = async (req, res) => {
  const city_id = req.params.id; // Fixed req.parms()

  try {
    // Get the ID of the logged-in user
    const currentUserId = req.user.user_id;

    const [result] = await con.query(QUERIES.deleteData, [
      currentUserId, // Passes to deleted_uid
      city_id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'City not found or already deleted.' });
    }

    return res.status(200).json({ message: 'City Deleted Successfully.' });
  } catch (error) {
    console.error('Error To Delete City :', error);
    return res.status(500).json({ error: 'City Not Deleted.' });
  }
};