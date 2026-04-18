import BrandSelect from "./BrandSelect";

interface ControlDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export default function ControlDropdown({ label, value, options, onChange }: ControlDropdownProps) {
  return (
    <div className="block">
      <span className="app-meta mb-1.5 block">{label}</span>
      <BrandSelect value={value} options={options} onChange={onChange} />
    </div>
  );
}
