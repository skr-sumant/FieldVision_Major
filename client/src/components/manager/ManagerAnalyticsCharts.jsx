import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import {
  Bar,
  Line,
  Doughnut,
  Pie
} from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

import {
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ManagerAnalyticsCharts({ visits = [], salesReps = [] }) {
  const [timeRange, setTimeRange] = useState('7D'); // 'TODAY', '7D', '30D', 'ALL'

  // Filter visits based on selected time range
  const filteredVisits = useMemo(() => {
    const now = new Date();
    if (timeRange === 'TODAY') {
      const todayStr = now.toDateString();
      return visits.filter(v => new Date(v.timestamp).toDateString() === todayStr);
    }
    if (timeRange === '7D') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return visits.filter(v => new Date(v.timestamp) >= sevenDaysAgo);
    }
    if (timeRange === '30D') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return visits.filter(v => new Date(v.timestamp) >= thirtyDaysAgo);
    }
    return visits;
  }, [visits, timeRange]);

  // Chart 1: Daily Visit Volume & Revenue Trend
  const trendData = useMemo(() => {
    const daysMap = {};
    const count = timeRange === 'TODAY' ? 1 : (timeRange === '7D' ? 7 : 14);

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      daysMap[key] = { visits: 0, revenue: 0 };
    }

    filteredVisits.forEach(v => {
      const d = new Date(v.timestamp);
      const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (daysMap[key]) {
        daysMap[key].visits += 1;
        daysMap[key].revenue += (Number(v.orderAmount) || 0);
      }
    });

    const labels = Object.keys(daysMap);
    const visitCounts = labels.map(k => daysMap[k].visits);
    const revenueValues = labels.map(k => daysMap[k].revenue);

    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Visits Recorded',
          data: visitCounts,
          backgroundColor: 'rgba(6, 182, 212, 0.7)',
          borderColor: '#06b6d4',
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Revenue (₹)',
          data: revenueValues,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#10b981',
          pointRadius: 4,
          yAxisID: 'y1'
        }
      ]
    };
  }, [filteredVisits, timeRange]);

  // Chart 2: Sales Rep Target vs Actual Achievement
  const repPerformanceData = useMemo(() => {
    const labels = salesReps.map(r => r.name);
    const targets = salesReps.map(r => r.dailyTarget || 15);
    const achievements = salesReps.map(r => {
      return visits.filter(v => v.repId === r.id).length;
    });

    return {
      labels: labels.length ? labels : ['No Reps Assigned'],
      datasets: [
        {
          label: 'Daily Target',
          data: targets.length ? targets : [15],
          backgroundColor: 'rgba(148, 163, 184, 0.35)',
          borderColor: 'rgba(148, 163, 184, 0.6)',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'Actual Visits Logged',
          data: achievements.length ? achievements : [0],
          backgroundColor: 'rgba(52, 211, 153, 0.8)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };
  }, [salesReps, visits]);

  // Chart 3: Verification & Geofence Breakdown
  const verificationBreakdown = useMemo(() => {
    const verified = filteredVisits.filter(v => v.status === 'Verified').length;
    const pending = filteredVisits.filter(v => v.status === 'Pending Verification').length;
    const flagged = filteredVisits.filter(v => v.status === 'Flagged Anomalous').length;

    return {
      labels: ['Verified (Compliant)', 'Pending Verification', 'Flagged Anomaly'],
      datasets: [
        {
          data: [verified, pending, flagged],
          backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
          borderColor: '#0e1526',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    };
  }, [filteredVisits]);

  // Chart 4: Payment Methods Distribution
  const paymentBreakdown = useMemo(() => {
    const upi = filteredVisits.filter(v => (v.paymentMethod || '').includes('UPI')).length;
    const cash = filteredVisits.filter(v => (v.paymentMethod || '').includes('Cash')).length;
    const credit = filteredVisits.filter(v => !(v.paymentMethod || '').includes('UPI') && !(v.paymentMethod || '').includes('Cash')).length;

    return {
      labels: ['UPI QR / Digital', 'Cash Collected', 'Credit / Pay Later'],
      datasets: [
        {
          data: [upi || 1, cash || 1, credit || 0],
          backgroundColor: ['#06b6d4', '#8b5cf6', '#eab308'],
          borderColor: '#0e1526',
          borderWidth: 2
        }
      ]
    };
  }, [filteredVisits]);

  // Chart 5: Top 5 Outlets by Revenue
  const topOutletsData = useMemo(() => {
    const outletRev = {};
    filteredVisits.forEach(v => {
      const name = v.shopName || 'Retail Outlet';
      outletRev[name] = (outletRev[name] || 0) + (Number(v.orderAmount) || 0);
    });

    const sorted = Object.entries(outletRev)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sorted.map(s => s[0]),
      datasets: [
        {
          label: 'Order Volume (₹)',
          data: sorted.map(s => s[1]),
          backgroundColor: 'rgba(139, 92, 246, 0.75)',
          borderColor: '#8b5cf6',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };
  }, [filteredVisits]);

  const totalFilteredRevenue = filteredVisits.reduce((acc, v) => acc + (Number(v.orderAmount) || 0), 0);
  const totalVerifiedCount = filteredVisits.filter(v => v.status === 'Verified').length;
  const verificationRate = filteredVisits.length ? Math.round((totalVerifiedCount / filteredVisits.length) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Analytics Toolbar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={22} color="#06b6d4" />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Regional Field Telemetry Analytics
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>
              Analyzing {filteredVisits.length} visits across your sales territory
            </p>
          </div>
        </div>

        {/* Time Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(10, 16, 29, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {[
            { id: 'TODAY', label: 'Today' },
            { id: '7D', label: 'Last 7 Days' },
            { id: '30D', label: 'Last 30 Days' },
            { id: 'ALL', label: 'All Time' }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setTimeRange(pill.id)}
              style={{
                background: timeRange === pill.id ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' : 'transparent',
                color: timeRange === pill.id ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Summary Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '14px 18px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Period Visits</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{filteredVisits.length}</div>
          <div style={{ fontSize: '0.72rem', color: '#22d3ee' }}>Recorded on field nodes</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Period Revenue</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>₹{totalFilteredRevenue.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.72rem', color: '#34d399' }}>From shop orders</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Verification Rate</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>{verificationRate}%</div>
          <div style={{ fontSize: '0.72rem', color: '#a78bfa' }}>GPS & Photo compliant</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px 18px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Active Field Reps</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>{salesReps.length}</div>
          <div style={{ fontSize: '0.72rem', color: '#fde68a' }}>Assigned to your zone</div>
        </div>
      </div>

      {/* Row 1: Combo Trend Chart & Rep Performance Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        
        {/* Plot 1: Daily Trajectory */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Visit Volume & Revenue Trajectory
              </h4>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Dual-axis timeline tracking on-ground visits and generated orders
              </p>
            </div>
            <TrendingUp size={18} color="#10b981" />
          </div>

          <div style={{ height: '280px' }}>
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                  legend: {
                    position: 'top',
                    labels: { color: '#cbd5e1', font: { size: 11, weight: '600' } }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(14, 21, 38, 0.95)',
                    titleColor: '#ffffff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(6, 182, 212, 0.4)',
                    borderWidth: 1
                  }
                },
                scales: {
                  x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                  },
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Visits', color: '#06b6d4', font: { size: 10 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Revenue (₹)', color: '#10b981', font: { size: 10 } },
                    grid: { drawOnChartArea: false },
                    ticks: {
                      color: '#10b981',
                      font: { size: 10 },
                      callback: (val) => `₹${Number(val).toLocaleString('en-IN')}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Plot 2: Sales Rep Target vs Achievement */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Sales Rep Target vs Actual Achievement
              </h4>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Comparing daily targets against visits logged by each representative
              </p>
            </div>
            <Target size={18} color="#06b6d4" />
          </div>

          <div style={{ height: '280px' }}>
            <Bar
              data={repPerformanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: { color: '#cbd5e1', font: { size: 11, weight: '600' } }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(14, 21, 38, 0.95)',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    borderWidth: 1
                  }
                },
                scales: {
                  x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                  },
                  y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    title: { display: true, text: 'Visits Count', color: '#94a3b8', font: { size: 10 } }
                  }
                }
              }}
            />
          </div>
        </div>

      </div>

      {/* Row 2: Distribution Charts (Doughnut, Pie, and Top Outlets) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Plot 3: Verification Breakdown */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            Geofence & Verification Quality
          </h4>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '16px' }}>
            Audit compliance breakdown across field visits
          </p>

          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              data={verificationBreakdown}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', font: { size: 10 } }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Plot 4: Payment Methods Share */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            Payment Methods Share
          </h4>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '16px' }}>
            Digital UPI QR vs Cash collections
          </p>

          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pie
              data={paymentBreakdown}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', font: { size: 10 } }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Plot 5: Top Outlets by Revenue */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            Top 5 Outlets By Revenue
          </h4>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '16px' }}>
            Highest purchasing retail outlets in zone
          </p>

          <div style={{ height: '200px' }}>
            {topOutletsData.labels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.8rem' }}>
                No sales order telemetry recorded yet
              </div>
            ) : (
              <Bar
                data={topOutletsData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (item) => `₹${Number(item.raw).toLocaleString('en-IN')}`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      ticks: {
                        color: '#94a3b8',
                        font: { size: 9 },
                        callback: (v) => `₹${v}`
                      }
                    },
                    y: {
                      grid: { display: false },
                      ticks: { color: '#cbd5e1', font: { size: 10 } }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
