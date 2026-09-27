import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../lib/api";

/**
 * "Who is using the software and who isn't" — sorted by least recently
 * seen so the platform owner knows exactly who to call.
 */
export default function Usage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["usage-shops"],
    queryFn: async () => (await adminApi.listShops({ pageSize: 100 })).data,
  });

  if (isLoading) return <div className="loading">Loading usage…</div>;

  const shops = [...(data?.shops ?? [])].sort((a, b) => {
    const ta = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
    const tb = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
    return ta - tb; // least recently active first
  });

  return (
    <>
      <h1 className="page-title">Usage</h1>
      <p className="page-sub">
        Shops sorted by least-recently-active. Anyone grey and dusty at the top
        is a call candidate.
      </p>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Shop</th>
              <th>Last seen</th>
              <th>Active days (30d)</th>
              <th>Today</th>
              <th>Subscription</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.id} className="clickable" onClick={() => navigate(`/shops/${shop.id}`)}>
                <td style={{ fontWeight: 600 }}>{shop.name}</td>
                <td className="muted">
                  {shop.lastSeenAt ? new Date(shop.lastSeenAt).toLocaleDateString() : "never"}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 120, height: 6, borderRadius: 3,
                      background: "var(--surface-2)",
                    }}>
                      <div style={{
                        width: `${Math.min(100, (shop.activeDaysLast30 / 30) * 100)}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: shop.activeDaysLast30 >= 10 ? "var(--green)" : shop.activeDaysLast30 >= 3 ? "var(--amber)" : "var(--red)",
                      }} />
                    </div>
                    <span>{shop.activeDaysLast30}/30</span>
                  </div>
                </td>
                <td>{shop.activeToday ? <span className="badge ACTIVE">yes</span> : <span className="badge NO_ANSWER">no</span>}</td>
                <td><span className={`badge ${shop.subscriptionStatus}`}>{shop.subscriptionStatus}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {shops.length === 0 ? <div className="empty">No shops yet.</div> : null}
      </div>
    </>
  );
}
