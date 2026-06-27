import { useEffect, useState } from "react";
import type { MonthKey, Student } from "../types";
import { MONTH_COLUMNS } from "../types";
import { calcTotal, calcTotalReceived } from "../utils/calculations";

interface StudentTableProps {
  students: Student[];
  onSave: (student: Student) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loading: boolean;
  readOnly?: boolean;
}

type EditableField = keyof Student;

export function StudentTable({ students, onSave, onDelete, loading, readOnly = false }: StudentTableProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  const rowKey = (student: Student) =>
    student.id ? String(student.id) : `new-${student.serialNumber}`;

  useEffect(() => {
    const pending = students.find((s) => !s.id);
    if (pending) {
      setEditingKey(rowKey(pending));
      setDraft({ ...pending });
    }
  }, [students]);

  const startEdit = (student: Student) => {
    setEditingKey(rowKey(student));
    setDraft({ ...student });
  };

  const updateDraft = (field: EditableField, value: string | number) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const saveDraft = async () => {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    try {
      await onSave(draft);
      setEditingKey(null);
      setDraft(null);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft(null);
  };

  const renderCell = (student: Student, field: EditableField, isNumber = false) => {
    const isEditing = editingKey === rowKey(student) && draft;
    if (!isEditing || !draft) {
      const value = student[field];
      return isNumber ? (value as number ?? 0) : (value as string ?? "");
    }
    return (
      <input
        className="cell-input"
        type={isNumber ? "number" : "text"}
        value={(draft[field] as string | number) ?? (isNumber ? 0 : "")}
        onChange={(e) =>
          updateDraft(field, isNumber ? Number(e.target.value) : e.target.value)
        }
      />
    );
  };

  const renderMonthCell = (student: Student, key: MonthKey) => {
    const isEditing = editingKey === rowKey(student) && draft;
    if (!isEditing || !draft) {
      return student[key] ?? 0;
    }
    return (
      <input
        className="cell-input month-input"
        type="number"
        value={draft[key] ?? 0}
        onChange={(e) => updateDraft(key, Number(e.target.value))}
      />
    );
  };

  return (
    <div className="table-wrapper">
      <table className="student-table">
        <thead>
          <tr>
            <th>SR</th>
            <th>NAME</th>
            <th>F NAME</th>
            <th>VILLAGE</th>
            <th>CONTACT</th>
            <th>SCHOOL FEE</th>
            <th>BUS FAIR</th>
            <th>TOTAL</th>
            {MONTH_COLUMNS.map((m) => (
              <th key={m.key}>{m.label}</th>
            ))}
            <th>T R</th>
            <th>PENDING</th>
            <th>DISCO</th>
            <th>Actions</th>

          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={23} className="empty-row">
                No students found. Import an Excel file or add a student.
              </td>
            </tr>
          )}

          {students.map((student) => {
            const row = editingKey === rowKey(student) && draft ? draft : student;
            const total = calcTotal(row);
            const totalReceived = calcTotalReceived(row);
            const isEditing = editingKey === rowKey(student);

            return (
              <tr key={rowKey(student)} className={isEditing ? "editing" : ""}>
                <td>{renderCell(student, "serialNumber", true)}</td>
                <td>{renderCell(student, "name")}</td>
                <td>{renderCell(student, "fatherName")}</td>
                <td>{renderCell(student, "village")}</td>
                <td>{renderCell(student, "contact")}</td>
                <td>{renderCell(student, "schoolFee", true)}</td>
                <td>{renderCell(student, "busFare", true)}</td>
                <td className="calc-cell">{total}</td>
                {MONTH_COLUMNS.map((m) => (
                  <td key={m.key} className="month-cell">
                    {renderMonthCell(student, m.key)}
                  </td>
                ))}
                <td className="calc-cell">{totalReceived}</td>
                <td className="calc-cell">{total - totalReceived}</td>
                <td>{renderCell(student, "discount", true)}</td>

                <td className="actions-cell">
                  {readOnly ? (
                    <span className="view-only-pill">View Only</span>
                  ) : isEditing ? (
                    <>
                      <button type="button" className="btn-sm save" onClick={saveDraft} disabled={saving || loading}>
                        Save
                      </button>
                      <button type="button" className="btn-sm cancel" onClick={cancelEdit} disabled={saving}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn-sm edit" onClick={() => startEdit(student)} disabled={loading}>
                        Edit
                      </button>
                      {student.id && (
                        <button
                          type="button"
                          className="btn-sm delete"
                          onClick={() => onDelete(student.id!)}
                          disabled={loading}
                        >
                          Del
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
