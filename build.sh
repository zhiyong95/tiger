#!/bin/sh
set -e
cd /workspace/projects
node /workspace/projects/node_modules/.pnpm/vue-tsc@2.2.12_typescript@5.7.3/node_modules/vue-tsc/bin/vue-tsc.js -b
node /workspace/projects/node_modules/.pnpm/vite@6.4.3/node_modules/vite/bin/vite.js build
