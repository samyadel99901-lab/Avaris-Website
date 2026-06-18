import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, MessageSquare, Loader2 } from 'lucide-react';
import api from '../lib/api';

const typeStyles = {
  failed: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    text: 'text-red-400',
    icon: AlertCircle,
  },
  skipped: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/5',
    text: 'text-amber-300',
    icon: AlertTriangle,
  },
  success: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
    icon: CheckCircle,
  },
  sync: {
    border: 'border-l-indigo-500',
    bg: 'bg-indigo-500/5',
    text: 'text-indigo-300',
    icon: MessageSquare,
  },
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/activities');
      setActivities(response.data.activities);
    } catch (err) {
      console.error('Failed to fetch activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh كل 10 ثواني
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-72 bg-navy-800 border-l border-purple-accent/10 p-5 overflow-y-auto max-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-200">Activity feed</h3>
        <span className="text-[10px] text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
          Live
        </span>
      </div>

      {loading && activities.length === 0 ? (
        <div className="flex items-center gap-2 text-gray-500 py-4">
          <Loader2 size={12} className="animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      ) : activities.length === 0 ? (
        <p className="text-xs text-gray-500 py-4">No activity yet</p>
      ) : (
        <div className="space-y-2.5">
          {activities.map((activity) => {
            const style = typeStyles[activity.type] || typeStyles.sync;
            const Icon = style.icon;
            return (
              <div
                key={activity.id}
                className={`${style.bg} border-l-2 ${style.border} rounded-r p-3`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={11} className={style.text} />
                  <span className={`text-[11px] font-medium ${style.text}`}>
                    {activity.title}
                  </span>
                  <span className="text-[10px] text-gray-500 ml-auto">
                    {activity.time}
                  </span>
                </div>
                {activity.description && (
                  <p className="text-[11px] text-gray-300 mb-1 leading-snug">
                    {activity.description}
                  </p>
                )}
                {activity.detail && (
                  <p className="text-[10px] text-gray-400 font-mono">
                    {activity.detail}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}