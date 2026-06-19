import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  fetchCurrentUser,
  getAuthenticatedUserCache,
} from "./authClient";
import { getRoleHomePath, isRoleAllowed } from "./roleAccess";

function AuthLoading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        color: "#28165f",
        fontWeight: 700,
      }}
    >
      Loading...
    </main>
  );
}

export default function RequireAuth({ allowedRoles = [], children }) {
  const location = useLocation();
  const [user, setUser] = useState(() => getAuthenticatedUserCache());
  const [isLoading, setIsLoading] = useState(!user);

  useEffect(() => {
    let cancelled = false;

    if (user) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadUser() {
      try {
        const currentUser = await fetchCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading) return <AuthLoading />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!isRoleAllowed(user.userRole, allowedRoles)) {
    return <Navigate to={getRoleHomePath(user.userRole)} replace />;
  }

  return children;
}
