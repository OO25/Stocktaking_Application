/** Sort a copy so table ordering never mutates the records used by edit forms. */
export function sortByName(items, direction = "az") {
  const multiplier = direction === "za" ? -1 : 1;
  return [...items].sort((a, b) => {
    const nameOrder = String(a.name || a.username || "").localeCompare(
      String(b.name || b.username || ""), undefined, { sensitivity: "base" },
    );
    return multiplier * (nameOrder || String(a.key ?? a.id).localeCompare(String(b.key ?? b.id)));
  });
}
