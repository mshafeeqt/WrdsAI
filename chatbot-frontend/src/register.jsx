import React, { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  InputLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Modal,
  Grid,
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Words2 from "././assets/words2.png"; // path adjust karo
import Wrds from "././assets/words1.png";
import Wrds1 from "././assets/words1.png";
import { useLocation } from "react-router-dom";
import { allCountries } from "country-telephone-data";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userRole: "",
    email: "",
    password: "",
    confirmPassword: "",
    // mobile: "+91 ",
    mobileCode: "+91",
    mobileNumber: "",
    // country: "",
    dateOfBirth: null,
    ageGroup: "",
    className: "",
    parentName: "",
    parentEmail: "",
    // parentMobile: "+91 ",
    parentMobileCode: "+91",
    parentMobileNumber: "",
    subscriptionPlan: "WrdsAI Nxt",
    childPlan: "Boost Up",
    subscriptionType: "",
    agree: false,
    agreeActivation: false,
    agreepermission: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [childPlanDisabled, setChildPlanDisabled] = useState(false);

  const location = useLocation();
  // const isUpgrade = location.state?.isUpgrade;
  const isUpgrade = Boolean(location.state?.isUpgrade);
  const userData = location.state?.userData;

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const ageGroups = ["<13", "13-14", "15-17", "18+"];
  const userRoleOptions = ["Student", "Teacher"];
  const classOptions = ["9", "10", "11"];
  const DEFAULT_SUBSCRIPTION_PLAN = "WrdsAI Nxt";
  const DEFAULT_CHILD_PLAN = "Boost Up";
  const subscriptionPlans = [DEFAULT_SUBSCRIPTION_PLAN];
  const wrdsAIOptions = ["Glow Up", "Level Up", "Rise Up"];
  const wrdsAIProOptions = ["Step Up", "Speed Up", "Scale Up"];
  const wrdsAiNxtOptions = ["Boost Up"];
  const FREE_TRIAL_TYPE = "Free Trial (1 week)";
  const subscriptionTypes = [FREE_TRIAL_TYPE, "1 Month", "3 Months", "1 Year"];
  const showLegacyRegistrationOptions = false;

  const BASE_PRICES_INR = {
    WrdsAI: {
      "Glow Up": { Monthly: 83.9, "1 Month": 83.9, "3 Months": 251.7, Yearly: 922.86, "1 Year": 922.86 },
      "Level Up": { Monthly: 168.64, "1 Month": 168.64, "3 Months": 505.92, Yearly: 1694.09, "1 Year": 1694.09 },
      "Rise Up": { Monthly: 338.14, "1 Month": 338.14, "3 Months": 1014.42, Yearly: 3388.98, "1 Year": 3388.98 },
    },
    WrdsAIPro: {
      "Step Up": { Monthly: 422.88, "1 Month": 422.88, "3 Months": 1268.64, Yearly: 4651.69, "1 Year": 4651.69 },
      "Speed Up": { Monthly: 761.86, "1 Month": 761.86, "3 Months": 2285.58, Yearly: 7626.44, "1 Year": 7626.44 },
      "Scale Up": { Monthly: 1355.09, "1 Month": 1355.09, "3 Months": 4065.27, Yearly: 13558.5, "1 Year": 13558.5 },
    },
    "WrdsAI Nxt": {
      "Boost Up": { Monthly: 999, "1 Month": 999, "3 Months": 2997, Yearly: 10999, "1 Year": 10999 },
    },
  };

  const params = new URLSearchParams(location.search);
  const isUpgradeFromUrl = params.get("isUpgrade")?.trim() === "true";

  // 🔥 SAME behaviour for Chat upgrade & Email upgrade
  const isUpgradeMode = isUpgrade || isUpgradeFromUrl;

  // useEffect(() => {
  //   if (isUpgrade && userData) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       ...userData,
  //       dateOfBirth: userData.dateOfBirth
  //         ? new Date(userData.dateOfBirth)
  //         : null,
  //       parentName: userData.parentName || "",
  //       parentEmail: userData.parentEmail || "",
  //       parentMobile: userData.parentMobile || "",
  //     }));
  //   }
  // }, [isUpgrade, userData]);

  useEffect(() => {
    // 🔹 1. First priority: URL params (Email / direct link)
    // const params = new URLSearchParams(location.search);
    // const isUpgradeFromUrl = params.get("isUpgrade");

    // if (isUpgradeFromUrl) {
    //   const dobParam = params.get("dateOfBirth");
    //   console.log("dobParam:::::::",dobParam);
    //   const dobDate = dobParam ? new Date(dobParam) : null;

    //   const calculatedAgeGroup = dobDate
    //     ? calculateAgeGroup(dobDate)
    //     : params.get("ageGroup") || "";

    //   setFormData((prev) => ({
    //     ...prev,
    //     firstName: params.get("firstName") || "",
    //     lastName: params.get("lastName") || "",
    //     email: params.get("email") || "",
    //     mobile: params.get("mobile") || "",
    //     dateOfBirth: dobDate,
    //     ageGroup: calculatedAgeGroup,

    //     parentName: ["<13", "13-14", "15-17"].includes(calculatedAgeGroup)
    //       ? params.get("parentName") || ""
    //       : "",
    //     parentEmail: ["<13", "13-14", "15-17"].includes(calculatedAgeGroup)
    //       ? params.get("parentEmail") || ""
    //       : "",
    //     parentMobile: ["<13", "13-14", "15-17"].includes(calculatedAgeGroup)
    //       ? params.get("parentMobile") || ""
    //       : "",
    //   }));

    //   console.log("ageGroup*********",calculatedAgeGroup);

    //   return; // ✅ stop here, no need to check state
    // }

    // 🔹 1. First priority: URL params (Email / direct link)
    // const params = new URLSearchParams(location.search); // Already defined above
    // const isUpgradeFromUrl = params.get("isUpgrade")?.trim() === "true"; // Already defined above

    // 🔹 Improved helper: matches the longest dialCode from allCountries
    const splitPhone = (phone) => {
      if (!phone) return { code: "+91", number: "" };
      const cleanPhone = phone.replace(/[^\d+]/g, "");
      if (!cleanPhone.startsWith("+"))
        return { code: "+91", number: cleanPhone };

      const sortedCountries = [...allCountries].sort(
        (a, b) => b.dialCode.length - a.dialCode.length,
      );
      for (const country of sortedCountries) {
        const dialCode = `+${country.dialCode}`;
        if (cleanPhone.startsWith(dialCode)) {
          return { code: dialCode, number: cleanPhone.slice(dialCode.length) };
        }
      }
      return { code: "+91", number: cleanPhone.replace(/^\+/, "") };
    };

    if (isUpgradeFromUrl) {
      const dobParam = params.get("dateOfBirth");
      const dobDate = dobParam ? new Date(dobParam) : null;
      const calculatedAgeGroup = dobDate ? calculateAgeGroup(dobDate) : "";

      const m = splitPhone(params.get("mobile"));
      const pm = splitPhone(params.get("parentMobile"));

      setFormData((prev) => ({
        ...prev,
        firstName: params.get("firstName") || "",
        lastName: params.get("lastName") || "",
        email: params.get("email") || "",
        mobileCode: m.code,
        mobileNumber: m.number,
        dateOfBirth: dobDate,
        ageGroup: calculatedAgeGroup,
        className: params.get("className") || params.get("class") || "",

        parentName: ["<13", "13-14", "15-17"].includes(calculatedAgeGroup)
          ? params.get("parentName") || ""
          : "",
        parentEmail: ["<13", "13-14", "15-17"].includes(calculatedAgeGroup)
          ? params.get("parentEmail") || ""
          : "",
        parentMobileCode: pm.code,
        parentMobileNumber: pm.number,
      }));

      return;
    }

    // 🔹 2. Fallback: ChatUI → navigate(state)
    if (isUpgrade && userData) {
      const m = splitPhone(userData.mobile);
      const pm = splitPhone(userData.parentMobile);

      setFormData((prev) => ({
        ...prev,
        ...userData,
        dateOfBirth: userData.dateOfBirth
          ? new Date(userData.dateOfBirth)
          : null,
        mobileCode: m.code,
        mobileNumber: m.number,
        parentMobileCode: pm.code,
        parentMobileNumber: pm.number,
        className: userData.className || userData.class || "",
      }));
    }
  }, [isUpgrade, userData, location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If user selects subscriptionPlan -> update UI state for free trial
    // if (name === "subscriptionPlan") {
    //   if (value === "Free Trial") {
    //     // disable childPlan and set type = 'One Time'
    //     setFormData((prev) => ({
    //       ...prev,
    //       subscriptionPlan: value,
    //       childPlan: "", // clear child plan
    //       subscriptionType: "One Time",
    //     }));
    //     setChildPlanDisabled(true);
    //     setSubscriptionTypeDisabled(true);
    //   } else {
    //     setFormData((prev) => ({
    //       ...prev,
    //       subscriptionPlan: value,
    //       subscriptionType: "",
    //     }));
    //     setChildPlanDisabled(false);
    //     setSubscriptionTypeDisabled(false);
    //   }
    //   return;
    // }
    if (name === "subscriptionPlan") {
      setFormData((prev) => ({
        ...prev,
        subscriptionPlan: value,
        childPlan: value === "Free Trial" ? "" : prev.childPlan,
        subscriptionType: value === "Free Trial" ? FREE_TRIAL_TYPE : "",
      }));

      // optional: child plan logic
      setChildPlanDisabled(value === "Free Trial");

      return;
    }

    if (name === "subscriptionType") {
      setFormData((prev) => ({
        ...prev,
        subscriptionType: value,
        subscriptionPlan: value === FREE_TRIAL_TYPE ? "Free Trial" : DEFAULT_SUBSCRIPTION_PLAN,
        childPlan: value === FREE_TRIAL_TYPE ? "" : DEFAULT_CHILD_PLAN,
      }));
      setChildPlanDisabled(value === FREE_TRIAL_TYPE);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    const ageGroup = calculateAgeGroup(date);

    setFormData((prev) => ({
      ...prev,
      dateOfBirth: date,
      ageGroup: ageGroup,
    }));
  };

  const calculateAgeGroup = (dob) => {
    if (!dob) return "";

    const today = new Date();
    const birthDate = new Date(dob);

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) return "<13";
    if (age >= 13 && age <= 14) return "13-14";
    if (age >= 15 && age <= 17) return "15-17";
    return "18+";
  };

  const registerFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: "#fbfdff",
      height: { xs: "34px !important", sm: "38px !important" },
      minHeight: { xs: 38, sm: 42 },
      fontSize: { xs: "14px", sm: "16px" },
      boxShadow: "0 1px 0 rgba(15, 23, 42, 0.04)",
      transition: "box-shadow 180ms ease, background-color 180ms ease",
      "& fieldset": {
        borderColor: "#b8d4ec",
      },
      "&:hover fieldset": {
        borderColor: "#1268fb",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#1268fb",
        borderWidth: "1px",
      },
      "&.Mui-focused": {
        backgroundColor: "#fff",
        boxShadow: "0 0 0 4px rgba(18, 104, 251, 0.12)",
      },
    },
    "& .MuiInputBase-input": {
      py: { xs: 0.8, sm: 1 },
    },
  };

  const registerLabelSx = {
    color: "#111",
    fontFamily: "Calibri, sans-serif",
    fontSize: { xs: "14px !important", sm: "15px !important" },
    fontWeight: 700,
    mb: 0.35,
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.userRole ||
      !formData.dateOfBirth ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.subscriptionPlan ||
      !formData.subscriptionType
    ) {
      toast.error("Please fill all required fields!");
      return false;
    }

    if (formData.userRole === "Student" && !formData.className) {
      toast.error("Please select your class.");
      return false;
    }

    if (
      !["<13", "13-14", "15-17"].includes(formData.ageGroup) &&
      !formData.email
    ) {
      toast.error("Email is required for users aged 13 or above.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Password and confirm password must match.");
      return false;
    }

    if (["<13", "13-14", "15-17"].includes(formData.ageGroup)) {
      if (
        !formData.parentName ||
        !formData.parentEmail ||
        !formData.parentMobileNumber
      ) {
        toast.error("Parent details are required for users under 18.");
        return false;
      }
    }

    if (!formData.agree) {
      toast.error("Please agree to the consent before submitting.");
      return false;
    }

    if (!agreeTerms) {
      toast.error("Please agree to the Terms & Conditions.");
      return false;
    }

    return true;
  };

  // const handleSubmit = async (e) => {
  const handleSubmit = async () => {
    // e.preventDefault();
    setLoading(true);

    // upgrade plan flow
    if (isUpgradeMode) {
      try {
        // 🔹 Only plan related validation
        if (!formData.subscriptionPlan || !formData.subscriptionType) {
          toast.error("Please select subscription plan and type!");
          setLoading(false);
          return;
        }

        toast.info("Plan upgrades are currently managed by the WrdsAI team.");
      } catch (err) {
        toast.error(
          err.response?.data?.error || "Plan upgrade failed. Please try again.",
        );
      } finally {
        setLoading(false);
      }

      return; // ⛔ stop further execution
    }

    // Validation
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // Prepare data for backend
    const submitData = {
      ...formData,
      email:
        formData.ageGroup === "<13" ? formData.parentEmail : formData.email,
      mobile: formData.mobileNumber
        ? `${formData.mobileCode}${formData.mobileNumber}`
        : null,

      parentMobile: formData.parentMobileNumber
        ? `${formData.parentMobileCode}${formData.parentMobileNumber}`
        : null,
      dateOfBirth: formData.dateOfBirth
        ? formData.dateOfBirth.toISOString().split("T")[0]
        : null,
      className: formData.className,
      subscriptionPlan: formData.subscriptionPlan, // 🔥 ENSURE it's included
      childPlan: formData.childPlan || null, // 🔥 ENSURE it's included
      subscriptionType: formData.subscriptionType, // 🔥 ENSURE it's included
      userRole: formData.userRole,
    };

    try {
      // Free Trial and assigned plans register directly.
      if (submitData.subscriptionPlan === "Free Trial" || submitData.subscriptionType === FREE_TRIAL_TYPE) {
        const res = await axios.post(
          `${apiBaseUrl}/api/ai/register`,
          submitData,
        );
        console.log("free trial dataaa :::::", res);
        toast.success("Registration complete! You can now log in.");

        // Form reset
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          mobile: "",
          dateOfBirth: null,
          ageGroup: "",
          className: "",
          parentName: "",
          parentEmail: "",
          parentMobile: "",
          subscriptionPlan: DEFAULT_SUBSCRIPTION_PLAN,
          childPlan: DEFAULT_CHILD_PLAN,
          subscriptionType: "",
          agree: false,
          agreeActivation: false,
          agreepermission: false,
        });
        setAgreeTerms(false);

        // data returned should contain remainingTokens etc.
        // Reset form or redirect to login
        setTimeout(() => {
          navigate("/login");
        }, 1800);
        setLoading(false);
        return;
      }

      const res = await axios.post(`${apiBaseUrl}/api/ai/register`, submitData);
      console.log(res);
      // ✅ Success toaster
      toast.success("Registration complete! You can now log in.");

      // Form reset
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobile: "",
        dateOfBirth: null,
        ageGroup: "",
        className: "",
        parentName: "",
        parentEmail: "",
        parentMobile: "",
        subscriptionPlan: DEFAULT_SUBSCRIPTION_PLAN,
        childPlan: DEFAULT_CHILD_PLAN,
        subscriptionType: "",
        agree: false,
        agreeActivation: false,
        agreepermission: false,
      });

      setAgreeTerms(false);
      setTimeout(() => {
        navigate("/login");
      }, 1800);
      return;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        "Registration failed";
      // ✅ Error toaster
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 12% 8%, rgba(18, 104, 251, 0.12), transparent 28%), linear-gradient(135deg, #f8fbff 0%, #eef5ff 44%, #ffffff 100%)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            // flexDirection: isSmallScreen ? "column" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            // alignItems:"center",
            px: { xs: 1, sm: 2, md: 2, lg: 2 },
            flexShrink: 0,
            background:
              "linear-gradient(118deg, #b552ff 0%, #705cff 48%, #2eb8ff 100%)",
            zIndex: 100,
            width: "100%",
            position: "relative",
            height: { xs: "48px", sm: "56px" },
            minHeight: { xs: "48px", sm: "56px" },
            boxShadow: "0 12px 30px rgba(73, 43, 170, 0.24)",
            py: 0,
          }}
        >
          {/* HEADER CONTENT */}
          {/* <img
            src={Wrds1}
            height={66}
            width={196}
            alt="Logo"
            // style={{ marginLeft: "-15px" }}
            // sx={{
            //   width: 196,
            //   height: {
            //     xs: 66, // mobile
            //     sm: 66, // tablet
            //     md: 66, // laptop
            //     lg: 20, // large screen
            //   },
            //   ml: "-15px",
            // }}
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
          <Typography
            component="h1"
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              color: "#fff",
              fontSize: { xs: "19px", sm: "22px" },
              fontWeight: 800,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Registration
          </Typography>
        </Box>
        {/* height={48} width={135} */}

        {/* Scrollable Content Area */}
        <Box
          sx={{
            marginTop: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: { xs: 0.8, sm: 1, md: 0.9 },
            width: "100%",
            flex: 1,
            overflowY: "hidden",
            overflowX: "hidden",
            pb: 0,
          }}
        >
          <Box
            sx={{
              padding: { xs: 1.4, sm: 1.8, md: 1.9 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: { xs: "100%", sm: "92%", md: "80%" },
              maxWidth: 920,
              maxHeight: "calc(100vh - 72px)",
              overflow: "hidden",
              border: "1px solid rgba(18, 104, 251, 0.16)",
              borderRadius: { xs: "18px", sm: "24px" },
              boxShadow:
                "0 24px 70px rgba(15, 23, 42, 0.16), 0 1px 0 rgba(255, 255, 255, 0.9) inset",
              bgcolor: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(10px)",
              "& .MuiInputLabel-root": registerLabelSx,
              "& .MuiOutlinedInput-root": registerFieldSx["& .MuiOutlinedInput-root"],
              "& .MuiInputBase-input": registerFieldSx["& .MuiInputBase-input"],
              "& .MuiFormHelperText-root": {
                marginTop: "2px",
                fontSize: "11px",
              },
              "& .MuiCheckbox-root": {
                padding: { xs: "3px 8px", sm: "4px 8px" },
              },
              "& form": {
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                columnGap: { xs: 0, md: 3 },
                rowGap: { xs: 0.7, md: 0.8 },
                width: "100%",
              },
              "& form > .MuiGrid-container": {
                width: "100%",
                marginBottom: "0 !important",
              },
              "& form > .MuiGrid-container:first-of-type": {
                gridColumn: "1 / -1",
              },
              "& form > .MuiBox-root": {
                gridColumn: "1 / -1",
              },
            }}
          >
            <Typography
              component="h1"
              variant="h5"
              sx={{ display: "none" }}
            >
              {isUpgradeMode ? "Upgrade Plan" : "Create Account"}
            </Typography>

            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <Grid container spacing={2} sx={{ width: "100%", mb: 2 }}>
                {/* First Name */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    First Name *
                  </InputLabel>

                  <TextField
                    fullWidth
                    size="small"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isUpgradeMode}
                    required
                    InputProps={{
                      readOnly: isUpgradeMode,
                      sx: {
                        height: { xs: 30, sm: 42 },
                        fontSize: { xs: "15px", sm: "17px" },
                      },
                    }}
                  />
                </Grid>

                {/* Last Name */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Last Name *
                  </InputLabel>

                  <TextField
                    fullWidth
                    size="small"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isUpgradeMode}
                    required
                    InputProps={{
                      readOnly: isUpgradeMode,
                      sx: {
                        height: { xs: 30, sm: 42 },
                        fontSize: { xs: "15px", sm: "17px" },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Role, DOB & Class */}
              <Grid
                container
                spacing={2}
                sx={{
                  gridColumn: "1 / -1",
                  width: "100%",
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                {/* User Role */}
                <Grid size={{ xs: 12, sm: 2 }}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    I am *
                  </InputLabel>

                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="userRole"
                    value={formData.userRole}
                    onChange={handleChange}
                    disabled={isUpgradeMode}
                    required
                    InputProps={{
                      readOnly: isUpgradeMode,
                      sx: {
                        height: { xs: 30, sm: 42 },
                        fontSize: { xs: "15px", sm: "17px" },
                      },
                    }}
                  >
                    {userRoleOptions.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Date of Birth */}
                <Grid size={{ xs: 12, sm: 3 }}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Date of Birth *
                  </InputLabel>

                  <DatePicker
                    value={formData.dateOfBirth}
                    onChange={handleDateChange}
                    disabled={isUpgradeMode}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          readOnly: isUpgradeMode,
                          sx: {
                            height: { xs: 30, sm: 42 },
                            fontSize: { xs: "15px", sm: "17px" },
                          },
                        },
                      },
                    }}
                    maxDate={new Date()}
                  />
                </Grid>

                {/* Class */}
                <Grid size={{ xs: 12, sm: 2 }}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Class *
                  </InputLabel>

                  <TextField
                    select
                    disabled={isUpgradeMode}
                    fullWidth
                    size="small"
                    name="className"
                    value={formData.className}
                    required
                    onChange={handleChange}
                    InputProps={{
                      readOnly: isUpgradeMode,
                      sx: {
                        height: { xs: 30, sm: 42 },
                        fontSize: { xs: "15px", sm: "17px" },
                      },
                    }}
                  >
                    {classOptions.map((className) => (
                      <MenuItem key={className} value={className}>
                        {className}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {!["<13", "13-14", "15-17"].includes(formData.ageGroup) && (
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <InputLabel
                      sx={{
                        fontSize: { xs: "17px", sm: "19px", md: "19px" },
                        fontFamily: "Calibri, sans-serif",
                        width: "100%",
                      }}
                    >
                      Email{" "}
                      {["<13", "13-14", "15-17"].includes(formData.ageGroup)
                        ? "(Optional)"
                        : "*"}
                    </InputLabel>

                    <TextField
                      fullWidth
                      size="small"
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled={["<13", "13-14", "15-17"].includes(
                        formData.ageGroup
                      )}
                      onChange={handleChange}
                      required={
                        !["<13", "13-14", "15-17"].includes(
                          formData.ageGroup
                        )
                      }
                      InputProps={{
                        sx: {
                          height: { xs: 30, sm: 42 },
                          fontSize: { xs: "15px", sm: "17px" },
                        },
                      }}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography
                    sx={{
                      mt: "-4px",
                      fontSize: "14px",
                      fontFamily: "Calibri, sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: "red", fontWeight: 600 }}>Note:</span>{" "}
                    Visit{" "}
                    <a
                      href="https://wrdsai.com/pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1976d2", textDecoration: "underline" }}
                    >
                      https://wrdsai.com/pricing
                    </a>{" "}
                    before you choose your subscription type.
                  </Typography>
                </Grid>
              </Grid>

              {/* First Name & Last Name - In one row */}
              {/* <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "center", sm: "flex-start" },
                  gap: 2,
                  width: "100%",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    // alignItems: { xs: "center", sm: "flex-start" },
                  }}
                >
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    First Name *
                  </InputLabel>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: { xs: "center", sm: "flex-start" },
                      width: "100%",
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      InputProps={{
                        sx: {
                          width: { xs: "230px", sm: "210px", width: "100%" },
                          height: { xs: 30, sm: 42 },
                          fontSize: { xs: "15px", sm: "17px" },
                        },
                      }}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    // alignItems: { xs: "center", sm: "flex-start" },
                  }}
                >
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Last Name *
                  </InputLabel>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: { xs: "center", sm: "flex-start" },
                      width: "100%",
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      InputProps={{
                        sx: {
                          width: { xs: "230px", sm: "210px" },
                          height: { xs: 30, sm: 42 },
                          fontSize: { xs: "15px", sm: "17px" },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box> */}

              {/* Country & Date of Birth - In one row */}
              {/* <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "center", sm: "flex-start" },
                  gap: { xs: 1.5, sm: 2 },
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    // alignItems: { xs: "center", sm: "flex-start" },
                  }}
                >
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Date of Birth *
                  </InputLabel>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: { xs: "center", sm: "flex-start" },
                      width: "100%",
                    }}
                  >
                    <DatePicker
                      value={formData.dateOfBirth}
                      onChange={handleDateChange}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          required: true,
                          InputProps: {
                            sx: {
                              width: { xs: "230px", sm: "210px" },
                              height: { xs: 30, sm: 42 },
                              fontSize: { xs: "15px", sm: "17px" },
                            },
                          },
                        },
                      }}
                      maxDate={new Date()}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    // alignItems: { xs: "center", sm: "flex-start" },
                  }}
                >
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Age Group *
                  </InputLabel>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: { xs: "center", sm: "flex-start" },
                      width: "100%",
                    }}
                  >
                    <TextField
                      select
                      disabled
                      fullWidth
                      size="small"
                      name="ageGroup"
                      value={formData.ageGroup}
                      required
                      onChange={handleChange}
                      InputProps={{
                        sx: {
                          width: { xs: "230px", sm: "210px" },
                          height: { xs: 30, sm: 42 },
                          fontSize: { xs: "15px", sm: "17px" },
                        },
                      }}
                    >
                      {ageGroups.map((age) => (
                        <MenuItem key={age} value={age}>
                          {age}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </Box>
              </Box> */}

              {/*               
              <Grid
                container
                spacing={2}
                sx={{
                  mb: { xs: 1.5, sm: 2 },
                }}
              >
                <Grid item xs={12} sm={6}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Date of Birth *
                  </InputLabel>

                
                  <DatePicker
                    value={formData.dateOfBirth}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        size: "small",
                        required: true,
                        fullWidth: true,
                        sx: {
                          maxWidth: { xs: "230px", sm: "210px" },
                          margin: { xs: "0 auto", sm: "0" },
                          "& .MuiInputBase-root": {
                            height: { xs: 30, sm: 42 },
                            fontSize: { xs: "15px", sm: "17px" },
                          },
                        },
                      },
                    }}
                    maxDate={new Date()}
                  />
                </Grid>

                <Grid item xs={12} sm={6} >
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    Age Group *
                  </InputLabel>

               
                  <TextField
                    select
                    disabled
                    
                    size="small"
                    name="ageGroup"
                    value={formData.ageGroup}
                    required
                    onChange={handleChange}
                    sx={{
                      maxWidth: { xs: "230px", sm: "210px" },
                      margin: { xs: "0 auto", sm: "0" },
                      "& .MuiInputBase-root": {
                        height: { xs: 30, sm: 42 },
                        fontSize: { xs: "15px", sm: "17px" },
                      },
                    }}
                    fullWidth
                  >
                    {ageGroups.map((age) => (
                      <MenuItem key={age} value={age}>
                        {age}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid> */}

              <Grid
                container
                spacing={1}
                sx={{
                  mb: 0,
                  display: "flex",
                  gridColumn: { md: "1 / -1" },
                }}
              >
                <Grid item xs={12} sm={6}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                      width: "100%",
                    }}
                  >
                    Enter Password *
                  </InputLabel>
                  <TextField
                    size="small"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    InputProps={{
                      sx: {
                        height: { xs: 30, sm: 42 },
                        fontSize: { xs: "15px", sm: "17px" },
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
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
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                      width: "100%",
                    }}
                  >
                    Confirm Password *
                  </InputLabel>
                  <TextField
                    size="small"
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    error={
                      Boolean(formData.confirmPassword) &&
                      formData.password !== formData.confirmPassword
                    }
                    helperText={
                      Boolean(formData.confirmPassword) &&
                      formData.password !== formData.confirmPassword
                        ? "Passwords do not match"
                        : ""
                    }
                    InputProps={{
                      sx: {
                        height: { xs: 30, sm: 42 },
                        fontSize: { xs: "15px", sm: "17px" },
                      },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
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
                    fullWidth
                  />
                </Grid>
              </Grid>

              {/* Mobile */}
              {/* {formData.ageGroup !== "<13" && ( */}
              {!["<13", "13-14", "15-17"].includes(formData.ageGroup) && (
                <Grid
                  container
                  spacing={0}
                  sx={{ mb: 2, display: "flex", flexDirection: "column" }}
                >
                  {/* LABEL */}
                  <Grid item xs={12}>
                    <InputLabel
                      sx={{
                        fontSize: { xs: "17px", sm: "19px", md: "19px" },
                        fontFamily: "Calibri, sans-serif",
                        width: "100%",
                      }}
                    >
                      Mobile Number *
                    </InputLabel>
                  </Grid>

                  {/* TEXTFIELD */}
                  {/* <Grid item xs={12} sm={8} md={6}>
                    <TextField
                      size="small"
                      name="mobile"
                      value={formData.mobile}
                      disabled={isUpgradeMode}
                      onChange={(e) => {
                        let v = e.target.value;

                        // Always start with +91
                        if (!v.startsWith("+91 ")) {
                          v = "+91 " + v.replace("+91", "").replace(" ", "");
                        }

                        setFormData({ ...formData, mobile: v });
                      }}
                      placeholder="+1234567890"
                      required
                      InputProps={{
                        sx: {
                          height: { xs: 30, sm: 42 },
                          fontSize: { xs: "15px", sm: "17px" },
                        },
                      }}
                      fullWidth
                    />
                  </Grid> */}
                  <Grid item xs={12} sm={8} md={6}>
                    <Grid container spacing={1}>
                      {/* ISD CODE */}
                      <Grid item xs={4}>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={formData.mobileCode}
                          disabled={isUpgradeMode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              mobileCode: e.target.value,
                            })
                          }
                          InputProps={{
                            sx: {
                              height: { xs: 30, sm: 42 },
                              fontSize: { xs: "15px", sm: "17px" },
                            },
                          }}
                          SelectProps={{
                            MenuProps: {
                              PaperProps: {
                                sx: {
                                  maxHeight: 220, // 🔥 dropdown height control
                                  width: 120,
                                },
                              },
                            },
                          }}
                        >
                          {allCountries.map((c) => (
                            <MenuItem
                              key={c.iso2}
                              value={`+${c.dialCode}`}
                              sx={{ fontSize: "14px", py: 0.5 }}
                            >
                              +{c.dialCode}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* MOBILE NUMBER */}
                      <Grid item xs={8}>
                        <TextField
                          size="small"
                          fullWidth
                          required
                          disabled={isUpgradeMode}
                          value={formData.mobileNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              mobileNumber: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          placeholder="Mobile number"
                          inputProps={{ maxLength: 15 }}
                          InputProps={{
                            sx: {
                              height: { xs: 30, sm: 42 },
                              fontSize: { xs: "15px", sm: "17px" },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {/* Username */}
              {/* <Box sx={{ mb: 2 }}>
              <InputLabel>Username *</InputLabel>
              <TextField
                fullWidth
                size="small"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Box> */}

              {/* Password */}
              {/* <Box sx={{ mb: 2 }}>
              <InputLabel>Password *</InputLabel>
              <TextField
                fullWidth
                size="small"
                type={showPassword ? "text" : "password"}
                name="password"
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
            </Box> */}

              {/* Parent Fields If Under 18 */}
              {(formData.ageGroup === "<13" ||
                formData.ageGroup === "13-14" ||
                formData.ageGroup === "15-17") && (
                  <>
                    {/* <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <InputLabel
                      sx={{
                        fontSize: { xs: "17px", sm: "19px", md: "19px" },
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      Parent/Guardian Name *
                    </InputLabel>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "center", sm: "flex-start" },
                        width: "100%",
                      }}
                    >
                      <TextField
                        // fullWidth
                        size="small"
                        name="parentName"
                        required
                        onChange={handleChange}
                        InputProps={{
                          sx: {
                            width: { xs: "230px", sm: "440px", md: "467px" },
                            height: { xs: 30, sm: 42 },
                            fontSize: { xs: "15px", sm: "17px" },
                          },
                        }}
                      />
                    </Box>
                  </Box> */}

                    <Grid
                      container
                      spacing={1}
                      sx={{ mb: 2, display: "flex", flexDirection: "column" }}
                    >
                      {/* LABEL */}
                      <Grid item xs={12}>
                        <InputLabel
                          sx={{
                            fontSize: { xs: "17px", sm: "19px", md: "19px" },
                            fontFamily: "Calibri, sans-serif",
                            width: "100%",
                          }}
                        >
                          Parent/Guardian Name *
                        </InputLabel>
                      </Grid>

                      {/* TEXTFIELD */}
                      <Grid item xs={12} sm={8} md={6}>
                        <TextField
                          size="small"
                          name="parentName"
                          value={formData.parentName}
                          disabled={isUpgradeMode}
                          required
                          onChange={handleChange}
                          InputProps={{
                            sx: {
                              height: { xs: 30, sm: 42 },
                              fontSize: { xs: "15px", sm: "17px" },
                            },
                          }}
                          fullWidth
                        />
                      </Grid>
                    </Grid>

                    {/* <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <InputLabel
                      sx={{
                        fontSize: { xs: "17px", sm: "19px", md: "19px" },
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      Parent Email *
                    </InputLabel>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "center", sm: "flex-start" },
                        width: "100%",
                      }}
                    >
                      <TextField
                        // fullWidth
                        size="small"
                        name="parentEmail"
                        value={formData.parentEmail}
                        required
                        onChange={handleChange}
                        InputProps={{
                          sx: {
                            width: { xs: "230px", sm: "440px", md: "467px" },
                            height: { xs: 30, sm: 42 },
                            fontSize: { xs: "15px", sm: "17px" },
                          },
                        }}
                      />
                    </Box>
                  </Box> */}

                    <Grid
                      container
                      spacing={1}
                      sx={{ mb: 2, display: "flex", flexDirection: "column" }}
                    >
                      {/* LABEL */}
                      <Grid item xs={12}>
                        <InputLabel
                          sx={{
                            fontSize: { xs: "17px", sm: "19px", md: "19px" },
                            fontFamily: "Calibri, sans-serif",
                            width: "100%",
                          }}
                        >
                          Parent Email *
                        </InputLabel>
                      </Grid>

                      {/* TEXTFIELD */}
                      <Grid item xs={12} sm={8} md={6}>
                        <TextField
                          size="small"
                          name="parentEmail"
                          value={formData.parentEmail}
                          // disabled={isUpgrade}
                          required
                          onChange={handleChange}
                          InputProps={{
                            sx: {
                              height: { xs: 30, sm: 42 },
                              fontSize: { xs: "15px", sm: "17px" },
                            },
                          }}
                          fullWidth
                        />
                      </Grid>
                    </Grid>

                    {/* <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <InputLabel
                      sx={{
                        fontSize: { xs: "17px", sm: "19px", md: "19px" },
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      Parent Mobile *
                    </InputLabel>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "center", sm: "flex-start" },
                        width: "100%",
                      }}
                    >
                      <TextField
                        // fullWidth
                        size="small"
                        name="parentMobile"
                        value={formData.parentMobile}
                        required
                        // onChange={handleChange}
                        onChange={(e) => {
                          let v = e.target.value;

                          if (!v.startsWith("+91 ")) {
                            v = "+91 " + v.replace("+91", "").replace(" ", "");
                          }

                          setFormData({ ...formData, parentMobile: v });
                        }}
                        InputProps={{
                          sx: {
                            width: { xs: "230px", sm: "440px", md: "467px" },
                            height: { xs: 30, sm: 42 },
                            fontSize: { xs: "15px", sm: "17px" },
                          },
                        }}
                      />
                    </Box>
                  </Box> */}
                    <Grid
                      containerspacing={1}
                      sx={{ mb: 2, display: "flex", flexDirection: "column" }}
                    >
                      {/* LABEL */}
                      <Grid item xs={12}>
                        <InputLabel
                          sx={{
                            fontSize: { xs: "17px", sm: "19px", md: "19px" },
                            fontFamily: "Calibri, sans-serif",
                            width: "100%",
                          }}
                        >
                          Parent Mobile *
                        </InputLabel>
                      </Grid>

                      {/* TEXTFIELD */}
                      {/* <Grid item xs={12} sm={8} md={6}>
                      <TextField
                        size="small"
                        name="parentMobile"
                        value={formData.parentMobile}
                        disabled={isUpgradeMode}
                        required
                        onChange={(e) => {
                          let v = e.target.value;

                          if (!v.startsWith("+91 ")) {
                            v = "+91 " + v.replace("+91", "").replace(" ", "");
                          }

                          setFormData({ ...formData, parentMobile: v });
                        }}
                        InputProps={{
                          sx: {
                            height: { xs: 30, sm: 42 },
                            fontSize: { xs: "15px", sm: "17px" },
                          },
                        }}
                        fullWidth
                      />
                    </Grid> */}
                      {/* ISD + PARENT MOBILE */}
                      <Grid item xs={12} sm={8} md={6}>
                        <Grid container spacing={1}>
                          {/* ISD CODE */}
                          <Grid item xs={4}>
                            <TextField
                              select
                              size="small"
                              fullWidth
                              type="number"
                              disabled={isUpgradeMode}
                              value={formData.parentMobileCode}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  parentMobileCode: e.target.value,
                                })
                              }
                              InputProps={{
                                sx: {
                                  height: { xs: 30, sm: 42 },
                                  fontSize: { xs: "15px", sm: "17px" },
                                },
                              }}
                              SelectProps={{
                                MenuProps: {
                                  PaperProps: {
                                    sx: {
                                      maxHeight: 220, // 🔥 dropdown height control
                                      width: 120,
                                    },
                                  },
                                },
                              }}
                            >
                              {allCountries.map((c) => (
                                <MenuItem
                                  key={c.iso2}
                                  value={`+${c.dialCode}`}
                                  sx={{ fontSize: "14px", py: 0.5 }}
                                >
                                  +{c.dialCode}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>

                          {/* PARENT MOBILE NUMBER */}
                          <Grid item xs={8}>
                            <TextField
                              size="small"
                              fullWidth
                              required
                              disabled={isUpgradeMode}
                              value={formData.parentMobileNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  parentMobileNumber: e.target.value.replace(
                                    /\D/g,
                                    "",
                                  ),
                                })
                              }
                              placeholder="Parent mobile number"
                              inputProps={{ maxLength: 15 }}
                              InputProps={{
                                sx: {
                                  height: { xs: 30, sm: 42 },
                                  fontSize: { xs: "15px", sm: "17px" },
                                },
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </>
                )}

              {/* Subscription Plan */}
              {/* <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <InputLabel
                  sx={{
                    fontSize: { xs: "17px", sm: "19px", md: "19px" },
                    fontFamily: "Calibri, sans-serif",
                  }}
                >
                  Subscription Plan *
                </InputLabel>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "center", sm: "flex-start" },
                    width: "100%",
                  }}
                >
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="subscriptionPlan"
                    value={formData.subscriptionPlan}
                    onChange={handleChange}
                    required
                    sx={{
                      width: { xs: "230px", sm: "440px", md: "467px" },
                      height: { xs: 30, sm: 42 },
                      fontSize: { xs: "15px", sm: "17px" },
                    }}
                  >
                    {subscriptionPlans.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box> */}
              <Grid
                container
                spacing={1}
                sx={{ mb: 2, display: "none", flexDirection: "column" }}
              >
                {/* LABEL */}
                <Grid item xs={12}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                      width: "100%",
                    }}
                  >
                    Subscription Plan *
                  </InputLabel>
                </Grid>

                <Grid item xs={12} sm={8} md={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="subscriptionPlan"
                    value={formData.subscriptionPlan}
                    onChange={handleChange}
                    required
                    sx={{
                      height: { xs: 30, sm: 42 },
                      fontSize: { xs: "15px", sm: "17px" },
                    }}
                  >
                    {subscriptionPlans.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* NOTE LINE */}
                <Grid item xs={12}>
                  <Typography
                    sx={{
                      mt: "-4px",
                      fontSize: "14px",
                      fontFamily: "Calibri, sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: "red", fontWeight: 600 }}>Note:</span>{" "}
                    Visit{" "}
                    <a
                      href="https://wrdsai.com/pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1976d2", textDecoration: "underline" }}
                    >
                      https://wrdsai.com/pricing
                    </a>{" "}
                    before you choose your plan.
                  </Typography>
                </Grid>
              </Grid>

              {/* Sub Options */}
              {showLegacyRegistrationOptions && (
                <Grid
                  container
                  spacing={1}
                  sx={{ mb: 2, display: "flex", flexDirection: "column" }}
                >
                  {/* LABEL */}
                  <Grid item xs={12}>
                    <InputLabel
                      sx={{
                        fontSize: { xs: "17px", sm: "19px", md: "19px" },
                        fontFamily: "Calibri, sans-serif",
                        width: "100%",
                      }}
                    >
                      Plan Option *
                    </InputLabel>
                  </Grid>

                  <Grid item xs={12} sm={8} md={6}>
                    <TextField
                      select
                      size="small"
                      name="childPlan"
                      value={formData.childPlan}
                      onChange={handleChange}
                      disabled={childPlanDisabled}
                      required
                      InputProps={{
                        sx: {
                          height: { xs: 30, sm: 42 },
                          fontSize: { xs: "15px", sm: "17px" },
                        },
                      }}
                      fullWidth
                    >
                      {(formData.subscriptionPlan === "WrdsAI"
                        ? wrdsAIOptions
                        : formData.subscriptionPlan === "WrdsAI Nxt"
                          ? wrdsAiNxtOptions
                          : wrdsAIProOptions
                      ).map((item) => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              )}

              {/* Subscription Type */}
              <Grid
                container
                spacing={1}
                sx={{ mb: 2, display: "flex", flexDirection: "column" }}
              >
                {/* LABEL */}
                <Grid item xs={12}>
                  <InputLabel
                    sx={{
                      fontSize: { xs: "17px", sm: "19px", md: "19px" },
                      fontFamily: "Calibri, sans-serif",
                      width: "100%",
                    }}
                  >
                    Subscription Type *
                  </InputLabel>
                </Grid>

                <Grid item xs={12} sm={8} md={6}>
                  <TextField
                    select
                    // fullWidth
                    size="small"
                    name="subscriptionType"
                    value={formData.subscriptionType}
                    onChange={handleChange}
                    // disabled={subscriptionTypeDisabled}
                    required
                    InputProps={{
                      sx: {
                        height: { xs: 30, sm: 42 },
                        fontSize: { xs: "15px", sm: "17px" },
                      },
                    }}
                    fullWidth
                  >
                    {subscriptionTypes.map((type) => (
                      <MenuItem
                        key={type}
                        value={type}
                        // disabled={
                        //   ["WrdsAI", "WrdsAIPro"].includes(
                        //     formData.subscriptionPlan
                        //   ) && type === "One Time"
                        // }
                        disabled={false}
                      >
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* Consent Checkbox */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  // justifyContent: { xs: "center", sm: "flex-start" },
                  mb: 0,
                }}
              >
                <Checkbox
                  checked={formData.agree}
                  onChange={(e) =>
                    setFormData({ ...formData, agree: e.target.checked })
                  }
                />
                <Typography
                  sx={{
                    fontSize: { xs: "13px", sm: "16px", md: "17px" },
                    fontFamily: "Calibri, sans-serif",
                  }}
                >
                  I consent the above information is correct.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  // justifyContent: { xs: "center", sm: "flex-start" },
                  mb: "-6px",
                  cursor: "pointer",
                }}
              >
                <Checkbox
                  // checked={formData.agree}
                  // onChange={(e) =>
                  //   setFormData({ ...formData, agree: e.target.checked })
                  checked={agreeTerms} // always unchecked (only for opening modal)
                  onClick={() => setOpenTerms(true)}
                />
                <Typography
                  sx={{
                    fontSize: { xs: "13px", sm: "16px", md: "17px" },
                    fontFamily: "Calibri, sans-serif",
                  }}
                >
                  I agree to WrdsAI terms & conditions.
                </Typography>
              </Box>

              {/* New Activation Consent */}
              {showLegacyRegistrationOptions && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  // justifyContent: { xs: "center", sm: "flex-start" },
                  mt: 0,
                }}
              >
                <Checkbox
                  checked={formData.agreeActivation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      agreeActivation: e.target.checked,
                    })
                  }
                />
                <Typography
                  sx={{
                    fontSize: { xs: "13px", sm: "16px", md: "17px" },
                    fontFamily: "Calibri, sans-serif",
                  }}
                >
                  I agree that my account will be activated within 24 hours.
                </Typography>
              </Box>
              )}

              {showLegacyRegistrationOptions && ["<13", "13-14", "15-17"].includes(formData.ageGroup) && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    // justifyContent: { xs: "center", sm: "flex-start" },
                    mt: 1,
                  }}
                >
                  <Checkbox
                    checked={formData.agreepermission}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        agreepermission: e.target.checked,
                      })
                    }
                  />
                  <Typography
                    sx={{
                      fontSize: { xs: "13px", sm: "16px", md: "17px" },
                      fontFamily: "Calibri, sans-serif",
                    }}
                  >
                    I am the parent/guardian of the User and I’m giving consent
                    to their use of WrdsAI.
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", sm: "flex-start" },
                  width: "100%",
                }}
              >
                {/* <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: { xs: 1, sm: 2 },
                    mb: { xs: 1, sm: 2, md: 1 },
                    fontSize: { xs: "14px", sm: "16px" },
                    padding: { xs: "10px", sm: "14px" },
                    width: { xs: "230px", sm: "440px", md: "100%" },
                    height: { xs: 36, sm: 42 },
                  }}
                  disabled={loading}
                  size="large"
                >
                  {loading ? <CircularProgress size={24} /> : "Register"}
                </Button> */}
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: { xs: 0.5, sm: 0.8 },
                    mb: { xs: 0.5, sm: 0.8, md: 0.5 },
                    fontSize: { xs: "14px", sm: "16px" },
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    padding: { xs: "8px", sm: "10px" },
                    width: { xs: "230px", sm: "440px", md: "100%" },
                    height: { xs: 36, sm: 40 },
                    borderRadius: "12px",
                    textTransform: "uppercase",
                    background:
                      "linear-gradient(118deg, #b552ff 0%, #705cff 48%, #2eb8ff 100%)",
                    boxShadow: "0 12px 24px rgba(73, 43, 170, 0.28)",
                    "&:hover": {
                      background:
                        "linear-gradient(118deg, #a84cff 0%, #6453f2 48%, #24aef5 100%)",
                      boxShadow: "0 16px 30px rgba(73, 43, 170, 0.34)",
                    },
                  }}
                  disabled={loading}
                  size="large"
                  onClick={(e) => {
                    e.preventDefault();

                    if (!validateForm()) return;

                    handleSubmit();
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : "Register"}
                </Button>
              </Box>

              <Box
                sx={{
                  textAlign: "center",
                  fontSize: { xs: "13px", sm: "14px" },
                  fontFamily: "Calibri, sans-serif",
                }}
              >
                <span>Already have an account? </span>
                <Link component={RouterLink} to="/login" variant="body2">
                  Sign In
                </Link>
              </Box>
            </form>
          </Box>
        </Box>

        <Modal open={openTerms} onClose={() => setOpenTerms(false)}>
          <Box
            sx={{
              width: { xs: "68%", sm: "60%", md: "40%" },
              bgcolor: "#fff",
              p: 3,
              borderRadius: 2,
              mx: "auto",
              mt: { xs: "30%", sm: "18%", md: "10%" },
              boxShadow: 24,
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              WrdsAI – Terms & Conditions
            </Typography>

            <Typography sx={{ mb: 3, fontSize: "15px", lineHeight: "22px" }}>
              {/* <strong>WrdsAI – Terms & Conditions</strong> <br />
              <br /> */}
              <strong>Last updated:</strong> 15th Dec 2025 <br />
              <br />
              Welcome to WrdsAI. By creating an account or using our services,
              you agree to the following Terms & Conditions. <br />
              <br />
              <strong>1. About WrdsAI</strong> <br />
              WrdsAI is an AI-powered learning platform primarily designed to
              support K–12 education through responsible and age-appropriate
              use. <br />
              <br />
              <strong>2. Eligibility & Use by Parents</strong> <br />
              WrdsAI is intended for school-age learners. Users under the age of
              18 are expected to use the service with the knowledge and consent
              of a parent or legal guardian. Parents and guardians are
              encouraged to remain involved and guide how WrdsAI is used as part
              of a child’s learning. <br />
              <br />
              <strong>3. Account Registration</strong> <br />
              You are responsible for maintaining the confidentiality of your
              login details and for all activity that occurs under your account.
              WrdsAI may suspend or terminate accounts that violate these Terms,
              immediately. <br />
              <br />
              <strong>4. Subscription & Account Access</strong> <br />
              WrdsAI access is based on the plan assigned to your account.
              Unused time or tokens do not carry over unless explicitly stated
              by the WrdsAI team. <br />
              <br />
              <strong>5. Account Activation</strong> <br />
              Account access may be reviewed or activated by the WrdsAI team as
              part of WrdsAI&apos;s safety and quality standards. <br />
              <br />
              <strong>6. Acceptable Use</strong> <br />
              Users agree to use WrdsAI responsibly and for lawful educational
              purposes only. <br />
              You must not misuse the service, attempt to bypass safeguards, or
              engage in harmful or abusive behaviour. <br />
              <br />
              <strong>7. Service Availability</strong> <br />
              WrdsAI is provided on an “as-is” and “as-available” basis. While
              we aim to keep the service reliable, uninterrupted or error-free
              access cannot be guaranteed. <br />
              <br />
              <strong>8. Changes to the Service</strong> <br />
              WrdsAI may update, modify, or discontinue features at any time. We
              may remove deprecated LLM models and add new ones without prior
              notice. We may also revise these Terms when necessary. Continued
              use of the service indicates acceptance of any updates. <br />
              <br />
              <strong>9. Limitation of Liability</strong> <br />
              To the maximum extent permitted by law, WrdsAI is not liable for
              indirect, incidental, or consequential damages arising from use of
              the service. WrdsAI is a learning support tool and does not
              replace teachers, schools, or professional guidance. <br />
              <br />
              <strong>10. Contact Information</strong> <br />
              For questions or support, please contact us at: support@wrdsai.com{" "}
              <br />
              <br />
              <strong>11. Data Collection and Use</strong> <br />
              We collect only your name, email address, and mobile number for
              account creation, authentication, and service delivery purposes.
              This personal data is stored securely and used solely to: <br />
              • Verify your identity and manage your account <br />• Deliver
              login credentials and important service notifications <br />
              • Provide customer support when requested <br />
              <br />
              We do not and will not: <br />
              • Profile, track, or monitor your behavior or your child’s
              behavior <br />
              • Use your data for targeted advertising or share it with
              advertisers <br />
              • Sell, rent, or disclose your personal data to third parties for
              marketing purposes <br />
              • Process data in any manner that could harm your child’s
              well-being <br />
              <br />
              For users under 18, we require verifiable parental consent. Login
              credentials are sent exclusively to the parent’s email address to
              ensure parental oversight and control. Parents may withdraw
              consent and request account deletion at any time by contacting
              support@wrdsai.com <br />
              <br />
              Your data is retained only as long as your account is active or as
              required by law. We implement appropriate technical and
              organizational security measures to protect your information in
              accordance with the Digital Personal Data Protection Act, 2023.
            </Typography>

            {/* Checkbox inside Modal */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Checkbox
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <Typography
                sx={{
                  fontSize: { xs: "14px", sm: "16px" },
                  fontFamily: "Calibri, sans-serif",
                }}
              >
                I have read and agree to the Terms & Conditions *
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={() => setOpenTerms(false)}
            >
              Close
            </Button>
          </Box>
        </Modal>
      </Box>
    </LocalizationProvider>
  );
};

export default Register;
