import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  List,
  ListItemText,
  Divider,
  Button,
  Paper,
  FormControl,
  Select,
  Autocomplete,
  ListItemButton,
  CircularProgress,
  Skeleton,
  MenuItem,
  Menu,
  Popover,
  Drawer,
  Grid,
  InputLabel,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Send as SendIcon,
  Search as SearchIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  InsertDriveFile,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchUI from "./SearchUi";
import { formatChatResponseHtml } from "./features/chat/utils/responseFormatting";
import ChangePasswordDialog from "./features/chat/components/ChangePasswordDialog";
import UserProfileDialog from "./features/chat/components/UserProfileDialog";
import UserManagementPanel from "./features/chat/components/admin/UserManagementPanel";
import AddUserDialog from "./features/chat/components/admin/AddUserDialog";
import DeleteUserDialog from "./features/chat/components/admin/DeleteUserDialog";
import SidebarDrawer from "./features/chat/components/SidebarDrawer";
import StudyChapterMenus from "./features/chat/components/study/StudyChapterMenus";
import {
  getUserClassName,
  getLockedStudentClass,
  isStudentUser,
  getVisibleSubjectsForStudent,
} from "./features/curriculum/studentCurriculum";
import FeaturedPlayListOutlinedIcon from "@mui/icons-material/FeaturedPlayListOutlined";
import KeyboardArrowDownTwoToneIcon from "@mui/icons-material/KeyboardArrowDownTwoTone";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutTwoToneIcon from "@mui/icons-material/LogoutTwoTone";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import Mainlogo from "././assets/Mainlogo.png"; // path adjust karo
import Msg_logo from "././assets/Msg_logo.png"; // path adjust karo
import Search_logo1 from "././assets/Search_logo1.png"; // path adjust karo
import Swal from "sweetalert2";
import GrokSearchUI from "./GrokSearchUI";
import { useGrok } from "./context/GrokContext";
import Popper from "@mui/material/Popper";
import { styled } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import chat from "././assets/chat.webp";
import Wrds from "././assets/words1.png";
import Wrds1 from "././assets/words1.png";
import Words1 from "././assets/words1.webp"; // path adjust karo
// import Words2 from "././assets/words2.webp"; // path adjust karo
import Words2 from "././assets/words2.png"; // path adjust karo
import Msg_logo1 from "././assets/Msg_logo.png"; // path adjust karo
import Icon from "././assets/Icon2.png";
import Icon2 from "./assets/icon3.png";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { useTheme, useMediaQuery } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LanguageIcon from "@mui/icons-material/Language";
// import searchIcon from "@mui/icons-material/Language";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import ContactSupportRoundedIcon from "@mui/icons-material/ContactSupportRounded";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useNavigate } from "react-router-dom";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { toast } from "react-toastify";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import {
  fetchCurrentUser,
  getAuthenticatedUserCache,
  logoutCurrentUser,
  setAuthenticatedUserCache,
} from "./features/auth/authClient";
// import IconButton from "@mui/material/IconButton";

const ChatUI = ({ studyModeLabel = "Study", teacherMode = false }) => {
  const [input, setInput] = useState("");
  const [isLessonPlanMode, setIsLessonPlanMode] = useState(false);
  const lessonPlanDraftRef = useRef("");
  const [chats, setChats] = useState([]);
  const [smartAISessions, setSmartAISessions] = useState([]);
  const [smartAIProSessions, setSmartAIProSessions] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [sessionLoading, setSessionLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [messageGroups, setMessageGroups] = useState([]);
  const [smartAIMessageGroups, setSmartAIMessageGroups] = useState([[]]); // 🧠 separate Smart AI history
  const [smartAIProMessageGroups, setSmartAIProMessageGroups] = useState([[]]); // 🧠 separate Smart AI history
  const [smartAINxtSessions, setSmartAINxtSessions] = useState([]);
  const [smartAINxtMessageGroups, setSmartAINxtMessageGroups] = useState([[]]);

  // Delete User Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  // Manual User Creation State
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileCode: "+91",
    mobileNumber: "",
    dateOfBirth: null,
    ageGroup: "",
    parentName: "",
    parentEmail: "",
    parentMobileCode: "+91",
    parentMobileNumber: "",
    subscriptionPlan: "WrdsAI",
    childPlan: "Glow Up",
    subscriptionType: "Monthly",
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

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

  const handleAddUserDateChange = (date) => {
    const ageGroup = calculateAgeGroup(date);
    setNewUserData((prev) => ({
      ...prev,
      dateOfBirth: date,
      ageGroup: ageGroup,
    }));
  };

  const handleAddUserFieldChange = (field, value) => {
    if (field === "bulk") {
      setNewUserData((prev) => ({
        ...prev,
        ...value,
      }));
      return;
    }

    setNewUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const [isSending, setIsSending] = useState(false);
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const messagesEndRef = useRef(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const abortControllerRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const isStoppedRef = useRef(false);
  const [skipHistoryLoad, setSkipHistoryLoad] = useState(false);
  const GPT_NANO_BOT = "gpt-5-nano";
  const LEGACY_GPT_NANO_BOT = "chatgpt-5-mini";
  const normalizeBotName = (botName = "") =>
    botName === LEGACY_GPT_NANO_BOT ? GPT_NANO_BOT : botName;
  const getBotDisplayName = (botName = "") => {
    const normalizedBotName = normalizeBotName(botName);
    if (normalizedBotName === GPT_NANO_BOT) return "GPT-5 Nano";
    if (normalizedBotName === "grok") return "Grok";
    if (normalizedBotName === "claude-3-haiku") return "Claude";
    if (normalizedBotName === "mistral") return "Mistral";
    if (normalizedBotName === "gemini") return "Gemini";
    return normalizedBotName;
  };
  const [selectedBot, setSelectedBot] = useState(GPT_NANO_BOT);
  const [isBotDropdownOpen, setIsBotDropdownOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  // const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  // Add this with your other useState declarations
  const [searchSessionResults, setSearchSessionResults] = useState([]);
  const [showSessionPanel, setShowSessionPanel] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [User, setUser] = useState({});
  const [authenticatedUserLoaded, setAuthenticatedUserLoaded] = useState(false);
  const formatDisplayName = (value) => {
    const rawName = String(value || "").trim();
    if (!rawName) return "User";
    if (rawName.toLowerCase() === "on the side") return "User";
    if (rawName.toLowerCase() === "qwerty") return "Onkar";
    return rawName
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ");
  };
  const getDisplayNameFromUser = (user = {}) => {
    const fullName = [user.firstName, user.lastName]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(" ");
    const candidates = [
      fullName,
      user.name,
      user.username,
      user.email ? String(user.email).split("@")[0] : "",
    ];

    for (const candidate of candidates) {
      const displayValue = formatDisplayName(candidate);
      if (displayValue !== "User") return displayValue;
    }

    return "User";
  };
  const displayName = getDisplayNameFromUser(User);
  const navigate = useNavigate();
  // 🔹 नवी state add करो
  // const [sessionRemainingTokens, setSessionRemainingTokens] = useState(0);
  const [chatRemainingTokens, setChatRemainingTokens] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [grokcustomValue, setGrokCustomValue] = useState("");
  const [activeView, setActiveView] = useState("WrdsAI Nxt");

  const [isCBSEActive, setIsCBSEActive] = useState(false);
  const [chapterStructure, setChapterStructure] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [chapterError, setChapterError] = useState("");
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [basicsUsedByAnswerId, setBasicsUsedByAnswerId] = useState({});
  const [basicsLoadingByAnswerId, setBasicsLoadingByAnswerId] = useState({});
  const [studyMenuAnchorEl, setStudyMenuAnchorEl] = useState(null);
  const [studyClassMenuAnchorEl, setStudyClassMenuAnchorEl] = useState(null);
  const [studySubjectMenuAnchorEl, setStudySubjectMenuAnchorEl] = useState(null);
  const [activeStudyClass, setActiveStudyClass] = useState(null);
  const [activeStudySubject, setActiveStudySubject] = useState(null);
  // const [activeView, setActiveView] = useState(() => {
  //   try {
  //     const user = JSON.parse(localStorage.getItem("user"));

  //     // mapping as per plan
  //     if (user?.subscriptionPlan === "WrdsAIPro") return "wrds AiPro";
  //     if (user?.subscriptionPlan === "WrdsAI") return "smartAi";

  //     // 🔹 fallback: direct subscriptionPlan value
  //     return user?.subscriptionPlan || "";
  //   } catch (e) {
  //     console.error("Error reading user plan:", e);
  //     return "";
  //   }
  // });

  const [historyList, setHistoryList] = useState([]); // store user search history
  const [selectedGrokQuery, setSelectedGrokQuery] = useState("");

  const isSmartAI = false;
  const isSmartAIPro = false;
  const isSmartAINxt = true;
  const setIsSmartAI = () => {};
  const setIsSmartAIPro = () => {};
  const setIsSmartAINxt = () => {};
  // const [error, setError] = useState("");
  // const [tokenCount, setTokenCount] = useState(0);
  const [linkCount, setLinkCount] = useState(3);
  const [isListening, setIsListening] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  // const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const recognitionRef = useRef(null);
  const partialResponseRef = useRef("");
  const currentPromptRef = useRef("");
  const selectRef = useRef(null);
  const disabled = true; // or false
  // const navigate = useNavigate();

  const {
    loading,
    setLoading,
    error,
    setError,
    tokenCount,
    setTokenCount,
    sessionRemainingTokens,
    setSessionRemainingTokens,
    results,
    setResults,
    grokhistoryList,
    setGrokHistoryList,
    totalTokensUsed,
    setTotalTokensUsed,
    totalSearches,
    setTotalSearches,
  } = useGrok();

  // In your state initialization
  // const [messageGroups, setMessageGroups] = useState([]);

  // State for popover
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const selectedChapterMeta =
    chapters.find((chapter) => chapter.id === selectedChapter) || null;
  const effectiveAuthenticatedUser =
    User?.email || User?.userRole || User?.role
      ? User
      : getAuthenticatedUserCache() || {};
  const hasEffectiveAuthenticatedUser = Boolean(
    effectiveAuthenticatedUser?.email ||
      effectiveAuthenticatedUser?.userRole ||
      effectiveAuthenticatedUser?.role,
  );
  const shouldHideStudyClassSelection =
    !teacherMode &&
    isStudentUser(effectiveAuthenticatedUser) &&
    Boolean(getUserClassName(effectiveAuthenticatedUser));
  const lockedStudyClass = getLockedStudentClass(
    chapterStructure,
    effectiveAuthenticatedUser,
    teacherMode,
  );
  const studyMenuClass = lockedStudyClass || activeStudyClass;
  const studyMenuSubjects = lockedStudyClass
    ? getVisibleSubjectsForStudent(lockedStudyClass)
    : activeStudyClass?.subjects || [];
  const selectedClassName = selectedChapterMeta?.className || selectedClass;
  const selectedSubjectName =
    selectedChapterMeta?.subjectName ||
    (selectedSubject ? selectedSubject.split("/").pop() : "");
  const isSelectedStudySubjectMaths =
    isCBSEActive && selectedSubjectName.trim().toLowerCase().includes("math");
  const isStudyMenuOpen = Boolean(studyMenuAnchorEl);

  useEffect(() => {
    if ((!isCBSEActive && !isStudyMenuOpen) || chapters.length > 0 || chaptersLoading) {
      return;
    }

    const fetchMathChapters = async () => {
      setChaptersLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/ai/math-chapters`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load chapters");
        }

        setChapterStructure(Array.isArray(data.structure) ? data.structure : []);
        setChapters(Array.isArray(data.chapters) ? data.chapters : []);
      } catch (error) {
        console.error("Failed to fetch math chapters:", error);
        setChapterStructure([]);
        setChapters([]);
        toast.error("Unable to load chapter list");
      } finally {
        setChaptersLoading(false);
      }
    };

    fetchMathChapters();
  }, [apiBaseUrl, chapters.length, chaptersLoading, isCBSEActive, isStudyMenuOpen]);

  const closeStudyMenus = () => {
    setStudyMenuAnchorEl(null);
    setStudyClassMenuAnchorEl(null);
    setStudySubjectMenuAnchorEl(null);
    setActiveStudyClass(null);
    setActiveStudySubject(null);
  };

  const handleStudyTriggerClick = (event) => {
    if (!teacherMode && !hasEffectiveAuthenticatedUser && !authenticatedUserLoaded) {
      return;
    }

    setChapterError("");
    setStudyClassMenuAnchorEl(null);
    setStudySubjectMenuAnchorEl(null);
    setActiveStudyClass(null);
    setActiveStudySubject(null);
    setStudyMenuAnchorEl((currentAnchor) =>
      currentAnchor ? null : event.currentTarget,
    );
  };

  const handleStudyClassOpen = (event, classItem) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveStudyClass(classItem);
    setActiveStudySubject(null);
    setStudyClassMenuAnchorEl(event.currentTarget);
    setStudySubjectMenuAnchorEl(null);
  };

  const handleStudySubjectOpen = (event, subjectItem) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveStudySubject(subjectItem);
    setStudySubjectMenuAnchorEl(event.currentTarget);
  };

  const handleStudyClassMenuClose = () => {
    setStudyClassMenuAnchorEl(null);
    setStudySubjectMenuAnchorEl(null);
    setActiveStudyClass(null);
    setActiveStudySubject(null);
  };

  const handleStudySubjectMenuClose = () => {
    setStudySubjectMenuAnchorEl(null);
    setActiveStudySubject(null);
  };

  const handleDeselectChapter = (e) => {
    if (e) e.stopPropagation();
    setIsCBSEActive(false);
    setSelectedClass("");
    setSelectedSubject("");
    setSelectedChapter("");
    setChapterError("");
  };

  const renderStudyChapterMenus = () => (
    <StudyChapterMenus
      isCBSEActive={isCBSEActive}
      chapterError={chapterError}
      isXS={isXS}
      selectedChapterMeta={selectedChapterMeta}
      studyMenuAnchorEl={studyMenuAnchorEl}
      isStudyMenuOpen={isStudyMenuOpen}
      onCloseStudyMenus={closeStudyMenus}
      chaptersLoading={chaptersLoading}
      chapterStructure={chapterStructure}
      onStudyClassOpen={handleStudyClassOpen}
      selectedClass={selectedClass}
      studyClassMenuAnchorEl={studyClassMenuAnchorEl}
      activeStudyClass={activeStudyClass}
      onCloseStudyClassMenu={handleStudyClassMenuClose}
      onStudySubjectOpen={handleStudySubjectOpen}
      selectedSubject={selectedSubject}
      studySubjectMenuAnchorEl={studySubjectMenuAnchorEl}
      activeStudySubject={activeStudySubject}
      onCloseStudySubjectMenu={handleStudySubjectMenuClose}
      onStudyChapterSelect={handleStudyChapterSelect}
      selectedChapter={selectedChapter}
      onStudyTriggerClick={handleStudyTriggerClick}
      onDeselectChapter={handleDeselectChapter}
      modeLabel={studyModeLabel}
      hideClassSelection={shouldHideStudyClassSelection}
      lockedStudyClass={
        shouldHideStudyClassSelection && lockedStudyClass
          ? { ...studyMenuClass, subjects: studyMenuSubjects }
          : null
      }
    />
  );

  const handleLessonPlanClick = () => {
    const chapterName = selectedChapterMeta?.name || selectedChapter || "";
    const subjectName = selectedSubjectName || "";
    const className = selectedClassName || "";

    const promptParts = [
      "Create a teacher lesson plan.",
      className ? `Class: ${className}` : "",
      subjectName ? `Subject: ${subjectName}` : "",
      chapterName ? `Chapter: ${chapterName}` : "",
      "",
      "Include learning objectives, prerequisite knowledge, teaching flow, board examples, student activities, quick checks, homework, and a short wrap-up.",
      "Keep it practical for classroom teaching.",
    ].filter(Boolean);

    const lessonPlanPrompt = promptParts.join("\n");
    const lessonPlanDisplayPrompt = [
      "Create a Lesson plan.",
      "Topic:",
    ].filter(Boolean).join(" ");
    lessonPlanDraftRef.current = lessonPlanPrompt;
    setIsLessonPlanMode(true);
    setInput(lessonPlanDisplayPrompt);
  };

  const getLessonPlanTopicFromPrompt = (value = "") => {
    const match = String(value).match(/\bTopic\s*:\s*([\s\S]*)$/i);
    return match ? match[1].trim() : "";
  };

  const handleCloseLessonPlanMode = (event) => {
    event?.stopPropagation();
    setIsLessonPlanMode(false);
    if (input === lessonPlanDraftRef.current) {
      setInput("");
    }
    lessonPlanDraftRef.current = "";
  };

  const renderTeacherLessonPlanButton = () =>
    teacherMode && isLessonPlanMode ? (
      <Box
        sx={{
          height: { xs: "39px", sm: "43px" },
          minWidth: { xs: "126px", sm: "146px" },
          borderRadius: "999px",
          px: { xs: 1.45, sm: 1.8 },
          display: "flex",
          alignItems: "center",
          gap: { xs: 0.55, sm: 0.7 },
          background: "linear-gradient(135deg, #ffe66d, #ff9bd2)",
          border: "1.5px solid rgba(255,255,255,0.28)",
          color: "#221246",
          boxShadow: "0 8px 18px rgba(255, 202, 84, 0.16)",
        }}
      >
        <AssignmentOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "13px", sm: "14px" },
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Lesson Plan
        </Typography>
        <IconButton
          size="small"
          onClick={handleCloseLessonPlanMode}
          sx={{
            ml: 0.3,
            p: "2px",
            bgcolor: "rgba(255, 255, 255, 0.42)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.62)",
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 14, color: "#221246" }} />
        </IconButton>
      </Box>
    ) : teacherMode ? (
      <Button
        variant="outlined"
        size="medium"
        startIcon={<AssignmentOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
        onClick={handleLessonPlanClick}
        disabled={isSending || isTypingResponse}
        sx={{
          height: { xs: "39px", sm: "43px" },
          borderRadius: "999px",
          px: { xs: 1.45, sm: 2 },
          minWidth: { xs: "126px", sm: "146px" },
          borderColor: "rgba(255, 230, 109, 0.82)",
          color: "#221246",
          bgcolor: "#ffffff",
          fontWeight: 700,
          fontSize: { xs: "13px", sm: "14px" },
          textTransform: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 8px 18px rgba(43, 24, 104, 0.14)",
          "& .MuiButton-startIcon": {
            mr: { xs: 0.55, sm: 0.7 },
          },
          "&:hover": {
            bgcolor: "#fffaf0",
            borderColor: "#f6d84f",
            transform: "translateY(-1px)",
          },
        }}
      >
        <Box component="span">Lesson Plan</Box>
      </Button>
    ) : null;

  const renderTeacherLessonPlanActionRow = () =>
    teacherMode ? (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          pr: { xs: 0.6, sm: 1.2 },
          mb: { xs: 0.55, sm: 0.75 },
          pointerEvents: "auto",
        }}
      >
        {renderTeacherLessonPlanButton()}
      </Box>
    ) : null;

  const handleStudyChapterSelect = (classItem, subjectItem, chapterItem) => {

    setIsCBSEActive(true);
    setSelectedClass(classItem.id);
    setSelectedSubject(subjectItem.id);
    setSelectedChapter(chapterItem.id);
    setChapterError("");
    closeStudyMenus();
  };

  const handleClick = (event, idx, tokens) => {
    setAnchorEl(event.currentTarget);
    setActiveGroup(idx);
  };

  // Inside your component
  // const theme = useTheme();
  // // const isMdScreen = useMediaQuery(theme.breakpoints.down("md"));
  // const isSmallScreen = useMediaQuery(theme.breakpoints.down("md")); // Small and medium screens
  // const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg")); // Large screens only

  const handleClose = () => {
    setAnchorEl(null);
    setActiveGroup(null);
  };
  const [anchorsEl, setAnchorsEl] = useState(null);

  // Inside your component
  const theme = useTheme();
  // const isMdScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md")); // Small and medium screens
  const isXS = useMediaQuery(theme.breakpoints.only("xs"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg")); // Large screens only

  const CustomTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: "#ffffff",
      color: "#000000",
      // color: "#1268fb",
      fontSize: "14px",
      padding: "10px 14px",
      borderRadius: "8px",
      boxShadow: "0px 2px 10px rgba(0,0,0,0.15)",
    },
  }));

  const handleToggleMenu = (event) => {
    if (anchorsEl) {
      setAnchorsEl(null);
    } else {
      setAnchorsEl(event.currentTarget);
    }
  };

  const handleCloseMenu = () => {
    setAnchorsEl(null);
  };

  // Pagination state for "All User Data"
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);



  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddUser = async () => {
    try {
      setIsCreatingUser(true);
      if (newUserData.subscriptionPlan !== "Free Trial" && !newUserData.childPlan) {
        toast.error("Please select a Child Plan");
        return;
      }
      
      const isUnder18 = ["<13", "13-14", "15-17"].includes(newUserData.ageGroup);
      const submitData = {
        ...newUserData,
        mobile: newUserData.mobileNumber ? `${newUserData.mobileCode}${newUserData.mobileNumber}` : "",
        parentMobile: newUserData.parentMobileNumber ? `${newUserData.parentMobileCode}${newUserData.parentMobileNumber}` : "",
        dateOfBirth: newUserData.dateOfBirth ? newUserData.dateOfBirth.toISOString().split("T")[0] : null,
      };

      const response = await fetch(`${apiBaseUrl}/api/ai/createUserManually`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const rawText = await response.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { message: rawText };
      }

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success! 🎉",
          text: `User created successfully! Password: ${data.password}`,
          confirmButtonColor: "#2F67F6",
        });
        setAddUserOpen(false);
        fetchAllUsers(); // Refresh the table
        // Reset form
        setNewUserData({
          firstName: "",
          lastName: "",
          email: "",
          mobileCode: "+91",
          mobileNumber: "",
          dateOfBirth: null,
          ageGroup: "",
          parentName: "",
          parentEmail: "",
          parentMobileCode: "+91",
          parentMobileNumber: "",
          subscriptionPlan: "WrdsAI",
          childPlan: "Glow Up",
          subscriptionType: "Monthly",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed 🚫",
          text: data.message || data.error || "Failed to create user",
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("An error occurred while creating user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Add this function to generate a unique session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const user = User || {};
  const username = user?.username;
  const email = user?.email;

  // Add this function to remove individual files
  const removeFile = (indexToRemove) => {
    setSelectedFiles((prevFiles) => {
      const newFiles = prevFiles.filter(
        (file, index) => index !== indexToRemove,
      );
      return newFiles;
    });
  };

  useEffect(() => {
    const saved = null;
    if (saved) {
      setSessionRemainingTokens(Number(saved));
    }

    // ✅ Refresh User state from localStorage to get latest subscription data
    const userData = null;
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAuthenticatedUser = async () => {
      const cachedUser = getAuthenticatedUserCache();
      if (cachedUser) {
        setUser(cachedUser);
        setSessionRemainingTokens(
          cachedUser.subscription?.remainingTokens || 0,
        );
      }

      try {
        const userData = await fetchCurrentUser();
        if (cancelled) return;

        if (!userData) {
          if (cachedUser) return;
          navigate("/login");
          return;
        }

        setUser(userData);
        setSessionRemainingTokens(userData.subscription?.remainingTokens || 0);
        setIsBotDropdownOpen(
          userData.subscription?.subscriptionPlan === "WrdsAIPro" ||
            userData.subscription?.subscriptionPlan === "WrdsAI",
        );
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
        if (!cancelled && !cachedUser) navigate("/login");
      } finally {
        if (!cancelled) setAuthenticatedUserLoaded(true);
      }
    };

    loadAuthenticatedUser();

    return () => {
      cancelled = true;
    };
  }, [navigate, setSessionRemainingTokens]);

  useEffect(() => {
    const lastSessionId = localStorage.getItem("lastChatSessionId");
    if (activeView === "chat" && lastSessionId) {
      setSelectedChatId(lastSessionId);

      // Load token count from localStorage
      const savedTokens = localStorage.getItem(`tokens_${lastSessionId}`);
      if (savedTokens) {
        console.log("Restored tokens:", savedTokens);
      }
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "smartAi") {
      const lastSmartId = localStorage.getItem("lastSmartAISessionId");

      if (lastSmartId) {
        setSelectedChatId(lastSmartId);

        const savedTokens = localStorage.getItem(`tokens_${lastSmartId}`);
        if (savedTokens) {
          console.log("Restored Smart AI tokens:", savedTokens);
        }

        loadSmartAIHistory(lastSmartId);
      }
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "wrds AiPro") {
      const lastProId = localStorage.getItem("lastSmartAIProSessionId");

      if (lastProId) {
        setSelectedChatId(lastProId);

        const savedTokens = localStorage.getItem(`tokens_${lastProId}`);
        if (savedTokens) {
          console.log("Restored Smart AI Pro tokens:", savedTokens);
        }

        loadSmartAIProHistory(lastProId);
      }
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === "WrdsAI Nxt") {
      const lastNxtId = localStorage.getItem("lastSmartAINxtSessionId");

      if (lastNxtId) {
        setSelectedChatId(lastNxtId);

        const savedTokens = localStorage.getItem(`tokens_${lastNxtId}`);
        if (savedTokens) {
          console.log("Restored Smart AI Nxt tokens:", savedTokens);
        }

        loadSmartAINxtHistory(lastNxtId);
      }
    }
  }, [activeView]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Custom Popper for wider dropdown
  const StyledPopper = styled(Popper)({
    "& .MuiAutocomplete-paper": {
      minWidth: "400px", // 🔥 Set your desired width here
    },
  });

  const fetchAllUsers = async () => {
    try {
      setAllUsersLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/ai/get_all_users`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load user data");
    } finally {
      setAllUsersLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutCurrentUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setMobileMenuAnchor(null);
      handleCloseMenu();
      setUser({});
      setAuthenticatedUserCache(null);
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  useEffect(() => {
    if (activeView === "allUserData") {
      fetchAllUsers();
    }
  }, [activeView]);
  console.log("Chatui::::::::::");
  console.log("historyList111111::::::::::", historyList);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // const startListening = () => {
  //   const SpeechRecognition =
  //     window.SpeechRecognition || window.webkitSpeechRecognition;

  //   if (!SpeechRecognition) {
  //     alert("Your browser does not support speech recognition!");
  //     return;
  //   }

  //   const recognition = new SpeechRecognition();
  //   recognition.lang = "en-US"; // or "gu-IN" for Gujarati
  //   recognition.continuous = false;
  //   recognition.interimResults = true;

  //   recognition.onstart = () => setIsListening(true);

  //   recognition.onresult = (event) => {
  //     let transcript = "";
  //     for (let i = event.resultIndex; i < event.results.length; i++) {
  //       transcript += event.results[i][0].transcript;
  //     }
  //     setInput(transcript); // live typing into your input box
  //   };

  //   recognition.onerror = (event) => {
  //     console.error("Speech recognition error:", event.error);
  //     setIsListening(false);
  //   };

  //   recognition.onend = () => {
  //     setIsListening(false);
  //     recognitionRef.current = null;
  //   };

  //   recognition.start();
  //   recognitionRef.current = recognition;
  // };

  // const stopListening = () => {
  //   recognitionRef.current?.stop();
  //   setIsListening(false);
  // };

  // const startListening = () => {
  //   const SpeechRecognition =
  //     window.SpeechRecognition || window.webkitSpeechRecognition;

  //   if (!SpeechRecognition) {
  //     alert("Your browser does not support speech recognition!");
  //     return;
  //   }

  //   // prevent multiple instances
  //   if (recognitionRef.current) return;

  //   const recognition = new SpeechRecognition();
  //   recognition.lang = "en-US"; // or "gu-IN"
  //   recognition.continuous = true; // 👈 keep listening until stop
  //   recognition.interimResults = true;

  //   recognition.onstart = () => {
  //     console.log("🎤 Voice input started...");
  //     setIsListening(true);
  //   };

  //   recognition.onresult = (event) => {
  //     let transcript = "";
  //     for (let i = event.resultIndex; i < event.results.length; i++) {
  //       transcript += event.results[i][0].transcript;
  //     }

  //     // 👇 accumulate or live-update typed text
  //     setInput((prev) => transcript);
  //   };

  //   recognition.onerror = (event) => {
  //     console.error("Speech recognition error:", event.error);
  //     setIsListening(false);
  //     recognitionRef.current = null;
  //   };

  //   recognition.onend = () => {
  //     console.log("🛑 Voice input stopped");
  //     setIsListening(false);
  //     recognitionRef.current = null;
  //   };

  //   recognition.start();
  //   recognitionRef.current = recognition;
  // };

  // const stopListening = () => {
  //   console.log("⛔ Stop clicked");
  //   if (recognitionRef.current) {
  //     recognitionRef.current.stop();
  //     recognitionRef.current = null;
  //   }
  //   setIsListening(false);
  // };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition!");
      return;
    }

    if (recognitionRef.current) return; // prevent multiple mic instances

    const recognition = new SpeechRecognition();
    // recognition.lang = "en-US"; // or "gu-IN"
    recognition.lang = "auto"; // ✅ auto-detect spoken language
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = ""; // 🔹 store only final confirmed speech

    recognition.onstart = () => {
      console.log("🎤 Listening started...");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      // loop through results
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.trim();

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      // 🔹 Combine final confirmed + current speaking (no duplication)
      const combinedText = (finalTranscript + interimTranscript).trim();

      // 🔹 Update input box only with latest clean text (no repeats)
      setInput(combinedText);

      // ✅ Translate to English
      // if (combinedText) {
      //   try {
      //     const translated = translateToEnglish(combinedText);
      //     setInput(translated);
      //   } catch (error) {
      //     console.error("🌐 Translation error:", error);
      //     setInput(combinedText); // fallback: show raw speech
      //   }
      // }
    };

    recognition.onerror = (event) => {
      console.error("🎙️ Speech recognition error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      console.log("🛑 Listening stopped");
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // ✅ Translation function (LibreTranslate or Google API)
  // async function translateToEnglish(text) {
  //   try {
  //     // 🔹 Option 1: Free LibreTranslate API (no key required, slower)
  //     // const res = await fetch("https://libretranslate.de/translate", {
  //     const res = await fetch(`${apiBaseUrl}/api/ai/translate`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         text,
  //         // q: text,
  //         // source: "auto",
  //         // target: "en",
  //         // format: "text",
  //       }),
  //     });
  //     const data = await res.json();
  //     return data.translatedText;
  //   } catch (error) {
  //     console.error("🔴 Translation error:", error);
  //     return text; // fallback: return original text if translation fails
  //   }
  // }

  const resetChangePasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleChangePassword = async () => {
    console.log("CHANGE PASSWORD CLICKED:::"); // 👈 add this

    // e.preventDefault();
    console.log(
      ";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;",
      `${apiBaseUrl}/api/ai/change-password`,
    );

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/ai/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id, // logged-in user id
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Something went wrong");
      }

      toast.success(data?.message || "Password changed successfully");

      // Swal.fire("Success", "Password changed successfully", "success");
      resetChangePasswordForm();
      setOpenChangePassword(false);
    } catch (err) {
      console.error("change-password API Error:", err);
    }
  };

  const handleDeleteUser = (userId) => {
    setDeleteUserId(userId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/ai/delete_user/${deleteUserId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (response.ok) {
        setAllUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== deleteUserId),
        );
        toast.success("User deleted successfully");
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteUserId(null);
    }
  };

  const handleUpgradePlan = () => {
    const user = User || {};

    navigate("/register", {
      state: {
        isUpgrade: true, // 🔑 important flag
        userData: {
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          ageGroup: user.ageGroup,
          email: user.email,
          mobile: user.mobile,
          parentName: user.parentName,
          parentEmail: user.parentEmail,
          parentMobile: user.parentMobile,
        },
      },
    });
  };

  const handleCloseSidebar = () => {
    setOpenSidebar(false);
    setSearchSessionResults([]);
    setSearchValue("");
  };

  const handleSidebarSessionSelect = (chat) => {
    if (!chat?.id) return;

    setSelectedChatId(chat.id);

    if (activeView === "chat") {
      localStorage.setItem("lastChatSessionId", chat.id);
      loadChatHistory(chat.sessionId);
    }

    if (activeView === "smartAi") {
      localStorage.setItem("lastSmartAISessionId", chat.id);
      loadSmartAIHistory(chat.sessionId);
    }

    if (activeView === "wrds AiPro") {
      localStorage.setItem("lastSmartAIProSessionId", chat.id);
      loadSmartAIProHistory(chat.sessionId);
    }

    if (activeView === "WrdsAI Nxt") {
      localStorage.setItem("lastSmartAINxtSessionId", chat.id);
      loadSmartAINxtHistory(chat.sessionId);
    }

    setMobileMenuAnchor(null);
    setShowSessionPanel(false);
  };

  const handleSearch = async (searchQuery) => {
    const finalQuery = searchQuery || selectedGrokQuery; // ✅ use passed query if available
    console.log("finalQuery:::====", finalQuery);
    if (!finalQuery) return; // do nothing if query is empty
    setLoading(true);
    setError(null);
    setTokenCount(0);

    const user = User || {};
    const email = user?.email;
    console.log("user:::=====", user);
    try {
      const response = await fetch(`${apiBaseUrl}/search`, {
        // const response = await fetch(`${apiBaseUrl}/grokSearch`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: finalQuery,
          email, // optional
          category: "general", // optional
          linkCount,
          raw: false,
        }),
      });

      const data = await response.json();

      if (data.limitReached) {
        Swal.fire({
          title: "Search Limit Reached 🚫",
          text: data.message,
          icon: "warning",
          confirmButtonText: "OK",
        });
        setLoading(false);
        return;
      }

      if (response.status === 403 || data.allowed === false) {
        const isSelfHarmSupport =
          data?.error === "SELF_HARM_SUPPORT" ||
          data?.restrictedCategory === "self-harm" ||
          data?.safetyType === "self-harm";

        Swal.fire({
          title: isSelfHarmSupport ? "Immediate Support" : "Restricted Search 🚫",
          text:
            data.message || "This search is not allowed for your age group.",
          icon: isSelfHarmSupport ? "info" : "warning",
          customClass: {
            popup: "red-alert-icon",
          },
        });
        setError(data.message);
        setLoading(false);
        return;
      }

      if (response.status === 400 && data.message === "Not enough tokens") {
        setResults(null);
        setTokenCount(0);

        await Swal.fire({
          title: "Not enough tokens!",
          text: "You don't have enough tokens to continue.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Ok",
          cancelButtonText: "Purchase Tokens",
          allowOutsideClick: true, // ✅ allow closing by clicking outside
          allowEscapeKey: true, // ✅ allow Esc key
          allowEnterKey: true, // ✅ allow Enter key
        }).then((results) => {
          if (results.isConfirmed) {
            Swal.close();
          } else if (results.isDismissed) {
            // window.location.href = "/purchase";
          }
        });

        setError("Not enough tokens to process your request.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      // const data = await response.json();

      if (data.remainingTokens !== undefined) {
        setSessionRemainingTokens(data.remainingTokens); // ✅ update parent
      }
      setResults(data);
      // setTokenCount(data.tokenUsage?.totalTokens || 0); // <-- update token count

      // ✅ Get token counts
      const usedTokens =
        data.summaryStats?.tokens || data.tokenUsage?.totalTokens || 0;
      setTokenCount(usedTokens);

      // // ✅ Update total tokens used
      // setTotalTokensUsed((prev) => (prev || 0) + usedTokens);

      // // ✅ Deduct used tokens from remaining
      // setSessionRemainingTokens((prev) =>
      //   Math.max(0, (prev || 0) - usedTokens)
      // );

      try {
        const statsRes = await fetch(`${apiBaseUrl}/userTokenStats`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          if (typeof stats.totalTokensUsed === "number") {
            setTotalTokensUsed(stats.totalTokensUsed);
          }
          if (typeof stats.remainingTokens === "number") {
            setSessionRemainingTokens(stats.remainingTokens);
          }
        }
      } catch (e) {
        console.warn(
          "Failed to refresh userTokenStats after search:",
          e.message,
        );
      }

      if (data.totalSearches !== undefined) {
        setTotalSearches(data.totalSearches);
      }

      // const currentTokens = data.tokenUsage?.totalTokens || 0;

      // // ✅ Update token count for this search
      // setTokenCount(currentTokens);

      // // ✅ Add to global total tokens used
      // setTotalTokensUsed((prevTotal) => prevTotal + currentTokens);

      // 🔹 Save to localStorage for persistence
      localStorage.setItem(
        "lastGrokSearch",
        JSON.stringify({ query: finalQuery, results: data }),
      );
      console.log("Search Response:", data);

      // 🔹 2. After search success → Call Search History API
      await fetch(`${apiBaseUrl}/Searchhistory`, {
        // await fetch(`${apiBaseUrl}/grokSearchhistory`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((historyData) => {
          console.log("Updated search history:", historyData);
          if (historyData.history?.length > 0)
            setGrokHistoryList(historyData.history.map((h) => h.query));
        })
        .catch((err) => {
          console.error("Search history fetch error:", err);
        });
    } catch (err) {
      console.error("Search API Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const fetchChatbotResponseWithFiles = async (
    formData,
    currentSessionId,
    isSmartAI = false,
    isSmartAIPro = false,
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    //  Add here
    currentPromptRef.current = input;
    partialResponseRef.current = "";

    try {
      // 👇 Dynamic endpoint
      const endpoint = `${apiBaseUrl}/api/ai/SmartAINxt_ask`;

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        body: formData, // No Content-Type header - browser will set it with boundary
        signal: controller.signal,
      });

      const rawText = await response.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { message: rawText };
      }

      // Handle "Not enough tokens" error
      // if (!response.ok) {
      //   const errorData = await response.json();

      //   if (
      //     response.status === 400 &&
      //     errorData.message === "Not enough tokens"
      //   ) {
      //     await Swal.fire({
      //       title: "Not enough tokens!",
      //       text: "You don't have enough tokens to continue.",
      //       icon: "warning",
      //       showCancelButton: true,
      //       showDenyButton: true,
      //       confirmButtonText: "Ok",
      //       denyButtonText: "Switch to Free Model",
      //       cancelButtonText: "Purchase Tokens",
      //     }).then((result) => {
      //       if (result.isConfirmed) {
      //         // just close
      //       } else if (result.isDenied) {
      //         setSelectedBot("chatgpt-5-mini");
      //       } else if (result.isDismissed) {
      //         // window.location.href = "/purchase";
      //       }
      //     });

      //     return {
      //       response: "Not enough tokens to process your request.",
      //       sessionId: currentSessionId,
      //       botName: selectedBot,
      //       isError: true,
      //     };
      //   }

      //   throw new Error(
      //     errorData.message || `HTTP error! status: ${response.status}`
      //   );
      // }

      // ❌ IMAGE / VIDEO GENERATION BLOCK
      if (
        response.status === 400 &&
        data?.error === "MEDIA_GENERATION_NOT_ALLOWED"
      ) {
        // await Swal.fire({
        //   icon: "error",
        //   title: "Not Allowed 🚫",
        //   text: data.message || "Generating images and videos is not allowed",
        //   confirmButtonColor: "#1268fb",
        //   confirmButtonText: "OK",
        // });

        return {
          response:
            data.message || "Oops! Creating images and videos are not allowed.",
          sessionId: currentSessionId,
          isError: true,
          botName:
            isSmartAI || activeView === "smartAi"
              ? "Wrds AI"
              : isSmartAIPro || activeView === "wrds AiPro"
                ? "Wrds AiPro"
                : isSmartAINxt || activeView === "WrdsAI Nxt"
                  ? "Wrds Ai Nxt"
                  : selectedBot,
        };
      }

      // 🛑 INPUT TOKEN LIMIT (Prompt + Files exceeded)
      if (
        response.status === 400 &&
        data?.error === "INPUT_TOKEN_LIMIT_EXCEEDED"
      ) {
        // ✅ Use backend's dynamic error message
        const errorMessage =
          data.message ||
          "Prompt + uploaded files exceed token limit. Please reduce prompt or upload smaller files.";

        await Swal.fire({
          icon: "warning",
          title: "Token Limit Exceeded",
          text: errorMessage,
          confirmButtonText: "OK",
        });

        return {
          response: errorMessage,
          sessionId: currentSessionId,
          botName:
            isSmartAI || activeView === "smartAi"
              ? "Wrds AI"
              : isSmartAIPro || activeView === "wrds AiPro"
                ? "Wrds AiPro"
                : isSmartAINxt || activeView === "WrdsAI Nxt"
                  ? "Wrds Ai Nxt"
                  : selectedBot,
          isError: true,
        };
      }

      // 🛑 Check for “Not enough tokens” here (works 100%)
      if (data?.message === "Not enough tokens") {
        await Swal.fire({
          title: "Not enough tokens!",
          text: "You don't have enough tokens to continue.",
          icon: "warning",
          showCancelButton: true,
          showDenyButton: false,
          confirmButtonText: "Ok",
          cancelButtonText: "Upgrade/ Renew Plan",
        }).then((result) => {
          if (result.isConfirmed) {
            // just close
          } else if (
            result.isDismissed &&
            result.dismiss === Swal.DismissReason.cancel
          ) {
            handleUpgradePlan();
          }
        });

        return {
          response: "Not enough tokens to process your request.",
          sessionId: currentSessionId,
          // botName: selectedBot,
          botName:
            isSmartAI || activeView === "smartAi"
              ? "Wrds AI"
              : isSmartAIPro || activeView === "wrds AiPro"
                ? "Wrds AiPro"
                : isSmartAINxt || activeView === "WrdsAI Nxt"
                  ? "Wrds Ai Nxt"
                  : selectedBot,

          isError: true,
        };
      }

      // 🛑 AGE-BASED RESTRICTION HANDLER
      if (response.status === 403 || data.allowed === false) {
        // await Swal.fire({
        //   title: "Restricted Search 🚫",
        //   text:
        //     data.message || "This request is not allowed for your age group.",
        //   icon: "warning",
        // });
        return {
          response:
            data.message ||
            "Oops! The requested content isn’t available for your age group.",
          sessionId: currentSessionId,
          // botName: selectedBot,
          botName:
            // isSmartAI || activeView === "smartAi" ? "Wrds AI" : selectedBot,
            isSmartAI || activeView === "smartAi"
              ? "Wrds AI"
              : isSmartAIPro || activeView === "wrds AiPro"
                ? "Wrds AiPro"
                : selectedBot,
          isError: true,
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `HTTP error! status: ${response.status}`,
        );
      }

      // 🟢 while processing response, store it in partial ref
      if (data?.response) {
        partialResponseRef.current = data.response; // save the full (or partial) response
      }

      // 🟢 (optional) you can also do this line if you render “typing” in UI:
      setIsTypingResponse(false);

      abortControllerRef.current = null;
      // const data = await response.json();

      console.log("API Response with files:", data);

      // ✅ Immediately refresh user token stats after chat completion
      // try {
      //   const user = JSON.parse(localStorage.getItem("user"));
      //   const email = user?.email;
      //   if (email) {
      //     const statsRes = await fetch(`${apiBaseUrl}/userTokenStats`, {
      //       method: "POST",
      //       headers: { "Content-Type": "application/json" },
      //       body: JSON.stringify({ email }),
      //     });

      //     if (statsRes.ok) {
      //       const stats = await statsRes.json();
      //       if (typeof stats.totalTokensUsed === "number") {
      //         setTotalTokensUsed(stats.totalTokensUsed);
      //       }
      //       if (typeof stats.remainingTokens === "number") {
      //         setSessionRemainingTokens(stats.remainingTokens);
      //         localStorage.setItem("globalRemainingTokens", stats.remainingTokens);
      //       }
      //     }
      //   }
      // } catch (e) {
      //   console.warn("⚠️ Failed to refresh userTokenStats after chat:", e.message);
      // }

      return {
        response: data.response?.replace(/\n\n/g, "<br/>") || "",
        sessionId: data.sessionId,
        remainingTokens: data.remainingTokens,
        tokensUsed: data.tokensUsed || null,
        totalTokensUsed: data.totalTokensUsed ?? null,
        // botName: data.botName || selectedBot,
        botName:
          isSmartAI || activeView === "smartAi"
            ? "Wrds AI"
            : isSmartAIPro || activeView === "wrds AiPro"
              ? "Wrds AiPro"
              : isSmartAINxt || activeView === "WrdsAI Nxt"
                ? "Wrds Ai Nxt"
                : data.botName || selectedBot,
        files: data.files || [], // Include file info from backend
      };
    } catch (err) {
      if (err?.name === "AbortError") {
        console.log("Request was aborted");
        return null;
      }

      console.error("fetchChatbotResponseWithFiles error:", err);

      // if (err.message && err.message.includes("Not enough tokens")) {
      //   return {
      //     response: "Not enough tokens to process your request.",
      //     sessionId: currentSessionId,
      //     botName: selectedBot,
      //     isError: true,
      //   };
      // }

      // 🟡 Catch any other "Not enough tokens" message (fallback)
      if (err.message && err.message.includes("Not enough tokens")) {
        await Swal.fire({
          title: "Not enough tokens!",
          text: "You don't have enough tokens to continue.",
          icon: "warning",
          showCancelButton: true,
          showDenyButton: false,
          confirmButtonText: "Ok",
          cancelButtonText: "Upgrade/ Renew Plan",
        }).then((result) => {
          if (result.isConfirmed) {
            // Just close
          } else if (
            result.isDismissed &&
            result.dismiss === Swal.DismissReason.cancel
          ) {
            handleUpgradePlan();
          }
        });

        return {
          response: "Not enough tokens to process your request.",
          sessionId: currentSessionId,
          // botName: selectedBot,
          botName:
            // isSmartAI || activeView === "smartAi" ? "Wrds AI" : selectedBot,
            isSmartAI || activeView === "smartAi"
              ? "Wrds AI"
              : isSmartAIPro || activeView === "wrds AiPro"
                ? "Wrds AiPro"
                : selectedBot,
          isError: true,
        };
      }

      return {
        response: err?.message || "Sorry, something went wrong.",
        sessionId: currentSessionId,
        // botName: selectedBot,
        botName:
          // isSmartAI || activeView === "smartAi" ? "Wrds AI" : selectedBot,
          isSmartAI || activeView === "smartAi"
            ? "Wrds AI"
            : isSmartAIPro || activeView === "wrds AiPro"
              ? "Wrds AiPro"
              : selectedBot,
        isError: true,
      };
    }
  };

  // const handleStopResponse = async () => {
  //   if (abortControllerRef.current) {
  //     console.log("⛔ User clicked Stop");
  //     abortControllerRef.current.abort();
  //     abortControllerRef.current = null;
  //   }

  //   isStoppedRef.current = true;
  //   setIsTypingResponse(false);

  //   const partialResponse = getCurrentPartialResponse();
  //   if (!partialResponse || !selectedChatId) return;

  //   try {
  //     const user = JSON.parse(localStorage.getItem("user"));
  //     const email = user?.email;

  //     const messageType =
  //       activeView === "smartAi"
  //         ? "smart Ai"
  //         : activeView === "wrds AiPro"
  //         ? "wrds AiPro"
  //         : "chat";

  //     const res = await fetch(`${apiBaseUrl}/api/ai/save_partial`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         email,
  //         sessionId: selectedChatId,
  //         prompt: currentPromptRef.current,
  //         partialResponse,
  //         botName: selectedBot,
  //         type: messageType, // ✅ add type
  //       }),
  //     });

  //     const data = await res.json();
  //     console.log("✅ Partial response saved:", data);

  //     if (data.success) {
  //       // ✅ Update tokens + UI instantly based on type
  //       if (messageType === "smart Ai") {
  //         // 🧠 Update Smart AI message group
  //         setSmartAIMessageGroups((prev) => {
  //           const updated = [...prev];
  //           const messages = updated[0] || [];
  //           const lastMsgIndex = messages.length - 1;

  //           if (lastMsgIndex >= 0) {
  //             messages[lastMsgIndex] = {
  //               ...messages[lastMsgIndex],
  //               isTyping: false,
  //               isComplete: false,
  //               tokensUsed: data.tokensUsed,
  //               type: "smart Ai",
  //             };
  //             updated[0] = messages;
  //           }

  //           return updated;
  //         });
  //       } else if (messageType === "wrds AiPro") {
  //         // 🧠 Update Smart AI message group
  //         setSmartAIProMessageGroups((prev) => {
  //           const updated = [...prev];
  //           const messages = updated[0] || [];
  //           const lastMsgIndex = messages.length - 1;

  //           if (lastMsgIndex >= 0) {
  //             messages[lastMsgIndex] = {
  //               ...messages[lastMsgIndex],
  //               isTyping: false,
  //               isComplete: false,
  //               tokensUsed: data.tokensUsed,
  //               type: "wrds AiPro",
  //             };
  //             updated[0] = messages;
  //           }

  //           return updated;
  //         });
  //       } else {
  //         // 💬 Update Chat message group
  //         setMessageGroups((prev) => {
  //           const updated = [...prev];
  //           const messages = updated[0] || [];
  //           const lastMsgIndex = messages.length - 1;

  //           if (lastMsgIndex >= 0) {
  //             messages[lastMsgIndex] = {
  //               ...messages[lastMsgIndex],
  //               isTyping: false,
  //               isComplete: false,
  //               tokensUsed: data.tokensUsed,
  //               type: "chat",
  //             };
  //             updated[0] = messages;
  //           }

  //           return updated;
  //         });
  //       }

  //       // ✅ userTokenStats (AFTER save_partial)
  //       try {
  //         const statsRes = await fetch(`${apiBaseUrl}/userTokenStats`, {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({ email }),
  //         });

  //         if (statsRes.ok) {
  //           const stats = await statsRes.json();
  //           if (typeof stats.totalTokensUsed === "number")
  //             setTotalTokensUsed(stats.totalTokensUsed);
  //           if (typeof stats.remainingTokens === "number") {
  //             setSessionRemainingTokens(stats.remainingTokens);
  //             localStorage.setItem(
  //               "globalRemainingTokens",
  //               stats.remainingTokens
  //             );
  //           }
  //         }
  //       } catch (err) {
  //         console.warn(
  //           "⚠️ Failed to refresh stats after partial save:",
  //           err.message
  //         );
  //       }

  //       // re-fetch chat session so DB stays synced
  //       // await fetchChatSessions();
  //       // ✅ Re-fetch only relevant sessions
  //       if (messageType === "smart Ai") {
  //         await fetchSmartAISessions(); // refresh smart Ai tab
  //       } else if (messageType === "wrds AiPro") {
  //         await fetchSmartAIProSessions(); // refresh smart Ai tab
  //       } else {
  //         await fetchChatSessions(); // refresh chat tab
  //       }
  //     }
  //   } catch (err) {
  //     console.error("❌ Failed to save partial response:", err);
  //   }
  // };

  // Helper function

  const handleStopResponse = async () => {
    if (abortControllerRef.current) {
      console.log("⛔ User clicked Stop");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isStoppedRef.current = true;
    setIsTypingResponse(false);

    const partialResponse = getCurrentPartialResponse();
    if (!partialResponse || !selectedChatId) return;

    try {
      const user = User || {};
      const email = user?.email;

      const res = await fetch(`${apiBaseUrl}/api/ai/save_partial`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          sessionId: selectedChatId,
          prompt: currentPromptRef.current,
          partialResponse,
          botName: selectedBot,
          type: "chat",
        }),
      });

      const data = await res.json();
      console.log("✅ Partial response saved:", data);

      if (data.success) {
        // ⬇️ Update token count box instantly
        setMessageGroups((prev) => {
          const updated = [...prev];
          const messages = updated[0] || [];
          const lastMsgIndex = messages.length - 1;

          if (lastMsgIndex >= 0) {
            messages[lastMsgIndex] = {
              ...messages[lastMsgIndex],
              isTyping: false,
              isComplete: false,
              tokensUsed: data.tokensUsed, // ✅ Show partial token count
              type: "chat",
            };
            updated[0] = messages;
          }
          return updated;
        });

        // ✅ userTokenStats (AFTER save_partial)
        try {
          const statsRes = await fetch(`${apiBaseUrl}/userTokenStats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          if (statsRes.ok) {
            const stats = await statsRes.json();
            if (typeof stats.totalTokensUsed === "number")
              setTotalTokensUsed(stats.totalTokensUsed);
            if (typeof stats.remainingTokens === "number") {
              setSessionRemainingTokens(stats.remainingTokens);
            }
          }
        } catch (err) {
          console.warn(
            "⚠️ Failed to refresh stats after partial save:",
            err.message,
          );
        }

        // re-fetch chat session so DB stays synced
        await fetchChatSessions();
      }
    } catch (err) {
      console.error("❌ Failed to save partial response:", err);
    }
  };

  const handleStopSmartAIResponse = async () => {
    if (abortControllerRef.current) {
      console.log("⛔ User clicked Stop");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isStoppedRef.current = true;
    setIsTypingResponse(false);

    const partialResponse = getCurrentPartialResponse();
    if (!partialResponse || !selectedChatId) return;

    try {
      const user = User || {};
      const email = user?.email;

      const res = await fetch(`${apiBaseUrl}/api/ai/save_smartAi_Nxt_partial`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          sessionId: selectedChatId,
          prompt: currentPromptRef.current,
          partialResponse,
          botName: selectedBot,
          type: "smart Ai",
        }),
      });

      const data = await res.json();
      console.log("✅ Partial response saved:", data);

      if (data.success) {
        // ⬇️ Update token count box instantly
        setSmartAIMessageGroups((prev) => {
          const updated = [...prev];
          const messages = updated[0] || [];
          const lastMsgIndex = messages.length - 1;

          if (lastMsgIndex >= 0) {
            messages[lastMsgIndex] = {
              ...messages[lastMsgIndex],
              isTyping: false,
              isComplete: false,
              tokensUsed: data.tokensUsed, // ✅ Show partial token count
              type: "smart Ai",
            };
            updated[0] = messages;
          }
          return updated;
        });

        // ✅ userTokenStats (AFTER save_partial)
        try {
          const statsRes = await fetch(`${apiBaseUrl}/userTokenStats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          if (statsRes.ok) {
            const stats = await statsRes.json();
            if (typeof stats.totalTokensUsed === "number")
              setTotalTokensUsed(stats.totalTokensUsed);
            if (typeof stats.remainingTokens === "number") {
              setSessionRemainingTokens(stats.remainingTokens);
            }
          }
        } catch (err) {
          console.warn(
            "⚠️ Failed to refresh stats after partial save:",
            err.message,
          );
        }

        // re-fetch chat session so DB stays synced
        await fetchSmartAISessions();
      }
    } catch (err) {
      console.error("❌ Failed to save partial response:", err);
    }
  };

  const handleStopSmartAIProResponse = async () => {
    if (abortControllerRef.current) {
      console.log("⛔ User clicked Stop");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isStoppedRef.current = true;
    setIsTypingResponse(false);

    const partialResponse = getCurrentPartialResponse();
    if (!partialResponse || !selectedChatId) return;

    try {
      const user = User || {};
      const email = user?.email;

      const res = await fetch(`${apiBaseUrl}/api/ai/save_smartAi_Nxt_partial`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          sessionId: selectedChatId,
          prompt: currentPromptRef.current,
          partialResponse,
          botName: selectedBot,
          type: "wrds AiPro",
        }),
      });

      const data = await res.json();
      console.log("✅ Partial response saved:", data);

      if (data.success) {
        // ⬇️ Update token count box instantly
        setSmartAIProMessageGroups((prev) => {
          const updated = [...prev];
          const messages = updated[0] || [];
          const lastMsgIndex = messages.length - 1;

          if (lastMsgIndex >= 0) {
            messages[lastMsgIndex] = {
              ...messages[lastMsgIndex],
              isTyping: false,
              isComplete: false,
              tokensUsed: data.tokensUsed, // ✅ Show partial token count
              type: "wrds AiPro",
            };
            updated[0] = messages;
          }
          return updated;
        });

        // ✅ userTokenStats (AFTER save_partial)
        try {
          const statsRes = await fetch(`${apiBaseUrl}/userTokenStats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          if (statsRes.ok) {
            const stats = await statsRes.json();
            if (typeof stats.totalTokensUsed === "number")
              setTotalTokensUsed(stats.totalTokensUsed);
            if (typeof stats.remainingTokens === "number") {
              setSessionRemainingTokens(stats.remainingTokens);
            }
          }
        } catch (err) {
          console.warn(
            "⚠️ Failed to refresh stats after partial save:",
            err.message,
          );
        }

        // re-fetch chat session so DB stays synced
        await fetchSmartAIProSessions();
      }
    } catch (err) {
      console.error("❌ Failed to save partial response:", err);
    }
  };

  const handleStopSmartAINxtResponse = async () => {
    if (abortControllerRef.current) {
      console.log("⛔ User clicked Stop");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isStoppedRef.current = true;
    setIsTypingResponse(false);

    const partialResponse = getCurrentPartialResponse();
    if (!partialResponse || !selectedChatId) return;

    try {
      const user = User || {};
      const email = user?.email;

      const res = await fetch(`${apiBaseUrl}/api/ai/save_smartAi_Nxt_partial`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          sessionId: selectedChatId,
          prompt: currentPromptRef.current,
          partialResponse,
          botName: selectedBot,
          type: "WrdsAI Nxt",
        }),
      });

      const data = await res.json();
      console.log("✅ Partial response saved:", data);

      if (data.success) {
        // ⬇️ Update token count box instantly
        setSmartAINxtMessageGroups((prev) => {
          const updated = [...prev];
          const messages = updated[0] || [];
          const lastMsgIndex = messages.length - 1;

          if (lastMsgIndex >= 0) {
            messages[lastMsgIndex] = {
              ...messages[lastMsgIndex],
              isTyping: false,
              isComplete: false,
              tokensUsed: data.tokensUsed, // ✅ Show partial token count
              type: "WrdsAI Nxt",
            };
            updated[0] = messages;
          }
          return updated;
        });

        // ✅ userTokenStats (AFTER save_partial)
        try {
          const statsRes = await fetch(`${apiBaseUrl}/userTokenStats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          if (statsRes.ok) {
            const stats = await statsRes.json();
            if (typeof stats.totalTokensUsed === "number")
              setTotalTokensUsed(stats.totalTokensUsed);
            if (typeof stats.remainingTokens === "number") {
              setSessionRemainingTokens(stats.remainingTokens);
            }
          }
        } catch (err) {
          console.warn(
            "⚠️ Failed to refresh stats after partial save:",
            err.message,
          );
        }

        // re-fetch chat session so DB stays synced
        await fetchSmartAINxtSessions();
      }
    } catch (err) {
      console.error("❌ Failed to save partial response:", err);
    }
  };

  const getCurrentPartialResponse = () => {
    // 🧠 detect which view is active
    const messageType =
      activeView === "smartAi" || isSmartAI
        ? "smart Ai"
        : activeView === "wrds AiPro" || isSmartAIPro
          ? "wrds AiPro"
          : activeView === "WrdsAI Nxt" || isSmartAINxt
            ? "WrdsAI Nxt"
            : "chat";

    // 🧩 choose the correct message source
    const currentGroups =
      messageType === "smart Ai"
        ? smartAIMessageGroups
        : messageType === "wrds AiPro"
          ? smartAIProMessageGroups
          : messageType === "WrdsAI Nxt"
            ? smartAINxtMessageGroups
            : messageGroups;

    const lastMsgGroup = currentGroups?.[0] || [];
    const lastMsg = lastMsgGroup[lastMsgGroup.length - 1];
    return lastMsg?.responses?.[0] || "";
  };

  const fetchChatSessions = async () => {
    setSessionLoading(true);
    try {
      const user = User || {};
      if (!user || !user.email) return;

      const response = await fetch(`${apiBaseUrl}/api/ai/get_user_sessions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Process the sessions based on API response
      let sessions = [];

      // ✅ Filter only type:"chat"
      const filteredSessions = data.sessions?.filter(
        (s) => s?.type?.toLowerCase() === "chat",
      );

      // Handle different response structures
      // if (data && Array.isArray(data.sessions)) {
      //   // Structure 1: response: [{ user_sessions: [...] }]
      //   if (data && data?.session?.length > 0) {
      //     console.log("data.response_if:::::", data);
      //     console.log(
      //       "data?.sessions?.history?.length:::::",
      //       data?.sessions?.history?.length
      //     );
      //     // alert("hhhhhhhhh");

      //     sessions = data?.sessions?.reverse().map((session) => {
      //       console.log(
      //         "session?.history?.[0]?.totalTokensUsed",
      //         session?.history?.[0]?.totalTokensUsed
      //       );
      //       // Save token count to localStorage
      //       if (session?.history?.[0]?.totalTokensUsed !== undefined) {
      //         localStorage.setItem(
      //           `tokens_${session.sessionId}`,
      //           session?.history?.[0]?.totalTokensUsed?.toString()
      //         );
      //       }
      //       return {
      //         id: session.sessionId,
      //         // name:
      //         //   session.heading ||
      //         //   `Chat ${session.sessionId.slice(0, 8)}`,
      //         name: session.heading || `Chat ${session.sessionId.slice(0, 8)}`,
      //         sessionId: session.sessionId,
      //         createTime: session.create_time || new Date().toISOString(),
      //         totalTokensUsed: session.totalTokensUsed || 0,
      //       };
      //     });
      //   }
      //   // Structure 2: response: [{ session_id, session_heading, ... }]
      //   else {
      //     console.log(
      //       "data?.sessions?.history?.length > 0_else:::====",
      //       data?.sessions?.history?.length > 0
      //     );
      //     console.log("data.response_else:::::", data);

      //     sessions = data?.sessions?.reverse().map((session) => {
      //       if (session?.history?.[0]?.totalTokensUsed !== undefined) {
      //         localStorage.setItem(
      //           `tokens_${session.sessionId}`,
      //           session?.history?.[0]?.totalTokensUsed?.toString()
      //         );
      //       }
      //       return {
      //         id: session.sessionId,
      //         // name:
      //         //   session.heading ||
      //         //   session.name ||
      //         //   `Chat ${session.sessionId.slice(0, 8)}`,
      //         name: session.heading || `Chat ${session.sessionId.slice(0, 8)}`,
      //         sessionId: session.sessionId,
      //         createTime:
      //           session.create_time ||
      //           session.createTime ||
      //           new Date().toISOString(),
      //         totalTokensUsed: session?.history?.[0]?.totalTokensUsed || 0,
      //       };
      //     });
      //   }
      // }

      // ✅ Process filtered chat sessions only
      if (Array.isArray(filteredSessions) && filteredSessions.length > 0) {
        sessions = filteredSessions.reverse().map((session) => {
          // ✅ Save token count to localStorage if available
          if (session?.history?.[0]?.totalTokensUsed !== undefined) {
            localStorage.setItem(
              `tokens_${session.sessionId}`,
              session?.history?.[0]?.totalTokensUsed?.toString(),
            );
          }

          return {
            id: session.sessionId,
            name: session.heading || `Chat ${session.sessionId.slice(0, 8)}`,
            sessionId: session.sessionId,
            createTime:
              session.create_time ||
              session.createTime ||
              new Date().toISOString(),
            // totalTokensUsed: session?.history?.[0]?.totalTokensUsed || 0,
            totalTokensUsed: session.totalTokensUsed || 0,
            type: "chat", // ✅ always tag as chat type
          };
        });
      }
      console.log("sessions:::::::", sessions);
      setChats(sessions);
      console.log("response::::::::", initialLoad, sessions, !selectedChatId); // Debug log); // Debug log
      // Select the first chat if none is selected
      if (initialLoad && sessions.length > 0 && !selectedChatId) {
        const firstSessionId = sessions[0].id;
        setSelectedChatId(firstSessionId);
        localStorage.setItem("lastChatSessionId", firstSessionId);
        loadChatHistory(sessions[0].sessionId);
      }
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setSessionLoading(false);
      setInitialLoad(false);
    }
  };
  console.log("chats:::::::::", chats);

  const getChatHistory = async (sessionId) => {
    try {
      const user = User || {};
      if (!user || !user.email) return [];

      const response = await fetch(`${apiBaseUrl}/api/ai/history`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email: user.email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log("dataaaaaaaaaaaaaaaaaaaaaaaaaaa:", data); // Debug log

      // Extract token information from the response
      if (data.remainingTokens !== undefined) {
        setChatRemainingTokens(data.remainingTokens);
      }

      // Return the response array, ensuring it's always an array
      return Array.isArray(data.response)
        ? data.response
        : Array.isArray(data.messages)
          ? data.messages
          : Array.isArray(data)
            ? data
            : [];

      // ✅ Add/force type:"chat" in each message
      // const filteredMessages = messagesArray
      //   .filter((msg) => !msg.type || msg.type.toLowerCase() === "chat")
      //   .map((msg) => ({
      //     ...msg,
      //     type: "chat",
      //   }));

      // console.log("Filtered chat history:", filteredMessages);

      // return filteredMessages;

      // ✅ Filter only type:"chat"
    } catch (error) {
      console.error("API Error:", error);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  };

  // 🧠 Fetch Smart AI sessions
  const fetchSmartAISessions = async () => {
    setSessionLoading(true);
    try {
      const user = User || {};
      if (!user || !user.email) return;

      const response = await fetch(
        `${apiBaseUrl}/api/ai/get_smartAi_Nxt_sessions`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        },
      );

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const data = await response.json();
      console.log("SmartAI Sessions response::::::", data);

      let sessions = [];

      // ✅ Filter only type:"smart Ai"
      const filteredSessions = data.sessions?.filter(
        (s) => s?.type?.toLowerCase() === "smart ai",
      );
      // console.log("session--aya::::::", filteredSessions);

      // ✅ Process filtered smart AI sessions only
      if (Array.isArray(filteredSessions) && filteredSessions.length > 0) {
        sessions = filteredSessions.reverse().map((session) => {
          // ✅ Save token count to localStorage if available
          if (session?.history?.[0]?.totalTokensUsed !== undefined) {
            localStorage.setItem(
              `tokens_${session.sessionId}`,
              session?.history?.[0]?.totalTokensUsed?.toString(),
            );
          }

          return {
            id: session.sessionId,
            name:
              session.heading || `Smart AI ${session.sessionId.slice(0, 8)}`,
            sessionId: session.sessionId,
            createTime:
              session.create_time ||
              session.createTime ||
              new Date().toISOString(),
            totalTokensUsed: session.totalTokensUsed || 0,
            type: "smart Ai", // ✅ always tag as Smart AI type
          };
        });
      }

      console.log("Smart AI sessions (filtered):", sessions);

      // ✅ Store only Smart AI sessions
      setSmartAISessions(sessions || []);
      console.log("smartAISessions:::::::::", smartAISessions);

      // Auto-load first Smart AI chat
      if (sessions?.length && initialLoad && !selectedChatId) {
        const firstSessionId = sessions[0].id;
        setSelectedChatId(firstSessionId);
        localStorage.setItem("lastSmartAISessionId", firstSessionId);
        loadSmartAIHistory(sessions[0].sessionId);
      }

      // ✅ Automatically open the LAST Smart AI session (latest)
      // if (sessions.length > 0) {
      //   const lastSession = sessions[0]; // since reversed()
      //   setSelectedChatId(lastSession.id);
      //   localStorage.setItem("lastSmartAISessionId", lastSession.id);
      //   loadSmartAIHistory(lastSession.sessionId);
      // }
    } catch (err) {
      console.error("Smart AI sessions error:", err);
    } finally {
      setSessionLoading(false);
      setInitialLoad(false);
    }
  };
  console.log("smartAISessions:::::::::", smartAISessions);

  const fetchSmartAIProSessions = async () => {
    setSessionLoading(true);
    try {
      const user = User || {};
      if (!user || !user.email) return;

      const response = await fetch(
        `${apiBaseUrl}/api/ai/get_smartAi_Nxt_sessions`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        },
      );

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const data = await response.json();
      console.log("wrdsAI Pro Sessions response::::::", data);

      let sessions = [];

      // ✅ Filter only type:"smart Ai"
      const filteredSessions = data.sessions?.filter(
        (s) => s?.type?.toLowerCase() === "wrds aipro",
      );
      // console.log("session--aya::::::", filteredSessions);

      // ✅ Process filtered smart AI sessions only
      if (Array.isArray(filteredSessions) && filteredSessions.length > 0) {
        sessions = filteredSessions.reverse().map((session) => {
          // ✅ Save token count to localStorage if available
          if (session?.history?.[0]?.totalTokensUsed !== undefined) {
            localStorage.setItem(
              `tokens_${session.sessionId}`,
              session?.history?.[0]?.totalTokensUsed?.toString(),
            );
          }

          return {
            id: session.sessionId,
            name:
              session.heading || `Wrds AI Pro ${session.sessionId.slice(0, 8)}`,
            sessionId: session.sessionId,
            createTime:
              session.create_time ||
              session.createTime ||
              new Date().toISOString(),
            totalTokensUsed: session.totalTokensUsed || 0,
            type: "wrds AiPro", // ✅ always tag as Smart AI type
          };
        });
      }

      console.log("wrds AIpro sessions (filtered):", sessions);

      // ✅ Store only Smart AI sessions
      setSmartAIProSessions(sessions || []);
      // console.log("smartAISessions:::::::::", smartAISessions);

      // Auto-load first Smart AI chat
      if (sessions?.length && initialLoad && !selectedChatId) {
        const firstSessionId = sessions[0].id;
        setSelectedChatId(firstSessionId);
        localStorage.setItem("lastSmartAIProSessionId", firstSessionId);
        loadSmartAIProHistory(sessions[0].sessionId);
      }

      // ✅ Automatically open the LAST Smart AI session (latest)
      // if (sessions.length > 0) {
      //   const lastSession = sessions[0]; // since reversed()
      //   setSelectedChatId(lastSession.id);
      //   localStorage.setItem("lastSmartAIProSessionId", lastSession.id);
      //   loadSmartAIProHistory(lastSession.sessionId);
      // }
    } catch (err) {
      console.error("wrds AI pro sessions error:", err);
    } finally {
      setSessionLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchSmartAINxtSessions = async () => {
    const user = User || {};
    if (!user.email) return;

    setSessionLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/ai/get_smartAi_Nxt_sessions`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        },
      );

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const data = await response.json();
      console.log("wrdsAI Nxt Sessions response::::::", data);

      let sessions = [];

      // ✅ Filter only type:"WrdsAI Nxt" (backend stores as "WrdsAI Nxt" → toLowerCase = "wrdsai nxt")
      const normalizeType = (value = "") =>
        value.toLowerCase().replace(/\s+/g, "");

      const rawSessions = Array.isArray(data.sessions) ? data.sessions : [];
      const filteredSessions = rawSessions.filter((session) => {
        const normalizedType = normalizeType(session?.type);
        return normalizedType.includes("nxt") || Array.isArray(session?.history);
      });

      if (Array.isArray(filteredSessions) && filteredSessions.length > 0) {
        sessions = filteredSessions.reverse().map((session) => {
          if (session?.history?.[0]?.totalTokensUsed !== undefined) {
            localStorage.setItem(
              `tokens_${session.sessionId}`,
              session?.history?.[0]?.totalTokensUsed?.toString(),
            );
          }

          return {
            id: session.sessionId,
            name:
              session.heading || `Wrds AI Nxt ${session.sessionId.slice(0, 8)}`,
            sessionId: session.sessionId,
            createTime:
              session.create_time ||
              session.createTime ||
              new Date().toISOString(),
            totalTokensUsed: session.totalTokensUsed || 0,
            type: "WrdsAI Nxt",
          };
        });
      }

      setSmartAINxtSessions(sessions || []);

      const savedSessionId = localStorage.getItem("lastSmartAINxtSessionId");

      const selectedSessionExists = sessions.some(
        (session) =>
          session.id === selectedChatId || session.sessionId === selectedChatId,
      );

      if (sessions?.length && (initialLoad || !selectedSessionExists)) {
        const sessionToOpen =
          sessions.find(
            (session) =>
              session.id === savedSessionId ||
              session.sessionId === savedSessionId,
          ) || sessions[0];

        setSelectedChatId(sessionToOpen.id);
        localStorage.setItem("lastSmartAINxtSessionId", sessionToOpen.id);
        loadSmartAINxtHistory(sessionToOpen.sessionId);
      } else if (initialLoad && savedSessionId) {
        setSelectedChatId(savedSessionId);
        loadSmartAINxtHistory(savedSessionId);
      }
    } catch (err) {
      console.error("wrds AI nxt sessions error:", err);
    } finally {
      setSessionLoading(false);
      setInitialLoad(false);
    }
  };
  console.log("smartAISessions:::::::::", smartAIProSessions);

  // 🧠 Fetch Smart AI chat history
  const getSmartAIHistory = async (sessionId) => {
    try {
      const user = User || {};
      if (!user || !user.email) return [];

      const response = await fetch(`${apiBaseUrl}/api/ai/SmartAINxt_history`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email: user.email }),
      });

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const data = await response.json();
      console.log("Smart AI History:", data);

      if (data.remainingTokens !== undefined)
        setChatRemainingTokens(data.remainingTokens);

      return Array.isArray(data.response)
        ? data.response
        : Array.isArray(data.messages)
          ? data.messages
          : [];

      // ✅ Filter only type:"smart Ai"
    } catch (err) {
      console.error("Smart AI history error:", err);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  };

  const getSmartAIProHistory = async (sessionId) => {
    try {
      const user = User || {};
      if (!user || !user.email) return [];

      const response = await fetch(`${apiBaseUrl}/api/ai/SmartAINxt_history`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email: user.email }),
      });

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const data = await response.json();
      console.log("Smart AI Pro History:", data);

      if (data.remainingTokens !== undefined)
        setChatRemainingTokens(data.remainingTokens);

      return Array.isArray(data.response)
        ? data.response
        : Array.isArray(data.messages)
          ? data.messages
          : [];

      // ✅ Filter only type:"smart Ai"
    } catch (err) {
      console.error("Smart AI history error:", err);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  };

  const getSmartAINxtHistory = async (sessionId) => {
    try {
      const user = User || {};
      if (!user || !user.email) return [];

      const response = await fetch(`${apiBaseUrl}/api/ai/SmartAINxt_history`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email: user.email }),
      });

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const data = await response.json();
      console.log("Smart AI Nxt History:", data);

      if (data.remainingTokens !== undefined)
        setChatRemainingTokens(data.remainingTokens);

      return Array.isArray(data.response)
        ? data.response
        : Array.isArray(data.messages)
          ? data.messages
          : [];

    } catch (err) {
      console.error("Smart AI Nxt history error:", err);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    // 🧠 choose which message list to scroll based on active view
    const currentGroups =
      activeView === "smartAi" || isSmartAI
        ? smartAIMessageGroups
        : activeView === "wrds AiPro" || isSmartAIPro
          ? smartAIProMessageGroups
          : activeView === "WrdsAI Nxt" || isSmartAINxt
            ? smartAINxtMessageGroups
            : messageGroups;

    if (!historyLoading && currentGroups.length > 0) {
      scrollToBottom();
    }
  }, [
    historyLoading,
    messageGroups,
    smartAIProMessageGroups,
    smartAIMessageGroups,
    smartAINxtMessageGroups,
    activeView,
    isSmartAI,
    isSmartAIPro,
    isSmartAINxt,
    scrollToBottom,
  ]);

  // useEffect(() => {
  //   fetchChatSessions();
  // }, []);

  useEffect(() => {
    const user = User || {};
    if (!user.email) {
      return;
    }

    const lastSessionId = localStorage.getItem("lastChatSessionId");
    if (activeView === "chat" && lastSessionId) {
      setSelectedChatId(lastSessionId);

      // Load token count from localStorage
      const savedTokens = localStorage.getItem(`tokens_${lastSessionId}`);
      if (savedTokens) {
        console.log("Restored tokens:", savedTokens);
      }
    }

    // Fetch chat sessions after confirming user exists
    // fetchChatSessions();

    // Fetch combined token stats (chat + search) for profile
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/userTokenStats`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });
        if (!res.ok) return;
        const stats = await res.json();
        if (stats?.totalTokensUsed !== undefined) {
          setTotalTokensUsed(stats.totalTokensUsed);
        }
        if (stats?.totalSearches !== undefined) {
          setTotalSearches(stats.totalSearches);
        }
        if (stats?.remainingTokens !== undefined) {
          setSessionRemainingTokens(stats.remainingTokens);
        }
      } catch (e) {
        console.warn("Failed to load user token stats:", e.message);
      }
    })();

    // Fetch chat sessions after confirming user exists
    // fetchChatSessions();

    // ✅ Fetch data depending on selected view
    if (isSmartAI || activeView === "smartAi") {
      console.log("🧠 Loading Smart AI sessions...");
      fetchSmartAISessions();
    } else if (isSmartAIPro || activeView === "wrds AiPro") {
      console.log("🧠 Loading Smart AI Pro sessions...");
      fetchSmartAIProSessions();
    } else if (isSmartAINxt || activeView === "WrdsAI Nxt") {
      console.log("🚀 Loading WrdsAI Nxt sessions...");
      fetchSmartAINxtSessions();
    } else {
      console.log("💬 Loading normal chat sessions...");
      fetchChatSessions();
    }
  }, [User?.email, activeView, isSmartAI, isSmartAIPro, isSmartAINxt]);

  // useEffect(() => {
  //   if (!selectedChatId) return;

  //   // const selectedChat = chats.find((chat) => chat.id === selectedChatId);
  //   // 🧠 Choose correct session list
  //   const currentSessions =
  //     activeView === "smartAi" || isSmartAI
  //       ? smartAISessions
  //       : activeView === "wrds AiPro" || isSmartAIPro
  //       ? smartAIProSessions
  //       : chats;

  //   const selectedChat = currentSessions.find(
  //     (chat) => chat.id === selectedChatId
  //   );

  //   if (!selectedChat) return;
  //   if (skipHistoryLoad) {
  //     setSkipHistoryLoad(false);
  //     return;
  //   }

  //   console.log("Loading chat history for session:", selectedChat.sessionId); // Debug log

  //   if (selectedChat.sessionId) {
  //     if (activeView === "smartAi") {
  //       // 🧠 Smart AI tab
  //       loadSmartAIHistory(selectedChat.sessionId);

  //       // 🔹 Load latest token count for Smart AI
  //       const savedTokens = localStorage.getItem(
  //         `tokens_${selectedChat.sessionId}_smartAi`
  //       );
  //       if (savedTokens) {
  //         setRemainingTokens(Number(savedTokens));
  //         console.log("Smart AI tokens:", savedTokens);
  //       }
  //     } else if (activeView === "wrds AiPro") {
  //       // 🧠 Smart AI tab
  //       loadSmartAIProHistory(selectedChat.sessionId);

  //       // 🔹 Load latest token count for Smart AI
  //       const savedTokens = localStorage.getItem(
  //         `tokens_${selectedChat.sessionId}_wrdsAiPro`
  //       );
  //       if (savedTokens) {
  //         setRemainingTokens(Number(savedTokens));
  //         console.log("Smart AIPro tokens:", savedTokens);
  //       }
  //     } else {
  //       // 💬 Chat tab
  //       loadChatHistory(selectedChat.sessionId);

  //       // 🔹 Load latest token count for Chat
  //       const savedTokens = localStorage.getItem(
  //         `tokens_${selectedChat.sessionId}_chat`
  //       );
  //       if (savedTokens) {
  //         setRemainingTokens(Number(savedTokens));
  //         console.log("Chat tokens:", savedTokens);
  //       }
  //     }
  //   } else {
  //     // 🧹 Reset UI if no session
  //     if (activeView === "smartAi") {
  //       setSmartAIMessageGroups([[]]);
  //     } else if (activeView === "wrds AiPro") {
  //       setSmartAIProMessageGroups([[]]);
  //     } else {
  //       setMessageGroups([[]]);
  //     }
  //   }
  // }, [
  //   selectedChatId,
  //   skipHistoryLoad,
  //   activeView,
  //   isSmartAI,
  //   isSmartAIPro,
  //   chats,
  //   smartAISessions,
  //   smartAIProSessions,
  // ]);

  const loadChatHistory = async (sessionId) => {
    console.log("Fetching history for sessionId:::::::::::::", loadChatHistory); // Debug log
    if (!sessionId) {
      setMessageGroups([[]]);
      return;
    }

    setHistoryLoading(true);

    try {
      // Fetch from API
      const rawHistory = await getChatHistory(sessionId);
      console.log("Raw chat history fetched::::::", rawHistory); // Debug log

      // Process the history into message groups
      const processedGroups = [];

      for (let i = 0; i < rawHistory.length; i++) {
        const message = rawHistory[i];

        // Handle both new format (with prompt field) and old format
        if (message.prompt) {
          // New format - user message with prompt
          processedGroups.push({
            id: message.id || `msg_${i}`,
            prompt: message.prompt,
            responses: [
              message.response
                ? message.response.replace(/\n\n/g, "<br/>")
                : "No response available",
            ],
            time: new Date(
              message.create_time || Date.now(),
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            currentSlide: 0,
            isTyping: false,
            isComplete: true,
            tokensUsed: message.tokensUsed || null,
            // botName: message.botName || "chatgpt-5-mini",
            botName: message.botName || selectedBot,
            files: message.files || [],
          });
        } else if (message.role === "user") {
          // Old format - user message
          let modelResponse = null;
          let tokensUsed = null;
          let botName = GPT_NANO_BOT;
          let j = i + 1;

          // Look for the corresponding model response
          while (j < rawHistory.length && rawHistory[j].role !== "user") {
            if (rawHistory[j].role === "model") {
              modelResponse = rawHistory[j];
              tokensUsed = modelResponse.tokensUsed || null;
              botName = normalizeBotName(modelResponse.botName || GPT_NANO_BOT);
              break;
            }
            j++;
          }

          processedGroups.push({
            id: message.id || `msg_${i}`,
            prompt: message.content,
            responses: [
              modelResponse
                ? modelResponse.content.replace(/\n\n/g, "<br/>")
                : "No response available",
            ],
            time: new Date(
              message.timestamp || message.create_time || Date.now(),
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            currentSlide: 0,
            isTyping: false,
            isComplete: true,
            tokensUsed: tokensUsed,
            botName: botName,
            files: message.files || [],
          });
        } else if (message.role === "model" && i === 0) {
          // Handle case where first message is from model (no preceding user message)
          processedGroups.push({
            id: `msg_${i}`,
            prompt: "System initiated conversation",
            responses: [message.content.replace(/\n\n/g, "<br/>")],
            time: new Date(
              message.timestamp || message.create_time || Date.now(),
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            currentSlide: 0,
            isTyping: false,
            isComplete: true,
            tokensUsed: message.tokensUsed || null,
            botName: message.botName || selectedBot,
            files: message.files || [],
          });
        }
      }

      // If no messages were processed but we have raw history, create fallback messages
      if (processedGroups.length === 0 && rawHistory.length > 0) {
        rawHistory.forEach((message, index) => {
          if (message.content) {
            processedGroups.push({
              id: `msg_${index}`,
              prompt:
                message.role === "user" ? message.content : "System message",
              responses: [
                message.role === "model"
                  ? message.content.replace(/\n\n/g, "<br/>")
                  : "Waiting for response...",
              ],
              time: new Date(
                message.timestamp || message.create_time || Date.now(),
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              currentSlide: 0,
              isTyping: false,
              isComplete: true,
              tokensUsed: message.tokensUsed || null,
              botName: message.botName || selectedBot,
              files: message.files || [],
            });
          }
        });
      }

      setMessageGroups([processedGroups]);
    } catch (error) {
      console.error("Error loading chat history:", error);
      setMessageGroups([[]]);
    } finally {
      setHistoryLoading(false);
      setTimeout(() => scrollToBottom(), 200);
    }
  };

  const loadSmartAIHistory = async (sessionId) => {
    console.log("🧠 Fetching Smart AI history for sessionId:", sessionId);
    if (!sessionId) {
      setSmartAIMessageGroups([[]]); // ✅ clear Smart AI messages
      return;
    }

    setHistoryLoading(true);

    try {
      // 1️⃣ Fetch Smart AI history data
      const rawHistory = await getSmartAIHistory(sessionId);
      console.log("Raw smartAi history fetched::::::", rawHistory);

      // 2️⃣ Process Smart AI messages
      const processedGroups = [];

      for (let i = 0; i < rawHistory.length; i++) {
        const message = rawHistory[i];

        if (message.prompt) {
          processedGroups.push({
            id: message.id || `smartMsg_${i}`,
            prompt: message.prompt,
            responses: [
              message.response
                ? message.response.replace(/\n\n/g, "<br/>")
                : "No response available",
            ],
            time: new Date(
              message.create_time || Date.now(),
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            currentSlide: 0,
            isTyping: false,
            isComplete: true,
            tokensUsed: message.tokensUsed || null,
            botName: message.botName || "Wrds AI",
            files: message.files || [],
          });
        } else if (message.role === "user") {
          // legacy structure (user + model)
          let modelResponse = null;
          let tokensUsed = null;
          let botName = "Wrds AI";
          let j = i + 1;

          while (j < rawHistory.length && rawHistory[j].role !== "user") {
            if (rawHistory[j].role === "model") {
              modelResponse = rawHistory[j];
              tokensUsed = modelResponse.tokensUsed || null;
              botName = modelResponse.botName || "Wrds AI";
              break;
            }
            j++;
          }

          processedGroups.push({
            id: message.id || `smartMsg_${i}`,
            prompt: message.content,
            responses: [
              modelResponse
                ? modelResponse.content.replace(/\n\n/g, "<br/>")
                : "No response available",
            ],
            time: new Date(
              message.timestamp || message.create_time || Date.now(),
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            currentSlide: 0,
            isTyping: false,
            isComplete: true,
            tokensUsed,
            botName,
            files: message.files || [],
          });
        }
      }

      // 3️⃣ Handle fallback case
      if (processedGroups.length === 0 && rawHistory.length > 0) {
        rawHistory.forEach((message, index) => {
          if (message.content) {
            processedGroups.push({
              id: `smartMsg_${index}`,
              prompt:
                message.role === "user" ? message.content : "System message",
              responses: [
                message.role === "model"
                  ? message.content.replace(/\n\n/g, "<br/>")
                  : "Waiting for response...",
              ],
              time: new Date(
                message.timestamp || message.create_time || Date.now(),
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              currentSlide: 0,
              isTyping: false,
              isComplete: true,
              tokensUsed: message.tokensUsed || null,
              botName: message.botName || "Wrds AI",
              files: message.files || [],
            });
          }
        });
      }

      // 4️⃣ Save Smart AI messages to a separate state
      setSmartAIMessageGroups([processedGroups]); // ✅ separate from chat
    } catch (error) {
      console.error("❌ Error loading WrdsAI history:", error);
      setSmartAIMessageGroups([[]]);
    } finally {
      setHistoryLoading(false);
      setTimeout(() => scrollToBottom(), 200);
    }
  };
  const loadSmartAIProHistory = async (sessionId) => {
    console.log("🧠 Fetching WrdsAI Pro history for sessionId:", sessionId);
    if (!sessionId) {
      setSmartAIProMessageGroups([[]]); // ✅ clear Smart AI messages
      return;
    }

    setHistoryLoading(true);

    try {
      // 1️⃣ Fetch Smart AI history data
      const rawHistory = await getSmartAIProHistory(sessionId);

      // 2️⃣ Process Smart AI messages
      const processedGroups = [];

      for (let i = 0; i < rawHistory.length; i++) {
        const message = rawHistory[i];

        if (message.prompt) {
          processedGroups.push({
            id: message.id || `smartMsg_${i}`,
            prompt: message.prompt,
            responses: [
              message.response
                ? message.response.replace(/\n\n/g, "<br/>")
                : "No response available",
            ],
            time: new Date(
              message.create_time || Date.now(),
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            currentSlide: 0,
            isTyping: false,
            isComplete: true,
            tokensUsed: message.tokensUsed || null,
            botName: message.botName || "Wrds AIPro",
            files: message.files || [],
          });
        } else if (message.role === "user") {
          // legacy structure (user + model)
          let modelResponse = null;
          let tokensUsed = null;
          let botName = "Wrds AIPro";
          let j = i + 1;

          while (j < rawHistory.length && rawHistory[j].role !== "user") {
            if (rawHistory[j].role === "model") {
              modelResponse = rawHistory[j];
              tokensUsed = modelResponse.tokensUsed || null;
              botName = modelResponse.botName || "Wrds AIPro";
              break;
            }
            j++;
          }

          processedGroups.push({
            id: message.id || `smartMsg_${i}`,
            prompt: message.content,
            responses: [
              modelResponse
                ? modelResponse.content.replace(/\n\n/g, "<br/>")
                : "No response available",
            ],
            time: new Date(
              message.timestamp || message.create_time || Date.now(),
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            currentSlide: 0,
            isTyping: false,
            isComplete: true,
            tokensUsed,
            botName,
            files: message.files || [],
          });
        }
      }

      // 3️⃣ Handle fallback case
      if (processedGroups.length === 0 && rawHistory.length > 0) {
        rawHistory.forEach((message, index) => {
          if (message.content) {
            processedGroups.push({
              id: `smartMsg_${index}`,
              prompt:
                message.role === "user" ? message.content : "System message",
              responses: [
                message.role === "model"
                  ? message.content.replace(/\n\n/g, "<br/>")
                  : "Waiting for response...",
              ],
              time: new Date(
                message.timestamp || message.create_time || Date.now(),
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              currentSlide: 0,
              isTyping: false,
              isComplete: true,
              tokensUsed: message.tokensUsed || null,
              botName: message.botName || "Wrds AIPro",
              files: message.files || [],
            });
          }
        });
      }

      // 4️⃣ Save Smart AI messages to a separate state
      setSmartAIProMessageGroups([processedGroups]); // ✅ separate from chat
    } catch (error) {
      console.error("❌ Error loading WrdsAI Pro history:", error);
      setSmartAIProMessageGroups([[]]);
    } finally {
      setHistoryLoading(false);
      setTimeout(() => scrollToBottom(), 200);
    }
  };

  const loadSmartAINxtHistory = async (sessionId) => {
    console.log("🚀 Fetching WrdsAI Nxt history for sessionId:", sessionId);
    if (!sessionId) {
      setSmartAINxtMessageGroups([[]]);
      return;
    }

    setHistoryLoading(true);

    try {
      const rawHistory = await getSmartAINxtHistory(sessionId);
      console.log("Raw WrdsAI Nxt history fetched::::::", rawHistory);

      const processedGroups = [];

      for (let i = 0; i < rawHistory.length; i++) {
        const message = rawHistory[i];

        if (message.prompt) {
          processedGroups.push({
            id: message.id || `nxtMsg_${i}`,
            prompt: message.prompt,
            responses: [
              message.response
                ? message.response.replace(/\n\n/g, "<br/>")
                : "No response available",
            ],
            time: new Date(
              message.create_time || Date.now(),
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            currentSlide: 0,
            isTyping: false,
            isComplete: true,
            tokensUsed: message.tokensUsed || null,
            botName: message.botName || "Wrds Ai Nxt",
            files: message.files || [],
          });
        } else if (message.role === "user") {
          let modelResponse = null;
          let tokensUsed = null;
          let botName = "Wrds Ai Nxt";
          let j = i + 1;

          while (j < rawHistory.length && rawHistory[j].role !== "user") {
            if (rawHistory[j].role === "model") {
              modelResponse = rawHistory[j];
              tokensUsed = modelResponse.tokensUsed || null;
              botName = modelResponse.botName || "Wrds Ai Nxt";
              break;
            }
            j++;
          }

          processedGroups.push({
            id: message.id || `nxtMsg_${i}`,
            prompt: message.content,
            responses: [
              modelResponse
                ? modelResponse.content.replace(/\n\n/g, "<br/>")
                : "No response available",
            ],
            time: new Date(
              message.timestamp || message.create_time || Date.now(),
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            currentSlide: 0,
            isTyping: false,
            isComplete: true,
            tokensUsed,
            botName,
            files: message.files || [],
          });
        }
      }

      // Fallback for raw messages
      if (processedGroups.length === 0 && rawHistory.length > 0) {
        rawHistory.forEach((message, index) => {
          if (message.content) {
            processedGroups.push({
              id: `nxtMsg_${index}`,
              prompt:
                message.role === "user" ? message.content : "System message",
              responses: [
                message.role === "model"
                  ? message.content.replace(/\n\n/g, "<br/>")
                  : "Waiting for response...",
              ],
              time: new Date(
                message.timestamp || message.create_time || Date.now(),
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              currentSlide: 0,
              isTyping: false,
              isComplete: true,
              tokensUsed: message.tokensUsed || null,
              botName: message.botName || "Wrds Ai Nxt",
              files: message.files || [],
            });
          }
        });
      }

      setSmartAINxtMessageGroups([processedGroups]);
    } catch (error) {
      console.error("❌ Error loading WrdsAI Nxt history:", error);
      setSmartAINxtMessageGroups([[]]);
    } finally {
      setHistoryLoading(false);
      setTimeout(() => scrollToBottom(), 200);
    }
  };

  const fetchChatbotResponse = async (text, currentSessionId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

      const user = User || {};
    const email = user?.email;

    if (!email) {
      console.error("No user email found in localStorage");
      return {
        response: "User not logged in. Please login again.",
        sessionId: currentSessionId,
      };
    }

    const payload = {
      email,
      create_time: new Date().toISOString(),
      prompt: text,
      sessionId: currentSessionId || "",
      botName: selectedBot,
    };

    try {
      // const response = await fetch(`${apiBaseUrl}/api/ai/ask`, {
      const response = await fetch(`${apiBaseUrl}/api/ai/ask`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const rawText = await response.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { message: rawText };
      }


      // 🔹 Check for "Not enough tokens" error specifically
      if (!response.ok) {
        const errorData = data;

        // If it's a "Not enough tokens" error, return it directly
        if (
          response.status === 400 &&
          errorData.message === "Not enough tokens"
        ) {
          // Show SweetAlert but also return the error message for display
          await Swal.fire({
            title: "Not enough tokens!",
            text: "You don't have enough tokens to continue.",
            icon: "warning",
            showCancelButton: true,
            showDenyButton: false,
            confirmButtonText: "Ok",
            cancelButtonText: "Upgrade/ Renew Plan",
          }).then((result) => {
            if (result.isConfirmed) {
              // just close
            } else if (
              result.isDismissed &&
              result.dismiss === Swal.DismissReason.cancel
            ) {
              handleUpgradePlan();
            }
          });

          // 🔹 Return the actual error message instead of generic error
          return {
            response: "Not enough tokens to process your request.",
            sessionId: currentSessionId,
            botName: selectedBot,
            isError: true, // Add flag to identify this as an error response
          };
        }

        // For other errors, throw normally
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP error! status: ${response.status}`,
        );
      }

      abortControllerRef.current = null;

      console.log("API Response:", data);

      return {
        response: data.response?.replace(/\n\n/g, "<br/>") || "",
        sessionId: data.sessionId,
        remainingTokens: data.remainingTokens,
        tokensUsed: data.tokensUsed || data.usage?.total_tokens || null,
        totalTokensUsed: data.totalTokensUsed ?? null,
        botName: data.botName || selectedBot,
      };
    } catch (err) {
      if (err?.name === "AbortError") {
        console.log("Request was aborted");
        return null;
      }

      console.error("fetchChatbotResponse error:", err);

      // 🔹 Check if it's a "Not enough tokens" error from the error message
      if (err.message && err.message.includes("Not enough tokens")) {
        return {
          response: "Not enough tokens to process your request.",
          sessionId: currentSessionId,
          botName: selectedBot,
          isError: true,
        };
      }

      return {
        response: err?.message || "Sorry, something went wrong.",
        sessionId: currentSessionId,
        botName: selectedBot,
      };
    }
  };

  const getCurrentMessageType = () =>
    activeView === "wrds AiPro" || isSmartAIPro
      ? "wrds AiPro"
      : activeView === "smartAi" || isSmartAI
        ? "smart Ai"
        : activeView === "WrdsAI Nxt" || isSmartAINxt
          ? "WrdsAI Nxt"
          : "chat";

  const getMessageGroupsSetter = (messageType) =>
    messageType === "wrds AiPro"
      ? setSmartAIProMessageGroups
      : messageType === "smart Ai"
        ? setSmartAIMessageGroups
        : messageType === "WrdsAI Nxt"
          ? setSmartAINxtMessageGroups
          : setMessageGroups;

  const getCurrentStudySessionId = () => {
    if (activeView === "smartAi" || isSmartAI) {
      return selectedChatId || localStorage.getItem("lastSmartAISessionId") || "";
    }
    if (activeView === "wrds AiPro" || isSmartAIPro) {
      return selectedChatId || localStorage.getItem("lastSmartAIProSessionId") || "";
    }
    if (activeView === "WrdsAI Nxt" || isSmartAINxt) {
      return selectedChatId || localStorage.getItem("lastSmartAINxtSessionId") || "";
    }
    return selectedChatId || localStorage.getItem("lastChatSessionId") || "";
  };

  const getBotNameForMessageType = (messageType) =>
    messageType === "smart Ai"
      ? "Wrds AI"
      : messageType === "wrds AiPro"
        ? "Wrds AiPro"
        : messageType === "WrdsAI Nxt"
          ? "Wrds Ai Nxt"
          : selectedBot;

  const handleBasicsOfProblem = async (group) => {
    if (!isSelectedStudySubjectMaths || !selectedChapter || !group?.id) return;
    if (basicsUsedByAnswerId[group.id] || basicsLoadingByAnswerId[group.id]) return;

    const currentAnswer = group.responses?.[group.currentSlide] || "";
    if (!group.prompt || !currentAnswer) return;

    const user = User || {};
    if (!user?.email) {
      toast.error("Please login again");
      return;
    }

    const messageType = getCurrentMessageType();
    const setMessagesFn = getMessageGroupsSetter(messageType);
    const basicsMessageId = `basics_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    setBasicsUsedByAnswerId((prev) => ({ ...prev, [group.id]: true }));
    setBasicsLoadingByAnswerId((prev) => ({ ...prev, [group.id]: true }));

    setMessagesFn((prev) => {
      const updated = [...prev];
      const messages = updated[0] || [];
      updated[0] = [
        ...messages,
        {
          id: basicsMessageId,
          prompt: "Basics of this problem",
          responses: ["Thinking..."],
          time: currentTime(),
          currentSlide: 0,
          isTyping: true,
          isComplete: false,
          tokensUsed: null,
          botName: getBotNameForMessageType(messageType),
          files: [],
          isBasicsResponse: true,
          canShowBasicsOfProblem: false,
        },
      ];
      return updated;
    });

    try {
      const basicsPrompt = [
        "Explain the basics needed to understand this Maths problem.",
        "Do not solve the full problem.",
        "Do not give the final answer.",
        "Focus on prerequisite concepts, formulas, definitions, and what the student should identify first.",
        "Keep it student-friendly and concise.",
        "",
        `Problem asked by student:\n${group.prompt}`,
        "",
        `Previous answer/context:\n${currentAnswer.replace(/<[^>]+>/g, " ")}`,
      ].join("\n");

      const formData = new FormData();
      formData.append("prompt", basicsPrompt);
      formData.append("displayPrompt", "Basics of this problem");
      formData.append("email", user.email);
      if (messageType === "chat") {
        formData.append("botName", selectedBot);
      }
      formData.append("sessionId", getCurrentStudySessionId());
      formData.append("type", messageType);
      formData.append("isCBSEActive", isCBSEActive);
      formData.append("selectedChapter", selectedChapter);
      formData.append("selectedClassName", selectedClassName);
      formData.append("selectedSubjectName", selectedSubjectName);
      formData.append("selectedChapterName", selectedChapterMeta?.name || selectedChapter);
      formData.append("platformContext", teacherMode ? "teacher" : "student");
      formData.append("activityType", "basics_of_problem");

      const result = await fetchChatbotResponseWithFiles(
        formData,
        getCurrentStudySessionId(),
        messageType !== "chat",
      );

      setMessagesFn((prev) => {
        const updated = [...prev];
        const messages = updated[0] || [];
        const index = messages.findIndex((message) => message.id === basicsMessageId);
        if (index !== -1) {
          messages[index] = {
            ...messages[index],
            responses: [result?.response || "Sorry, something went wrong."],
            isTyping: false,
            isComplete: true,
            tokensUsed: result?.tokensUsed || 0,
            botName: getBotNameForMessageType(messageType),
            isError: Boolean(result?.isError),
          };
          updated[0] = messages;
        }
        return updated;
      });
    } catch (error) {
      setMessagesFn((prev) => {
        const updated = [...prev];
        const messages = updated[0] || [];
        const index = messages.findIndex((message) => message.id === basicsMessageId);
        if (index !== -1) {
          messages[index] = {
            ...messages[index],
            responses: [error?.message || "Sorry, something went wrong."],
            isTyping: false,
            isComplete: true,
            isError: true,
          };
          updated[0] = messages;
        }
        return updated;
      });
    } finally {
      setBasicsLoadingByAnswerId((prev) => ({ ...prev, [group.id]: false }));
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const renderBasicsButton = (group) => {
    if (
      !isSelectedStudySubjectMaths ||
      !selectedChapter ||
      !group?.id ||
      !group.canShowBasicsOfProblem ||
      group.isTyping ||
      group.isError ||
      group.isBasicsResponse
    ) {
      return null;
    }

    const isUsed = Boolean(basicsUsedByAnswerId[group.id]);
    const isLoading = Boolean(basicsLoadingByAnswerId[group.id]);

    return (
      <Button
        size="small"
        disabled={isUsed || isLoading}
        onClick={() => handleBasicsOfProblem(group)}
        sx={{
          mt: 1,
          borderRadius: "999px",
          px: 1.6,
          py: 0.55,
          fontWeight: 700,
          textTransform: "none",
          color: "#342171",
          border: "1px solid #cfc7e8",
          backgroundColor: "#f2effa",
          opacity: isUsed ? 0.45 : 1,
          "&:hover": {
            backgroundColor: "#e8e2fb",
            borderColor: "#aa9cd8",
          },
        }}
      >
        Basics of this problem
      </Button>
    );
  };

  const handleSend = async (editedPrompt = null, editedId = null) => {
    // if (( !input.trim() && selectedFiles.length === 0) || isSending)
    isStoppedRef.current = false;
    const prompt = editedPrompt ? editedPrompt.trim() : input.trim();
    if (!prompt) return;
    const lessonPlanTopic = getLessonPlanTopicFromPrompt(prompt);
    const requestPrompt =
      !editedPrompt && teacherMode && isLessonPlanMode && lessonPlanDraftRef.current
        ? [
            lessonPlanDraftRef.current,
            lessonPlanTopic
              ? [
                  "",
                  `Topic/context requested by teacher: ${lessonPlanTopic}`,
                  "Plan the lesson around this topic while staying within the selected chapter.",
                ].join("\n")
              : "",
          ].filter(Boolean).join("\n")
        : prompt;
    const displayPrompt =
      !editedPrompt && teacherMode && isLessonPlanMode
        ? prompt
        : requestPrompt;

    if (
      (activeView === "WrdsAI Nxt" || isSmartAINxt) &&
      isCBSEActive &&
      !selectedChapter
    ) {
      setChapterError("Please select any one chapter");
      toast.error("Please select any one chapter");
      return;
    }
    setChapterError("");

    setInput("");
    setSelectedFiles([]);
    setIsSending(true);
    setIsTypingResponse(true);

    const messageId =
      Date.now() + "_" + Math.random().toString(36).substr(2, 5); // always new id

    // 🧠 Choose correct session list
    const currentSessions =
      activeView === "smartAi" || isSmartAI ? smartAISessions : chats;

    // let currentSessionId = selectedChatId
    //   ? currentSessions.find((chat) => chat.id === selectedChatId)?.sessionId ||
    //     ""
    //   : "";

    let currentSessionId = "";

    if (activeView === "smartAi" || isSmartAI) {
      // 🧠 Smart AI tab → reuse the same open Smart AI session
      const existing = smartAISessions.find(
        (s) => s.id === selectedChatId || s.sessionId === selectedChatId,
      );
      currentSessionId =
        existing?.sessionId ||
        localStorage.getItem("lastSmartAISessionId") ||
        "";
    } else if (activeView === "wrds AiPro" || isSmartAIPro) {
      const existing = smartAIProSessions.find(
        (s) => s.id === selectedChatId || s.sessionId === selectedChatId,
      );
      currentSessionId =
        existing?.sessionId ||
        localStorage.getItem("lastSmartAIProSessionId") ||
        "";
    } else if (activeView === "WrdsAI Nxt" || isSmartAINxt) {
      const existing = smartAINxtSessions.find(
        (s) => s.id === selectedChatId || s.sessionId === selectedChatId,
      );
      currentSessionId =
        existing?.sessionId ||
        localStorage.getItem("lastSmartAINxtSessionId") ||
        "";
    } else {
      // 💬 Normal chat tab
      const existing = chats.find(
        (c) => c.id === selectedChatId || c.sessionId === selectedChatId,
      );
      currentSessionId =
        existing?.sessionId || localStorage.getItem("lastChatSessionId") || "";
    }

    const messageType =
      activeView === "wrds AiPro" || isSmartAIPro
        ? "wrds AiPro"
        : activeView === "smartAi" || isSmartAI
          ? "smart Ai"
          : activeView === "WrdsAI Nxt" || isSmartAINxt
            ? "WrdsAI Nxt"
            : "chat";

    // 🧠 choose correct state setter
    const setMessagesFn =
      messageType === "wrds AiPro"
        ? setSmartAIProMessageGroups
        : messageType === "smart Ai"
          ? setSmartAIMessageGroups
          : messageType === "WrdsAI Nxt"
            ? setSmartAINxtMessageGroups
            : setMessageGroups;

    setMessagesFn((prev) => {
      const updated = [...prev];
      const messages = updated[0] || [];

      const newMessage = {
        id: messageId,
        prompt:
          displayPrompt || `Files: ${selectedFiles.map((f) => f.name).join(", ")}`,
        responses: ["Thinking..."],
        time: currentTime(),
        currentSlide: 0,
        isTyping: true,
        isComplete: false,
        tokensUsed: null,
        // botName: selectedBot,
        botName:
          messageType === "smart Ai"
            ? "Wrds AI"
            : messageType === "wrds AiPro"
              ? "Wrds AiPro"
              : messageType === "WrdsAI Nxt"
                ? "Wrds Ai Nxt"
                : selectedBot,
        files: selectedFiles.map((f) => ({ name: f.name })),
        canShowBasicsOfProblem: isSelectedStudySubjectMaths && Boolean(selectedChapter),
      };

      if (editedId) {
        const index = messages.findIndex((m) => m.id === editedId);
        if (index !== -1)
          updated[0] = [
            ...messages.slice(0, index + 1),
            newMessage,
            ...messages.slice(index + 1),
          ];
        else updated[0] = [...messages, newMessage];
      } else {
        updated[0] = [...messages, newMessage];
      }

      return updated;
    });

    try {
      const formData = new FormData();
      formData.append("prompt", requestPrompt);
      formData.append("displayPrompt", displayPrompt);
      formData.append("email", user.email);
      // formData.append("botName", selectedBot);
      if (
        messageType !== "smart Ai" &&
        messageType !== "wrds AiPro" &&
        messageType !== "WrdsAI Nxt"
      )
        formData.append("botName", selectedBot);
      formData.append("sessionId", currentSessionId);
      formData.append("type", messageType);
      formData.append("isCBSEActive", isCBSEActive);
      formData.append("selectedChapter", selectedChapter);
      formData.append("selectedClassName", selectedClassName);
      formData.append("selectedSubjectName", selectedSubjectName);
      formData.append(
        "selectedChapterName",
        selectedChapterMeta?.name || selectedChapter,
      );
      formData.append("platformContext", teacherMode ? "teacher" : "student");
      formData.append(
        "activityType",
        teacherMode
          ? isLessonPlanMode
            ? "lesson_plan"
            : "teach_chat"
          : "chat",
      );

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const shouldStreamNxt =
        messageType === "WrdsAI Nxt" && selectedFiles.length === 0;

      const result = shouldStreamNxt
        ? await fetchSmartAINxtStream({
            payload: {
              prompt: requestPrompt,
              displayPrompt,
              email: user.email,
              sessionId: currentSessionId,
              type: messageType,
              isCBSEActive,
              selectedChapter,
              selectedClassName,
              selectedSubjectName,
              selectedChapterName:
                selectedChapterMeta?.name || selectedChapter,
              platformContext: teacherMode ? "teacher" : "student",
              activityType: teacherMode
                ? isLessonPlanMode
                  ? "lesson_plan"
                  : "teach_chat"
                : "chat",
            },
            currentSessionId,
            onStart: (event) => {
              if (event.sessionId) {
                setSelectedChatId(event.sessionId);
                localStorage.setItem("lastSmartAINxtSessionId", event.sessionId);
              }
            },
            onDelta: (streamedText) => {
              setMessagesFn((prev) => {
                const updated = [...prev];
                const messages = updated[0] || [];
                const index = messages.findIndex((m) => m.id === messageId);
                if (index !== -1) {
                  messages[index] = {
                    ...messages[index],
                    responses: [streamedText],
                    isTyping: true,
                    isComplete: false,
                    botName: "Wrds Ai Nxt",
                  };
                  updated[0] = messages;
                }
                return updated;
              });
            },
            onDone: (event) => {
              setMessagesFn((prev) => {
                const updated = [...prev];
                const messages = updated[0] || [];
                const index = messages.findIndex((m) => m.id === messageId);
                if (index !== -1) {
                  messages[index] = {
                    ...messages[index],
                    responses: [event.response || ""],
                    isTyping: false,
                    isComplete: true,
                    tokensUsed: event.tokensUsed || 0,
                    botName: event.botName || "Wrds Ai Nxt",
                    isError: Boolean(event.isError),
                  };
                  updated[0] = messages;
                }
                return updated;
              });
            },
          })
        : await fetchChatbotResponseWithFiles(
            formData,
            currentSessionId,
            messageType === "smart Ai" ||
              isSmartAI ||
              messageType === "wrds AiPro" ||
              isSmartAIPro ||
              messageType === "WrdsAI Nxt" ||
              isSmartAINxt,
          );

      if (!result) return;
      // 🔴 HANDLE API ERROR / RESTRICTED RESPONSE
      if (result.isError) {
        setMessagesFn((prev) => {
          const updated = [...prev];
          const messages = updated[0] || [];
          const index = messages.findIndex((m) => m.id === messageId);

          if (index !== -1) {
            messages[index] = {
              ...messages[index],
              responses: [result.response], // 👈 backend message
              isTyping: false,
              isComplete: true,
              tokensUsed: 0,
              botName:
                messageType === "smart Ai"
                  ? "Wrds AI"
                  : messageType === "wrds AiPro"
                    ? "Wrds AiPro"
                    : messageType === "WrdsAI Nxt"
                      ? "Wrds Ai Nxt"
                      : selectedBot,
              isError: true,
            };
            updated[0] = messages;
          }

          return updated;
        });

        // ⛔ VERY IMPORTANT → typing animation STOP
        setIsSending(false);
        setIsTypingResponse(false);
        scrollToBottom();
        return; // 🔥 EXIT — niche no typing code run thase j nahi
      }

      // ✅ Persist sessionId so subsequent prompts stay in the same session
      if (
        result.sessionId &&
        (!selectedChatId || selectedChatId !== result.sessionId)
      ) {
        console.log(
          "Saving sessionId to state and localStorage:",
          result.sessionId,
        );
        setSelectedChatId(result.sessionId);
        if (activeView === "smartAi" || isSmartAI) {
          localStorage.setItem("lastSmartAISessionId", result.sessionId);
        } else if (activeView === "wrds AiPro" || isSmartAIPro) {
          localStorage.setItem("lastSmartAIProSessionId", result.sessionId);
        } else if (activeView === "WrdsAI Nxt" || isSmartAINxt) {
          localStorage.setItem("lastSmartAINxtSessionId", result.sessionId);
        } else {
          localStorage.setItem("lastChatSessionId", result.sessionId);
        }
      }

      const responseText = result.response || "";
      const completedSessionId =
        result.sessionId || selectedChatId || currentSessionId;

      await persistCompletedResponse({
        messageType,
        sessionId: completedSessionId,
        prompt: displayPrompt,
        response: responseText,
        botName:
          messageType === "smart Ai"
            ? "Wrds AI"
            : messageType === "wrds AiPro"
              ? "Wrds AiPro"
              : messageType === "WrdsAI Nxt"
                ? "Wrds Ai Nxt"
                : result.botName || selectedBot,
      });

      // ✅ Typing animation effect starts here
      if (!result.isError && !result.streamed) {
        const lines = responseText.split("\n");
        let allText = "";

        const isNxt = activeView === "WrdsAI Nxt" || isSmartAINxt;
        const LINES_PER_BATCH = isNxt ? 100 : 35;
        const charBatchSize = isNxt ? 500 : 50;
        const typingDelay = isNxt ? 0 : 20;

        for (let l = 0; l < lines.length; l += LINES_PER_BATCH) {
          // if (isStoppedRef.current) break;
          if (isStoppedRef.current) {
            // ⛔ Stop pressed → save partial response
            let saveEndpoint = "";

            if (activeView === "chat") {
              saveEndpoint = `${apiBaseUrl}/api/ai/save_partial`;
            } else if (activeView === "smartAi" || isSmartAI) {
              saveEndpoint = `${apiBaseUrl}/api/ai/save_smartAi_Nxt_partial`;
            } else if (activeView === "wrds AiPro" || isSmartAIPro) {
              saveEndpoint = `${apiBaseUrl}/api/ai/save_smartAi_Nxt_partial`;
            } else if (activeView === "WrdsAI Nxt" || isSmartAINxt) {
              saveEndpoint = `${apiBaseUrl}/api/ai/save_smartAi_Nxt_partial`;
            }

            try {
              await fetch(saveEndpoint, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email,
                  sessionId: selectedChatId || currentSessionId,
                  prompt: displayPrompt,
                  partialResponse: allText + lineText,
                  // botName: selectedBot,
                  botName:
                    // messageType === "smart Ai" ? "smart Ai" : selectedBot,
                    messageType === "smart Ai"
                      ? "Wrds AI"
                      : messageType === "wrds AiPro"
                        ? "Wrds AiPro"
                        : messageType === "WrdsAI Nxt"
                          ? "Wrds Ai Nxt"
                          : selectedBot,
                }),
              });
            } catch (err) {
              console.error("Failed to save partial response:", err);
            }
            break;
          }

          const batch = lines.slice(l, l + LINES_PER_BATCH).join("\n");

          let lineText = "";
          const chars = batch.split("");

          for (let i = 0; i < chars.length; i += charBatchSize) {
            if (isStoppedRef.current) break;

            lineText += chars.slice(i, i + charBatchSize).join("");

            setMessagesFn((prev) => {
              const updated = [...prev];
              const messages = updated[0] || [];
              const index = messages.findIndex((m) => m.id === messageId);
              if (index !== -1) {
                messages[index] = {
                  ...messages[index],
                  responses: [allText + lineText],
                  isTyping: !isStoppedRef.current,
                  isComplete: false,
                  tokensUsed: result.tokensUsed || 0,
                  // botName: result.botName || selectedBot,
                  botName:
                    messageType === "smart Ai"
                      ? "Wrds AI"
                      : messageType === "wrds AiPro"
                        ? "Wrds AiPro"
                        : messageType === "WrdsAI Nxt"
                          ? "Wrds Ai Nxt"
                          : result.botName || selectedBot,
                };
                updated[0] = messages;
              }
              return updated;
            });

            await new Promise((resolve) => setTimeout(resolve, typingDelay)); // typing speed
          }

          if (isStoppedRef.current) break;

          allText += lineText + "\n";
          await new Promise((resolve) => setTimeout(resolve, 0)); // small pause between batches
        }

        // ✅ Mark complete after typing done
        // ✅ After typing completes (not stopped)
        if (!isStoppedRef.current) {
          setMessagesFn((prev) => {
            const updated = [...prev];
            const messages = updated[0] || [];
            const index = messages.findIndex((m) => m.id === messageId);
            if (index !== -1) {
              messages[index] = {
                ...messages[index],
                isTyping: false,
                isComplete: true,
                responses: [allText.trim()],
                tokensUsed: result.tokensUsed || 0,
                // botName: result.botName || selectedBot,
                botName:
                  messageType === "smart Ai"
                    ? "Wrds AI"
                    : messageType === "wrds AiPro"
                      ? "Wrds AiPro"
                      : messageType === "WrdsAI Nxt"
                        ? "WrdsAI Nxt"
                        : result.botName || selectedBot,
              };
              updated[0] = messages;
            }
            return updated;
          });
        }
      }
      // ✅ Typing animation ends

      // ✅ Always update latest state working code
      // setMessageGroups((prev) => {
      //   const updated = [...prev];
      //   const messages = updated[0] || [];
      //   const index = messages.findIndex((m) => m.id === messageId);

      //   if (index !== -1) {
      //     messages[index] = {
      //       ...messages[index],
      //       responses: [responseText],
      //       isTyping: false,
      //       isComplete: true,
      //       tokensUsed: result.tokensUsed || 0,
      //       botName: result.botName || selectedBot,
      //     };
      //     updated[0] = messages;
      //   }
      //   return updated;
      // });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
      setIsTypingResponse(false);
      scrollToBottom();

      // ✅ Only refresh sessions if user did NOT stop typing (full response)
      // if (!isStoppedRef.current) {
      //   fetchChatSessions();
      // }

      // ✅ Only call userTokenStats + get_user_session if NOT stopped
      if (!isStoppedRef.current) {
        try {
          const user = User || {};
          const email = user?.email;
          if (email) {
            // 👉 userTokenStats
            const statsRes = await fetch(`${apiBaseUrl}/userTokenStats`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });

            if (statsRes.ok) {
              const stats = await statsRes.json();
              if (typeof stats.totalTokensUsed === "number")
                setTotalTokensUsed(stats.totalTokensUsed);
              if (typeof stats.remainingTokens === "number") {
                setSessionRemainingTokens(stats.remainingTokens);
              }
            }

            // 👉 get_user_session
            // await fetchChatSessions();

            // ✅ Refresh sessions based on current type
            if (activeView === "smartAi" || isSmartAI) {
              await fetchSmartAISessions(); // 🧠 Smart AI tab
            } else if (activeView === "wrds AiPro" || isSmartAIPro) {
              await fetchSmartAIProSessions();
            } else if (activeView === "WrdsAI Nxt" || isSmartAINxt) {
              await fetchSmartAINxtSessions();
            } else {
              await fetchChatSessions(); // 💬 Chat tab
            }
          }
        } catch (err) {
          console.warn("⚠️ Failed to refresh stats after chat:", err.message);
        }
      }
    }
  };

  const fetchSmartAINxtStream = async ({
    payload,
    currentSessionId,
    onStart,
    onDelta,
    onDone,
  }) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    currentPromptRef.current = payload.prompt || "";
    partialResponseRef.current = "";

    try {
      const response = await fetch(`${apiBaseUrl}/api/ai/SmartAINxt_ask`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const rawText = await response.text();
        let data = {};
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          data = { message: rawText };
        }

        if (data?.message === "Not enough tokens") {
          await Swal.fire({
            title: "Not enough tokens!",
            text: "You don't have enough tokens to continue.",
            icon: "warning",
            showCancelButton: true,
            showDenyButton: false,
            confirmButtonText: "Ok",
            cancelButtonText: "Upgrade/ Renew Plan",
          }).then((result) => {
            if (
              result.isDismissed &&
              result.dismiss === Swal.DismissReason.cancel
            ) {
              handleUpgradePlan();
            }
          });
        }

        return {
          response:
            data.message ||
            data.error ||
            `HTTP error! status: ${response.status}`,
          sessionId: currentSessionId,
          botName: "Wrds Ai Nxt",
          isError: true,
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming is not supported by this browser.");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let streamedText = "";
      let finalResult = null;

      const handleLine = (line) => {
        if (!line.trim()) return;

        let event;
        try {
          event = JSON.parse(line);
        } catch {
          return;
        }

        if (event.type === "start") {
          onStart?.(event);
          return;
        }

        if (event.type === "delta") {
          streamedText += event.delta || "";
          partialResponseRef.current = streamedText;
          onDelta?.(streamedText);
          return;
        }

        if (event.type === "done") {
          finalResult = {
            ...event,
            response: event.response || streamedText,
            botName: event.botName || "Wrds Ai Nxt",
            streamed: true,
          };
          onDone?.(finalResult);
          return;
        }

        if (event.type === "error") {
          finalResult = {
            response: event.message || "Sorry, something went wrong.",
            sessionId: event.sessionId || currentSessionId,
            botName: "Wrds Ai Nxt",
            isError: true,
            streamed: true,
          };
          onDone?.(finalResult);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";
        lines.forEach(handleLine);
      }

      if (buffer.trim()) {
        handleLine(buffer);
      }

      abortControllerRef.current = null;

      return (
        finalResult || {
          response: streamedText,
          sessionId: currentSessionId,
          botName: "Wrds Ai Nxt",
          streamed: true,
        }
      );
    } catch (err) {
      if (err?.name === "AbortError") {
        console.log("Streaming request was aborted");
        return null;
      }

      console.error("fetchSmartAINxtStream error:", err);
      return {
        response: err.message || "Sorry, something went wrong.",
        sessionId: currentSessionId,
        botName: "Wrds Ai Nxt",
        isError: true,
      };
    }
  };

  const persistCompletedResponse = async ({
    messageType,
    sessionId,
    prompt,
    response,
    botName,
  }) => {
    if (!sessionId || !prompt || !response) return;

    const endpoint =
      messageType === "chat"
        ? `${apiBaseUrl}/api/ai/save_partial`
        : `${apiBaseUrl}/api/ai/save_smartAi_Nxt_partial`;

    try {
      const saveResponse = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          sessionId,
          prompt,
          partialResponse: response,
          botName,
          isComplete: true,
        }),
      });

      if (!saveResponse.ok) {
        const text = await saveResponse.text();
        console.warn("Completed response save failed:", text);
      }
    } catch (error) {
      console.warn("Completed response save failed:", error?.message || error);
    }
  };

  const createNewChat = () => {
    const newSessionId = generateSessionId(); // Generate a proper session ID
    const newChat = {
      // id: `temp_${Date.now()}`, // temporary ID for UI
      id: newSessionId,
      name:
        activeView === "smartAi" || isSmartAI
          ? `Smart AI ${smartAISessions?.length + 1 || 1}`
          : activeView === "wrds AiPro" || isSmartAIPro
            ? `Wrds AI Pro ${smartAIProSessions?.length + 1 || 1}`
            : activeView === "WrdsAI Nxt" || isSmartAINxt
              ? `Wrds Ai Nxt ${smartAINxtSessions?.length + 1 || 1}`
              : `Chat ${chats.length + 1}`,
      // sessionId: "", // blank session ID
      sessionId: newSessionId,
      createTime: new Date().toISOString(),
    };

    if (activeView === "smartAi" || isSmartAI) {
      // 🧠 Smart AI Chat
      setSmartAISessions((prev) => [newChat, ...prev]); // Add to Smart AI session list
      setSkipHistoryLoad(true);
      setSelectedChatId(newChat.id);
      localStorage.setItem("lastSmartAISessionId", newChat.id);
      setSmartAIMessageGroups([[]]); // Reset Smart AI message history
    } else if (activeView === "wrds AiPro" || isSmartAIPro) {
      // 🧠 Smart AI Chat
      setSmartAIProSessions((prev) => [newChat, ...prev]); // Add to Smart AI session list
      setSkipHistoryLoad(true);
      setSelectedChatId(newChat.id);
      localStorage.setItem("lastSmartAIProSessionId", newChat.id);
      setSmartAIProMessageGroups([[]]); // Reset Smart AI message history
    } else if (activeView === "WrdsAI Nxt" || isSmartAINxt) {
      setSmartAINxtSessions((prev) => [newChat, ...prev]);
      setSkipHistoryLoad(true);
      setSelectedChatId(newChat.id);
      localStorage.setItem("lastSmartAINxtSessionId", newChat.id);
      setSmartAINxtMessageGroups([[]]);
    } else {
      // 💬 Normal Chat
      setChats((prev) => [newChat, ...prev]); // Add to chat list
      setSkipHistoryLoad(true);
      setSelectedChatId(newChat.id);
      localStorage.setItem("lastChatSessionId", newChat.id);
      setMessageGroups([[]]); // Reset normal chat messages
    }

    // setChats((prev) => [newChat, ...prev]);
    // setSkipHistoryLoad(true); // prevent history load
    // setSelectedChatId(newChat.id);
    // localStorage.setItem("lastChatSessionId", newChat.id);
    // setMessageGroups([[]]); // reset messages
  };

  function formatChatTime(date) {
    const now = new Date();
    const timeOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    const timeStr = date.toLocaleTimeString("en-US", timeOptions);

    if (date.toDateString() === now.toDateString()) {
      return `Today  ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday  ${timeStr}`;
    }

    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (diffInDays <= 7) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return `${dayName}, ${dateStr},  ${timeStr}`;
    }

    const fullDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return `${fullDate},  ${timeStr}`;
  }

  useEffect(() => {
    if (!User?.email) return;

    if (activeView === "smartAi" || isSmartAI) {
      fetchSmartAISessions();
    } else if (activeView === "wrds AiPro" || isSmartAIPro) {
      fetchSmartAIProSessions();
    } else if (activeView === "WrdsAI Nxt" || isSmartAINxt) {
      fetchSmartAINxtSessions();
    } else {
      fetchChatSessions();
    }
  }, [User?.email, activeView, isSmartAI, isSmartAIPro, isSmartAINxt]);

  const filteredChats = (
    activeView === "smartAi" || isSmartAI
      ? smartAISessions
      : activeView === "wrds AiPro" || isSmartAIPro
        ? smartAIProSessions
        : activeView === "WrdsAI Nxt" || isSmartAINxt
          ? smartAINxtSessions
          : chats
  ).filter((chat) =>
    chat?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  console.log("Filtered Chats::::::::::", chats);
  console.log("Filtered smart Ai::::::::::", smartAISessions);

  // const filteredChats = (
  //   activeView === "smartAi" || isSmartAI
  //     ? smartAISessions?.filter((s) => s.type?.toLowerCase() === "smart Ai")
  //     : chats?.filter((s) => s.type?.toLowerCase() === "chat")
  // ).filter((chat) =>
  //   chat?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  console.log("Filtered Chats::::::::::", chats);
  console.log("Filtered smart Ai::::::::::", smartAISessions);

  // const filteredChats = (
  //   activeView === "smartAi" || isSmartAI
  //     ? smartAISessions?.filter((s) => s.type?.toLowerCase() === "smart Ai")
  //     : chats?.filter((s) => s.type?.toLowerCase() === "chat")
  // ).filter((chat) =>
  //   chat?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  // const handleRedirect = () => {
  //   window.open(
  //     "https://mail.google.com/mail/?view=cm&fs=1&to=support@wrdsai.com"
  //     // "https://mail.google.com/mail/?view=cm&fs=1&to=krushil.prolink@gmail.com"
  //   );
  // };
  // const handleRedirect = () => {
  //   window.location.href =
  //     "https://mail.google.com/mail/?view=cm&fs=1&to=support@wrdsai.com";
  // };
  const handleRedirect = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // ✅ Mobile → Mail app / Gmail app
      window.location.href = "mailto:support@wrdsai.com";
    } else {
      // ✅ Desktop → Gmail web compose
      window.location.href =
        "https://mail.google.com/mail/?view=cm&fs=1&to=support@wrdsai.com";
    }
  };

  const bots = [
    { label: "GPT-5 Nano", value: GPT_NANO_BOT },
    { label: "Grok", value: "grok" },
    { label: "Mistral", value: "mistral" },
  ];

  const isWrdsAI =
    User?.subscription?.subscriptionPlan === "WrdsAI" ||
    User?.subscriptionPlan === "WrdsAI";
  const isWrdsAIPro =
    User?.subscription?.subscriptionPlan === "WrdsAIPro" ||
    User?.subscriptionPlan === "WrdsAIPro";
  const isWrdsAINxt =
    User?.subscription?.subscriptionPlan?.toLowerCase() === "wrdsai nxt" ||
    User?.subscriptionPlan?.toLowerCase() === "wrdsai nxt";
  const isFreeTrial =
    User?.subscription?.subscriptionPlan === "Free Trial" ||
    User?.subscriptionPlan === "Free Trial";

  // const finalBots = isWrdsAIPro
  //   ? [...bots, { label: "Gemini", value: "gemini" }]
  //   : bots;

  const finalBots = isWrdsAIPro
    ? [
        { label: "WrdsAI Pro", value: "wrds-ai-pro" }, // ✅ ONLY PRO
        ...bots,
        { label: "Gemini", value: "gemini" }, // ✅ ONLY PRO
      ]
    : [
        { label: "WrdsAI", value: "wrds-ai" }, // ✅ ONLY FREE / NON-PRO
        ...bots,
      ];

  return (
    <Box
      sx={{
        // display: "flex",
        height: "100vh",
        // position: "relative",
        overflowY: "auto",
        overflowX: "hidden",
        // width: "100vw", // 🔹 Add this line
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: isSmallScreen ? "column" : "row",
          alignItems: isSmallScreen ? "flex-start" : "center",
          justifyContent: "space-between",
          ml: 0,
          px: { xs: 1, sm: 2, md: 2, lg: 2 },
          flexShrink: 0,
          background:
            "linear-gradient(135deg, #a65bff 0%, #7458ff 46%, #28a9ff 100%)",
          zIndex: 100,
          // width: isXS ? "100%" : "100%",
          width: { xs: "97%", sm: "97%", md: "99%", lg: "99%" },
          // pr:2,
          position: "fixed",
          // position: isXS ? "fixed" : "sticky",
          top: 0,
          height: isXS ? "70px" : { sm: "71px", md: "84px", lg: "86px" },
          // isSmallScreen ? "63px" : { sm: "84px", lg: "85px" },
          minHeight: isXS ? "60px" : "auto",
          boxShadow: "0 14px 34px rgba(43, 24, 104, 0.28)",
          py: isSmallScreen ? 1 : 0,
        }}
      >
        {isXS && (
          <>
            {/* First Row - Logo + Dropdown + Hamburger Menu */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                mb: 0,
                height: "100vh",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  // justifyContent: "space-between",
                  alignItems: "center",
                  // width: "100%",
                }}
              >
                <MenuIcon
                  sx={{
                    fontSize: 28,
                    color: "#fff",
                    cursor: "pointer",
                    mr: "-10px",
                  }}
                  onClick={() => setOpenSidebar(true)}
                />

                {/* Logo */}
                <img src={Wrds1} alt="Logo" style={{ width: 220, height: "auto", display: "block" }} />
              </Box>

              {/* DROPDOWN MOVED HERE ONLY FOR XS */}
              {/* <Box sx={{ width: "28%" }}>
                {activeView === "chat" && (
                  <Select
                    labelId="bot-select-label"
                    value={selectedBot}
                    onChange={(e) => setSelectedBot(e.target.value)}
                    sx={{
                      bgcolor: "#fff",
                      borderRadius: "5px",
                      height: "27px",
                      width: "100%",
                      "& .MuiSelect-select": {
                        fontSize: "13px",
                        fontFamily: "Calibri, sans-serif",
                        py: 0.5,
                      },
                    }}
                  >
                    <MenuItem
                      value={GPT_NANO_BOT}
                      sx={{
                        fontSize: "15px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      GPT-5 Nano
                    </MenuItem>
                    <MenuItem
                      value="claude-3-haiku"
                      sx={{
                        fontSize: "15px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      Claude
                    </MenuItem>
                    <MenuItem
                      value="grok"
                      sx={{
                        fontSize: "15px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      Grok
                    </MenuItem>
                    <MenuItem
                      value="mistral"
                      sx={{
                        fontSize: "15px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      Mistral
                    </MenuItem>
                  </Select>
                )}

                {activeView === "search2" && (
                  <Select
                    value={grokcustomValue}
                    onChange={async (e) => {
                      const selected = e.target.value;
                      setGrokCustomValue(selected);
                      setSelectedGrokQuery(selected);
                      await handleSearch(selected);
                    }}
                    displayEmpty
                    IconComponent={() => null}
                    sx={{
                      bgcolor: "#fff",
                      borderRadius: "5px",
                      width: "100%",
                      height: "27px",
                      "& .MuiSelect-select": {
                        pl: 1.5,
                        fontSize: "13px",
                      },
                    }}
                  >
                    <MenuItem
                      value=""
                      disabled
                      sx={{
                        fontSize: "13px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      AI History
                    </MenuItem>

                    {historyLoading ? (
                      <MenuItem disabled sx={{ fontSize: "13px" }}>
                        Loading...
                      </MenuItem>
                    ) : grokhistoryList.length > 0 ? (
                      grokhistoryList.map((query, idx) => (
                        <MenuItem
                          key={idx}
                          value={query}
                          sx={{
                            fontSize: "13px",
                            fontFamily: "Calibri, sans-serif",
                            fontWeight: 400,
                          }}
                        >
                          {query}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled sx={{ fontSize: "13px" }}>
                        No history found
                      </MenuItem>
                    )}
                  </Select>
                )}
              </Box> */}

              {/* Hamburger Menu */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  cursor: "pointer",
                }}
                onClick={(event) => setMobileMenuAnchor(event.currentTarget)}
              >
                <Typography
                  sx={{
                    color: "#fff",
                    fontSize: "21px",
                    fontFamily: "Calibri, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {/* {User.firstName && User.lastName
                    ? `${User.firstName} ${User.lastName}`
                    : "User"} */}
                  {displayName}
                </Typography>

                <PersonRoundedIcon sx={{ fontSize: 29, color: "#fff" }} />
                {/* <MenuIcon sx={{ fontSize: 28, color: "#fff" }} /> */}
              </Box>
            </Box>

            {/* Second Row unchanged (new chat, buttons, tabs) */}
            {/* <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 1.5,
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ width: "28%", mb: 0, mt: "6px" }}>
                {activeView === "chat" && (
                  <Select
                    labelId="bot-select-label"
                    value={selectedBot}
                    onChange={(e) => setSelectedBot(e.target.value)}
                    sx={{
                      bgcolor: "#fff",
                      borderRadius: "5px",
                      height: "27px",
                      width: "100%",
                      "& .MuiSelect-select": {
                        fontSize: "13px",
                        fontFamily: "Calibri, sans-serif",
                        py: 0.5,
                      },
                    }}
                  >
                    <MenuItem
                      value={GPT_NANO_BOT}
                      sx={{
                        fontSize: "15px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      GPT-5 Nano
                    </MenuItem>
                    <MenuItem
                      value="claude-3-haiku"
                      sx={{
                        fontSize: "15px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      Claude
                    </MenuItem>
                    <MenuItem
                      value="grok"
                      sx={{
                        fontSize: "15px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      Grok
                    </MenuItem>
                    <MenuItem
                      value="mistral"
                      sx={{
                        fontSize: "15px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      Mistral
                    </MenuItem>
                  </Select>
                )}

                {activeView === "search2" && (
                  <Select
                    value={grokcustomValue}
                    onChange={async (e) => {
                      const selected = e.target.value;
                      setGrokCustomValue(selected);
                      setSelectedGrokQuery(selected);
                      await handleSearch(selected);
                    }}
                    displayEmpty
                    IconComponent={() => null}
                    sx={{
                      bgcolor: "#fff",
                      borderRadius: "5px",
                      width: "100%",
                      height: "27px",
                      "& .MuiSelect-select": {
                        pl: 1.5,
                        fontSize: "13px",
                      },
                    }}
                  >
                    <MenuItem
                      value=""
                      disabled
                      sx={{
                        fontSize: "13px",
                        fontFamily: "Calibri, sans-serif",
                      }}
                    >
                      AI History
                    </MenuItem>

                    {historyLoading ? (
                      <MenuItem disabled sx={{ fontSize: "13px" }}>
                        Loading...
                      </MenuItem>
                    ) : grokhistoryList.length > 0 ? (
                      grokhistoryList.map((query, idx) => (
                        <MenuItem
                          key={idx}
                          value={query}
                          sx={{
                            fontSize: "13px",
                            fontFamily: "Calibri, sans-serif",
                            fontWeight: 400,
                          }}
                        >
                          {query}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled sx={{ fontSize: "13px" }}>
                        No history found
                      </MenuItem>
                    )}
                  </Select>
                )}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: "8px", sm: 3 },
                  alignItems: "center",
                  justifyContent: "end",
                }}
              >
                <CustomTooltip title="New Chat" placement="bottom">
                  <Box
                    onClick={() => {
                      createNewChat();
                      setMobileMenuAnchor(null);
                    }}
                    sx={{
                      cursor: "pointer",
                      height: "37px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      pb: "0px",
                      mt: "5.2px",
                    }}
                  >
                    <EditIcon sx={{ color: "white", width: 18, height: 18 }} />
                  
                  </Box>
                </CustomTooltip>

                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.4,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAI(false);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "15px" },
                      fontFamily: "Calibri, sans-serif",
                      fontWeight: activeView === "smartAi" ? 600 : 400,
                      color:
                        activeView === "smartAi"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    WrdsAI
                  </Typography>

                  {activeView === "smartAi" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: { xs: -5, sm: -4 },
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>


                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.7,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAIPro(false);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "14px" },
                      fontFamily: "Calibri, sans-serif",
                      fontWeight: activeView === "wrds AiPro" ? 600 : 400,
                      color:
                        activeView === "wrds AiPro"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    WrdsAI Pro
                  </Typography>

                  {activeView === "wrds AiPro" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: { xs: -5, sm: -4 },
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.7,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAINxt(false);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "14px" },
                      fontFamily: "Calibri, sans-serif",
                      fontWeight: activeView === "WrdsAI Nxt" ? 600 : 400,
                      color:
                        activeView === "WrdsAI Nxt"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    WrdsAI Nxt
                  </Typography>

                  {activeView === "WrdsAI Nxt" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: { xs: -5, sm: -4 },
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.4,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAI(false);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "15px" },
                      fontFamily: "Calibri, sans-serif",
                      fontWeight:
                        activeView === "chat" ||
                          activeView === "smartAi" ||
                          activeView === "wrds AiPro"
                          ? 600
                          : 400,
                      color:
                        activeView === "chat"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    Chat
                  </Typography>
                  {activeView === "chat" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: { xs: -5, sm: -4 },
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>

                <CustomTooltip title="AI Browsing" placement="bottom">
                  <Box
                    sx={{
                      cursor: "pointer",
                      position: "relative",
                      pb: "0px",
                      mt: 0.4,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => setActiveView("search2")}
                  >
                    <LanguageIcon
                      sx={{
                        fontSize: "20px", // Icon size similar to 15px text
                        color:
                          activeView === "search2"
                            ? "#fff"
                            : "rgba(255,255,255,0.8)",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: "#fff",
                        },
                      }}
                    />

                    {activeView === "search2" && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: { xs: -7, sm: -4 },
                          left: 0,
                          width: "100%",
                          height: "3px",
                          backgroundColor: "#fff",
                          borderRadius: "2px",
                        }}
                      />
                    )}
                  </Box>
                </CustomTooltip>
              </Box>
            </Box> */}
          </>
        )}

        {/* Mobile Layout */}
        {isSmallScreen && !isXS && (
          <>
            {/* First Row - Logo and Hamburger Menu */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                height: "100vh",
                mb: 1,
                mt: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  // justifyContent: "space-between",
                  alignItems: "center",
                  // width: "100%",
                  gap: 0,
                }}
              >
                <MenuIcon
                  sx={{
                    fontSize: 28,
                    color: "#fff",
                    cursor: "pointer",
                    mr: "-9px",
                  }}
                  onClick={() => setOpenSidebar(true)}
                />

                {/* Logo */}
                <img src={Wrds1} alt="Logo" style={{ width: 220, height: "auto", display: "block" }} />
              </Box>

              {/* Hamburger Menu */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                }}
                onClick={(event) => setMobileMenuAnchor(event.currentTarget)}
              >
                <Typography
                  sx={{
                    color: "#fff",
                    fontSize: "21px",
                    fontFamily: "Calibri, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {/* {User.firstName && User.lastName
                    ? `${User.firstName} ${User.lastName}`
                    : "User"} */}
                  {displayName}
                </Typography>

                <PersonRoundedIcon
                  sx={{
                    fontSize: 29,
                    color: "#fff",
                  }}
                />
                {/* <MenuIcon sx={{ fontSize: 28, color: "#fff" }} /> */}
              </Box>
            </Box>

            {/* Second Row - Dropdowns based on active view */}
            {/* <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 1,
                justifyContent: "space-between",
              }}
            >
              {activeView === "chat" && (
                <Select
                  labelId="bot-select-label"
                  value={selectedBot}
                  onChange={(e) => setSelectedBot(e.target.value)}
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: "5px",
                    height: "32px",
                   
                    width: { xs: "60%", sm: "16%" },
                    "& .MuiSelect-select": {
                      fontSize: "16px",
                      fontFamily: "Calibri, sans-serif",
                      py: 0.5,
                    },
                  }}
                >
                  <MenuItem
                    value={GPT_NANO_BOT}
                    sx={{ fontSize: "16px", fontFamily: "Calibri, sans-serif" }}
                  >
                    GPT-5 Nano
                  </MenuItem>
                  <MenuItem
                    value="claude-3-haiku"
                    sx={{ fontSize: "16px", fontFamily: "Calibri, sans-serif" }}
                  >
                    Claude
                  </MenuItem>
                  <MenuItem
                    value="grok"
                    sx={{ fontSize: "16px", fontFamily: "Calibri, sans-serif" }}
                  >
                    Grok
                  </MenuItem>
                  <MenuItem
                    value="mistral"
                    sx={{ fontSize: "16px", fontFamily: "Calibri, sans-serif" }}
                  >
                    Mistral
                  </MenuItem>
                </Select>
              )}

              {activeView === "search2" && (
                <Select
                  value={grokcustomValue}
                  onChange={async (e) => {
                    const selected = e.target.value;
                    setGrokCustomValue(selected);
                    setSelectedGrokQuery(selected);
                    await handleSearch(selected);
                  }}
                  displayEmpty
                  IconComponent={() => null}
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: "5px",
                    // width: "100%",
                    mr: "222px",
                    width: { xs: "60%", sm: "19%" },
                    height: "32px",
                    "& .MuiSelect-select": {
                      pl: 1.5,
                      fontSize: "13px",
                    },
                  }}
                >
                  <MenuItem
                    value=""
                    disabled
                    sx={{ fontSize: "13px", fontFamily: "Calibri, sans-serif" }}
                  >
                    AI History
                  </MenuItem>
                  {historyLoading ? (
                    <MenuItem disabled sx={{ fontSize: "13px" }}>
                      Loading...
                    </MenuItem>
                  ) : grokhistoryList.length > 0 ? (
                    grokhistoryList.map((query, idx) => (
                      <MenuItem
                        key={idx}
                        value={query}
                        sx={{
                          fontSize: "13px",
                          fontFamily: "Calibri, sans-serif",
                          fontWeight: 400,
                        }}
                      >
                        {query}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled sx={{ fontSize: "13px" }}>
                      No history found
                    </MenuItem>
                  )}
                </Select>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 1, sm: 3 },
                  alignItems: "center",
                  justifyContent: "end",
                  width: "100%",
                }}
              >
                <CustomTooltip title="New Chat" placement="bottom">
                  <Box
                    onClick={() => {
                      createNewChat();
                      setMobileMenuAnchor(null);
                    }}
                    sx={{
                      cursor: "pointer",
                      // width: { xs: "117px", sm: "129px" },
                      height: "37px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mt: "4.2px",
                    }}
                  >
                    <EditIcon sx={{ color: "white", width: 18, height: 18 }} />
                   
                  </Box>
                </CustomTooltip>

               
                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.4,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAI(false);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "15px", sm: "18px" },
                      fontFamily: "Calibri, sans-serif",
                      fontWeight: activeView === "smartAi" ? 600 : 400,
                      color:
                        activeView === "smartAi"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    WrdsAI
                  </Typography>

                  {activeView === "smartAi" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: { xs: -5, sm: -4 },
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>

               

                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.4,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAIPro(false);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "15px", sm: "18px" },
                      fontFamily: "Calibri, sans-serif",
                      fontWeight: activeView === "wrds AiPro" ? 600 : 400,
                      color:
                        activeView === "wrds AiPro"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    WrdsAI Pro
                  </Typography>

                  {activeView === "wrds AiPro" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: { xs: -5, sm: -4 },
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.4,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAI(false);
                    setIsSmartAIPro(false);
                    // ✅ Sync APIs
                    fetchChatSessions();
                    
                    const lastSessionId = localStorage.getItem("lastChatSessionId");
                    if (lastSessionId) {
                      setSelectedChatId(lastSessionId);
                      loadChatHistory(lastSessionId);
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "15px", sm: "18px" },
                      fontFamily: "Calibri, sans-serif",
                      fontWeight:
                        activeView === "chat" ||
                          activeView === "smartAi" ||
                          activeView === "wrds AiPro"
                          ? 600
                          : 400,
                      color:
                        activeView === "chat"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    Chat
                  </Typography>
                  {activeView === "chat" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: { xs: -5, sm: -4 },
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>

               
                <CustomTooltip title="AI Browsing" placement="bottom">
                  <Box
                    sx={{
                      cursor: "pointer",
                      position: "relative",
                      pb: "0px",
                      mt: 0.4,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => setActiveView("search2")}
                  >
                    <LanguageIcon
                      sx={{
                        fontSize: { xs: "18px", sm: "25px" }, // icon responsive sizing
                        color:
                          activeView === "search2"
                            ? "#fff"
                            : "rgba(255,255,255,0.8)",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: "#fff",
                        },
                      }}
                    />

                    {activeView === "search2" && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: { xs: -5, sm: -10 },
                          left: 0,
                          width: "100%",
                          height: "3px",
                          backgroundColor: "#fff",
                          borderRadius: "2px",
                        }}
                      />
                    )}
                  </Box>
                </CustomTooltip>
              </Box>
            </Box> */}
          </>
        )}

        {/* Desktop Layout */}
        {!isSmallScreen && (
          <>
            {/* Left Section - Logo and AI Components */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
              {/* Logo */}

              <MenuIcon
                sx={{
                  fontSize: 28,
                  color: "#fff",
                  cursor: "pointer",
                  mr: "-11px",
                }}
                onClick={() => setOpenSidebar(true)}
              />

              <img src={Wrds1} alt="Logo" style={{ width: 220, height: "auto", display: "block" }} />
              {/* <img src={Wrds} height={48} width={135} alt="Logo" /> */}

              {/* Wrds AI Components - Only show for chat/smartAi views */}
              {/* {(activeView === "chat" || activeView === "smartAi") && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {activeView === "chat" && (
                    <Select
                      labelId="bot-select-label"
                      value={selectedBot}
                      onChange={(e) => setSelectedBot(e.target.value)}
                      sx={{
                        bgcolor: "#fff",
                        borderRadius: "5px",
                        height: "36px",
                        width: "125px",
                        "& .MuiSelect-select": {
                          fontSize: "18px",
                          fontFamily: "Calibri, sans-serif",
                          py: 1,
                        },
                      }}
                    >
                      <MenuItem
                        value={GPT_NANO_BOT}
                        sx={{
                          fontSize: "18px",
                          fontFamily: "Calibri, sans-serif",
                        }}
                      >
                        GPT-5 Nano
                      </MenuItem>
                      <MenuItem
                        value="claude-3-haiku"
                        sx={{
                          fontSize: "18px",
                          fontFamily: "Calibri, sans-serif",
                        }}
                      >
                        Claude
                      </MenuItem>
                      <MenuItem
                        value="grok"
                        sx={{
                          fontSize: "18px",
                          fontFamily: "Calibri, sans-serif",
                        }}
                      >
                        Grok
                      </MenuItem>
                      <MenuItem
                        value="mistral"
                        sx={{
                          fontSize: "18px",
                          fontFamily: "Calibri, sans-serif",
                        }}
                      >
                        Mistral
                      </MenuItem>
                    </Select>
                  )}
                </Box>
              )} */}

              {/* AI History for Browsing View */}
              {activeView === "search2" && (
                <Select
                  value={grokcustomValue}
                  onChange={async (e) => {
                    const selected = e.target.value;
                    setGrokCustomValue(selected);
                    setSelectedGrokQuery(selected);
                    await handleSearch(selected);
                  }}
                  displayEmpty
                  IconComponent={() => null}
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: "5px",
                    width: "175px",
                    height: "36px",
                    "& .MuiSelect-select": {
                      pl: 1.5,
                      fontSize: "16px",
                    },
                  }}
                >
                  <MenuItem
                    value=""
                    disabled
                    sx={{ fontSize: "16px", fontFamily: "Calibri, sans-serif" }}
                  >
                    AI History
                  </MenuItem>
                  {historyLoading ? (
                    <MenuItem disabled sx={{ fontSize: "16px" }}>
                      Loading...
                    </MenuItem>
                  ) : grokhistoryList.length > 0 ? (
                    grokhistoryList.map((query, idx) => (
                      <MenuItem
                        key={idx}
                        value={query}
                        sx={{
                          fontSize: "16px",
                          fontFamily: "Calibri, sans-serif",
                          fontWeight: 400,
                        }}
                      >
                        {query}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled sx={{ fontSize: "16px" }}>
                      No history found
                    </MenuItem>
                  )}
                </Select>
              )}
            </Box>

            {/* Right Section - User Menu */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              {/* Navigation Tabs - Show on md and lg screens */}

              {/* <Box
                sx={{
                  display: "flex",
                  marginLeft: "30px",
                  gap: 2.5,
                  alignItems: "center",
                }}
              >
                <CustomTooltip title="New Chat" placement="bottom">
                  <Box
                    onClick={() => {
                      createNewChat();
                      setMobileMenuAnchor(null);
                    }}
                    sx={{
                      cursor: "pointer",
                      // width: { md: "117px", lg: "129px" },
                      height: "37px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mt: "4.2px",
                    }}
                  >
                    <EditIcon sx={{ color: "white", width: 18, height: 18 }} />
                 
                  </Box>
                </CustomTooltip>

           
                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.4,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAI(false);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: "19px",
                      fontFamily: "Calibri, sans-serif",
                      fontWeight: activeView === "smartAi" ? 600 : 400,
                      color:
                        activeView === "smartAi"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    WrdsAI
                  </Typography>

                  {activeView === "smartAi" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: -10,
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>

              

                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.4,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAIPro(false);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: "19px",
                      fontFamily: "Calibri, sans-serif",
                      fontWeight: activeView === "wrds AiPro" ? 600 : 400,
                      color:
                        activeView === "wrds AiPro"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    WrdsAI Pro
                  </Typography>

                  {activeView === "wrds AiPro" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: -10,
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    cursor: "pointer",
                    position: "relative",
                    pb: "0px",
                    mt: 0.4,
                  }}
                  onClick={() => {
                    setActiveView("WrdsAI Nxt");
                    setIsSmartAI(false);
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: "19px",
                      fontFamily: "Calibri, sans-serif",
                      fontWeight:
                        activeView === "chat" ||
                          activeView === "smartAi" ||
                          activeView === "wrds AiPro"
                          ? 600
                          : 400,
                      color:
                        activeView === "chat"
                          ? "#fff"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.3s ease",
                      "&:hover": {
                        color: "#fff",
                      },
                    }}
                  >
                    Chat
                  </Typography>
                  {activeView === "chat" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: -10,
                        left: 0,
                        width: "100%",
                        height: "3px",
                        backgroundColor: "#fff",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Box>

                <CustomTooltip title="AI Browsing" placement="bottom">
                  <Box
                    sx={{
                      cursor: "pointer",
                      position: "relative",
                      pb: "0px",
                      mt: 0.4,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => setActiveView("search2")}
                  >
                    <LanguageIcon
                      sx={{
                        fontSize: "26px",
                        color:
                          activeView === "search2"
                            ? "#fff"
                            : "rgba(255,255,255,0.8)",
                        transition: "color 0.3s ease",
                        "&:hover": {
                          color: "#fff",
                        },
                      }}
                    />

                    {activeView === "search2" && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -10,
                          left: 0,
                          width: "100%",
                          height: "3px",
                          backgroundColor: "#fff",
                          borderRadius: "2px",
                        }}
                      />
                    )}
                  </Box>
                </CustomTooltip>
              </Box> */}

              {/* User Menu */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                }}
                onClick={(event) => setMobileMenuAnchor(event.currentTarget)}
              >
                <Typography
                  sx={{
                    color: "#fff",
                    fontSize: "21px",
                    fontFamily: "Calibri, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {/* {User.firstName && User.lastName
                    ? `${User.firstName} ${User.lastName}`
                    : "User"} */}
                  {/* {User.firstName && User.lastName
                    ? `${
                        User.firstName[0].toUpperCase() +
                        User.firstName.slice(1)
                      } ${
                        User.lastName[0].toUpperCase() + User.lastName.slice(1)
                      }`
                    : "User"} */}
                  {displayName}
                </Typography>

                <PersonRoundedIcon
                  sx={{
                    fontSize: 35,
                    color: "#fff",
                  }}
                />
                {/* <MenuIcon sx={{ fontSize: 28, color: "#fff" }} /> */}
              </Box>
            </Box>
          </>
        )}

        {/* <img src={Msg_logo1} height={56} width={110} alt="Logo" /> */}

        {/* Mobile Menu with Searchable Session List - Removed Chat, Browsing and Wrds AI options */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={() => {
            setMobileMenuAnchor(null);
            setSearchSessionResults([]);
            setShowSessionPanel(false); // Close panel when menu closes
          }}
          PaperProps={{
            sx: {
              width: 320,
              borderRadius: 2,
              p: 1,
              maxHeight: "80vh",
            },
          }}
        >
          {/* New Chat Button - At the top for all views */}
          {/* <MenuItem
            onClick={() => {
              createNewChat();
              setMobileMenuAnchor(null);
              setSearchSessionResults([]);
              setShowSessionPanel(false);
            }}
            sx={{
              borderRadius: 1,
              mb: 1,
              backgroundColor: "#1976d2",
              color: "white",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
            }}
          >
            <AddIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography sx={{ fontSize: "16px", fontWeight: 600 }}>
              New Chat
            </Typography>
          </MenuItem> */}

          {/* CHATS TITLE (toggle button) */}
          {/* <MenuItem
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
                fontSize: "18px",
                fontWeight: 600,
                fontFamily: "Calibri, sans-serif",
              }}
            >
              Session History
            </Typography>
            <KeyboardArrowDownIcon
              sx={{
                transform: showSessionPanel ? "rotate(180deg)" : "rotate(0deg)",
                transition: "0.2s",
              }}
            />
          </MenuItem>

          {/* SESSION PANEL (Search + List) */}
          {/* {showSessionPanel &&
            (activeView === "chat" ||
              activeView === "smartAi" ||
              activeView === "wrds AiPro") && (
              <>
                <Box sx={{ p: 1, pb: 0, pt: 0 }}>
                  <TextField
                    placeholder="Search sessions..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase().trim();
                      if (searchTerm === "") {
                        setSearchSessionResults([]);
                      } else {
                        // Filter sessions based on search term
                        const filtered = filteredChats.filter((chat) =>
                          chat.name.toLowerCase().includes(searchTerm)
                        );
                        setSearchSessionResults(filtered);
                      }
                    }}
                    sx={{
                      mb: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ maxHeight: "200px", overflow: "auto", mb: 1 }}>
                  {sessionLoading ? (
                    <Box sx={{ p: 2 }}>
                      {[...Array(3)].map((_, i) => (
                        <Skeleton
                          key={i}
                          sx={{ width: "100%", mb: 1, height: "40px" }}
                        />
                      ))}
                    </Box>
                  ) : (searchSessionResults.length > 0
                      ? searchSessionResults
                      : filteredChats
                    ).length > 0 ? (
                    (searchSessionResults.length > 0
                      ? searchSessionResults
                      : filteredChats
                    ).map((chat) => (
                      <MenuItem
                        key={chat.id}
                        onClick={() => {
                          if (chat && chat.id) {
                            setSelectedChatId(chat.id);
                            // localStorage.setItem("lastChatSessionId", chat.id);
                            // loadChatHistory(chat.sessionId);
                            // --- CHAT VIEW ---
                            if (activeView === "chat") {
                              localStorage.setItem(
                                "lastChatSessionId",
                                chat.id
                              );
                              loadChatHistory(chat.sessionId);
                            }

                            // --- SMART AI VIEW ---
                            else if (activeView === "smartAi" || isSmartAI) {
                              localStorage.setItem(
                                "lastSmartAISessionId",
                                chat.id
                              );
                              loadSmartAIHistory(chat.sessionId);
                            }

                            // --- SMART AI PRO VIEW ---
                            else if (
                              activeView === "wrds AiPro" ||
                              isSmartAIPro
                            ) {
                              localStorage.setItem(
                                "lastSmartAIProSessionId",
                                chat.id
                              );
                              loadSmartAIProHistory(chat.sessionId);
                            }

                            // --- SMART AI NXT VIEW ---
                            else if (
                              activeView === "WrdsAI Nxt" ||
                              isSmartAINxt
                            ) {
                              localStorage.setItem(
                                "lastSmartAINxtSessionId",
                                chat.id
                              );
                              loadSmartAINxtHistory(chat.sessionId);
                            }

                            setMobileMenuAnchor(null);
                            setSearchSessionResults([]);
                            setShowSessionPanel(false);
                          }
                        }}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          backgroundColor:
                            selectedChatId === chat.id
                              ? "#f0f0f0"
                              : "transparent",
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
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
                              char.toUpperCase()
                            )}
                          </Typography>
                          <Typography
                            variant="body2"
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
                  ) : (
                    <Typography
                      sx={{
                        p: 2,
                        textAlign: "center",
                        color: "gray",
                        fontSize: "14px",
                      }}
                    >
                      {searchSessionResults.length === 0 &&
                      filteredChats.length === 0
                        ? "No sessions available"
                        : "No matching sessions found"}
                    </Typography>
                  )}
                </Box>
                <Divider sx={{ my: 1 }} />
              </>
            )} */}

          {/* User Actions */}
          {/* <MenuItem
            onClick={() => {
              setActiveView("allUserData");
              setMobileMenuAnchor(null);
              setSearchSessionResults([]);
              setShowSessionPanel(false);
            }}
          >
            <ManageAccountsIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography sx={{ fontSize: "16px", fontWeight: 600 }}>
              All User Data
            </Typography>
          </MenuItem> */}

          <MenuItem
            onClick={() => {
              setMobileMenuAnchor(null);
              setOpenProfile(true);
              setSearchSessionResults([]);
              setShowSessionPanel(false);
            }}
          >
            <PersonRoundedIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography
              sx={{ fontSize: "17px", fontFamily: "Calibri, sans-serif" }}
            >
              Profile
            </Typography>
          </MenuItem>

          {/* {User?.email === "m.shafeeq@wrdsai.com" && ( */}
          {User?.email === "hiraparameeral@gmail.com" && (
            <MenuItem
              onClick={() => {
                setActiveView("allUserData");
                setMobileMenuAnchor(null);
                setSearchSessionResults([]);
                setShowSessionPanel(false);
              }}
            >
              <ManageAccountsIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography
                sx={{ fontSize: "17px", fontFamily: "Calibri, sans-serif" }}
              >
                All User Data
              </Typography>
            </MenuItem>
          )}

          <MenuItem
            onClick={() => {
              handleRedirect();
              setMobileMenuAnchor(null);
            }}
          >
            <MailOutlineIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography
              sx={{ fontSize: "17px", fontFamily: "Calibri, sans-serif" }}
            >
              Contact Us
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              setOpenChangePassword(true);
              setMobileMenuAnchor(null);
            }}
          >
            <LockResetRoundedIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography
              sx={{ fontSize: "17px", fontFamily: "Calibri, sans-serif" }}
            >
              Change Password
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={handleLogout}
          >
            <LogoutTwoToneIcon fontSize="small" sx={{ mr: 1, color: "red" }} />
            <Typography
              sx={{ fontSize: "17px", fontFamily: "Calibri, sans-serif" }}
            >
              Logout
            </Typography>
          </MenuItem>
        </Menu>

        {/* Existing Desktop User Menu */}
        <Menu
          anchorEl={anchorsEl}
          open={Boolean(anchorsEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              width: 200,
              height: 90,
              borderRadius: 2,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              handleCloseMenu();
              setOpenProfile(true);
            }}
          >
            <PersonRoundedIcon fontSize="small" sx={{ mr: 1 }} />
            Profile
          </MenuItem>

          <MenuItem
            onClick={handleLogout}
          >
            <LogoutTwoToneIcon fontSize="small" sx={{ mr: 1, color: "red" }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>

      {/* Main Content Area */}
      <Box
        className="chat-header-box"
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          transition: "all 0.3s ease",
          px: { xs: 2, sm: 3, md: 2 },
          mb: 0,
          pb: 0,
          // pt: isXS ? "110px" : "76px",
          pt: { xs: "110px", sm: "107px", md: "80px", lg: "80px" },
        }}
      >
        {activeView === "chat" ? (
          <>
            <Box
              sx={{
                // display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
                width: "100%",
                maxWidth: { xs: "100%", sm: "100%", md: "100%" },
                px: { xs: 1, sm: 2, md: 8 },
                mb: 0,
                // mt: "11px",
                pb: 0,
              }}
            >
              {/* 👉 Main Content (Conditional) */}
              <Box
                sx={{
                  // height: isXS ? "60vh" : "64vh",
                  height: { xs: "62vh", sm: "62vh", md: "62vh", lg: "63vh" },
                  // p: 2,
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  vw: "100%",
                  p: { xs: 1, sm: 1, md: 2 }, // 🔹 Reduced padding
                  minHeight: 0, // 🔹 Important for flex scrolling
                  /* 🔹 Scrollbar hide */
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  scrollbarWidth: "none", // 🔹 Firefox
                  "-ms-overflow-style": "none", // 🔹 IE 10+
                }}
              >
                {historyLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 8,
                      height: "48.5vh",
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Loading chat history...
                      </Typography>
                    </Box>
                  </Box>
                ) : messageGroups[0]?.length === 0 ? (
                  // Welcome Screen
                  <Box
                    sx={{
                      textAlign: "center",
                      // pb: 4,
                      color: "text.secondary",
                    }}
                  >
                    {/* <leafatar
                      sx={{
                        width: 64,
                        height: 64,
                        mx: "auto",
                        mb: 2,
                        bgcolor: "#3dafe2",
                        color: "#fff",
                      }}
                    > */}
                    {/* <Logo /> */}
                    {/* </leafatar> */}

                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Welcome to <strong>Wrds</strong>
                    </Typography>

                    {/* <Typography variant="body2">
                      Start a conversation by typing a message below.
                    </Typography> */}
                  </Box>
                ) : (
                  // Chat Messages
                  <Box sx={{ spaceY: 6, width: "100%", minWidth: 0 }}>
                    {(messageGroups[0] || []).map((group, idx) => (
                      <Box key={idx} mb={3}>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          flexDirection={"column"}
                          alignItems={"flex-end"}
                          mb={1.5}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mr: 1,
                              // fontSize:"19px",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "18px",
                                fontFamily: "Calibri, sans-serif",
                                fontWeight: 400, // Regular weight
                              }}
                            >
                              You
                            </Typography>
                          </Box>
                          {/* <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end", // Right side ma mukse
                        alignItems:"flex-end",
                        float:"right",
                        mb: 1,
                      }}
                    > */}

                          {group.files && group.files.length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "#f0f4ff",
                                borderRadius: "6px",
                                padding: "2px 8px",
                                border: "1px solid #1268fb",
                                maxWidth: "120px",
                                mb: 0.5,
                                // size: "20px",
                              }}
                            >
                              <InsertDriveFile
                                sx={{
                                  fontSize: "14px",
                                  color: "#1268fb",
                                  mr: 1,
                                }}
                              />

                              {/* <Typography
                            variant="caption"
                            sx={{
                              color: "#1268fb",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: "11px",
                              fontWeight: "500",
                            }}
                          >
                           
                            {group.files.map((f) => f.name).join(", ")}
                          </Typography> */}
                              <Box sx={{ overflow: "hidden" }}>
                                {group.files.map((f, idx) => (
                                  <Typography
                                    key={idx}
                                    component="a"
                                    href={f.cloudinaryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="caption"
                                    sx={{
                                      color: "#1268fb",
                                      display: "block",
                                      textDecoration: "none",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {/* {f.filename} ({f.wordCount}w / {f.tokenCount}t) */}
                                    {/* Try these different properties */}
                                    {f.name ||
                                      f.filename ||
                                      f.originalName ||
                                      f.fileName}{" "}
                                    {/* ({f.wordCount}w / {f.tokenCount}t) */}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}
                          <Paper
                            sx={{
                              p: { xs: 1, sm: 1.5 },
                              background:
                                "linear-gradient(145deg, rgba(46, 31, 105, 0.98), rgba(39, 39, 105, 0.96))",
                              color: "#fff",
                              borderRadius: 3,
                              minWidth: {
                                xs: "280px",
                                sm: "280px",
                                md: "300px",
                              },
                              maxWidth: { xs: "88%", sm: "90%", md: "89%" },
                            }}
                          >
                            {editingId === group.id ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <TextField
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  multiline
                                  minRows={2}
                                  fullWidth
                                  autoFocus
                                  variant="outlined"
                                  sx={{
                                    bgcolor: "#fff",
                                    borderRadius: 1,
                                    "& .MuiInputBase-input": { color: "#000" },
                                  }}
                                />

                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                      handleSend(editText, group.id);
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Save
                                  </Button>
                                </Box>
                              </Box>
                            ) : (
                              <>
                                <Typography
                                  sx={{
                                    fontSize: "19px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400,
                                  }}
                                >
                                  {group.prompt.charAt(0).toUpperCase() +
                                    group.prompt.slice(1)}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mt: 0.5,
                                  }}
                                >
                                  <Typography variant="caption">
                                    {group.time}
                                  </Typography>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <Tooltip
                                      title={
                                        copiedId === group.id
                                          ? "Copied!"
                                          : "Copy"
                                      }
                                      arrow
                                    >
                                      <IconButton
                                        size="small"
                                        sx={{
                                          color:
                                            copiedId === group.id
                                              ? "#8cff8c"
                                              : "#fff",
                                          p: "2px",
                                        }}
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            group.prompt,
                                          );
                                          setCopiedId(group.id);
                                          setTimeout(
                                            () => setCopiedId(null),
                                            1500,
                                          );
                                        }}
                                      >
                                        <ContentCopyIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Edit" arrow>
                                      <IconButton
                                        size="small"
                                        sx={{ color: "#fff", p: "2px" }}
                                        onClick={() => {
                                          setEditingId(group.id);
                                          setEditText(group.prompt);
                                        }}
                                      >
                                        <EditIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </>
                            )}
                          </Paper>
                        </Box>

                        {/* AI Response */}
                        <Box>
                          {/* 🔹 Selected model name upar */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              // p: 1,
                              // borderBottom: "1px solid #e0e0e0",
                              mb: 0.5,
                              color: "text.primary",
                            }}
                          >
                            {/* <Logo /> */}
                            <Avatar
                              src={chat}
                              alt="chat"
                              sx={{
                                // border: "2px solid #4d4646ff", // lighter black (#aaa / #bbb / grey[500])
                                bgcolor: "white",
                                width: 40, // thodu mota rakho
                                height: 40,
                                p: "2px", // andar jagya
                                cursor: "pointer",
                                // pl: "1px",
                              }}
                              // onClick={() => setIsCollapsed(false)}
                            />
                            {console.log(
                              group.botName,
                              getBotDisplayName(group.botName),
                              "group",
                            )}
                            {/* ✅ Bot name + AI Assistant */}
                            <Box ml={1}>
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: "underline",
                                  fontSize: "16px",
                                }}
                              >
                                {/* {group.botName} */}

                                {/* {group.botName === "chatgpt-5-mini"
                                  ? "ChatGPT 5-Mini"
                                  : group.botName === "grok"
                                  ? "Grok 3-Mini"
                                  : group.botName === "claude-3-haiku"
                                  ? "Claude-3"
                                  : ""} */}

                                {isSmartAI
                                  ? "Wrds AI"
                                  : isSmartAINxt
                                    ? "Wrds Ai Nxt"
                                    : getBotDisplayName(group.botName)}
                              </Typography>

                              {/* <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                Wrds
                              </Typography> */}
                            </Box>
                          </Box>

                          <Paper
                            sx={{
                              // p: 1.5,
                              p: { xs: 1, sm: 1.5 },
                              bgcolor: "#f1f6fc",
                              borderRadius: 3,
                              // maxWidth: { xs: "80%", md: "70%" },
                              maxWidth: { xs: "87%", sm: "90%", md: "89%" },
                            }}
                          >
                            <Box sx={{ mb: 2 }}>
                              {group.isTyping &&
                              [
                                "Thinking...",
                                "Analyzing...",
                                "Generating...",
                              ].includes(
                                group.responses[group.currentSlide],
                              ) ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily: "Calibri, sans-serif",
                                      fontWeight: 400,
                                    }}
                                  >
                                    {group.responses[group.currentSlide]}
                                  </Typography>
                                </Box>
                              ) : (
                                <div
                                  style={{
                                    fontSize: "19px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400, // Regular weight
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: formatChatResponseHtml(
                                      group.responses[group.currentSlide],
                                    ),
                                  }}
                                />
                              )}
                              {renderBasicsButton(group)}
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                              }}
                            >
                              <Box>
                                {/* Time on left */}
                                <Typography
                                  variant="caption"
                                  sx={{ opacity: 0.6, mb: 0.5 }}
                                >
                                  {group.time}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                }}
                              >
                                {/* 🛑 Stop button beside token dropdown */}
                                {/* {group.isBeingProcessed && ( */}
                                {/* <IconButton
                                    size="small"
                                    onClick={stopGeneration}
                                    sx={{
                                      color: "#665c5cff",
                                      p: 0.3,
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      "&:hover": {
                                        bgcolor: "rgba(229, 57, 53, 0.1)",
                                      },
                                    }}
                                  >
                                    <StopIcon fontSize="small" />
                                  </IconButton> */}
                                {/* )} */}

                                {/* Icon on right */}
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleClick(e, idx)}
                                >
                                  <KeyboardArrowDownTwoToneIcon fontSize="small" />
                                </IconButton>

                                {/* Popover for usage token */}
                                <Popover
                                  open={
                                    Boolean(anchorEl) && activeGroup === idx
                                  }
                                  anchorEl={anchorEl}
                                  onClose={handleClose}
                                  anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                  }}
                                  transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                  }}
                                  PaperProps={{
                                    sx: {
                                      p: 1,
                                      borderRadius: 2,
                                      boxShadow: 3,
                                      minWidth: 140,
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    Token Count
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      display: "block",
                                      mt: 0.5,
                                    }}
                                  >
                                    {group.tokensUsed !== null &&
                                    group.tokensUsed !== undefined
                                      ? group.tokensUsed
                                      : "N/A"}
                                  </Typography>
                                  {/* <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {usageTokens !== undefined && usageTokens !== null
                              ? usageTokens
                              : "N/A"}
                          </Typography> */}
                                </Popover>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </Box>

              {/* 👉 Footer (Always Common) */}
              <Box
                sx={{
                  mb: 0,
                  pb: "16px",
                  display: "flex",
                  p: { xs: 1, sm: 1, md: 2 }, // 🔹 Reduced padding
                  width: { xs: "92%", sm: "100%", md: "100%" },
                  // maxWidth: { xs: "100%", md: "940px" },
                  // maxWidth: { xs: "100%", sm: "95%", md: "1080px" },
                  flexDirection: "column",
                  justifyContent: "space-between",
                  // px: { xs: 2, sm: 0, md: 0}
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    bgcolor: "#fff",
                    borderRadius: "40px",
                    border: "1px solid #dcdcdc",
                    display: "flex",
                    alignItems: "center",
                    gap: isXS ? 0 : 0.5,
                    flexDirection: "column",
                    width: "100%",
                    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* 📝 Input Field */}
                  <Box sx={{ width: "100%" }}>
                    <TextField
                      fullWidth
                      placeholder="Ask WrdsAI..."
                      variant="outlined"
                      size="small"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      // onKeyDown={(e) => {
                      //   if (e.key === "Enter" && !e.shiftKey) {
                      //     e.preventDefault();
                      //     handleSend();
                      //   }
                      // }}
                      onKeyDown={(e) => {
                        if (User?.subscription?.isPlanExpired) return;

                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isSending || isTypingResponse}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "30px",
                          backgroundColor: "#fff",
                          height: "auto",
                          border: 0,
                          minHeight: selectedFiles.length > 0 ? "75px" : "60px",
                          padding:
                            selectedFiles.length > 0
                              ? "25px 14px 10px 14px"
                              : "4px 14px 4px 14px",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none !important", // 🔥 outline remove
                        },
                        "& .MuiOutlinedInput-input": {
                          padding: "6px 8px",
                          height: "auto",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .Mui-disabled": { opacity: 0.5 },
                        minWidth: { xs: "100%", sm: "200px" },
                        mb: { xs: 1, sm: 0 },
                      }}
                      multiline
                      maxRows={2}
                      // maxRows={selectedFiles.length > 0 ? 1 : 4}
                      InputProps={{
                        startAdornment: (
                          <>
                            {/* 📁 ATTACH ICON (Always shown) */}

                            {/* FILE BADGE SECTION */}
                            {selectedFiles.length > 0 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: "5px",
                                  left: "20px",
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                  maxWidth: "70%",
                                }}
                              >
                                {selectedFiles.map((file, index) => (
                                  <Box
                                    key={index}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      backgroundColor: "#eef3ff",
                                      borderRadius: "14px",
                                      padding: "2px 8px",
                                      border: "1px solid #1268fb",
                                      maxWidth: "120px",
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        color: "#1268fb",
                                      }}
                                    >
                                      {file.name.length > 15
                                        ? file.name.substring(0, 12) + "..."
                                        : file.name}
                                    </Typography>

                                    <IconButton
                                      size="small"
                                      onClick={() => removeFile(index)}
                                      sx={{ color: "#ff4444", ml: 0.5, p: 0 }}
                                    >
                                      <CloseIcon fontSize="inherit" />
                                    </IconButton>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </>
                        ),

                        endAdornment: (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {/*Mic Btn if needed*/}
                          </Box>
                        ),
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: isXS ? 0.5 : 1,
                      flexDirection: "raw",
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ ml: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        {/* <IconButton
                          onClick={isListening ? stopListening : startListening}
                          disabled={true}
                          sx={{
                            color: isListening ? "red" : "#1268fb",
                            mr: 0.5,
                            opacity: 0.5,
                            cursor: "not-allowed",
                          }}
                          title={
                            isListening ? "Stop recording" : "Start voice input"
                          }
                        >
                          {isListening ? (
                            <StopCircleIcon />
                          ) : (
                            <KeyboardVoiceIcon
                              sx={{
                                width: isXS ? "23px" : "25px",
                                height: isXS ? "23px" : "25px",
                              }}
                            />
                          )}
                        </IconButton> */}

                        {(isTypingResponse || isSending) && (
                          <Tooltip title="Stop generating">
                            <IconButton
                              onClick={() => {
                                isStoppedRef.current = true;
                                handleStopResponse();
                              }}
                              color="error"
                              sx={{ mr: 0.5, width: "9px", height: "11px" }}
                            >
                              <StopCircleIcon
                                sx={{ width: "25px", height: "25px" }}
                              />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2,
                      }}
                    >
                      {/* ➤ Send Button */}
                      {renderStudyChapterMenus()}

                      <IconButton
                        onClick={() => {
                          if (User?.subscription?.isPlanExpired) return;
                          handleSend();
                        }}
                        // disabled={!input.trim() || isSending || isTypingResponse}
                        disabled={User?.subscription?.isPlanExpired}
                        sx={{
                          // bgcolor: "#1268fb",
                          bgcolor: User?.subscription?.isPlanExpired
                            ? "#bdbdbd"
                            : "#2f236f",
                          color: "white",
                          width: isXS ? "30px" : "40px",
                          height: isXS ? "30px" : "40px",
                          ml: 1,
                          // "&:hover": { bgcolor: "#204BC4" },
                          "&:hover": {
                            bgcolor: User?.subscription?.isPlanExpired
                              ? "#bdbdbd"
                              : "#24115f",
                          },
                          borderRadius: "50%",
                          opacity: User?.subscription?.isPlanExpired ? 0.6 : 1,
                        }}
                      >
                        <SendIcon
                          sx={{
                            width: isXS ? "15px" : "25px",
                            height: isXS ? "15px" : "25px",
                            color: "#ffffff",
                          }}
                        />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mt: 1, pt: 1, width: "100%", textAlign: "center" }}>
                  <Typography
                    sx={{
                      color: "gray",
                      fontSize: {
                        xs: "13px",
                        sm: "15px",
                        md: "16px",
                        lg: "18px",
                      },
                    }}
                  >
                    WrdsAI can make mistakes, so double-check.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        ) : activeView === "smartAi" ? (
          <>
            <Box
              sx={{
                // display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
                width: "100%",
                maxWidth: { xs: "100%", sm: "100%", md: "100%" },
                px: { xs: 1, sm: 2, md: 8 },
                mb: 0,
                // mt: "11px",
                pb: 0,
              }}
            >
              {/* 👉 Main Content (Conditional) */}
              <Box
                sx={{
                  // height: "70vh",
                  height: { xs: "70vh", sm: "71vh", md: "72vh", lg: "73vh" },
                  // p: 2,
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  overflow: "auto",
                  p: { xs: 1, sm: 1, md: 2 }, // 🔹 Reduced padding
                  minHeight: 0, // 🔹 Important for flex scrolling
                  /* 🔹 Scrollbar hide */
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  scrollbarWidth: "none", // 🔹 Firefox
                  "-ms-overflow-style": "none", // 🔹 IE 10+
                }}
              >
                {historyLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 8,
                      height: "48.5vh",
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Loading WrdsAI history...
                      </Typography>
                    </Box>
                  </Box>
                ) : smartAIMessageGroups[0]?.length === 0 ? (
                  // Welcome Screen
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      color: "text.secondary",
                    }}
                  >
                    {/* <leafatar
                      sx={{
                        width: 64,
                        height: 64,
                        mx: "auto",
                        mb: 2,
                        bgcolor: "#3dafe2",
                        color: "#fff",
                      }}
                    > */}
                    {/* <Logo /> */}
                    {/* </leafatar> */}

                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Welcome to <strong>WrdsAI</strong>
                    </Typography>

                    {/* <Typography variant="body2">
                      Start a conversation by typing a message below.
                    </Typography> */}
                  </Box>
                ) : (
                  // Chat Messages
                  <Box sx={{ spaceY: 6, width: "100%", minWidth: 0 }}>
                    {(smartAIMessageGroups[0] || []).map((group, idx) => (
                      <Box key={idx} mb={3}>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          flexDirection={"column"}
                          alignItems={"flex-end"}
                          mb={1.5}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mr: 1,
                              // fontSize:"19px",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "18px",
                                fontFamily: "Calibri, sans-serif",
                                fontWeight: 400, // Regular weight
                              }}
                            >
                              You
                            </Typography>
                          </Box>
                          {/* <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end", // Right side ma mukse
                        alignItems:"flex-end",
                        float:"right",
                        mb: 1,
                      }}
                    > */}

                          {group.files && group.files.length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "#f0f4ff",
                                borderRadius: "6px",
                                padding: "2px 8px",
                                border: "1px solid #1268fb",
                                maxWidth: "120px",
                                mb: 0.5,
                                // size: "20px",
                              }}
                            >
                              <InsertDriveFile
                                sx={{
                                  fontSize: "14px",
                                  color: "#1268fb",
                                  mr: 1,
                                }}
                              />

                              {/* <Typography
                            variant="caption"
                            sx={{
                              color: "#1268fb",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: "11px",
                              fontWeight: "500",
                            }}
                          >
                           
                            {group.files.map((f) => f.name).join(", ")}
                          </Typography> */}
                              <Box sx={{ overflow: "hidden" }}>
                                {group.files.map((f, idx) => (
                                  <Typography
                                    key={idx}
                                    component="a"
                                    href={f.cloudinaryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="caption"
                                    sx={{
                                      color: "#1268fb",
                                      display: "block",
                                      textDecoration: "none",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {/* {f.filename} ({f.wordCount}w / {f.tokenCount}t) */}
                                    {/* Try these different properties */}
                                    {f.name ||
                                      f.filename ||
                                      f.originalName ||
                                      f.fileName}{" "}
                                    {/* ({f.wordCount}w / {f.tokenCount}t) */}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}
                          <Paper
                            sx={{
                              p: { xs: 1, sm: 1.5 },
                              background:
                                "linear-gradient(145deg, rgba(46, 31, 105, 0.98), rgba(39, 39, 105, 0.96))",
                              color: "#fff",
                              borderRadius: 3,
                              minWidth: "300px",
                              maxWidth: { xs: "88%", sm: "90%", md: "89%" },
                            }}
                          >
                            {editingId === group.id ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <TextField
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  multiline
                                  minRows={2}
                                  fullWidth
                                  autoFocus
                                  variant="outlined"
                                  sx={{
                                    bgcolor: "#fff",
                                    borderRadius: 1,
                                    "& .MuiInputBase-input": { color: "#000" },
                                  }}
                                />

                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                      handleSend(editText, group.id);
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Save
                                  </Button>
                                </Box>
                              </Box>
                            ) : (
                              <>
                                <Typography
                                  sx={{
                                    fontSize: "19px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400,
                                  }}
                                >
                                  {group.prompt.charAt(0).toUpperCase() +
                                    group.prompt.slice(1)}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mt: 0.5,
                                  }}
                                >
                                  <Typography variant="caption">
                                    {group.time}
                                  </Typography>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <Tooltip
                                      title={
                                        copiedId === group.id
                                          ? "Copied!"
                                          : "Copy"
                                      }
                                      arrow
                                    >
                                      <IconButton
                                        size="small"
                                        sx={{
                                          color:
                                            copiedId === group.id
                                              ? "#8cff8c"
                                              : "#fff",
                                          p: "2px",
                                        }}
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            group.prompt,
                                          );
                                          setCopiedId(group.id);
                                          setTimeout(
                                            () => setCopiedId(null),
                                            1500,
                                          );
                                        }}
                                      >
                                        <ContentCopyIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Edit" arrow>
                                      <IconButton
                                        size="small"
                                        sx={{ color: "#fff", p: "2px" }}
                                        onClick={() => {
                                          setEditingId(group.id);
                                          setEditText(group.prompt);
                                        }}
                                      >
                                        <EditIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </>
                            )}
                          </Paper>
                        </Box>

                        {/* AI Response */}
                        <Box>
                          {/* 🔹 Selected model name upar */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              // p: 1,
                              // borderBottom: "1px solid #e0e0e0",
                              mb: 0.5,
                              color: "text.primary",
                            }}
                          >
                            {/* <Logo /> */}
                            <Avatar
                              src={chat}
                              alt="chat"
                              sx={{
                                // border: "2px solid #4d4646ff", // lighter black (#aaa / #bbb / grey[500])
                                bgcolor: "white",
                                width: 40, // thodu mota rakho
                                height: 40,
                                p: "2px", // andar jagya
                                cursor: "pointer",
                                // pl: "1px",
                              }}
                              // onClick={() => setIsCollapsed(false)}
                            />
                            {console.log(
                              group.botName,
                              getBotDisplayName(group.botName),
                              "group",
                            )}
                            {/* ✅ Bot name + AI Assistant */}
                            <Box ml={1}>
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: "underline",
                                  fontSize: "16px",
                                }}
                              >
                                {/* {group.botName} */}
                                {/* {group.botName === "chatgpt-5-mini"
                                  ? "ChatGPT 5-Mini"
                                  : group.botName === "grok"
                                  ? "Grok 3-Mini"
                                  : group.botName === "claude-3-haiku"
                                  ? "Claude-3"
                                  : ""} */}
                                WrdsAI
                              </Typography>

                              {/* <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                Wrds
                              </Typography> */}
                            </Box>
                          </Box>

                          <Paper
                            sx={{
                              // p: 1.5,
                              p: { xs: 1, sm: 1.5 },
                              bgcolor: "#f1f6fc",
                              borderRadius: 3,
                              // maxWidth: { xs: "80%", md: "70%" },
                              maxWidth: { xs: "87%", sm: "90%", md: "89%" },
                            }}
                          >
                            <Box sx={{ mb: 2 }}>
                              {group.isTyping &&
                              [
                                "Thinking...",
                                "Analyzing...",
                                "Generating...",
                              ].includes(
                                group.responses[group.currentSlide],
                              ) ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily: "Calibri, sans-serif",
                                      fontWeight: 400,
                                    }}
                                  >
                                    {group.responses[group.currentSlide]}
                                  </Typography>
                                </Box>
                              ) : (
                                <div
                                  style={{
                                    fontSize: "17px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400, // Regular weight
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: formatChatResponseHtml(
                                      group.responses[group.currentSlide],
                                    ),
                                  }}
                                />
                              )}
                              {renderBasicsButton(group)}
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                              }}
                            >
                              <Box>
                                {/* Time on left */}
                                <Typography
                                  variant="caption"
                                  sx={{ opacity: 0.6, mb: 0.5 }}
                                >
                                  {group.time}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                }}
                              >
                                {/* 🛑 Stop button beside token dropdown */}
                                {/* {group.isBeingProcessed && ( */}
                                {/* <IconButton
                                    size="small"
                                    onClick={stopGeneration}
                                    sx={{
                                      color: "#665c5cff",
                                      p: 0.3,
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      "&:hover": {
                                        bgcolor: "rgba(229, 57, 53, 0.1)",
                                      },
                                    }}
                                  >
                                    <StopIcon fontSize="small" />
                                  </IconButton> */}
                                {/* )} */}

                                {/* Icon on right */}
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleClick(e, idx)}
                                >
                                  <KeyboardArrowDownTwoToneIcon fontSize="small" />
                                </IconButton>

                                {/* Popover for usage token */}
                                <Popover
                                  open={
                                    Boolean(anchorEl) && activeGroup === idx
                                  }
                                  anchorEl={anchorEl}
                                  onClose={handleClose}
                                  anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                  }}
                                  transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                  }}
                                  PaperProps={{
                                    sx: {
                                      p: 1,
                                      borderRadius: 2,
                                      boxShadow: 3,
                                      minWidth: 140,
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    Token Count
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      display: "block",
                                      mt: 0.5,
                                    }}
                                  >
                                    {group.tokensUsed !== null &&
                                    group.tokensUsed !== undefined
                                      ? group.tokensUsed
                                      : "N/A"}
                                  </Typography>
                                  {/* <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {usageTokens !== undefined && usageTokens !== null
                              ? usageTokens
                              : "N/A"}
                          </Typography> */}
                                </Popover>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </Box>

              {/* 👉 Footer (Always Common) */}
              <Box
                sx={{
                  mb: 0,
                  pb: "16px",
                  display: "flex",
                  p: { xs: 1, sm: 1, md: 2 }, // 🔹 Reduced padding
                  // width: { xs: "100%" },
                  width: "92%",
                  // maxWidth: { xs: "100%", md: "940px" },
                  // maxWidth: { xs: "100%", sm: "95%", md: "1080px" },
                  flexDirection: "column",
                  justifyContent: "space-between",
                  // px: { xs: 2, sm: 0, md: 0}
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    bgcolor: "#fff",
                    borderRadius: "40px",
                    border: "1px solid #dcdcdc",
                    display: "flex",
                    alignItems: "center",
                    // gap: isXS ? 0 : 0.5,
                    gap: 0.5,
                    flexDirection: "column",
                    width: "100%",
                    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* 📝 Input Field */}
                  <Box sx={{ width: "100%" }}>
                    <TextField
                      fullWidth
                      placeholder="Ask WrdsAI..."
                      variant="outlined"
                      size="small"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isSending || isTypingResponse}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "30px",
                          backgroundColor: "#fff",
                          height: "auto",
                          border: 0,
                          minHeight: selectedFiles.length > 0 ? "75px" : "60px",
                          padding:
                            selectedFiles.length > 0
                              ? "25px 14px 10px 14px"
                              : "4px 14px 4px 14px",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none !important", // 🔥 outline remove
                        },
                        "& .MuiOutlinedInput-input": {
                          padding: "6px 8px",
                          height: "auto",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .Mui-disabled": { opacity: 0.5 },
                        minWidth: { xs: "100%", sm: "200px" },
                        mb: { xs: 1, sm: 0 },
                      }}
                      multiline
                      maxRows={2}
                      // maxRows={selectedFiles.length > 0 ? 1 : 4}
                      InputProps={{
                        startAdornment: (
                          <>
                            {/* 📁 ATTACH ICON (Always shown) */}

                            {/* FILE BADGE SECTION */}
                            {selectedFiles.length > 0 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: "5px",
                                  left: "20px",
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                  maxWidth: "70%",
                                }}
                              >
                                {selectedFiles.map((file, index) => (
                                  <Box
                                    key={index}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      backgroundColor: "#eef3ff",
                                      borderRadius: "14px",
                                      padding: "2px 8px",
                                      border: "1px solid #1268fb",
                                      maxWidth: "120px",
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        color: "#1268fb",
                                      }}
                                    >
                                      {file.name.length > 15
                                        ? file.name.substring(0, 12) + "..."
                                        : file.name}
                                    </Typography>

                                    <IconButton
                                      size="small"
                                      onClick={() => removeFile(index)}
                                      sx={{ color: "#ff4444", ml: 0.5, p: 0 }}
                                    >
                                      <CloseIcon fontSize="inherit" />
                                    </IconButton>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </>
                        ),

                        endAdornment: (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {/*Mic Btn if needed*/}
                          </Box>
                        ),
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: isXS ? 0.5 : 1,
                      flexDirection: "raw",
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ ml: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        {/* <IconButton
                          onClick={isListening ? stopListening : startListening}
                          disabled={true}
                          sx={{
                            color: isListening ? "red" : "#1268fb",
                            mr: 0.5,
                            opacity: 0.5,
                            cursor: "not-allowed",
                          }}
                          title={
                            isListening ? "Stop recording" : "Start voice input"
                          }
                        >
                          {isListening ? (
                            <StopCircleIcon />
                          ) : (
                            <KeyboardVoiceIcon
                              sx={{
                                width: isXS ? "23px" : "25px",
                                height: isXS ? "23px" : "25px",
                              }}
                            />
                          )}
                        </IconButton> */}

                        {(isTypingResponse || isSending) && (
                          <Tooltip title="Stop generating">
                            <IconButton
                              onClick={() => {
                                isStoppedRef.current = true;
                                handleStopSmartAIResponse();
                              }}
                              color="error"
                              sx={{ mr: 0.5, width: "9px", height: "11px" }}
                            >
                              <StopCircleIcon
                                sx={{ width: "25px", height: "25px" }}
                              />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {renderStudyChapterMenus()}

                      {/* ➤ Send Button */}
                      <IconButton
                        onClick={() => handleSend()}
                        // disabled={!input.trim() || isSending || isTypingResponse}
                        sx={{
                          background:
                            "linear-gradient(145deg, #352273, #2b2875)",
                          color: "#ffffff",
                          width: isXS ? "30px" : "40px",
                          height: isXS ? "30px" : "40px",
                          ml: 1,
                          "&:hover": {
                            background:
                              "linear-gradient(145deg, #403084, #24115f)",
                          },
                          borderRadius: "50%",
                        }}
                      >
                        <SendIcon
                          sx={{
                            width: isXS ? "15px" : "25px",
                            height: isXS ? "15px" : "25px",
                            color: "#ffffff",
                          }}
                        />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mt: 1, pt: 1, width: "100%", textAlign: "center" }}>
                  <Typography
                    sx={{
                      color: "gray",
                      fontSize: {
                        xs: "13px",
                        sm: "15px",
                        md: "16px",
                        lg: "18px",
                      },
                    }}
                  >
                    WrdsAI can make mistakes, so double-check.
                  </Typography>
                </Box>

                {/* 👉 Tagline (Always Common) */}
                {/* <Box textAlign="center" mt={1}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "14px", mt: 1 }}
                  >
                    How <strong>Wrds</strong> can help you today?
                  </Typography>
                </Box> */}
              </Box>
            </Box>
          </>
        ) : activeView === "WrdsAI Nxt" ? (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                transition: "all 0.3s ease",
                width: "100%",
                maxWidth: { xs: "100%", sm: "100%", md: "100%" },
                minHeight: {
                  xs: "calc(100svh - 70px)",
                  sm: "calc(100dvh - 71px)",
                  md: "calc(100dvh - 84px)",
                  lg: "calc(100dvh - 86px)",
                },
                px: { xs: 1, sm: 2, md: 8 },
                mb: 0,
                pb: 0,
              }}
            >
              {/* 👉 Main Content (Conditional) */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  width: "92%",
                  // mx: "auto",
                  p: { xs: 1, sm: 1, md: 2 },
                  pb: { xs: "152px", sm: "168px", md: "176px" },
                  minHeight: 0,
                  "&::-webkit-scrollbar": { display: "none" },
                  scrollbarWidth: "none",
                  "-ms-overflow-style": "none",
                }}
              >
                {historyLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 8,
                      height: "48.5vh",
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Loading WrdsAI Nxt history...
                      </Typography>
                    </Box>
                  </Box>
                ) : smartAINxtMessageGroups[0]?.length === 0 ? (
                  // Welcome Screen
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Welcome to <strong>WrdsAI Nxt</strong>
                    </Typography>
                  </Box>
                ) : (
                  // Chat Messages
                  <Box sx={{ spaceY: 6, width: "100%", minWidth: 0, pb: 1 }}>
                    {(smartAINxtMessageGroups[0] || []).map((group, idx, groups) => (
                      <Box key={idx} mb={idx === groups.length - 1 ? 0.5 : 2.25}>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          flexDirection={"column"}
                          alignItems={"flex-end"}
                          mb={1.5}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mr: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "18px",
                                fontFamily: "Calibri, sans-serif",
                                fontWeight: 400,
                              }}
                            >
                              You
                            </Typography>
                          </Box>

                          {group.files && group.files.length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "#f0f4ff",
                                borderRadius: "6px",
                                padding: "2px 8px",
                                border: "1px solid #1268fb",
                                maxWidth: "120px",
                                mb: 0.5,
                              }}
                            >
                              <InsertDriveFile
                                sx={{
                                  fontSize: "14px",
                                  color: "#1268fb",
                                  mr: 1,
                                }}
                              />
                              <Box sx={{ overflow: "hidden" }}>
                                {group.files.map((f, idx) => (
                                  <Typography
                                    key={idx}
                                    component="a"
                                    href={f.cloudinaryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="caption"
                                    sx={{
                                      color: "#1268fb",
                                      display: "block",
                                      textDecoration: "none",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {f.name ||
                                      f.filename ||
                                      f.originalName ||
                                      f.fileName}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}
                          <Paper
                            sx={{
                              p: { xs: 1, sm: 1.5 },
                              background:
                                "linear-gradient(145deg, rgba(46, 31, 105, 0.98), rgba(39, 39, 105, 0.96))",
                              color: "#fff",
                              borderRadius: 3,
                              minWidth: "300px",
                              maxWidth: { xs: "88%", sm: "90%", md: "89%" },
                            }}
                          >
                            {editingId === group.id ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <TextField
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  multiline
                                  minRows={2}
                                  fullWidth
                                  autoFocus
                                  variant="outlined"
                                  sx={{
                                    bgcolor: "#fff",
                                    borderRadius: 1,
                                    "& .MuiInputBase-input": { color: "#000" },
                                  }}
                                />

                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                      handleSend(editText, group.id);
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Save
                                  </Button>
                                </Box>
                              </Box>
                            ) : (
                              <>
                                <Typography
                                  sx={{
                                    fontSize: "17px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400,
                                  }}
                                >
                                  {group.prompt.charAt(0).toUpperCase() +
                                    group.prompt.slice(1)}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mt: 0.5,
                                  }}
                                >
                                  <Typography variant="caption">
                                    {group.time}
                                  </Typography>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <Tooltip
                                      title={
                                        copiedId === group.id
                                          ? "Copied!"
                                          : "Copy"
                                      }
                                      arrow
                                    >
                                      <IconButton
                                        size="small"
                                        sx={{
                                          color:
                                            copiedId === group.id
                                              ? "#8cff8c"
                                              : "#fff",
                                          p: "2px",
                                        }}
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            group.prompt,
                                          );
                                          setCopiedId(group.id);
                                          setTimeout(
                                            () => setCopiedId(null),
                                            1500,
                                          );
                                        }}
                                      >
                                        <ContentCopyIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Edit" arrow>
                                      <IconButton
                                        size="small"
                                        sx={{ color: "#fff", p: "2px" }}
                                        onClick={() => {
                                          setEditingId(group.id);
                                          setEditText(group.prompt);
                                        }}
                                      >
                                        <EditIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </>
                            )}
                          </Paper>
                        </Box>

                        {/* AI Response */}
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 0.5,
                              color: "text.primary",
                            }}
                          >
                            <Avatar
                              src={chat}
                              alt="chat"
                              sx={{
                                bgcolor: "white",
                                width: 40,
                                height: 40,
                                p: "2px",
                                cursor: "pointer",
                              }}
                            />
                            <Box ml={1}>
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: "underline",
                                  fontSize: "16px",
                                }}
                              >
                                WrdsAI Nxt
                              </Typography>
                            </Box>
                          </Box>

                          <Paper
                            sx={{
                              p: { xs: 1, sm: 1.5 },
                              background:
                                "linear-gradient(145deg, rgba(245, 241, 255, 0.96), rgba(234, 244, 255, 0.96))",
                              borderRadius: 3,
                              border: "1px solid rgba(124, 92, 255, 0.16)",
                              boxShadow: "0 10px 26px rgba(42, 24, 102, 0.1)",
                              maxWidth: { xs: "92%", sm: "92%", md: "88%" },
                            }}
                          >
                            <Box
                              sx={{
                                mb: 2,
                                color: "#1f1f1f",
                                lineHeight: 1.75,
                              }}
                            >
                              {group.isTyping &&
                              [
                                "Thinking...",
                                "Analyzing...",
                                "Generating...",
                              ].includes(
                                group.responses[group.currentSlide],
                              ) ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily: "Calibri, sans-serif",
                                      fontWeight: 400,
                                    }}
                                  >
                                    {group.responses[group.currentSlide]}
                                  </Typography>
                                </Box>
                              ) : (
                                <div
                                  style={{
                                    fontSize: "19px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400,
                                    lineHeight: 1.7,
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: formatChatResponseHtml(
                                      group.responses[group.currentSlide],
                                    ),
                                  }}
                                />
                              )}
                              {renderBasicsButton(group)}
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    opacity: 0.6,
                                    mb: 0.5,
                                    fontSize: "12px",
                                  }}
                                >
                                  {group.time}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleClick(e, idx)}
                                >
                                  <KeyboardArrowDownTwoToneIcon fontSize="small" />
                                </IconButton>

                                <Popover
                                  open={
                                    Boolean(anchorEl) && activeGroup === idx
                                  }
                                  anchorEl={anchorEl}
                                  onClose={handleClose}
                                  anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                  }}
                                  transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                  }}
                                  PaperProps={{
                                    sx: {
                                      p: 1,
                                      borderRadius: 2,
                                      boxShadow: 3,
                                      minWidth: 140,
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    Token Count
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      display: "block",
                                      mt: 0.5,
                                    }}
                                  >
                                    {group.tokensUsed !== null &&
                                    group.tokensUsed !== undefined
                                      ? group.tokensUsed
                                      : "N/A"}
                                  </Typography>
                                </Popover>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </Box>

              {/* 👉 Footer */}
              <Box
                sx={{
                  mb: 0,
                  pb: { xs: 0.15, sm: 0.35 },
                  display: "flex",
                  position: "fixed",
                  bottom: "max(env(safe-area-inset-bottom), 0px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 20,
                  p: { xs: 0.05, sm: 0.2, md: 0.35 },
                  width: { xs: "94%", sm: "92%" },
                  maxWidth: {
                    xs: "420px",
                    sm: "calc(100vw - 32px)",
                    md: "calc(100vw - 120px)",
                    lg: "calc(100vw - 180px)",
                  },
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  mt: 0,
                  flexShrink: 0,
                  background: {
                    xs: "linear-gradient(to top, rgba(255,255,255,0.985) 78%, rgba(255,255,255,0))",
                    sm: "linear-gradient(to top, rgba(255,255,255,0.975) 78%, rgba(255,255,255,0))",
                  },
                  pt: { xs: 1.1, sm: 0.2, md: 0.35 },
                }}
              >
                {renderTeacherLessonPlanActionRow()}
                <Box
                  sx={{
                    p: { xs: 0.45, sm: 0.85 },
                    bgcolor: "#ffffff",
                    borderRadius: "32px",
                    border: "1px solid rgba(15, 23, 42, 0.1)",
                    display: "flex",
                    alignItems: "stretch",
                    gap: 0.5,
                    flexDirection: "column",
                    width: "100%",
                    boxShadow: "0 10px 28px rgba(15,23,42,0.1)",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <TextField
                      fullWidth
                      placeholder="Ask anything"
                      variant="outlined"
                      size="small"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isSending || isTypingResponse}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "24px",
                          backgroundColor: "transparent",
                          height: "auto",
                          border: 0,
                          minHeight: selectedFiles.length > 0 ? "74px" : "46px",
                          padding:
                              selectedFiles.length > 0
                                  ? "20px 12px 6px 12px"
                                  : "1px 12px 0px 12px",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none !important",
                        },
                        "& .MuiOutlinedInput-input": {
                          padding: "4px 6px",
                          height: "auto",
                          fontSize: "16px",
                          color: "#1f1f1f",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "rgba(15,23,42,0.45)",
                          opacity: 1,
                        },
                        "& .Mui-disabled": { opacity: 0.5 },
                        minWidth: { xs: "100%", sm: "200px" },
                        mb: { xs: 1, sm: 0 },
                      }}
                      multiline
                      maxRows={3}
                      InputProps={{
                        startAdornment: (
                            <>
                              {selectedFiles.length > 0 && (
                                  <Box
                                      sx={{
                                        position: "absolute",
                                        top: "6px",
                                        left: "12px",
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 0.5,
                                        maxWidth: "70%",
                                      }}
                                  >
                                    {selectedFiles.map((file, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              backgroundColor: "#f4f7fb",
                                              borderRadius: "999px",
                                              padding: "2px 8px",
                                              border: "1px solid rgba(18,104,251,0.18)",
                                              maxWidth: "140px",
                                            }}
                                        >
                                          <Typography
                                              sx={{
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                color: "#2457d6",
                                              }}
                                          >
                                            {file.name.length > 15
                                                ? file.name.substring(0, 12) + "..."
                                                : file.name}
                                          </Typography>

                                          <IconButton
                                              size="small"
                                              onClick={() => removeFile(index)}
                                              sx={{
                                                color: "rgba(15,23,42,0.45)",
                                                ml: 0.5,
                                                p: 0,
                                              }}
                                          >
                                            <CloseIcon fontSize="inherit" />
                                          </IconButton>
                                        </Box>
                                    ))}
                                  </Box>
                              )}
                            </>
                        ),
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: isXS ? 0.75 : 1,
                      flexDirection: "row",
                      width: "100%",
                      justifyContent: "space-between",
                      px: { xs: 0.1, sm: 0.5 },
                      pb: { xs: 0, sm: 0.25 },
                      mt: { xs: -0.25, sm: 0 },
                    }}
                  >
                    <Box sx={{ ml: { xs: 0.25, sm: 1 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: { xs: 0.5, sm: 1.5 },
                        }}
                      >
                        {(isTypingResponse || isSending) && (
                          <Tooltip title="Stop generating">
                            <IconButton
                              onClick={() => {
                                isStoppedRef.current = true;
                                handleStopSmartAINxtResponse();
                              }}
                              color="error"
                              sx={{ mr: 0.5, width: "9px", height: "11px" }}
                            >
                              <StopCircleIcon
                                sx={{ width: "25px", height: "25px" }}
                              />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        mr: { xs: 0.25, sm: 1 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: { xs: "4px", sm: "6px" },
                      }}
                    >
                      {/* 🏫 Board Selection Button */}
                      <StudyChapterMenus
                        isCBSEActive={isCBSEActive}
                        chapterError={chapterError}
                        isXS={isXS}
                        selectedChapterMeta={selectedChapterMeta}
                        studyMenuAnchorEl={studyMenuAnchorEl}
                        isStudyMenuOpen={isStudyMenuOpen}
                        onCloseStudyMenus={closeStudyMenus}
                        chaptersLoading={chaptersLoading}
                        chapterStructure={chapterStructure}
                        onStudyClassOpen={handleStudyClassOpen}
                        selectedClass={selectedClass}
                        studyClassMenuAnchorEl={studyClassMenuAnchorEl}
                        activeStudyClass={activeStudyClass}
                        onCloseStudyClassMenu={handleStudyClassMenuClose}
                        onStudySubjectOpen={handleStudySubjectOpen}
                        selectedSubject={selectedSubject}
                        studySubjectMenuAnchorEl={studySubjectMenuAnchorEl}
                        activeStudySubject={activeStudySubject}
                        onCloseStudySubjectMenu={handleStudySubjectMenuClose}
                        onStudyChapterSelect={handleStudyChapterSelect}
                        selectedChapter={selectedChapter}
                        onStudyTriggerClick={handleStudyTriggerClick}
                        onDeselectChapter={handleDeselectChapter}
                        modeLabel={studyModeLabel}
                        hideClassSelection={shouldHideStudyClassSelection}
                        lockedStudyClass={
                          shouldHideStudyClassSelection && lockedStudyClass
                            ? { ...studyMenuClass, subjects: studyMenuSubjects }
                            : null
                        }
                      />


                      {/* Response Length Dropdown removed for WrdsAI Nxt as requested */}

                      <IconButton
                        onClick={() => handleSend()}
                        disabled={
                          (!input.trim() && selectedFiles.length === 0) ||
                          isSending ||
                          isTypingResponse
                        }
                        sx={{
                          background:
                            input.trim() || selectedFiles.length > 0
                              ? "linear-gradient(145deg, #352273, #2b2875)"
                              : "#f4f4f4",
                          color:
                            input.trim() || selectedFiles.length > 0
                              ? "#ffffff"
                              : "#1f1f1f",
                          width: isXS ? "32px" : "44px",
                          height: isXS ? "32px" : "44px",
                          ml: 0.5,
                          "&:hover": {
                            background:
                              input.trim() || selectedFiles.length > 0
                                ? "linear-gradient(145deg, #403084, #24115f)"
                                : "#eef1f5",
                          },
                          borderRadius: "50%",
                          "&.Mui-disabled": {
                            bgcolor: "#f1f3f5",
                              color: "rgba(15,23,42,0.35)",
                            },
                          }}
                      >
                        <SendIcon
                          sx={{
                            width: isXS ? "16px" : "21px",
                            height: isXS ? "16px" : "21px",
                            color:
                              input.trim() || selectedFiles.length > 0
                                ? "#ffffff"
                                : "rgba(36,17,95,0.42)",
                          }}
                        />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: { xs: 0.05, sm: 0.2 },
                    pt: 0,
                    pb: { xs: 0, sm: 0.25 },
                    width: "100%",
                    textAlign: "center",
                    lineHeight: 1,
                  }}
                >
                  <Typography
                    sx={{
                      color: "gray",
                      fontSize: {
                        xs: "10px",
                        sm: "13px",
                        md: "14px",
                        lg: "15px",
                      },
                      lineHeight: { xs: 1.1, sm: 1.35 },
                      m: 0,
                    }}
                  >
                    WrdsAI Nxt can make mistakes, so double-check.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        ) : activeView === "wrds AiPro" ? (
          <>
            <Box
              sx={{
                // display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
                width: "100%",
                maxWidth: { xs: "100%", sm: "100%", md: "100%" },
                px: { xs: 1, sm: 2, md: 8 },
                mb: 0,
                // mt: "11px",
                pb: 0,
              }}
            >
              {/* 👉 Main Content (Conditional) */}
              <Box
                sx={{
                  // height: "70vh",
                  height: { xs: "62vh", sm: "62vh", md: "62vh", lg: "63vh" },
                  // p: 2,
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  overflow: "auto",
                  p: { xs: 1, sm: 1, md: 2 }, // 🔹 Reduced padding
                  minHeight: 0, // 🔹 Important for flex scrolling
                  /* 🔹 Scrollbar hide */
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  scrollbarWidth: "none", // 🔹 Firefox
                  "-ms-overflow-style": "none", // 🔹 IE 10+
                }}
              >
                {historyLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 8,
                      height: "48.5vh",
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Loading WrdsAI Pro history...
                      </Typography>
                    </Box>
                  </Box>
                ) : smartAIProMessageGroups[0]?.length === 0 ? (
                  // Welcome Screen
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Welcome to <strong>WrdsAI Pro</strong>
                    </Typography>
                  </Box>
                ) : (
                  // Chat Messages
                  <Box sx={{ spaceY: 6, width: "100%", minWidth: 0 }}>
                    {(smartAIProMessageGroups[0] || []).map((group, idx) => (
                      <Box key={idx} mb={3}>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          flexDirection={"column"}
                          alignItems={"flex-end"}
                          mb={1.5}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mr: 1,
                              // fontSize:"19px",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "18px",
                                fontFamily: "Calibri, sans-serif",
                                fontWeight: 400, // Regular weight
                              }}
                            >
                              You
                            </Typography>
                          </Box>
                          {/* <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end", // Right side ma mukse
                        alignItems:"flex-end",
                        float:"right",
                        mb: 1,
                      }}
                    > */}

                          {group.files && group.files.length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "#f0f4ff",
                                borderRadius: "6px",
                                padding: "2px 8px",
                                border: "1px solid #1268fb",
                                maxWidth: "120px",
                                mb: 0.5,
                                // size: "20px",
                              }}
                            >
                              <InsertDriveFile
                                sx={{
                                  fontSize: "14px",
                                  color: "#1268fb",
                                  mr: 1,
                                }}
                              />

                              {/* <Typography
                            variant="caption"
                            sx={{
                              color: "#1268fb",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: "11px",
                              fontWeight: "500",
                            }}
                          >
                           
                            {group.files.map((f) => f.name).join(", ")}
                          </Typography> */}
                              <Box sx={{ overflow: "hidden" }}>
                                {group.files.map((f, idx) => (
                                  <Typography
                                    key={idx}
                                    component="a"
                                    href={f.cloudinaryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="caption"
                                    sx={{
                                      color: "#1268fb",
                                      display: "block",
                                      textDecoration: "none",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {/* {f.filename} ({f.wordCount}w / {f.tokenCount}t) */}
                                    {/* Try these different properties */}
                                    {f.name ||
                                      f.filename ||
                                      f.originalName ||
                                      f.fileName}{" "}
                                    {/* ({f.wordCount}w / {f.tokenCount}t) */}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}
                          <Paper
                            sx={{
                              p: { xs: 1, sm: 1.5 },
                              background:
                                "linear-gradient(145deg, rgba(46, 31, 105, 0.98), rgba(39, 39, 105, 0.96))",
                              color: "#fff",
                              borderRadius: 3,
                              minWidth: "300px",
                              maxWidth: { xs: "88%", sm: "90%", md: "89%" },
                            }}
                          >
                            {editingId === group.id ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <TextField
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  multiline
                                  minRows={2}
                                  fullWidth
                                  autoFocus
                                  variant="outlined"
                                  sx={{
                                    bgcolor: "#fff",
                                    borderRadius: 1,
                                    "& .MuiInputBase-input": { color: "#000" },
                                  }}
                                />

                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                      handleSend(editText, group.id);
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Save
                                  </Button>
                                </Box>
                              </Box>
                            ) : (
                              <>
                                <Typography
                                  sx={{
                                    fontSize: "19px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400,
                                  }}
                                >
                                  {group.prompt.charAt(0).toUpperCase() +
                                    group.prompt.slice(1)}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mt: 0.5,
                                  }}
                                >
                                  <Typography variant="caption">
                                    {group.time}
                                  </Typography>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <Tooltip
                                      title={
                                        copiedId === group.id
                                          ? "Copied!"
                                          : "Copy"
                                      }
                                      arrow
                                    >
                                      <IconButton
                                        size="small"
                                        sx={{
                                          color:
                                            copiedId === group.id
                                              ? "#8cff8c"
                                              : "#fff",
                                          p: "2px",
                                        }}
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            group.prompt,
                                          );
                                          setCopiedId(group.id);
                                          setTimeout(
                                            () => setCopiedId(null),
                                            1500,
                                          );
                                        }}
                                      >
                                        <ContentCopyIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Edit" arrow>
                                      <IconButton
                                        size="small"
                                        sx={{ color: "#fff", p: "2px" }}
                                        onClick={() => {
                                          setEditingId(group.id);
                                          setEditText(group.prompt);
                                        }}
                                      >
                                        <EditIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </>
                            )}
                          </Paper>
                        </Box>

                        {/* AI Response */}
                        <Box>
                          {/* 🔹 Selected model name upar */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              // p: 1,
                              // borderBottom: "1px solid #e0e0e0",
                              mb: 0.5,
                              color: "text.primary",
                            }}
                          >
                            {/* <Logo /> */}
                            <Avatar
                              src={chat}
                              alt="chat"
                              sx={{
                                // border: "2px solid #4d4646ff", // lighter black (#aaa / #bbb / grey[500])
                                bgcolor: "white",
                                width: 40, // thodu mota rakho
                                height: 40,
                                p: "2px", // andar jagya
                                cursor: "pointer",
                                // pl: "1px",
                              }}
                              // onClick={() => setIsCollapsed(false)}
                            />
                            {console.log(
                              group.botName,
                              getBotDisplayName(group.botName),
                              "group",
                            )}
                            {/* ✅ Bot name + AI Assistant */}
                            <Box ml={1}>
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: "underline",
                                  fontSize: "16px",
                                }}
                              >
                                {/* {group.botName} */}
                                {/* {group.botName === "chatgpt-5-mini"
                                  ? "ChatGPT 5-Mini"
                                  : group.botName === "grok"
                                  ? "Grok 3-Mini"
                                  : group.botName === "claude-3-haiku"
                                  ? "Claude-3"
                                  : ""} */}
                                WrdsAI Pro
                              </Typography>

                              {/* <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                Wrds
                              </Typography> */}
                            </Box>
                          </Box>

                          <Paper
                            sx={{
                              // p: 1.5,
                              p: { xs: 1, sm: 1.5 },
                              bgcolor: "#f1f6fc",
                              borderRadius: 3,
                              // maxWidth: { xs: "80%", md: "70%" },
                              maxWidth: { xs: "87%", sm: "90%", md: "89%" },
                            }}
                          >
                            <Box sx={{ mb: 2 }}>
                              {group.isTyping &&
                              [
                                "Thinking...",
                                "Analyzing...",
                                "Generating...",
                              ].includes(
                                group.responses[group.currentSlide],
                              ) ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily: "Calibri, sans-serif",
                                      fontWeight: 400,
                                    }}
                                  >
                                    {group.responses[group.currentSlide]}
                                  </Typography>
                                </Box>
                              ) : (
                                <div
                                  style={{
                                    fontSize: "19px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400, // Regular weight
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: formatChatResponseHtml(
                                      group.responses[group.currentSlide],
                                    ),
                                  }}
                                />
                              )}
                              {renderBasicsButton(group)}
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                              }}
                            >
                              <Box>
                                {/* Time on left */}
                                <Typography
                                  variant="caption"
                                  sx={{ opacity: 0.6, mb: 0.5 }}
                                >
                                  {group.time}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                }}
                              >
                                {/* 🛑 Stop button beside token dropdown */}
                                {/* {group.isBeingProcessed && ( */}
                                {/* <IconButton
                                    size="small"
                                    onClick={stopGeneration}
                                    sx={{
                                      color: "#665c5cff",
                                      p: 0.3,
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      "&:hover": {
                                        bgcolor: "rgba(229, 57, 53, 0.1)",
                                      },
                                    }}
                                  >
                                    <StopIcon fontSize="small" />
                                  </IconButton> */}
                                {/* )} */}

                                {/* Icon on right */}
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleClick(e, idx)}
                                >
                                  <KeyboardArrowDownTwoToneIcon fontSize="small" />
                                </IconButton>

                                {/* Popover for usage token */}
                                <Popover
                                  open={
                                    Boolean(anchorEl) && activeGroup === idx
                                  }
                                  anchorEl={anchorEl}
                                  onClose={handleClose}
                                  anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                  }}
                                  transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                  }}
                                  PaperProps={{
                                    sx: {
                                      p: 1,
                                      borderRadius: 2,
                                      boxShadow: 3,
                                      minWidth: 140,
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    Token Count
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      display: "block",
                                      mt: 0.5,
                                    }}
                                  >
                                    {group.tokensUsed !== null &&
                                    group.tokensUsed !== undefined
                                      ? group.tokensUsed
                                      : "N/A"}
                                  </Typography>
                                  {/* <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {usageTokens !== undefined && usageTokens !== null
                              ? usageTokens
                              : "N/A"}
                          </Typography> */}
                                </Popover>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </Box>

              {/* 👉 Footer (Always Common) */}
              <Box
                sx={{
                  mb: 0,
                  pb: "16px",
                  display: "flex",
                  p: { xs: 1, sm: 1, md: 2 }, // 🔹 Reduced padding
                  width: { xs: "92%", sm: "100%", md: "100%" },
                  // maxWidth: { xs: "100%", md: "940px" },
                  // maxWidth: { xs: "100%", sm: "95%", md: "1080px" },
                  flexDirection: "column",
                  justifyContent: "space-between",
                  // px: { xs: 2, sm: 0, md: 0}
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    bgcolor: "#fff",
                    borderRadius: "40px",
                    border: "1px solid #dcdcdc",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    flexDirection: "column",
                    width: "100%",
                    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* 📝 Input Field */}
                  <Box sx={{ width: "100%" }}>
                    <TextField
                      fullWidth
                      placeholder="Ask WrdsAI..."
                      variant="outlined"
                      size="small"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isSending || isTypingResponse}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "30px",
                          backgroundColor: "#fff",
                          height: "auto",
                          border: 0,
                          minHeight: selectedFiles.length > 0 ? "75px" : "60px",
                          padding:
                            selectedFiles.length > 0
                              ? "25px 14px 10px 14px"
                              : "4px 14px 4px 14px",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none !important", // 🔥 outline remove
                        },
                        "& .MuiOutlinedInput-input": {
                          padding: "6px 8px",
                          height: "auto",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                        },
                        "& .Mui-disabled": { opacity: 0.5 },
                        minWidth: { xs: "100%", sm: "200px" },
                        mb: { xs: 1, sm: 0 },
                      }}
                      multiline
                      maxRows={2}
                      // maxRows={selectedFiles.length > 0 ? 1 : 4}
                      InputProps={{
                        startAdornment: (
                          <>
                            {/* 📁 ATTACH ICON (Always shown) */}

                            {/* FILE BADGE SECTION */}
                            {selectedFiles.length > 0 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: "5px",
                                  left: "20px",
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                  maxWidth: "70%",
                                }}
                              >
                                {selectedFiles.map((file, index) => (
                                  <Box
                                    key={index}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      backgroundColor: "#eef3ff",
                                      borderRadius: "14px",
                                      padding: "2px 8px",
                                      border: "1px solid #1268fb",
                                      maxWidth: "120px",
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        color: "#1268fb",
                                      }}
                                    >
                                      {file.name.length > 15
                                        ? file.name.substring(0, 12) + "..."
                                        : file.name}
                                    </Typography>

                                    <IconButton
                                      size="small"
                                      onClick={() => removeFile(index)}
                                      sx={{ color: "#ff4444", ml: 0.5, p: 0 }}
                                    >
                                      <CloseIcon fontSize="inherit" />
                                    </IconButton>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </>
                        ),

                        endAdornment: (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {/*Mic Btn if needed*/}
                          </Box>
                        ),
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: isXS ? 0.5 : 1,
                      flexDirection: "raw",
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ ml: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        {/* <IconButton
                          onClick={isListening ? stopListening : startListening}
                          disabled={true}
                          sx={{
                            color: isListening ? "red" : "#1268fb",
                            mr: 0.5,
                            opacity: 0.5,
                            cursor: "not-allowed",
                          }}
                          title={
                            isListening ? "Stop recording" : "Start voice input"
                          }
                        >
                          {isListening ? (
                            <StopCircleIcon />
                          ) : (
                            <KeyboardVoiceIcon
                              sx={{
                                width: isXS ? "23px" : "25px",
                                height: isXS ? "23px" : "25px",
                              }}
                            />
                          )}
                        </IconButton> */}

                        {(isTypingResponse || isSending) && (
                          <Tooltip title="Stop generating">
                            <IconButton
                              onClick={() => {
                                isStoppedRef.current = true;
                                handleStopSmartAIProResponse();
                              }}
                              color="error"
                              sx={{ mr: 0.5, width: "9px", height: "11px" }}
                            >
                              <StopCircleIcon
                                sx={{ width: "25px", height: "25px" }}
                              />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {renderStudyChapterMenus()}

                      {/* ➤ Send Button */}
                      <IconButton
                        onClick={() => handleSend()}
                        // disabled={!input.trim() || isSending || isTypingResponse}
                        sx={{
                          bgcolor: "#2f236f",
                          color: "white",
                          width: isXS ? "30px" : "40px",
                          height: isXS ? "30px" : "40px",
                          ml: 1,
                          "&:hover": { bgcolor: "#24115f" },
                          borderRadius: "50%",
                        }}
                      >
                        <SendIcon
                          sx={{
                            width: isXS ? "15px" : "25px",
                            height: isXS ? "15px" : "25px",
                            color: "#ffffff",
                          }}
                        />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mt: 1, pt: 1, width: "100%", textAlign: "center" }}>
                  <Typography
                    sx={{
                      color: "gray",
                      fontSize: {
                        xs: "13px",
                        sm: "15px",
                        md: "16px",
                        lg: "18px",
                      },
                    }}
                  >
                    WrdsAI can make mistakes, so double-check.
                  </Typography>
                </Box>

                {/* 👉 Tagline (Always Common) */}
                {/* <Box textAlign="center" mt={1}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "14px", mt: 1 }}
                  >
                    How <strong>Wrds</strong> can help you today?
                  </Typography>
                </Box> */}
              </Box>
            </Box>
          </>
        ) : activeView === "smartAi" ? (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
                width: "100%",
                maxWidth: { xs: "100%", sm: "100%", md: "100%" },
                px: { xs: 1, sm: 2, md: 11 },
                mb: 0,
                mt: "11px",
                pb: 0,
              }}
            >
              {/* 👉 Main Content (Conditional) */}
              <Box
                sx={{
                  height: "70vh",
                  // p: 2,
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  overflow: "auto",
                  p: { xs: 1, sm: 1, md: 2 }, // 🔹 Reduced padding
                  minHeight: 0, // 🔹 Important for flex scrolling
                  /* 🔹 Scrollbar hide */
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  scrollbarWidth: "none", // 🔹 Firefox
                  "-ms-overflow-style": "none", // 🔹 IE 10+
                }}
              >
                {historyLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 8,
                      height: "48.5vh",
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Loading chat history...
                      </Typography>
                    </Box>
                  </Box>
                ) : smartAIMessageGroups[0]?.length === 0 ? (
                  // Welcome Screen
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 8,
                      color: "text.secondary",
                    }}
                  >
                    {/* <leafatar
                      sx={{
                        width: 64,
                        height: 64,
                        mx: "auto",
                        mb: 2,
                        bgcolor: "#3dafe2",
                        color: "#fff",
                      }}
                    > */}
                    {/* <Logo /> */}
                    {/* </leafatar> */}

                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Welcome to the <strong>Wrds</strong>
                    </Typography>

                    {/* <Typography variant="body2">
                      Start a conversation by typing a message below.
                    </Typography> */}
                  </Box>
                ) : (
                  // Chat Messages
                  <Box sx={{ spaceY: 6, width: "100%", minWidth: 0 }}>
                    {(smartAIMessageGroups[0] || []).map((group, idx) => (
                      <Box key={idx} mb={3}>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          flexDirection={"column"}
                          alignItems={"flex-end"}
                          mb={1.5}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mr: 1,
                              // fontSize:"19px",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "18px",
                                fontFamily: "Calibri, sans-serif",
                                fontWeight: 400, // Regular weight
                              }}
                            >
                              You
                            </Typography>
                          </Box>
                          {/* <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end", // Right side ma mukse
                        alignItems:"flex-end",
                        float:"right",
                        mb: 1,
                      }}
                    > */}

                          {group.files && group.files.length > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "#f0f4ff",
                                borderRadius: "6px",
                                padding: "2px 8px",
                                border: "1px solid #2F67F6",
                                maxWidth: "120px",
                                mb: 0.5,
                                // size: "20px",
                              }}
                            >
                              <InsertDriveFile
                                sx={{
                                  fontSize: "14px",
                                  color: "#2F67F6",
                                  mr: 1,
                                }}
                              />

                              {/* <Typography
                            variant="caption"
                            sx={{
                              color: "#2F67F6",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: "11px",
                              fontWeight: "500",
                            }}
                          >
                           
                            {group.files.map((f) => f.name).join(", ")}
                          </Typography> */}
                              <Box sx={{ overflow: "hidden" }}>
                                {group.files.map((f, idx) => (
                                  <Typography
                                    key={idx}
                                    component="a"
                                    href={f.cloudinaryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="caption"
                                    sx={{
                                      color: "#2F67F6",
                                      display: "block",
                                      textDecoration: "none",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      fontSize: "11px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {/* {f.filename} ({f.wordCount}w / {f.tokenCount}t) */}
                                    {/* Try these different properties */}
                                    {f.name ||
                                      f.filename ||
                                      f.originalName ||
                                      f.fileName}{" "}
                                    {/* ({f.wordCount}w / {f.tokenCount}t) */}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )}
                          <Paper
                            sx={{
                              p: { xs: 1, sm: 1.5 },
                              bgcolor: "#2F67F6",
                              color: "#fff",
                              borderRadius: 3,
                              minWidth: "300px",
                              maxWidth: { xs: "95%", sm: "90%", md: "80%" },
                            }}
                          >
                            {editingId === group.id ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <TextField
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  multiline
                                  minRows={2}
                                  fullWidth
                                  autoFocus
                                  variant="outlined"
                                  sx={{
                                    bgcolor: "#fff",
                                    borderRadius: 1,
                                    "& .MuiInputBase-input": { color: "#000" },
                                  }}
                                />

                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                      handleSend(editText, group.id);
                                      setEditingId(null);
                                      setEditText("");
                                    }}
                                  >
                                    Save
                                  </Button>
                                </Box>
                              </Box>
                            ) : (
                              <>
                                <Typography
                                  sx={{
                                    fontSize: "19px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400,
                                  }}
                                >
                                  {group.prompt.charAt(0).toUpperCase() +
                                    group.prompt.slice(1)}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mt: 0.5,
                                  }}
                                >
                                  <Typography variant="caption">
                                    {group.time}
                                  </Typography>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <Tooltip
                                      title={
                                        copiedId === group.id
                                          ? "Copied!"
                                          : "Copy"
                                      }
                                      arrow
                                    >
                                      <IconButton
                                        size="small"
                                        sx={{
                                          color:
                                            copiedId === group.id
                                              ? "#8cff8c"
                                              : "#fff",
                                          p: "2px",
                                        }}
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            group.prompt,
                                          );
                                          setCopiedId(group.id);
                                          setTimeout(
                                            () => setCopiedId(null),
                                            1500,
                                          );
                                        }}
                                      >
                                        <ContentCopyIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Edit" arrow>
                                      <IconButton
                                        size="small"
                                        sx={{ color: "#fff", p: "2px" }}
                                        onClick={() => {
                                          setEditingId(group.id);
                                          setEditText(group.prompt);
                                        }}
                                      >
                                        <EditIcon fontSize="inherit" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </>
                            )}
                          </Paper>
                        </Box>

                        {/* AI Response */}
                        <Box>
                          {/* 🔹 Selected model name upar */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              // p: 1,
                              // borderBottom: "1px solid #e0e0e0",
                              mb: 0.5,
                              color: "text.primary",
                            }}
                          >
                            {/* <Logo /> */}
                            <Avatar
                              src={chat}
                              alt="chat"
                              sx={{
                                // border: "2px solid #4d4646ff", // lighter black (#aaa / #bbb / grey[500])
                                bgcolor: "white",
                                width: 40, // thodu mota rakho
                                height: 40,
                                p: "2px", // andar jagya
                                cursor: "pointer",
                                // pl: "1px",
                              }}
                              // onClick={() => setIsCollapsed(false)}
                            />
                            {console.log(
                              group.botName,
                              getBotDisplayName(group.botName),
                              "group",
                            )}
                            {/* ✅ Bot name + AI Assistant */}
                            <Box ml={1}>
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: "underline",
                                  fontSize: "16px",
                                }}
                              >
                                {/* {group.botName} */}
                                {/* {group.botName === "chatgpt-5-mini"
                                  ? "ChatGPT 5-Mini"
                                  : group.botName === "grok"
                                  ? "Grok 3-Mini"
                                  : group.botName === "claude-3-haiku"
                                  ? "Claude-3"
                                  : ""} */}
                                Wrds AI
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                Wrds
                              </Typography>
                            </Box>
                          </Box>

                          <Paper
                            sx={{
                              // p: 1.5,
                              p: { xs: 1, sm: 1.5 },
                              bgcolor: "#f1f6fc",
                              borderRadius: 3,
                              // maxWidth: { xs: "80%", md: "70%" },
                              maxWidth: { xs: "95%", sm: "90%", md: "80%" },
                            }}
                          >
                            <Box sx={{ mb: 2 }}>
                              {group.isTyping &&
                              [
                                "Thinking...",
                                "Analyzing...",
                                "Generating...",
                              ].includes(
                                group.responses[group.currentSlide],
                              ) ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily: "Calibri, sans-serif",
                                      fontWeight: 400,
                                    }}
                                  >
                                    {group.responses[group.currentSlide]}
                                  </Typography>
                                </Box>
                              ) : (
                                <div
                                  style={{
                                    fontSize: "19px",
                                    fontFamily: "Calibri, sans-serif",
                                    fontWeight: 400, // Regular weight
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: formatChatResponseHtml(
                                      group.responses[group.currentSlide],
                                    ),
                                  }}
                                />
                              )}
                              {renderBasicsButton(group)}
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                              }}
                            >
                              <Box>
                                {/* Time on left */}
                                <Typography
                                  variant="caption"
                                  sx={{ opacity: 0.6, mb: 0.5 }}
                                >
                                  {group.time}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                }}
                              >
                                {/* 🛑 Stop button beside token dropdown */}
                                {/* {group.isBeingProcessed && ( */}
                                {/* <IconButton
                                    size="small"
                                    onClick={stopGeneration}
                                    sx={{
                                      color: "#665c5cff",
                                      p: 0.3,
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      "&:hover": {
                                        bgcolor: "rgba(229, 57, 53, 0.1)",
                                      },
                                    }}
                                  >
                                    <StopIcon fontSize="small" />
                                  </IconButton> */}
                                {/* )} */}

                                {/* Icon on right */}
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleClick(e, idx)}
                                >
                                  <KeyboardArrowDownTwoToneIcon fontSize="small" />
                                </IconButton>

                                {/* Popover for usage token */}
                                <Popover
                                  open={
                                    Boolean(anchorEl) && activeGroup === idx
                                  }
                                  anchorEl={anchorEl}
                                  onClose={handleClose}
                                  anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                  }}
                                  transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                  }}
                                  PaperProps={{
                                    sx: {
                                      p: 1,
                                      borderRadius: 2,
                                      boxShadow: 3,
                                      minWidth: 140,
                                    },
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    Token Count
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      display: "block",
                                      mt: 0.5,
                                    }}
                                  >
                                    {group.tokensUsed !== null &&
                                    group.tokensUsed !== undefined
                                      ? group.tokensUsed
                                      : "N/A"}
                                  </Typography>
                                  {/* <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            {usageTokens !== undefined && usageTokens !== null
                              ? usageTokens
                              : "N/A"}
                          </Typography> */}
                                </Popover>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </Box>

              {/* 👉 Footer (Always Common) */}
              <Box
                sx={{
                  mb: 0,
                  pb: "16px",
                  display: "flex",
                  p: { xs: 1, sm: 1, md: 2 }, // 🔹 Reduced padding
                  width: "100%",
                  // maxWidth: { xs: "100%", md: "940px" },
                  // maxWidth: { xs: "100%", sm: "95%", md: "1080px" },
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    minHeight: "60px",
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid #e0e0e0",
                    bgcolor: "#fafafa",
                    // pb: 0.5,
                    pb: "20px",
                    position: "relative",
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                    // position: "relative",
                  }}
                >
                  {/* File Attachment Button - Positioned absolutely inside the container */}
                  {/* <IconButton
                component="label"
                sx={{
                  color: "#2F67F6",
                  position: "absolute",
                  left: "15px",
                  top: "52%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                  backgroundColor: "white",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  // boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  
                }}
              >
                <input
                  type="file"
                  hidden
                  accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.pptx,.xlsx,.csv"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                      console.log("File selected:", file);
                    }
                  }}
                />
                <AttachFileIcon fontSize="small" />
              </IconButton> */}
                  <IconButton
                    component="label"
                    sx={{
                      color: "#2F67F6",
                      position: "absolute",
                      left: "15px",
                      bottom: "34px", // 👈 bottom ma fix karva
                      zIndex: 2,
                      // backgroundColor: "white",
                      borderRadius: "50%",
                      width: "32px",
                      height: "40px",
                    }}
                  >
                    <input
                      type="file"
                      hidden
                      multiple
                      accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.pptx,.xlsx,.csv"
                      // onChange={(e) => {
                      //   const files = e.target.files;
                      //   if (files && files.length > 0) {
                      //     setSelectedFile(files); // 🔹 array of files સેટ કરો
                      //     console.log("Files selected:", files);
                      //   }
                      // }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files); // Convert FileList to Array
                        // if (files.length > 0) {
                        //   // setSelectedFiles(files);
                        //   setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
                        //   console.log("Files selected:", files);
                        // }
                        if (files.length > 0) {
                          setSelectedFiles((prevFiles) => {
                            // Limit to 5 files maximum (matches backend limit)
                            const newFiles = [...prevFiles, ...files];
                            return newFiles.slice(0, 5);
                          });
                        }
                        e.target.value = "";
                      }}
                    />
                    <AttachFileIcon fontSize="small" />
                  </IconButton>

                  {/* Main Input with extra left padding for file icon */}
                  <TextField
                    fullWidth
                    placeholder="Ask me..."
                    variant="outlined"
                    size="small"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isSending || isTypingResponse}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "25px",
                        backgroundColor: "#fff",
                        height: "auto",
                        minHeight: "67px",
                        padding:
                          selectedFiles.length > 0
                            ? "30px 14px 8.5px 37px !important"
                            : "0px !important",
                        paddingLeft: "37px !important", // Space for file icon
                        paddingTop: selectedFiles.length > 0 ? "30px" : "0px", // Adjust top padding for files
                      },
                      "& .MuiOutlinedInput-input": {
                        padding: "8px",
                        height: "auto",
                        minHeight: "24px",
                        marginTop: selectedFiles.length > 0 ? "24px" : "0px",
                      },
                      "& .Mui-disabled": {
                        opacity: 0.5,
                      },
                      fontSize: { xs: "14px", sm: "16px" },
                      minWidth: { xs: "100%", sm: "200px" },
                      mb: { xs: 1, sm: 0 },
                    }}
                    multiline
                    maxRows={selectedFiles.length > 0 ? 4 : 3}
                    InputProps={{
                      startAdornment: selectedFiles.length > 0 && ( // 🔹 selectedFiles.length તપાસો
                        <Box
                          sx={{
                            position: "absolute",
                            top: "8px",
                            left: "11px",
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap", // 🔹 Multiple files માટે wrap કરો
                            gap: 0.5, // 🔹 Files વચ્ચે gap
                            // maxWidth: "200px", // 🔹 Maximum width
                            maxWidth: "calc(100% - 50px)", // Prevent overflow
                          }}
                        >
                          {/* File Name Display */}
                          {selectedFiles.map((file, index) => (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "#f0f4ff",
                                borderRadius: "12px",
                                padding: "2px 8px",
                                border: "1px solid #2F67F6",
                                maxWidth: "120px",
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#2F67F6",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  fontSize: "11px",
                                  fontWeight: "500",
                                }}
                              >
                                {/* {file.name} */}
                                {file.name.length > 15
                                  ? file.name.substring(0, 12) + "..."
                                  : file.name}
                              </Typography>
                              <IconButton
                                size="small"
                                // onClick={() => setSelectedFiles(null)}
                                onClick={() => removeFile(index)} // 🔹 index પાસ કરો
                                sx={{ color: "#ff4444", p: 0.5, ml: 0.5 }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      ),

                      endAdornment: (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {/* 🎤 Voice Input Button */}
                          <IconButton
                            onClick={
                              isListening ? stopListening : startListening
                            }
                            sx={{
                              color: isListening ? "red" : "#10a37f",
                              mr: 0.5,
                            }}
                            title={
                              isListening
                                ? "Stop recording"
                                : "Start voice input"
                            }
                          >
                            {isListening ? (
                              <StopCircleIcon />
                            ) : (
                              <KeyboardVoiceIcon />
                            )}
                          </IconButton>

                          {/* 🛑 Stop Generating Button (for chatbot response) */}
                          {(isTypingResponse || isSending) && (
                            <Tooltip title="Stop generating">
                              <IconButton
                                onClick={() => {
                                  isStoppedRef.current = true;
                                  handleStopResponse();
                                }}
                                color="error"
                                sx={{ mr: 0.5 }}
                              >
                                <StopCircleIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      ),

                      // endAdornment: (
                      //   <IconButton
                      //     onClick={isListening ? stopListening : startListening}
                      //     sx={{
                      //       color: isListening ? "red" : "#10a37f",
                      //       mr: 1,
                      //     }}
                      //     title={
                      //       isListening ? "Stop recording" : "Start voice input"
                      //     }
                      //   >
                      //     {isListening ? <StopCircleIcon /> : <KeyboardVoiceIcon />}
                      //   </IconButton>
                      // ),
                    }}
                  />
                  {console.log("selectedFiles length:", selectedFiles.length)}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      ml: 1,
                      flexShrink: 0,
                    }}
                  >
                    <IconButton
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isSending || isTypingResponse}
                      sx={{
                        bgcolor: "#2f236f",
                        color: "#ffffff",
                        "&:disabled": {
                          opacity: 0.5,
                          cursor: "not-allowed",
                        },
                        "&:hover": {
                          bgcolor: "#24115f",
                        },
                        ml: 1,
                      }}
                    >
                      <SendIcon sx={{ color: "#ffffff" }} />
                    </IconButton>

                    {/* 🔹 Stop icon appears when AI is typing a response */}
                    {/* {isTypingResponse && (
                        <IconButton
                          onClick={() => handleStop()}
                          color="error"
                          title="Stop Response"
                          sx={{
                            ml: 1,
                            bgcolor: "#ffe6e6",
                            "&:hover": { bgcolor: "#ffcccc" },
                          }}
                        >
                          <StopIcon />
                        </IconButton>
                      )} */}
                  </Box>
                </Box>

                {/* 👉 Tagline (Always Common) */}
                <Box textAlign="center">
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "14px" }}
                  >
                    How <strong>Wrds</strong> can help you today?
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        ) : activeView === "search2" ? (
          <GrokSearchUI
            setGrokHistoryList={setGrokHistoryList}
            selectedGrokQuery={selectedGrokQuery}
            setSessionRemainingTokens={setSessionRemainingTokens}
          />
        ) : activeView === "allUserData" ? (
          <UserManagementPanel
            allUsers={allUsers}
            allUsersLoading={allUsersLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onAddUserClick={() => setAddUserOpen(true)}
            onDeleteUser={handleDeleteUser}
          />
        ) : null}
      </Box>

      <AddUserDialog
        open={addUserOpen}
        newUserData={newUserData}
        isCreatingUser={isCreatingUser}
        onClose={() => setAddUserOpen(false)}
        onDateChange={handleAddUserDateChange}
        onFieldChange={handleAddUserFieldChange}
        onCreateUser={handleAddUser}
      />

      <DeleteUserDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteUser}
      />

      <SidebarDrawer
        open={openSidebar}
        onClose={handleCloseSidebar}
        isXS={isXS}
        chatImageSrc={chat}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        setSearchSessionResults={setSearchSessionResults}
        activeView={activeView}
        teacherMode={teacherMode}
        user={User}
        createNewChat={createNewChat}
        isWrdsAIPro={isWrdsAIPro}
        disabled={disabled}
        onUpgradePlan={handleUpgradePlan}
        renderBrowsingTooltip={(icon) => (
          <CustomTooltip title="coming soon..." placement="bottom">
            {icon}
          </CustomTooltip>
        )}
        showSessionPanel={showSessionPanel}
        setShowSessionPanel={setShowSessionPanel}
        sessionLoading={sessionLoading}
        searchSessionResults={searchSessionResults}
        filteredChats={filteredChats}
        selectedChatId={selectedChatId}
        onSessionSelect={handleSidebarSessionSelect}
        formatChatTime={formatChatTime}
      />

      <ChangePasswordDialog
        open={openChangePassword}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        showCurrent={showCurrent}
        showNew={showNew}
        showConfirm={showConfirm}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onToggleCurrent={() => setShowCurrent(!showCurrent)}
        onToggleNew={() => setShowNew(!showNew)}
        onToggleConfirm={() => setShowConfirm(!showConfirm)}
        onClose={() => {
          resetChangePasswordForm();
          setOpenChangePassword(false);
        }}
        onSubmit={handleChangePassword}
      />

      <UserProfileDialog
        open={openProfile}
        onClose={() => setOpenProfile(false)}
        email={email}
        user={User}
        totalTokensUsed={totalTokensUsed}
        sessionRemainingTokens={sessionRemainingTokens}
      />
    </Box>
  );
};
export default ChatUI;



