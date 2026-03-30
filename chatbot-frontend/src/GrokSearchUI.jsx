// import React, { useState, useEffect } from "react";
// import { TextField, InputAdornment, IconButton, Box } from "@mui/material";
// import SearchIcon from "@mui/icons-material/Search";

import React, { useState, useEffect } from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  FormControl,
  Avatar,
  Typography,
  Link,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useGrok } from "./context/GrokContext";
import Swal from "sweetalert2";
import zomato from "././assets/zomato.png";
import Zomato1 from "././assets/Zomato1.png";
// import gofig from "././assets/gofig.png";
import gofig from "././assets/gofig1.png";
// import sirat from "././assets/sirat.png";
import sirat from "././assets/sirat.gif";
// import insead from "././assets/insead.png";
import insead from "././assets/insead1.png";
import search from "././assets/search_icon.png";

// import insead from "././assets/insead.png";

export default function GrokSearchUI(props) {
  const { selectedGrokQuery } = props;

  const [query, setQuery] = useState("");
  // const [results, setResults] = useState(null);
  // const [loading, setLoading] = useState(false);
  const [linkCount, setLinkCount] = useState(3); // ✅ default value = 3 links
  // const [error, setError] = useState(null);
  // const [tokenCount, setTokenCount] = useState(0);
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
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const saved = localStorage.getItem("lastGrokSearch");
    if (saved) {
      const { query, results } = JSON.parse(saved);
      setQuery(query);
      setResults(results);
      // ✅ Add this line to show token count from last search
      // setTokenCount(results.tokenUsage?.totalTokens || 0);
      setTokenCount(results.tokenUsage?.totalTokens || 0);
    }
  }, []);

  // ✅ NEW useEffect to load search history on mount
  useEffect(() => {
    const fetchSearchHistory = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const email = user?.email;
        if (!email) return;

        const res = await fetch(`${apiBaseUrl}/Searchhistory`, {
          // const res = await fetch(`${apiBaseUrl}/grokSearchhistory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        console.log("Search history loaded:", data);

        // ✅ FIX: Update dropdown list
        if (data.history?.length > 0) {
          setGrokHistoryList(data.history.map((h) => h.query));

          // ✅ NEW: Get the latest search's token count
          const latestSearch = data.history[0]; // sorted by latest if backend sorts descending
          const latestTokenCount = latestSearch?.summaryTokenCount || 0;

          // ✅ Set this token count globally
          setTokenCount(latestTokenCount);
        } else {
          setGrokHistoryList([]); // handle empty case
          setTokenCount(0);
        }
      } catch (err) {
        console.error("Search history fetch error:", err);
      }
    };

    fetchSearchHistory();
  }, [apiBaseUrl]);

  useEffect(() => {
    // if (selectedGrokQuery) {
    if (selectedGrokQuery && selectedGrokQuery.trim() !== "") {
      setQuery(selectedGrokQuery);
      // handleSearch(selectedGrokQuery);
    }
  }, [selectedGrokQuery]);

  // Source name extraction function
  //   const getSourceName = (url) => {
  //     try {
  //       const domain = new URL(url).hostname.toLowerCase();

  //       const sourceMap = {
  //         "wikipedia.org": "Wikipedia",
  //         "en.wikipedia.org": "Wikipedia",
  //         "britannica.com": "Britannica",
  //         "www.britannica.com": "Britannica",
  //         "nationalgeographic.com": "National Geographic",
  //         "history.com": "History",
  //         "britishmuseum.org": "British Museum",
  //         "louvre.fr": "Louvre Museum",
  //         "google.com": "Google",
  //         "youtube.com": "YouTube",
  //         // Add more as needed
  //       };

  //       // Check for exact matches first
  //       if (sourceMap[domain]) {
  //         return sourceMap[domain];
  //       }

  //       // Check for partial matches
  //       for (const [key, value] of Object.entries(sourceMap)) {
  //         if (domain.includes(key)) {
  //           return value;
  //         }
  //       }

  //       // Fallback: extract from domain
  //       const cleanDomain = domain.replace("www.", "");
  //       const domainParts = cleanDomain.split(".");
  //       if (domainParts.length >= 2) {
  //         const mainDomain = domainParts[domainParts.length - 2];
  //         return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
  //       }

  //       return cleanDomain;
  //     } catch (error) {
  //       return "Website";
  //     }
  //   };

  const handleSearch = async (searchQuery) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery) return;

    setLoading(true);
    setError(null);
    setTokenCount(0);

    const user = JSON.parse(localStorage.getItem("user"));
    const email = user?.email;

    try {
      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: finalQuery,
          email,
          category: "general",
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
        Swal.fire({
          title: "Restricted Search 🚫",
          text:
            data.message || "This search is not allowed for your age group.",
          icon: "warning",
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
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      if (data.remainingTokens !== undefined)
        setSessionRemainingTokens(data.remainingTokens);

      setResults(data);

      // ✅ Get token counts
      const usedTokens =
        data.summaryStats?.tokens || data.tokenUsage?.totalTokens || 0;
      setTokenCount(usedTokens);
      console.log("🔹 usedTokens:::::", usedTokens);
      // ✅ Update total tokens used
      // setTotalTokensUsed((prev) => (prev || 0) + usedTokens);

      // // ✅ Deduct used tokens from remaining
      // setSessionRemainingTokens((prev) =>
      //   Math.max(0, (prev || 0) - usedTokens)
      // );

      // ✅ Sync global totals from backend (single source of truth)
      try {
        const statsRes = await fetch(`${apiBaseUrl}/userTokenStats`, {
          method: "POST",
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
            localStorage.setItem(
              "globalRemainingTokens",
              stats.remainingTokens
            );
          }
        }
      } catch (e) {
        console.warn(
          "Failed to refresh userTokenStats after search:",
          e.message
        );
      }

      if (data.totalSearches !== undefined) {
        setTotalSearches(data.totalSearches);
        console.log("🔹 setTotalSearches:::::::", data.totalSearches);
      }

      // const currentTokens = data.tokenUsage?.totalTokens || 0;
      // setTokenCount(currentTokens);
      // setTotalTokensUsed((prev) => prev + currentTokens);

      // ✅ Deduct used tokens from remaining
      // const usedTokens = data.summaryStats?.tokens || currentTokens || 0;
      // setSessionRemainingTokens((prev) => Math.max(0, prev - usedTokens));

      localStorage.setItem(
        "lastGrokSearch",
        JSON.stringify({ query: finalQuery, results: data })
      );

      await fetch(`${apiBaseUrl}/Searchhistory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((historyData) => {
          if (historyData.history?.length > 0)
            setGrokHistoryList(historyData.history.map((h) => h.query));
        })
        .catch((err) => console.error("Search history fetch error:", err));
    } catch (err) {
      console.error("Search API Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "block", width: "100%" }}>
      <Box sx={{ width: "100%", mb: 1 }}>
        {/* search and drop down */}
        <Box
          sx={{
            position: "sticky",
            top: 85,
            bgcolor: "#fff",
            pt: 5,
            pb: 1,
            mb: 1,
            display: "flex",
            flexDirection: "row", // Ensure row layout
            width: { xs: "95%", sm: "90%", md: "67%", lg: "71%" }, // Responsive width
            margin: "0 auto", // Center horizontally
            alignItems: "center",
            justifyContent: "center", // Center content inside
            gap: 1.5,
          }}
        >
          {/* 🔹 Search TextField with icon inside */}
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search..."
            value={query}
            multiline
            minRows={2}
            maxRows={5}
            onChange={(e) => setQuery(e.target.value)}
            sx={{
              flexGrow: 1,
              backgroundColor: "#f5f5f5",
              fontFamily: "Calibri, sans-serif",
              borderRadius: "20px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "20px",
                height: "auto",
                minHeight: "67px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingRight: "1px",
              },
              "& .MuiOutlinedInput-input": {
                paddingLeft: "20px",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "Calibri, sans-serif",
                fontSize: "19px",
                alignItems: "center",
                justifyContent: "center",
              
              },
              "& .MuiInputBase-input::placeholder": {
                top: "50%",
                paddingTop: 1.5,
              },
            }}
            inputProps={{
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => handleSearch()}>
                    <img
                      src={search}
                      alt="Search"
                      height={"40px"}
                      width={"40px"}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          {/* 🔹 Dropdown on the left side */}
          <FormControl
            size="small"
            sx={{
              minWidth: 110,
              "& .MuiOutlinedInput-root": {
                borderRadius: "30px",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            <Select
              value={linkCount}
              onChange={(e) => setLinkCount(e.target.value)}
              sx={{
                fontFamily: "Calibri, sans-serif",
                fontSize: "14px",
              }}
            >
              <MenuItem value={3}>3 Links</MenuItem>
              <MenuItem value={5}>5 Links</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 🔹 token count display */}
        <Box sx={{ mt: 0, textAlign: "left", width: "85%" }}>
          <p
            style={{
              fontFamily: "Calibri, sans-serif",
              fontSize: "16px",
              color: "#555",
              display: "flex",
              fontWeight: "bold",
              justifyContent: "flex-end",
            }}
          >
            {/* Token count: {results?.summaryStats?.tokens} */}
            Token count: {tokenCount}
          </p>
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          height: "100%",
          display: "flex",
          flexDirection: { xs: "column", md: "row" }, // Column on mobile, row on desktop
          alignItems: { xs: "center", md: "flex-start" },
          justifyContent: "flex-start",
          pt: 2,
          textAlign: "center",
          color: "#555",
          gap: { xs: 3, md: 0 }, // Gap on mobile
        }}
      >
        {/* Left side logo - Hidden on mobile, visible on desktop */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" }, // Hide on mobile
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: { md: 4, lg: 6 },
            width: { md: "15%", lg: "13%" },
            maxWidth: { md: "15%", lg: "13%" },
          }}
        >
          {/* Sirat Ad */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              width: "100%",
            }}
          >
            <Link
              href="https://sirat.earth"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-block",
                textDecoration: "none",
                "&:hover": { transform: "scale(1.05)", transition: "0.3s" },
                width: "100%",
              }}
            >
              <img
                src={sirat}
                style={{
                  objectFit: "contain",
                  width: "100%",
                  height: "auto",
                  maxWidth: { md: "160px", lg: "200px" },
                  maxHeight: { md: "112px", lg: "140px" },
                }}
                alt="Sirat Logo"
              />
            </Link>
          </Box>

          {/* INSEAD Ad */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              width: "100%",
            }}
          >
            <Link
              href="https://www.insead.edu"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-block",
                textDecoration: "none",
                "&:hover": { transform: "scale(1.05)", transition: "0.3s" },
                width: "100%",
              }}
            >
              <img
                src={insead}
                style={{
                  objectFit: "contain",
                  width: "100%",
                  height: "auto",
                  maxWidth: { md: "160px", lg: "200px" },
                  maxHeight: { md: "112px", lg: "140px" },
                }}
                alt="INSEAD Logo"
              />
            </Link>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            mt: "-10px",
            width: { xs: "95%", sm: "90%", md: "70%", lg: "74%" }, // Responsive width
            textAlign: "left",
            mx: { xs: 1, sm: 2, md: 3, lg: 4 },
            // height: "95%",
            // overflowY: "auto",
          }}
        >
          {loading ? (
            <Box>Loading...</Box>
          ) : (
            <Box sx={{ textAlign: "left" }}>
              {results && (
                <p
                  style={{
                    paddingLeft: "4px",
                    fontFamily: "Calibri, sans-serif",
                    fontWeight: "400",
                    // fontSize: { xs: "16px", sm: "18px", lg: "18px" },
                    fontSize: "19px",
                    color: "#1a1717ff",
                  }}
                >
                  {results.summary}
                </p>
              )}
              {results?.verifiedLinks?.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    mb: 2,
                    p: { xs: 1, sm: 2 },
                    borderRadius: 1,
                    //   backgroundColor: "#f9f9f9",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  {/* Source Name Badge */}
                  {item?.site && (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        backgroundColor: "#e9ecef",
                        color: "#17202bff",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: { xs: "14px", sm: "15px", lg: "17px" },
                        fontWeight: "500",
                        width: "fit-content",
                        mb: 0.5,
                        fontFamily: "Calibri, sans-serif",
                        //  fontWeight: "bold"
                      }}
                    >
                      {item.site}
                    </Box>
                  )}

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      // fontSize: { xs: "14px", sm: "15px", lg: "17px" },
                      color: "#006621",
                      cursor: "pointer",
                      fontFamily: "Calibri, sans-serif",
                      fontSize: "17px",
                    }}
                  >
                    {item.link}
                  </a>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      // fontSize: { xs: "15px", sm: "16px", lg: "17px" },
                      color: "#1a0dab",
                      fontFamily: "Calibri, sans-serif",
                      fontSize: "17px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    {item.title}
                  </a>
                  <p
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      margin: "4px 0 0 0",
                      color: "#1a1717ff",
                      // fontSize: { xs: "14px", sm: "15px", lg: "16px" },
                      fontFamily: "Calibri, sans-serif",
                      fontSize: "17px",
                      fontWeight: 300,
                    }}
                  >
                    {item.snippet}
                  </p>
                  {/* Published Date */}
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      color: "#555",
                      fontSize: { xs: "12px", sm: "13px" },
                      fontFamily: "Calibri, sans-serif",
                      fontWeight: 300,
                    }}
                  >
                    {item.publishedDate}
                  </p>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Right side logo - Hidden on mobile, visible on desktop */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" }, // Hide on mobile
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: { md: 4, lg: 6 },
            width: { md: "15%", lg: "13%" },
            maxWidth: { md: "15%", lg: "13%" },
          }}
        >
          {/* Gofig Ad */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              width: "100%",
            }}
          >
            <Link
              href="https://gofig.in"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-block",
                textDecoration: "none",
                "&:hover": { transform: "scale(1.05)", transition: "0.3s" },
                width: "100%",
              }}
            >
              <img
                src={gofig}
                style={{
                  objectFit: "contain",
                  width: "100%",
                  height: "auto",
                  maxWidth: { md: "160px", lg: "200px" },
                  maxHeight: { md: "112px", lg: "140px" },
                }}
                alt="Gofig Logo"
              />
            </Link>
          </Box>

          {/* Zomato Ad */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              width: "100%",
            }}
          >
            <Link
              href="https://www.zomato.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-block",
                textDecoration: "none",
                "&:hover": { transform: "scale(1.05)", transition: "0.3s" },
                width: "100%",
              }}
            >
              <Avatar
                alt="Zomato1"
                src={Zomato1}
                sx={{
                  width: { md: 90, lg: 100 },
                  height: { md: 90, lg: 100 },
                  mb: 1,
                  border: "2px solid #ddd",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              />
            </Link>
          </Box>
        </Box>

        {/* Mobile Ads - Only show on small screens */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            justifyContent: "space-around",
            width: "100%",
            gap: 2,
            mt: 2,
            px: 2,
          }}
        >
          {/* Mobile Sirat Ad */}
          <Link
            href="https://sirat.earth"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "inline-block",
              textDecoration: "none",
              "&:hover": { transform: "scale(1.05)", transition: "0.3s" },
            }}
          >
            <img
              src={sirat}
              style={{
                height: 80,
                width: 100,
                objectFit: "contain",
              }}
              alt="Sirat Logo"
            />
          </Link>

          {/* Mobile INSEAD Ad */}
          <Link
            href="https://www.insead.edu"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "inline-block",
              textDecoration: "none",
              "&:hover": { transform: "scale(1.05)", transition: "0.3s" },
            }}
          >
            <img
              src={insead}
              style={{
                height: 80,
                width: 100,
                objectFit: "contain",
              }}
              alt="INSEAD Logo"
            />
          </Link>

          {/* Mobile Gofig Ad */}
          <Link
            href="https://gofig.in"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "inline-block",
              textDecoration: "none",
              "&:hover": { transform: "scale(1.05)", transition: "0.3s" },
            }}
          >
            <img
              src={gofig}
              style={{
                height: 80,
                width: 100,
                objectFit: "contain",
              }}
              alt="Gofig Logo"
            />
          </Link>

          {/* Mobile Zomato Ad */}
          <Link
            href="https://www.zomato.com"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "inline-block",
              textDecoration: "none",
              "&:hover": { transform: "scale(1.05)", transition: "0.3s" },
            }}
          >
            <Avatar
              alt="Zomato1"
              src={Zomato1}
              sx={{
                width: 70,
                height: 70,
                border: "2px solid #ddd",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            />
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

// INSEAD URL
// <cite class="tjvcx GvPZzd cHaqb" role="text">https://www.insead.edu</cite> insead.png

// gifig.png
// <cite class="tjvcx GvPZzd cHaqb" role="text">https://gofig.in</cite>

// zomato.png
// <cite class="qLRx3b tjvcx GvPZzd cHaqb" role="text">https://www.zomato.com<span class="ylgVCe ob9lvb" role="text"> › surat</span></cite>

// sirat.png
// <cite class="tjvcx GvPZzd cHaqb" role="text">https://sirat.earth</cite>
