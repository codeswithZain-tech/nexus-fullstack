import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Video, Check, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import {
  apiGetMyMeetings,
  apiScheduleMeeting,
  apiRespondToMeeting,
  apiCancelMeeting,
  apiListInvestors,
  apiListEntrepreneurs,
} from '../../lib/api';

interface Person {
  _id: string;
  name: string;
}

interface ApiMeeting {
  _id: string;
  title: string;
  notes?: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  roomId: string;
  organizer: { _id: string; name: string };
  participant: { _id: string; name: string };
}

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  accepted: '#22c55e',
  rejected: '#ef4444',
  cancelled: '#9ca3af',
};

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [form, setForm] = useState({ participant: '', title: '', notes: '', startTime: '', endTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedMeeting, setSelectedMeeting] = useState<ApiMeeting | null>(null);

  const load = useCallback(() => apiGetMyMeetings().then((res) => setMeetings(res.data)), []);

  useEffect(() => {
    load();
    if (!user) return;
    const fetcher = user.role === 'entrepreneur' ? apiListInvestors : apiListEntrepreneurs;
    fetcher().then((res) => setPeople(res.data));
  }, [user, load]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiScheduleMeeting(form);
      toast.success('Meeting scheduled');
      setForm({ participant: '', title: '', notes: '', startTime: '', endTime: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const respond = (id: string, status: 'accepted' | 'rejected') => {
    apiRespondToMeeting(id, status)
      .then(() => {
        toast.success(`Meeting ${status}`);
        setSelectedMeeting(null);
        load();
      })
      .catch((err) => toast.error(err?.response?.data?.message || 'Action failed'));
  };

  const cancel = (id: string) => {
    apiCancelMeeting(id)
      .then(() => {
        toast.success('Meeting cancelled');
        setSelectedMeeting(null);
        load();
      })
      .catch(() => toast.error('Could not cancel meeting'));
  };

  const events = meetings
    .filter((m) => m.status !== 'rejected' && m.status !== 'cancelled')
    .map((m) => {
      const isOrganizer = m.organizer._id === user?.id;
      const other = isOrganizer ? m.participant : m.organizer;
      return {
        id: m._id,
        title: `${m.title} (${other.name})`,
        start: m.startTime,
        end: m.endTime,
        backgroundColor: statusColors[m.status],
        borderColor: statusColors[m.status],
        textColor: '#fff',
        extendedProps: { meeting: m },
      };
    });

  const handleEventClick = (info: any) => {
    setSelectedMeeting(info.event.extendedProps.meeting as ApiMeeting);
  };

  if (!user) return null;
  const otherRoleLabel = user.role === 'entrepreneur' ? 'Investors' : 'Entrepreneurs';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage calls with your connections</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'calendar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('calendar')}
          >
            Calendar
          </Button>
          <Button
            variant={view === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            List
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Schedule a meeting</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{otherRoleLabel.slice(0, -1)}</label>
              <select
                required
                value={form.participant}
                onChange={(e) => setForm({ ...form, participant: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select {otherRoleLabel.toLowerCase().slice(0, -1)}</option>
                {people.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Meeting title" required fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Series A follow-up" />
            <Input label="Start time" type="datetime-local" required fullWidth value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End time" type="datetime-local" required fullWidth value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            <div className="md:col-span-2">
              <Input label="Notes (optional)" fullWidth value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" isLoading={submitting}>Schedule meeting</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Your meetings</h2>
        </CardHeader>
        <CardBody>
          {view === 'calendar' ? (
            <div className="fc-custom">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={events}
                eventClick={handleEventClick}
                height="auto"
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
              />
            </div>
          ) : meetings.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No meetings scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {meetings.map((m) => {
                const isOrganizer = m.organizer._id === user.id;
                const other = isOrganizer ? m.participant : m.organizer;
                const isInvitee = m.participant._id === user.id;
                return (
                  <div key={m._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedMeeting(m)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={`https://ui-avatars.com/api/?name=${encodeURIComponent(other.name)}&background=random`} alt={other.name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                        <p className="text-sm text-gray-500">with {other.name} · {new Date(m.startTime).toLocaleString()}</p>
                        <Badge variant={m.status === 'pending' ? 'accent' : m.status === 'accepted' ? 'success' : m.status === 'rejected' ? 'error' : 'gray'} size="sm" className="mt-1 capitalize">{m.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isInvitee && m.status === 'pending' && (
                        <>
                          <Button variant="success" size="sm" leftIcon={<Check size={16} />} onClick={(e) => { e.stopPropagation(); respond(m._id, 'accepted'); }}>Accept</Button>
                          <Button variant="error" size="sm" leftIcon={<X size={16} />} onClick={(e) => { e.stopPropagation(); respond(m._id, 'rejected'); }}>Decline</Button>
                        </>
                      )}
                      {m.status === 'accepted' && (
                        <Link to={`/call/${m.roomId}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" leftIcon={<Video size={16} />}>Join call</Button>
                        </Link>
                      )}
                      {m.status !== 'cancelled' && (
                        <Button variant="ghost" size="sm" className="p-2 text-error-600" aria-label="Cancel" onClick={(e) => { e.stopPropagation(); cancel(m._id); }}><Trash2 size={18} /></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedMeeting(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedMeeting.title}</h3>
              <Badge variant={selectedMeeting.status === 'pending' ? 'accent' : selectedMeeting.status === 'accepted' ? 'success' : selectedMeeting.status === 'rejected' ? 'error' : 'gray'} size="sm" className="capitalize">{selectedMeeting.status}</Badge>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {selectedMeeting.notes && <p>{selectedMeeting.notes}</p>}
              <p><span className="font-medium">Start:</span> {new Date(selectedMeeting.startTime).toLocaleString()}</p>
              <p><span className="font-medium">End:</span> {new Date(selectedMeeting.endTime).toLocaleString()}</p>
              <p><span className="font-medium">Organizer:</span> {selectedMeeting.organizer.name}</p>
              <p><span className="font-medium">Participant:</span> {selectedMeeting.participant.name}</p>
            </div>
            <div className="flex gap-2">
              {selectedMeeting.participant._id === user.id && selectedMeeting.status === 'pending' && (
                <>
                  <Button variant="success" size="sm" leftIcon={<Check size={16} />} onClick={() => respond(selectedMeeting._id, 'accepted')}>Accept</Button>
                  <Button variant="error" size="sm" leftIcon={<X size={16} />} onClick={() => respond(selectedMeeting._id, 'rejected')}>Decline</Button>
                </>
              )}
              {selectedMeeting.status === 'accepted' && (
                <Link to={`/call/${selectedMeeting.roomId}`}>
                  <Button size="sm" leftIcon={<Video size={16} />}>Join call</Button>
                </Link>
              )}
              {selectedMeeting.status !== 'cancelled' && (
                <Button variant="ghost" size="sm" onClick={() => cancel(selectedMeeting._id)}>Cancel</Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedMeeting(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
