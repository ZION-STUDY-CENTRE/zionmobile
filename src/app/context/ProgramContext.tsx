import React, { createContext, useContext, useState } from "react";

export type Program = any;

interface ProgramContextProps {
  selectedProgram: Program | null;
  setSelectedProgram: (program: Program | null) => void;
}

const ProgramContext = createContext<ProgramContextProps>({
  selectedProgram: null,
  setSelectedProgram: () => {},
});

export const ProgramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  return (
    <ProgramContext.Provider value={{ selectedProgram, setSelectedProgram }}>
      {children}
    </ProgramContext.Provider>
  );
};

export const useProgram = () => useContext(ProgramContext);
