import React, { createContext, useState, useContext, useEffect } from "react";

const GrokContext = createContext();

export const GrokProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokenCount, setTokenCount] = useState(0);

  // ✅ Initialize sessionRemainingTokens from localStorage
  const [sessionRemainingTokens, setSessionRemainingTokens] = useState(() => {
    const saved = localStorage.getItem("globalRemainingTokens");
    return saved ? Number(saved) : 0;
  });

  const [results, setResults] = useState([]);
  const [grokhistoryList, setGrokHistoryList] = useState([]);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [totalSearches, setTotalSearches] = useState(0);

  // ✅ Sync sessionRemainingTokens with localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("globalRemainingTokens", sessionRemainingTokens);
  }, [sessionRemainingTokens]);

  return (
    <GrokContext.Provider
      value={{
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
      }}
    >
      {children}
    </GrokContext.Provider>
  );
};

export const useGrok = () => useContext(GrokContext);
