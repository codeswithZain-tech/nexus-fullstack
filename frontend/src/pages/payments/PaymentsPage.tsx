import React, { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import {
  apiDeposit,
  apiWithdraw,
  apiTransfer,
  apiGetTransactionHistory,
  apiListInvestors,
  apiListEntrepreneurs,
} from '../../lib/api';

interface Person {
  _id: string;
  name: string;
}

interface Txn {
  _id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  toUser?: { name: string };
}

const statusVariant = { pending: 'accent', completed: 'success', failed: 'error' } as const;

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [amount, setAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => apiGetTransactionHistory().then((res) => setTxns(res.data));

  useEffect(() => {
    load();
    if (!user) return;
    const fetcher = user.role === 'entrepreneur' ? apiListInvestors : apiListEntrepreneurs;
    fetcher().then((res) => setPeople(res.data));
  }, [user]);

  const run = async (fn: () => Promise<any>, successMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      setAmount('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Transaction failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Sandbox mode — no real money moves here</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <ArrowDownCircle size={18} className="text-success-600" /> Deposit
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Input
              type="number"
              min="1"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
            />
            <Button
              fullWidth
              isLoading={busy}
              onClick={() => run(() => apiDeposit(Number(amount)), 'Deposit submitted')}
            >
              Deposit
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <ArrowUpCircle size={18} className="text-accent-600" /> Withdraw
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Input
              type="number"
              min="1"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
            />
            <Button
              variant="outline"
              fullWidth
              isLoading={busy}
              onClick={() => run(() => apiWithdraw(Number(amount)), 'Withdrawal submitted')}
            >
              Withdraw
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Send size={18} className="text-primary-600" /> Transfer
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">To…</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min="1"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
            />
            <Button
              variant="outline"
              fullWidth
              isLoading={busy}
              disabled={!transferTo}
              onClick={() => run(() => apiTransfer(transferTo, Number(amount)), 'Transfer complete')}
            >
              Transfer
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Transaction history</h2>
        </CardHeader>
        <CardBody>
          {txns.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {txns.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                        {t.type}
                        {t.toUser ? ` → ${t.toUser.name}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">${t.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[t.status]} size="sm" className="capitalize">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
