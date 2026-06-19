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
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useNavigate } from "react-router-dom";
import WrdsWhiteLogo from "../../../assets/words1.png";

export default function SidebarDrawer({
  open,
  onClose,
  isXS,
  searchValue,
  setSearchValue,
  setSearchSessionResults,
  activeView,
  teacherMode = false,
  user,
  createNewChat,
  isWrdsAIPro,
  disabled,
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
          width: isXS ? 170 : 250,
          bgcolor: "#8b5cf6",
          background:
            "linear-gradient(155deg, #d36cf3 0%, #9d5cf3 42%, #5f67f2 100%)",
          height: "100vh",
          borderRight: "1px solid rgba(255,255,255,0.55)",
          position: "relative",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box
          sx={{
            height: 70,
            px: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderBottom: "2px solid rgba(255,255,255,0.42)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              p: 0.3,
              color: "#fff",
              "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
            }}
          >
            <MenuIcon sx={{ fontSize: 24 }} />
          </IconButton>

          <Box
            component="img"
            src={WrdsWhiteLogo}
            alt="WrdsAI"
            sx={{
              width: isXS ? 165 : 220,
              height: "auto",
              display: "block",
              objectFit: "contain",
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            px: 2,
            pt: 3.5,
          }}
        >
          <Box sx={{ display: "none" }}>
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
              gap: 1.65,
            }}
          >
            <Typography
              sx={{
                fontSize: isXS ? 19 : 24,
                px: 0,
                py: 0.2,
                cursor: "pointer",
                position: "relative",
                fontWeight: 500,
                lineHeight: 1.12,
                color: "#fff",
                "&:hover": {
                  color: "#fff",
                  opacity: 0.82,
                },
                opacity: 1,
                pointerEvents: "auto",
              }}
              onClick={() => {
                createNewChat();
                onClose();
              }}
            >
              {teacherMode ? "Teach" : "Learn"}
            </Typography>

            {!teacherMode && (
              <>
                <Typography
                  sx={{
                    fontSize: isXS ? 19 : 24,
                    px: 0,
                    py: 0.2,
                    cursor: "pointer",
                    transition: "0.25s",
                    fontWeight: 500,
                    lineHeight: 1.12,
                    color: "#fff",
                    "&:hover": {
                      opacity: 0.82,
                    },
                  }}
                  onClick={() => {
                    navigate("/practice");
                    onClose();
                  }}
                >
                  Practice
                </Typography>

                <Typography
                  sx={{
                    fontSize: isXS ? 19 : 24,
                    px: 0,
                    py: 0.2,
                    cursor: "pointer",
                    transition: "0.25s",
                    fontWeight: 500,
                    lineHeight: 1.12,
                    color: "#fff",
                    "&:hover": {
                      opacity: 0.82,
                    },
                  }}
                  onClick={() => {
                    navigate("/test-prep");
                    onClose();
                  }}
                >
                  Test
                </Typography>
              </>
            )}

            <Typography
              sx={{
                fontSize: isXS ? 19 : 24,
                px: 0,
                py: 0.2,
                cursor: "pointer",
                transition: "0.25s",
                fontWeight: 500,
                lineHeight: 1.12,
                color: "#fff",
                "&:hover": {
                  opacity: 0.82,
                },
              }}
              onClick={() => {
                navigate(teacherMode ? "/teacher-progress" : "/my-progress");
                onClose();
              }}
            >
              Progress
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

            <MenuItem
              onClick={() => setShowSessionPanel((prev) => !prev)}
              sx={{
                p: 0,
                minHeight: "auto",
                borderRadius: 0,
                mt: 0.25,
                mb: 0.5,
                backgroundColor: "transparent",
                "&:hover": { backgroundColor: "transparent", opacity: 0.82 },
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  ml: 0,
                  fontSize: isXS ? 19 : 24,
                  fontWeight: 500,
                  lineHeight: 1.12,
                  color: "#fff",
                  fontFamily: "inherit",
                }}
              >
                History
              </Typography>

              <KeyboardArrowDownIcon
                sx={{
                  display: "none",
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
                  <Box sx={{ maxHeight: "260px", overflowY: "auto", mb: 1 }}>
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
                            color: "#fff",
                            backgroundColor:
                              selectedChatId === chat.id
                                ? "rgba(255,255,255,0.18)"
                                : "transparent",
                            "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
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
                                color: "#fff",
                              }}
                            >
                              {chat.name.replace(/\b\w/g, (char) =>
                                char.toUpperCase(),
                              )}
                            </Typography>

                            <Typography
                              sx={{
                                color: "rgba(255,255,255,0.75)",
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

                  <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.24)" }} />
                </>
              )}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
