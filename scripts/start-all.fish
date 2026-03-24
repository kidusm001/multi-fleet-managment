#!/usr/bin/env fish

# Determine script directory and repo root in a robust way across fish versions.
set -l SCRIPT_PATH (status --current-filename)
if test -z "$SCRIPT_PATH"
    # Fallback when status does not report current filename (some contexts).
    set SCRIPT_PATH "$PWD/scripts/start-all.fish"
else if test -d "$SCRIPT_PATH"
    # status may return the directory instead of the file path.
    set SCRIPT_PATH "$SCRIPT_PATH/scripts/start-all.fish"
end

if not test -f "$SCRIPT_PATH"
    set SCRIPT_PATH "$PWD/scripts/start-all.fish"
end

set -g SCRIPT_DIR (realpath (dirname "$SCRIPT_PATH"))
set -g ROOT (realpath "$SCRIPT_DIR/..")

# If we are one directory too high, correct to the repo folder.
if test -d "$ROOT/packages/server"; and test -d "$ROOT/clustering"
    # ROOT is valid as-is.
else if test -d "$ROOT/multi-fleet-managment/packages/server"
    set ROOT "$ROOT/multi-fleet-managment"
end

set -g LOG_DIR "$ROOT/.run-logs"
mkdir -p "$LOG_DIR"

function port_is_open
    set -l port $argv[1]
    ss -ltn | grep -q ":$port "
end

function wait_port_closed
    set -l port $argv[1]
    for i in (seq 1 12)
        if not port_is_open $port
            return 0
        end
        sleep 0.25
    end
    return 1
end

function kill_port
    set -l port $argv[1]
    if not port_is_open $port
        return
    end

    # Find PID(s) listening on the port and terminate them
    set -l pids (ss -ltnp "sport = :$port" 2>/dev/null | awk -F'[, ]+' '/pid=/ { for (i=1; i<=NF; i++) if ($i ~ /^pid=/) print substr($i,5) }')
    for pid in $pids
        if test -n "$pid"
            echo "[info] Killing process $pid on :$port"
            kill "$pid" 2>/dev/null || true
        end
    end

    if wait_port_closed $port
        echo "[info] port :$port freed"
        return
    end

    echo "[warn] port :$port still open after kill attempt; trying fuser -k"
    if command -v fuser >/dev/null 2>&1
        fuser -k "$port/tcp" >/dev/null 2>&1 || true
        sleep 0.5
    end

    if wait_port_closed $port
        echo "[info] port :$port freed after fuser"
    else
        echo "[error] port :$port could not be freed" 
    end
end

function start_redis
    if port_is_open 6379
        echo "[info] redis already running on :6379; restarting"
        kill_port 6379
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
        echo "[info] fastapi already running on :8000; restarting"
        kill_port 8000
        if port_is_open 8000
            echo "[error] fastapi restart failed: port 8000 still in use"
            return
        end
    end

    set -l pycmd "python3"
    if test -x "$ROOT/.venv/bin/python"
        set pycmd "$ROOT/.venv/bin/python"
    else if test -x "$ROOT/clustering/.venv/bin/python"
        set pycmd "$ROOT/clustering/.venv/bin/python"
    end

    if not test -d "$ROOT/clustering"
        echo "[error] clustering directory not found at $ROOT/clustering"
        return
    end

    # Ensure uvicorn is available in chosen Python environment
    if not $pycmd -m uvicorn --help >/dev/null 2>&1
        echo "[warn] uvicorn not installed for $pycmd; installing from requirements.txt"
        if test -f "$ROOT/clustering/requirements.txt"
            $pycmd -m pip install -r "$ROOT/clustering/requirements.txt" >> "$LOG_DIR/fastapi.log" 2>&1
        else
            echo "[error] requirements.txt not found at $ROOT/clustering/requirements.txt"
            return
        end
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
        echo "[info] backend already running on :3000; restarting"
        kill_port 3000
        if port_is_open 3000
            echo "[error] backend restart failed: port 3000 still in use"
            return
        end
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
        echo "[info] frontend already running on :5173; restarting"
        kill_port 5173
        if port_is_open 5173
            echo "[error] frontend restart failed: port 5173 still in use"
            return
        end
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
