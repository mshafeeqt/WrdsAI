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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close"; // 🔥 Added CloseIcon
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Words2 from "././assets/words2.png"; // path adjust karo
import { useTheme, useMediaQuery } from "@mui/material";
import PaymentModal from "./PaymentModal";
import Wrds from "././assets/Wrds White.webp";
import Wrds1 from "././assets/wrdsai1.png";
import { useLocation } from "react-router-dom";
import { allCountries } from "country-telephone-data";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    // mobile: "+91 ",
    mobileCode: "+91",
    mobileNumber: "",
    // country: "",
    dateOfBirth: null,
    ageGroup: "",
    parentName: "",
    parentEmail: "",
    // parentMobile: "+91 ",
    parentMobileCode: "+91",
    parentMobileNumber: "",
    subscriptionPlan: "",
    childPlan: "",
    subscriptionType: "",
    agree: false,
    agreeActivation: false,
    agreepermission: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [priceINR, setPriceINR] = useState(0);
  const [openTerms, setOpenTerms] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [childPlanDisabled, setChildPlanDisabled] = useState(false);
  const [subscriptionTypeDisabled, setSubscriptionTypeDisabled] =
    useState(false);
  // const [coupon, setCoupon] = useState("");
  // const [discount, setDiscount] = useState(0);
  // const [finalAmount, setFinalAmount] = useState(0);
  const [openCouponModal, setOpenCouponModal] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const location = useLocation();
  // const isUpgrade = location.state?.isUpgrade;
  const isUpgrade = Boolean(location.state?.isUpgrade);
  const userData = location.state?.userData;

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Country options
  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "India",
    "Germany",
    "France",
    "Japan",
    "Brazil",
    "Other",
  ];
  const ageGroups = ["<13", "13-14", "15-17", "18+"];
  const subscriptionPlans = ["WrdsAI", "WrdsAIPro", "WrdsAI Nxt", "Free Trial"];
  const wrdsAIOptions = ["Glow Up", "Level Up", "Rise Up"];
  const wrdsAIProOptions = ["Step Up", "Speed Up", "Scale Up"];
  const wrdsAiNxtOptions = ["Boost Up"];
  const subscriptionTypes = ["Monthly", "Yearly", "One Time"];

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const BASE_PRICES_INR = {
    WrdsAI: {
      "Glow Up": { Monthly: 83.9, Yearly: 922.86 },
      "Level Up": { Monthly: 168.64, Yearly: 1694.09 },
      "Rise Up": { Monthly: 338.14, Yearly: 3388.98 },
    },
    WrdsAIPro: {
      "Step Up": { Monthly: 422.88, Yearly: 4651.69 },
      "Speed Up": { Monthly: 761.86, Yearly: 7626.44 },
      "Scale Up": { Monthly: 1355.09, Yearly: 13558.5 },
    },
    "WrdsAI Nxt": {
      "Boost Up": { Monthly: 999, Yearly: 10999 },
    },
  };

  useEffect(() => {
    const { subscriptionPlan, childPlan, subscriptionType } = formData;
    if (subscriptionPlan && childPlan && subscriptionType) {
      const basePrice =
        BASE_PRICES_INR[subscriptionPlan]?.[childPlan]?.[subscriptionType];

      if (basePrice) {
        const gstAmount = Math.round(basePrice * 0.18 * 100) / 100;
        const totalAmount = Math.round((basePrice + gstAmount) * 100) / 100;
        setPriceINR(totalAmount);
      } else {
        setPriceINR(0);
      }
    } else {
      setPriceINR(0);
    }
  }, [
    formData.subscriptionPlan,
    formData.childPlan,
    formData.subscriptionType,
  ]);

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
        subscriptionType: "", // ❌ no auto select
      }));

      // optional: child plan logic
      setChildPlanDisabled(value === "Free Trial");

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

  const handlePayment = async (mode, upiId = "") => {
    setAgreeTerms(false);

    if (mode === "qr") {
      window.location.href = `upi://pay?pa=mymerchant@upi&pn=CarbonAI&am=${priceINR}&cu=INR`;
      return;
    }

    if (mode === "pay") {
      const res = await axios.post(`${apiBaseUrl}/api/create-upi`, {
        upiId,
        amount: priceINR,
        discount: discount, // 🔥 Pass discount
      });

      window.location.href = res.data.upiUrl; // open UPI app
    }
  };

  const createOrderOnServer = async (amount) => {
    const res = await fetch(`${apiBaseUrl}/api/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    return res.json();
  };

  const verifyPaymentOnServer = async (payload) => {
    const res = await fetch(`${apiBaseUrl}/api/payments/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = "/login"; // <-- REDIRECT HERE
    }

    return data;
  };

  const openRazorpayCheckout = async (order) => {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const isUnder18 = parentAgeGroups.includes(formData.ageGroup);

    const contactNumber = isUnder18
      ? formData.parentMobileNumber
        ? `${formData.parentMobileCode}${formData.parentMobileNumber}`
        : undefined
      : formData.mobileNumber
        ? `${formData.mobileCode}${formData.mobileNumber}`
        : undefined;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // your key id from .env
      amount: order.amount,
      currency: order.currency,
      name: "WrdsAI",
      description: "Order Payment",
      order_id: order.id,

      // 🔥🔥 THIS IS THE MAIN CHANGE 🔥🔥
      prefill: {
        name: fullName, // 👈 USER NAME SHOW THASE
        email: paymentEmail, // already correct
        contact: contactNumber,
      },

      handler: async function (response) {
        // Show loader during verification
        setLoading(true);
        try {
          // Response contains razorpay_order_id, razorpay_payment_id, razorpay_signature
          const verifyResult = await verifyPaymentOnServer({
            // ...response,
            // email: paymentEmail, // Pass email for password generation

            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,

            email: paymentEmail,

            // 🔑 THIS IS THE KEY
            isUpgrade: isUpgradeMode === true,

            // 🔑 ONLY needed for upgrade
            subscriptionPlan: formData.subscriptionPlan,
            childPlan: formData.childPlan || null,
            subscriptionType: formData.subscriptionType,
            discount: discount, // 🔥 Pass discount value
          });
        } catch (error) {
          console.error("Verification failed", error);
        } finally {
          // Stop loader after verification (or if logic decides otherwise)
          setLoading(false);
        }

        // if (verifyResult && verifyResult.success) {
        //   alert("Payment successful and verified!");
        //   navigate("/login");
        // } else {
        //   alert("Payment verification failed. Please contact support.");
        // }
      },
      modal: {
        ondismiss: function () {
          console.log("Checkout closed by user");
        },
      },
    };

    // eslint-disable-next-line no-undef
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleRazorpay = async (amount) => {
    try {
      console.log("START PAYMENT");
      console.log("API URL:", apiBaseUrl);
      console.log("KEY:", import.meta.env.VITE_RAZORPAY_KEY_ID);

      const createResp = await createOrderOnServer(amount);
      console.log("ORDER RESPONSE:", createResp);

      if (!createResp || !createResp.order) {
        alert("Failed to create order");
        return;
      }

      console.log("Opening Razorpay checkout...");

      await openRazorpayCheckout(createResp.order);
    } catch (err) {
      console.error("razorpay flow err:", err);
      alert("Payment failed to start");
    }
  };

  const parentAgeGroups = ["<13", "13-14", "15-17"];

  // final email (auto handles parent email if <13)
  const paymentEmail = parentAgeGroups.includes(formData.ageGroup)
    ? formData.parentEmail
    : formData.email;

  const applyCoupon = async (planPrice) => {
    try {
      const res = await axios.post(
        `${apiBaseUrl}/api/payments/validate-coupon`,
        {
          couponCode: coupon,
          amount: planPrice,
        },
      );

      setDiscount(res.data.discount);
      setFinalAmount(res.data.finalAmount);
      return res.data.finalAmount;
    } catch (err) {
      toast.error("Invalid coupon code");
      return planPrice;
    }
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.dateOfBirth ||
      !formData.subscriptionPlan ||
      !formData.subscriptionType
    ) {
      toast.error("Please fill all required fields!");
      return false;
    }

    if (
      !["<13", "13-14", "15-17"].includes(formData.ageGroup) &&
      !formData.email
    ) {
      toast.error("Email is required for users aged 13 or above.");
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

    if (!formData.agreeActivation) {
      toast.error(
        "Please agree that your account will be activated within 24 hours.",
      );
      return false;
    }

    if (
      ["<13", "13-14", "15-17"].includes(formData.ageGroup) &&
      !formData.agreepermission
    ) {
      toast.error("Parent/guardian consent is required for users under 18.");
      return false;
    }

    if (!agreeTerms) {
      toast.error("Please agree to the Terms & Conditions.");
      return false;
    }

    return true;
  };

  // const handleSubmit = async (e) => {
  const handleSubmit = async (payableAmount = null) => {
    // e.preventDefault();
    setLoading(true);
    setAgreeTerms(false);

    // upgrade plan flow
    if (isUpgradeMode) {
      try {
        // 🔹 Only plan related validation
        if (!formData.subscriptionPlan || !formData.subscriptionType) {
          toast.error("Please select subscription plan and type!");
          setLoading(false);
          return;
        }

        // 🔹 Call upgrade API (NO re-registration)
        const res = await axios.post(
          `${apiBaseUrl}/api/payments/upgrade-plan`,
          {
            email: formData.email, // existing user email
            subscriptionPlan: formData.subscriptionPlan,
            childPlan: formData.childPlan || null,
            subscriptionType: formData.subscriptionType,
            couponCode: coupon, // 🔥 pass coupon code
          },
        );

        // 🔹 Start Razorpay payment
        const amountToPay = payableAmount ?? res.data.totalAmount;
        setPriceINR(amountToPay);
        await handleRazorpay(amountToPay);

        toast.success("Plan upgrade initiated successfully!");
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
      subscriptionPlan: formData.subscriptionPlan, // 🔥 ENSURE it's included
      childPlan: formData.childPlan || null, // 🔥 ENSURE it's included
      subscriptionType: formData.subscriptionType, // 🔥 ENSURE it's included
      couponCode: coupon, // 🔥 pass coupon code
    };

    try {
      // If Free Trial -> direct register, skip payment
      if (submitData.subscriptionPlan === "Free Trial") {
        const res = await axios.post(
          `${apiBaseUrl}/api/ai/register`,
          submitData,
        );
        console.log("free trial dataaa :::::", res);
        toast.success("Free Trial activated! Check email for password.");

        // Form reset
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          mobile: "",
          dateOfBirth: null,
          ageGroup: "",
          parentName: "",
          parentEmail: "",
          parentMobile: "",
          subscriptionPlan: "",
          childPlan: "",
          subscriptionType: "",
          agree: false,
          agreeActivation: false,
          agreepermission: false,
        });

        // data returned should contain remainingTokens etc.
        // Reset form or redirect to login
        // optional: navigate("/login");
        setLoading(false);
        return;
      }

      const res = await axios.post(`${apiBaseUrl}/api/ai/register`, submitData);
      console.log(res);
      // ✅ Success toaster
      toast.success("Registration successful! Redirecting to login...");

      // Form reset
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        dateOfBirth: null,
        ageGroup: "",
        parentName: "",
        parentEmail: "",
        parentMobile: "",
        subscriptionPlan: "",
        childPlan: "",
        subscriptionType: "",
        agree: false,
        agreeActivation: false,
        agreepermission: false,
      });

      // setPriceINR(res.data.user.subscription.priceINR);
      setPriceINR(res.data.paymentAmount); // આ total INR with GST છે
      // setOpenPayment(true);

      // await handleRazorpay(res.data.paymentAmount);
      const amountToPay = payableAmount ?? res.data.paymentAmount;

      await handleRazorpay(amountToPay);

      toast.success(`Payment: ₹${res.data.priceBreakdown.total} (incl. GST)`);

      // ✅ Success pachi login page par navigate
      setTimeout(() => {
        // navigate("/login");
      }, 2000);
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
            bgcolor: "#1268fb",
            zIndex: 100,
            width: "100%",
            position: "fixed",
            top: 0,
            left: 0,
            height: { xs: "66px", sm: "63px", md: "84px", lg: "84px" },
            minHeight: { xs: "50px", sm: "55px", lg: "60px" },
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            py: isSmallScreen ? 1 : 0,
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
        {/* height={48} width={135} */}

        {/* Scrollable Content Area */}
        <Box
          sx={{
            marginTop: { xs: "108px", sm: "106px", lg: "84px" }, // Same as header height
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: { xs: 1, sm: 2, md: 2 },
            width: "100%",
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            pb: 4, // Add bottom padding for better scrolling experience
          }}
        >
          <Box
            sx={{
              padding: { xs: "13px", sm: 3, md: 4 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              // width: "100%",
              maxWidth: { xs: "77%", sm: 450, md: 500, lg: 500 },
              border: "1px solid #ccc",
              borderRadius: 4,
              boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.35)",
              // mt: { xs: "112px", sm: 12, md: "45px" },
            }}
          >
            <Typography
              component="h1"
              variant="h5"
              sx={{ mb: { xs: 2, sm: 2, md: 2 } }}
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

              {/* Country & DOB */}
              <Grid
                container
                spacing={2}
                sx={{ width: "100%", mb: { xs: 1.5, sm: 2 } }}
              >
                {/* Date of Birth */}
                <Grid size={{ xs: 12, sm: 6 }}>
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

                {/* Age Group */}
                <Grid size={{ xs: 12, sm: 6 }}>
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
                    fullWidth
                    size="small"
                    name="ageGroup"
                    value={formData.ageGroup}
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
                    {ageGroups.map((age) => (
                      <MenuItem key={age} value={age}>
                        {age}
                      </MenuItem>
                    ))}
                  </TextField>
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

              {/* Email */}
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
                      Email{" "}
                      {["<13", "13-14", "15-17"].includes(formData.ageGroup)
                        ? "(Optional)"
                        : "*"}
                    </InputLabel>
                  </Grid>

                  {/* TEXTFIELD */}
                  <Grid item xs={12} sm={8} md={6}>
                    <TextField
                      size="small"
                      type="email"
                      name="email"
                      value={formData.email}
                      // disabled={formData.ageGroup === "<13"}
                      disabled={
                        // isUpgrade ||
                        ["<13", "13-14", "15-17"].includes(formData.ageGroup)
                      }
                      onChange={handleChange}
                      // required={formData.ageGroup !== "<13"}
                      required={
                        !["<13", "13-14", "15-17"].includes(formData.ageGroup)
                      }
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
              )}

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
                      fontSize: "15px",
                      fontFamily: "Calibri, sans-serif",
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
              {formData.subscriptionPlan && (
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
                        disabled={
                          // 🔴 WrdsAI / WrdsAIPro / WrdsAI Nxt → One Time disabled
                          (["WrdsAI", "WrdsAIPro", "WrdsAI Nxt"].includes(
                            formData.subscriptionPlan,
                          ) &&
                            type === "One Time") ||
                          // 🔴 Free Trial → Monthly & Yearly disabled
                          (formData.subscriptionPlan === "Free Trial" &&
                            (type === "Monthly" || type === "Yearly"))
                        }
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

              {["<13", "13-14", "15-17"].includes(formData.ageGroup) && (
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
                  {loading ? <CircularProgress size={24} /> : "Make Payment"}
                </Button> */}
                <Button
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
                  onClick={(e) => {
                    e.preventDefault();

                    // 🔥 First validate form
                    if (!validateForm()) return;

                    // 🔹 Free Trial -> Direct Submit (Skip Coupon)
                    if (formData.subscriptionPlan === "Free Trial") {
                      handleSubmit();
                      return;
                    }

                    // 🔥 Open coupon modal instead of direct Razorpay
                    setFinalAmount(priceINR);
                    setDiscount(0);
                    setCoupon("");
                    setOpenCouponModal(true);
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : "Make Payment"}
                </Button>
              </Box>

              {/* <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2, mb: 2 }}
                onClick={() => setOpenPayment(true)}
              >
                Go To Payment
              </Button> */}

              <PaymentModal
                open={openPayment}
                onClose={() => setOpenPayment(false)}
                priceINR={priceINR}
                onUPIPay={handlePayment}
                email={paymentEmail}
                apiBaseUrl={apiBaseUrl}
              />

              <Box
                sx={{
                  textAlign: "center",
                  fontSize: { xs: "14px", sm: "16px" },
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

        <Dialog
          open={openCouponModal}
          onClose={(event, reason) => {
            if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
              setOpenCouponModal(false);
            }
          }}
          fullWidth
          // maxWidth="xs"
          maxWidth="sm" // 🔥 important
          PaperProps={{
            sx: {
              // width: 576,
              width: {
                xs: "95%", // mobile
                sm: 520, // tablet
                md: 576, // desktop
              },
              maxWidth: "100%",
              // height: 239,
              borderRadius: 2,
              // p: 1,
              p: { xs: 1.5, sm: 2 },
            },
          }}
        >
          <DialogTitle sx={{ m: 0, p: 2 }}>
            Apply Coupon
            <IconButton
              aria-label="close"
              onClick={() => setOpenCouponModal(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[900],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            {/* <TextField
              label="Enter Coupon Code"
              fullWidth
              size="small"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              sx={{ mt: 1 }}
            /> */}
            {/* <Grid
              container
              spacing={0}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 0.5 }}
            >
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Enter Coupon Code"
                  fullWidth
                  size="small"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  InputProps={{
                    sx: {
                      height: 47, // 🔥 height set
                      fontSize: "16px",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={isApplying || !coupon}
                  sx={{ height: 47 }}
                  onClick={async () => {
                    setIsApplying(true);
                    const discountedAmount = await applyCoupon(priceINR);
                    setFinalAmount(discountedAmount);
                    setIsApplying(false);
                  }}
                >
                  Apply Coupon
                </Button>
              </Grid>
            </Grid> */}

            <Grid
              container
              spacing={1}
              alignItems="center"
              direction={{ xs: "column", sm: "row" }} // 🔥 xs = column, sm+ = row
              justifyContent={{ xs: "flex-start", sm: "space-between" }}
              sx={{ mt: 1 }}
            >
              {/* TextField */}
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Enter Coupon Code"
                  fullWidth
                  size="small"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  InputProps={{
                    sx: {
                      height: 47,
                      fontSize: "16px",
                    },
                  }}
                />
              </Grid>

              {/* Apply Button */}
              <Grid
                item
                xs={12}
                sm={4}
                sx={{
                  mt: { xs: 1, sm: 0 }, // 🔥 mobile spacing only
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  disabled={isApplying || !coupon}
                  sx={{ height: 47 }}
                  onClick={async () => {
                    setIsApplying(true);
                    const discountedAmount = await applyCoupon(priceINR);
                    setFinalAmount(discountedAmount);
                    setIsApplying(false);
                  }}
                >
                  Apply Coupon
                </Button>
              </Grid>
            </Grid>

            {discount > 0 && (
              <Typography
                sx={{ color: "green", mt: 1, fontSize: { xs: 13, sm: 14 } }}
              >
                🎉 ₹{discount} discount applied
              </Typography>
            )}

            <Typography sx={{ mt: 2, fontSize: { xs: 14, sm: 15 } }}>
              Final Amount: <b>₹{finalAmount}</b>
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: { xs: 1.5, sm: 2 }, pb: 2 }}>
            {/* Skip Coupon */}
            {/* <Button
              onClick={() => {
                setOpenCouponModal(false);
                // handleRazorpay(finalAmount || priceINR);
                handleSubmit();
              }}
            >
              Skip & Pay
            </Button> */}

            {/* <Button
              variant="contained"
              disabled={isApplying}
              onClick={async () => {
                setIsApplying(true);

                const discountedAmount = await applyCoupon(priceINR);

                setFinalAmount(discountedAmount);

                setIsApplying(false);
              }}
            >
              Apply Coupon
            </Button> */}

            {/* Continue to Pay */}
            <Button
              variant="contained"
              color="success"
              disabled={finalAmount <= 0}
              sx={{ height: 44 }}
              onClick={() => {
                setOpenCouponModal(false);
                // handleRazorpay(finalAmount);
                handleSubmit(finalAmount);
              }}
            >
              Continue to Pay
            </Button>
          </DialogActions>
        </Dialog>

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
              <strong>4. Subscription, Payments & No Refunds</strong> <br />
              WrdsAI is offered on a subscription basis. <br />
              • Subscription prices are displayed clearly at the time of
              purchase. <br />
              • All payments are final. WrdsAI does not offer refunds once a
              subscription is purchased. <br />• Unused time or tokens do not
              carry over and are not refundable. <br />
              <br />
              <strong>5. Account Activation</strong> <br />
              After successful payment, account access will be activated within
              24 hours as part of WrdsAI’s safety and quality standards. <br />
              By completing payment, you acknowledge and agree to this
              activation timeline. <br />
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
