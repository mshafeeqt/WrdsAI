// import React, { useState } from "react";
// import { Box, TextField, InputAdornment } from "@mui/material";
// import SearchIcon from "@mui/icons-material/Search";

// const SearchUI = () => {
//   const [query, setQuery] = useState("");

//   return (
//     <Box
//       sx={{
//         flexGrow: 1,
//         height: "100%",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center", // horizontal centering
//         justifyContent: "flex-start", // pushes content to top
//         pt: 2, // optional: adds padding from top
//         textAlign: "center",
//         color: "#555",
//       }}
//     >
//       <TextField
//         size="small"
//         variant="outlined"
//         placeholder="Search..."
//         value={query}
//         onChange={(e) => setQuery(e.target.value)}
//         sx={{
//           width: "80%",

//           backgroundColor: "#f5f5f5",

//           borderRadius: "30px",
//           "& .MuiOutlinedInput-root": {
//             borderRadius: "30px",
//           },
//         }}
//         inputProps={{
//           style: { paddingLeft: "20px" }, // 👈 shifts placeholder and text
//         }}
//         InputProps={{
//           endAdornment: (
//             <InputAdornment position="start">
//               <SearchIcon sx={{ color: "#555" }} />
//             </InputAdornment>
//           ),
//         }}
//       />
//     </Box>
//   );
// };

// export default SearchUI;

import React, { useState, useEffect } from "react";
import { TextField, InputAdornment, IconButton, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchUI(props) {
  const { setHistoryList, selectedQuery } = props;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const saved = localStorage.getItem("lastSearch");
    if (saved) {
      const { query, results } = JSON.parse(saved);
      setQuery(query);
      setResults(results);
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        console.log("Search history loaded:", data);
      } catch (err) {
        console.error("Search history fetch error:", err);
      }
    };

    fetchSearchHistory();
  }, [apiBaseUrl]);

  // ✅ Whenever dropdown selects a new query → update input field
  useEffect(() => {
    if (selectedQuery) {
      // if (selectedQuery !== null && selectedQuery !== undefined) {

      setQuery(selectedQuery);
      handleSearch();
      // Trigger the search after a small delay to ensure query updates first

      // handleSearch(); // 👈 automatically trigger search
    }
  }, [selectedQuery]);

  // Source name extraction function
  const getSourceName = (url) => {
    try {
      const domain = new URL(url).hostname.toLowerCase();

      const sourceMap = {
        "wikipedia.org": "Wikipedia",
        "en.wikipedia.org": "Wikipedia",
        "britannica.com": "Britannica",
        "www.britannica.com": "Britannica",
        "nationalgeographic.com": "National Geographic",
        "history.com": "History",
        "britishmuseum.org": "British Museum",
        "louvre.fr": "Louvre Museum",
        "google.com": "Google",
        "youtube.com": "YouTube",
        // Add more as needed
      };

      // Check for exact matches first
      if (sourceMap[domain]) {
        return sourceMap[domain];
      }

      // Check for partial matches
      for (const [key, value] of Object.entries(sourceMap)) {
        if (domain.includes(key)) {
          return value;
        }
      }

      // Fallback: extract from domain
      const cleanDomain = domain.replace("www.", "");
      const domainParts = cleanDomain.split(".");
      if (domainParts.length >= 2) {
        const mainDomain = domainParts[domainParts.length - 2];
        return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
      }

      return cleanDomain;
    } catch (error) {
      return "Website";
    }
  };

  //   const handleSearch = async () => {
  //     if (!query) return; // do nothing if query is empty
  //     setLoading(true);
  //     setError(null);

  //     try {
  //         // const response = await fetch(`${apiBaseUrl}/api/ai/ask`, {
  //       const response = await axios.post(`${apiBaseUrl}/search`, {
  //         query,
  //         email,          // optional, if you want to track user
  //         category: "general", // optional, can be dynamic
  //         raw: false,
  //       });

  //       // Set response data
  //       setResults(response.data);
  //       console.log("Search Response:", response.data);
  //     } catch (err) {
  //       console.error("Search API Error:", err);
  //       setError(err.response?.data?.error || "Something went wrong");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  const handleSearch = async () => {
    if (!query) return; // do nothing if query is empty
    setLoading(true);
    setError(null);

    const user = JSON.parse(localStorage.getItem("user"));
    const email = user?.email;

    try {
      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          email, // optional
          category: "general", // optional
          raw: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      const data = await response.json();
      setResults(data);
      // 🔹 Save to localStorage for persistence
      localStorage.setItem(
        "lastSearch",
        JSON.stringify({ query, results: data })
      );
      console.log("Search Response:", data);

      // 🔹 2. After search success → Call Search History API
      await fetch(`${apiBaseUrl}/Searchhistory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((historyData) => {
          console.log("Updated search history:", historyData);
          if (historyData.history?.length > 0)
            setHistoryList(historyData.history.map((h) => h.query));
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

  return (
    // <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <Box
      sx={{
        flexGrow: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // horizontal centering
        justifyContent: "flex-start", // pushes content to top
        pt: 2, // optional: adds padding from top
        textAlign: "center",
        color: "#555",
      }}
    >
      <TextField
        size="small"
        variant="outlined"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{
          width: "90%",
          backgroundColor: "#f5f5f5",
          borderRadius: "30px",
          "& .MuiOutlinedInput-root": { borderRadius: "30px" },
        }}
        inputProps={{
          style: { paddingLeft: "20px" }, // 👈 shifts placeholder and text
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="start">
              <IconButton onClick={handleSearch}>
                <SearchIcon sx={{ pr: 0, color: "#555" }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()} // optional: Enter key triggers search
      />

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {results && !loading && (
        <Box
          sx={{
            mt: 2,
            width: "80%",
            textAlign: "left",
            height: "95%",
            overflowY: "auto",
          }}
        >
          {/* <h3>Summary:</h3> */}
          <p
            style={{
              // fontFamily: "Arial, sans-serif",
              // fontWeight: "500",
              fontSize: "16px",
              fontFamily: "Calibri, sans-serif",
              fontWeight: 400,
            }}
          >
            {results.summary}
          </p>
          {/* <h4>Verified Links:</h4> */}

          {results.verifiedLinks.map((link, idx) => {
            const item = link.organic[0];
            if (!item) return null;

            const sourceName = getSourceName(item.link);

            return (
              <Box
                key={idx}
                sx={{
                  mb: 2,
                  p: 1,
                  borderRadius: 1,
                  //   backgroundColor: "#f9f9f9",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                {/* Source Name Badge */}
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "#e9ecef",
                    color: "#17202bff",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "500",
                    width: "fit-content",
                    mb: 0.5,
                    fontFamily: "Arial, sans-serif",
                    //  fontWeight: "bold"
                  }}
                >
                  {sourceName}
                </Box>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "14px",
                    color: "#006621",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {item.link}
                </a>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    // fontWeight: "bold",
                    fontSize: "16px",
                    color: "#1a0dab",
                    fontFamily: "Calibri, sans-serif",
                    fontWeight: 700,
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
                    color: "#555",
                    fontSize: "14px",
                    fontFamily: "Calibri, sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {item.snippet}
                </p>
              </Box>
            );
          })}

          {/* {results.verifiedLinks.map((link, idx) => {
            const item = link.organic[0]; // first organic result
            if (!item) return null;

            return (
              <Box
                key={idx}
                sx={{
                  mb: 2, // gap between links
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: "#f9f9f9",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5, // spacing between link, title, snippet
                }}
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "14px", color: "#006621" }}
                >
                  {item.link}
                </a>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontWeight: "bold",
                    fontSize: "16px",
                    color: "#1a0dab",
                  }}
                >
                  {item.title}
                </a>
                <p
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3, // limit snippet to 3 lines
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    margin: "4px 0 0 0",
                    color: "#555",
                  }}
                >
                  {item.snippet}
                </p>
               
              </Box>
            );
          })} */}
        </Box>
      )}
    </Box>
  );
}
