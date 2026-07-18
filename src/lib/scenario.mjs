import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { copyDirectory, listFiles, readJson } from "./files.mjs";
import { repositoryRoot } from "./root.mjs";

export const defaultScenarioId = "tenant-theme-regression";

export async function loadScenario(id = defaultScenarioId) {
  const directory = path.join(repositoryRoot, "scenarios", id);
  const scenario = await readJson(path.join(directory, "scenario.json"));
  validateScenario(scenario);
  return { ...scenario, directory };
}
export async function materializeScenario(scenario, destination) {
  await copyDirectory(path.join(scenario.directory, "template"), destination);
  await generateDomainNoise(destination, scenario.noise);
  await generateTenantNoise(destination, scenario.noise);
  return listFiles(destination);
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
}

async function generateDomainNoise(root, noise) {
  for (const domain of noise.domains) {
    for (let index = 1; index <= noise.modulesPerDomain; index += 1) {
      const suffix = String(index).padStart(3, "0");
      const target = path.join(root, "packages", domain, "src", `module-${suffix}.mjs`);
      const exportName = `${camel(domain)}Module${suffix}`;
      const source = [
        `export function ${exportName}(input) {`,
        `  return { domain: "${domain}", module: ${index}, input };`,
        "}",
        ""
      ].join("\n");
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, source, "utf8");
    }
  }
}

async function generateTenantNoise(root, noise) {
  for (let index = 1; index <= noise.tenantCount; index += 1) {
    const suffix = String(index).padStart(3, "0");
    const target = path.join(root, "clients", `tenant-${suffix}`, "theme.mjs");
    const source = [
      `export const tenant${suffix}Theme = Object.freeze({`,
      `  metadata: Object.freeze({ label: "Tenant ${suffix}", revision: ${index} })`,
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
