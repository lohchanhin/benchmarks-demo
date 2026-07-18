export function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const flags = new Map();
  const positional = [];

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const equalsAt = token.indexOf("=");
    if (equalsAt !== -1) {
      flags.set(token.slice(2, equalsAt), token.slice(equalsAt + 1));
      continue;
    }

    const key = token.slice(2);
    const next = rest[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags.set(key, next);
      index += 1;
    } else {
      flags.set(key, true);
    }
  }

  return { command, flags, positional };
}
export function stringFlag(flags, name, fallback) {
  const value = flags.get(name);
  if (value === undefined) return fallback;
  if (value === true) throw new Error(`--${name} requires a value`);
  return String(value);
}

export function booleanFlag(flags, name) {
  return flags.get(name) === true || flags.get(name) === "true";
}

export function enumFlag(flags, name, values, fallback) {
  const value = stringFlag(flags, name, fallback);
  if (!values.includes(value)) {
    throw new Error(`--${name} must be one of: ${values.join(", ")}`);
  }
  return value;
}
