'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { Calculator } from 'lucide-react';

interface GoalPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculate: (goalAmount: number) => Promise<void>;
  isLoading?: boolean;
  currentAmount?: number;
}

interface Calculation {
  monthly: number;
  weekly: number;
  daily: number;
}

export default function GoalPlannerModal({
  isOpen,
  onClose,
  onCalculate,
  isLoading = false,
  currentAmount = 0,
}: GoalPlannerModalProps) {
  const [targetAmount, setTargetAmount] = useState('');
  const [numMembers, setNumMembers] = useState('10');
  const [durationMonths, setDurationMonths] = useState('5');
  const [calculations, setCalculations] = useState<Calculation | null>(null);
  const [selectedOption, setSelectedOption] = useState<'monthly' | 'weekly' | 'daily' | null>(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');

    if (!targetAmount || isNaN(parseFloat(targetAmount))) {
      setError('Please enter a valid target amount');
      return;
    }

    if (!numMembers || isNaN(parseInt(numMembers)) || parseInt(numMembers) <= 0) {
      setError('Please enter a valid number of members');
      return;
    }

    if (!durationMonths || isNaN(parseInt(durationMonths)) || parseInt(durationMonths) <= 0) {
      setError('Please enter a valid duration in months');
      return;
    }

    const target = parseFloat(targetAmount);
    const members = parseInt(numMembers);
    const months = parseInt(durationMonths);

    const monthly = Math.round((target / members / months) * 100) / 100;
    const weekly = Math.round((monthly / 4) * 100) / 100;
    const daily = Math.round((weekly / 7) * 100) / 100;

    setCalculations({
      monthly: Math.max(0, monthly),
      weekly: Math.max(0, weekly),
      daily: Math.max(0, daily),
    });
    setSelectedOption(null);
  };

  const handleSelect = async (option: 'monthly' | 'weekly' | 'daily') => {
    if (!calculations) return;

    setSelectedOption(option);
    const amount = calculations[option];

    try {
      await onCalculate(amount);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update contribution amount');
    }
  };

  const handleClose = () => {
    setTargetAmount('');
    setNumMembers('10');
    setDurationMonths('5');
    setCalculations(null);
    setSelectedOption(null);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Goal Planner">
      <div className="space-y-6">
        {!calculations ? (
          <>
            <div className="space-y-4">
              <Input
                label="Target Amount (KES)"
                type="number"
                placeholder="50000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                min="0"
              />

              <Input
                label="Number of Members"
                type="number"
                placeholder="10"
                value={numMembers}
                onChange={(e) => setNumMembers(e.target.value)}
                min="1"
              />

              <Input
                label="Duration (Months)"
                type="number"
                placeholder="5"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                min="1"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
                {error}
              </p>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={handleCalculate}
              icon={<Calculator size={16} />}
            >
              Calculate Contribution
            </Button>
          </>
        ) : (
          <>
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-4">
                To reach KES {parseFloat(targetAmount).toLocaleString()} with {numMembers} members
                in {durationMonths} months
              </h3>

              <div className="grid gap-4">
                <button
                  onClick={() => handleSelect('monthly')}
                  disabled={isLoading || selectedOption !== null}
                  className="p-4 border border-slate-700 rounded-lg hover:border-grove-accent hover:bg-slate-700 transition text-left disabled:opacity-50"
                >
                  <p className="text-slate-400 text-sm mb-1">Monthly per Member</p>
                  <p className="text-2xl font-bold text-grove-accent">
                    KES {calculations.monthly.toLocaleString()}
                  </p>
                  {selectedOption === 'monthly' && isLoading && (
                    <p className="text-xs text-grove-accent mt-2">Updating...</p>
                  )}
                </button>

                <button
                  onClick={() => handleSelect('weekly')}
                  disabled={isLoading || selectedOption !== null}
                  className="p-4 border border-slate-700 rounded-lg hover:border-grove-accent hover:bg-slate-700 transition text-left disabled:opacity-50"
                >
                  <p className="text-slate-400 text-sm mb-1">Weekly per Member</p>
                  <p className="text-2xl font-bold text-grove-accent">
                    KES {calculations.weekly.toLocaleString()}
                  </p>
                  {selectedOption === 'weekly' && isLoading && (
                    <p className="text-xs text-grove-accent mt-2">Updating...</p>
                  )}
                </button>

                <button
                  onClick={() => handleSelect('daily')}
                  disabled={isLoading || selectedOption !== null}
                  className="p-4 border border-slate-700 rounded-lg hover:border-grove-accent hover:bg-slate-700 transition text-left disabled:opacity-50"
                >
                  <p className="text-slate-400 text-sm mb-1">Daily per Member</p>
                  <p className="text-2xl font-bold text-grove-accent">
                    KES {calculations.daily.toLocaleString()}
                  </p>
                  {selectedOption === 'daily' && isLoading && (
                    <p className="text-xs text-grove-accent mt-2">Updating...</p>
                  )}
                </button>
              </div>

              {currentAmount > 0 && (
                <p className="text-xs text-slate-500 mt-4">
                  Current contribution amount: KES {currentAmount.toLocaleString()}
                </p>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
                {error}
              </p>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setCalculations(null)}
              disabled={isLoading}
            >
              Back to Calculation
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
