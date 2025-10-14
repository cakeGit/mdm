import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { getMigrations } from './migrations';

let testDb: sqlite3.Database | null = null;

export const initTestDatabase = (): Promise<sqlite3.Database> => {
  return new Promise(async (resolve, reject) => {
    // Close existing database if any
    if (testDb) {
      testDb.close();
    }
    
    testDb = new sqlite3.Database(':memory:', async (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Read and execute schema
      const schemaPath = path.join(__dirname, '..', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      testDb!.exec(schema, async (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Apply all migrations
        try {
          const migrations = getMigrations();
          for (const migration of migrations) {
            await new Promise<void>((resolveM, rejectM) => {
              testDb!.exec(migration.up, (err) => {
                if (err) {
                  // Ignore duplicate column errors in test environment
                  if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
                    console.log(`⚠️  Test Migration ${migration.id}: ${err.message} (continuing)`);
                    resolveM();
                  } else {
                    rejectM(err);
                  }
                } else {
                  resolveM();
                }
              });
            });
          }
          resolve(testDb!);
        } catch (migrationError) {
          reject(migrationError);
        }
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