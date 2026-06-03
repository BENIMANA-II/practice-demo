// Single source of truth for route paths and shared option lists.
export const ROUTES = {
  landing: '/',
  login: '/login',
  register: '/register',
  recover: '/recover',
  dashboard: '/dashboard',
  products: '/products',
  warehouses: '/warehouses',
  transactions: '/transactions',
  reports: '/reports',
};

export const TRANSACTION_TYPES = [
  { value: 'STOCK_IN', label: 'Stock In' },
  { value: 'STOCK_OUT', label: 'Stock Out' },
];

export const REPORT_PERIODS = [
  { value: 'daily', label: 'Daily (Today)' },
  { value: 'weekly', label: 'Weekly (Last 7 days)' },
  { value: 'monthly', label: 'Monthly (This month)' },
];

export const SYSTEM_NAME = 'SMS';
export const SYSTEM_FULL_NAME = 'Stock Management System';
export const COMPANY_NAME = 'StockHub Ltd';
