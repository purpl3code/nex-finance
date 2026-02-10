import { Goal } from '../types';
import { addMonths, differenceInMonths, parseISO, isAfter } from 'date-fns';

export interface GoalStats {
  remaining: number;
  progressPercent: number;
  monthsToGoal: number | null;
  estimatedFinishDate: Date | null;
  requiredMonthlyForDeadline: number | null;
  isDelayed: boolean;
}

export const computeGoalStats = (goal: Goal): GoalStats => {
  const today = new Date();
  const currentAmount = Math.max(0, goal.currentAmount);
  const targetAmount = Math.max(0, goal.targetAmount);
  const remaining = Math.max(0, targetAmount - currentAmount);
  const progressPercent = targetAmount > 0 ? Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100)) : 0;

  // 1. Estimation based on Contribution
  let monthsToGoal: number | null = null;
  let estimatedFinishDate: Date | null = null;

  if (remaining === 0) {
    monthsToGoal = 0;
    estimatedFinishDate = today;
  } else if (goal.monthlyContribution > 0) {
    monthsToGoal = Math.ceil(remaining / goal.monthlyContribution);
    // Estimate from TODAY, not start date, because we are projecting the future
    estimatedFinishDate = addMonths(today, monthsToGoal);
  }

  // 2. Required for Deadline
  let requiredMonthlyForDeadline: number | null = null;
  let isDelayed = false;

  if (goal.deadline && remaining > 0) {
    const deadlineDate = parseISO(goal.deadline);
    const monthsUntilDeadline = differenceInMonths(deadlineDate, today);
    
    if (monthsUntilDeadline <= 0) {
      // Deadline passed or is this month
      requiredMonthlyForDeadline = remaining; 
      if (remaining > 0) isDelayed = true;
    } else {
      requiredMonthlyForDeadline = Math.ceil(remaining / monthsUntilDeadline);
    }
  }

  return {
    remaining,
    progressPercent,
    monthsToGoal,
    estimatedFinishDate,
    requiredMonthlyForDeadline,
    isDelayed
  };
};

export const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
