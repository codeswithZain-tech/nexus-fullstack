import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MessageCircle, ExternalLink } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { apiListInvestors } from '../../lib/api';

interface InvestorData {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  preferences?: { sectors?: string[]; minTicketSize?: number; maxTicketSize?: number };
  investmentHistory?: { startupName?: string; amount?: number; year?: number; sector?: string }[];
}

export const InvestorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [investors, setInvestors] = useState<InvestorData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListInvestors()
      .then((res) => setInvestors(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = investors.filter((inv) =>
    searchQuery === '' ||
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.preferences?.sectors || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </div>

      <div className="flex items-center gap-4">
        <Input placeholder="Search investors by name, interests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} startAdornment={<Search size={18} />} fullWidth />
        <div className="flex items-center gap-2"><Filter size={18} className="text-gray-500" /><span className="text-sm text-gray-600">{filtered.length} results</span></div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading investors...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((inv) => (
            <Card key={inv._id} hoverable className="transition-all duration-300 h-full" onClick={() => navigate(`/profile/investor/${inv._id}`)}>
              <CardBody className="flex flex-col">
                <div className="flex items-start">
                  <Avatar src={inv.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.name)}&background=random`} alt={inv.name} size="lg" className="mr-4" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{inv.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">Investor • {inv.investmentHistory?.length || 0} investments</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(inv.preferences?.sectors || []).map((s, i) => <Badge key={i} variant="secondary" size="sm">{s}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  {inv.preferences?.minTicketSize && inv.preferences?.maxTicketSize && (
                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-500">Investment Range</span>
                        <p className="text-sm font-medium text-gray-900">${inv.preferences.minTicketSize.toLocaleString()} - ${inv.preferences.maxTicketSize.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
              <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
                <Button variant="outline" size="sm" leftIcon={<MessageCircle size={16} />} onClick={(e) => { e.stopPropagation(); navigate(`/chat/${inv._id}`); }}>Message</Button>
                <Button variant="primary" size="sm" rightIcon={<ExternalLink size={16} />} onClick={() => navigate(`/profile/investor/${inv._id}`)}>View Profile</Button>
              </CardFooter>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-gray-500 col-span-2 text-center py-10">No investors found.</p>}
        </div>
      )}
    </div>
  );
};
