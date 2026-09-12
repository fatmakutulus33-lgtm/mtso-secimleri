import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const output = "dist/pages";
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