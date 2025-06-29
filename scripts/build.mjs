import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import fs from "fs-extra";

// --- Path Definitions ---
// Use import.meta.url to get the path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// `projectRoot` is the 'temp_code' directory, which is one level up from 'scripts'
const projectRoot = path.resolve(__dirname, "..");
const packagesDir = path.join(projectRoot, "packages");
const outDir = path.join(projectRoot, "dist");

// Specific package paths
const commonDir = path.join(packagesDir, "common");
const chromeDir = path.join(packagesDir, "chrome");
const firefoxDir = path.join(packagesDir, "firefox");

// --- ESBuild Configuration ---
// This is a shared configuration for bundling the extension's scripts.
const esbuildConfig = {
  entryPoints: [
    path.join(commonDir, "src", "popup.ts"),
    path.join(commonDir, "src", "options.ts"),
    path.join(commonDir, "src", "background.ts"),
    path.join(commonDir, "src", "dialog.ts"),
  ],
  bundle: true,
  format: "esm", // Use ES modules for modern extensions
  target: "es2020",
  loader: { ".ts": "ts" },
  // The 'outdir' will be specified dynamically for each browser build
};

/**
 * Builds a single browser extension based on the provided configuration.
 * @param {object} buildConfig - The configuration for the build.
 * @param {string} buildConfig.name - The name of the browser (e.g., 'chrome').
 * @param {string} buildConfig.packageDir - Path to the browser-specific package dir.
 */
async function buildExtension(buildConfig) {
  const { name, packageDir } = buildConfig;
  const extensionOutDir = path.join(outDir, name);
  const commonPublicDir = path.join(commonDir, "public");
  const browserPublicDir = path.join(packageDir, "public");

  console.log(`\nBuilding "${name}" extension...`);

  try {
    // 1. Clean and create the output directory for the browser.
    await fs.emptyDir(extensionOutDir);
    console.log(`[${name}] Cleaned output directory: ${extensionOutDir}`);

    // 2. Copy all shared public assets (HTML, CSS, etc.) from the common package.
    await fs.copy(commonPublicDir, extensionOutDir);
    console.log(
      `[${name}] Copied shared assets from 'packages/common/public'.`,
    );

    // 3. Copy the browser-specific manifest.json.
    const manifestSrc = path.join(browserPublicDir, "manifest.json");
    const manifestDest = path.join(extensionOutDir, "manifest.json");
    await fs.copy(manifestSrc, manifestDest);
    console.log(`[${name}] Copied browser-specific manifest.json.`);

    // 4. Bundle TypeScript files into JavaScript using esbuild.
    await esbuild.build({
      ...esbuildConfig,
      outdir: extensionOutDir, // Set the output directory for the bundled JS
    });
    console.log(`[${name}] Successfully bundled TypeScript scripts.`);
    console.log(
      `[${name}] Build completed! Find the artifacts in: ${extensionOutDir}`,
    );
  } catch (err) {
    console.error(`[${name}] Build failed:`, err);
    process.exit(1); // Exit with an error code
  }
}

/**
 * Main function to orchestrate the build process.
 */
async function main() {
  // Get command-line arguments to allow building a specific browser
  const args = process.argv.slice(2);
  const buildTarget = args[0]; // e.g., 'chrome', 'firefox', or undefined

  // Clean the root dist directory before starting any build.
  await fs.emptyDir(outDir);
  console.log('Cleaned root "dist" directory.');

  const builds = {
    chrome: { name: "chrome", packageDir: chromeDir },
    firefox: { name: "firefox", packageDir: firefoxDir },
  };

  if (buildTarget) {
    if (builds[buildTarget]) {
      // Build only the specified target
      await buildExtension(builds[buildTarget]);
    } else {
      console.error(
        `Error: Unknown build target "${buildTarget}". Available targets are: ${Object.keys(builds).join(", ")}`,
      );
      process.exit(1);
    }
  } else {
    // Build all available targets
    for (const buildConfig of Object.values(builds)) {
      await buildExtension(buildConfig);
    }
  }

  console.log("\n✅ All builds completed successfully!");
}

// Run the main function and handle any top-level errors.
main().catch((err) => {
  console.error("An unexpected error occurred during the build process:", err);
  process.exit(1);
});
