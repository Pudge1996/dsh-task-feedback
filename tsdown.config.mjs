/**
 * tsdown build for dsh-status-indication.
 *
 * Two artifacts from one command:
 *   1. lib/index.js  — ESM Node host half (deps externalized; resolved against
 *      the profile's own @deepseek-ai/* installation at runtime).
 *   2. lib/client.js — browser client bundle in the harness ModuleLoader
 *      closure-factory format: `window.__ModuleLoader__.load({ id, factory })`.
 *      Platform modules (cordis) stay external and are resolved through the
 *      loader's injected `require`; everything else is inlined.
 */

const ID = 'dsh-status-indication'

/** Module specifiers the harness shell shares into the frozen module table. */
const PLATFORM_MODULES = [
  '@deepseek-ai/cordis',
]

const CLIENT_EXTERNALS = [
  ...PLATFORM_MODULES,
]

export default [
  // ---- Node host half ----
  {
    name: ID,
    entry: ['src/index.js'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
  // ---- Browser client bundle ----
  {
    name: ID + '/client',
    entry: { client: 'src/client/index.js' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    external: CLIENT_EXTERNALS.slice(),
    noExternal: function (id) { return CLIENT_EXTERNALS.includes(id) ? undefined : true },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: ' + JSON.stringify(ID) + ', factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
]