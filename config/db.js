// ==========================================
// PostgreSQL Database Connection
// config/db.js
// ==========================================

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;


// Create PostgreSQL Pool

const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl: process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false
        }
        : false

});


// Test Database Connection

const connectDB = async () => {

    try {

        const client = await pool.connect();

        console.log("✅ PostgreSQL Database Connected");

        client.release();

    } catch (error) {

        console.error(
            "❌ PostgreSQL Connection Failed:",
            error.message
        );

        process.exit(1);

    }

};


// Query Helper

export const query = (text, params) => {

    return pool.query(text, params);

};


export default connectDB;