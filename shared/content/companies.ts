/**
 * The 6 fictional companies and their employer personas (SPEC.md §6). No real brands or people.
 */
import type { Company, EmployerUser } from '../types.ts';

export const companies: Company[] = [
  {
    id: 'co_orbitline',
    name: 'Orbitline Logistics',
    industry: 'Logistics software',
    tagline: 'Every shipment, on time, in sight.',
    about:
      'Orbitline builds shipment-tracking and dispatch software for about 300 regional freight carriers. Our public Shipment Tracking API answers roughly 40 million status checks a day for shippers, carriers and the apps built on top of them. We run Node.js and TypeScript services on Postgres and Redis.',
    logoColor: '#0EA5E9',
    logoInitials: 'OL',
    location: 'Chicago, IL',
    size: '200–500 employees',
    hiringFor: ['Junior Backend Engineer', 'Associate Product Manager'],
  },
  {
    id: 'co_fernhill',
    name: 'Fernhill Health',
    industry: 'Digital health',
    tagline: 'Care that fits around your life.',
    about:
      'Fernhill runs 14 primary-care clinics across Minnesota and Wisconsin, plus Fernhill Anywhere, a telehealth membership with about 48,000 members who get video visits and async messaging with a care team. Our analytics team turns visit, scheduling and membership data into decisions clinic managers can act on.',
    logoColor: '#0D9488',
    logoInitials: 'FH',
    location: 'Minneapolis, MN',
    size: '500–1,000 employees',
    hiringFor: ['Data Analyst I'],
  },
  {
    id: 'co_kitebird',
    name: 'Kitebird',
    industry: 'Consumer social app',
    tagline: 'Find your people, one hobby at a time.',
    about:
      'Kitebird is a social app built around hobby communities, from film photography and bouldering to sourdough and tabletop games, with about 2.3 million monthly active users. Our nine-person design team owns everything from first-run onboarding to the words on every button.',
    logoColor: '#F97316',
    logoInitials: 'KB',
    location: 'New York, NY',
    size: '50–200 employees',
    hiringFor: ['Associate Product Designer'],
  },
  {
    id: 'co_cobalt',
    name: 'Cobalt Ridge Bank',
    industry: 'Regional banking',
    tagline: 'Banking that knows your street.',
    about:
      'Cobalt Ridge is a regional bank with 62 branches across the Carolinas and Virginia and $9.4B in assets. Our FP&A team owns the annual budget and the monthly forecast, and explains every variance to the CFO and the board.',
    logoColor: '#1E40AF',
    logoInitials: 'CR',
    location: 'Charlotte, NC',
    size: '1,000–5,000 employees',
    hiringFor: ['Financial Analyst (Rotational)'],
  },
  {
    id: 'co_sproutly',
    name: 'Sproutly Foods',
    industry: 'Packaged foods',
    tagline: 'Snacks that grow on you.',
    about:
      'Sproutly makes legume-based snacks, including lentil puffs and pea crunchies, sold in about 2,100 grocery stores across the Mountain West and online. We are a small brand team that launches two or three products a year on scrappy budgets.',
    logoColor: '#65A30D',
    logoInitials: 'SF',
    location: 'Denver, CO',
    size: '50–200 employees',
    hiringFor: ['Marketing Coordinator'],
  },
  {
    id: 'co_ironvale',
    name: 'Ironvale Security',
    industry: 'Managed security',
    tagline: 'Eyes on glass, 24/7.',
    about:
      'Ironvale is a managed detection and response provider. Our 24/7 SOC watches over about 180 mid-sized clients, including clinics, credit unions and manufacturers, and our analysts triage thousands of alerts every night so our clients can sleep.',
    logoColor: '#475569',
    logoInitials: 'IV',
    location: 'Austin, TX',
    size: '200–500 employees',
    hiringFor: ['SOC Analyst I'],
  },
];

export const employers: EmployerUser[] = [
  { id: 'emp_jordan', companyId: 'co_orbitline', name: 'Jordan Park', title: 'Talent Lead' },
  { id: 'emp_priya', companyId: 'co_fernhill', name: 'Priya Nair', title: 'Analytics Manager' },
  { id: 'emp_sam', companyId: 'co_kitebird', name: 'Sam Ortiz', title: 'Design Director' },
  { id: 'emp_grace', companyId: 'co_cobalt', name: 'Grace Liu', title: 'FP&A Manager' },
  { id: 'emp_marcus', companyId: 'co_sproutly', name: 'Marcus Bell', title: 'Brand Manager' },
  { id: 'emp_tomas', companyId: 'co_ironvale', name: 'Tomás Reyes', title: 'SOC Lead' },
];
