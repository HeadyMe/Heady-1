
import { Button, Card, StatusBadge, Footer } from '@heady/ui';

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            HeadyLens
          </h1>
          <p className="text-xs text-gray-400 mt-1">System Control Surface</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon="🔍" label="Lens Dashboard" active />
          <NavItem icon="✅" label="Tasks & Projects" />
          <NavItem icon="🎨" label="Creative Studio" />
          <NavItem icon="🧠" label="Agents & Logic" />
          <NavItem icon="⚙️" label="Settings" />
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
              U
            </div>
            <div>
              <p className="text-sm font-medium">User</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Status Strip */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6 justify-between">
          <div className="flex items-center gap-6">
            <StatusMetric label="System Health" value="OPTIMAL" status="success" />
            <StatusMetric label="Active Agents" value="5" status="neutral" />
            <StatusMetric label="Avg Latency" value="45ms" status="success" />
          </div>
          <div className="flex gap-3">
             <Button variant="secondary">Explain Mode</Button>
             <Button variant="primary">New Task</Button>
          </div>
        </header>

        {/* Dashboard Widgets */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Focus / Active Tasks */}
            <Card title="Current Focus" className="col-span-2">
              <div className="space-y-4">
                <TaskItem title="Integrate HeadyLens Dashboard" status="in_progress" priority="HIGH" />
                <TaskItem title="Verify OpenTelemetry Pipeline" status="pending" priority="MEDIUM" />
                <TaskItem title="Deploy API Gateway" status="pending" priority="HIGH" />
              </div>
            </Card>

            {/* Insight Panel */}
            <Card title="Heady Insight">
              <div className="prose prose-invert text-sm">
                <p>
                  System is currently prioritizing infrastructure stability. 
                  <span className="text-indigo-400"> API Gateway</span> deployment is blocked by Docker connectivity checks.
                </p>
                <div className="mt-4 p-3 bg-gray-700/50 rounded border border-gray-600">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Suggestion</p>
                  <p>Resolve local Docker pipe issues or switch to cloud sandbox for deployment.</p>
                </div>
              </div>
            </Card>

            {/* Agent Activity */}
            <Card title="Live Agent Activity" className="col-span-1">
              <div className="space-y-3">
                 <ActivityItem agent="Orchestrator" action="Assigning Task #123" time="2s ago" />
                 <ActivityItem agent="Creative" action="Generating Assets" time="15s ago" />
                 <ActivityItem agent="Observer" action="Health Check OK" time="1m ago" />
              </div>
            </Card>

            {/* Timeline / Metrics */}
            <Card title="System Throughput" className="col-span-2">
               <div className="h-48 flex items-center justify-center bg-gray-800/50 rounded border border-gray-700 border-dashed">
                 <p className="text-gray-500">Real-time metric visualization placeholder</p>
               </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: string, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
      active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}>
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function StatusMetric({ label, value, status }: { label: string, value: string, status: 'success' | 'warning' | 'error' | 'neutral' }) {
  const color = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    neutral: 'text-blue-400'
  }[status];

  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 uppercase">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}

function TaskItem({ title, status, priority }: { title: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled', priority: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded border border-gray-700/50">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'in_progress' ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="flex gap-2">
        <StatusBadge status={status} />
        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600">{priority}</span>
      </div>
    </div>
  );
}

function ActivityItem({ agent, action, time }: { agent: string, action: string, time: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-indigo-300">{agent}</span>
        <span className="text-gray-400">{action}</span>
      </div>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  );
}
