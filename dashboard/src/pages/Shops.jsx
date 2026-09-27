import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminApi } from "../lib/api";

export default function Shops() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [usage, setUsage] = useState(params.get("usage") ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["shops", q, status, usage],
    queryFn: async () =>
      (
        await adminApi.listShops({
          q: q || undefined,
          status: status || undefined,
          usage: usage || undefined,
        })
      ).data,
  });

  return (
    <>
      <h1 className="page-title">Shops</h1>
      <p className="page-sub">
        Every business running your software subscription state and how much
        they actually use it.
      </p>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by shop, owner or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any subscription status</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select value={usage} onChange={(e) => setUsage(e.target.value)}>
          <option value="">Any usage</option>
          <option value="active">Active users (5+ days in last 30)</option>
          <option value="inactive">Inactive (under 5 days)</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading shops…</div>
      ) : (
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>Shop</th>
                <th>Owner</th>
                <th>Subscription</th>
                <th>Ends</th>
                <th>Days used (30d)</th>
                <th>Users</th>
                <th>Events</th>
              </tr>
            </thead>
            <tbody>
              {(data?.shops ?? []).map((shop) => (
                <tr
                  key={shop.id}
                  className="clickable"
                  onClick={() => navigate(`/shops/${shop.id}`)}
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>{shop.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {shop.phone ?? ""}
                    </div>
                  </td>
                  <td>{shop.ownerName ?? "—"}</td>
                  <td>
                    <span className={`badge ${shop.subscriptionStatus}`}>
                      {shop.subscriptionStatus}
                    </span>
                  </td>
                  <td className="muted">
                    {shop.subscriptionEnd
                      ? new Date(shop.subscriptionEnd).toLocaleDateString()
                      : shop.trialEnd
                        ? `trial: ${new Date(shop.trialEnd).toLocaleDateString()}`
                        : "—"}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>
                      {shop.activeDaysLast30}
                    </span>
                    {shop.activeToday ? (
                      <span className="badge ACTIVE" style={{ marginLeft: 8 }}>
                        today
                      </span>
                    ) : null}
                  </td>
                  <td>{shop.usersCount}</td>
                  <td>{shop.activityCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.shops?.length === 0 ? (
            <div className="empty">No shops match those filters.</div>
          ) : null}
        </div>
      )}
    </>
  );
}
