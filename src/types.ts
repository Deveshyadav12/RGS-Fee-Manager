export interface Student {
  id?: number;
  serialNumber: number;
  name: string;
  fatherName?: string;
  village?: string;
  contact?: string;
  schoolFee?: number;
  busFare?: number;
  total?: number;
  apr?: number;
  may?: number;
  jun?: number;
  jul?: number;
  aug?: number;
  sep?: number;
  oct?: number;
  nov?: number;
  dec?: number;
  jan?: number;
  feb?: number;
  march?: number;
  totalReceived?: number;
  discount?: number;
  pending?: number;
  className: string;
  academicYear: string;

}

export interface ImportResult {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  academicYear?: string;
  messages?: string[];
}

export interface FeeSummary {
  academicYear: string;
  totalStudents: number;
  totalFees: number;
  totalReceived: number;
  totalPending: number;
}

export interface FeeRow {
  id?: number;
  name: string;
  className: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
}

export interface ReportSummary {
  date: string;
  academicYear: string;
  totalStudents: number;
  totalFees: number;
  totalReceived: number;
  totalPending: number;
}

export interface MonthlyReportItem {
  month: string;
  amount: number;
}

export type MonthKey =
  | "apr" | "may" | "jun" | "jul" | "aug" | "sep"
  | "oct" | "nov" | "dec" | "jan" | "feb" | "march";

export const MONTH_COLUMNS: { key: MonthKey; label: string }[] = [
  { key: "apr", label: "APR" },
  { key: "may", label: "MAY" },
  { key: "jun", label: "JUN" },
  { key: "jul", label: "JUL" },
  { key: "aug", label: "AUG" },
  { key: "sep", label: "SEP" },
  { key: "oct", label: "OCT" },
  { key: "nov", label: "NOV" },
  { key: "dec", label: "DEC" },
  { key: "jan", label: "JAN" },
  { key: "feb", label: "FEB" },
  { key: "march", label: "MARCH" },
];

export const CLASS_LABELS: Record<string, string> = {
  Nursery: "Nursery",
  NUR: "Nursery",
  LKG: "LKG",
  UKG: "UKG",
  "1": "1st",
  "2": "2nd",
  "3": "3rd",
  "4": "4th",
  "5": "5th",
  "6": "6th",
  "7": "7th",
  "8": "8th",
  "9": "9th",
  "10": "10th",
  "11": "11th",
  "12": "12th",
};


