/* eslint-disable max-len */
import inquirer from 'inquirer';
import fs from 'fs';
import concurrently from 'concurrently';
import chalk from 'chalk';

console.clear();

const os = process.platform;

console.log(`

                *///////,                                    ///                                    
             *//  ,//*. ,//           ..                     ///         ..                         
           //* .//,   //, //      ./////////   ///      ///  ///     //////////    /////////.       
        *//  ///      ,// //     ,//,     ///  ///      ///  ///   *//.      .//* ,///.             
      ,/, ,//, *//. ///  //.     *//.     ,//. ///      ///  ///   ///        ///    *//////*       
        ///  //* .//, ,//.       *//.     ,//. ,//*    ,///  *//*  .///      ////  **     ,//.      
      */. *//  ///  ///          *//.     ,//.   //////////    ////  .///////////  ,////////        
        //* .//, ,//.                                   ///                                         
      //   */   .*                                   ////,                                          



Find your client credentials by logging into https://dashboard.nylas.com > Choose Application > App Settings
`);

const projectRoot = process.cwd();
const isSourceRepo = await fs
  .readdirSync(`${projectRoot}`)
  .includes('packages');

function print(text, color = 'white') {
  console.log(chalk[color](text));
}

async function getClientCredentials() {
  const client = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Nylas application client id [enter to skip]:',
    },
    {
      type: 'input',
      name: 'secret',
      message: 'Nylas application client secret [enter to skip]:',
    },
    {
      type: 'input',
      name: 'apiKey',
      message: 'Nylas API key [enter to skip]:',
    },
  ]);

  return client;
}

const ignoreFiles = ['.DS_Store'];

async function getUseCases() {
  const useCases = await fs
    .readdirSync(`${projectRoot}/packages`)
    .filter((file) => !ignoreFiles.includes(file));
  const selectedUseCase = await inquirer.prompt([
    {
      type: 'list',
      name: 'usecase',
      message: 'Choose a use case:',
      choices: useCases,
    },
  ]);

  return selectedUseCase;
}

async function getFrameworkOptions(useCase) {
  const serverOptions = await fs
    .readdirSync(`${projectRoot}/packages/${useCase}/backend`)
    .filter((file) => !ignoreFiles.includes(file));

  const clientOptions = await fs
    .readdirSync(`${projectRoot}/packages/${useCase}/frontend`)
    .filter((file) => !ignoreFiles.includes(file));

  return { server: serverOptions, client: clientOptions };
}

const INSTALLATION_COMMANDS = {
  default: {
    node: 'npm install',
    python:
      'python3 -m venv env && source env/bin/activate && pip install -r requirements.txt',
    ruby: 'bundle install',
    java: './gradlew build',
  },
  win32: {
    node: 'npm install',
    python:
      'python3 -m venv env && .\\env\\Scripts\\activate.bat && pip install -r requirements.txt',
    ruby: 'bundle install',
    java: 'gradlew.bat build',
  },
};

function installDependencies({ usecase, client = null, server = null }) {
  const { result } = concurrently([
    {
      name: 'installing client dependencies',
      command: `npm install`,
      cwd: client
        ? `${projectRoot}/packages/${usecase}/frontend/${client}`
        : `${projectRoot}/src/frontend`,
    },
    {
      name: 'installing server dependencies',
      command: INSTALLATION_COMMANDS[os === 'win32' ? os : 'default'][server],
      cwd: server
        ? `${projectRoot}/packages/${usecase}/backend/${server}`
        : `${projectRoot}/src/backend`,
    },
  ]);

  return result;
}

async function updateEnvironmentVars({ id, secret, apiKey, usecase, server, client }) {
  if (!fs.existsSync(`${projectRoot}/.env`))
    fs.copyFileSync(`${projectRoot}/.env.sample`, `${projectRoot}/.env`);

  const env = await fs.readFileSync(`${projectRoot}/.env`, 'utf-8');

  const splitEnv = env.split('\n');

  const editedEnv = splitEnv.map((envVar) => {
    if (envVar.includes('NYLAS_CLIENT_ID=') && id.length > 0)
      envVar = envVar.split('=')[0] + `="${id}"`;

    if (envVar.includes('NYLAS_CLIENT_SECRET=') && secret.length > 0)
      envVar = envVar.split('=')[0] + `="${secret}"`;

    if (envVar.includes('NYLAS_API_KEY=') && apiKey.length > 0)
      envVar = envVar.split('=')[0] + `="${apiKey}"`;

    if (envVar.includes('CLIENT_FRAMEWORK='))
      envVar = envVar.split('=')[0] + `="${client}"`;

    if (envVar.includes('SERVER_FRAMEWORK='))
      envVar = envVar.split('=')[0] + `="${server}"`;

    if (envVar.includes('USE_CASE='))
      envVar = envVar.split('=')[0] + `="${usecase}"`;

    return envVar;
  });

  if (!editedEnv.includes('USE_CASE=')) splitEnv.push(`USE_CASE="${usecase}"`);

  if (!editedEnv.includes('CLIENT_FRAMEWORK='))
    splitEnv.push(`CLIENT_FRAMEWORK="${client}"`);

  if (!editedEnv.includes('SERVER_FRAMEWORK='))
    splitEnv.push(`SERVER_FRAMEWORK="${server}"`);

  await fs.writeFileSync(`${projectRoot}/.env`, editedEnv.join('\n'));

  print('\nUpdated .env file! 🎉', 'green');
}

async function setupSourceRepo() {
  const { id, secret, apiKey } = await getClientCredentials();
  const { usecase } = await getUseCases();
  const { server, client } = await getFrameworkOptions(usecase);

  const selectedFrameworks = await inquirer.prompt([
    {
      type: 'list',
      name: 'client',
      message: 'Choose a client framework:',
      choices: client,
      prefixColor: '#4169E1',
    },
    {
      type: 'list',
      name: 'server',
      message: 'Choose a server framework:',
      choices: server,
      prefixColor: '#008B8B',
    },
  ]);

  const dependenciesResult = await installDependencies({
    usecase,
    ...selectedFrameworks,
  });

  print('\nSuccessfully installed dependencies! 🎉', 'green');
  dependenciesResult.forEach((depResult) => {
    print(
      `${depResult.command.name}: ${depResult.timings.durationSeconds.toFixed(
        2
      )}s`
    );
  });

  await updateEnvironmentVars({ id, secret, apiKey, usecase, ...selectedFrameworks });
}

async function setupDownloadedRepo() {
  const ignoredRootDirs = ['node_modules', 'scripts'];

  const rootFiles = await fs.readdirSync(projectRoot);

  const usecase = rootFiles.find(
    (file) =>
      fs.lstatSync(file).isDirectory() && !ignoredRootDirs.includes(file)
  );

  installDependencies({ usecase });
}

if (!process.env.CI) {
  if (isSourceRepo) setupSourceRepo();
  else setupDownloadedRepo();
}
