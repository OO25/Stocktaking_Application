import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSessions, deleteSession } from "../../api/stocktake.js";
import { Button } from "../../components/ui/button.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Alert, AlertDescription } from "../../components/ui/alert.jsx";

/*
 * Displays list of all stocktake sessions for the user
 */
export default function StockCountPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  // Delete a session
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session?")) {
      return;
    }
    try {
      await deleteSession(id);
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete session");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-200 text-gray-800",
      in_progress: "bg-blue-200 text-blue-800",
      submitted: "bg-green-200 text-green-800",
      locked: "bg-red-200 text-red-800",
    };
    return colors[status] || "bg-gray-200 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Stock Count</h1>
        <p className="mt-1 text-gray-600">View and manage stocktake sessions</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No stocktake sessions found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Counted By</TableHead>
                <TableHead>Counted Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {session.month}/{session.year}
                  </TableCell>
                  <TableCell>{session.outlet_name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{session.counted_by || "-"}</TableCell>
                  <TableCell>{session.counted_date || "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link to={`/stock-count/${session.id}`}>
                      <Button variant="outline" size="sm">
                        {session.status === "draft" ||
                        session.status === "in_progress"
                          ? "Edit"
                          : "View"}
                      </Button>
                    </Link>
                    {session.status === "draft" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(session.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
