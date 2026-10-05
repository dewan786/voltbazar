import type { NextConfig } from 'next';
const config:NextConfig={serverExternalPackages:['sql.js','@netlify/blobs'],outputFileTracingIncludes:{'/*':['./node_modules/sql.js/dist/sql-wasm.wasm']}};
export default config;
