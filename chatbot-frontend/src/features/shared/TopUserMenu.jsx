import { useEffect, useMemo, useState } from "react";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutTwoToneIcon from "@mui/icons-material/LogoutTwoTone";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ChangePasswordDialog from "../chat/components/ChangePasswordDialog";
import UserProfileDialog from "../chat/components/UserProfileDialog";
import {
  fetchCurrentUser,
  getAuthenticatedUserCache,
  logoutCurrentUser,
} from "../auth/authClient";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const getDisplayName = (user) => {
  const rawName = String(user?.firstName || user?.username || "").trim();
  if (!rawName) return "User";
  if (rawName.toLowerCase() === "qwerty") return "Onkar";
  return rawName.charAt(0).toUpperCase() + rawName.slice(1);
};

export default function TopUserMenu({ className = "", user: providedUser = null }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(providedUser || getAuthenticatedUserCache());
  const [anchorEl, setAnchorEl] = useState(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (providedUser) {
      setUser(providedUser);
      return;
    }

    let cancelled = false;
    fetchCurrentUser()
      .then((nextUser) => {
        if (!cancelled) setUser(nextUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [providedUser]);

  const displayName = useMemo(() => getDisplayName(user), [user]);

  const resetChangePasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleLogout = async () => {
    try {
      await logoutCurrentUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAnchorEl(null);
      navigate("/login", { replace: true });
    }
  };

  const handleContact = () => {
    setAnchorEl(null);
    window.location.href = "mailto:support@wrdsai.com";
  };

  const handleChangePassword = async () => {
    if (!user?.id) {
      toast.error("Please login again to change password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/ai/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Something went wrong");
      }

      toast.success(data?.message || "Password changed successfully");
      resetChangePasswordForm();
      setOpenChangePassword(false);
    } catch (error) {
      console.error("change-password API Error:", error);
      toast.error(error.message || "Unable to change password");
    }
  };

  return (
    <>
      <Box
        className={className}
        role="button"
        tabIndex={0}
        aria-label="Open user menu"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setAnchorEl(event.currentTarget);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          color: "#fff",
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            color: "inherit",
            fontSize: { xs: "16px", sm: "19px", md: "21px" },
            fontFamily: "Calibri, sans-serif",
            fontWeight: 600,
            maxWidth: { xs: 86, sm: 140 },
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </Typography>
        <PersonRoundedIcon sx={{ fontSize: { xs: 30, sm: 34 }, color: "inherit" }} />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 230, borderRadius: 2, p: 0.75 } }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setOpenProfile(true);
          }}
        >
          <PersonRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography sx={{ fontSize: "16px", fontFamily: "Calibri, sans-serif" }}>Profile</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setOpenChangePassword(true);
          }}
        >
          <LockResetRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography sx={{ fontSize: "16px", fontFamily: "Calibri, sans-serif" }}>Change Password</Typography>
        </MenuItem>
        <MenuItem onClick={handleContact}>
          <MailOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography sx={{ fontSize: "16px", fontFamily: "Calibri, sans-serif" }}>Contact Us</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutTwoToneIcon fontSize="small" sx={{ mr: 1, color: "red" }} />
          <Typography sx={{ fontSize: "16px", fontFamily: "Calibri, sans-serif" }}>Logout</Typography>
        </MenuItem>
      </Menu>

      <UserProfileDialog
        open={openProfile}
        onClose={() => setOpenProfile(false)}
        email={user?.email}
        user={user || {}}
      />

      <ChangePasswordDialog
        open={openChangePassword}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        showCurrent={showCurrent}
        showNew={showNew}
        showConfirm={showConfirm}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onToggleCurrent={() => setShowCurrent((value) => !value)}
        onToggleNew={() => setShowNew((value) => !value)}
        onToggleConfirm={() => setShowConfirm((value) => !value)}
        onClose={() => {
          resetChangePasswordForm();
          setOpenChangePassword(false);
        }}
        onSubmit={handleChangePassword}
      />
    </>
  );
}