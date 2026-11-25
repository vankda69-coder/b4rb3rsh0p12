import type { AppointmentStatus } from '../types/barbershop';

export const TODAY_ISO = '2026-11-25';
export const TOMORROW_ISO = '2026-11-26';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatShortDate(isoDate: string): string {
  if (isoDate === TODAY_ISO) return 'Hoy, 25 nov';
  if (isoDate === TOMORROW_ISO) return 'Mañana, 26 nov';

  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  const formatted = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: year !== 2026 ? 'numeric' : undefined,
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatFullDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  const formatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatRelativeTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
  }
}

export function getStatusTextClass(status: AppointmentStatus): string {
  switch (status) {
    case 'pending':
      return 'text-amber-700';
    case 'confirmed':
      return 'text-emerald-700';
    case 'completed':
      return 'text-zinc-900';
    case 'cancelled':
      return 'text-red-700';
  }
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
