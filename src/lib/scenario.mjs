import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { copyDirectory, listFiles, readJson } from "./files.mjs";
import { runProcess } from "./process.mjs";
import { repositoryRoot } from "./root.mjs";

export const defaultScenarioId = "tenant-theme-regression";
export const pilotScenarioIds = Object.freeze([
  "small-local-bug",
  "cross-stack-regression",
  "tenant-memory-pitfall",
  "stale-memory-adversarial"
]);

export async function loadScenario(id = defaultScenarioId) {
  const directory = path.join(repositoryRoot, "scenarios", id);
  const scenario = await readJson(path.join(directory, "scenario.json"));
  validateScenario(scenario);
  const templateDirectory = path.resolve(directory, scenario.template ?? "template");
  const scenariosRoot = path.resolve(repositoryRoot, "scenarios");
  if (templateDirectory !== scenariosRoot && !templateDirectory.startsWith(`${scenariosRoot}${path.sep}`)) {
    throw new Error(`Scenario template escapes scenarios directory: ${scenario.template}`);
  }
  return { ...scenario, directory, templateDirectory };
}

export async function materializeScenario(scenario, destination, options = {}) {
  const seed = String(options.seed ?? "fixture-default");
  await copyDirectory(scenario.templateDirectory ?? path.join(scenario.directory, "template"), destination);
  await generateDomainNoise(destination, scenario.noise, seed);
  await generateTenantNoise(destination, scenario.noise, seed);
  return listFiles(destination);
}

export async function runScenarioOracle(scenario, workspace) {
  if (!scenario.oracleCommand) return null;
  return runExternalScenarioCommand(scenario, scenario.oracleCommand, workspace);
}

export async function applyCanonicalRepair(scenario, workspace) {
  if (!scenario.repairCommand) throw new Error(`Scenario ${scenario.id} has no repairCommand`);
  return runExternalScenarioCommand(scenario, scenario.repairCommand, workspace);
}

function validateScenario(scenario) {
  const requiredStrings = ["id", "title", "task"];
  for (const key of requiredStrings) {
    if (typeof scenario[key] !== "string" || !scenario[key].trim()) {
      throw new Error(`Scenario is missing ${key}`);
    }
  }
  for (const key of ["testCommand", "expectedChangedFiles", "forbiddenChangedFiles"]) {
    if (!Array.isArray(scenario[key]) || scenario[key].length === 0) {
      throw new Error(`Scenario is missing ${key}`);
    }
  }
  for (const key of ["oracleCommand", "repairCommand"]) {
    if (scenario[key] !== undefined && (!Array.isArray(scenario[key]) || scenario[key].length === 0)) {
      throw new Error(`Scenario ${key} must be a non-empty command array`);
    }
  }
}

async function generateDomainNoise(root, noise = {}, seed) {
  for (const domain of noise.domains ?? []) {
    for (let index = 1; index <= (noise.modulesPerDomain ?? 0); index += 1) {
      const suffix = String(index).padStart(3, "0");
      const target = path.join(root, "packages", domain, "src", `module-${suffix}.mjs`);
      const exportName = `${camel(domain)}Module${suffix}`;
      const nonce = seededInteger(seed, `domain:${domain}:${index}`);
      const source = [
        `export function ${exportName}(input) {`,
        `  return { domain: "${domain}", module: ${index}, nonce: ${nonce}, input };`,
        "}",
        ""
      ].join("\n");
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, source, "utf8");
    }
  }
}

async function generateTenantNoise(root, noise = {}, seed) {
  for (let index = 1; index <= (noise.tenantCount ?? 0); index += 1) {
    const suffix = String(index).padStart(3, "0");
    const target = path.join(root, "clients", `tenant-${suffix}`, "theme.mjs");
    const revision = seededInteger(seed, `tenant:${index}`);
    const source = [
      `export const tenant${suffix}Theme = Object.freeze({`,
      `  metadata: Object.freeze({ label: "Tenant ${suffix}", revision: ${revision} })`,
      "});",
      ""
    ].join("\n");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, source, "utf8");
  }
}

function camel(value) {
  return value.replace(/[^a-z0-9]+(.)/g, (_, letter) => letter.toUpperCase());
}

function seededInteger(seed, label) {
  const digest = createHash("sha256").update(`${seed}\0${label}`).digest();
  return digest.readUInt32BE(0);
}

function runExternalScenarioCommand(scenario, command, workspace) {
  return runProcess(command[0], [...command.slice(1), workspace], {
    cwd: scenario.directory,
    unsetEnv: ["NODE_TEST_CONTEXT"]
  });
}
