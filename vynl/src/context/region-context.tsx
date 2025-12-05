import React, { createContext, useContext, useState, ReactNode } from 'react';
import { REGIONS } from '@/src/constants/regions';

interface RegionContextType {
  region: typeof REGIONS[0];
  setRegion: (region: typeof REGIONS[0]) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider = ({ children }: { children: ReactNode }) => {
  const [region, setRegion] = useState(REGIONS[0]);
  return (
    <RegionContext.Provider value={{ region, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) throw new Error('useRegion must be used within a RegionProvider');
  return context;
};
