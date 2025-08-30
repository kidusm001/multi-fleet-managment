import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (!session || !session.user) {
        res.status(401).json({ message: "Unauthorized: No active session/user" });
        return;
      }
      if (!session.user.role || !allowedRoles.includes(session.user.role)) {
        res.status(403).json({ message: "Forbidden: Insufficient permissions" });
        return;
      }
      // Attach user to request if needed
      (req as any).user = session.user;
      next(); // Only call next() if the user is authorized
    } catch (error) {
      // In case of session retrieval failure, respond with 401 (Unauthorized)
      res.status(401).json({ message: "Unauthorized: Failed to validate session" });
      return;
    }
  };
}
