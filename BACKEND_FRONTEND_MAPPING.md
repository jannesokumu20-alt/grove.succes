# Backend-Frontend Table Mismatch Analysis

## Summary
This document maps all 13 backend database tables to their frontend implementations (interfaces, hooks, pages, and API usage).

---

## COMPREHENSIVE TABLE MAPPING

| Backend Table | Columns (Key) | Frontend Interface | Frontend Usage Pages | Status | Issues |
|---|---|---|---|---|---|
| **chamas** | id, user_id, name, invite_code, contribution_amount, meeting_day, savings_goal, status, created_at | `Chama` | dashboard, join, members, settings | ✅ Mapped | Missing: `description` field in interface |
| **members** | id, chama_id, user_id, name, phone, status, credit_score, role, joined_at, created_at, email* | `Member` | login, dashboard, members, contributions, loans | ✅ Mapped | ⚠️ Missing: `role`, `email`, `updated_at` in interface |
| **contributions** | id, chama_id, member_id, amount, month, year, note, recorded_by, status, created_at | `Contribution` | contributions, reports | ✅ Mapped | ⚠️ Missing: `status`, `recorded_by` in interface |
| **loans** | id, chama_id, member_id, amount, balance, interest_rate, repayment_months, monthly_payment, reason, status, approved_by, disbursed_at, due_date | `Loan` | loans, reports | ✅ Mapped | ⚠️ Missing: `disbursed_at`, `defaulted` status in interface |
| **loan_repayments** | id, loan_id, amount, payment_date, note, recorded_by, created_at | `LoanRepayment` | loans (indirect), reports | ✅ Mapped | ⚠️ Missing: `note`, `payment_date` in interface; has `paid_at` instead |
| **fines** | id, chama_id, member_id, amount, reason, status, due_date, paid_date, recorded_by | `Fine` | fines, reports | ✅ Mapped | ⚠️ Missing: `status`, `due_date`, `paid_date`, `recorded_by` in interface; has `paid` boolean instead |
| **meetings** | id, chama_id, title, description, scheduled_date, location, status, created_by, created_at | `Meeting` | meetings, reports | ✅ Mapped | ⚠️ Schema mismatch: backend has `scheduled_date`, interface has `date` + `time` separate |
| **meeting_attendance** | id, meeting_id, member_id, attendance_status, created_at | `MeetingAttendance` | meetings | ✅ Mapped | ⚠️ Schema mismatch: backend has `attendance_status`, interface has `attended` boolean |
| **announcements** | id, chama_id, title, content, category, priority, created_by, created_at | `Announcement` | announcements | ✅ Mapped | ⚠️ Missing: `category`, `priority` in interface |
| **reminders** | id, chama_id, title, description, reminder_type, scheduled_date, status, created_by, created_at | `Reminder` | reminders, reports | ⚠️ Partial | ❌ Major mismatch: backend structure differs significantly from interface |
| **contribution_plans** | id, chama_id, name, description, monthly_amount, collection_frequency, target_amount, status, start_date, end_date | ❌ No interface | settings (indirect) | ❌ Missing | ❌ Backend table exists but NO frontend interface |
| **member_wallets** | id, chama_id, member_id, balance, total_contributed, total_expected, missed_contributions | ❌ No interface | dashboard, reports (indirect) | ⚠️ Partial | ⚠️ Used in code but NO interface type defined |
| **invites** | id, chama_id, invite_code, email, created_by, expires_at, used, used_by | ❌ No interface | join | ⚠️ Partial | ❌ Backend table exists but NO frontend interface |

---

## CRITICAL ISSUES & MISMATCHES

### 1. **MEMBER TABLE MISMATCHES**
```
Backend Columns        | Frontend Interface | Status
┌──────────────────────┼────────────────────┼─────────┐
│ role (VARCHAR)       │ ❌ Missing        │ BLOCKER │
│ email (VARCHAR)      │ ❌ Missing        │ BLOCKER │
│ updated_at           │ ❌ Missing        │ WARNING │
│ user_id (nullable)   │ ✅ Present        │ OK      │
└──────────────────────┴────────────────────┴─────────┘
```
**Impact**: Role-based features won't work. Email-based signin broken.

---

### 2. **REMINDER TABLE SCHEMA MISMATCH**
```
Backend Schema:
  - reminder_type (VARCHAR)
  - scheduled_date (TIMESTAMP)
  - status (VARCHAR: pending/sent/snoozed)
  - created_by (UUID)

Frontend Interface:
  - member_id (should be NULL)
  - reminder_date (not scheduled_date)
  - reminder_type (enum: upcoming/due/overdue)
  - sent (boolean, not status)
  - sent_at (not in backend)
```
**Impact**: Reminders won't save/retrieve correctly.

---

### 3. **MEETING/ATTENDANCE MISMATCH**
```
Backend (meetings table):
  - scheduled_date (TIMESTAMP) - single field
  
Backend (meeting_attendance):
  - attendance_status (VARCHAR: present/absent/excused)

Frontend Interface:
  - date (string)
  - time (string) - TWO separate fields
  
MeetingAttendance:
  - attended (boolean) - not attendance_status enum
```
**Impact**: Can't properly save/load meeting times. Attendance status lost.

---

### 4. **MISSING INTERFACE DEFINITIONS**
```
Tables with NO Frontend Interface:
  ❌ contribution_plans - Backend table exists, frontend code doesn't
  ❌ member_wallets - Used in code but NO TypeScript interface
  ❌ invites - Used in code but NO TypeScript interface
```
**Impact**: Type safety lost. Query results untyped.

---

### 5. **FINE TABLE MISMATCH**
```
Backend Columns        | Frontend Interface | Issue
┌──────────────────────┼────────────────────┼─────────────────┐
│ status               │ ❌ Missing        │ BLOCKER         │
│ due_date             │ ❌ Missing        │ WARNING         │
│ paid_date            │ ❌ Missing        │ WARNING         │
│ recorded_by          │ ❌ Missing        │ WARNING         │
│ amount (DECIMAL)     │ ✅ Present        │ Type mismatch?  │
│ (interface has paid) │ ✅ Present        │ Not in backend  │
└──────────────────────┴────────────────────┴─────────────────┘
```
**Impact**: Fine status tracking completely broken.

---

### 6. **LOAN REPAYMENT MISMATCH**
```
Backend                   | Frontend Interface | Status
┌──────────────────────────┼────────────────────┼────────┐
│ payment_date (DATE)      │ ❌ Missing        │ ERROR  │
│ recorded_by (UUID)       │ ❌ Missing        │ ERROR  │
│ note (TEXT)              │ ❌ Missing        │ ERROR  │
│ (interface has paid_at)  │ ✅ Present        │ WRONG  │
└──────────────────────────┴────────────────────┴────────┘
```
**Impact**: Repayment date/timestamp won't save properly.

---

## MISSING FEATURES IN FRONTEND INTERFACES

| Backend Feature | Frontend Status | Impact |
|---|---|---|
| member.role (owner/admin/member) | ❌ Missing | No role-based access control |
| member.email | ❌ Missing | Email-based signin blocked |
| fines.status | ❌ Missing | Can't track fine payments |
| fines.due_date/paid_date | ❌ Missing | No fine payment tracking |
| meetings.description | ❌ Missing | Meeting details incomplete |
| reminders.created_by | ❌ Missing | Can't track who created reminders |
| contribution_plans | ❌ No Interface | Entire feature missing frontend support |

---

## PAGES & THEIR TABLE DEPENDENCIES

| Page | Tables Used | Status | Issues |
|---|---|---|---|
| **login** | members, auth.users | ⚠️ Partial | Missing email field |
| **dashboard** | chamas, members, member_wallets | ⚠️ Partial | No wallet interface |
| **members** | chamas, members, roles | ✅ OK | Missing role support |
| **contributions** | contributions, members, chamas | ⚠️ Partial | Missing status field |
| **loans** | loans, loan_repayments, members | ⚠️ Partial | Date field mismatch |
| **fines** | fines, members, chamas | ❌ Broken | Missing all fine fields |
| **meetings** | meetings, meeting_attendance, members | ⚠️ Partial | Date/time mismatch |
| **announcements** | announcements, chamas | ⚠️ Partial | Missing priority/category |
| **reminders** | reminders, chamas | ❌ Broken | Major schema mismatch |
| **join** | chamas, invites, members | ⚠️ Partial | No invite interface |
| **reports** | All tables | ❌ Broken | Multiple mismatches |
| **settings** | chamas, contribution_plans | ⚠️ Partial | No plan interface |

---

## RECOMMENDED FIXES (Priority Order)

### **CRITICAL (Break current functionality)**
1. ✅ Add `email` field to Member interface (DONE for signin)
2. ✅ Add `role` field to Member interface (needed for RBAC)
3. 🔴 Add `MemberWallet` interface (used but untyped)
4. 🔴 Fix Reminder interface schema mismatch
5. 🔴 Add Invite interface

### **HIGH (Missing critical features)**
6. 🔴 Add `status` field to Fine interface
7. 🔴 Fix MeetingAttendance `attended` → `attendance_status`
8. 🔴 Fix Meeting `date/time` → `scheduled_date`

### **MEDIUM (Data consistency)**
9. 🔴 Add missing fields to Contribution interface
10. 🔴 Add `ContributionPlan` interface
11. 🔴 Add missing Fine fields (due_date, paid_date)

### **LOW (Enhancement)**
12. 🔴 Add Announcement category/priority
13. 🔴 Add missing audit fields (recorded_by, created_by)

---

## NEXT STEPS

1. **Update `src/types/index.ts`** with all missing fields
2. **Run type checking** to catch undefined references
3. **Test each page** with real data from backend
4. **Add missing interface definitions** (Wallet, Invite, ContributionPlan)
5. **Run database query tests** to verify field mappings
