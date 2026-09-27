import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../lib/api";

const STATUS_BADGES = {
  PENDING: "PENDING",
  DONE: "DONE",
  NO_ANSWER: "NO_ANSWER",
  NOT_INTERESTED: "NOT_INTERESTED",
};

/**
 * Call list. When a shop stops using the software — or someone installs
 * the app store build and never activates — log the call here so nobody
 * is forgotten and follow-ups are visible.
 */
export default function Outreach() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    shopId: "",
    phone: "",
    reason: "INACTIVE_SHOP",
    channel: "CALL",
    note: "",
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["outreach", statusFilter],
    queryFn: async () =>
      (await adminApi.listOutreach({ status: statusFilter || undefined })).data,
  });

  const { data: shops } = useQuery({
    queryKey: ["outreach-shops"],
    queryFn: async () => (await adminApi.listShops({ pageSize: 100 })).data,
  });

  const createMutation = useMutation({
    mutationFn: (body) => adminApi.createOutreach(body),
    onSuccess: () => {
      setForm((f) => ({ ...f, phone: "", note: "" }));
      queryClient.invalidateQueries({ queryKey: ["outreach"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => adminApi.updateOutreach(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outreach"] }),
  });

  const submit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      shopId: form.shopId || undefined,
      phone: form.phone,
      reason: form.reason,
      channel: form.channel,
      note: form.note || undefined,
    });
  };

  return (
    <>
      <h1 className="page-title">Outreach</h1>
      <p className="page-sub">
        Call / SMS log — chase inactive shops, expired subscriptions, and
        app-store installs that never started using the software.
      </p>

      <div className="grid-2">
        <div className="panel">
          <h3>Log a new outreach</h3>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <select
              value={form.shopId}
              onChange={(e) => setForm({ ...form, shopId: e.target.value })}
            >
              <option value="">No shop (e.g. app-store install)</option>
              {(shops?.shops ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <div className="row">
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                <option value="INACTIVE_SHOP">Not using the software</option>
                <option value="EXPIRED_SUBSCRIPTION">Expired subscription</option>
                <option value="APP_INSTALL_NO_USE">Installed app, never used</option>
                <option value="SUPPORT">Support call</option>
                <option value="OTHER">Other</option>
              </select>
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                <option value="CALL">Call</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <input
              placeholder="Note — what did you talk about?"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
            {createMutation.error ? (
              <div className="error-text">{createMutation.error?.response?.data?.error}</div>
            ) : null}
            <button className="primary" disabled={createMutation.isPending}>Save log</button>
          </form>
        </div>

        <div className="panel">
          <h3>History</h3>
          <div className="toolbar">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DONE">Done</option>
              <option value="NO_ANSWER">No answer</option>
              <option value="NOT_INTERESTED">Not interested</option>
            </select>
          </div>
          {isLoading ? (
            <div className="loading">Loading…</div>
          ) : (logs ?? []).length === 0 ? (
            <div className="empty">No outreach logged yet.</div>
          ) : (
            <table>
              <thead>
                <tr><th>When</th><th>Shop / phone</th><th>Reason</th><th>Channel</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.shop?.name ?? "—"}</div>
                      <div className="mono">{log.phone}</div>
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>{log.reason.replace(/_/g, " ")}</td>
                    <td>{log.channel}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGES[log.status] ?? ""}`}>{log.status.replace("_", " ")}</span>
                    </td>
                    <td>
                      {log.status === "PENDING" ? (
                        <div className="row">
                          <button
                            onClick={() => updateMutation.mutate({ id: log.id, status: "DONE" })}
                            disabled={updateMutation.isPending}
                          >
                            ✓ Done
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ id: log.id, status: "NO_ANSWER" })}
                            disabled={updateMutation.isPending}
                          >
                            ↻ Retry
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
