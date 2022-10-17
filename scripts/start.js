/* eslint-disable max-len */
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
      cwd: `${projectRoot}/packages/${process.env.USE_CASE}/frontend/${process.env.CLIENT_FRAMEWORK}`,
    },
    {
      command: 'npm run start',
      name: `start ${process.env.SERVER_FRAMEWORK}`,
      cwd: `${projectRoot}/packages/${process.env.USE_CASE}/backend/${process.env.SERVER_FRAMEWORK}`,
    },
  ]);

  result.catch(() => {});
}

function startDownloadedRepo() {
  const { result } = concurrently([
    {
      command: 'npm run start',
      name: `start client`,
      cwd: `${projectRoot}/src/frontend`,
    },
    {
      command: 'npm run start',
      name: `start server`,
      cwd: `${projectRoot}/src/backend`,
    },
  ]);

  result.catch(() => {});
}

if (isSourceRepo) startSourceRepo();
else startDownloadedRepo();
