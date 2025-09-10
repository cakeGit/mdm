import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { initMigrations, runMigrations } from './migrations';

const DB_PATH = process.env.DB_PATH || './database.sqlite';

export const initDatabase = (): Promise<sqlite3.Database> => {
  return new Promise(async (resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        // Read and execute schema only if tables don't exist
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Add IF NOT EXISTS to the schema
        const modifiedSchema = schema.replace(/CREATE TABLE /g, 'CREATE TABLE IF NOT EXISTS ');
        
        db.exec(modifiedSchema, async (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          try {
            // Initialize migrations system
            initMigrations();
            
            // Run any pending migrations
            await runMigrations();
            
            console.log('Database initialized successfully');
            resolve(db);
          } catch (migrationError) {
            console.error('Migration error:', migrationError);
            reject(migrationError);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  });
};

export const getDatabase = (): sqlite3.Database => {
  return new sqlite3.Database(DB_PATH);
};