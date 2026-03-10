import React, { createContext, useContext, useState, useCallback } from "react";

const TeamPanelContext = createContext();

export function TeamPanelProvider({ children }) {
  const [showPanel, setShowPanel] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState(null);

  const togglePanel = useCallback(() => {
    setShowPanel((prev) => !prev);
  }, []);

  const openTeam = useCallback((id) => {
    setActiveTeamId(id);
  }, []);

  const closePanel = useCallback(() => {
    setShowPanel(false);
    setActiveTeamId(null);
  }, []);

  const goBackToList = useCallback(() => {
    setActiveTeamId(null);
  }, []);

  return (
    <TeamPanelContext.Provider
      value={{
        showPanel,
        activeTeamId,
        togglePanel,
        openTeam,
        closePanel,
        goBackToList,
      }}
    >
      {children}
    </TeamPanelContext.Provider>
  );
}

export function useTeamPanel() {
  const ctx = useContext(TeamPanelContext);
  if (!ctx)
    throw new Error("useTeamPanel must be used within TeamPanelProvider");
  return ctx;
}
