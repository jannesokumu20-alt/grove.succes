# End-to-End Platform Testing Guide

## Test Scenario: Complete Platform Walkthrough

### Phase 1: User Authentication
**Objective**: Test signup, login, and authentication flow
- [ ] Access http://localhost:3000
- [ ] Click "Sign up" link
- [ ] Fill signup form:
  - Full Name: Test Owner
  - Email: owner@test.com
  - Password: Test123456
  - Confirm Password: Test123456
  - Phone: +254712345678
  - Chama Name: Test Chama
  - Monthly Contribution: 5000
  - Meeting Day: Monday
- [ ] Click "Sign Up"
- [ ] Verify redirect to login page
- [ ] Login with created credentials

### Phase 2: Dashboard Navigation (Owner View)
**Objective**: Verify dashboard layout and navigation
- [ ] Verify sidebar displays with logo and navigation items
- [ ] Verify summary cards display (4 columns on desktop, 2 on mobile)
- [ ] Verify quick action buttons: Contributions, Members, Loans, Meetings
- [ ] Verify bottom navigation on mobile
- [ ] Test responsive layout (desktop/mobile)

### Phase 3: Member Management
**Objective**: Test adding and managing members
- [ ] Click "Members" in navigation
- [ ] Click "+ Add Member" button
- [ ] Fill member form:
  - Name: Test Member 1
  - Email: member1@test.com
  - Phone: +254712345679
- [ ] Click "Add Member"
- [ ] Verify member appears in list
- [ ] Repeat for 2nd member (member2@test.com)

### Phase 4: Invite Code Feature
**Objective**: Test invite code signup flow
- [ ] Copy invite code from sidebar/chama info
- [ ] Open new incognito/private window
- [ ] Navigate to http://localhost:3000/join/[CODE]
- [ ] Fill join form:
  - Email: invited@test.com
  - Full Name: Invited Member
  - Phone: +254712345680
  - Password: Test123456
- [ ] Click "Join"
- [ ] Verify redirect to login
- [ ] Login with invited credentials
- [ ] Verify user lands on /member dashboard

### Phase 5: Contributions
**Objective**: Test contribution tracking
- [ ] Navigate to Contributions
- [ ] Verify member contribution list
- [ ] Click "+ Add Contribution"
- [ ] Fill form:
  - Member: Test Member 1
  - Amount: 5000
  - Date: Today
  - Description: First contribution
- [ ] Click "Add"
- [ ] Verify contribution appears in list
- [ ] Test tab filtering (All, This Month, This Year)
- [ ] Verify statistics update

### Phase 6: Loans
**Objective**: Test loan management
- [ ] Navigate to Loans
- [ ] Click "+ Add Loan"
- [ ] Fill form:
  - Member: Test Member 1
  - Amount: 20000
  - Duration: 12 months
  - Interest Rate: 5%
- [ ] Click "Add"
- [ ] Verify loan appears in list with status
- [ ] Test loan repayment (click loan, add repayment)

### Phase 7: Fines
**Objective**: Test fine management
- [ ] Navigate to Fines
- [ ] Click "+ Add Fine"
- [ ] Fill form:
  - Member: Test Member 1
  - Reason: Late contribution
  - Amount: 500
- [ ] Click "Add"
- [ ] Verify fine appears in list
- [ ] Test fine payment (click fine, mark as paid)

### Phase 8: Meetings
**Objective**: Test meeting scheduling
- [ ] Navigate to Meetings
- [ ] Click "+ Schedule Meeting"
- [ ] Fill form:
  - Title: Monthly Meeting
  - Date: Next Monday
  - Time: 3:00 PM
  - Location: Community Center
  - Agenda: Review contributions and discuss loans
- [ ] Click "Schedule"
- [ ] Verify meeting appears in list

### Phase 9: Announcements
**Objective**: Test announcement system
- [ ] Navigate to Announcements
- [ ] Click "+ New Announcement"
- [ ] Fill form:
  - Title: Important Update
  - Message: Platform update scheduled
  - Type: Urgent
- [ ] Click "Post"
- [ ] Verify announcement appears
- [ ] Test as member user (should see but not post)

### Phase 10: Reminders
**Objective**: Test reminder system
- [ ] Navigate to Reminders
- [ ] Verify automatic reminders display (contributions, loans, meetings)
- [ ] Test reminder filters
- [ ] Create custom reminder (if available)

### Phase 11: Reports
**Objective**: Test reporting features
- [ ] Navigate to Reports
- [ ] Verify statistics display correctly
- [ ] Check:
  - Total Savings
  - Active Loans
  - Monthly Contributions
  - Member Status Report
- [ ] Test download/export functionality

### Phase 12: Settings
**Objective**: Test user settings
- [ ] Navigate to Settings
- [ ] Verify profile information
- [ ] Test updating profile (if available)
- [ ] Test security settings
- [ ] Test logout

### Phase 13: Member User Experience
**Objective**: Verify restricted member access
- [ ] Logout from owner account
- [ ] Login with member account (created in Phase 4)
- [ ] Verify /member dashboard displays
- [ ] Verify restricted navigation (no Members, Fines, Meetings, Reports)
- [ ] Verify access to: Contributions, Loans, Announcements, Reminders, Settings
- [ ] Test member's view of shared pages

### Phase 14: Link & Navigation Verification
**Objective**: Ensure all links work correctly
- [ ] Test all sidebar links from dashboard
- [ ] Test all quick action buttons
- [ ] Test member dashboard quick actions
- [ ] Test error page links (navigate to non-existent route)
- [ ] Test 404 page navigation back to home
- [ ] Verify no broken links in navigation

### Phase 15: Responsive Design
**Objective**: Test mobile and desktop layouts
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify:
  - Sidebar hidden on mobile, visible on desktop
  - Bottom navigation appears on mobile only
  - Content properly padded and responsive
  - Cards grid adjusts (4 cols desktop, 2 cols mobile)
  - Forms are mobile-friendly

## Test Data Summary
- **Owner Account**: owner@test.com / Test123456
- **Member Accounts**: 
  - member1@test.com / (same password)
  - member2@test.com / (same password)
  - invited@test.com / Test123456 (via invite code)
- **Test Chama**: Test Chama

## Success Criteria
✅ All pages load without errors
✅ Navigation works smoothly
✅ Data persists after refresh
✅ Responsive design works on all screen sizes
✅ User roles are properly enforced
✅ All features function as expected
✅ No broken links or navigation issues
