// config/database.js
const { Sequelize } = require('sequelize');
const config = require('./config.json');

const sequelize = new Sequelize(config.development);

module.exports = sequelize;

const pg = require('pg');


const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})