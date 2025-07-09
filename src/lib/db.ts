'use server';
import mysql from 'mysql2/promise';
import { getDbConfig } from './db-config';

const config = getDbConfig();

// Create the connection pool. The pool-specific settings are optional.
const pool = mysql.createPool({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
  port: config.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
