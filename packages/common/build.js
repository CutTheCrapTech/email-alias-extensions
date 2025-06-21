import esbuild from 'esbuild';
import * as fs from 'fs-extra';
import * as path from 'path';
async function buildExtension(options) {
    const { outDir, publicDir, manifestFile, popupHtmlFile, iconsDir, popupScriptFile, commonLibEntry, cryptoShimPath, } = options;
    try {
        // 1. Ensure the output directory is clean
        await fs.emptyDir(outDir);
        console.log('Cleaned output directory.');
        // 2. Copy static assets to the output directory
        await fs.copy(path.join(publicDir, manifestFile), path.join(outDir, path.basename(manifestFile)));
        await fs.copy(path.join(publicDir, popupHtmlFile), path.join(outDir, path.basename(popupHtmlFile)));
        await fs.copy(path.join(publicDir, iconsDir), path.join(outDir, iconsDir));
        console.log('Copied static assets.');
        // 3. Bundle the common library into an IIFE format.
        // The `globalName: 'ext'` will expose the library's exports
        // on the `window.ext` object in the browser.
        const commonBundle = await esbuild.build({
            entryPoints: [commonLibEntry],
            bundle: true,
            write: false, // We want the output as a string to concatenate
            format: 'iife',
            globalName: 'ext',
            target: 'es2020',
            alias: {
                'node:crypto': cryptoShimPath,
            },
            external: ['email-alias-core'],
        });
        const commonCode = commonBundle.outputFiles[0].text;
        // 4. Read the content of the popup script
        const popupCode = await fs.readFile(popupScriptFile, 'utf-8');
        // 5. Concatenate the bundled common library and the popup script
        const finalScript = `${commonCode}\n\n${popupCode}`;
        // 6. Write the final combined script to the output directory
        await fs.writeFile(path.join(outDir, 'popup.js'), finalScript);
        console.log('Successfully built popup.js.');
        console.log('Build completed successfully!');
    }
    catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}
export { buildExtension };
