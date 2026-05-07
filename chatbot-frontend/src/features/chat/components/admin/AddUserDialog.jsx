import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { allCountries } from "country-telephone-data";

export default function AddUserDialog({
  open,
  newUserData,
  isCreatingUser,
  onClose,
  onDateChange,
  onFieldChange,
  onCreateUser,
}) {
  const isUnder18 = ["<13", "13-14", "15-17"].includes(newUserData.ageGroup);

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          padding: 1,
          position: "relative",
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 16,
          top: 16,
          color: (theme) => theme.palette.grey[500],
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogTitle sx={{ fontWeight: "bold", textAlign: "left", pt: 3, pb: 2 }}>
        Add New User
      </DialogTitle>
      <DialogContent sx={{ px: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                First Name <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="First name"
                size="small"
                value={newUserData.firstName}
                onChange={(event) => onFieldChange("firstName", event.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                Last Name <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="Last name"
                size="small"
                value={newUserData.lastName}
                onChange={(event) => onFieldChange("lastName", event.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                Date of Birth <span style={{ color: "red" }}>*</span>
              </Typography>
              <DatePicker
                value={newUserData.dateOfBirth}
                onChange={onDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    placeholder: "MM/DD/YYYY",
                    sx: { "& .MuiOutlinedInput-root": { borderRadius: 1.5 } },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                Age Group <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={newUserData.ageGroup}
                disabled
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />
            </Grid>

            {!isUnder18 && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                    Email <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Email address"
                    size="small"
                    value={newUserData.email}
                    onChange={(event) => onFieldChange("email", event.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                    Mobile Number <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <FormControl sx={{ minWidth: 100 }}>
                      <Select
                        size="small"
                        value={newUserData.mobileCode}
                        onChange={(event) => onFieldChange("mobileCode", event.target.value)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        {allCountries.map((country) => (
                          <MenuItem key={country.iso2} value={`+${country.dialCode}`}>
                            +{country.dialCode}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      placeholder="Mobile number"
                      size="small"
                      value={newUserData.mobileNumber}
                      onChange={(event) => onFieldChange("mobileNumber", event.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                    />
                  </Box>
                </Grid>
              </>
            )}

            {isUnder18 && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                    Parent/Guardian Name <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Parent's name"
                    size="small"
                    value={newUserData.parentName}
                    onChange={(event) => onFieldChange("parentName", event.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                    Parent Email <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Parent's email"
                    size="small"
                    value={newUserData.parentEmail}
                    onChange={(event) => onFieldChange("parentEmail", event.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                    Parent Mobile <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <FormControl sx={{ minWidth: 100 }}>
                      <Select
                        size="small"
                        value={newUserData.parentMobileCode}
                        onChange={(event) =>
                          onFieldChange("parentMobileCode", event.target.value)
                        }
                        sx={{ borderRadius: 1.5 }}
                      >
                        {allCountries.map((country) => (
                          <MenuItem key={country.iso2} value={`+${country.dialCode}`}>
                            +{country.dialCode}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      placeholder="Parent mobile number"
                      size="small"
                      value={newUserData.parentMobileNumber}
                      onChange={(event) =>
                        onFieldChange("parentMobileNumber", event.target.value)
                      }
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                    />
                  </Box>
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12, sm: 5 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                Subscription Plan <span style={{ color: "red" }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={newUserData.subscriptionPlan || ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    const defaults = {
                      subscriptionPlan: value,
                      childPlan: "",
                      subscriptionType: value === "Free Trial" ? "One Time" : "Monthly",
                    };

                    if (value === "WrdsAI") defaults.childPlan = "Glow Up";
                    if (value === "WrdsAIPro") defaults.childPlan = "Step Up";

                    onFieldChange("bulk", defaults);
                  }}
                  sx={{ borderRadius: 1.5 }}
                  renderValue={(selected) => selected || "Choose a plan"}
                >
                  <MenuItem value="WrdsAI">WrdsAI</MenuItem>
                  <MenuItem value="WrdsAIPro">WrdsAI Pro</MenuItem>
                  <MenuItem value="Free Trial">Free Trial</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {newUserData.subscriptionPlan !== "Free Trial" && (
              <Grid size={{ xs: 12, sm: 5 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                  Plan Option <span style={{ color: "red" }}>*</span>
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={newUserData.childPlan || ""}
                    onChange={(event) => onFieldChange("childPlan", event.target.value)}
                    sx={{ borderRadius: 1.5 }}
                    renderValue={(selected) => selected || "Select option"}
                  >
                    {newUserData.subscriptionPlan === "WrdsAI"
                      ? [
                          <MenuItem key="glow" value="Glow Up">Glow Up</MenuItem>,
                          <MenuItem key="level" value="Level Up">Level Up</MenuItem>,
                          <MenuItem key="rise" value="Rise Up">Rise Up</MenuItem>,
                        ]
                      : [
                          <MenuItem key="step" value="Step Up">Step Up</MenuItem>,
                          <MenuItem key="speed" value="Speed Up">Speed Up</MenuItem>,
                          <MenuItem key="scale" value="Scale Up">Scale Up</MenuItem>,
                        ]}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 5 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#555" }}>
                Subscription Type <span style={{ color: "red" }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={newUserData.subscriptionType || ""}
                  disabled={newUserData.subscriptionPlan === "Free Trial"}
                  onChange={(event) => onFieldChange("subscriptionType", event.target.value)}
                  sx={{ borderRadius: 1.5 }}
                  renderValue={(selected) => selected || "Select type"}
                >
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Yearly">Yearly</MenuItem>
                  <MenuItem value="One Time">One Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ p: 4, pt: 1 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{
            textTransform: "none",
            fontWeight: 500,
            color: "#666",
            border: "1px solid #000000",
            borderRadius: 2,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onCreateUser}
          variant="contained"
          disabled={isCreatingUser}
          sx={{
            backgroundColor: "#2F67F6",
            textTransform: "none",
            px: isCreatingUser ? 6 : 4,
            borderRadius: 2,
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#1e54d9" },
          }}
        >
          {isCreatingUser ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            "Create User"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
