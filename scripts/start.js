import concurrently from 'concurrently';
import dotenv from 'dotenv';
dotenv.config();

const projectRoot = process.cwd();

async function start() {
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

start();
