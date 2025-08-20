import { Request, Response, NextFunction } from "express";
import { auth } from "../utils/auth";
import { fromNodeHeaders } from "better-auth/node";

// Role guard: prefer cookie-based session attached by `loadSession`.
// Fall back to BetterAuth API session retrieval only when cookie session is missing.
export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If loadSession middleware already attached a sessionUser, use it.
      const cookieSession = (req as any).sessionUser;
      if (cookieSession) {
        // Compare roles case-insensitively to tolerate DB/enum casing differences
        const userRole = String(cookieSession.role || '').toLowerCase();
        const allowed = allowedRoles.map(r => String(r).toLowerCase());
        if (!allowed.includes(userRole)) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
        }
        (req as any).user = cookieSession;
        return next();
      }

      // Fallback: try BetterAuth API using incoming headers (legacy path)
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (!session || !session.user) {
        return res.status(401).json({ message: "Unauthorized: No active session/user" });
      }

      // Normalize BetterAuth role as well when checking permissions
      const sessionUserRole = String(session.user.role || '').toLowerCase();
      const allowed = allowedRoles.map(r => String(r).toLowerCase());
      if (!allowed.includes(sessionUserRole)) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      (req as any).user = session.user;
      return next();
    } catch (err) {
      console.error('[requireRole] session validation error', err);
      return res.status(401).json({ message: "Unauthorized: Failed to validate session" });
    }
  };
}
