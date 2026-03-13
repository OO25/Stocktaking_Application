import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import { Eye, EyeOff, Pencil, Trash } from "lucide-react";

/** Users table for ManageUsersPage. */
function UserTable({
  loading,
  error,
  users,
  search,
  limit,
  page,
  totalPages,
  onLimitChange,
  onPageChange,
}) {
  const [revealedIds, setRevealedIds] = useState(() => new Set());

  const revealedSet = useMemo(() => new Set(revealedIds), [revealedIds]);

  function toggleReveal(id) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px] py-4 pl-6">Name</TableHead>
          <TableHead className="w-[200px] py-4">Username</TableHead>
          <TableHead className="w-[240px] py-4">Password (hashed)</TableHead>
          <TableHead className="w-[140px] py-4">Role</TableHead>
          <TableHead className="w-[160px] py-4">Created At</TableHead>
          <TableHead className="w-[160px] py-4">Updated At</TableHead>
          <TableHead className="w-[160px] py-4">
            <div className="flex justify-end">
              <div className="w-[120px] text-center">Action</div>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && (
          <TableRow>
            <TableCell colSpan={7} className="py-12 text-center text-sm">
              Loading users…
            </TableCell>
          </TableRow>
        )}

        {!loading && error !== null && (
          <TableRow>
            <TableCell colSpan={7} className="py-4">
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
                {error}
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading && error === null && users.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="py-12 text-center text-sm">
              {search ? "No users match your search." : "No users found."}
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          error === null &&
          users.map((user) => {
            const isRevealed = revealedSet.has(user.id);
            return (
              <TableRow key={user.id}>
                <TableCell className="font-semibold pl-6">
                  {user.name}
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 truncate max-w-[180px]">
                      {isRevealed
                        ? user.password_hash || "-"
                        : user.password_hash
                        ? "••••••••••••"
                        : "-"}
                    </span>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      disabled={!user.password_hash}
                      onClick={() => toggleReveal(user.id)}
                      aria-label={
                        isRevealed ? "Hide password" : "Show password"
                      }
                    >
                      {isRevealed ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {user.role ? (
                    <Badge variant="secondary">{user.role}</Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {user.created_at ? (
                    <span className="text-sm text-gray-900">
                      {user.created_at}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {user.updated_at ? (
                    <span className="text-sm text-gray-900">
                      {user.updated_at}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <div className="inline-flex items-center justify-center gap-2 w-[120px]">
                      <Button size="sm" variant="secondary" disabled>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" disabled>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={6}>
            <div className="flex items-center gap-3 pl-4">
              <span>Rows per page</span>
              <select
                className="border border-gray-200 rounded px-2 py-1 bg-white text-sm"
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
            </div>
          </TableCell>
          <TableCell className="text-right">
            <div className="inline-flex items-center gap-3 pr-4">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                ‹ Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              >
                Next ›
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export default UserTable;
