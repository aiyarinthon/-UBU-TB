/**
 * Utility functions for formatting dates into Thai Buddhist Era (พ.ศ.)
 */

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_LONG = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export function toThaiYear(yearCE: number): number {
  return yearCE > 2400 ? yearCE : yearCE + 543;
}

export function formatThaiDate(
  dateInput?: string | Date | null,
  options: {
    short?: boolean;
    withTime?: boolean;
    numericOnly?: boolean;
    showBuddhistPrefix?: boolean;
  } = {}
): string {
  if (!dateInput) return '-';
  
  // Clean string if needed
  const str = String(dateInput).trim();
  if (!str) return '-';

  const d = typeof dateInput === 'string' ? new Date(str) : dateInput;
  if (isNaN(d.getTime())) {
    // If it's already a formatted string or invalid date, return as-is
    return str;
  }

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const yearBE = toThaiYear(d.getFullYear());

  if (options.numericOnly) {
    const dd = String(day).padStart(2, '0');
    const mm = String(monthIdx + 1).padStart(2, '0');
    return `${dd}/${mm}/${yearBE}`;
  }

  const monthName = options.short === false ? THAI_MONTHS_LONG[monthIdx] : THAI_MONTHS_SHORT[monthIdx];
  const prefix = options.showBuddhistPrefix ? 'พ.ศ. ' : '';
  let result = `${day} ${monthName} ${prefix}${yearBE}`;

  if (options.withTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    result += ` ${hours}:${minutes} น.`;
  }

  return result;
}

export function formatThaiDateTime(dateInput?: string | Date | null): string {
  return formatThaiDate(dateInput, { short: true, withTime: true });
}

export function formatThaiDateLong(dateInput?: string | Date | null): string {
  return formatThaiDate(dateInput, { short: false });
}

export function formatThaiDateNumeric(dateInput?: string | Date | null): string {
  return formatThaiDate(dateInput, { numericOnly: true });
}

export function getTodayThaiDateDisplay(): string {
  return formatThaiDate(new Date(), { short: false });
}

export function getYearBE(dateInput: string | Date = new Date()): number {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return isNaN(d.getTime()) ? new Date().getFullYear() + 543 : toThaiYear(d.getFullYear());
}
