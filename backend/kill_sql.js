import sql from 'mssql/msnodesqlv8.js';
const config = { connectionString: "server=localhost\\SQLEXPRESS;Database=expense_tracker;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}" };
sql.connect(config).then(pool => {
  return pool.request().query(`
    DECLARE @kill varchar(8000) = '';
    SELECT @kill = @kill + 'kill ' + CONVERT(varchar(5), session_id) + ';'
    FROM sys.dm_exec_sessions
    WHERE database_id  = db_id('expense_tracker') AND session_id <> @@SPID;
    EXEC(@kill);
  `);
}).then(() => {
  console.log('Killed other sessions');
  process.exit(0);
}).catch(console.error);
