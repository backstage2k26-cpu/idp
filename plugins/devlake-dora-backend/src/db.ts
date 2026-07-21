import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: '127.0.0.1', // change if needed
  port: 3306,
  user: 'root',
  password: 'admin',
  database: 'lake',

  waitForConnections: true,
  connectionLimit: 10,
});