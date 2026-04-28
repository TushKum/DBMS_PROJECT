#!/usr/bin/env node
// Thin platform-aware wrapper around `docker compose`.
// On Linux, automatically merges compose.linux.yaml so we get host networking
// (firewalld on Fedora/RHEL drops the bridge). Everywhere else, plain compose.
//
// Usage:
//   node scripts/docker.mjs up -d --wait
//   node scripts/docker.mjs down
//   node scripts/docker.mjs logs -f mysql
//   node scripts/docker.mjs exec -it mysql mysql -ustockflix -pstockflix_pw stockflix

import { spawnSync } from "node:child_process";
import { platform } from "node:os";

const isLinux = platform() === "linux";

const composeArgs = ["compose", "-f", "compose.yaml"];
if (isLinux) composeArgs.push("-f", "compose.linux.yaml");

const finalArgs = [...composeArgs, ...process.argv.slice(2)];
const result = spawnSync("docker", finalArgs, { stdio: "inherit" });

if (result.error) {
  console.error("Failed to invoke docker:", result.error.message);
  console.error("Is Docker installed and running?");
  process.exit(1);
}

process.exit(result.status ?? 0);
