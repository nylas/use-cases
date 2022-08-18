import fs from 'fs';
import concurrently from 'concurrently';
import dotenv from 'dotenv';

dotenv.config();

const projectRoot = process.cwd();
const isSourceRepo = await fs
  .readdirSync(`${projectRoot}`)
  .includes('packages');

async function startSourceRepo() {
  if (
    !process.env.CLIENT_FRAMEWORK ||
    !process.env.SERVER_FRAMEWORK ||
    !process.env.USE_CASE
  ) {
    console.log(
      'Missing one of the following env variables: CLIENT_FRAMEWORK, SERVER_FRAMEWORK, USE_CASE'
    );
    process.exit(1);
  }

  const { result } = concurrently([
    {
      command: 'npm run start',
      name: `start ${process.env.CLIENT_FRAMEWORK}`,
      cwd: `${projectRoot}/packages/${process.env.USE_CASE}/client/${process.env.CLIENT_FRAMEWORK}`,
    },
    {
      command: 'npm run start',
      name: `start ${process.env.SERVER_FRAMEWORK}`,
      cwd: `${projectRoot}/packages/${process.env.USE_CASE}/server/${process.env.SERVER_FRAMEWORK}`,
    },
  ]);

  result.catch((error) => {
    console.log('error:', error);
  });
}

function startDownloadedRepo() {
  const { result } = concurrently([
    {
      command: 'npm run start',
      name: `start client`,
      cwd: `${projectRoot}/src/client`,
    },
    {
      command: 'npm run start',
      name: `start server`,
      cwd: `${projectRoot}/src/server`,
    },
  ]);

  result.catch(() => {});
}

if (isSourceRepo) startSourceRepo();
else startDownloadedRepo();
