import { createContext, useContext } from 'react';

export interface DateFilterContextType {
  month: number; // 1-12
  year: number;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
}

export const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
};
