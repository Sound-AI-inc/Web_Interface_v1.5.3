import { ChevronDown } from "lucide-react";

interface ControlDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export default function ControlDropdown({ label, value, options, onChange }: ControlDropdownProps) {
  return (
    <label className="block">
      <span className="app-meta mb-1.5 block">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="app-input appearance-none pr-10"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/50" />
      </div>
    </label>
  );
}
