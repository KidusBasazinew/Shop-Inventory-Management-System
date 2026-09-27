import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../lib/api";

/**
 * The full audit trail across all shops "track everything the shop
 * owner is doing with the software", including mistakes (failed
 * requests show their status code) and logins.
 */
export default function Activity() {
  const [type, setType] = useState("");

  // First page, keyed by filter react-query replaces data when `type`
  // changes, so no manual state syncing is needed.
  const page1 = useQuery({
    queryKey: ["events", type || "all"],
    queryFn: async () =>
      (
        await adminApi.listEvents({
          type: type || undefined,
          limit: 50,
        })
      ).data,
  });

  return (
    <>
      <h1 className="page-title">Activity Feed</h1>
      <p className="page-sub">
        Everything every shop does in the software logins, sales, deletes,
        mistakes. Failed requests show their error status.
      </p>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Filter by type, e.g. sale.create, auth.login, admin."
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Shop</th>
              <th>User</th>
              <th>Action</th>
              <th>Result</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {(page1.data?.events ?? []).map((ev) => (
              <tr key={ev.id}>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>
                  {new Date(ev.createdAt).toLocaleString()}
                </td>
                <td>{ev.shop?.name ?? "—"}</td>
                <td>{ev.user?.name ?? "system"}</td>
                <td className="mono">{ev.type}</td>
                <td>
                  {ev.statusCode == null ? (
                    <span className="muted">—</span>
                  ) : ev.statusCode < 400 ? (
                    <span className="badge ACTIVE">{ev.statusCode}</span>
                  ) : (
                    <span className="badge EXPIRED">{ev.statusCode}</span>
                  )}
                </td>
                <td
                  className="mono muted"
                  style={{
                    maxWidth: 360,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ev.detail
                    ? JSON.stringify(ev.detail)
                    : `${ev.method ?? ""} ${ev.path ?? ""}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {page1.isLoading ? (
          <div className="loading">Loading activity…</div>
        ) : null}
        {!page1.isLoading && (page1.data?.events ?? []).length === 0 ? (
          <div className="empty">No activity found.</div>
        ) : null}
        {page1.data?.nextCursor ? (
          <div
            className="muted"
            style={{ textAlign: "center", paddingTop: 12, fontSize: 13 }}
          >
            Showing the 50 most recent events filter by type to dig deeper.
          </div>
        ) : null}
      </div>
    </>
  );
}
