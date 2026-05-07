import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

export default function DeleteUserDialog({
  open,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 3,
          padding: 1,
          minWidth: "500px",
        },
      }}
    >
      <DialogTitle id="alert-dialog-title" sx={{ fontWeight: "bold" }}>
        {"Delete User?"}
      </DialogTitle>
      <DialogContent>
        <Typography id="alert-dialog-description">
          Are you sure you want to delete this user?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          autoFocus
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
