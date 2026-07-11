import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, PieChart, Search, PlusCircle, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { CardFooter } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { apiListEntrepreneurs } from '../../lib/api';

interface EntData {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  startupHistory?: { name?: string; description?: string; stage?: string; fundingNeeded?: number }[];
  preferences?: { sectors?: string[] };
}

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entrepreneurs, setEntrepreneurs] = useState<EntData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListEntrepreneurs()
      .then((res) => setEntrepreneurs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const filtered = entrepreneurs.filter((e) =>
    searchQuery === '' ||
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.startupHistory?.[0]?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const industries = new Set(entrepreneurs.flatMap((e) => e.preferences?.sectors || []));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        <Link to="/entrepreneurs"><Button leftIcon={<PlusCircle size={18} />}>View All Startups</Button></Link>
      </div>

      <div className="flex items-center gap-4">
        <Input placeholder="Search startups or keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} fullWidth startAdornment={<Search size={18} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4"><Users size={20} className="text-primary-700" /></div>
              <div><p className="text-sm font-medium text-primary-700">Total Startups</p><h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3></div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4"><PieChart size={20} className="text-secondary-700" /></div>
              <div><p className="text-sm font-medium text-secondary-700">Industries</p><h3 className="text-xl font-semibold text-secondary-900">{industries.size}</h3></div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4"><Users size={20} className="text-accent-700" /></div>
              <div><p className="text-sm font-medium text-accent-700">Connections</p><h3 className="text-xl font-semibold text-accent-900">0</h3></div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><h2 className="text-lg font-medium text-gray-900">Featured Startups</h2></CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading startups...</p>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.slice(0, 6).map((e) => {
                const startup = e.startupHistory?.[0];
                return (
                  <Card key={e._id} hoverable className="transition-all duration-300 h-full" onClick={() => navigate(`/profile/entrepreneur/${e._id}`)}>
                    <CardBody>
                      <div className="flex items-start">
                        <Avatar src={e.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&background=random`} alt={e.name} size="lg" className="mr-4" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{e.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{startup?.name || 'Entrepreneur'}</p>
                          {startup?.stage && <Badge variant="primary" size="sm">{startup.stage}</Badge>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{e.bio || startup?.description || ''}</p>
                      {startup?.fundingNeeded && <p className="text-sm font-medium text-gray-900 mt-2">Funding: ${startup.fundingNeeded.toLocaleString()}</p>}
                    </CardBody>
                    <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
                      <Button variant="outline" size="sm" leftIcon={<MessageCircle size={16} />} onClick={(ev) => { ev.stopPropagation(); navigate(`/chat/${e._id}`); }}>Message</Button>
                      <Button variant="primary" size="sm" rightIcon={<ExternalLink size={16} />} onClick={() => navigate(`/profile/entrepreneur/${e._id}`)}>View</Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No startups found</p>
              <Button variant="outline" className="mt-2" onClick={() => setSearchQuery('')}>Clear filters</Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
