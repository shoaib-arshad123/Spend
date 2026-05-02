import sql from 'msnodesqlv8';

const connectionString = "server=localhost\\SQLEXPRESS;Database=expense_tracker;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";
const connectionString2 = "server=localhost\\SQLEXPRESS;Database=expense_tracker;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

console.log("Connecting with ODBC 17...");
sql.open(connectionString, (err, conn) => {
  if (err) {
    console.error("ODBC 17 failed:", err);
    console.log("Connecting with Native Client 11.0...");
    sql.open(connectionString2, (err2, conn2) => {
      if (err2) {
        console.error("Native Client 11.0 failed:", err2);
      } else {
        console.log("Native Client 11.0 succeeded");
      }
    });
  } else {
    console.log("ODBC 17 succeeded");
  }
});
