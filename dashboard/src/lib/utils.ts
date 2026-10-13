import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export const formatNumber = (value: number, decimals = 0) => new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: decimals, maximumFractionDigits: decimals,
}).format(value)
export const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}시`
