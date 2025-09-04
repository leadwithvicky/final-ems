"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { reportsAPI } from '@/lib/api';
import ReportLineChart from '@/components/dashboard/ReportLineChart';
import Heatmap from '@/components/dashboard/Heatmap';
import PieChart from '@/components/dashboard/PieChart';
import { departmentAPI, pollsAPI } from '@/lib/api';

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [department, setDepartment] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [team, setTeam] = useState<string>('');
  const [attendance, setAttendance] = useState<any>(null);
  const [leaves, setLeaves] = useState<any>(null);
  const [payroll, setPayroll] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'attendance'|'leaves'|'payroll'|'engagement'>('attendance');
  const [polls, setPolls] = useState<any[]>();
  const [closedPolls, setClosedPolls] = useState<any[]>();
  const [newPoll, setNewPoll] = useState<{ question: string; type: 'mcq'|'yesno'|'rating'|'text'; options: string; isAnonymousAllowed: boolean }>({ question: '', type: 'mcq', options: '', isAnonymousAllowed: true });

  const params = useMemo(() => ({
    department: department || undefined,
    team: team || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  }), [department, team, startDate, endDate]);

  useEffect(() => {
    let mounted = true;
    departmentAPI.getAll().then(res => {
      if (!mounted) return;
      const names = (res.data || []).map((d: any) => d.name || d);
      setDepartments(names);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      reportsAPI.attendance(params),
      reportsAPI.leaves(params),
      reportsAPI.payroll({ department }),
      reportsAPI.engagement(params),
      pollsAPI.list('active'),
      pollsAPI.list('closed')
    ])
      .then(([a, l, p, e, pa, pc]) => {
        if (!mounted) return;
        setAttendance(a.data);
        setLeaves(l.data);
        setPayroll(p.data);
        setEngagement(e.data);
        setPolls(pa.data || []);
        setClosedPolls(pc.data || []);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [params, department]);

  return (
    <div className="p-4 space-y-6">
      <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/dashboard" className="hover:text-gray-800">Dashboard</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-800 font-medium">Reports</li>
        </ol>
      </nav>

      <div className="bg-gradient-to-r from-orange-500 to-coral-500 rounded-2xl text-white p-6">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-orange-100">Filter and export insights across attendance, leaves, payroll, and engagement.</p>
      </div>

      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <select className="input" value={department} onChange={e => setDepartment(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input className="input" placeholder="Team (Position)" value={team} onChange={e => setTeam(e.target.value)} />
        <button
          className="px-3 py-2 border dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={async () => {
            const blob = await reportsAPI.exportCsv('/reports/attendance', params);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'attendance.csv'; a.click(); URL.revokeObjectURL(url);
          }}
        >Export Attendance CSV</button>
        <button
          className="px-3 py-2 border dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={async () => {
            const blob = await reportsAPI.exportCsv('/reports/leaves', params);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'leaves.csv'; a.click(); URL.revokeObjectURL(url);
          }}
        >Export Leaves CSV</button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800 mt-2">
          <nav className="flex flex-wrap gap-4">
            {([
              { id: 'attendance', label: 'Attendance' },
              { id: 'leaves', label: 'Leaves' },
              { id: 'payroll', label: 'Payroll' },
              { id: 'engagement', label: 'Engagement' }
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTab(t.id)}
                className={`py-2 px-2 border-b-2 text-sm font-medium ${selectedTab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              >{t.label}</button>
            ))}
          </nav>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      {/* 1. Attendance */}
      {selectedTab === 'attendance' && (
      <section className="space-y-3">
        <div className="card p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Attendance Reports</h3>
        {attendance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-3">
              <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Days Present vs Absent</h4>
              <div className="h-64">
                <ReportLineChart data={{
                  labels: attendance.daily.map((d: any) => d._id.d),
                  values: attendance.daily.map((d: any) => d.present - d.absent)
                }} />
              </div>
            </div>
            <div className="card p-3">
              <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Attendance Heatmap</h4>
              <Heatmap days={attendance.daily.map((d: any) => ({ date: d._id.d, present: d.present, absent: d.absent }))} />
            </div>
            <div className="card p-3">
              <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Employee-wise Summary</h4>
              <div className="max-h-72 overflow-auto text-sm">
                <table className="table w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1">Employee</th>
                      <th className="py-1">Present</th>
                      <th className="py-1">Absent</th>
                      <th className="py-1">Late</th>
                      <th className="py-1">Early Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.employees.map((e: any) => (
                      <tr key={e.employeeId} className="border-t border-gray-200 dark:border-gray-800">
                        <td className="py-1">{e.name}</td>
                        <td className="py-1">{e.presentDays}</td>
                        <td className="py-1">{e.absentDays}</td>
                        <td className="py-1">{e.lateArrivals}</td>
                        <td className="py-1">{e.earlyDepartures}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </div>
      </section>
      )}

      {/* Engagement: Polls create, active, closed */}
      {selectedTab === 'engagement' && (
      <section className="space-y-3">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h4 className="font-medium mb-3">Create New Poll (Admin only)</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Question" value={newPoll.question} onChange={e=>setNewPoll({...newPoll, question: e.target.value})} />
            <select className="border rounded px-3 py-2" value={newPoll.type} onChange={e=>setNewPoll({...newPoll, type: e.target.value as any})}>
              <option value="mcq">Multiple Choice</option>
              <option value="yesno">Yes / No</option>
              <option value="rating">Rating (1-5)</option>
              <option value="text">Open Text</option>
            </select>
            <input className="border rounded px-3 py-2" placeholder="Options (comma-separated)" value={newPoll.options} onChange={e=>setNewPoll({...newPoll, options: e.target.value})} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newPoll.isAnonymousAllowed} onChange={e=>setNewPoll({...newPoll, isAnonymousAllowed: e.target.checked})} /> Allow anonymous</label>
            <button className="border rounded px-3 py-2 hover:bg-gray-50" onClick={async()=>{
              try {
                const payload: any = { question: newPoll.question, type: newPoll.type, isAnonymousAllowed: newPoll.isAnonymousAllowed };
                if (newPoll.type === 'mcq' || newPoll.type === 'yesno') {
                  payload.options = newPoll.options.split(',').map(s=>s.trim()).filter(Boolean);
                  if (newPoll.type === 'yesno' && payload.options.length === 0) payload.options = ['Yes','No'];
                }
                await pollsAPI.create(payload);
                const pa = await pollsAPI.list('active');
                setPolls(pa.data || []);
                setNewPoll({ question: '', type: 'mcq', options: '', isAnonymousAllowed: true });
              } catch {}
            }}>Create Poll</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <h4 className="font-medium mb-3">Active Polls</h4>
          <div className="space-y-3">
            {(polls||[]).length === 0 && <div className="text-sm text-gray-600">No active polls.</div>}
            {(polls||[]).map((poll:any) => (
              <div key={poll._id} className="border rounded p-3">
                <div className="font-medium mb-2">{poll.question}</div>
                {(user?.role === 'employee') && (poll.type === 'mcq' || poll.type === 'yesno') ? (
                  <div className="flex flex-wrap gap-2">
                    {(poll.options||[]).map((opt:string) => (
                      <button key={opt} className="px-3 py-1 border rounded hover:bg-gray-50" onClick={async()=>{ await pollsAPI.vote(poll._id, { answer: opt }); const pa = await pollsAPI.list('active'); setPolls(pa.data||[]); }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (user?.role === 'employee' && poll.type === 'rating') ? (
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map(r => (
                      <button key={r} className="px-2 py-1 border rounded" onClick={async()=>{ await pollsAPI.vote(poll._id, { answer: r }); const pa = await pollsAPI.list('active'); setPolls(pa.data||[]); }}>{r}★</button>
                    ))}
                  </div>
                ) : (user?.role === 'employee' && poll.type === 'text') ? (
                  <div className="flex gap-2">
                    <input className="border rounded px-2 py-1 flex-1" placeholder="Your feedback" id={`txt-${poll._id}`} />
                    <button className="px-3 py-1 border rounded" onClick={async()=>{
                      const el = document.getElementById(`txt-${poll._id}`) as HTMLInputElement | null;
                      const val = el?.value || '';
                      if (!val.trim()) return;
                      await pollsAPI.vote(poll._id, { answer: val });
                      if (el) el.value = '';
                    }}>Submit</button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Voting available to employees only.</div>
                )}
                <div className="mt-2 text-xs text-gray-500">Anonymous allowed: {poll.isAnonymousAllowed ? 'Yes' : 'No'}</div>
                <div className="mt-3">
                  <PollResults pollId={poll._id} question={poll.question} type={poll.type} />
                </div>
                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                  <div className="mt-2 flex gap-2">
                    <button className="px-3 py-1 border rounded hover:bg-gray-50" onClick={async()=>{ await pollsAPI.close(poll._id); const [pa, pc] = await Promise.all([pollsAPI.list('active'), pollsAPI.list('closed')]); setPolls(pa.data||[]); setClosedPolls(pc.data||[]); }}>Close</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <h4 className="font-medium mb-3">Closed Polls (Results)</h4>
          <div className="space-y-3">
            {(closedPolls||[]).length === 0 && <div className="text-sm text-gray-600">No closed polls.</div>}
            {(closedPolls||[]).map((poll:any) => (
              <div key={poll._id} className="border rounded">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <div className="font-medium">{poll.question}</div>
                  {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <button className="px-3 py-1 border rounded text-red-600 hover:bg-red-50" onClick={async()=>{ await pollsAPI.delete(poll._id); const pc = await pollsAPI.list('closed'); setClosedPolls(pc.data||[]); }}>Delete</button>
                  )}
                </div>
                <div className="p-3">
                  <ClosedPoll poll={poll} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 2. Leaves */}
      {selectedTab === 'leaves' && (
      <section className="space-y-3">
        <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="text-lg font-medium">Leave & Time-Off Reports</h3>
        {leaves && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-3">
              <h4 className="font-medium mb-2">Leaves Taken vs Available</h4>
              <div className="text-sm max-h-72 overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1">Employee</th>
                      <th className="py-1">Approved</th>
                      <th className="py-1">Pending</th>
                      <th className="py-1">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.employees.map((e: any) => (
                      <tr key={e.employeeId} className="border-t">
                        <td className="py-1">{e.name}</td>
                        <td className="py-1">{e.approvedDays}</td>
                        <td className="py-1">{e.pendingDays}</td>
                        <td className="py-1">{e.availableLeaves}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border rounded p-3">
              <h4 className="font-medium mb-2">Pending Approvals</h4>
              <div className="text-3xl font-semibold">{leaves.pendingApprovals}</div>
            </div>
            <div className="border rounded p-3">
              <h4 className="font-medium mb-2">Leave Types Proportion</h4>
              <PieChart labels={leaves.leaveTypeBreakdown.map((x: any) => x._id)} values={leaves.leaveTypeBreakdown.map((x: any) => x.days)} />
            </div>
          </div>
        )}
        </div>
      </section>
      )}

      {/* 3. Payroll */}
      {selectedTab === 'payroll' && (
      <section className="space-y-3">
        <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="text-lg font-medium">Payroll & Salary Reports</h3>
        {payroll && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <h4 className="font-medium mb-2">Monthly Salary Summaries</h4>
              <div className="text-sm max-h-72 overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1">Employee</th>
                      <th className="py-1">Net</th>
                      <th className="py-1">Bonus</th>
                      <th className="py-1">Deductions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.employees.map((e: any) => (
                      <tr key={e.employeeId} className="border-t">
                        <td className="py-1">{e.name}</td>
                        <td className="py-1">{e.netSalary}</td>
                        <td className="py-1">{e.bonus}</td>
                        <td className="py-1">{e.deductions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border rounded p-3">
              <h4 className="font-medium mb-2">Tax & Compliance</h4>
              <div className="h-64">
                <ReportLineChart data={{
                  labels: payroll.taxAndCompliance.map((x: any) => `${x._id.y}-${String(x._id.m).padStart(2,'0')}`),
                  values: payroll.taxAndCompliance.map((x: any) => x.tax + x.insurance + x.pension + x.other)
                }} />
              </div>
              <div className="mt-3">
                <button
                  className="border rounded px-3 py-2 hover:bg-gray-50"
                  onClick={async () => {
                    const blob = await reportsAPI.exportCsv('/reports/payroll', { department, team });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'payroll.csv'; a.click(); URL.revokeObjectURL(url);
                  }}
                >Export Payroll CSV</button>
              </div>
            </div>
          </div>
        )}
        </div>
      </section>
      )}

      {/* 4. Engagement */}
      {selectedTab === 'engagement' && (
      <section className="space-y-3">
        <div className="bg-white rounded-xl shadow-lg p-4">
        <h3 className="text-lg font-medium">Employee Engagement & Feedback</h3>
        {engagement && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <h4 className="font-medium mb-2">Satisfaction Scores</h4>
              <div className="text-sm max-h-72 overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1">Employee</th>
                      <th className="py-1">Score</th>
                      <th className="py-1">Completed</th>
                      <th className="py-1">Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engagement.satisfaction.map((e: any) => (
                      <tr key={e.employeeId} className="border-t">
                        <td className="py-1">{e.name}</td>
                        <td className="py-1">{e.score}</td>
                        <td className="py-1">{(engagement.engagement.find((g: any) => g.employeeId === e.employeeId)?.tasksCompleted) || 0}</td>
                        <td className="py-1">{(engagement.engagement.find((g: any) => g.employeeId === e.employeeId)?.feedbackInteractions) || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border rounded p-3">
              <h4 className="font-medium mb-2">Engagement Over Time</h4>
              <div className="h-64">
                <ReportLineChart data={{
                  labels: (attendance?.daily || []).map((d: any) => d._id.d),
                  values: (attendance?.daily || []).map((d: any) => d.present)
                }} />
              </div>
            </div>
          </div>
        )}
        </div>
      </section>
      )}
    </div>
  );
};

export default ReportsPage;



const ClosedPoll: React.FC<{ poll: any }> = ({ poll }) => {
  const [results, setResults] = React.useState<any>(null);
  React.useEffect(() => { pollsAPI.results(poll._id).then(r=>setResults(r.data)).catch(()=>{}); }, [poll._id]);
  if (!results) return <div className="border rounded p-3">Loading...</div>;
  if (poll.type === 'mcq' || poll.type === 'yesno') {
    const labels = Object.keys(results.breakdown);
    const values = labels.map((k:string)=> results.breakdown[k] || 0);
    return (
      <div className="border rounded p-3">
        <div className="font-medium mb-2">{poll.question}</div>
        <PieChart labels={labels} values={values} />
        <div className="mt-2 text-xs text-gray-500">Responses: {results.total}</div>
      </div>
    );
  }
  if (poll.type === 'rating') {
    const labels = ['1','2','3','4','5'];
    const values = labels.map(k => results.breakdown[k] || 0);
    return (
      <div className="border rounded p-3">
        <div className="font-medium mb-2">{poll.question}</div>
        <PieChart labels={labels} values={values} />
        <div className="mt-2 text-xs text-gray-500">Responses: {results.total}</div>
      </div>
    );
  }
  return (
    <div className="border rounded p-3">
      <div className="font-medium mb-2">{poll.question}</div>
      <div className="text-sm text-gray-700 space-y-1 max-h-48 overflow-auto">
        {(results.breakdown.texts || []).map((t:string, idx:number) => (
          <div key={idx} className="border-b last:border-0 py-1">{t}</div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">Responses: {results.total}</div>
      {Array.isArray(results.voters) && results.voters.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          <div className="font-semibold">Voters:</div>
          <div className="mt-1 space-y-1">
            {results.voters.map((v:any, i:number)=> (
              <div key={i}>{v.name}{v.department?` • ${v.department}`:''}: {v.answer}</div>
            ))}
          </div>
        </div>
      )}
      {Array.isArray(results.keywords) && results.keywords.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          <div className="font-semibold">Top keywords:</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {results.keywords.map((k:any)=> (
              <span key={k.word} className="px-2 py-0.5 bg-gray-100 rounded">{k.word} ({k.count})</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PollResults: React.FC<{ pollId: string; question: string; type: string }> = ({ pollId, question, type }) => {
  const [results, setResults] = React.useState<any>(null);
  React.useEffect(() => {
    let mounted = true;
    const load = () => pollsAPI.results(pollId).then(r=>{ if (mounted) setResults(r.data); }).catch(()=>{});
    load();
    const id = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, [pollId]);
  if (!results) return null;
  if (type === 'mcq' || type === 'yesno') {
    const labels = Object.keys(results.breakdown);
    const values = labels.map((k:string)=> results.breakdown[k] || 0);
    return (
      <div>
        <div className="text-xs text-gray-600 mb-1">Live results</div>
        <PieChart labels={labels} values={values} />
        <div className="mt-1 text-xs text-gray-500">Responses: {results.total}</div>
      </div>
    );
  }
  if (type === 'rating') {
    const labels = ['1','2','3','4','5'];
    const values = labels.map(k => results.breakdown[k] || 0);
    return (
      <div>
        <div className="text-xs text-gray-600 mb-1">Live results</div>
        <PieChart labels={labels} values={values} />
        <div className="mt-1 text-xs text-gray-500">Responses: {results.total}</div>
      </div>
    );
  }
  return null;
};