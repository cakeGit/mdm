import fs from 'fs';
import path from 'path';
import { getDatabase } from './database';

export interface Migration {
  id: number;
  name: string;
  up: string;
  down: string;
}

const MIGRATIONS_PATH = path.join(__dirname, '../migrations');

export function initMigrations() {
  const db = getDatabase();
  
  // Create migrations table if it doesn't exist
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

export function getMigrations(): Migration[] {
  if (!fs.existsSync(MIGRATIONS_PATH)) {
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_PATH)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files.map(file => {
    const content = fs.readFileSync(path.join(MIGRATIONS_PATH, file), 'utf8');
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    
    if (!match) {
      throw new Error(`Invalid migration file name: ${file}`);
    }

    const [, idStr, name] = match;
    const sections = content.split('-- DOWN --');
    
    return {
      id: parseInt(idStr, 10),
      name,
      up: sections[0].replace('-- UP --', '').trim(),
      down: sections[1] ? sections[1].trim() : ''
    };
  });
}

export function getExecutedMigrations(): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all('SELECT id FROM schema_migrations ORDER BY id', (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => row.id));
      }
    });
  });
}

export function executeMigration(migration: Migration): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      try {
        // Execute the migration
        db.exec(migration.up, (err) => {
          if (err) {
            // Log the error but don't fail if it's a "column already exists" type error
            if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
              console.log(`⚠️  Migration ${migration.id}_${migration.name}: ${err.message} (continuing)`);
            } else {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
          }
          
          // Record the migration
          db.run(
            'INSERT OR IGNORE INTO schema_migrations (id, name) VALUES (?, ?)',
            [migration.id, migration.name],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
              } else {
                db.run('COMMIT');
                resolve();
              }
            }
          );
        });
      } catch (error) {
        db.run('ROLLBACK');
        reject(error);
      }
    });
  });
}

export async function runMigrations() {
  const allMigrations = getMigrations();
  const executedMigrations = await getExecutedMigrations();
  
  const pendingMigrations = allMigrations.filter(
    migration => !executedMigrations.includes(migration.id)
  );

  if (pendingMigrations.length === 0) {
    console.log('No pending migrations');
    return;
  }

  console.log(`Running ${pendingMigrations.length} pending migrations...`);
  
  for (const migration of pendingMigrations) {
    try {
      await executeMigration(migration);
      console.log(`✅ Executed migration ${migration.id}_${migration.name}`);
    } catch (error) {
      console.error(`❌ Failed to execute migration ${migration.id}_${migration.name}:`, error);
      throw error;
    }
  }
  
  console.log('All migrations completed successfully');
}