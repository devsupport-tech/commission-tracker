# Commission Tracker - Project Handoff Document

**Created:** March 18, 2026
**Repo:** https://github.com/devsupport-tech/commission-tracker
**Local Path:** `C:\Users\steph\Projects\commission-tracker`

---

## Project Overview

A commission splits and referral tracking dashboard for an estimating and restoration company. The system tracks:
- Referral sources (who sends work)
- Commission rules (how commissions are calculated)
- Commission payments (tracking what's owed and paid)
- Job data synced from existing contractor Airtable bases

### Business Context
- **Services:** Estimates, Packouts, Mitigation, Rebuilds
- **Revenue sources:** Referrals from adjusters, contractors, realtors, property managers, past clients
- **Commission structures vary by:**
  - Referral source
  - Job type
  - Commission type: Flat rate vs Percentage
  - Commission basis: Revenue collected vs Net profit

---

## Architecture Decision

**Chosen Approach: Option 1 - No n8n (React reads directly from Airtable)**

```
┌─────────────────────┐
│ Contractor Bases    │──────┐
│  (existing)         │      │  React reads live
└─────────────────────┘      │
                             ▼
┌─────────────────────┐    ┌──────────────────┐
│ Commission Tracker  │◄───│  React Dashboard │
│  (Airtable - slim)  │    └──────────────────┘
└─────────────────────┘
```

**Rationale:**
- Fewer moving parts (no sync service to maintain)
- You control when commissions are calculated (manual review before paying)
- Can add n8n later if automation is needed

**n8n can be added later for:**
- Auto-notifications when jobs close
- Scheduled commission reports
- Slack/email alerts

---

## Existing Airtable Schema (Contractor Bases)

### Claims Table
Key fields for commission tracking:
- `Claim ID` - Unique identifier
- `Last Name`, `First Name`, `Address` - Customer info
- `Status`, `Stage` - Job status
- `Loss Type` - Type of loss/job
- `RCV` - Replacement Cost Value
- `ACV` - Actual Cash Value
- `Total Payout` - Revenue collected (basis for commission)
- `Net Claim Sum` - Net claim amount
- `Deductible`, `O&P` - Financial details
- **`Referral Source`** - **NEW FIELD TO ADD** (links to who referred the job)

### Modules Table
- `Module Type` - Mitigation, Rebuild, Packout, etc.
- `Claim` - Link to Claims
- `Vendor`, `Payment Amount`, `Status`

### Payments Log Table
- `Amount` - Cost/expense amount
- `Claim` - Link to Claims
- `Vendor`, `Status`, `Payment Date`
- Used to calculate total costs for net profit commissions

### Updates Log Table
- Activity/audit trail (not needed for commissions)

---

## New Commission Tracker Airtable Schema

### Table 1: Referral Sources
| Field | Type | Notes |
|-------|------|-------|
| Source ID | Auto Number | Primary key |
| Name | Text | "Mike Johnson" |
| Company | Text | "State Farm" |
| Type | Single Select | Adjuster, Contractor, Realtor, Property Manager, Past Client, Other |
| Email | Email | |
| Phone | Phone | |
| Default Comm Type | Single Select | % of Revenue, % of Profit, Flat Rate |
| Default Comm Rate | Number | e.g., 10 (for 10%) |
| Default Flat Amount | Currency | e.g., $500 |
| Notes | Long Text | |
| Active | Checkbox | |

### Table 2: Commission Rules
| Field | Type | Notes |
|-------|------|-------|
| Rule ID | Auto Number | |
| Rule Name | Text | "Adjuster - Mitigation 10% Revenue" |
| Referral Source | Link | Optional - for specific source overrides |
| Source Type | Single Select | Adjuster, Contractor, etc. |
| Job Type | Single Select | Mitigation, Rebuild, Packout, Estimate, All |
| Commission Basis | Single Select | Revenue Collected, Net Profit, Flat Rate |
| Rate Type | Single Select | Percentage, Flat |
| Rate Value | Number | 10 (for 10%) or 500 (for $500) |
| Min Threshold | Currency | Minimum job $ to qualify |
| Max Commission | Currency | Cap if needed |
| Priority | Number | Higher = checked first |
| Active | Checkbox | |
| Notes | Long Text | |

### Table 3: Commissions
| Field | Type | Notes |
|-------|------|-------|
| Commission ID | Auto Number | |
| Job ID | Text | Reference to contractor base claim |
| Job Source Base | Text | Which contractor base |
| Referral Source | Link | To Referral Sources |
| Rule Applied | Link | To Commission Rules |
| Commission Basis | Single Select | Revenue, Profit, Flat |
| Basis Amount | Currency | The $ amount used to calculate |
| Rate Applied | Number | % or flat amount |
| Commission Amount | Currency | Final commission $ |
| Status | Single Select | Pending, Approved, Paid, Disputed |
| Date Calculated | Date | Auto |
| Date Approved | Date | |
| Date Paid | Date | |
| Payment Method | Single Select | Check, ACH, Cash |
| Payment Reference | Text | Check #, etc. |
| Notes | Long Text | |

---

## Commission Calculation Logic

```
WHEN user clicks "Calculate Commission" for a job:

1. Get Job's Referral Source
2. Get Job's Module Types (from Modules table)
3. Get Job's Total Costs (from Payments Log)
4. Find matching Commission Rule:
   - First: Exact source match + Job Type (Priority highest)
   - Second: Source Type + Job Type
   - Third: Source default rate
   - Fourth: No commission (0%)

5. Calculate commission:
   IF basis = "Revenue Collected":
      amount = Total Payout × rate%
   ELSE IF basis = "Net Profit":
      profit = Total Payout - Total Costs
      amount = profit × rate%
   ELSE IF basis = "Flat Rate":
      amount = flat_amount

6. Apply thresholds:
   - Skip if below Min Threshold
   - Cap at Max Commission if set

7. Create Commission record with status "Pending"
```

---

## What's Been Built

### React Dashboard (Vite + Tailwind)

**Pages:**
- `/` - Overview (KPI cards, recent activity)
- `/referral-sources` - CRUD for referral sources
- `/commission-rules` - Configure calculation rules
- `/payments` - Track commission payments

**Components:**
- `Sidebar` - Dark purple nav matching Claims Master
- `StatsCard` - KPI cards with trends
- `Table` - Data tables with sorting
- `Badge` - Status/type indicators
- `Button` - Primary, secondary, ghost variants

**Services:**
- `src/services/airtable.js` - Full Airtable API integration ready
  - CRUD for all tables
  - Commission calculation functions
  - Multi-base contractor data fetching

**Design:**
- Matches existing Claims Master Financials dashboard
- Dark purple sidebar (#1e1e2d)
- White content area
- Green for positive values
- Red/orange for outstanding/pending
- Card-based KPI layout

---

## Environment Configuration

```bash
# .env file (create from .env.example)

# Airtable API Key
VITE_AIRTABLE_API_KEY=your_api_key_here

# Commission Tracker Base (new base to create)
VITE_TRACKER_BASE_ID=appXXXXXXXXXXXXXX

# Contractor Base(s) - your existing bases
VITE_CONTRACTOR_BASE_1=appXXXXXXXXXXXXXX
```

---

## Deployment

**Target:** Coolify (self-hosted)

**Build Command:** `npm run build`
**Output Directory:** `dist`
**Node Version:** 18+

---

## Next Steps (TODO)

### 1. Create Commission Tracker Airtable Base
- [ ] Create new Airtable base named "Commission Tracker"
- [ ] Create "Referral Sources" table with schema above
- [ ] Create "Commission Rules" table with schema above
- [ ] Create "Commissions" table with schema above
- [ ] Copy Base ID to `.env`

### 2. Add Referral Source Field to Existing Claims Table
- [ ] Add "Referral Source" field (Single Line Text or Link)
- [ ] Backfill existing claims with referral sources if known

### 3. Configure Environment
- [ ] Create `.env` file from `.env.example`
- [ ] Add Airtable API key
- [ ] Add base IDs (tracker + contractor bases)

### 4. Wire Up Live Data
- [ ] Replace mock data in Overview.jsx with Airtable calls
- [ ] Replace mock data in ReferralSources.jsx
- [ ] Replace mock data in CommissionRules.jsx
- [ ] Replace mock data in Payments.jsx
- [ ] Add loading states and error handling

### 5. Add CRUD Modals
- [ ] Add Referral Source modal (create/edit)
- [ ] Add Commission Rule modal (create/edit)
- [ ] Add payment confirmation modal

### 6. Job Sync Feature
- [ ] Build "Sync Jobs" button functionality
- [ ] Show jobs ready for commission calculation
- [ ] Allow assigning referral source to jobs

### 7. Deploy to Coolify
- [ ] Set up Coolify deployment
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)

---

## Example Commission Scenarios

### Scenario 1: Adjuster Referral - Mitigation
- Referral: Mike Johnson (Adjuster)
- Job Type: Mitigation
- Revenue Collected: $8,000
- Rule: Adjuster + Mitigation = 10% of Revenue
- Commission: $800

### Scenario 2: Contractor Referral - Rebuild
- Referral: ABC Contractors
- Job Type: Rebuild
- Revenue: $45,000
- Costs: $30,000
- Net Profit: $15,000
- Rule: Contractor = 8% of Net Profit
- Commission: $1,200

### Scenario 3: Realtor Referral - Any Job
- Referral: Sarah Miller (Realtor)
- Job Type: Any
- Revenue: $5,000 (above $2,500 min threshold)
- Rule: Realtor = $500 Flat Rate
- Commission: $500

### Scenario 4: No Referral
- Referral: None (cold call)
- Commission: $0

---

## File Structure

```
commission-tracker/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx
│   │   │   └── Sidebar.jsx
│   │   └── ui/
│   │       ├── Badge.jsx
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       └── Table.jsx
│   ├── pages/
│   │   ├── Overview.jsx
│   │   ├── ReferralSources.jsx
│   │   ├── CommissionRules.jsx
│   │   └── Payments.jsx
│   ├── services/
│   │   └── airtable.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── vite.config.js
└── HANDOFF.md (this file)
```

---

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Questions to Resolve

1. **Company Splits** - Do you split profit between partners after commissions? If so, we need to add Company Splits table.

2. **Multiple Job Types per Claim** - If a claim has both Mitigation and Rebuild modules, how should commission be calculated? Per module or on total?

3. **Payment Triggers** - When should commission status change from Pending to Approved? When job is paid? When you manually approve?

4. **Historical Data** - Do you want to backfill commissions for past jobs, or start fresh?

---

## Contact / Resources

- **Existing Dashboard:** https://u0gkk0k4w8og444s4c8o8cgw.restorationandremodeling.us/
- **GitHub Repo:** https://github.com/devsupport-tech/commission-tracker
- **Airtable API Docs:** https://airtable.com/developers/web/api/introduction
