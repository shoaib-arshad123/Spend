import sql from 'mssql/msnodesqlv8.js';

const config = {
  connectionString: "server=localhost\\SQLEXPRESS;Database=expense_tracker;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}"
};

const pool = new sql.ConnectionPool(config);
pool.connect().catch(console.error);

try {
  const req = pool.request();
  console.log("Request created");
} catch(e) {
  console.log("Error creating request:", e.message);
}
