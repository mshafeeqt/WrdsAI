export const USER_ROLES = {
  STUDENT: "Student",
  TEACHER: "Teacher",
};

export function normalizeUserRole(role) {
  return String(role || "").toLowerCase() === "teacher"
    ? USER_ROLES.TEACHER
    : USER_ROLES.STUDENT;
}

export function getRoleHomePath(role) {
  return normalizeUserRole(role) === USER_ROLES.TEACHER
    ? "/teacher-home"
    : "/home";
}

export function isRoleAllowed(role, allowedRoles = []) {
  if (!allowedRoles.length) return true;

  const normalizedRole = normalizeUserRole(role);
  return allowedRoles.map(normalizeUserRole).includes(normalizedRole);
}
