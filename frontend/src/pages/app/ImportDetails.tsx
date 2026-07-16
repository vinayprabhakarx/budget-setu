import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { useToast } from '../../context/ToastContext';
import { StateDisplay } from '../../components/shared/StateDisplay';
import { ImportDetailsSkeleton } from '../../components/skeletons/ImportDetailsSkeleton';
import { formatCurrency } from '../../utils/currency';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/shared/Table';

interface TransactionDetail {
  transactionId: string;
  date: string;
  amount: string;
  type: string;
  payee: string;
  description: string;
  rawRow: string;
}

interface SkippedDetail {
  reason: string;
  rawRow: string;
  collidedWith: TransactionDetail | null;
}

interface FailedDetail {
  reason: string;
  rawRow: string;
}

interface ImportDetailsResponse {
  imported: TransactionDetail[];
  skipped: SkippedDetail[];
  failed: FailedDetail[];
}

interface UnifiedRow {
  id: string;
  type: 'IMPORTED' | 'SKIPPED' | 'FAILED';
  date: string;
  payee: string;
  amount: number;
  isIncome: boolean;
  reason?: string;
  rawRow?: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Import Details Page Component
 * 
 * Shows the granular results of a specific import job.
 * Displays which transactions were successfully imported, which were skipped as duplicates, and any errors.
 */
export const ImportDetails: React.FC = () => {
  const { importId } = useParams<{ importId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const fileName = location.state?.fileName || 'Import Details';
  const completedAt = location.state?.completedAt;
  const sourceName = location.state?.sourceName;

  const [filter, setFilter] = useState<'ALL' | 'IMPORTED' | 'SKIPPED' | 'FAILED'>('ALL');
  const [details, setDetails] = useState<ImportDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!importId) return;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<ImportDetailsResponse>(`/import/${importId}/details`);
        setDetails(response.data);
      } catch (err) {
        console.error('Failed to fetch import details:', err);
        setError('Could not load import details. Please try again.');
        showToast('error', 'Could not load import details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [importId, showToast]);

  const allRows: UnifiedRow[] = useMemo(() => {
    if (!details) return [];
    const rows: UnifiedRow[] = [];
    details.imported.forEach(tx => {
      rows.push({
        id: `imported-${tx.transactionId}`,
        type: 'IMPORTED',
        date: tx.date,
        payee: tx.payee || tx.description,
        amount: parseFloat(tx.amount) || 0,
        isIncome: tx.type === 'INCOME',
      });
    });
    details.skipped.forEach((skip, i) => {
      rows.push({
        id: `skipped-${i}`,
        type: 'SKIPPED',
        date: skip.collidedWith?.date || '',
        payee: skip.collidedWith?.payee || skip.collidedWith?.description || 'Unknown',
        amount: parseFloat(skip.collidedWith?.amount || '0') || 0,
        isIncome: skip.collidedWith?.type === 'INCOME',
        reason: skip.reason,
        rawRow: skip.rawRow,
      });
    });
    // Failed rows are intentionally ignored as per user request

    return rows;
  }, [details]);

  const filteredRows = useMemo(() => {
    return allRows.filter(row => filter === 'ALL' || row.type === filter);
  }, [allRows, filter]);

  const tabClass = (active: boolean) =>
    `text-body-lg font-semibold px-2 py-1 border-b-2 transition-colors whitespace-nowrap ${
      active ? 'border-primary text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
    }`;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl lg:text-3xl font-semibold text-text-primary">Import Details</h2>
          <p className="text-body-sm text-text-secondary mt-0.5">{fileName}</p>
          {(sourceName || completedAt) && (
            <div className="flex flex-wrap items-center gap-x-2 mt-0.5 text-body-xs text-text-muted">
              {sourceName && <span>{sourceName === 'AUTO' ? 'Auto-Detected' : sourceName}</span>}
              {sourceName && completedAt && <span>&bull;</span>}
              {completedAt && (
                <span>
                  {new Date(completedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* States */}
      {loading ? (
        <ImportDetailsSkeleton />
      ) : error ? (
        <StateDisplay type="error" title="Failed to load" description={error} className="min-h-[40vh]" />
      ) : details ? (
        <>
          {/* Tab Navigation */}
          <section className="flex border-b border-border-muted pb-4">
            <div className="flex gap-4 overflow-x-auto hide-scrollbar">
              <button onClick={() => setFilter('ALL')} className={tabClass(filter === 'ALL')}>
                All ({allRows.length})
              </button>
              <button onClick={() => setFilter('IMPORTED')} className={tabClass(filter === 'IMPORTED')}>
                Imported ({details.imported.length})
              </button>
              <button onClick={() => setFilter('SKIPPED')} className={tabClass(filter === 'SKIPPED')}>
                Skipped ({details.skipped.length})
              </button>
            </div>
          </section>

          {filteredRows.length === 0 ? (
            <StateDisplay
              type="empty"
              title="No transactions found"
              description={`There are no transactions in the "${filter}" category.`}
              className="py-16"
              action={
                filter !== 'ALL' 
                  ? { label: "View All", onClick: () => setFilter('ALL') } 
                  : { label: "Upload New Statement", href: "/import" }
              }
            />
          ) : (
            <section className="card p-0 overflow-hidden mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map(row => {
                    const isNegative = !row.isIncome;
                    return (
                      <TableRow
                        key={row.id}
                        className="text-body-md"
                      >
                        {/* Date */}
                        <TableCell className="text-body-md text-text-secondary whitespace-nowrap">
                          {row.date ? formatDate(row.date) : '—'}
                        </TableCell>

                        {/* Payee */}
                        <TableCell className="text-body-lg font-semibold text-text-primary">
                          <span>{row.payee}</span>
                        </TableCell>

                        {/* Amount — same num classes as Transactions */}
                        <TableCell className={`text-right num text-mono-lg font-bold whitespace-nowrap ${
                          isNegative
                            ? 'num-negative'
                            : 'num-positive'
                        }`}>
                          {`${isNegative ? '−' : '+'}${formatCurrency(row.amount)}`}
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className="whitespace-nowrap">
                          {row.type === 'IMPORTED' && (
                            <span className="badge text-body-sm font-medium px-2.5 py-0.5 rounded-md bg-income/10 text-income inline-flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" /> Imported
                            </span>
                          )}
                          {row.type === 'SKIPPED' && (
                            <span className="badge text-body-sm font-medium px-2.5 py-0.5 rounded-md bg-warning/15 text-warning inline-flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" /> Skipped
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
};
