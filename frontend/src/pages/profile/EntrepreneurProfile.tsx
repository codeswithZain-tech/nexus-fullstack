import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { apiGetUser } from '../../lib/api';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  startupHistory?: { name?: string; description?: string; stage?: string; fundingNeeded?: number }[];
  preferences?: { sectors?: string[] };
}

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiGetUser(id)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-center text-gray-500 py-10">Loading profile...</p>;

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
        <p className="text-gray-600 mt-2">The user you're looking for doesn't exist.</p>
        <Link to="/dashboard/entrepreneur"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === profile._id;
  const startup = profile.startupHistory?.[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`} alt={profile.name} size="xl" className="mx-auto sm:mx-0" />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1"><Building2 size={16} className="mr-1" />{startup?.name ? `Founder at ${startup.name}` : 'Entrepreneur'}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {startup?.stage && <Badge variant="primary">{startup.stage}</Badge>}
                {(profile.preferences?.sectors || []).map((s, i) => <Badge key={i} variant="gray">{s}</Badge>)}
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && <Link to={`/chat/${profile._id}`}><Button variant="outline" leftIcon={<MessageCircle size={18} />}>Message</Button></Link>}
            {isCurrentUser && <Button variant="outline" leftIcon={<UserCircle size={18} />}>Edit Profile</Button>}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
            <CardBody><p className="text-gray-700">{profile.bio || 'No bio provided yet.'}</p></CardBody>
          </Card>
          {startup?.description && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Overview</h2></CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div><h3 className="text-md font-medium text-gray-900">Description</h3><p className="text-gray-700 mt-1">{startup.description}</p></div>
                  {startup.stage && <div><h3 className="text-md font-medium text-gray-900">Stage</h3><p className="text-gray-700 mt-1 capitalize">{startup.stage}</p></div>}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {startup?.fundingNeeded && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Funding</h2></CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Funding Needed</span>
                    <div className="flex items-center mt-1"><DollarSign size={18} className="text-accent-600 mr-1" /><p className="text-lg font-semibold text-gray-900">${startup.fundingNeeded.toLocaleString()}</p></div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
