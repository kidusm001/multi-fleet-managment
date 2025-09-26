from fastapi import Request, HTTPException, Depends
import httpx

BETTER_AUTH_URL = "http://localhost:3000"  # Your Express (Better Auth) server

async def get_current_session(request: Request):
    # Log cookies to verify the token is coming through
    print("Incoming cookies:", request.cookies)
    
    # The cookie name should match your Better Auth configuration, e.g., "my-app.session_token"
    session_token = request.cookies.get("better-auth.session_token")
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated: no session token provided.")

    # Validate the token by calling the Better Auth session endpoint
    async with httpx.AsyncClient() as client:
        headers = {"Cookie": f"better-auth.session_token={session_token}"}
        response = await client.get(f"{BETTER_AUTH_URL}/api/auth/getSession", headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    session_data = response.json()
    if not session_data or "user" not in session_data:
        raise HTTPException(status_code=401, detail="Session not found or invalid.")

    return session_data
