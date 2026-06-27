import type { Student } from "../types";

export function num(value?: number | null): number {
  return value ?? 0;
}

export function calcTotal(student: Student): number {
  return num(student.schoolFee) + num(student.busFare);
}

export function calcTotalReceived(student: Student): number {
  return (
    num(student.apr) + num(student.may) + num(student.jun) + num(student.jul) +
    num(student.aug) + num(student.sep) + num(student.oct) + num(student.nov) +
    num(student.dec) + num(student.jan) + num(student.feb) + num(student.march)
  );
}

export function emptyStudent(className: string, academicYear: string, serialNumber: number): Student {
  return {
    serialNumber,
    name: "",
    fatherName: "",
    village: "",
    contact: "",
    schoolFee: 0,
    busFare: 0,
    apr: 0,
    may: 0,
    jun: 0,
    jul: 0,
    aug: 0,
    sep: 0,
    oct: 0,
    nov: 0,
    dec: 0,
    jan: 0,
    feb: 0,
    march: 0,
    discount: 0,
    className,
    academicYear,
  };
}
