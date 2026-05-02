import sql from 'mssql/msnodesqlv8.js';

const config = {
  connectionString: "server=localhost\\SQLEXPRESS;Database=expense_tracker;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}"
};

async function test() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('email', 'test777@test.com')
      .input('password', 'hash')
      .input('name', 'Name')
      .query(`
        INSERT INTO users (email, password, name)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.avatar, INSERTED.photo
        VALUES (@email, @password, @name)
      `);
    console.log(result);
    process.exit(0);
  } catch(e) {
    console.error("ERROR", e);
    process.exit(1);
  }
}
test();
