import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

let testDb: sqlite3.Database | null = null;

export const initTestDatabase = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    // Close existing database if any
    if (testDb) {
      testDb.close();
    }
    
    testDb = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Read and execute schema
      const schemaPath = path.join(__dirname, '..', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      testDb!.exec(schema, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(testDb!);
      });
    });
  });
};

export const getTestDatabase = (): sqlite3.Database => {
  if (!testDb) {
    throw new Error('Test database not initialized. Call initTestDatabase() first.');
  }
  return testDb;
};