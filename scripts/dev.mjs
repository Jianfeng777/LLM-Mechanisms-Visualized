import { spawn } from "node:child_process";

const commands = [
  ["api", "node", ["server.mjs"]],
  ["vite", process.platform === "win32" ? "corepack.cmd" : "corepack", ["pnpm", "dev:vite"]]
];

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    env: process.env
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  return child;
});

const shutdown = () => {
  for (const child of children) {
    child.kill();
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
