import type { FeeRow, FeeSummary, ImportResult, MonthlyReportItem, ReportSummary, Student } from "../types";
import { getToken } from "../auth/authStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const mergedOptions: RequestInit = {
    ...options,
    headers,
  };
  const response = await fetch(`${API_BASE}${path}`, mergedOptions);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  baseUrl: API_BASE,

  async getClasses(): Promise<string[]> {
    return request<string[]>("/api/classes");
  },

  async getAcademicYears(): Promise<string[]> {
    return request<string[]>("/api/academic-years");
  },

  async createAcademicYear(name: string): Promise<string[]> {
    return request<string[]>("/api/academic-years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  },

  async updateAcademicYear(oldName: string, newName: string): Promise<string[]> {
    return request<string[]>(`/api/academic-years/${encodeURIComponent(oldName)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
  },

  async deleteAcademicYear(name: string): Promise<string[]> {
    return request<string[]>(`/api/academic-years/${encodeURIComponent(name)}`, { method: "DELETE" });
  },

  async createClass(name: string): Promise<string[]> {
    return request<string[]>("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  },

  async updateClass(oldName: string, newName: string): Promise<string[]> {
    return request<string[]>(`/api/classes/${encodeURIComponent(oldName)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
  },

  async deleteClass(name: string): Promise<string[]> {
    return request<string[]>(`/api/classes/${encodeURIComponent(name)}`, { method: "DELETE" });
  },

  async getStudents(className: string, academicYear: string): Promise<Student[]> {
    const params = new URLSearchParams({ className, academicYear });
    return request<Student[]>(`/api/students?${params}`);
  },

  async createStudent(student: Student): Promise<Student> {
    return request<Student>("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student),
    });
  },

  async updateStudent(id: number, student: Student): Promise<Student> {
    return request<Student>(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student),
    });
  },

  async deleteStudent(id: number): Promise<void> {
    return request<void>(`/api/students/${id}`, { method: "DELETE" });
  },

  async getSummary(academicYear: string): Promise<FeeSummary> {
    const params = new URLSearchParams({ academicYear });
    return request<FeeSummary>(`/api/students/summary?${params}`);
  },

  async getFeeRows(academicYear: string): Promise<FeeRow[]> {
    const params = new URLSearchParams({ academicYear });
    return request<FeeRow[]>(`/api/fees?${params}`);
  },

  async payFee(id: number, amount: number): Promise<Student> {
    return request<Student>("/api/fees/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, amount }),
    });
  },

  async getDailyReport(academicYear: string): Promise<ReportSummary> {
    const params = new URLSearchParams({ academicYear });
    return request<ReportSummary>(`/api/reports/daily?${params}`);
  },

  async getMonthlyReport(academicYear: string): Promise<MonthlyReportItem[]> {
    const params = new URLSearchParams({ academicYear });
    return request<MonthlyReportItem[]>(`/api/reports/monthly?${params}`);
  },

  async importExcel(file: File, replaceExisting = false): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    const token = getToken();
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(
      `${API_BASE}/api/excel/import?replaceExisting=${replaceExisting}`,
      { method: "POST", headers, body: formData }
    );

    if (!response.ok) {
      let message = "Import failed";
      try {
        const body = await response.json();
        message = body.message ?? message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return response.json();
  },

  async login(payload: { username: string; password: string; role: string }): Promise<{ token: string; role: string }> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json();
        message = body.message ?? message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return response.json();
  },

  async exportExcel(academicYear: string, className?: string): Promise<Blob> {
    const params = new URLSearchParams({ academicYear });
    if (className) {
      params.set("className", className);
    }

    const response = await fetch(`${API_BASE}/api/excel/export?${params}`, {
      headers: tokenAwareHeaders(),
    });
    if (!response.ok) {
      throw new Error("Export failed");
    }
    return response.blob();
  },
};

function tokenAwareHeaders(): HeadersInit {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}
