import { useState } from 'react';
import { Plus, CreditCard as CardIcon, Layers } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useInstallments } from '@/hooks/useInstallments';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/utils';
import { AddCardModal } from '@/components/modals/AddCardModal';
import { AddInstallmentModal } from '@/components/modals/AddInstallmentModal';
import type { CreditCard, Installment } from '@/types';

// ─── Credit Card Visual ───────────────────────────────────────
interface CreditCardTileProps {
  card: CreditCard;
  installments: Installment[];
  currency: string;
  onAddInstallment: (cardId: string) => void;
  onMarkPaid: (installmentId: string) => void;
}

function CreditCardTile({ card, installments, currency, onAddInstallment, onMarkPaid }: CreditCardTileProps) {
  const cardInstallments = installments.filter(
    (i) => i.credit_card_id === card.id && i.is_active && i.paid_months < i.total_months
  );
  const totalDue = cardInstallments.reduce((sum, i) => sum + i.monthly_amount, 0);

  return (
    <div className="mx-4">
      {/* Card face */}
      <div
        className="relative rounded-3xl p-5 mb-3 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${card.color}cc, ${card.color}44)` }}
      >
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs text-white/60 font-medium uppercase tracking-wider">{card.bank ?? 'Credit Card'}</p>
            <p className="text-white font-bold text-lg mt-0.5">{card.card_name}</p>
          </div>
          <CardIcon size={28} className="text-white/70" />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Monthly Due</p>
            <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(totalDue, currency)}</p>
          </div>
          <div className="text-right">
            {card.last_four && (
              <p className="text-sm font-mono text-white/70">•••• {card.last_four}</p>
            )}
            <p className="text-[10px] text-white/50 mt-1">
              Statement: {card.statement_day} · Due: {card.due_day}
            </p>
          </div>
        </div>
      </div>

      {/* Installments for this card */}
      {cardInstallments.length > 0 && (
        <Card className="mb-2 p-0 overflow-hidden divide-y divide-slate-200">
          {cardInstallments.map((inst) => {
            const remaining = inst.total_months - inst.paid_months;
            const progress  = (inst.paid_months / inst.total_months) * 100;
            return (
              <div key={inst.id} className="px-4 py-3">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-slate-900">{inst.description}</p>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-bold text-blue-600 tabular-nums">
                      {formatCurrency(inst.monthly_amount, currency)}/mo
                    </span>
                    <button
                      onClick={() => onMarkPaid(inst.id)}
                      title="Mark this month as paid"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 active:scale-95 transition-all text-base leading-none"
                    >
                      ✓
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {remaining} mo left
                  </span>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* Add installment for this card */}
      <button
        onClick={() => onAddInstallment(card.id)}
        className="w-full mb-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl border border-dashed border-slate-300 hover:border-brand-400 transition-all"
      >
        <Plus size={14} />
        Add Installment
      </button>
    </div>
  );
}

// ─── Cards Page ───────────────────────────────────────────────
export default function Cards() {
  const { profile } = useProfile();
  const currency = profile?.currency ?? 'THB';
  const { cards, loading: cardsLoading }           = useCreditCards();
  const { installments, totalMonthlyDue, loading: installLoading, markPaid } = useInstallments();

  const isLoading = cardsLoading || installLoading;

  const [showAddCard, setShowAddCard]           = useState(false);
  const [showAddInst, setShowAddInst]           = useState(false);
  const [selectedCardId, setSelectedCardId]     = useState<string | undefined>();

  function handleAddInstallment(cardId: string) {
    setSelectedCardId(cardId);
    setShowAddInst(true);
  }

  return (
    <Layout>
      <Header
        title="Credit Cards"
        subtitle={`${cards.length} card${cards.length !== 1 ? 's' : ''} · Total due ${formatCurrency(totalMonthlyDue, currency)}`}
        right={
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowAddCard(true)}>
            Add Card
          </Button>
        }
      />

      <div className="pt-4 pb-6 space-y-5">
        {isLoading ? (
          <div className="mx-4 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-slate-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="mx-4">
            <Card className="text-center py-12 space-y-3">
              <CardIcon size={40} className="text-slate-600 mx-auto" />
              <p className="text-slate-500">No credit cards yet</p>
              <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowAddCard(true)}>
                Add your first card
              </Button>
            </Card>
          </div>
        ) : (
          cards.map((card) => (
            <CreditCardTile
              key={card.id}
              card={card}
              installments={installments}
              currency={currency}
              onAddInstallment={handleAddInstallment}
              onMarkPaid={(id) => void markPaid(id)}
            />
          ))
        )}

        {/* Summary footer */}
        {!isLoading && cards.length > 0 && (
          <Card className="mx-4 flex items-center gap-3" variant="elevated">
            <span className="p-2.5 bg-blue-50 rounded-xl">
              <Layers size={18} className="text-blue-600" />
            </span>
            <div className="flex-1">
              <p className="text-xs text-slate-500">Total Installment Charges</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">
                {formatCurrency(totalMonthlyDue, currency)}
                <span className="text-xs text-slate-500 font-normal ml-1">/month</span>
              </p>
            </div>
            <Badge variant="info">{installments.filter(i => i.is_active).length} active</Badge>
          </Card>
        )}
      </div>

      <AddCardModal open={showAddCard} onClose={() => setShowAddCard(false)} />
      <AddInstallmentModal
        open={showAddInst}
        onClose={() => { setShowAddInst(false); setSelectedCardId(undefined); }}
        cards={cards}
        defaultCardId={selectedCardId}
      />
    </Layout>
  );
}
