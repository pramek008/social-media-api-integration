// src/utils/logger.ts
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(new Date().toISOString(), 'INFO:', message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(new Date().toISOString(), 'ERROR:', message, ...args);
  },
};
