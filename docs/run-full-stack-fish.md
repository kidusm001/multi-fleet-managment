# Run Full Stack (Fish)

Use this single command from the repo root:

`fish scripts/start-all.fish`

It starts:
- Redis (`:6379`)
- FastAPI clustering service (`:8000`)
- Backend API (`:3000`)
- Frontend Vite app (`:5173`)

If a service is already running on its port, the script skips restarting it.

Logs are written to:
- `.run-logs/redis` (redis is daemonized)
- `.run-logs/fastapi.log`
- `.run-logs/backend.log`
- `.run-logs/frontend.log`

Quick health checks:

- `curl -fs http://localhost:3000/health && echo BACKEND_OK`
- `curl -fs http://127.0.0.1:8000/health && echo FASTAPI_OK`
- `curl -fs http://localhost:5173 >/dev/null && echo FRONTEND_OK`
