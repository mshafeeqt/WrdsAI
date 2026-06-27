import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function ProfileRow({ label, value }) {
  return (
    <Box
      sx={{
        mb: 2,
        display: "flex",
        alignItems: "center",
        textAlign: "left",
      }}
    >
      <Box
        sx={{
          flex: "0 0 150px",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          minWidth: 150,
        }}
      >
        <Typography
          component="span"
          color="text.secondary"
          sx={{
            fontWeight: "medium",
            fontSize: "17px",
            lineHeight: 1.35,
            whiteSpace: "nowrap",
          }}
        >
          {label} :
        </Typography>
      </Box>
      <Typography
        variant="body1"
        sx={{
          flex: "1 1 auto",
          fontWeight: "medium",
          overflowWrap: "anywhere",
          lineHeight: 1.35,
          minWidth: 0,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function getFullName(user = {}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "No name";
}

export default function UserProfileDialog({
  open,
  onClose,
  email,
  user,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: "bold",
          borderBottom: "1px solid #e0e0e0",
          position: "relative",
        }}
      >
        User Profile
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            right: 6,
            top: 7,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center", p: 3, mt: 4 }}>
        <ProfileRow label="Name" value={getFullName(user)} />
        <ProfileRow label="Email" value={email || "No email"} />
        <ProfileRow label="Type" value={user?.userRole || "Student"} />
        <ProfileRow label="Class" value={user?.className || "Not assigned"} />
        <ProfileRow label="School" value={user?.schoolName || "Not assigned"} />
        <ProfileRow
          label="Subscription Type"
          value={user?.subscription?.subscriptionType || user?.subscriptionType || "No Type"}
        />
      </DialogContent>
    </Dialog>
  );
}
