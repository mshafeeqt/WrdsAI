import {
  Box,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useNavigate } from "react-router-dom";

export default function SidebarDrawer({
  open,
  onClose,
  isXS,
  chatImageSrc,
  searchValue,
  setSearchValue,
  setSearchSessionResults,
  activeView,
  user,
  createNewChat,
  isWrdsAIPro,
  disabled,
  onUpgradePlan,
  renderBrowsingTooltip,
  showSessionPanel,
  setShowSessionPanel,
  sessionLoading,
  searchSessionResults,
  filteredChats,
  selectedChatId,
  onSessionSelect,
  formatChatTime,
}) {
  const navigate = useNavigate();
  const handleSearchChange = (event) => {
    const value = event.target.value;
    const term = value.toLowerCase().trim();
    setSearchValue(value);

    if (term === "") {
      setSearchSessionResults([]);
      return;
    }

    const list =
      activeView === "chat" ||
      activeView === "smartAi" ||
      activeView === "wrds AiPro"
        ? filteredChats
        : [];

    const filtered = list.filter((chat) =>
      chat.name.toLowerCase().includes(term),
    );

    setSearchSessionResults(filtered);
  };

  const displayedChats =
    searchSessionResults.length > 0 ? searchSessionResults : filteredChats;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isXS ? 207 : 300,
          bgcolor: "#f7f7f8",
          height: "100vh",
          borderRight: "1px solid #e0e0e0",
          position: "relative",
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 1.5,
          pt: 3,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <img
            src={chatImageSrc}
            alt="Chat Icon"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "10px",
            }}
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ px: 1 }}>
            <TextField
              placeholder="Search sessions..."
              variant="outlined"
              size="small"
              fullWidth
              autoFocus
              value={searchValue}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ fontSize: 26, color: "gray", mr: 0 }} />
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px",
                  bgcolor: "#fff",
                  border: "1px solid #dcdcdc",
                  pl: "6px",
                },
                "& .MuiOutlinedInput-input": {
                  paddingLeft: "6px !important",
                },
              }}
            />
          </Box>

          <Box
            sx={{
              mt: 0,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 18,
                px: 1.5,
                py: 0.7,
                cursor: "pointer",
                position: "relative",
                fontWeight: activeView === "newChat" ? 600 : 400,
                color: "#000",
                "&:hover": {
                  color: "#000",
                },
                opacity: 1,
                pointerEvents: "auto",
              }}
              onClick={() => {
                createNewChat();
                onClose();
              }}
            >
              New Chat
              {activeView === "newChat" && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -3,
                    left: 0,
                    width: "100%",
                    height: "3px",
                    bgcolor: "#000",
                    borderRadius: "2px",
                  }}
                />
              )}
            </Typography>

            <Typography
              sx={{
                fontSize: 18,
                px: 1.5,
                py: 0.7,
                cursor: "pointer",
                borderRadius: "6px",
                transition: "0.25s",
                fontWeight: 400,
                color: "#000",
                "&:hover": {
                  backgroundColor: "#eaeaea",
                },
              }}
              onClick={() => {
                navigate("/test-prep");
                onClose();
              }}
            >
              Test Prep
            </Typography>

            <Typography
              sx={{
                fontSize: 18,
                px: 1.5,
                py: 0.7,
                cursor: "pointer",
                borderRadius: "6px",
                transition: "0.25s",
                fontWeight: 400,
                color: "#000",
                "&:hover": {
                  backgroundColor: "#eaeaea",
                },
              }}
              onClick={() => {
                navigate("/my-progress");
                onClose();
              }}
            >
              My Progress
            </Typography>

            {isWrdsAIPro && (
              <Typography
                sx={{
                  fontSize: 18,
                  cursor: user?.subscription?.isPlanExpired
                    ? "not-allowed"
                    : "pointer",
                  px: 1.5,
                  py: 0.7,
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "0.25s",
                  backgroundColor:
                    activeView === "search2" && !user?.subscription?.isPlanExpired
                      ? "#e3e3e3ff"
                      : "transparent",
                  color: disabled ? "#7a7a7a" : "#000",
                  fontWeight: activeView === "search2" ? 600 : 400,
                  "&:hover": {
                    backgroundColor: user?.subscription?.isPlanExpired
                      ? "transparent"
                      : "#eaeaea",
                  },
                  opacity: user?.subscription?.isPlanExpired ? 0.6 : 1,
                  pointerEvents: user?.subscription?.isPlanExpired ? "none" : "auto",
                }}
              >
                AI Browsing
                {renderBrowsingTooltip(
                  <InfoOutlinedIcon
                    sx={{
                      fontSize: 20,
                      color: user?.subscription?.isPlanExpired
                        ? "#9e9e9e"
                        : "#7a7a7a",
                      cursor: "pointer",
                      ml: 1,
                      "&:hover": { color: "#000" },
                    }}
                  />,
                )}
              </Typography>
            )}

            <Typography
              sx={{
                fontSize: 18,
                cursor: "pointer",
                px: 1.5,
                py: 0.7,
                borderRadius: "6px",
                display: "inline-block",
                transition: "0.25s",
                backgroundColor:
                  activeView === "wrds AiPro" ? "#e3e3e3ff" : "transparent",
                color: activeView === "wrds AiPro" ? "#000" : "#000",
                fontWeight: activeView === "wrds AiPro" ? 600 : 400,
                "&:hover": {
                  backgroundColor:
                    activeView === "wrds AiPro" ? "#eaeaea" : "#eaeaea",
                },
              }}
              onClick={onUpgradePlan}
            >
              Upgrade/ Renew Plan
            </Typography>

            <MenuItem
              onClick={() => setShowSessionPanel((prev) => !prev)}
              sx={{
                borderRadius: 1,
                mb: 1,
                backgroundColor: showSessionPanel ? "#f0f0f0" : "transparent",
                "&:hover": { backgroundColor: "#f5f5f5" },
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  ml: "-5px",
                  fontSize: "18px",
                  fontWeight: 600,
                  fontFamily: "Calibri, sans-serif",
                }}
              >
                History
              </Typography>

              <KeyboardArrowDownIcon
                sx={{
                  mr: "-4px",
                  transform: showSessionPanel ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "0.2s",
                }}
              />
            </MenuItem>

            {showSessionPanel &&
              (activeView === "chat" ||
                activeView === "smartAi" ||
                activeView === "wrds AiPro" ||
                activeView === "WrdsAI Nxt") && (
                <>
                  <Box sx={{ maxHeight: "220px", overflowY: "auto", mb: 1 }}>
                    {sessionLoading ? (
                      <Box sx={{ p: 2 }}>
                        {[...Array(3)].map((_, index) => (
                          <Skeleton
                            key={index}
                            sx={{ width: "100%", mb: 1, height: "40px" }}
                          />
                        ))}
                      </Box>
                    ) : (
                      displayedChats.map((chat) => (
                        <MenuItem
                          key={chat.id}
                          onClick={() => onSessionSelect(chat)}
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            backgroundColor:
                              selectedChatId === chat.id ? "#eaeaea" : "transparent",
                            "&:hover": { backgroundColor: "#f5f5f5" },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              width: "100%",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "14px",
                                fontFamily: "Calibri, sans-serif",
                                fontWeight: 500,
                              }}
                            >
                              {chat.name.replace(/\b\w/g, (char) =>
                                char.toUpperCase(),
                              )}
                            </Typography>

                            <Typography
                              sx={{
                                color: "gray",
                                fontSize: "12px",
                              }}
                            >
                              {formatChatTime(new Date(chat.createTime))}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Box>

                  <Divider sx={{ my: 1 }} />
                </>
              )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
