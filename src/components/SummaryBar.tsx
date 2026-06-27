import type { FeeSummary } from "../types";

interface SummaryBarProps {
  summary: FeeSummary | null;
  className: string;
}

export function SummaryBar({ summary, className }: SummaryBarProps) {
  return (
    <div className="summary-bar">
      <div className="class-title">CLASS {className}</div>
      {summary && (
        <div className="summary-stats">
          <span>Students: <strong>{summary.totalStudents}</strong></span>
          <span>Total Fees: <strong>₹{summary.totalFees.toLocaleString()}</strong></span>
          <span>Received: <strong>₹{summary.totalReceived.toLocaleString()}</strong></span>
          <span>Pending: <strong>₹{summary.totalPending.toLocaleString()}</strong></span>
        </div>
      )}
    </div>
  );
}
