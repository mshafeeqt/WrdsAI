import { useState } from "react";
import { IconButton, Paper, ClickAwayListener } from "@mui/material";
import ChatUI from "./ChatUi";
import ChatIcon from "@mui/icons-material/Chat";

export default function ChatPopup() {
  const [open, setOpen] = useState(false);

  const togglePopup = () => setOpen((prev) => !prev);
  const closePopup = () => setOpen(false);

  return (
    <>
      {/* Bot Floating Button */}
      <IconButton
        onClick={togglePopup}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          bgcolor: "#0062ff",
          color: "#fff",
          width: 56,
          height: 56,
          boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
          zIndex: 2000,
          "&:hover": { bgcolor: "#004bb5" },
        }}
      >
        <ChatIcon />
      </IconButton>

      {/* Popup Chat Window */}
      {open && (
        <ClickAwayListener onClickAway={closePopup}>
          <Paper
            elevation={8}
            sx={{
              position: "fixed",
              bottom: 90,
              right: 24,
              width: { xs: "90vw", sm: 560 },
              height: "75vh",
              borderRadius: 3,
              overflow: "auto",
              zIndex: 2000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ChatUI />
          </Paper>
        </ClickAwayListener>
      )}
    </>
  );
}
