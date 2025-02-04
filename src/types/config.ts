// src/types/config.ts
export interface DatabaseConfig {
  database: string;
  username: string;
  password: string;
  host: string;
  dialect: 'mysql';
  port: number;
  retry: {
    max: number;
  };
  dialectOptions: {
    connectTimeout: number;
  };
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  logging: boolean | ((msg: string) => void);
}

export interface TwitterConfig {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  accessToken?: string;
  accessSecret?: string;
}
