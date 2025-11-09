export interface BundleOptions {
  minify?: boolean;
  sourcemap?: boolean;
}

export interface BundleResult {
  code: string;
  hash: string;
}

export interface Bundler {
  bundle(filePath: string, options?: BundleOptions): Promise<BundleResult>;
}
