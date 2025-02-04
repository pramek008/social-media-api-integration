import { Dialect } from "sequelize";
import { DatabaseConfig } from "../types/config";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnv = ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST"];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    throw new Error(`Environment variable ${env} is not set`);
  }
});

// Database configuration
const config: DatabaseConfig = {
  database: process.env.DB_NAME || "default_db",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  host: process.env.DB_HOST || "localhost",
  dialect: "mysql",  // Add type assertion
  port: parseInt(process.env.DB_PORT || "3306", 10),  // Add explicit port
  retry: {  // Add retry logic
    max: 5
  },
  dialectOptions: {
    connectTimeout: 30000,  // Increase timeout
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,  // Increase from 30000
    idle: 10000,
  },
  logging: process.env.NODE_ENV === "development" ? (msg: string) => console.log(msg) : false
};

// Development-specific configurations
if (process.env.NODE_ENV === "development") {
  Object.assign(config, {
    define: {
      timestamps: true,
      underscored: true,
    },
    dialectOptions: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
      supportBigNumbers: true,
      bigNumberStrings: true,
    },
  });
}

// Production-specific configurations
if (process.env.NODE_ENV === "production") {
  Object.assign(config, {
    dialectOptions: process.env.DB_SSL === "true"
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  });
}

export default config;
