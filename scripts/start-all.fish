#!/usr/bin/env fish

set -l SCRIPT_DIR (cd (dirname (status --current-filename)); pwd)
set -l ROOT (cd "$SCRIPT_DIR/.."; pwd)
set -l LOG_DIR "$ROOT/.run-logs"
mkdir -p "$LOG_DIR"

function port_is_open
    set -l port $argv[1]
    ss -ltn | grep -q ":$port "
end

function start_redis
    if port_is_open 6379
        echo "[ok] redis already running on :6379"
        return
    end

    redis-server --save "" --appendonly no --daemonize yes
    sleep 1
    if port_is_open 6379
        echo "[ok] redis started on :6379"
    else
        echo "[error] redis failed to start"
    end
end

function start_fastapi
    if port_is_open 8000
        echo "[ok] fastapi already running on :8000"
        return
    end

    set -l pycmd "python3"
    if test -x "$ROOT/.venv/bin/python"
        set pycmd "$ROOT/.venv/bin/python"
    else if test -x "$ROOT/clustering/.venv/bin/python"
        set pycmd "$ROOT/clustering/.venv/bin/python"
    end

    cd "$ROOT/clustering"
    nohup $pycmd -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload > "$LOG_DIR/fastapi.log" 2>&1 &
    cd "$ROOT"

    sleep 2
    if port_is_open 8000
        echo "[ok] fastapi started on :8000"
    else
        echo "[error] fastapi failed to start (see $LOG_DIR/fastapi.log)"
    end
end

function start_backend
    if port_is_open 3000
        echo "[ok] backend already running on :3000"
        return
    end

    cd "$ROOT/packages/server"
    nohup env NODE_OPTIONS=--max-old-space-size=4096 pnpm dev > "$LOG_DIR/backend.log" 2>&1 &
    cd "$ROOT"

    sleep 3
    if port_is_open 3000
        echo "[ok] backend started on :3000"
    else
        echo "[error] backend failed to start (see $LOG_DIR/backend.log)"
    end
end

function start_frontend
    if port_is_open 5173
        echo "[ok] frontend already running on :5173"
        return
    end

    cd "$ROOT/packages/client"
    nohup pnpm dev --host 0.0.0.0 --port 5173 > "$LOG_DIR/frontend.log" 2>&1 &
    cd "$ROOT"

    sleep 2
    if port_is_open 5173
        echo "[ok] frontend started on :5173"
    else
        echo "[error] frontend failed to start (see $LOG_DIR/frontend.log)"
    end
end

start_redis
start_fastapi
start_backend
start_frontend

echo ""
echo "Health checks:"
curl -fs http://localhost:3000/health >/dev/null; and echo "  backend: ok"; or echo "  backend: failed"
curl -fs http://127.0.0.1:8000/health >/dev/null; and echo "  fastapi: ok"; or echo "  fastapi: failed"
curl -fs http://localhost:5173 >/dev/null; and echo "  frontend: ok"; or echo "  frontend: failed"
echo ""
echo "Logs: $LOG_DIR"
