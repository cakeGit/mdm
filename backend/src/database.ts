import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { initMigrations, runMigrations } from './migrations';

const DB_PATH = process.env.DB_PATH || './database.sqlite';

export const initDatabase = (): Promise<sqlite3.Database> => {
  return new Promise(async (resolve, reject) => {
    const resolvedDbPath = path.resolve(DB_PATH);
    const dbDir = path.dirname(resolvedDbPath);

    try {
      // ensure parent directory exists
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (dirErr) {
      const msg = dirErr instanceof Error ? dirErr.message : String(dirErr);
      reject(new Error(`Cannot create DB directory ${dbDir}: ${msg}`));
      return;
    }

    try {
      // ensure the DB file can be created/opened (create empty file if missing)
      const fd = fs.openSync(resolvedDbPath, 'a');
      fs.closeSync(fd);
    } catch (fileErr) {
      const msg = fileErr instanceof Error ? fileErr.message : String(fileErr);
      reject(new Error(`Cannot create/open DB file ${resolvedDbPath}: ${msg}`));
      return;
    }

    const db = new sqlite3.Database(resolvedDbPath, async (err) => {
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
  return new sqlite3.Database(path.resolve(DB_PATH));
};