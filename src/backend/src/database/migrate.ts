import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { dbManager } from './connection.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  id: string;
  filename: string;
  applied_at?: Date;
}

class MigrationRunner {
  private migrationsDir: string;

  constructor() {
    this.migrationsDir = join(__dirname, '../../..', 'data', 'migrations');
  }

  async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await dbManager.query(query);
    logger.info('Migrations table created or already exists');
  }

  async getAppliedMigrations(): Promise<string[]> {
    const result = await dbManager.query(
      'SELECT filename FROM migrations ORDER BY applied_at ASC'
    );
    return result.rows.map((row: any) => row.filename);
  }

  async runMigration(filename: string): Promise<void> {
    try {
      const migrationPath = join(this.migrationsDir, filename);
      const migrationSQL = readFileSync(migrationPath, 'utf8');

      logger.info(`Running migration: ${filename}`);

      await dbManager.transaction(async (client) => {
        // Execute the migration
        await client.query(migrationSQL);

        // Record the migration
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [
          filename,
        ]);
      });

      logger.info(`Migration completed: ${filename}`);
    } catch (error) {
      logger.error(`Migration failed: ${filename}`, error);
      throw error;
    }
  }

  async runPendingMigrations(): Promise<void> {
    try {
      await dbManager.connect();
      await this.createMigrationsTable();

      const appliedMigrations = await this.getAppliedMigrations();
      logger.info(`Found ${appliedMigrations.length} applied migrations`);

      // For now, we'll just have the initial schema migration
      const availableMigrations = ['001_initial_schema.sql'];

      const pendingMigrations = availableMigrations.filter(
        (migration) => !appliedMigrations.includes(migration)
      );

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Running ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration runner failed:', error);
      throw error;
    }
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new MigrationRunner();

  runner
    .runPendingMigrations()
    .then(() => {
      logger.info('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration process failed:', error);
      process.exit(1);
    });
}

export { MigrationRunner };
