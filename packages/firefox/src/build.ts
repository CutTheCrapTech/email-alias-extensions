// @ts-expect-error: esbuild has no types, this import is required for build
import esbuild from 'esbuild';
import fs from 'fs-extra';
import path from 'path';

const isWatchMode = process.argv.includes('--watch');
const outDir = path.join(__dirname, 'dist');
const chromePackageDir = path.join(__dirname, '../chrome');
const commonPackageDir = path.join(__dirname, '../common');

// Define source files
const staticFiles = ['manifest.json'];
// Re-use assets from the chrome package
const sharedStaticFiles = ['popup.html', 'icons'];

// The entry point for the common library logic
const commonLibEntry = path.join(commonPackageDir, 'src/index.ts');
// Re-use the popup script from the chrome package
const popupScriptEntry = path.join(chromePackageDir, 'popup.ts');

async function build(): Promise<void> {
  try {
    // 1. Ensure the output directory is clean
    await fs.emptyDir(outDir);
    console.log('Cleaned output directory.');

    // 2. Copy Firefox-specific static assets
    for (const file of staticFiles) {
      await fs.copy(
        path.join(__dirname, file),
        path.join(outDir, path.basename(file))
      );
    }
    console.log('Copied Firefox-specific static assets.');

    // 3. Copy shared static assets from the chrome package
    for (const file of sharedStaticFiles) {
      await fs.copy(
        path.join(chromePackageDir, file),
        path.join(outDir, path.basename(file))
      );
    }
    console.log('Copied shared static assets.');

    // 4. Bundle the common library into an IIFE format.
    const commonBundle = await esbuild.build({
      entryPoints: [commonLibEntry],
      bundle: true,
      write: false, // We want the output as a string to concatenate
      format: 'iife',
      globalName: 'ext',
      target: 'es2020',
      alias: {
        'node:crypto': path.join(commonPackageDir, 'src/crypto-shim.js'),
      },
      external: ['email-alias-core'],
    });

    const commonCode = commonBundle.outputFiles[0].text;

    // 5. Read the content of the popup script from the chrome package
    const popupCode = await fs.readFile(popupScriptEntry, 'utf-8');

    // 6. Concatenate the bundled common library and the popup script
    const finalScript = `${commonCode}\n\n${popupCode}`;

    // 7. Write the final combined script to the output directory
    await fs.writeFile(path.join(outDir, 'popup.js'), finalScript);
    console.log('Successfully built popup.js.');

    console.log('Build completed successfully!');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

async function watch(): Promise<void> {
  console.log('Starting watch mode...');

  // Simple debouncer
  let timeout: NodeJS.Timeout | undefined;
  const watcher = (event: string, filename: string): void => {
    console.log(`Detected ${event} in ${filename}. Rebuilding...`);
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(build, 100); // Debounce builds
  };

  // Watch common, chrome and firefox specific files
  fs.watch(
    commonPackageDir,
    { recursive: true },
    (event: string, filename: string | null) => {
      if (filename) watcher(event, filename);
    }
  );
  fs.watch(
    chromePackageDir,
    { recursive: true },
    (event: string, filename: string | null) => {
      if (
        filename &&
        !path
          .resolve(chromePackageDir, filename)
          .startsWith(path.join(chromePackageDir, 'dist'))
      ) {
        watcher(event, filename);
      }
    }
  );
  fs.watch(
    __dirname,
    { recursive: true },
    (event: string, filename: string | null) => {
      // Ignore changes in the output directory to prevent infinite loops
      if (filename && !path.resolve(__dirname, filename).startsWith(outDir)) {
        watcher(event, filename);
      }
    }
  );

  // Initial build
  await build();
}

if (isWatchMode) {
  watch();
} else {
  build();
}
