import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { useImportProcess } from '../../context/ImportProcessContext';
import { CheckCircle, AlertCircle, Trash2, Loader2, FileUp, ChevronRight } from 'lucide-react';
import { StateDisplay } from '../../components/shared/StateDisplay';
import { ImportHistorySkeleton } from '../../components/skeletons/ImportHistorySkeleton';
import { useNavigate } from 'react-router-dom';

interface ImportJob {
  importId: string;
  status: string;
  fileName: string;
  sourceName: string;
  totalFound?: number;
  newImported?: number;
  duplicatesSkipped?: number;
  completedAt?: string;
  progress?: number;
}

interface ImportProps {
  onUploadClick?: () => void;
}

/**
 * Import Page Component
 * 
 * Handles bulk importing of transactions via file uploads (e.g., CSV, OFX).
 * Displays a history of past imports and tracks the status of ongoing import processes.
 */
export const Import: React.FC<ImportProps> = ({ onUploadClick }) => {
  const { showToast } = useToast();
  const { jobs } = useImportProcess();
  const navigate = useNavigate();

  const [importHistory, setImportHistory] = useState<ImportJob[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const response = await api.get<ImportJob[]>('/import/history');
      setImportHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch import history:', err);
      setError('Could not load import history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
    window.addEventListener('import-history-updated', fetchHistory);
    return () => window.removeEventListener('import-history-updated', fetchHistory);
  }, []);

  const handleDelete = async (importId: string) => {
    if (!window.confirm('Are you sure you want to delete this imported statement and all of its imported transactions? This action cannot be undone.')) {
      return;
    }

    setDeletingId(importId);
    try {
      await api.delete(`/import/${importId}`);
      showToast('success', 'Imported statement and transactions deleted successfully.');

      // Fetch fresh history from backend
      fetchHistory();
      
      // Notify other parts of the app
      window.dispatchEvent(new CustomEvent('transactions-updated'));
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to delete import statement.');
    } finally {
      setDeletingId(null);
    }
  };

  const activeJobsList = Object.values(jobs)
    .filter(j => j.stage === 'UPLOADING' || j.stage === 'PROCESSING' || (j.stage === 'DONE' && !j.isHidden) || (j.stage === 'FAILED' && !j.isHidden))
    .map(j => {
      const historyMatch = importHistory.find(h => h.importId === j.jobId);
      return {
        importId: j.jobId,
        status: j.stage,
        fileName: j.filename,
        sourceName: historyMatch ? historyMatch.sourceName : (j.sourceName || 'AUTO'),
        completedAt: historyMatch?.completedAt,
        progress: j.progress
      } as ImportJob;
    });

  const activeJobIds = new Set(activeJobsList.map(j => j.importId));
  const filteredHistory = importHistory.filter(h => !activeJobIds.has(h.importId));

  const allJobs: ImportJob[] = [...activeJobsList, ...filteredHistory];

  return (
    <div className="space-y-6 pb-16">
      {loading && activeJobsList.length === 0 ? (
        <ImportHistorySkeleton />
      ) : error && activeJobsList.length === 0 ? (
        <section className="max-w-xl mx-auto mt-10">
          <StateDisplay type="error" title="Failed to load history" description={error} />
        </section>
      ) : allJobs.length === 0 ? (
        <section className="max-w-xl mx-auto mt-10">
          <StateDisplay
            type="empty"
            title="No imports yet"
            description="Your uploaded statements and their parsing history will appear here."
            action={onUploadClick ? {
              label: "Select File",
              onClick: onUploadClick
            } : undefined}
            icon={<FileUp className="h-10 w-10 text-text-muted opacity-50" />}
          />
        </section>
      ) : (
        <section className="bg-bg-surface border border-border shadow-sm rounded-xl overflow-hidden transition-shadow hover:shadow-md">
          <div className="px-5 sm:px-8 py-5 border-b border-border flex items-center justify-between bg-bg-subtle/30">
            <h3 className="text-display-xs font-semibold text-text-primary tracking-tight">Import History</h3>
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-text-secondary hover:text-text-primary hover:bg-bg-subtle text-body-sm font-medium transition-colors"
                title="Select File"
              >
                <FileUp className="h-4 w-4" />
                <span>Select File</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <ul className="divide-y divide-border min-w-full sm:min-w-fit">
              {allJobs.map((h, i) => (
                <li
                  key={h.importId + '_' + i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-5 sm:px-8 py-4 hover:bg-bg-subtle/30 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (h.status === 'DONE' || h.status === 'FAILED') {
                      navigate(`/accounts/import/${h.importId}`, { 
                        state: { 
                          fileName: h.fileName, 
                          completedAt: h.completedAt, 
                          sourceName: h.sourceName 
                        } 
                      });
                    }
                  }}
                >
                  <div className="flex items-start gap-3 w-full sm:w-auto">
                    <div className={`mt-0.5 shrink-0 ${h.status === 'DONE' ? 'text-income' : h.status === 'FAILED' ? 'text-expense' : 'text-brand'}`}>
                      {h.status === 'DONE' ? <CheckCircle className="h-5 w-5" /> : 
                       h.status === 'FAILED' ? <AlertCircle className="h-5 w-5" /> : 
                       <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-md font-medium text-text-primary truncate max-w-56 sm:max-w-sm">
                        {h.fileName}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 mt-0.5 text-body-xs text-text-secondary">
                        <span>{h.sourceName === 'AUTO' ? 'Auto-Detected' : h.sourceName}</span>
                        {h.completedAt && (
                          <>
                            <span>&bull;</span>
                            <span>
                              {new Date(h.completedAt).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pl-8 sm:pl-0">
                    {h.status === 'DONE' ? (
                      <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                        <div className="text-center">
                          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Found</p>
                          <p className="num font-medium text-text-primary">{h.totalFound}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">New</p>
                          <p className="num font-semibold text-income">+{h.newImported}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Skipped</p>
                          <p className="num font-medium text-warning">{h.duplicatesSkipped}</p>
                        </div>
                      </div>
                    ) : (h.status === 'PROCESSING' || h.status === 'UPLOADING') ? (
                      <div className="flex flex-col gap-2 w-full max-w-52 shrink-0">
                        <div className="flex justify-between text-body-xs text-text-secondary">
                          <span>{h.status === 'UPLOADING' ? 'Uploading...' : 'Processing...'}</span>
                          <span>{h.progress || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-bg-subtle rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand transition-all duration-300" 
                            style={{ width: `${h.progress || 0}%` }} 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 shrink-0 sm:ml-4 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-border">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(h.importId);
                          }}
                          disabled={deletingId === h.importId}
                          className="p-2 text-text-muted hover:text-expense hover:bg-expense/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete imported statement and its transactions"
                        >
                          {deletingId === h.importId ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                        {(h.status === 'DONE' || h.status === 'FAILED') && (
                          <div className="p-2 text-text-muted group-hover:text-text-primary transition-colors">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
};
