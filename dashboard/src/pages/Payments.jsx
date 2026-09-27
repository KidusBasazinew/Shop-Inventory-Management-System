import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, fetchScreenshotBlobUrl } from "../lib/api";

const TABS = [
  { key: "PENDING", label: "Pending review" },
  { key: "AI_VERIFIED", label: "AI verified" },
  { key: "MANUAL_VERIFIED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

/**
 * The review queue. Open a submission, look at the screenshot the shop
 * uploaded, then approve (adds plan months × 30 days) or reject.
 */
export default function Payments() {
  const [tab, setTab] = useState("PENDING");
  const [reviewing, setReviewing] = useState(null); // payment being reviewed
  const [note, setNote] = useState("");
  const [shotUrl, setShotUrl] = useState(null);
  const [shotError, setShotError] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Screenshot loading: Cloudinary images come straight from their CDN
   * URL (screenshotView, resized server-side via delivery transform);
   * local dev files are fetched as authenticated blobs.
   */
  const openReview = async (p) => {
    setReviewing(p);
    setNote("");
    setShotUrl(null);
    setShotError(false);
    const remote = p.screenshotIsRemote ?? /^https?:\/\//.test(p.screenshotUrl ?? "");
    if (remote) {
      setShotUrl(p.screenshotView ?? p.screenshotUrl);
      return;
    }
    try {
      setShotUrl(await fetchScreenshotBlobUrl("admin", p.id));
    } catch {
      setShotError(true);
    }
  };

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", tab],
    queryFn: async () => (await adminApi.listPayments(tab)).data,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, note }) => adminApi.reviewPayment(id, decision, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["pending-count"] });
      setReviewing(null);
      setNote("");
    },
  });

  return (
    <>
      <h1 className="page-title">Subscription Payments</h1>
      <p className="page-sub">
        Shops transfer money manually and upload a screenshot. Approve to add
        their plan months (30 days each) — unreviewed items get an AI check
        after 15 minutes.
      </p>

      <div className="toolbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "primary" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="loading">Loading…</div>
      ) : (payments ?? []).length === 0 ? (
        <div className="empty">Nothing here — all clear. 🎉</div>
      ) : (
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>Shop</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Payer</th>
                <th>Reference</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.shop?.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{p.shop?.phone}</div>
                  </td>
                  <td>{p.planMonths} mo</td>
                  <td className="mono">ETB {Number(p.amountEtb).toLocaleString()}</td>
                  <td>
                    <div>{p.payerName ?? "—"}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{p.payerPhone ?? ""}</div>
                  </td>
                  <td className="mono">{p.bankReference ?? "—"}</td>
                  <td>{new Date(p.submittedAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${p.status}`}>{p.status.replace("_", " ")}</span>
                    {p.aiConfidence != null && (
                      <div className="muted" style={{ fontSize: 11 }}>
                        AI {Math.round(Number(p.aiConfidence) * 100)}%
                      </div>
                    )}
                  </td>
                  <td>
                    <button onClick={() => openReview(p)}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewing ? (
        <div className="modal-backdrop" onClick={() => setReviewing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="spread mb">
              <h3>
                {reviewing.shop?.name} — {reviewing.planMonths} month
                {reviewing.planMonths > 1 ? "s" : ""} · ETB{" "}
                {Number(reviewing.amountEtb).toLocaleString()}
              </h3>
              <button onClick={() => setReviewing(null)}>Close</button>
            </div>

            <div className="grid-2 mb">
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Payment screenshot</div>
                {shotUrl ? (
                  <img className="screenshot mt" src={shotUrl} alt="Payment screenshot" />
                ) : shotError ? (
                  <div className="empty mt">Could not load image — is the API running?</div>
                ) : (
                  <div className="empty mt">Loading screenshot…</div>
                )}
              </div>
              <div>
                <div className="card mb">
                  <div className="label">Payer</div>
                  <div>{reviewing.payerName ?? "—"} {reviewing.payerPhone ? `· ${reviewing.payerPhone}` : ""}</div>
                  <div className="label mt">Bank reference</div>
                  <div className="mono">{reviewing.bankReference ?? "—"}</div>
                  <div className="label mt">Submitted</div>
                  <div>{new Date(reviewing.submittedAt).toLocaleString()}</div>
                  <div className="label mt">AI pre-check</div>
                  <div>
                    {reviewing.aiVerified == null
                      ? "Not run yet (runs 15 min after submission)"
                      : reviewing.aiVerified
                        ? `Passed · ${Math.round(Number(reviewing.aiConfidence) * 100)}% confidence`
                        : `Failed · ${Math.round(Number(reviewing.aiConfidence) * 100)}% confidence`}
                  </div>
                  {reviewing.aiDetails?.reason ? (
                    <div className="muted" style={{ fontSize: 12 }}>
                      {String(reviewing.aiDetails.reason)}
                    </div>
                  ) : null}
                </div>

                <label className="muted" style={{ fontSize: 13 }}>Note (optional, sent to the shop on reject)</label>
                <input
                  className="mt"
                  style={{ width: "100%" }}
                  placeholder="e.g. Amount doesn't match the plan"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <div className="row mt">
                  <button
                    className="success"
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({
                        id: reviewing.id,
                        decision: "MANUAL_VERIFIED",
                        note,
                      })
                    }
                  >
                    ✓ Approve & activate
                  </button>
                  <button
                    className="danger"
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({
                        id: reviewing.id,
                        decision: "REJECTED",
                        note,
                      })
                    }
                  >
                    ✕ Reject
                  </button>
                </div>
                {reviewMutation.error ? (
                  <div className="error-text mt">
                    {reviewMutation.error?.response?.data?.error ?? "Review failed"}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
