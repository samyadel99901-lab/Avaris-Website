export const mockInvoices = [
  {
    id: 1,
    customer: 'Olivia Bennett',
    email: 'olivia.bennett@testmail.org',
    amount: 120,
    status: 'Not Sent',
    items: [
      { name: 'Just Listed: Stunning Bedroom Home', amount: 120, code: '#0103' }
    ]
  },
  {
    id: 2,
    customer: 'Liam Parker',
    email: 'liam.parker@provider.net',
    amount: 240,
    status: 'Not Sent',
    items: [
      { name: 'Inside This Beautiful Family Home', amount: 120, code: '#0104' },
      { name: 'Cinematic Real Estate Tour', amount: 120, code: '#0105' }
    ]
  },
  {
    id: 3,
    customer: 'Sophia Mitchell',
    email: 'sophia.m@example.com',
    amount: 200,
    status: 'Deposit',
    items: [
      { name: 'Luxury Property Showcase', amount: 200, code: '#0102' }
    ]
  },
  {
    id: 4,
    customer: 'Noah Anderson',
    email: 'n.anderson@testmail.org',
    amount: 325,
    status: 'Not Sent',
    items: [
      { name: 'Dream Home Walkthrough', amount: 250, code: '#0106' },
      { name: 'New Listing Video', amount: 75, code: '#0107' }
    ]
  },
  {
    id: 5,
    customer: 'Ethan Carter',
    email: 'ethan.carter@example.com',
    amount: 150,
    status: 'Not Sent',
    items: [
      { name: 'Charlotte Walker', amount: 75, code: '#0108' },
      { name: 'Bright & Spacious Home', amount: 75, code: '#0109' }
    ]
  },
  {
    id: 6,
    customer: 'Charlotte Walker',
    email: 'charlotte.walker@example.com',
    amount: 200,
    status: 'Not Sent',
    items: [
      { name: 'Cozy Corner Home Tour', amount: 200, code: '#0110' }
    ]
  },
  {
    id: 7,
    customer: 'Lucas Harrison',
    email: 'lucas.h@example.com',
    amount: 250,
    status: 'Not Sent',
    items: [
      { name: 'Home for Sale: Full Walkthrough', amount: 250, code: '#0111' }
    ]
  }
];

export const mockActivities = [
  {
    id: 1,
    type: 'failed',
    title: 'Failed to send',
    description: 'Cinematic Real Estate Tour',
    detail: 'Code: #0102 — invalid email',
    time: '2m ago'
  },
  {
    id: 2,
    type: 'skipped',
    title: 'Skipped',
    description: 'Modern Home Tour',
    detail: 'Code: #0098 — price empty',
    time: '3m ago'
  },
  {
    id: 3,
    type: 'success',
    title: 'Sent successfully',
    description: 'Ethan Carter — 2 items',
    detail: '$150.00 USD',
    time: '5m ago'
  },
  {
    id: 4,
    type: 'success',
    title: 'Sent successfully',
    description: 'Sandbox Buyer — 3 items',
    detail: '$2,700.00 USD',
    time: '5m ago'
  },
  {
    id: 5,
    type: 'sync',
    title: 'Monday sync',
    description: '7 invoices loaded — 0 warnings',
    detail: '',
    time: '12m ago'
  }
];

export const mockHistory = [
  {
    id: 101,
    customer: 'Sandbox Buyer Test',
    email: 'sb-wvp43v...@personal.example.com',
    amount: 2700,
    items: 3,
    status: 'Sent',
    date: '2026-04-27 02:53'
  },
  {
    id: 100,
    customer: 'Ethan Carter',
    email: 'ethan.carter@example.com',
    amount: 150,
    items: 2,
    status: 'Sent',
    date: '2026-04-27 02:30'
  },
  {
    id: 99,
    customer: 'Sandbox Buyer',
    email: 'sb-wvp43v...@personal.example.com',
    amount: 1000,
    items: 3,
    status: 'Sent',
    date: '2026-04-26 16:34'
  }
];