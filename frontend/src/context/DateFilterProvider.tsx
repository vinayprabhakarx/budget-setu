import React, { useState } from 'react';
import { DateFilterContext } from './DateFilterContext';

export const DateFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [year, setYear] = useState(today.getFullYear());

  return (
    <DateFilterContext.Provider value={{ month, year, setMonth, setYear }}>
      {children}
    </DateFilterContext.Provider>
  );
};
