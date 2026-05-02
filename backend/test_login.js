import sql from 'mssql/msnodesqlv8.js';

const config = {
  connectionString: "server=localhost\\SQLEXPRESS;Database=expense_tracker;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}"
};

async function test() {
  try {
    console.log("Connecting...");
    const pool = await sql.connect(config);
    console.log("Connected. Querying users...");
    const result = await pool.request().query('SELECT * FROM users');
    console.log("Users:", result.recordset);
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
}
test();
