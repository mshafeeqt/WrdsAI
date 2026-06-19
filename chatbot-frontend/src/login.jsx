// -------------------------------------------

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useFormik } from "formik";
// import * as Yup from "yup";
// import {
//   Box,
//   TextField,
//   Button,
//   Typography,
//   Alert,
//   Link,
//   CircularProgress,
//   InputLabel,
// } from "@mui/material";
// import { useDispatch, useSelector } from "react-redux";
// // import { login } from "../store/slices/authSlice";

// import { toast } from "react-toastify";
// import { Link as RouterLink } from "react-router-dom";

// const validationSchema = Yup.object({
//   username: Yup.string().required("Username is required"),
//   password: Yup.string().required("Password is required"),
// });

// const Login = () => {
//   const navigate = useNavigate();
//   const [error, setError] = useState("");
//   const dispatch = useDispatch();
//   const [loading, setLoading] = useState(false);

//   const formik = useFormik({
//     initialValues: {
//       username: "",
//       password: "",
//     },
//     validationSchema,
//     onSubmit: async (values) => {
//       setLoading(true);
//       setError("");
//       try {
//         const result = await dispatch(login(values));

//         if (result.payload?.status === 200) {
//           // Store user data in localStorage
//           localStorage.setItem("user", JSON.stringify(result.payload.data));
//           toast.success("Login successful!");

//           // Navigate to home page after successful login
//           navigate("/");
//         } else {
//           const errorMsg = result.payload?.error || "Login failed!";
//           setError(errorMsg);
//           toast.error(errorMsg);
//         }
//       } catch (err) {
//         const errorMsg = err.response?.data?.error || "Login failed!";
//         setError(errorMsg);
//         toast.error(errorMsg);
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     },
//   });

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         marginTop: 30,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Box
//         elevation={3}
//         sx={{
//           padding: 4,
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           width: "100%",
//           maxWidth: 400,
//           borderRadius: 4,
//           p: 4,
//           bgcolor: "white",
//           boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.35)",
//           boxSizing: "border-box",
//         }}
//       >
//         <Typography component="h1" variant="h5">
//           Sign In
//         </Typography>

//         {error && (
//           <Alert severity="error" sx={{ mt: 2, width: "100%" }}>
//             {error}
//           </Alert>
//         )}

//         <form
//           onSubmit={formik.handleSubmit}
//           style={{ width: "100%", marginTop: 16 }}
//         >
//           <InputLabel sx={{ mt: 2 }}>
//             Username <span style={{ color: "red" }}>*</span>
//           </InputLabel>
//           <TextField
//             size="small"
//             required
//             fullWidth
//             id="username"
//             name="username"
//             autoComplete="username"
//             autoFocus
//             value={formik.values.username}
//             onChange={formik.handleChange}
//             onBlur={formik.handleBlur}
//             error={formik.touched.username && Boolean(formik.errors.username)}
//             helperText={formik.touched.username && formik.errors.username}
//           />

//           <InputLabel sx={{ mt: 2 }}>
//             Password <span style={{ color: "red" }}>*</span>
//           </InputLabel>
//           <TextField
//             size="small"
//             required
//             fullWidth
//             name="password"
//             type="password"
//             id="password"
//             autoComplete="current-password"
//             value={formik.values.password}
//             onChange={formik.handleChange}
//             onBlur={formik.handleBlur}
//             error={formik.touched.password && Boolean(formik.errors.password)}
//             helperText={formik.touched.password && formik.errors.password}
//           />

//           <Button
//             type="submit"
//             fullWidth
//             variant="contained"
//             sx={{ mt: 3, mb: 2 }}
//             disabled={formik.isSubmitting || loading}
//           >
//             {loading ? (
//               <CircularProgress size={24} color="inherit" />
//             ) : (
//               "Sign In"
//             )}
//           </Button>
//         </form>

//         <Box sx={{ textAlign: "center", mt: 1 }}>
//           <span>Don't have an account?</span>
//           <Link
//             component={RouterLink}
//             to="/register"
//             variant="body2"
//             onClick={(e) => e.stopPropagation()}
//             underline="hover"
//             sx={{ cursor: "pointer", ml: 0.5 }}
//           >
//             Sign Up
//           </Link>
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// export default Login;
// --------------------------------------------------

// import React, { useState } from "react";
// import axios from "axios";

// const Login = () => {
//   const [formData, setFormData] = useState({
//     username: "",
//     password: "",
//   });
//   const [message, setMessage] = useState("");
//   const [user, setUser] = useState(null);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("");

//     try {
//       const res = await axios.post(
//         "https://carbon-chatbot.onrender.com/api/ai/login",
//         formData
//       );
//       setMessage(res.data.message);
//       setUser(res.data.data); // user data save local state ma
//       localStorage.setItem("user", JSON.stringify(res.data.data)); // optional (refresh pachi pan data store rehse)
//     } catch (err) {
//       setMessage(err.response?.data?.error || "Login failed");
//     }
//   };

//   return (
//     <div style={{ maxWidth: 400, margin: "auto" }}>
//       <h2>Login</h2>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           name="username"
//           placeholder="Username"
//           value={formData.username}
//           onChange={handleChange}
//           required
//         />
//         <br />
//         <input
//           type="password"
//           name="password"
//           placeholder="Password"
//           value={formData.password}
//           onChange={handleChange}
//           required
//         />
//         <br />
//         <button type="submit">Login</button>
//       </form>
//       <p>{message}</p>

//       {user && (
//         <div>
//           <h3>Welcome, {user.username}</h3>
//           <p>Email: {user.email}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Login;

import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  InputLabel,
  IconButton,
  Grid,
  InputAdornment,
} from "@mui/material";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Words2 from "././assets/words2.png"; // path adjust karo
import { useTheme, useMediaQuery } from "@mui/material";
import { useGrok } from "./context/GrokContext";
import Wrds from "././assets/words1.png";
import Wrds1 from "././assets/words1.png";
import {
  fetchCurrentUser,
  setAuthenticatedUserCache,
} from "./features/auth/authClient";
import { getRoleHomePath } from "./features/auth/roleAccess";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { sessionRemainingTokens, setSessionRemainingTokens } = useGrok();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(`${apiBaseUrl}/api/ai/login`, formData, {
        withCredentials: true,
      });

      const userData = res.data.data;
      setAuthenticatedUserCache(userData);
      setMessage(res.data.message);

      setUser(userData);
      // localStorage.setItem("user", JSON.stringify(res.data.data));

      // const userData = {
      //   id: res.data.data.id,
      //   firstName: res.data.data.firstName,
      //   lastName: res.data.data.lastName,
      //   // username: res.data.data.username,
      //   email: res.data.data.email,
      //   remainingTokens: res.data.data.remainingTokens,
      //   subscriptionPlan: res.data.data.subscriptionPlan,
      //   childPlans: res.data.data.childPlans,
      //   subscriptionType: res.data.data.subscriptionType,
      //   // Add any other fields you need
      // };

      const remainingTokens = userData.subscription?.remainingTokens || 0;

      setSessionRemainingTokens(remainingTokens);

      navigate(getRoleHomePath(userData.userRole));

      fetchCurrentUser().catch((error) => {
        console.warn("Session refresh after login failed:", error);
      });
    } catch (err) {
      setMessage(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Login failed",
      );
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
          alignItems: "center",
          justifyContent: "flex-start",
          px: { xs: 1, sm: 2, md: 2, lg: 2 },
          background:
            "linear-gradient(118deg, #b552ff 0%, #705cff 48%, #2eb8ff 100%)",
          zIndex: 100,
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          // height: isSmallScreen
          //   ? "auto"
          height: { xs: "84px", sm: "84px", md: "84px", lg: "84px" },
          minHeight: { xs: "50px", sm: "55px", lg: "60px" },
          boxShadow: "0 12px 30px rgba(73, 43, 170, 0.24)",
          py: 0,
        }}
      >
        {/* HEADER CONTENT */}
        {/* <img
          src={Wrds1}
          height={75}
          width={196}
          alt="Logo"
          style={{ marginLeft: "-15px" }}
        /> */}
        <Box
          component="img"
          src={Wrds1}
          alt="Logo"
          sx={{
            // width: 186,
            width: {
              xs: 165,
              sm: 220,
              md: 220,
              lg: 220,
            },
            height: "auto",
            objectFit: "contain",
            ml: "-15px",
          }}
        />
      </Box>

      {/* <Box
        sx={{
          marginTop: { xs: 1, sm: 4, md: 2 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: { xs: 1, sm: 2, md: 2 },
          width: "100vw",
          maxWidth: "100%",
          minHeight: "100vh",
          pt: { xs: "0px", sm: "0px", md: "0px" }, // compensate header height
        }}
      >
        <Box
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 400,
            borderRadius: 4,
            bgcolor: "white",
            boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.35)",
          }}
        >
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>

          {message && (
            <Alert
              severity={message.includes("failed") ? "error" : "success"}
              sx={{ mt: 2, width: "100%" }}
            >
              {message}
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ width: "100%", marginTop: 16 }}
          >
            <InputLabel sx={{ mt: 2 }}>
              Email <span style={{ color: "red" }}>*</span>
            </InputLabel>
            <TextField
              size="small"
              required
              fullWidth
              id="email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />

            <InputLabel sx={{ mt: 2 }}>
              Password <span style={{ color: "red" }}>*</span>
            </InputLabel>
            <TextField
              size="small"
              fullWidth
              name="password"
              type={showPassword ? "text" : "password"} // 👁️ show/hide
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon />
                      ) : (
                        <VisibilityOutlinedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <Box sx={{ textAlign: "center", mt: 1 }}>
            <span>Don't have an account?</span>
            <Link
              component={RouterLink}
              to="/register"
              variant="body2"
              underline="hover"
              sx={{ cursor: "pointer" }}
            >
              {" Sign Up"}
            </Link>
          </Box>
        </Box>
      </Box> */}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{
          // mt: { xs: 1, sm: 4, md: 2 },
          p: { xs: 5, sm: 10, md: 2, lg: 2 },
          width: "100vw",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5", // optional
        }}
      >
        <Grid size={{ xs: 12, sm: 8, md: 4 }}>
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
            {/* Heading */}
            <Typography component="h1" variant="h5">
              Sign In
            </Typography>

            {/* Message */}
            {message && (
              <Alert
                severity={message.includes("failed") ? "error" : "success"}
                sx={{ mt: 2, width: "100%" }}
              >
                {message}
              </Alert>
            )}

            {/* Form */}
            <Grid size={{ width: "100%", mt: 2 }}>
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <InputLabel sx={{ mt: 2 }}>
                  Email <span style={{ color: "red" }}>*</span>
                </InputLabel>
                <TextField
                  size="small"
                  required
                  fullWidth
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={formData.email}
                  onChange={handleChange}
                />

                {/* Password */}
                <InputLabel sx={{ mt: 2 }}>
                  Password <span style={{ color: "red" }}>*</span>
                </InputLabel>
                <TextField
                  size="small"
                  fullWidth
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon />
                          ) : (
                            <VisibilityOutlinedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ textAlign: "right", mt: 1 }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    underline="hover"
                    variant="body2"
                  >
                    Forgot Password?
                  </Link>
                </Box>

                {/* Submit */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 2,
                    mb: 2,
                    background:
                      "linear-gradient(118deg, #b552ff 0%, #705cff 48%, #2eb8ff 100%)",
                    boxShadow: "0 10px 22px rgba(73, 43, 170, 0.28)",
                    "&:hover": {
                      background:
                        "linear-gradient(118deg, #a84cff 0%, #6453f2 48%, #24aef5 100%)",
                      boxShadow: "0 14px 28px rgba(73, 43, 170, 0.34)",
                    },
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Grid>

            {/* Sign Up Link */}
            <Grid size={{ textAlign: "center", mt: 1 }}>
              <span>Don't have an account?</span>
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                underline="hover"
                sx={{ cursor: "pointer" }}
              >
                {" Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;
