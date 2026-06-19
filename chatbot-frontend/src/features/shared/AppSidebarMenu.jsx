import React, { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SidebarDrawer from "../chat/components/SidebarDrawer";
import "./appSidebarMenu.css";

const noop = () => {};

export default function AppSidebarMenu({ className = "", teacherMode = false }) {
  const navigate = useNavigate();
  const isXS = useMediaQuery("(max-width:600px)");
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchSessionResults, setSearchSessionResults] = useState([]);
  const [showSessionPanel, setShowSessionPanel] = useState(false);

  return (
    <>
      <IconButton
        type="button"
        className={`app-sidebar-menu-button ${className}`}
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </IconButton>

      <SidebarDrawer
        open={open}
        onClose={() => setOpen(false)}
        isXS={isXS}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        setSearchSessionResults={setSearchSessionResults}
        activeView=""
        teacherMode={teacherMode}
        user={{}}
        createNewChat={() => {
          navigate(teacherMode ? "/teacher-home" : "/home");
          setOpen(false);
        }}
        isWrdsAIPro={false}
        disabled={false}
        renderBrowsingTooltip={(children) => children}
        showSessionPanel={showSessionPanel}
        setShowSessionPanel={setShowSessionPanel}
        sessionLoading={false}
        searchSessionResults={searchSessionResults}
        filteredChats={[]}
        selectedChatId=""
        onSessionSelect={noop}
        formatChatTime={() => ""}
      />
    </>
  );
}
