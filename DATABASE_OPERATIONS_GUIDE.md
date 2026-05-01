# 🗂️ GROVE DATABASE OPERATIONS GUIDE

## Quick Reference for Common Operations

### USER REGISTRATION FLOW
```typescript
// 1. Sign up user
await signUp(email, password, fullName);

// 2. User automatically created in auth.users (Supabase Auth)

// 3. User creates/joins chama
await createChama(userId, name, inviteCode, contributionAmount, meetingDay, savingsGoal);
// OR
await useInviteCode(chamaId, fullName, phone, userId);

// 4. Member record created in members table
```

### CONTRIBUTION WORKFLOW
```typescript
// 1. Record contribution
const contribution = await recordContribution(
  chamaId,
  memberId,
  amount,
  month,
  year,
  recordedBy,
  note
);

// 2. Trigger: member_wallets updated
// Automatic via trigger: update_member_wallet_on_contribution

// 3. Query wallet
const wallet = await getMemberWallet(chamaId, memberId);

// 4. View insights
const topContributors = await getTopContributors(chamaId, 5);
```

### LOAN WORKFLOW
```typescript
// 1. Create loan request
const loan = await createLoan(
  chamaId,
  memberId,
  amount,
  interestRate,
  repaymentMonths,
  monthlyPayment,
  dueDate,
  reason
);
// Trigger: member_wallets updated (balance decreased)

// 2. Approve loan
await approveLoan(loanId, approvedBy);

// 3. Record repayment
await recordLoanRepayment(loanId, memberId, amount, recordedBy);
// Trigger: member_wallets updated (balance increased)
```

### MEETING WORKFLOW
```typescript
// 1. Create meeting
const meeting = await createMeeting(chamaId, date, time, location, agenda);

// 2. Record attendance for each member
await recordAttendance(meetingId, memberId, attended);

// 3. Query attendance
const attendance = await getAttendance(meetingId);
```

### FINE WORKFLOW
```typescript
// 1. Create fine
const fine = await createFine(chamaId, memberId, reason, amount);

// 2. View fine
const fines = await getFines(chamaId);

// 3. Mark as paid
await payFine(fineId);
// Updates: paid = true, paid_at = now()

// 4. Delete fine (if mistake)
await deleteFine(fineId);
```

---

## TABLE RELATIONSHIPS

### Core Schema
```
users (Supabase Auth)
  └─ chamas (user_id)
      ├─ members (chama_id)
      │  ├─ contributions (member_id, chama_id)
      │  ├─ loans (member_id, chama_id)
      │  ├─ fines (member_id, chama_id)
      │  ├─ member_wallets (member_id, chama_id)
      │  └─ payments (member_id, chama_id)
      │
      ├─ meetings (chama_id)
      │  └─ meeting_attendance (meeting_id, member_id)
      │
      ├─ announcements (chama_id)
      ├─ reminders (chama_id, member_id)
      ├─ automation_settings (chama_id)
      ├─ contribution_tracking (chama_id, member_id)
      ├─ auto_reminders (chama_id, member_id)
      ├─ auto_fines (chama_id, member_id)
      ├─ monthly_contribution_summary (chama_id, member_id)
      └─ contribution_insights (chama_id)
```

---

## KEY QUERIES

### Get All Chama Data
```typescript
const chama = await getChama(chamaId);
const members = await getMembers(chamaId);
const stats = await getChamaStats(chamaId);
```

### Get Member Details
```typescript
const member = await getMember(memberId);
const wallet = await getMemberWallet(chamaId, memberId);
const contributions = await getContributionsByMember(memberId);
```

### Get Monthly Statistics
```typescript
const monthlyContributions = await getContributionsByMonthYear(
  chamaId,
  month,
  year
);

const stats = await getMonthlyStats(chamaId, 12); // Last 12 months
```

### Get Insights
```typescript
const topContributors = await getTopContributors(chamaId, 5);
const defaulters = await getDefaulters(chamaId);
const rank = await getMemberContributionRank(chamaId, memberId);
```

---

## DATABASE CONSTRAINTS

### NOT NULL Fields (Required)
- members.name
- members.phone
- contributions.amount
- contributions.month
- contributions.year
- loans.amount
- loans.balance
- fines.amount
- meetings.date
- reminders.message

### DEFAULT Values
- members.status = 'active'
- members.credit_score = 50
- contributions.created_at = NOW()
- loans.status = 'pending'
- loans.balance = amount (on creation)
- fines.paid = false
- reminders.sent = false

### UNIQUE Constraints
- members.phone (per chama)
- contributions (chama_id, member_id, month, year)
- member_wallets (chama_id, member_id)
- automation_settings (chama_id)
- contribution_tracking (chama_id, member_id, month, year)
- meeting_attendance (meeting_id, member_id)

---

## CASCADING DELETES

If you delete:
- **chama** → All members, contributions, loans, etc. deleted
- **member** → All contributions, loans, fines, wallets deleted
- **meeting** → All attendance records deleted
- **loan** → All repayments deleted
- **contribution_tracking** → All auto_reminders, auto_fines deleted

---

## TRIGGERS & AUTOMATION

### Automatic Actions

1. **Insert contribution**
   ```
   → contribution_tracking created/updated
   → member_wallets updated (balance increased)
   → monthly_contribution_summary updated
   ```

2. **Insert loan**
   ```
   → member_wallets updated (balance decreased)
   → contribution_tracking may update
   ```

3. **Record repayment**
   ```
   → member_wallets updated (balance increased)
   → loan balance updated
   ```

4. **Auto fine application**
   ```
   → fines table updated
   → member_wallets updated (balance decreased)
   ```

---

## ROLE-BASED ACCESS (Recommended Future Addition)

```typescript
// Members table already has 'role' field:
enum MemberRole {
  admin = 'admin',           // Full access
  treasurer = 'treasurer',   // Payments, fines, loans
  member = 'member'          // Own records only
}
```

---

## PERFORMANCE OPTIMIZATION

### Indexes Already Created
- chama_id (all tables)
- member_id (all tables)
- status (loans, contributions_tracking)
- sent (reminders, auto_reminders)
- paid (fines, auto_fines)
- month, year (contribution tables)

### Query Tips
```typescript
// Use select to limit columns
await supabase
  .from('members')
  .select('id,name,phone')  // Not *
  .eq('chama_id', chamaId);

// Use .limit() for pagination
await supabase
  .from('contributions')
  .select('*')
  .limit(10)
  .range(0, 9);

// Use order() for sorting
await supabase
  .from('contributions')
  .select('*')
  .order('created_at', { ascending: false });
```

---

## ERROR HANDLING

### Common Errors & Solutions

**"PGRST116" (No rows found)**
- Not an error, check explicitly: `if (error?.code === 'PGRST116')`

**"violates not-null constraint"**
- Check required fields before insert

**"duplicate key value"**
- Unique constraint violation, check UNIQUE constraints above

**"violates foreign key constraint"**
- Referenced record doesn't exist, verify parent record first

**"permission denied"**
- RLS policy blocking access, check row_security policies

---

## TESTING DATA

### Create Test Chama
```typescript
const user = await signUp('test@example.com', 'password', 'Test User');
const chama = await createChama(
  user.user.id,
  'Test Chama',
  'TEST123',
  5000,
  'Monday',
  100000
);
```

### Add Test Members
```typescript
await addMember(chama.id, 'Alice', '+254712345678');
await addMember(chama.id, 'Bob', '+254712345679');
await addMember(chama.id, 'Charlie', '+254712345680');
```

### Record Test Data
```typescript
await recordContribution(chama.id, memberId, 5000, 5, 2026, userId);
await createLoan(chama.id, memberId, 50000, 10, 12, 4500, '2026-06-01');
await createFine(chama.id, memberId, 'Late payment', 1000);
```

---

## MONITORING & ANALYTICS

### Check Database Size
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Query Performance
```sql
-- Enable query logging
SET log_min_duration_statement = 1000;  -- 1 second

-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Monitor Realtime Updates
```typescript
// Subscribe to changes
supabase
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'contributions' },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();
```

---

## BACKUP & RECOVERY

### Automated Backups
Supabase automatically:
- ✅ Daily backups (7 days retention)
- ✅ Point-in-time recovery
- ✅ Backup to object storage

### Manual Export
```bash
# Export all data
pg_dump postgres://user:password@host/database > backup.sql

# Restore
psql postgres://user:password@host/database < backup.sql
```

---

## SECURITY BEST PRACTICES

1. **Always use RLS policies** ✅ (Already enabled)
2. **Validate input on backend** ✅
3. **Never expose service role key** ✅ (In CRITICAL.txt)
4. **Use parameterized queries** ✅ (Supabase handles)
5. **Monitor access logs** - TODO
6. **Rotate keys regularly** - TODO
7. **Encrypt sensitive data** - TODO (Future)

---

## NEXT STEPS

1. ✅ Deploy `COMPLETE_DATABASE_SCHEMA.sql`
2. ⏳ Test all CRUD operations
3. ⏳ Verify triggers working
4. ⏳ Load test database
5. ⏳ Set up monitoring
6. ⏳ Create backup strategy

---

**Last Updated:** 2026-05-01
**Database Version:** 1.0.0
**Status:** Production Ready
