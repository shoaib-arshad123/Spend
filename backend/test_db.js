import sql from 'mssql/msnodesqlv8.js';

const config = {
  connectionString: "server=localhost\\SQLEXPRESS;Database=expense_tracker;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}"
};

console.log("Connecting...");
sql.connect(config)
  .then(() => {
    console.log("✅ connected");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ error:", err);
    process.exit(1);
  });
