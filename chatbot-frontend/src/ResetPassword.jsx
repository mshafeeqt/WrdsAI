import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Grid,
  InputLabel,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import Wrds from "././assets/Wrds White.webp";
import Wrds1 from "././assets/wrdsai1.png";
import { useTheme, useMediaQuery } from "@mui/material";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const id = params.get("id");
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const handleReset = async () => {
    if (!id || !token) {
      toast.error("Invalid or expired reset link. Please request a new one.");
      return;
    }

    if (!password) {
      toast.warn("Please enter a new password");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${apiBaseUrl}/api/ai/reset-password`, {
        id,
        token,
        password,
      });

      toast.success(res.data.message || "Password reset successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Reset failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          // flexDirection: isSmallScreen ? "column" : "row",
          // alignItems: isSmallScreen ? "flex-start" : "center",
          // justifyContent: "space-between",
          alignItems: "center",
          justifyContent: "flex-start",
          px: { xs: 1, sm: 2, md: 2, lg: 2 },
          bgcolor: "#1268fb",
          zIndex: 100,
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          height: { xs: "84px", sm: "84px", md: "84px", lg: "84px" },
          minHeight: { xs: "50px", sm: "55px", lg: "60px" },
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          py: 0,
        }}
      >
        <Box
          component="img"
          src={Wrds1}
          alt="Logo"
          sx={{
            // width: 186,
            width: {
              xs: 150,
              sm: 166,
              md: 186,
              lg: 196,
            },
            height: {
              xs: 54,
              sm: 60,
              md: 66,
              lg: 72,
            },
            ml: "-15px",
          }}
        />
      </Box>

      {/* Main Content */}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{
          p: { xs: 5, sm: 10, md: 2, lg: 2 },
          width: "100vw",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Grid item xs={12} sm={8} md={4}>
          <Grid
            container
            direction="column"
            alignItems="center"
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "white",
              boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.35)",
            }}
          >
            <Typography variant="h5" textAlign="center" gutterBottom>
              Reset Password
            </Typography>

            <Box sx={{ width: "100%" }}>
              <InputLabel sx={{ mt: 2 }}>
                New Password <span style={{ color: "red" }}>*</span>
              </InputLabel>
              <TextField
                type={showPassword ? "text" : "password"}
                fullWidth
                size="small"
                disabled={!token || loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <InputLabel sx={{ mt: 2 }}>
                Confirm Password <span style={{ color: "red" }}>*</span>
              </InputLabel>
              <TextField
                type={showConfirmPassword ? "text" : "password"}
                fullWidth
                size="small"
                disabled={!token || loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3 }}
                onClick={handleReset}
                disabled={!token || !id || loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResetPassword;
