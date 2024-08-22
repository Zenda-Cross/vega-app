// ThemeContext.js
import React, {createContext, useState, useContext} from 'react';

const ThemeContext = createContext('#FF6347');

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const [primaryColor, setPrimaryColor] = useState('#FF6347');

  return (
    <ThemeContext.Provider value={{primaryColor, setPrimaryColor}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
