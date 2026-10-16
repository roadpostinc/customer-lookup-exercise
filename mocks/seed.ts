export interface CrmAccount {
  crm_id: string;
  customer_ref: string;
  full_name: string;
  email_address: string;
  account_state: 'active' | 'inactive';
}
export interface Subscription {
  subscription_id: string;
  plan_code: string;
  lifecycle: 'active' | 'cancelled';
  starts_at: string;
  ends_at: string | null;
}
export interface BillingAccount {
  accountId: string;
  externalCustomerRef: string;
  subscriptions: Subscription[];
}
export interface Invoice {
  invoiceId: string;
  accountId: string;
  issuedAt: string;
  dueAt: string;
  currencyCode: 'USD';
  totalMinor: number;
  outstandingMinor: number;
  paymentAttempts: { attemptedAt: string; result: 'failed' | 'succeeded' }[];
}

const refs = Array.from({ length: 12 }, (_, index) => `C${String(index + 1).padStart(3, '0')}`);
export const crmAccounts: CrmAccount[] = refs.filter(ref => ref !== 'C003').map(ref => ({
  crm_id: `crm-${ref.slice(1)}`,
  customer_ref: ref,
  full_name: `Example Customer ${ref.slice(1)}`,
  email_address: ['C009', 'C010'].includes(ref) ? 'shared@example.test' : `${ref.toLowerCase()}@example.test`,
  account_state: ref === 'C011' ? 'inactive' : 'active',
}));
crmAccounts.push({ ...crmAccounts.find(row => row.customer_ref === 'C005')!, crm_id: 'crm-005-b', full_name: 'Example Customer 005 Alternate' });
crmAccounts.sort((a, b) => a.customer_ref.localeCompare(b.customer_ref) || a.crm_id.localeCompare(b.crm_id));

export const billingAccounts: BillingAccount[] = refs.filter(ref => ref !== 'C002').map(ref => ({
  accountId: `bill-${Number(ref.slice(1)) + 700}`,
  externalCustomerRef: ref,
  subscriptions: ['C007', 'C011'].includes(ref) ? [] : [{
    subscription_id: `sub-${ref}`,
    plan_code: 'STANDARD',
    lifecycle: 'active',
    starts_at: ref === 'C012' ? '2030-01-15T12:00:00Z' : '2029-01-01T00:00:00Z',
    ends_at: null,
  }],
}));
// An ended subscription is retained alongside the current one.
billingAccounts.find(row => row.externalCustomerRef === 'C008')!.subscriptions.unshift({
  subscription_id: 'sub-C008-old', plan_code: 'LEGACY', lifecycle: 'active',
  starts_at: '2028-01-01T00:00:00Z', ends_at: '2030-01-15T12:00:00Z',
});

export const invoices: Invoice[] = billingAccounts.filter(row => row.externalCustomerRef !== 'C007').flatMap(account => {
  const ref = account.externalCustomerRef;
  const count = ref === 'C008' ? 6 : 1;
  return Array.from({ length: count }, (_, index) => {
    const unpaid = ['C004', 'C011', 'C012'].includes(ref);
    return {
      invoiceId: `inv-${ref}-${index + 1}`,
      accountId: account.accountId,
      issuedAt: ref === 'C008' ? `2030-01-${String(5 + Math.floor(index / 2)).padStart(2, '0')}T10:00:00Z` : '2030-01-01T00:00:00Z',
      dueAt: ref === 'C012' ? '2030-01-20T00:00:00Z' : '2030-01-10T00:00:00Z',
      currencyCode: 'USD' as const,
      totalMinor: 2500,
      outstandingMinor: unpaid ? 2500 : 0,
      paymentAttempts: ref === 'C004' ? [{ attemptedAt: '2030-01-11T09:00:00Z', result: 'failed' as const }]
        : ref === 'C006' ? [
          { attemptedAt: '2030-01-09T09:00:00Z', result: 'failed' as const },
          { attemptedAt: '2030-01-10T09:00:00Z', result: 'succeeded' as const },
        ] : unpaid ? [] : [{ attemptedAt: '2030-01-09T09:00:00Z', result: 'succeeded' as const }],
    };
  });
});

export function sortedInvoices(accountId: string): Invoice[] {
  return invoices.filter(row => row.accountId === accountId)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt) || a.invoiceId.localeCompare(b.invoiceId));
}
