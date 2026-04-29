import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Date formatting
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate invite code
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Calculate monthly payment
export function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  months: number
): number {
  if (monthlyRate === 0) return principal / months;
  const payment =
    (principal *
      (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment * 100) / 100;
}

// Calculate interest rate monthly
export function getMonthlyRate(annualRate: number): number {
  return annualRate / 100 / 12;
}

// Phone validation (Kenya)
export function isValidPhoneNumber(phone: string): boolean {
  const kenyanPhoneRegex = /^(?:\+254|0)?([17]\d{8})$/;
  return kenyanPhoneRegex.test(phone.replace(/\s/g, ''));
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Format phone to E.164
export function formatPhoneE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return '+254' + cleaned.substring(1);
  }
  if (cleaned.length === 9) {
    return '+254' + cleaned;
  }
  return '+' + cleaned;
}

// Credit score color
export function getCreditScoreColor(
  score: number
): 'green' | 'yellow' | 'red' {
  if (score >= 75) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

// Status color
export function getStatusColor(
  status: string
): 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' {
  const colors: Record<string, any> = {
    active: 'green',
    inactive: 'gray',
    suspended: 'red',
    pending: 'yellow',
    approved: 'green',
    paid: 'blue',
    overdue: 'red',
    success: 'green',
    failed: 'red',
  };
  return colors[status] || 'gray';
}

// Get month name
export function getMonthName(month: number): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[month - 1] || 'Unknown';
}

// Truncate text
export function truncate(text: string, length: number = 50): string {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// Check if today
export function isToday(date: string | Date): boolean {
  const today = new Date();
  const d = new Date(date);
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

// Days until date
export function daysUntil(date: string | Date): number {
  const today = new Date();
  const d = new Date(date);
  const diff = d.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Percentage change
export function percentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
