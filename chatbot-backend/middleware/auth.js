import jwt from "jsonwebtoken";
import { PgUser } from "../postgres/models.js";

export const AUTH_COOKIE_NAME = "wrdsai_auth";
export const USER_ROLES = {
  STUDENT: "Student",
  TEACHER: "Teacher",
};

const isProduction = process.env.NODE_ENV === "production";

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function signAuthToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.userRole || "Student",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function normalizeUserRole(role) {
  if (String(role || "").toLowerCase() === "teacher") {
    return USER_ROLES.TEACHER;
  }

  return USER_ROLES.STUDENT;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) return cookies;

      const key = decodeURIComponent(part.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
}

export async function requireAuth(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies[AUTH_COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET is required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await PgUser.findByPk(payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map(normalizeUserRole);

  return (req, res, next) => {
    const currentRole = normalizeUserRole(req.user?.userRole);

    if (!allowed.includes(currentRole)) {
      return res.status(403).json({
        error: "This account does not have access to this resource",
      });
    }

    next();
  };
}
