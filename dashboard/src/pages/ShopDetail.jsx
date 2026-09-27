import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, fetchScreenshotBlobUrl } from "../lib/api";

/**
 * Small proof thumbnail in the payment history. Cloudinary images show
 * inline and open full-size in a new tab; local dev files have no public
 * URL, so they render a View button that fetches an authenticated blob.
 */
function PaymentProofThumb({ payment }) {
  const [busy, setBusy] = useState(false);
  const remote =
    payment.screenshotIsRemote ??
    /^https?:\/\//.test(payment.screenshotUrl ?? "");

  if (remote) {
    return (
      <a href={payment.screenshotView ?? payment.screenshotUrl} target="_blank" rel="noreferrer">
        <img
          className="screenshot"
          style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 8 }}
          src={payment.screenshotView ?? payment.screenshotUrl}
          alt="proof"
        />
      </a>
    );
  }

  const openLocal = async () => {
    setBusy(true);
    try {
      const url = await fetchScreenshotBlobUrl("admin", payment.id);
      window.open(url, "_blank", "noopener");
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={openLocal} disabled={busy} style={{ padding: "4px 10px" }}>
      {busy ? "…" : "View"}
    </button>
  );
}

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [extendDays, setExtendDays] = useState("30");
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["shop", id],
    queryFn: async () => (await adminApi.getShop(id)).data,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["shop", id] });
    queryClient.invalidateQueries({ queryKey: ["shops"] });
    queryClient.invalidateQueries({ queryKey: ["overview"] });
  };

  const resetPassword = useMutation({
    mutationFn: () => adminApi.resetOwnerPassword(id, newPassword),
    onSuccess: () => {
      setMessage("Owner password reset — all their sessions were logged out.");
      setNewPassword("");
      refresh();
    },
    onError: (e) => setMessage(e?.response?.data?.error ?? "Reset failed"),
  });

  const extend = useMutation({
    mutationFn: () => adminApi.extendSubscription(id, Number(extendDays)),
    onSuccess: () => {
      setMessage(`Subscription extended by ${extendDays} days.`);
      refresh();
    },
    onError: (e) => setMessage(e?.response?.data?.error ?? "Extend failed"),
  });

  const toggleActive = useMutation({
    mutationFn: (isActive) => adminApi.toggleShopActive(id, isActive),
    onSuccess: () => {
      setMessage("Shop account state updated.");
      refresh();
    },
    onError: (e) => setMessage(e?.response?.data?.error ?? "Update failed"),
  });

  if (isLoading || !data) return <div className="loading">Loading shop…</div>;

  const { shop, counts, recentEvents, subscriptionPayments } = data;
  const anyActiveUser = shop.users?.some((u) => u.isActive);

  return (
    <>
      <button onClick={() => navigate("/shops")} className="mb">← All shops</button>
      <div className="spread">
        <div>
          <h1 className="page-title">{shop.name}</h1>
          <p className="page-sub">
            {shop.ownerName ?? "—"} · {shop.phone ?? "no phone"}{" "}
            <span className={`badge ${shop.subscriptionStatus}`}>{shop.subscriptionStatus}</span>
          </p>
        </div>
        <div className="row">
          <button
            className="danger"
            onClick={() => toggleActive.mutate(!anyActiveUser)}
            disabled={toggleActive.isPending}
          >
            {anyActiveUser ? "Deactivate account" : "Reactivate account"}
          </button>
        </div>
      </div>

      {message ? <div className="panel">{message}</div> : null}

      <div className="cards">
        <div className="card"><div className="label">Products</div><div className="value">{counts.products}</div></div>
        <div className="card"><div className="label">Sales</div><div className="value">{counts.sales}</div></div>
        <div className="card"><div className="label">Purchases</div><div className="value">{counts.purchases}</div></div>
        <div className="card"><div className="label">Stock movements</div><div className="value">{counts.stockMovements}</div></div>
        <div className="card">
          <div className="label">Subscription ends</div>
          <div className="value" style={{ fontSize: 18 }}>
            {shop.subscriptionEnd ? new Date(shop.subscriptionEnd).toLocaleDateString() : "—"}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3>Users</h3>
          <table>
            <thead>
              <tr><th>Name</th><th>Role</th><th>Phone</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(shop.users ?? []).map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.role}</td>
                  <td className="mono">{u.phone ?? u.email ?? "—"}</td>
                  <td>{u.isActive ? <span className="badge ACTIVE">active</span> : <span className="badge EXPIRED">disabled</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3>Owner account actions</h3>
          <div className="label mb">Reset owner password ("forgot password" support)</div>
          <div className="row mb">
            <input
              type="text"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              className="primary"
              disabled={newPassword.length < 6 || resetPassword.isPending}
              onClick={() => resetPassword.mutate()}
            >
              Reset
            </button>
          </div>

          <div className="label mb">Extend subscription (goodwill days)</div>
          <div className="row">
            <input
              type="number"
              min="1"
              max="366"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              style={{ width: 100 }}
            />
            <button onClick={() => extend.mutate()} disabled={extend.isPending}>
              Add days
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Subscription payment history</h3>
        {(subscriptionPayments ?? []).length === 0 ? (
          <div className="empty">No payments submitted yet.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Proof</th><th>Plan</th><th>Amount</th><th>Status</th><th>Submitted</th><th>AI check</th><th>Reviewed</th></tr>
            </thead>
            <tbody>
              {subscriptionPayments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <PaymentProofThumb payment={p} />
                  </td>
                  <td>{p.planMonths} mo</td>
                  <td className="mono">ETB {Number(p.amountEtb).toLocaleString()}</td>
                  <td><span className={`badge ${p.status}`}>{p.status.replace("_", " ")}</span></td>
                  <td>{new Date(p.submittedAt).toLocaleString()}</td>
                  <td className="muted">
                    {p.aiVerified == null ? "—" : p.aiVerified ? `pass ${Math.round(Number(p.aiConfidence) * 100)}%` : `fail ${Math.round(Number(p.aiConfidence) * 100)}%`}
                  </td>
                  <td className="muted">{p.reviewNote ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h3>Recent activity (what they did in the app)</h3>
        <table>
          <thead>
            <tr><th>When</th><th>User</th><th>Action</th><th>Detail</th></tr>
          </thead>
          <tbody>
            {(recentEvents ?? []).map((ev) => (
              <tr key={ev.id}>
                <td className="muted">{new Date(ev.createdAt).toLocaleString()}</td>
                <td>{ev.user?.name ?? "system"}</td>
                <td className="mono">{ev.type}</td>
                <td className="mono muted" style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ev.detail ? JSON.stringify(ev.detail) : `${ev.method ?? ""} ${ev.path ?? ""}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(recentEvents ?? []).length === 0 ? <div className="empty">No activity recorded yet.</div> : null}
      </div>
    </>
  );
}
