import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import { clearRole, clearToken, getRole } from "./auth/authStore";
import { ClassTabs } from "./components/ClassTabs";
import { StudentTable } from "./components/StudentTable";
import { SummaryBar } from "./components/SummaryBar";
import { Toolbar } from "./components/Toolbar";
import type { FeeRow, FeeSummary, MonthlyReportItem, ReportSummary, Student } from "./types";
import { emptyStudent } from "./utils/calculations";

const DEFAULT_YEAR = "2026-27";
type Section = "dashboard" | "students" | "fees" | "reports" | "import";

export default function App() {
  const [classes, setClasses] = useState<string[]>(["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
  const [selectedClass, setSelectedClass] = useState("Nursery");
  const [academicYear, setAcademicYear] = useState(DEFAULT_YEAR);
  const [academicYears, setAcademicYears] = useState<string[]>([DEFAULT_YEAR]);
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [dailyReport, setDailyReport] = useState<ReportSummary | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReportItem[]>([]);
  const [feeSearch, setFeeSearch] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newAcademicYearName, setNewAcademicYearName] = useState("");

  const role = getRole() ?? "ADMIN";
  const isAdmin = role === "ADMIN";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentData, summaryData, classList, yearList, feeData, reportData, monthlyData] = await Promise.all([
        api.getStudents(selectedClass, academicYear),
        api.getSummary(academicYear),
        api.getClasses(),
        api.getAcademicYears(),
        api.getFeeRows(academicYear),
        api.getDailyReport(academicYear),
        api.getMonthlyReport(academicYear),
      ]);
      setStudents(studentData);
      setSummary(summaryData);
      setFeeRows(feeData);
      setDailyReport(reportData);
      setMonthlyReports(monthlyData);
      if (classList.length > 0) {
        setClasses(sortClasses(classList));
      }
      if (yearList.length > 0) {
        setAcademicYears(sortAcademicYears(yearList));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, academicYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortClasses = (values: string[]) => {
    const unique = Array.from(new Set(values.filter(Boolean))) as string[];
    return unique.sort((left, right) => {
      const leftRank = rankClass(left);
      const rightRank = rankClass(right);
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return left.localeCompare(right, undefined, { sensitivity: "base" });
    });
  };

  const sortAcademicYears = (values: string[]) => {
    return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
  };

  const rankClass = (className: string) => {
    const normalized = className.trim().toLowerCase();
    switch (normalized) {
      case "nursery":
      case "nur":
        return 0;
      case "lkg":
        return 1;
      case "ukg":
        return 2;
      default: {
        if (/^\d+$/.test(normalized)) {
          return 3 + Number(normalized);
        }
        return 1000;
      }
    }
  };

  const filteredFeeRows = useMemo(() => {
    const search = feeSearch.trim().toLowerCase();
    return feeRows.filter((row) => {
      const matchesClass = row.className === selectedClass;
      const matchesSearch = !search || [row.name, row.className].some((value) => value.toLowerCase().includes(search));
      return matchesClass && matchesSearch;
    });
  }, [feeRows, feeSearch, selectedClass]);

  const classBreakdown = useMemo(() => {
    const grouped = new Map<string, { count: number; pending: number }>();
    students.forEach((student) => {
      const entry = grouped.get(student.className) ?? { count: 0, pending: 0 };
      entry.count += 1;
      entry.pending += Math.max(0, (student.total ?? student.schoolFee ?? 0) - (student.totalReceived ?? 0));
      grouped.set(student.className, entry);
    });
    return Array.from(grouped.entries()).map(([name, values]) => ({ name, ...values }));
  }, [students]);

  const handleSave = async (student: Student) => {
    const payload = { ...student, className: selectedClass, academicYear };
    if (student.id) {
      await api.updateStudent(student.id, payload);
      setStatus("Student updated successfully");
    } else {
      await api.createStudent(payload);
      setStatus("Student added successfully");
    }
    await loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this student?")) return;
    await api.deleteStudent(id);
    setStatus("Student deleted");
    await loadData();
  };

  const handleImport = async (file: File, replaceExisting: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.importExcel(file, replaceExisting);
      if (result.academicYear) {
        setAcademicYear(result.academicYear);
      }
      setStatus(`Import complete: ${result.importedCount} new, ${result.updatedCount} updated`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await api.exportExcel(academicYear, selectedClass);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BGS_Fees_${selectedClass}_${academicYear}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Excel exported successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    const nextSr = students.length > 0 ? Math.max(...students.map((s) => s.serialNumber)) + 1 : 1;
    const newStudent = emptyStudent(selectedClass, academicYear, nextSr);
    setStudents([...students, newStudent]);
  };

  const handleUpload = async () => {
    if (!importFile) {
      return;
    }
    await handleImport(importFile, false);
    setImportFile(null);
  };

  const handleCreateAcademicYear = async () => {
    const name = newAcademicYearName.trim();
    if (!name) {
      return;
    }
    try {
      const nextYears = sortAcademicYears(await api.createAcademicYear(name));
      setAcademicYears(nextYears);
      setAcademicYear(name);
      setNewAcademicYearName("");
      setStatus(`Academic year ${name} added`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add academic year");
    }
  };

  const handleRenameAcademicYear = async (currentName: string) => {
    const nextName = window.prompt("Enter new academic year", currentName)?.trim();
    if (!nextName || nextName === currentName) {
      return;
    }
    try {
      const nextYears = sortAcademicYears(await api.updateAcademicYear(currentName, nextName));
      setAcademicYears(nextYears);
      if (academicYear === currentName) {
        setAcademicYear(nextName);
      }
      setStatus(`Academic year ${currentName} renamed to ${nextName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename academic year");
    }
  };

  const handleDeleteAcademicYear = async (yearName: string) => {
    if (!confirm(`Delete academic year ${yearName}?`)) {
      return;
    }
    try {
      const nextYears = sortAcademicYears(await api.deleteAcademicYear(yearName));
      setAcademicYears(nextYears);
      if (academicYear === yearName && nextYears.length > 0) {
        setAcademicYear(nextYears[0]);
      }
      setStatus(`Academic year ${yearName} removed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete academic year");
    }
  };

  const handleCreateClass = async () => {
    const name = newClassName.trim();
    if (!name) {
      return;
    }
    try {
      const nextClasses = sortClasses(await api.createClass(name));
      setClasses(nextClasses);
      setSelectedClass(name);
      setNewClassName("");
      setStatus(`Class ${name} added`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add class");
    }
  };

  const handleRenameClass = async (currentName: string) => {
    const nextName = window.prompt("Enter new class name", currentName)?.trim();
    if (!nextName || nextName === currentName) {
      return;
    }
    try {
      const nextClasses = sortClasses(await api.updateClass(currentName, nextName));
      setClasses(nextClasses);
      if (selectedClass === currentName) {
        setSelectedClass(nextName);
      }
      setStatus(`Class ${currentName} renamed to ${nextName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename class");
    }
  };

  const handleDeleteClass = async (className: string) => {
    if (!confirm(`Delete class ${className}?`)) {
      return;
    }
    try {
      const nextClasses = sortClasses(await api.deleteClass(className));
      setClasses(nextClasses);
      if (selectedClass === className && nextClasses.length > 0) {
        setSelectedClass(nextClasses[0]);
      }
      setStatus(`Class ${className} removed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete class");
    }
  };

  const handleRecordPayment = async (studentId?: number) => {
    if (!studentId) {
      return;
    }
    const amountText = window.prompt("Enter amount received", "500");
    if (amountText === null) {
      return;
    }
    const amount = Number(amountText);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid payment amount");
      return;
    }
    try {
      await api.payFee(studentId, amount);
      setStatus(`Payment of ₹${amount} recorded`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  const handleLogout = () => {
    clearToken();
    clearRole();
    window.location.reload();
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">🏫 School ERP</div>
        <div className="sidebar-role">{role}</div>
        <nav className="sidebar-nav">
          {[
            { key: "dashboard", label: "📊 Dashboard" },
            { key: "students", label: "👨‍🎓 Students" },
            { key: "fees", label: "💰 Fees" },
            { key: "reports", label: "📈 Reports" },
            { key: "import", label: "📂 Excel Import" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sidebar-link ${activeSection === item.key ? "active" : ""}`}
              onClick={() => setActiveSection(item.key as Section)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <strong>Offline ready</strong>
          <p>Auto save every 30 seconds, local backups, and desktop-friendly editing.</p>
        </div>
        <button type="button" className="btn btn-secondary sidebar-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      <main className="main-panel">
        <Toolbar
          academicYear={academicYear}
          onAcademicYearChange={setAcademicYear}
          onImport={handleImport}
          onExport={handleExport}
          onAddStudent={handleAddStudent}
          onRefresh={loadData}
          loading={loading}
          apiUrl={api.baseUrl}
          canManage={isAdmin}
          role={role}
        />

        <div className="section-tabs">
          {[
            { key: "dashboard", label: "Dashboard" },
            { key: "students", label: "Students" },
            { key: "fees", label: "Fees" },
            { key: "reports", label: "Reports" },
            { key: "import", label: "Excel Import" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`section-tab ${activeSection === item.key ? "active" : ""}`}
              onClick={() => setActiveSection(item.key as Section)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {status && <div className="alert alert-success">{status}</div>}
        {loading && <div className="loading-bar">Loading...</div>}

        {activeSection === "dashboard" && (
          <section className="page-section">
            <div className="hero-card">
              <h2>School ERP Dashboard</h2>
              <p>Manage students, fees, reports and Excel imports from a desktop-friendly admin console.</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card accent-blue">
                <div className="stat-label">कुल छात्र</div>
                <div className="stat-value">{summary?.totalStudents ?? students.length}</div>
              </div>
              <div className="stat-card accent-gold">
                <div className="stat-label">कुल फीस</div>
                <div className="stat-value">₹{(summary?.totalFees ?? 0).toLocaleString()}</div>
              </div>
              <div className="stat-card accent-rose">
                <div className="stat-label">बकाया फीस</div>
                <div className="stat-value">₹{(summary?.totalPending ?? 0).toLocaleString()}</div>
              </div>
              <div className="stat-card accent-green">
                <div className="stat-label">आज की फीस कलेक्शन</div>
                <div className="stat-value">₹{(dailyReport?.totalReceived ?? summary?.totalReceived ?? 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="content-card">
                <h3>Classwise overview</h3>
                <ul className="list-stack">
                  {classBreakdown.map((item) => (
                    <li key={item.name}>
                      <span>{item.name}</span>
                      <strong>{item.count} students • ₹{item.pending}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="content-card">
                <h3>Daily report</h3>
                <p><strong>Date:</strong> {dailyReport?.date ?? "Today"}</p>
                <p><strong>Students:</strong> {dailyReport?.totalStudents ?? students.length}</p>
                <p><strong>Collected:</strong> ₹{(dailyReport?.totalReceived ?? 0).toLocaleString()}</p>
                <p><strong>Pending:</strong> ₹{(dailyReport?.totalPending ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </section>
        )}

        {activeSection === "students" && (
          <section className="page-section">
            {isAdmin && (
              <>
                <div className="content-card">
                  <div className="panel-header">
                    <h3>Academic Year Manager</h3>
                  </div>
                  <div className="panel-tools">
                    <input
                      className="search-input"
                      value={newAcademicYearName}
                      onChange={(event) => setNewAcademicYearName(event.target.value)}
                      placeholder="Add academic year"
                    />
                    <button type="button" className="btn btn-primary" onClick={handleCreateAcademicYear}>
                      Add Year
                    </button>
                  </div>
                  <div className="list-stack">
                    {academicYears.map((yearName) => (
                      <div key={yearName} className="report-item">
                        <span>{yearName}</span>
                        <div className="panel-actions">
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRenameAcademicYear(yearName)}>
                            Rename
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDeleteAcademicYear(yearName)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="content-card">
                  <div className="panel-header">
                    <h3>Class Manager</h3>
                  </div>
                <div className="panel-tools">
                  <input
                    className="search-input"
                    value={newClassName}
                    onChange={(event) => setNewClassName(event.target.value)}
                    placeholder="Add class e.g. VI"
                  />
                  <button type="button" className="btn btn-primary" onClick={handleCreateClass}>
                    Add Class
                  </button>
                </div>
                <div className="list-stack">
                  {classes.map((className) => (
                    <div key={className} className="report-item">
                      <span>{className}</span>
                      <div className="panel-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRenameClass(className)}>
                          Rename
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDeleteClass(className)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}
            <ClassTabs classes={classes} selectedClass={selectedClass} onSelect={setSelectedClass} />
            <SummaryBar summary={summary} className={selectedClass} />
            <StudentTable students={students} onSave={handleSave} onDelete={handleDelete} loading={loading} readOnly={!isAdmin} />
          </section>
        )}

        {activeSection === "fees" && (
          <section className="page-section">
            <div className="content-card">
              <div className="panel-header">
                <h3>Fee ledger</h3>
                <div className="panel-tools">
                  <input
                    className="search-input"
                    value={feeSearch}
                    onChange={(e) => setFeeSearch(e.target.value)}
                    placeholder="Search student"
                  />
                  <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                    Print Receipt
                  </button>
                </div>
              </div>
              <table className="fee-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Total Fee</th>
                    <th>Paid Fee</th>
                    <th>Pending Fee</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeeRows.map((row) => (
                    <tr key={row.id ?? row.name}>
                      <td>{row.name}</td>
                      <td>{row.className}</td>
                      <td>₹{row.totalFee.toLocaleString()}</td>
                      <td>₹{row.paidFee.toLocaleString()}</td>
                      <td>₹{row.pendingFee.toLocaleString()}</td>
                      <td>
                        {isAdmin ? (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRecordPayment(row.id)}>
                            Record Payment
                          </button>
                        ) : (
                          <span className="view-only-pill">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === "reports" && (
          <section className="page-section">
            <div className="content-card">
              <h3>Reports</h3>
              <div className="stats-grid">
                <div className="stat-card accent-green">
                  <div className="stat-label">Daily Report</div>
                  <div className="stat-value">₹{(dailyReport?.totalReceived ?? 0).toLocaleString()}</div>
                </div>
                <div className="stat-card accent-blue">
                  <div className="stat-label">Monthly Report</div>
                  <div className="stat-value">₹{monthlyReports.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="list-stack">
                {monthlyReports.map((item) => (
                  <div key={item.month} className="report-item">
                    <span>{item.month}</span>
                    <strong>₹{item.amount.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeSection === "import" && (
          <section className="page-section">
            <div className="content-card">
              <h3>Excel Import</h3>
              <p>Upload an Excel sheet to sync student and fee records into the desktop ERP.</p>
              <label className="upload-box">
                <span>{importFile ? importFile.name : "Choose Excel"}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setImportFile(file);
                  }}
                />
              </label>
              <div className="panel-actions">
                <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={!importFile || loading}>
                  Upload
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveSection("students")}>
                  Open Student Manager
                </button>
              </div>
            </div>
          </section>
        )}

        <footer className="app-footer">Excel ⇄ Spring Boot ⇄ React/Electron • Offline-ready</footer>
      </main>
    </div>
  );
}
