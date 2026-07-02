import React, { useState } from 'react';
import { Plus, Trash2, X, Edit2, Coins, Trophy, Calendar } from 'lucide-react';
import { Select } from '../../../components/shared/Select';
import { SavingsGoalsSkeleton } from "../../../components/skeletons/SavingsGoalsSkeleton";
import { StateDisplay } from '../../../components/shared/StateDisplay';
import { formatCurrency } from '../../../utils/currency';
import type { Goal } from './types';
import api from '../../../api/axiosInstance';
import { useToast } from '../../../context/ToastContext';

interface Props {
  goals: Goal[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Savings Goals Sub-Component
 * 
 * Manages long-term or short-term savings targets.
 * Tracks current savings progress against the target amount and deadline.
 */
export const SavingsGoals: React.FC<Props> = ({ goals, loading, onRefresh }) => {
  const { showToast } = useToast();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');

  const openCreate = () => {
    setActiveGoal(null); setGoalName(''); setTargetAmount(''); setTargetDate(''); setPriority('MEDIUM'); setDescription('');
    setIsGoalModalOpen(true);
  };
  const openEdit = (g: Goal) => {
    setActiveGoal(g); setGoalName(g.name); setTargetAmount(g.targetAmount.toString()); setTargetDate(g.targetDate || ''); setPriority(g.priority || 'MEDIUM'); setDescription(g.description || '');
    setIsGoalModalOpen(true);
  };
  const openContribute = (g: Goal) => { setContributionGoal(g); setContributionAmount(''); setIsContributeOpen(true); };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) return showToast('warning', 'Please enter a name for the goal.');
    if (!targetAmount || Number(targetAmount) <= 0) return showToast('warning', 'Please enter a valid target amount.');
    setSubmitting(true);
    try {
      const payload = { name: goalName.trim(), targetAmount: Number(targetAmount), targetDate: targetDate || undefined, priority, description };
      if (activeGoal) { await api.put(`/goals/${activeGoal.id}`, payload); showToast('success', 'Goal updated.'); }
      else { await api.post('/goals', payload); showToast('success', 'New savings goal configured.'); }
      setIsGoalModalOpen(false);
      onRefresh();
    } catch { showToast('error', 'Failed to save savings goal.'); }
    finally { setSubmitting(false); }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionGoal || !contributionAmount || Number(contributionAmount) <= 0) return;
    setSubmitting(true);
    try {
      await api.post(`/goals/${contributionGoal.id}/contribute`, { amount: Number(contributionAmount) });
      showToast('success', `Contributed to "${contributionGoal.name}"!`);
      setIsContributeOpen(false);
      onRefresh();
      window.dispatchEvent(new CustomEvent('transaction-added'));
    } catch { showToast('error', 'Failed to allocate contribution.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this savings goal? All accumulated progress records will be cleared.')) return;
    try {
      await api.delete(`/goals/${id}`);
      showToast('success', 'Goal removed.');
      onRefresh();
    } catch { showToast('error', 'Failed to remove goal.'); }
  };

  return (
    <>
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4.5 w-4.5" /><span>New Target</span>
        </button>
      </div>

      {loading ? (
        <SavingsGoalsSkeleton />
      ) : goals.length === 0 ? (
        <StateDisplay type="empty" title="No savings goals configured" className="py-12" action={{ label: "New Target", onClick: openCreate }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(g => {
            const isCompleted = g.completed;
            return (
              <div key={g.id} className="card p-6 flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-text-primary text-body-md flex items-center gap-2">
                        <span>{g.name}</span>
                        {isCompleted && <Trophy className="h-4 w-4 text-income" />}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs font-semibold tracking-wider uppercase rounded ${g.priority === 'HIGH' ? 'badge-expense' : g.priority === 'LOW' ? 'badge-income' : 'badge-warning'}`}>{g.priority || 'MEDIUM'}</span>
                    </div>
                    {g.description && <p className="text-body-sm text-text-secondary">{g.description}</p>}
                    {g.targetDate && (
                      <p className="text-body-sm text-text-secondary flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Target: {new Date(g.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-md hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-md hover:bg-destructive-bg text-text-secondary hover:text-destructive transition-colors cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-text-secondary">Saved: <b className="num text-text-primary font-medium">{formatCurrency(g.currentAmount)}</b></span>
                    <span className="text-text-secondary">Target: <b className="num text-text-primary font-medium">{formatCurrency(g.targetAmount)}</b></span>
                  </div>
                  <div className="h-2 w-full bg-bg-subtle rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-deliberate ease-standard ${isCompleted ? 'bg-income' : 'bg-brand'}`} style={{ width: `${Math.min(g.percentageComplete, 100)}%` }} />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[0.6875rem]">
                    <span className={`font-semibold ${isCompleted ? 'text-income' : 'text-brand'}`}>{g.percentageComplete.toFixed(0)}% Achieved</span>
                    {g.daysRemaining !== null && g.daysRemaining > 0 && !isCompleted && <span className="text-text-muted">{g.daysRemaining} days left</span>}
                    {isCompleted && <span className="text-income font-semibold">Goal Complete! 🎉</span>}
                  </div>
                </div>
                {!isCompleted && (
                  <button onClick={() => openContribute(g)} className="btn btn-secondary w-full flex items-center justify-center gap-1.5 py-2">
                    <Coins className="h-4 w-4" /><span>Allocate Savings</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background card w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-body-lg font-semibold text-text-primary">{activeGoal ? 'Modify Savings Target' : 'Define Savings Target'}</h2>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleGoalSubmit}>
              <div className="p-4 space-y-4">
                <div><label className="block text-body-sm text-text-secondary mb-1">Goal Name *</label><input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} className="input" required /></div>
                <div><label className="block text-body-sm text-text-secondary mb-1">Target Amount *</label><input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="input" required /></div>
                <div><label className="block text-body-sm text-text-secondary mb-1">Target Date (Optional)</label><input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="input" /></div>
                <div><label className="block text-body-sm text-text-secondary mb-1">Priority</label><Select value={priority} onChange={setPriority} options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }]} /></div>
                <div><label className="block text-body-sm text-text-secondary mb-1">Description (Optional)</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input" rows={2}></textarea></div>
              </div>
              <div className="p-4 border-t border-border flex justify-end gap-3 bg-background-alt/30">
                <button type="button" onClick={() => setIsGoalModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Saving...' : 'Save Goal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isContributeOpen && contributionGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background card w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-body-lg font-semibold text-text-primary">Allocate Savings</h2>
              <button onClick={() => setIsContributeOpen(false)} className="text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleContributeSubmit}>
              <div className="p-4 space-y-4">
                <p className="text-body-sm text-text-secondary">Allocate funds to <b>{contributionGoal.name}</b>.</p>
                <div><label className="block text-body-sm text-text-secondary mb-1">Contribution Amount *</label><input type="number" step="0.01" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} className="input" autoFocus required /></div>
              </div>
              <div className="p-4 border-t border-border flex justify-end gap-3 bg-background-alt/30">
                <button type="button" onClick={() => setIsContributeOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Processing...' : 'Transfer Funds'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
