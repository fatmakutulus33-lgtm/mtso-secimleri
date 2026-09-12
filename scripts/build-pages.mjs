import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const output = "dist/pages";
const binding = {
  binding: "DB",
  database_name: "mtso-secimleri-db",
  database_id: "20e6cf8b-e55f-49c8-8d1a-16fae06a7e4e",
};

// Vinext writes a generated deploy config. Normalize its D1 binding so the
// Pages deployment stage sees the same single binding as the source config.
const serverConfigPath = "dist/server/wrangler.json";
const serverConfig = JSON.parse(await readFile(serverConfigPath, "utf8"));
serverConfig.d1_databases = [binding];
serverConfig.compatibility_flags = [...new Set(serverConfig.compatibility_flags ?? [])];
// Cloudflare Pages uses the output directory and its _worker.js entrypoint.
// Vinext adds Worker-only fields which Pages rejects during deployment.
delete serverConfig.main;
delete serverConfig.rules;
delete serverConfig.assets;
await writeFile(serverConfigPath, JSON.stringify(serverConfig));

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp("dist/server", output, {
  recursive: true,
  filter: (source) => !source.endsWith("wrangler.json"),
});
await cp("dist/client", output, { recursive: true });

await writeFile(join(output, "_worker.js"), `import app from "./index.js";

export default {
  fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/_next/") || path.startsWith("/posters/") || path === "/favicon.svg") {
      return env.ASSETS.fetch(request);
    }
    return app.fetch(request, env, ctx);
  },
};
`);