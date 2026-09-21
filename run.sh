#!/bin/sh
# 使用 COZE_WORKSPACE_PATH 绝对路径提供 dist，避免 serve 依赖工作目录(CWD)导致静态资源回退白屏
ROOT="${COZE_WORKSPACE_PATH:-/workspace/projects}"
npx serve -l ${DEPLOY_RUN_PORT} "${ROOT}/dist"