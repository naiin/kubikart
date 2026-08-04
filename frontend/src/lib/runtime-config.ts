import "server-only";

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
}

export function requireRuntimeEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Required server runtime configuration is missing: ${name}`);
  }
  return value;
}

export function requireRuntimeEnvPair(first: string, second: string): [string, string] {
  return [requireRuntimeEnv(first), requireRuntimeEnv(second)];
}
