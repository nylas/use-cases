import inquirer from "inquirer";
import fs from "fs";
import concurrently from "concurrently";
import chalk from "chalk";

console.clear();

const projectRoot = process.cwd();

function print(text, color = "white") {
  console.log(chalk[color](text));
}

async function getUseCases() {
  const useCases = await fs.readdirSync(`${projectRoot}/packages`);
  const selectedUseCase = await inquirer.prompt([
    {
      type: "list",
      name: "usecase",
      message: "Choose a use case:",
      choices: useCases,
    },
  ]);

  return selectedUseCase;
}

async function getFrameworkOptions(useCase) {
  const serverOptions = await fs.readdirSync(
    `${projectRoot}/packages/${useCase}/server`
  );
  const clientOptions = await fs.readdirSync(
    `${projectRoot}/packages/${useCase}/client`
  );

  return { server: serverOptions, client: clientOptions };
}

function installDependencies({ usecase, client, server }) {
  const { result } = concurrently([
    {
      name: "installing client dependencies",
      command: `npm install`,
      cwd: `${projectRoot}/packages/${usecase}/client/${client}`,
    },
    {
      name: "installing server dependencies",
      command: `npm install`,
      cwd: `${projectRoot}/packages/${usecase}/server/${server}`,
    },
  ]);

  return result;
}

async function updateEnvironmentVars({ usecase, server, client }) {
  if (!fs.existsSync(`${projectRoot}/.env`))
    fs.copyFileSync(`${projectRoot}/.env.sample`, `${projectRoot}/.env`);

  const env = await fs.readFileSync(`${projectRoot}/.env`, "utf-8");

  const splitEnv = env.split("\n");

  const editedEnv = splitEnv.map((envVar) => {
    if (envVar.includes("CLIENT_FRAMEWORK="))
      envVar = envVar.split("=")[0] + `="${client}"`;

    if (envVar.includes("SERVER_FRAMEWORK="))
      envVar = envVar.split("=")[0] + `="${server}"`;

    if (envVar.includes("USE_CASE="))
      envVar = envVar.split("=")[0] + `="${usecase}"`;

    return envVar;
  });

  if (!editedEnv.includes("USE_CASE=")) splitEnv.push(`USE_CASE="${usecase}"`);

  if (!editedEnv.includes("CLIENT_FRAMEWORK="))
    splitEnv.push(`CLIENT_FRAMEWORK="${client}"`);

  if (!editedEnv.includes("SERVER_FRAMEWORK="))
    splitEnv.push(`SERVER_FRAMEWORK="${server}"`);

  await fs.writeFileSync(`${projectRoot}/.env`, editedEnv.join("\n"));

  print("\nUpdated .env file! 🎉", "green");
}

async function setup() {
  const { usecase } = await getUseCases();
  const { server, client } = await getFrameworkOptions(usecase);

  const selectedFrameworks = await inquirer.prompt([
    {
      type: "list",
      name: "client",
      message: "Choose a client framework:",
      choices: client,
      prefixColor: "#4169E1",
    },
    {
      type: "list",
      name: "server",
      message: "Choose a server framework:",
      choices: server,
      prefixColor: "#008B8B",
    },
  ]);

  const dependenciesResult = await installDependencies({
    usecase,
    ...selectedFrameworks,
  });

  print("\nSuccessfully installed dependencies! 🎉", "green");
  dependenciesResult.forEach((depResult) => {
    print(
      `${depResult.command.name}: ${depResult.timings.durationSeconds.toFixed(
        2
      )}s`
    );
  });

  await updateEnvironmentVars({ usecase, ...selectedFrameworks });
}

setup();
