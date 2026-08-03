import { access, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

/** Packages the Vite SPA as a static-assets Cloudflare Worker for Sites. */
export function sites(): Plugin {
  let projectRoot = process.cwd();
  let outputRoot = resolve(projectRoot, "dist");

  return {
    name: "sites",
    apply: "build",
    configResolved(config) {
      projectRoot = resolve(config.root, "..");
      outputRoot = resolve(config.root, "..", "dist");
    },
    async closeBundle() {
      const hostingConfig = resolve(projectRoot, ".openai", "hosting.json");
      const workerSource = resolve(projectRoot, "frontend", "worker", "index.js");
      const serverDirectory = resolve(outputRoot, "server");
      const metadataDirectory = resolve(outputRoot, ".openai");
      const legacyClientFiles = [
        resolve(outputRoot, "index.html"),
        resolve(outputRoot, "assets"),
      ];

      await rm(serverDirectory, { recursive: true, force: true });
      await mkdir(serverDirectory, { recursive: true });
      await cp(workerSource, resolve(serverDirectory, "index.js"));

      // Remove the previous flat-output layout when rebuilding an existing
      // workspace. Sites serves client assets from dist/client.
      await Promise.all(
        legacyClientFiles.map((path) => rm(path, { recursive: true, force: true })),
      );

      await rm(metadataDirectory, { recursive: true, force: true });
      if (await exists(hostingConfig)) {
        await mkdir(metadataDirectory, { recursive: true });
        await cp(hostingConfig, resolve(metadataDirectory, "hosting.json"));
      }
    },
  };
}
