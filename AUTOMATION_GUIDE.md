# Grove Intelligent Automation System

A comprehensive guide to implementing intelligent automated reminders and fines for the Grove chama management platform.

## Overview

The intelligent automation system automatically:
1. **Tracks contribution status** and due dates
2. **Generates smart reminders** at key points (before, on, and after due dates)
3. **Applies automatic fines** when contributions become overdue
4. **Provides admin configuration** for all automation settings

## System Architecture

### Database Schema

#### 1. **automation_settings**
Stores chama-specific automation preferences.

```sql
{
  id: UUID,
  chama_id: UUID,
  auto_reminders_enabled: BOOLEAN,
  auto_fines_enabled: BOOLEAN,
  reminder_before_days: INTEGER,
  reminder_on_due: BOOLEAN,
  reminder_after_days: INTEGER,
  fine_type: 'fixed' | 'percentage',
  fine_amount: DECIMAL,
  fine_percentage: DECIMAL,
  max_reminders_per_contribution: INTEGER
}
```

#### 2. **contribution_tracking**
Tracks the status of each member's monthly contribution.

```sql
{
  id: UUID,
  chama_id: UUID,
  member_id: UUID,
  month: INTEGER,
  year: INTEGER,
  due_date: DATE,
  expected_amount: DECIMAL,
  paid_amount: DECIMAL,
  status: 'pending' | 'partial' | 'paid' | 'overdue',
  contribution_id: UUID (links to actual contribution),
  overdue_since: DATE,
  is_auto_fined: BOOLEAN,
  fine_id: UUID
}
```

#### 3. **auto_reminders**
Tracks automatically generated reminders.

```sql
{
  id: UUID,
  chama_id: UUID,
  member_id: UUID,
  contribution_tracking_id: UUID,
  reminder_type: 'upcoming' | 'due' | 'overdue',
  title: VARCHAR,
  message: TEXT,
  scheduled_date: TIMESTAMP,
  sent: BOOLEAN,
  sent_at: TIMESTAMP
}
```

#### 4. **auto_fines**
Tracks automatically applied fines linked to contributions.

```sql
{
  id: UUID,
  chama_id: UUID,
  member_id: UUID,
  contribution_tracking_id: UUID,
  fine_id: UUID (links to actual fine),
  base_amount: DECIMAL,
  calculated_amount: DECIMAL,
  calculation_method: 'fixed' | 'percentage',
  percentage_applied: DECIMAL,
  reason: VARCHAR,
  auto_applied: BOOLEAN,
  admin_override: BOOLEAN
}
```

### Helper Functions

All functions are in `src/lib/automationFunctions.ts`:

#### Automation Settings
- `getAutomationSettings(chamaId)` - Get settings for a chama
- `updateAutomationSettings(chamaId, settings)` - Update settings

#### Contribution Tracking
- `getContributionTracking(chamaId, memberId?)` - Get all tracked contributions
- `getOverdueContributions(chamaId)` - Get overdue contributions
- `getPendingContributions(chamaId, daysAhead)` - Get contributions due soon
- `markContributionAsOverdue(trackingId)` - Mark as overdue

#### Auto Reminders
- `createAutoReminder(...)` - Create a reminder
- `getAutoReminders(chamaId, status?)` - Get reminders
- `getPendingAutoReminders(chamaId)` - Get reminders to send
- `sendAutoReminder(reminderId)` - Mark as sent
- `deleteAutoReminder(reminderId)` - Delete a reminder

#### Auto Fines
- `createAutoFine(...)` - Create an auto fine
- `getAutoFines(chamaId, memberId?)` - Get auto fines
- `removeAutoFine(autoFineId)` - Remove an auto fine
- `getMemberFineBreakdown(chamaId, memberId)` - Get fine summary per member

#### Orchestration
- `triggerAutoReminders(chamaId)` - Run reminder automation
- `triggerAutoFines(chamaId)` - Run fines automation
- `getContributionStatus(chamaId, memberId)` - Get member contribution status

## Implementation Guide

### Step 1: Apply Database Schema

Run `SUPABASE_AUTOMATION_SCHEMA.sql` in your Supabase SQL editor:

```sql
-- Execute the entire SQL file
-- This creates:
-- - automation_settings table
-- - contribution_tracking table
-- - auto_reminders table
-- - auto_fines table
-- - Helper functions
-- - Triggers for automatic tracking
```

### Step 2: Add Backend Functions

The automation functions are in `src/lib/automationFunctions.ts`. This file provides:
- All CRUD operations for automation tables
- Business logic for triggering reminders and fines
- Status tracking and reporting

### Step 3: Update UI Components

#### Settings Page (`app/settings/page-automation.tsx`)
- Toggle auto reminders ON/OFF
- Configure reminder timing (before/on/after)
- Toggle auto fines ON/OFF
- Configure fine rules (fixed or percentage)
- Test automation

#### Reminders Page (`app/reminders/page-advanced.tsx`)
- Two tabs: "Auto Reminders" and "Contribution Status"
- View pending and sent automatic reminders
- View contribution status per member
- Status badges: Paid, Pending, Overdue

### Step 4: Integration with Existing System

The automation system integrates with existing tables:

```
contributions (existing)
    ↓
    └─→ contribution_tracking (new)
        ├─→ auto_reminders (new)
        └─→ auto_fines (new) → fines (existing)
```

**Backward Compatibility:**
- Old `contributions` records still work
- New contributions automatically create tracking records (via trigger)
- Existing `fines` and `reminders` tables are unaffected
- Can run automation alongside manual reminders

## Usage Examples

### Example 1: Set Up Automation for a Chama

```typescript
// Update automation settings
await updateAutomationSettings(chamaId, {
  auto_reminders_enabled: true,
  auto_fines_enabled: true,
  reminder_before_days: 3,        // Remind 3 days before due
  reminder_on_due: true,           // Remind on due date
  reminder_after_days: 2,          // Remind 2 days after (overdue)
  fine_type: 'fixed',              // Apply fixed fines
  fine_amount: 500,                // 500 KES per overdue
  max_reminders_per_contribution: 3 // Max 3 reminders per contribution
});
```

### Example 2: Trigger Automation Manually

```typescript
// In an API endpoint or scheduled job
const remindersResult = await triggerAutoReminders(chamaId);
console.log(`Created ${remindersResult.created} reminders`);

const finesResult = await triggerAutoFines(chamaId);
console.log(`Applied ${finesResult.created} fines`);
```

### Example 3: Get Member Contribution Status

```typescript
const status = await getContributionStatus(chamaId, memberId);
status.forEach(contrib => {
  console.log(`${contrib.month}/${contrib.year}: ${contrib.status}`);
  if (contrib.auto_reminders && contrib.auto_reminders.length > 0) {
    console.log(`  - ${contrib.auto_reminders.length} reminders`);
  }
  if (contrib.auto_fines && contrib.auto_fines.length > 0) {
    console.log(`  - ${contrib.auto_fines.length} fines`);
  }
});
```

### Example 4: Get Member Fine Breakdown

```typescript
const breakdown = await getMemberFineBreakdown(chamaId, memberId);
console.log(`Total fines: KES ${breakdown.totalFines}`);
console.log(`Paid: KES ${breakdown.paidFines}`);
console.log(`Unpaid: KES ${breakdown.unpaidFines}`);
```

## Admin Controls

### In Settings Page

**Smart Reminders Section:**
- ✓ Enable/Disable auto reminders
- ✓ Set days before due date
- ✓ Enable reminder on due date
- ✓ Set days after for overdue reminders
- ✓ Set max reminders per contribution
- ✓ Test auto reminders

**Auto Fines Section:**
- ✓ Enable/Disable auto fines
- ✓ Choose fine type (fixed amount or percentage)
- ✓ Set fine amount (for fixed) or percentage (for percentage-based)
- ✓ Test auto fines

### Admin Overrides

Admin can:
- ✓ Delete auto reminders
- ✓ Mark reminders as sent manually
- ✓ Remove auto fines
- ✓ Edit fine amounts
- ✓ Mark contributions as paid/partial

## Status Badges

### Contribution Status
- **Paid** (green) - Expected amount fully received
- **Partial** (yellow) - Some amount received, but not full
- **Pending** (blue) - Not yet due or no payment received
- **Overdue** (red) - Past due date, no payment received

### Reminder Type
- **Upcoming** (blue) - Reminder before due date
- **Due** (yellow) - On the due date
- **Overdue** (red) - After due date

## Scheduled Jobs

For production, set up scheduled jobs to automatically trigger automation:

```typescript
// Suggested: Run daily at 6 AM
0 6 * * * triggerAutoReminders(chamaId) for all active chamas
0 6 * * * triggerAutoFines(chamaId) for all active chamas
```

Supabase supports:
- Database triggers (already included)
- Edge Functions with cron
- External cron services (GitHub Actions, etc.)

## Testing Checklist

- [ ] Run SQL migration without errors
- [ ] Test settings toggle (enable/disable automation)
- [ ] Test reminder creation with various configurations
- [ ] Test fine creation (fixed and percentage)
- [ ] Verify contribution tracking updates on payment
- [ ] Check auto reminders don't duplicate
- [ ] Verify auto fines link to contributions
- [ ] Test admin override (delete fine/reminder)
- [ ] Test fine breakdown calculation
- [ ] Test status badges display correctly
- [ ] Test with multiple members
- [ ] Test with multiple chamas

## Performance Considerations

**Indexes created for speed:**
- `contribution_tracking.chama_id`
- `contribution_tracking.member_id`
- `contribution_tracking.status`
- `contribution_tracking.due_date`
- `auto_reminders.chama_id`
- `auto_reminders.reminder_type`
- `auto_reminders.scheduled_date`

**Query optimization:**
- Use `contribution_tracking` for fast status queries
- Avoid N+1 queries with proper joins
- Cache automation settings in app state

## Troubleshooting

### Reminders not being created
1. Check `automation_settings.auto_reminders_enabled = true`
2. Verify `contribution_tracking` has pending contributions
3. Check reminder scheduling dates
4. Review `max_reminders_per_contribution` limit

### Fines not being applied
1. Check `automation_settings.auto_fines_enabled = true`
2. Verify contributions are marked `overdue`
3. Check `is_auto_fined = false` on contribution
4. Review fine calculation logic

### Duplicate reminders
1. Check `max_reminders_per_contribution` setting
2. Review `created_at` timestamp filtering
3. Verify trigger not firing multiple times

## Files Reference

- **Database:** `SUPABASE_AUTOMATION_SCHEMA.sql`
- **Functions:** `src/lib/automationFunctions.ts`
- **Settings UI:** `app/settings/page-automation.tsx`
- **Reminders UI:** `app/reminders/page-advanced.tsx`
- **Documentation:** `AUTOMATION_GUIDE.md` (this file)

## Next Steps

1. Apply the database schema
2. Update the settings page component
3. Update the reminders page component
4. Configure automation settings in the app
5. Test all features
6. Set up scheduled jobs for production
7. Monitor automation logs
