# Commission Tracker - Project Handoff Document

**Created:** March 18, 2026
**Last Updated:** March 18, 2026
**Repo:** https://github.com/devsupport-tech/commission-tracker
**Local Path:** `C:\Users\steph\Projects\commission-tracker`

---

## Project Overview

A commission splits and referral tracking dashboard for an estimating and restoration company. The system tracks:
- Referral sources (who sends work)
- Commission rules (how commissions are calculated)
- Commission payments (tracking what's owed and paid)
- Company splits (partner profit distribution after commissions)
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

## Key Decisions (Resolved)

| Question | Decision |
|----------|----------|
| Company Splits needed? | **YES** - Partners split profit after commissions |
| Multiple job types per claim? | Commission is **per-job based on referral**. Job type in rules determines the *rate*, but commission calculated on whole job, not per module |
| Historical data? | **Manual backfill later** - start fresh for now |
| Automation (n8n)? | **Not now** - React reads directly, add n8n later if needed |

---

## Architecture

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
- **Note:** Job type used for rate matching, but commission is per-job not per-module

### Payments Log Table
- `Amount` - Cost/expense amount
- `Claim` - Link to Claims
- `Vendor`, `Status`, `Payment Date`
- Used to calculate total costs for net profit commissions

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

### Table 4: Partners
| Field | Type | Notes |
|-------|------|-------|
| Partner ID | Auto Number | |
| Name | Text | Partner name |
| Role | Single Select | Owner, Partner, Investor |
| Split Percentage | Number | e.g., 60 for 60% |
| Email | Email | |
| Phone | Phone | |
| Active | Checkbox | |
| Notes | Long Text | |

### Table 5: Company Splits
| Field | Type | Notes |
|-------|------|-------|
| Split ID | Auto Number | |
| Job ID | Text | Reference to contractor base claim |
| Date | Date | Date calculated |
| Net Profit | Currency | Job's net profit |
| Commission Deducted | Currency | Commission paid out |
| Distributable Profit | Currency | Net Profit - Commissions |
| Partner | Link | To Partners |
| Partner Percentage | Number | % at time of split |
| Split Amount | Currency | Partner's share |
| Status | Single Select | Pending, Distributed |
| Date Distributed | Date | |
| Notes | Long Text | |

---

## Commission & Split Calculation Flow

```
WHEN user processes a completed job:

1. GET JOB DATA
   - Fetch job from contractor base (Claims table)
   - Get Total Payout (revenue)
   - Sum costs from Payments Log table
   - Calculate Net Profit = Revenue - Costs

2. CALCULATE COMMISSION (if referral exists)
   - Get Referral Source from job
   - Find matching Commission Rule (by priority)
   - Calculate commission amount based on rule
   - Create Commission record (status: Pending)

3. CALCULATE COMPANY SPLITS
   - Distributable Profit = Net Profit - Commission Amount
   - For each active Partner:
     - Split Amount = Distributable Profit × Partner %
   - Create Company Split records (status: Pending)

4. MANUAL APPROVAL
   - Review commission in Payments page
   - Approve → Mark commission "Approved"
   - Pay → Mark commission "Paid"
   - Distribute → Mark company splits "Distributed"
```

---

## What's Been Built

### React Dashboard (Vite + Tailwind)

**Pages:**
| Route | Page | Description |
|-------|------|-------------|
| `/` | Overview | KPI cards, recent activity |
| `/referral-sources` | Referral Sources | CRUD for referral sources |
| `/commission-rules` | Commission Rules | Configure calculation rules |
| `/payments` | Payments | Track commission payments |
| `/company-splits` | Company Splits | Partner profit distribution |

**Components:**
- `Sidebar` - Dark purple nav matching Claims Master
- `StatsCard` - KPI cards with trends
- `Table` - Data tables with sorting
- `Badge` - Status/type indicators
- `Button` - Primary, secondary, ghost variants

**Services:**
- `src/services/airtable.js` - Full Airtable API integration
  - CRUD for Referral Sources, Commission Rules, Commissions
  - CRUD for Partners, Company Splits
  - Commission calculation function
  - Company splits calculation function
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
- [ ] Create "Partners" table with schema above
- [ ] Create "Company Splits" table with schema above
- [ ] Copy Base ID to `.env`

### 2. Add Referral Source Field to Existing Claims Table
- [ ] Add "Referral Source" field (Single Line Text or Link)
- [ ] Backfill will be done manually later

### 3. Configure Environment
- [ ] Create `.env` file from `.env.example`
- [ ] Add Airtable API key
- [ ] Add base IDs (tracker + contractor bases)

### 4. Wire Up Live Data
- [ ] Replace mock data in Overview.jsx with Airtable calls
- [ ] Replace mock data in ReferralSources.jsx
- [ ] Replace mock data in CommissionRules.jsx
- [ ] Replace mock data in Payments.jsx
- [ ] Replace mock data in CompanySplits.jsx
- [ ] Add loading states and error handling

### 5. Add CRUD Modals
- [ ] Add Referral Source modal (create/edit)
- [ ] Add Commission Rule modal (create/edit)
- [ ] Add Partner modal (create/edit)
- [ ] Add payment confirmation modal

### 6. Job Sync Feature
- [ ] Build "Sync Jobs" button functionality
- [ ] Show jobs ready for commission calculation
- [ ] Allow assigning referral source to jobs
- [ ] Calculate commission + splits together

### 7. Deploy to Coolify
- [ ] Set up Coolify deployment
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)

---

## Example Scenarios

### Scenario 1: Full Flow - Adjuster Referral
```
Job: CLM-2024-005
Referral: Mike Johnson (Adjuster)
Job Type: Mitigation
Revenue Collected: $10,000
Total Costs: $6,000
Net Profit: $4,000

Commission Calculation:
- Rule: Adjuster + Mitigation = 10% of Revenue
- Commission: $10,000 × 10% = $1,000

Company Splits:
- Distributable: $4,000 - $1,000 = $3,000
- Partner A (60%): $1,800
- Partner B (40%): $1,200
```

### Scenario 2: Net Profit Commission
```
Job: CLM-2024-006
Referral: ABC Contractors
Job Type: Rebuild
Revenue: $45,000
Costs: $30,000
Net Profit: $15,000

Commission Calculation:
- Rule: Contractor = 8% of Net Profit
- Commission: $15,000 × 8% = $1,200

Company Splits:
- Distributable: $15,000 - $1,200 = $13,800
- Partner A (60%): $8,280
- Partner B (40%): $5,520
```

### Scenario 3: Flat Rate Commission
```
Job: CLM-2024-007
Referral: Sarah Miller (Realtor)
Revenue: $5,000
Net Profit: $2,000

Commission Calculation:
- Rule: Realtor = $500 Flat (min threshold $2,500 revenue)
- Commission: $500

Company Splits:
- Distributable: $2,000 - $500 = $1,500
- Partner A (60%): $900
- Partner B (40%): $600
```

### Scenario 4: No Referral
```
Job: CLM-2024-008
Referral: None (cold call)
Net Profit: $5,000

Commission: $0

Company Splits:
- Distributable: $5,000
- Partner A (60%): $3,000
- Partner B (40%): $2,000
```

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
│   │   ├── Payments.jsx
│   │   └── CompanySplits.jsx
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

## Contact / Resources

- **Existing Dashboard:** https://u0gkk0k4w8og444s4c8o8cgw.restorationandremodeling.us/
- **GitHub Repo:** https://github.com/devsupport-tech/commission-tracker
- **Airtable API Docs:** https://airtable.com/developers/web/api/introduction
