import React, { useState, useEffect } from 'react';
import { useImportProcess } from '../../context/ImportProcessContext';
import type { ImportJobState } from '../../context/ImportProcessContext';
import { Loader2, CheckCircle, AlertCircle, X, FileUp } from 'lucide-react';

const JobIndicator: React.FC<{ job: ImportJobState; dismiss: (id: string) => void }> = ({ job, dismiss }) => {
  const { jobId, filename, stage, progress, result, errorMsg } = job;
  const [fakeProgress, setFakeProgress] = useState(0);

  const progressRef = React.useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (stage === 'PROCESSING') {
      let active = true;
      Promise.resolve().then(() => { if (active) setFakeProgress(0); });
      const interval = setInterval(() => {
        const realProgress = progressRef.current;
        setFakeProgress(prev => {
          if (realProgress >= 50) return realProgress;
          if (prev < 50) return prev + Math.random() * 15; // Fast up to 50%
          return 50; // Hold at 50% until real progress kicks in
        });
      }, 400);
      return () => { active = false; clearInterval(interval); };
    } else if (stage === 'DONE') {
      let active = true;
      Promise.resolve().then(() => { if (active) setFakeProgress(100); });
      return () => { active = false; };
    }
  }, [stage]);

  return (
    <div className="w-full sm:max-w-sm bg-bg-surface border border-border shadow-lg rounded-xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-subtle/50">
        <div className="flex items-center gap-2 truncate">
          {stage === 'UPLOADING' && <FileUp className="h-4 w-4 text-brand shrink-0" />}
          {stage === 'PROCESSING' && <Loader2 className="h-4 w-4 text-brand animate-spin shrink-0" />}
          {stage === 'DONE' && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
          {stage === 'FAILED' && <AlertCircle className="h-4 w-4 text-error shrink-0" />}
          
          <h4 className="font-semibold text-text-primary text-body-sm truncate">
            {filename}
          </h4>
        </div>
        
        <button onClick={() => dismiss(jobId)} className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-bg-subtle transition-colors shrink-0 ml-2">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {stage === 'UPLOADING' && (
          <div className="text-body-sm text-text-secondary">
            <p>Sending file securely to server...</p>
          </div>
        )}

        {stage === 'PROCESSING' && (
          <div className="space-y-2">
            <div className="flex justify-between text-body-xs text-text-secondary">
              <span>Analyzing document...</span>
              <span className="font-medium text-brand">{Math.min(99, Math.round(fakeProgress))}%</span>
            </div>
            <div className="h-1.5 w-full bg-bg-subtle rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand transition-all duration-300 ease-out" 
                style={{ width: `${Math.min(99, fakeProgress)}%` }} 
              />
            </div>
          </div>
        )}

        {stage === 'DONE' && result && (
          <div className="space-y-3">
            <p className="text-body-sm text-text-secondary">Successfully processed statement.</p>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Found</p>
                <p className="font-medium text-text-primary">{result.totalFound}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">New</p>
                <p className="font-medium text-income">+{result.newImported}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Skipped</p>
                <p className="font-medium text-text-secondary">{result.duplicatesSkipped}</p>
              </div>
            </div>
          </div>
        )}

        {stage === 'FAILED' && (
          <p className="text-body-sm text-error break-words">{errorMsg || 'An unknown error occurred.'}</p>
        )}
      </div>
    </div>
  );
};

export const GlobalImportIndicator: React.FC = () => {
  const { jobs, dismiss } = useImportProcess();
  const activeJobs = Object.values(jobs).filter(j => !j.isHidden);

  if (activeJobs.length === 0) return null;

  return (
    <div className="fixed bottom-36 sm:bottom-24 left-4 right-4 sm:left-auto sm:right-8 z-50 sm:max-w-sm sm:w-full pointer-events-none">
      {activeJobs.map((job, index) => {
        // activeJobs naturally has oldest at index 0, newest at activeJobs.length - 1
        // We want the newest to be at the front of the stack (revIdx = 0).
        const revIdx = activeJobs.length - 1 - index;
        const isHidden = revIdx > 2;
        const scale = 1 - revIdx * 0.05;
        const translateY = -(revIdx * 1); // 1rem
        const zIndex = 50 - revIdx;

        return (
          <div
            key={job.jobId}
            className="absolute bottom-0 right-0 w-full transition-all duration-400 ease-out"
            style={{
              transform: `translateY(${translateY}rem) scale(${scale})`,
              transformOrigin: 'bottom center',
              opacity: isHidden ? 0 : 1,
              pointerEvents: revIdx === 0 ? 'auto' : 'none',
              zIndex
            }}
          >
            <JobIndicator job={job} dismiss={dismiss} />
          </div>
        );
      })}
    </div>
  );
};
