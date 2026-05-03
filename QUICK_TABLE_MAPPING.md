# Quick Backend-Frontend Mapping Table

## All 13 Database Tables with Frontend Status

```
┌─────────────────────────┬──────────────────────────┬─────────────┬──────────────┐
│ Backend Table           │ Frontend Interface       │ Frontend    │ Status       │
│                         │                          │ Pages       │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 1. chamas               │ ✅ Chama                 │ dashboard   │ ⚠️ Partial   │
│    (13 columns)         │    (missing: desc)       │ members     │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 2. members              │ ⚠️ Member                │ login       │ ❌ Broken    │
│    (13 columns)         │    (missing: role,       │ dashboard   │ CRITICAL     │
│                         │     email, updated_at)   │ members     │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 3. contributions        │ ⚠️ Contribution          │ contrib.    │ ⚠️ Partial   │
│    (11 columns)         │    (missing: status,     │ reports     │              │
│                         │     recorded_by)         │             │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 4. loans                │ ⚠️ Loan                  │ loans       │ ⚠️ Partial   │
│    (14 columns)         │    (missing: disbursed   │ reports     │              │
│                         │     _at, defaulted)      │             │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 5. loan_repayments      │ ⚠️ LoanRepayment         │ loans       │ ❌ Broken    │
│    (7 columns)          │    (wrong date field)    │ reports     │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 6. fines                │ ❌ Fine                  │ fines       │ ❌ Broken    │
│    (10 columns)         │    (missing: status,     │ reports     │ CRITICAL     │
│                         │     due_date, paid_date) │             │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 7. meetings             │ ⚠️ Meeting               │ meetings    │ ⚠️ Partial   │
│    (9 columns)          │    (date mismatch)       │ reports     │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 8. meeting_attendance   │ ❌ MeetingAttendance     │ meetings    │ ❌ Broken    │
│    (5 columns)          │    (status mismatch)     │             │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 9. announcements        │ ⚠️ Announcement          │ announce.   │ ⚠️ Partial   │
│    (9 columns)          │    (missing: category,   │             │              │
│                         │     priority)            │             │              │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 10. reminders           │ ❌ Reminder              │ reminders   │ ❌ Broken    │
│    (10 columns)         │    (schema mismatch)     │ reports     │ CRITICAL     │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 11. contribution_plans  │ ❌ No Interface          │ settings    │ ❌ Missing   │
│    (11 columns)         │    (table only)          │             │ CRITICAL     │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 12. member_wallets      │ ❌ No Interface          │ dashboard   │ ❌ Missing   │
│    (8 columns)          │    (used but untyped)    │ reports     │ CRITICAL     │
├─────────────────────────┼──────────────────────────┼─────────────┼──────────────┤
│ 13. invites             │ ❌ No Interface          │ join        │ ❌ Missing   │
│    (8 columns)          │    (table only)          │             │ CRITICAL     │
└─────────────────────────┴──────────────────────────┴─────────────┴──────────────┘
```

## Legend
- ✅ = Complete match between backend and frontend
- ⚠️ = Partial/Incomplete - some fields missing or mismatched
- ❌ = Broken/Critical issues or completely missing
- CRITICAL = Blocks core functionality

---

## Key Issues by Table

| Table | Issue | Fix |
|---|---|---|
| **members** | Missing `role`, `email` | Add fields to Member interface |
| **fines** | Missing `status`, dates | Rewrite interface completely |
| **reminders** | Schema completely different | Redesign Reminder interface |
| **member_wallets** | No TypeScript interface | Create MemberWallet interface |
| **contribution_plans** | No TypeScript interface | Create ContributionPlan interface |
| **invites** | No TypeScript interface | Create Invite interface |
| **loan_repayments** | Wrong date field name | Fix `paid_at` → `payment_date` |
| **meeting_attendance** | Boolean instead of enum | Fix `attended` → `attendance_status` |
| **meetings** | Date fields split incorrectly | Fix `date/time` → `scheduled_date` |

---

## Critical Fixes Needed (Do First)

```typescript
// BEFORE (Current)
export interface Member {
  id: string;
  chama_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  credit_score: number;
  joined_at: string;
  created_at: string;
}

// AFTER (Fixed)
export interface Member {
  id: string;
  chama_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email?: string;  // ✅ ADD THIS
  status: 'active' | 'inactive' | 'suspended';
  credit_score: number;
  role: 'member' | 'admin' | 'owner';  // ✅ ADD THIS
  joined_at: string;
  created_at: string;
  updated_at: string;  // ✅ ADD THIS
}
```

```typescript
// ADD: MemberWallet interface (missing)
export interface MemberWallet {
  id: string;
  chama_id: string;
  member_id: string;
  balance: number;
  total_contributed: number;
  total_expected: number;
  missed_contributions: number;
  created_at: string;
  updated_at: string;
}
```

```typescript
// ADD: Invite interface (missing)
export interface Invite {
  id: string;
  chama_id: string;
  invite_code: string;
  email?: string;
  created_by: string;
  expires_at?: string;
  used: boolean;
  used_by?: string;
}
```

```typescript
// BEFORE (Broken)
export interface Fine {
  id: string;
  chama_id: string;
  member_id: string;
  reason: string;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

// AFTER (Fixed)
export interface Fine {
  id: string;
  chama_id: string;
  member_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'paid' | 'waived';  // ✅ CHANGE
  due_date?: string;  // ✅ ADD
  paid_date?: string;  // ✅ ADD (not paid_at)
  recorded_by: string;  // ✅ ADD
  created_at: string;
  updated_at: string;  // ✅ ADD
}
```

```typescript
// BEFORE (Schema mismatch)
export interface Reminder {
  id: string;
  chama_id: string;
  member_id: string | null;
  title: string | null;
  message: string;
  reminder_date: string;
  reminder_type: 'upcoming' | 'due' | 'overdue';
  sent: boolean;
  sent_at: string | null;
  created_at: string;
}

// AFTER (Fixed)
export interface Reminder {
  id: string;
  chama_id: string;
  title: string;  // ✅ NOT NULL
  description?: string;  // ✅ ADD
  reminder_type: string;  // User-defined type
  scheduled_date: string;  // ✅ CHANGE (not reminder_date)
  status: 'pending' | 'sent' | 'snoozed';  // ✅ CHANGE (not sent boolean)
  created_by: string;  // ✅ ADD
  created_at: string;
  updated_at: string;  // ✅ ADD
}
```

---

## Mapping Summary

- **13 Backend Tables**
- **Only 10 Frontend Interfaces**
- **3 Tables Missing Interfaces** (member_wallets, contribution_plans, invites)
- **Multiple Schema Mismatches** (reminders, fines, meetings, attendance, loan_repayments)
- **~25 Missing Fields** across all interfaces
- **~10 Broken Fields** with wrong types/names
