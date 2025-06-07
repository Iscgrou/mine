import { type Request, type Response, type NextFunction } from "express";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Bypass authentication for debugging purposes
  if (!req.session || !req.session.authenticated) {
    console.warn(`[AUTH-DEBUG] Bypassing authentication for: ${req.path}`);
    return next();
  }
  return next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.authenticated && req.session.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}
