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
    <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          fontWeight: "medium",
          fontSize: "17px",
        }}
      >
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: "medium" }}>
        {value}
      </Typography>
    </Box>
  );
}

function getPlanLabel(user = {}) {
  if (
    user.subscription?.subscriptionPlan === "WrdsAi Nxt" ||
    user.subscriptionPlan === "WrdsAi Nxt"
  ) {
    return "WrdsAI Nxt";
  }

  return user.subscription?.subscriptionPlan || user.subscriptionPlan || "No Plan";
}

export default function UserProfileDialog({
  open,
  onClose,
  email,
  user,
  totalTokensUsed,
  sessionRemainingTokens,
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
        <ProfileRow label="Email :" value={email || "No email"} />
        <ProfileRow label="Plan :" value={getPlanLabel(user)} />

        {(user.subscription?.childPlan || user.childPlan) && (
          <ProfileRow
            label="Child Plan :"
            value={user.subscription?.childPlan || user.childPlan}
          />
        )}

        <ProfileRow
          label="Subscription Type :"
          value={
            user.subscription?.subscriptionType ||
            user.subscriptionType ||
            "No Type"
          }
        />
        <ProfileRow label="Tokens Consumed :" value={totalTokensUsed} />
        <ProfileRow
          label="Tokens Remaining :"
          value={sessionRemainingTokens || 0}
        />
      </DialogContent>
    </Dialog>
  );
}
