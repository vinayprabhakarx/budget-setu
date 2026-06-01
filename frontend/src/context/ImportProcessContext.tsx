import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
/* eslint-disable react-refresh/only-export-components */
import api, { getAccessTokenFromMemory } from '../api/axiosInstance';

export type ImportStage = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface ImportResult {
  newImported: number;
  totalFound: number;
  duplicatesSkipped: number;
}

export interface ImportJobState {
  jobId: string;
  filename: string;
  sourceName?: string;
  stage: ImportStage;
  progress: number;
  result: ImportResult | null;
  errorMsg: string | null;
  isHidden?: boolean;
}

interface ImportProcessContextType {
  jobs: Record<string, ImportJobState>;
  startUpload: (file: File, formData: FormData, password?: string) => Promise<boolean>;
  dismiss: (jobId: string) => void;
}

const ImportProcessContext = createContext<ImportProcessContextType | undefined>(undefined);

export const ImportProcessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Record<string, ImportJobState>>({});

  const saveToHistory = useCallback((jobData: Record<string, unknown>) => {
    const userProfile = localStorage.getItem('budgetsetu_user_profile');
    const userId = userProfile ? JSON.parse(userProfile).userId : 'default';
    const saved = localStorage.getItem(`budgetsetu_imports_${userId}`);
    const history = saved ? JSON.parse(saved) : [];
    const newHistory = [jobData, ...history].slice(0, 10);
    localStorage.setItem(`budgetsetu_imports_${userId}`, JSON.stringify(newHistory));
    window.dispatchEvent(new CustomEvent('import-history-updated'));
  }, []);

  const persistActiveJobs = useCallback((currentJobs: Record<string, ImportJobState>) => {
    const activeJobs = Object.values(currentJobs)
      .filter(j => j.stage === 'PROCESSING' || j.stage === 'UPLOADING')
      .map(j => ({ jobId: j.jobId, filename: j.filename, sourceName: j.sourceName }));
    localStorage.setItem('budgetsetu_active_imports', JSON.stringify(activeJobs));
  }, []);

  const listenToStatus = useCallback((id: string, filename: string, sourceName?: string) => {
    let finalJobs: Record<string, ImportJobState> | null = null;
    setJobs(prev => {
      const next: Record<string, ImportJobState> = { ...prev, [id]: { jobId: id, filename, sourceName, stage: 'PROCESSING', progress: 0, result: null, errorMsg: null } as ImportJobState };
      finalJobs = next;
      return next;
    });
    Promise.resolve().then(() => {
      if (finalJobs) persistActiveJobs(finalJobs);
    });

    const token = getAccessTokenFromMemory() || '';
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const eventSource = new EventSource(`${apiUrl}/import/${id}/stream?token=${token}`);

    const handleComplete = async () => {
      eventSource.close();
      try {
        const { data } = await api.get(`/import/${id}/status`);
        let finalJobs: Record<string, ImportJobState> | null = null;
        
        setJobs(prev => {
          const next = { ...prev };
          if (!next[id]) return next;
          if (data.status === 'DONE') {
            next[id] = {
              ...next[id],
              stage: 'DONE',
              result: {
                newImported: data.newImported,
                totalFound: data.totalFound,
                duplicatesSkipped: data.duplicatesSkipped
              }
            };
          } else {
            next[id] = { ...next[id], stage: 'FAILED', errorMsg: data.message || 'Statement processing failed.' };
          }
          finalJobs = next;
          return next;
        });

        // Run side-effects outside of state updater
        Promise.resolve().then(() => {
          if (finalJobs) {
            persistActiveJobs(finalJobs);
          }
          if (data.status === 'DONE') {
            saveToHistory({
              importId: id,
              status: data.status,
              filename,
              sourceName: sourceName || 'AUTO',
              totalFound: data.totalFound,
              newImported: data.newImported,
              duplicatesSkipped: data.duplicatesSkipped,
              completedAt: data.completedAt || new Date().toISOString()
            });
            window.dispatchEvent(new CustomEvent('transaction-added'));
          } else {
            saveToHistory({
              importId: id,
              status: 'FAILED',
              filename,
              sourceName: sourceName || 'AUTO',
              completedAt: new Date().toISOString()
            });
          }
        });
      } catch {
        let finalJobs: Record<string, ImportJobState> | null = null;
        setJobs(prev => {
          const next = { ...prev };
          if (next[id]) {
            next[id] = { ...next[id], stage: 'FAILED', errorMsg: 'Failed to fetch final status.' };
            finalJobs = next;
          }
          return next;
        });
        Promise.resolve().then(() => {
          if (finalJobs) persistActiveJobs(finalJobs);
        });
      }
    };

    eventSource.addEventListener('progress', (event) => {
      const p = parseInt(event.data, 10);
      if (!isNaN(p)) {
        setJobs(prev => {
          if (!prev[id] || prev[id].stage !== 'PROCESSING') return prev;
          return { ...prev, [id]: { ...prev[id], progress: p } };
        });
      }
    });

    eventSource.addEventListener('complete', () => {
      handleComplete();
    });

    eventSource.onerror = () => {
      handleComplete();
    };
  }, [persistActiveJobs, saveToHistory]);

  useEffect(() => {
    const saved = localStorage.getItem('budgetsetu_active_imports');
    if (saved) {
      try {
        const activeJobs: { jobId: string, filename: string, sourceName?: string }[] = JSON.parse(saved);
        activeJobs.forEach(job => {
          // Check if not already in state
          setJobs(prev => {
            if (!prev[job.jobId]) {
              // Defer listenToStatus to avoid state updates during render or loops, actually useEffect is fine.
              setTimeout(() => listenToStatus(job.jobId, job.filename, job.sourceName), 0);
            }
            return prev;
          });
        });
      } catch (e) {
        console.error('Failed to parse active imports', e);
      }
    }
    // Clean up old single-import keys
    localStorage.removeItem('budgetsetu_current_import_id');
    localStorage.removeItem('budgetsetu_current_import_filename');
  }, [listenToStatus]);

  const startUpload = useCallback(async (file: File, formData: FormData, password?: string): Promise<boolean> => {
    const sourceName = formData.get('sourceName')?.toString() || 'AUTO';
    const tempId = 'temp_' + Math.random().toString(36).substring(2, 9);
    let finalJobsStart: Record<string, ImportJobState> | null = null;
    setJobs(prev => {
      const next = { ...prev, [tempId]: { jobId: tempId, filename: file.name, sourceName, stage: 'UPLOADING', progress: password ? 40 : 10, result: null, errorMsg: null } as ImportJobState };
      finalJobsStart = next;
      return next;
    });
    Promise.resolve().then(() => { if (finalJobsStart) persistActiveJobs(finalJobsStart); });

    try {
      const response = await api.post<{ importId: string; status: string; message: string }>(
        '/import/upload',
        formData
      );
      
      const realId = response.data.importId;
      let finalJobsSuccess: Record<string, ImportJobState> | null = null;
      setJobs(prev => {
        const next = { ...prev };
        delete next[tempId];
        finalJobsSuccess = next;
        return next;
      });
      Promise.resolve().then(() => { if (finalJobsSuccess) persistActiveJobs(finalJobsSuccess); });
      listenToStatus(realId, file.name, sourceName);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const errorMsg = e.response?.data?.message;
      if (errorMsg === 'PASSWORD_REQUIRED' || errorMsg === 'INCORRECT_PASSWORD') {
        let finalJobsPwd: Record<string, ImportJobState> | null = null;
        setJobs(prev => {
          const next = { ...prev };
          delete next[tempId];
          finalJobsPwd = next;
          return next;
        });
        Promise.resolve().then(() => { if (finalJobsPwd) persistActiveJobs(finalJobsPwd); });
      } else {
        let finalJobsErr: Record<string, ImportJobState> | null = null;
        setJobs(prev => {
          const next = { 
            ...prev, 
            [tempId]: { 
               ...prev[tempId], 
               stage: 'FAILED' as ImportStage, 
               errorMsg: errorMsg || 'Failed to upload file.' 
            } 
          };
          finalJobsErr = next;
          return next;
        });
        Promise.resolve().then(() => { if (finalJobsErr) persistActiveJobs(finalJobsErr); });
      }
      throw err;
    }
  }, [listenToStatus, persistActiveJobs]);

  const dismiss = useCallback((id: string) => {
    let finalJobsDismiss: Record<string, ImportJobState> | null = null;
    setJobs(prev => {
      const next = { ...prev };
      if (!next[id]) return prev;
      if (next[id].stage === 'DONE' || next[id].stage === 'FAILED') {
        delete next[id];
      } else {
        next[id] = { ...next[id], isHidden: true };
      }
      finalJobsDismiss = next;
      return next;
    });
    Promise.resolve().then(() => { if (finalJobsDismiss) persistActiveJobs(finalJobsDismiss); });
  }, [persistActiveJobs]);

  return (
    <ImportProcessContext.Provider value={{ jobs, startUpload, dismiss }}>
      {children}
    </ImportProcessContext.Provider>
  );
};

export const useImportProcess = () => {
  const context = useContext(ImportProcessContext);
  if (!context) throw new Error('useImportProcess must be used within ImportProcessProvider');
  return context;
};
