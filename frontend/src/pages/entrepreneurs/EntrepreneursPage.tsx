import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MessageCircle, ExternalLink } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { apiListEntrepreneurs } from '../../lib/api';

interface EntrepreneurData {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  startupHistory?: { name?: string; description?: string; stage?: string; fundingNeeded?: number }[];
  preferences?: { sectors?: string[]; minTicketSize?: number; maxTicketSize?: number };
}

export const EntrepreneursPage: React.FC = () => {
  const navigate = useNavigate();
  const [entrepreneurs, setEntrepreneurs] = useState<EntrepreneurData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListEntrepreneurs()
      .then((res) => setEntrepreneurs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = entrepreneurs.filter((e) =>
    searchQuery === '' ||
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.startupHistory || []).some((s) => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">Discover promising startups looking for investment</p>
      </div>

      <div className="flex items-center gap-4">
        <Input placeholder="Search startups by name, industry..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} startAdornment={<Search size={18} />} fullWidth />
        <div className="flex items-center gap-2"><Filter size={18} className="text-gray-500" /><span className="text-sm text-gray-600">{filtered.length} results</span></div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading startups...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((e) => {
            const startup = e.startupHistory?.[0];
            return (
              <Card key={e._id} hoverable className="transition-all duration-300 h-full" onClick={() => navigate(`/profile/entrepreneur/${e._id}`)}>
                <CardBody className="flex flex-col">
                  <div className="flex items-start">
                    <Avatar src={e.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&background=random`} alt={e.name} size="lg" className="mr-4" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{e.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{startup?.name || 'Entrepreneur'}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {startup?.stage && <Badge variant="primary" size="sm">{startup.stage}</Badge>}
                        {(e.preferences?.sectors || []).map((s, i) => <Badge key={i} variant="gray" size="sm">{s}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 line-clamp-3">{e.bio || startup?.description || ''}</p>
                  </div>
                  {startup?.fundingNeeded && (
                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-500">Funding Need</span>
                        <p className="text-sm font-medium text-gray-900">${startup.fundingNeeded.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </CardBody>
                <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
                  <Button variant="outline" size="sm" leftIcon={<MessageCircle size={16} />} onClick={(e) => { e.stopPropagation(); navigate(`/chat/${e._id}`); }}>Message</Button>
                  <Button variant="primary" size="sm" rightIcon={<ExternalLink size={16} />} onClick={() => navigate(`/profile/entrepreneur/${e._id}`)}>View Profile</Button>
                </CardFooter>
              </Card>
            );
          })}
          {filtered.length === 0 && <p className="text-gray-500 col-span-2 text-center py-10">No startups found.</p>}
        </div>
      )}
    </div>
  );
};
