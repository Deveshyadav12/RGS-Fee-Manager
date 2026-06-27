interface ToolbarProps {
  academicYear: string;
  onAcademicYearChange: (year: string) => void;
  onImport: (file: File, replaceExisting: boolean) => void;
  onExport: () => void;
  onAddStudent: () => void;
  onRefresh: () => void;
  loading: boolean;
  apiUrl: string;
  canManage?: boolean;
  role?: string;
}

export function Toolbar({
  academicYear,
  onAcademicYearChange,
  onImport,
  onExport,
  onAddStudent,
  onRefresh,
  loading,
  apiUrl,
  canManage = true,
  role = "ADMIN",
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <h1>School ERP Console</h1>
        <span className="api-badge">API: {apiUrl} • {role}</span>
      </div>

      <div className="toolbar-center">
        <label>
          Academic Year
          <input
            type="text"
            value={academicYear}
            onChange={(e) => onAcademicYearChange(e.target.value)}
            placeholder="2026-27"
            disabled={!canManage}
          />
        </label>
      </div>

      <div className="toolbar-right">
        {canManage && (
          <>
            <label className="btn btn-secondary file-btn">
              Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImport(file, false);
                    e.target.value = "";
                  }
                }}
              />
            </label>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".xlsx,.xls";
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (file) onImport(file, true);
                };
                input.click();
              }}
              disabled={loading}
            >
              Replace Import
            </button>

            <button type="button" className="btn btn-secondary" onClick={onExport} disabled={loading}>
              Export Excel
            </button>

            <button type="button" className="btn btn-primary" onClick={onAddStudent} disabled={loading}>
              + Add Student
            </button>
          </>
        )}

        <button type="button" className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
          Refresh
        </button>
      </div>
    </header>
  );
}
