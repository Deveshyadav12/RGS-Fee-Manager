import { CLASS_LABELS } from "../types";

interface ClassTabsProps {
  classes: string[];
  selectedClass: string;
  onSelect: (className: string) => void;
}

export function ClassTabs({ classes, selectedClass, onSelect }: ClassTabsProps) {
  return (
    <div className="class-tabs">
      {classes.map((cls) => (
        <button
          key={cls}
          type="button"
          className={`class-tab ${selectedClass === cls ? "active" : ""}`}
          onClick={() => onSelect(cls)}
        >
          {CLASS_LABELS[cls] ?? `CLASS ${cls}`}
        </button>
      ))}
    </div>
  );
}
