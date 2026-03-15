import { useEffect, useMemo, useRef, useState } from "react";
import { fetchUsers } from "../../api/users.js";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import UserTable from "./components/userTable.jsx";
import AddUserModal from "./components/AddUserModal.jsx";
import { Plus, Search } from "lucide-react";

/** Debounce a value by `delay` ms. */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  function loadUsers() {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }

  useEffect(() => {
    return loadUsers();
  }, []);

  // Reset to page 1 when search changes
  const prevSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (prevSearch.current !== debouncedSearch) {
      prevSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  const filteredUsers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const haystack = `${user.name} ${user.username} ${user.role || ""}`
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [users, debouncedSearch]);

  const totalCount = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit;
  const pageUsers = filteredUsers.slice(startIndex, startIndex + limit);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-6">
      <div className="px-4 py-6 mx-auto w-full max-w-7xl flex flex-1 flex-col gap-4 sm:gap-6">
        {/* Heading */}
        <div className="intro-row">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-description">
              Manage access, roles, and account details for your team.
            </p>
          </div>

          {/* Action */}
          <div className="action-row">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus />
                Add New User
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card header: search */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
              <div className="search-field">
                <Search className="search-icon" />
                <Input
                  type="text"
                  placeholder="Search by name, username, or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </div>

          <UserTable
            loading={loading}
            error={error}
            users={pageUsers}
            search={search}
            limit={limit}
            page={page}
            totalPages={totalPages}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </div>

        <AddUserModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={loadUsers}
        />
      </div>
    </div>
  );
}

export default ManageUsersPage;
