import { useState, useEffect } from 'react';
import { Bell, Search, Filter, AlertTriangle, Info, CheckCircle, Megaphone } from 'lucide-react';
import { announcementService } from '../../services';
import toast from 'react-hot-toast';

const priorityConfig = {
  high: { label: 'High', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, border: 'border-l-red-500' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Info, border: 'border-l-yellow-500' },
  low: { label: 'Low', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, border: 'border-l-green-500' },
};

function AnnouncementCard({ announcement }) {
  const priority = priorityConfig[announcement.priority] || priorityConfig.low;
  const Icon = priority.icon;
  const date = new Date(announcement.createdAt);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${priority.border} p-5 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-purple-50 rounded-lg shrink-0">
            <Megaphone className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 truncate">
              {announcement.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {announcement.content}
            </p>
            {announcement.batch && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
                {announcement.batch?.name || 'All Batches'}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${priority.color}`}>
            <Icon className="h-3 w-3" />
            {priority.label}
          </span>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400">
        <span>Posted by:</span>
        <span className="font-medium text-gray-500">
          {announcement.createdBy?.name || 'Admin'}
        </span>
      </div>
    </div>
  );
}

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await announcementService.getAll();
      const data = res.data?.data || res.data || [];
      // Sort newest first
      const sorted = [...(Array.isArray(data) ? data : [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setAnnouncements(sorted);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const filtered = announcements.filter((a) => {
    const matchesSearch =
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Bell className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">Stay updated with the latest notices from your institute</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white appearance-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500 mb-3">
        Showing {filtered.length} of {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Bell className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium text-gray-500">No announcements found</p>
          <p className="text-sm mt-1">
            {searchTerm || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Check back later for updates from your institute'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((announcement) => (
            <AnnouncementCard key={announcement._id} announcement={announcement} />
          ))}
        </div>
      )}
    </div>
  );
}

