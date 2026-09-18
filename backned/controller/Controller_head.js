const con = require('../config/db');

async function runQuery(queries, parms = []) {
  try {
    const result = await con.query(queries, parms);
    return { success: true, data: result };
  } catch (err) {
    console.error("Database Error: ", err.message);
    return { success: false, error: err.message };
  }

}

module.exports = runQuery;