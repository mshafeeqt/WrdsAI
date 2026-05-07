import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function ChangePasswordDialog({
  open,
  currentPassword,
  newPassword,
  confirmPassword,
  showCurrent,
  showNew,
  showConfirm,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleCurrent,
  onToggleNew,
  onToggleConfirm,
  onClose,
  onSubmit,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxWidth: "540px",
          width: "100%",
          borderRadius: "16px",
          p: 1,
        },
      }}
    >
      <DialogTitle>Change Password</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          margin="dense"
          type={showCurrent ? "text" : "password"}
          label="Current Password"
          value={currentPassword}
          onChange={(event) => onCurrentPasswordChange(event.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onToggleCurrent} edge="end">
                  {showCurrent ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          margin="dense"
          type={showNew ? "text" : "password"}
          label="New Password"
          value={newPassword}
          onChange={(event) => onNewPasswordChange(event.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onToggleNew} edge="end">
                  {showNew ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          margin="dense"
          type={showConfirm ? "text" : "password"}
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onToggleConfirm} edge="end">
                  {showConfirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="button" variant="contained" onClick={onSubmit}>
          Change Password
        </Button>
      </DialogActions>
    </Dialog>
  );
}
