import { Box, Divider, Menu, MenuItem, Typography, IconButton } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export default function StudyChapterMenus({
  isCBSEActive,
  chapterError,
  isXS,
  selectedChapterMeta,
  studyMenuAnchorEl,
  isStudyMenuOpen,
  onCloseStudyMenus,
  chaptersLoading,
  chapterStructure,
  onStudyClassOpen,
  selectedClass,
  studyClassMenuAnchorEl,
  activeStudyClass,
  onCloseStudyClassMenu,
  onStudySubjectOpen,
  selectedSubject,
  studySubjectMenuAnchorEl,
  activeStudySubject,
  onCloseStudySubjectMenu,
  onStudyChapterSelect,
  selectedChapter,
  onStudyTriggerClick,
  onDeselectChapter,
}) {
  return (
    <>
      <Box
        onClick={onStudyTriggerClick}
        sx={{
          minWidth: isCBSEActive ? { xs: "120px", sm: "160px" } : { xs: "80px", sm: "100px" },
          maxWidth: "320px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          bgcolor: isCBSEActive ? "rgba(18, 104, 251, 0.08)" : "#ffffff",
          border: chapterError
            ? "1.5px solid #ef4444"
            : isCBSEActive
              ? "1.5px solid #1268fb"
              : "1.5px solid rgba(15, 23, 42, 0.08)",
          borderRadius: "999px",
          pl: 1.5,
          pr: isCBSEActive ? 0.5 : 1.5,
          py: 0.75,
          cursor: "pointer",
          height: "38px",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isCBSEActive ? "0 4px 12px rgba(18, 104, 251, 0.12)" : "none",
          "&:hover": {
            bgcolor: isCBSEActive ? "rgba(18, 104, 251, 0.12)" : "#f8fafc",
            borderColor: isCBSEActive ? "#1268fb" : "rgba(15, 23, 42, 0.2)",
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0px)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <AutoStoriesRoundedIcon
            sx={{
              fontSize: 18,
              color: isCBSEActive ? "#1268fb" : "rgba(15, 23, 42, 0.6)",
            }}
          />
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: isCBSEActive ? "#1268fb" : "#1e293b",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {isCBSEActive && selectedChapterMeta
              ? `Study: ${selectedChapterMeta.name}`
              : "Study"}
          </Typography>
        </Box>

        {isCBSEActive ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDeselectChapter();
            }}
            sx={{
              padding: "2px",
              bgcolor: "rgba(18, 104, 251, 0.1)",
              "&:hover": {
                bgcolor: "rgba(18, 104, 251, 0.2)",
              },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 14, color: "#1268fb" }} />
          </IconButton>
        ) : (
          <KeyboardArrowDownIcon
            sx={{
              fontSize: 18,
              color: "rgba(15, 23, 42, 0.4)",
              transition: "transform 0.3s",
              transform: isStudyMenuOpen ? "rotate(180deg)" : "none",
            }}
          />
        )}
      </Box>


      <Menu
        anchorEl={studyMenuAnchorEl}
        open={isStudyMenuOpen}
        onClose={onCloseStudyMenus}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
            border: "1px solid rgba(15, 23, 42, 0.05)",
            overflow: "visible",
            "& .MuiMenuItem-root": {
              fontSize: "13.5px",
              py: 1.25,
              px: 2,
              mx: 0.5,
              borderRadius: "8px",
              transition: "0.2s",
              "&:hover": {
                bgcolor: "rgba(18, 104, 251, 0.05)",
                color: "#1268fb",
              },
            },
          },
        }}

      >
        <MenuItem
          disabled
          sx={{
            opacity: 1,
            color: "rgba(17, 24, 39, 0.52)",
            fontWeight: 600,
          }}
        >
          Select class
        </MenuItem>
        <Divider />
        {chaptersLoading ? (
          <MenuItem disabled>Loading classes...</MenuItem>
        ) : chapterStructure.length > 0 ? (
          chapterStructure.map((classItem) => (
            <MenuItem
              key={classItem.id}
              onClick={(event) => onStudyClassOpen(event, classItem)}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                fontWeight: selectedClass === classItem.id ? 600 : 400,
              }}
            >
              {classItem.name}
              <KeyboardArrowRightIcon fontSize="small" />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No classes found</MenuItem>
        )}
      </Menu>

      <Menu
        anchorEl={studyClassMenuAnchorEl}
        open={Boolean(studyClassMenuAnchorEl && activeStudyClass)}
        onClose={onCloseStudyClassMenu}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            minWidth: 220,
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
            border: "1px solid rgba(15, 23, 42, 0.05)",
            "& .MuiMenuItem-root": {
              fontSize: "13.5px",
              py: 1.25,
              px: 2,
              mx: 0.5,
              borderRadius: "8px",
              transition: "0.2s",
              "&:hover": {
                bgcolor: "rgba(18, 104, 251, 0.05)",
                color: "#1268fb",
              },
            },
          },
        }}

      >
        <MenuItem
          onClick={onCloseStudyClassMenu}
          sx={{
            color: "rgba(17, 24, 39, 0.7)",
            gap: 1,
            fontWeight: 600,
          }}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
          Back to classes
        </MenuItem>
        <Divider />
        {activeStudyClass?.subjects?.length ? (
          activeStudyClass.subjects.map((subjectItem) => (
            <MenuItem
              key={subjectItem.id}
              onClick={(event) => onStudySubjectOpen(event, subjectItem)}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
                fontWeight: selectedSubject === subjectItem.id ? 600 : 400,
              }}
            >
              {subjectItem.name}
              <KeyboardArrowRightIcon fontSize="small" />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No subjects found</MenuItem>
        )}
      </Menu>

      <Menu
        anchorEl={studySubjectMenuAnchorEl}
        open={Boolean(studySubjectMenuAnchorEl && activeStudySubject)}
        onClose={onCloseStudySubjectMenu}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxWidth: 360,
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
            border: "1px solid rgba(15, 23, 42, 0.05)",
            "& .MuiMenuItem-root": {
              whiteSpace: "normal",
              wordBreak: "break-word",
              lineHeight: 1.4,
              fontSize: "13.5px",
              py: 1.25,
              px: 2,
              mx: 0.5,
              borderRadius: "8px",
              transition: "0.2s",
              "&:hover": {
                bgcolor: "rgba(18, 104, 251, 0.05)",
                color: "#1268fb",
              },
            },
          },
        }}

      >
        <MenuItem
          onClick={onCloseStudySubjectMenu}
          sx={{
            color: "rgba(17, 24, 39, 0.7)",
            gap: 1,
            fontWeight: 600,
          }}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
          Back to subjects
        </MenuItem>
        <Divider />
        {activeStudySubject?.chapters?.length ? (
          activeStudySubject.chapters.map((chapterItem) => (
            <MenuItem
              key={chapterItem.id}
              onClick={() =>
                onStudyChapterSelect(
                  activeStudyClass,
                  activeStudySubject,
                  chapterItem,
                )
              }
              sx={{
                fontWeight: selectedChapter === chapterItem.id ? 600 : 400,
                color: selectedChapter === chapterItem.id ? "#1268fb" : "#111827",
              }}
            >
              {chapterItem.name}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No chapters found</MenuItem>
        )}
      </Menu>
    </>
  );
}
