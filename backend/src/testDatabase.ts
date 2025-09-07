import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = ':memory:'; // Use in-memory database for tests

export const initTestDatabase = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(TEST_DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Read and execute schema
      const schemaPath = path.join(__dirname, '..', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      db.exec(schema, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(db);
      });
    });
  });
};

export const getTestDatabase = (): sqlite3.Database => {
  return new sqlite3.Database(TEST_DB_PATH);
};