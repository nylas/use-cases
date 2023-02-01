/* eslint-disable max-len */
import fs from 'fs';
import concurrently from 'concurrently';
import dotenv from 'dotenv';

dotenv.config();

const os = process.platform;

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

  const SERVER_FRAMEWORK = process.env.SERVER_FRAMEWORK;

  const START_SERVER_COMMANDS = {
    default: {
      node: 'npm run start',
      python:
        'source env/bin/activate && export FLASK_APP=app.py && python3 -m flask run --port=9000',
    },
    win32: {
      node: 'npm run start',
      python:
        'env\\Scripts\\activate.bat && $env:FLASK_APP=app.py" && python -m flask run --port=9000',
    },
  };

  const { result } = concurrently([
    {
      command: 'npm run start',
      name: `start ${process.env.CLIENT_FRAMEWORK}`,
      cwd: `${projectRoot}/packages/${process.env.USE_CASE}/frontend/${process.env.CLIENT_FRAMEWORK}`,
    },
    {
      command:
        START_SERVER_COMMANDS[os === 'win32' ? os : 'default'][
          SERVER_FRAMEWORK
        ],
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
