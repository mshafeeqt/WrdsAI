// import React, { useState } from "react";3
// import { Modal, Box, Typography, Button, TextField, Grid } from "@mui/material";
// import CloseIcon from "@mui/icons-material/Close";
// import { IconButton } from "@mui/material";

// const PaymentModal = ({ open, onClose, email, priceINR, onUPIPay }) => {
//   const [upiId, setUpiId] = useState("");

//   return (
//     <Modal open={open}>
//       <Box
//         sx={{
//           position: "absolute",
//           top: "50%",
//           left: "50%",
//           transform: "translate(-50%, -50%)",
//           width: 380,
//           bgcolor: "white",
//           borderRadius: 3,
//           p: 3,
//           boxShadow: "0 0 20px rgba(0,0,0,0.3)",
//         }}
//       >
//         {/* CLOSE ICON */}
//         <IconButton
//           onClick={onClose}
//           sx={{
//             position: "absolute",
//             top: 8,
//             right: 8,
//             color: "#555",
//             "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" },
//           }}
//         >
//           <CloseIcon />
//         </IconButton>

//         {/* AMOUNT */}
//         <Typography
//           variant="h6"
//           sx={{ textAlign: "center", mb: 2, mt: 1, fontWeight: "bold" }}
//         >
//           Pay ₹{priceINR}
//         </Typography>

//         {/* QR + UPI Buttons */}
//         <Grid container spacing={2}>
//           <Grid item xs={6}>
//             <Button
//               fullWidth
//               variant="outlined"
//               sx={{ py: 1.5 }}
//               onClick={() => onUPIPay("qr")}
//             >
//               QR Code
//             </Button>
//           </Grid>

//           <Grid item xs={6}>
//             <Button
//               fullWidth
//               variant="outlined"
//               sx={{ py: 1.5 }}
//               onClick={() => onUPIPay("upi")}
//             >
//               UPI
//             </Button>
//           </Grid>
//         </Grid>

//         {/* UPI Section */}
//         <Box sx={{ mt: 3 }}>
//           <Typography sx={{ mb: 1 }}>Popular UPI Apps</Typography>

//           <Grid container spacing={1}>
//             <Grid item xs={4}>
//               <Button fullWidth variant="contained" color="inherit">
//                 GPay
//               </Button>
//             </Grid>
//             <Grid item xs={4}>
//               <Button fullWidth variant="contained" color="inherit">
//                 PhonePe
//               </Button>
//             </Grid>
//             <Grid item xs={4}>
//               <Button fullWidth variant="contained" color="inherit">
//                 Paytm
//               </Button>
//             </Grid>
//           </Grid>

//           {/* Enter UPI ID */}
//           <TextField
//             fullWidth
//             size="small"
//             label="Enter UPI ID"
//             sx={{ mt: 2 }}
//             value={upiId}
//             onChange={(e) => setUpiId(e.target.value)}
//           />

//           {/* Pay Button */}
//           <Button
//             fullWidth
//             sx={{ mt: 2, py: 1.2 }}
//             variant="contained"
//             onClick={() => onUPIPay("pay", upiId)}
//           >
//             Make Payment ₹{priceINR}
//           </Button>
//         </Box>
//       </Box>
//     </Modal>
//   );
// };

// export default PaymentModal;
// ----------------------------------------------------------------------------------------------------------
// import React, { useState } from "react";
// import { Modal, Box, Typography, Button, TextField, Grid } from "@mui/material";
// import CloseIcon from "@mui/icons-material/Close";
// import { IconButton } from "@mui/material";
// import scanner from "././assets/scanner.png"; // path adjust karo

// const PaymentModal = ({ open, onClose, priceINR }) => {
//   const [tab, setTab] = useState("upi"); // "upi" or "qr"
//   const [upiId, setUpiId] = useState("");

//   const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

//   const makePayment = async () => {
//     const res = await fetch(`${apiBaseUrl}/api/create-upi`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         amount: priceINR,
//         customerUpiId: upiId,
//       }),
//     });

//     const data = await res.json();

//     if (!data.upiLink) {
//       alert("Failed to generate UPI link");
//       return;
//     }

//     console.log("Generated Transaction ID:", data.transactionId);
//     console.log("UPI Link:", data.upiLink);

//     // Open UPI app (GPay/PhonePe/Paytm)
//     window.location.href = data.upiLink;
//   };

//   return (
//     <Modal open={open}>
//       <Box
//         sx={{
//           position: "absolute",
//           top: "50%",
//           left: "50%",
//           transform: "translate(-50%, -50%)",
//           width: 380,
//           bgcolor: "white",
//           borderRadius: 3,
//           p: 3,
//           boxShadow: "0 0 30px rgba(0,0,0,0.25)",
//         }}
//       >
//         {/* CLOSE ICON */}
//         <IconButton
//           onClick={onClose}
//           sx={{
//             position: "absolute",
//             top: 8,
//             right: 8,
//             color: "#555",
//           }}
//         >
//           <CloseIcon />
//         </IconButton>

//         {/* HEADING */}
//         <Typography
//           variant="h6"
//           sx={{
//             textAlign: "center",
//             mb: 2,
//             mt: 1,
//             fontWeight: "bold",
//             color: "#222",
//           }}
//         >
//           Pay ₹{priceINR}
//         </Typography>

//         {/* PAYMENT METHOD OPTIONS (BillDesk Style Vertical) */}
//         <Box>
//           <Button
//             fullWidth
//             variant={tab === "upi" ? "contained" : "outlined"}
//             sx={{ py: 1.4, mb: 1 }}
//             onClick={() => setTab("upi")}
//           >
//             UPI
//           </Button>

//           <Button
//             fullWidth
//             variant={tab === "qr" ? "contained" : "outlined"}
//             sx={{ py: 1.4 }}
//             onClick={() => setTab("qr")}
//           >
//             QR Code
//           </Button>
//         </Box>

//         {/* CONTENT AREA */}
//         {tab === "upi" ? (
//           // --------------------  UPI SECTION  --------------------
//           <Box sx={{ mt: 3 }}>
//             <Typography sx={{ mb: 1, color: "#555" }}>
//               Popular UPI Apps
//             </Typography>

//             <Grid container spacing={1}>
//               <Grid item xs={4}>
//                 <Button fullWidth variant="contained" color="inherit">
//                   GPAY
//                 </Button>
//               </Grid>
//               <Grid item xs={4}>
//                 <Button fullWidth variant="contained" color="inherit">
//                   PHONEPE
//                 </Button>
//               </Grid>
//               <Grid item xs={4}>
//                 <Button fullWidth variant="contained" color="inherit">
//                   PAYTM
//                 </Button>
//               </Grid>
//             </Grid>

//             <TextField
//               fullWidth
//               size="small"
//               label="Enter UPI ID"
//               sx={{ mt: 2 }}
//               value={upiId}
//               onChange={(e) => setUpiId(e.target.value)}
//             />

//             <Button
//               fullWidth
//               sx={{ mt: 2, py: 1.2 }}
//               variant="contained"
//               onClick={makePayment}
//             >
//               Make Payment ₹{priceINR}
//             </Button>
//           </Box>
//         ) : (
//           // --------------------  QR SECTION  --------------------
//           <Box sx={{ mt: 3, textAlign: "center" }}>
//             <Typography sx={{ mb: 2, fontWeight: 500 }}>Scan & Pay</Typography>

//             <Box
//               sx={{
//                 width: 200,
//                 height: 200,
//                 margin: "auto",
//                 borderRadius: 2,
//                 border: "2px solid #ddd",
//                 overflow: "hidden",
//               }}
//             >
//               <img
//                 src={scanner}
//                 alt="QR Code"
//                 style={{ width: "100%", height: "100%" }}
//               />
//             </Box>

//             <Typography sx={{ mt: 2, fontSize: 14, color: "#777" }}>
//               Scan using any UPI app
//             </Typography>
//           </Box>
//         )}
//       </Box>
//     </Modal>
//   );
// };

// export default PaymentModal;

// PaymentModal.jsx (React)
import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import scanner from "./assets/scanner.png";

const PaymentModal = ({ open, onClose, priceINR }) => {
  const [tab, setTab] = useState("upi"); // "upi" or "qr"
  const [upiId, setUpiId] = useState("");

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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
    return res.json();
  };

  const openRazorpayCheckout = async (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // your key id from .env
      amount: order.amount,
      currency: order.currency,
      name: "Your Business Name",
      description: "Order Payment",
      order_id: order.id,
      handler: async function (response) {
        // Response contains razorpay_order_id, razorpay_payment_id, razorpay_signature
        const verifyResult = await verifyPaymentOnServer(response);
        if (verifyResult && verifyResult.success) {
          alert("Payment successful and verified!");
          onClose();
        } else {
          alert("Payment verification failed. Please contact support.");
        }
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

  const handleRazorpay = async () => {
    try {
      console.log("START PAYMENT");
      console.log("API URL:", apiBaseUrl);
      console.log("KEY:", import.meta.env.VITE_RAZORPAY_KEY_ID);

      const createResp = await createOrderOnServer(priceINR);
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


  
  // Keep your QR code UI; UPI intent is removed for production reliability.
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 380,
          bgcolor: "white",
          borderRadius: 3,
          p: 3,
          boxShadow: "0 0 30px rgba(0,0,0,0.25)",
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 8, right: 8, color: "#555" }}
        >
          <CloseIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{
            textAlign: "center",
            mb: 2,
            mt: 1,
            fontWeight: "bold",
            color: "#222",
          }}
        >
          Pay ₹{priceINR}
        </Typography>

        <Box>
          <Button
            fullWidth
            variant={tab === "upi" ? "contained" : "outlined"}
            sx={{ py: 1.4, mb: 1 }}
            onClick={() => setTab("upi")}
          >
            UPI
          </Button>
          <Button
            fullWidth
            variant={tab === "qr" ? "contained" : "outlined"}
            sx={{ py: 1.4 }}
            onClick={() => setTab("qr")}
          >
            QR Code
          </Button>
        </Box>

        {tab === "upi" ? (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ mb: 1, color: "#555" }}>
              Popular UPI Apps
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Button fullWidth variant="contained" color="inherit">
                  GPAY
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button fullWidth variant="contained" color="inherit">
                  PHONEPE
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button fullWidth variant="contained" color="inherit">
                  PAYTM
                </Button>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              label="Enter UPI ID (optional)"
              sx={{ mt: 2 }}
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />

            <Button
              fullWidth
              sx={{ mt: 2, py: 1.2 }}
              variant="contained"
              onClick={handleRazorpay}
            >
              Make Payment ₹{priceINR}
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography sx={{ mb: 2, fontWeight: 500 }}>Scan & Pay</Typography>
            <Box
              sx={{
                width: 200,
                height: 200,
                margin: "auto",
                borderRadius: 2,
                border: "2px solid #ddd",
                overflow: "hidden",
              }}
            >
              <img
                src={scanner}
                alt="QR Code"
                style={{ width: "100%", height: "100%" }}
              />
            </Box>
            <Typography sx={{ mt: 2, fontSize: 14, color: "#777" }}>
              Scan using any UPI app
            </Typography>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default PaymentModal;
