import { Debt } from '../types';
import { addMonths, parseISO } from 'date-fns';

export interface DebtStats {
  remaining: number;
  progressPercent: number;
  monthsToPayOff: number | null;
  estimatedPayOffDate: Date | null;
  isOverdue: boolean;
}

export const computeDebtStats = (debt: Debt): DebtStats => {
  const today = new Date();
  const paidAmount = Math.max(0, debt.paidAmount);
  const totalAmount = Math.max(0, debt.totalAmount);
  const remaining = Math.max(0, totalAmount - paidAmount);
  const progressPercent = totalAmount > 0 
    ? Math.min(100, Math.max(0, (paidAmount / totalAmount) * 100)) 
    : 0;

  // Estimation based on monthly payment
  let monthsToPayOff: number | null = null;
  let estimatedPayOffDate: Date | null = null;

  if (remaining === 0) {
    monthsToPayOff = 0;
    estimatedPayOffDate = today;
  } else if (debt.monthlyPayment > 0) {
    monthsToPayOff = Math.ceil(remaining / debt.monthlyPayment);
    estimatedPayOffDate = addMonths(today, monthsToPayOff);
  }

  // Overdue check
  let isOverdue = false;
  if (debt.dueDate && remaining > 0) {
    const deadlineDate = parseISO(debt.dueDate);
    if (deadlineDate <= today) {
      isOverdue = true;
    }
  }

  return {
    remaining,
    progressPercent,
    monthsToPayOff,
    estimatedPayOffDate,
    isOverdue,
  };
};

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
