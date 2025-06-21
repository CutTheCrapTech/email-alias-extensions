interface BuildOptions {
    outDir: string;
    publicDir: string;
    manifestFile: string;
    popupHtmlFile: string;
    iconsDir: string;
    popupScriptFile: string;
    commonLibEntry: string;
    cryptoShimPath: string;
}
declare function buildExtension(options: BuildOptions): Promise<void>;
export { buildExtension };
