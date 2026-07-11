import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Building2, MapPin, UserCircle, BarChart3, Briefcase } from 'lucide-react';
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
  preferences?: { sectors?: string[]; minTicketSize?: number; maxTicketSize?: number };
  investmentHistory?: { startupName?: string; amount?: number; year?: number; sector?: string }[];
}

export const InvestorProfile: React.FC = () => {
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
        <Link to="/dashboard/investor"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === profile._id;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`} alt={profile.name} size="xl" className="mx-auto sm:mx-0" />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1"><Building2 size={16} className="mr-1" />Investor • {profile.investmentHistory?.length || 0} investments</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {(profile.preferences?.sectors || []).map((s, i) => <Badge key={i} variant="primary" size="sm">{s}</Badge>)}
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && <Link to={`/chat/${profile._id}`}><Button leftIcon={<MessageCircle size={18} />}>Message</Button></Link>}
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

          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Interests</h2></CardHeader>
            <CardBody>
              <div className="space-y-4">
                {(profile.preferences?.sectors || []).length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-900">Sectors</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(profile.preferences.sectors || []).map((s, i) => <Badge key={i} variant="primary" size="md">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {profile.preferences?.minTicketSize && profile.preferences?.maxTicketSize && (
                  <div>
                    <h3 className="text-md font-medium text-gray-900">Investment Range</h3>
                    <p className="text-gray-700 mt-1">${profile.preferences.minTicketSize.toLocaleString()} - ${profile.preferences.maxTicketSize.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {(profile.investmentHistory || []).length > 0 && (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Investment History</h2>
                <span className="text-sm text-gray-500">{profile.investmentHistory?.length || 0} investments</span>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(profile.investmentHistory || []).map((inv, index) => (
                    <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md">
                      <div className="p-3 bg-primary-50 rounded-md mr-3">
                        <Briefcase size={18} className="text-primary-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{inv.startupName || 'Startup'}</h3>
                        <p className="text-xs text-gray-500">{inv.sector || ''}{inv.year ? ` • ${inv.year}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {profile.preferences?.minTicketSize && (
          <div className="space-y-6">
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Details</h2></CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Investment Range</span>
                    <p className="text-lg font-semibold text-gray-900">${profile.preferences.minTicketSize.toLocaleString()} - ${profile.preferences.maxTicketSize?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total Investments</span>
                    <p className="text-md font-medium text-gray-900">{profile.investmentHistory?.length || 0} companies</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
