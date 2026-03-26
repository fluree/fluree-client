import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

// For Node.js builds: treat crypto deps and their subpaths as external
const nodeExternalPkgs = ['@fluree/crypto', 'cross-fetch', 'dotenv', 'tslib', 'uuid'];
const nodeExternal = (id) => nodeExternalPkgs.some((pkg) => id === pkg || id.startsWith(pkg + '/'));
const browserExternalPkgs = ['@fluree/crypto', 'cross-fetch', 'dotenv', 'uuid'];
const browserExternal = (id) => browserExternalPkgs.some((pkg) => id === pkg || id.startsWith(pkg + '/'));

const typescriptPlugin = typescript({
  tsconfig: './tsconfig.json',
  declaration: false,
  sourceMap: true,
  outDir: undefined,
});

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nodejs/index.js',
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
    external: nodeExternal,
    plugins: [resolve(), commonjs(), typescriptPlugin],
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nodejs/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    external: nodeExternal,
    plugins: [resolve(), commonjs(), typescriptPlugin],
  },
  // Browser UMD build — crypto deps are bundled for a self-contained browser bundle
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/browser/fluree-client.min.js',
      format: 'umd',
      name: 'FlureeClient',
      sourcemap: true,
      exports: 'named',
      globals: {
        'cross-fetch': 'fetch',
        uuid: 'uuid',
        '@fluree/crypto': 'FlureeCrypto',
      },
    },
    external: browserExternal,
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescriptPlugin,
      terser(),
    ],
  },
  // TypeScript declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nodejs/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
