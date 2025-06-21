const fs = require('fs-extra');
const path = require('path');
const esbuild = require('esbuild');

const packagesDir = path.join(__dirname, '..', 'packages');
const commonDir = path.join(packagesDir, 'common');
const outDir = path.join(__dirname, '..', 'dist');

const chromeDir = path.join(packagesDir, 'chrome');
const firefoxDir = path.join(packagesDir, 'firefox');

// This function will bundle the common logic and the popup script together
async function bundleScripts(outDir, commonDir) {
  const commonLibEntry = path.join(commonDir, 'src', 'index.ts');
  const popupScriptEntry = path.join(commonDir, 'src', 'popup.ts');

  // We are creating an IIFE bundle where the common logic is attached
  // to `window.ext` and the popup logic just runs.
  const commonBundle = await esbuild.build({
    entryPoints: [commonLibEntry],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'ext',
    target: 'es2020',
    alias: {
      'node:crypto': path.join(commonDir, 'src', 'crypto-shim.js'),
    },
    external: ['email-alias-core'],
    loader: { '.ts': 'ts' },
  });

  // Since esbuild can't directly bundle a separate script to run after the IIFE,
  // we compile the popup script separately and concatenate them.
  const popupBundle = await esbuild.build({
    entryPoints: [popupScriptEntry],
    bundle: true,
    write: false,
    format: 'esm', // or 'iife' if it doesn't have exports
    target: 'es2020',
    loader: { '.ts': 'ts' },
  });

  const finalScript =
    commonBundle.outputFiles[0].text + '\n' + popupBundle.outputFiles[0].text;

  await fs.writeFile(path.join(outDir, 'popup.js'), finalScript);
}

async function buildExtension(buildConfig) {
  const { name, packageDir } = buildConfig;
  const extensionOutDir = path.join(outDir, name);
  const publicDir = path.join(packageDir, 'public');
  const commonPublicDir = path.join(commonDir, 'public');

  console.log(`Building ${name} extension...`);

  try {
    // 1. Clean and create output directory
    await fs.emptyDir(extensionOutDir);
    console.log(`[${name}] Cleaned output directory.`);

    // 2. Copy the browser-specific manifest.json.
    await fs.copy(
      path.join(publicDir, 'manifest.json'),
      path.join(extensionOutDir, 'manifest.json')
    );
    console.log(`[${name}] Copied manifest.json.`);

    // 3. Copy all shared public assets (HTML, icons) from the common package.
    await fs.copy(commonPublicDir, extensionOutDir);
    console.log(`[${name}] Copied shared assets from common package.`);

    // 4. Bundle and combine scripts
    await bundleScripts(extensionOutDir, commonDir);
    console.log(`[${name}] Successfully built and bundled scripts.`);
  } catch (err) {
    console.error(`[${name}] Build failed:`, err);
    process.exit(1);
  }
}

async function main() {
  await fs.emptyDir(outDir);
  console.log('Cleaned root dist directory.');

  const builds = [
    { name: 'chrome', packageDir: chromeDir },
    { name: 'firefox', packageDir: firefoxDir },
  ];

  for (const buildConfig of builds) {
    await buildExtension(buildConfig);
  }

  console.log('All extensions built successfully!');
}

main().catch((err) => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});
