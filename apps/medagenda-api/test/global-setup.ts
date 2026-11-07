import { execSync } from 'node:child_process';
import * as path from 'node:path';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://lab:lab_local_dev_only@localhost:5432/medagenda_test?schema=public';

/** Aplica as migrations no banco de teste antes da suíte e2e */
export default function globalSetup(): void {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
