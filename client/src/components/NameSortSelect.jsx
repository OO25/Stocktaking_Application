import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";

export default function NameSortSelect({ value, onValueChange }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label="Sort by name" className="w-44 shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="az">Alphabetical A–Z</SelectItem>
        <SelectItem value="za">Alphabetical Z–A</SelectItem>
      </SelectContent>
    </Select>
  );
}
