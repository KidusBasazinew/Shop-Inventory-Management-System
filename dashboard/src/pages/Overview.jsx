import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { adminApi } from "../lib/api";

export default function Overview() {
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: async () => (await adminApi.overview()).data,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) return <div className="loading">Loading overview…</div>;

  return (
    <>
      <h1 className="page-title">Platform Overview</h1>
      <p className="page-sub">Everything happening across your software, live.</p>

      <div className="cards">
        <div className="card">
          <div className="label">Shops</div>
          <div className="value">{data.shops.total}</div>
          <div className="hint">{data.shops.active} active · {data.shops.trial} trial · {data.shops.expired} expired</div>
        </div>
        <div className="card">
          <div className="label">Revenue (all time)</div>
          <div className="value">ETB {data.revenue.totalEtb.toLocaleString()}</div>
          <div className="hint">{data.revenue.totalPayments} verified payments</div>
        </div>
        <div className="card">
          <div className="label">Revenue (last 30d)</div>
          <div className="value">ETB {data.revenue.last30dEtb.toLocaleString()}</div>
          <div className="hint">{data.revenue.last30dPayments} payments</div>
        </div>
        <div className="card">
          <div className="label">Daily active shops</div>
          <div className="value">{data.usage.dau}</div>
          <div className="hint">WAU {data.usage.wau} · MAU {data.usage.mau}</div>
        </div>
        <Link to="/payments" className="card">
          <div className="label">Awaiting your review</div>
          <div className="value" style={{ color: data.pendingReviews ? "var(--amber)" : undefined }}>
            {data.pendingReviews}
          </div>
          <div className="hint">payment screenshots</div>
        </Link>
      </div>

      <div className="panel">
        <h3>Daily active shops — last 30 days</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.usage.usageChart}>
            <defs>
              <linearGradient id="colorShops" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f7cff" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#4f7cff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#233150" />
            <XAxis
              dataKey="day"
              tick={{ fill: "#93a0b8", fontSize: 11 }}
              tickFormatter={(d) => d.slice(5)}
            />
            <YAxis allowDecimals={false} tick={{ fill: "#93a0b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#17233c", border: "1px solid #233150", borderRadius: 10 }}
            />
            <Area type="monotone" dataKey="shops" stroke="#4f7cff" fill="url(#colorShops)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <h3>Quick actions</h3>
        <div className="row">
          <Link to="/payments"><button className="primary">Review pending payments</button></Link>
          <Link to="/shops?usage=inactive"><button>Find inactive shops to call</button></Link>
          <Link to="/activity"><button>See what shops are doing</button></Link>
        </div>
      </div>
    </>
  );
}
