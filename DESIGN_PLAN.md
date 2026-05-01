-- Complete Grove App UI Redesign Plan
-- Three main pages: Dashboard, Members, Contributions

Dashboard Page Features:
✅ Welcome header with user greeting
✅ 4 stat cards in grid (Total Savings, Active Loans, Total Members, This Month)
✅ Responsive: 1 col mobile, 2 cols tablet, 4 cols desktop
✅ Green gradient cards with icons
✅ 4 quick action buttons (Add Contribution, Add Member, Request Loan, Record Meeting)
✅ Recent activity section
✅ Dark theme (slate-950, slate-900, slate-800)
✅ Green accent (emerald-600, emerald-400)
✅ Mobile responsive with bottom nav
✅ Desktop sidebar on md+ screens

Members Page Features:
✅ Header with search functionality
✅ Member count badges (All, Active, Inactive)
✅ Add Member button
✅ Members list with:
  - Profile picture/avatar
  - Member name
  - Phone number
  - Status badge (Active/Inactive)
  - Join date
  - Actions menu (Message, Edit, View Details)
✅ Responsive grid for member cards
✅ Consistent theming with dashboard

Contributions Page Features:
✅ Header with search
✅ Tab system (All, This Month, This Year)
✅ Summary stats (Total Contributions, Total Members)
✅ Monthly contribution chart
✅ Record Contribution button
✅ Contributions list with:
  - Member name
  - Amount
  - Month/Date
  - Status
  - Recorded by
✅ Filter options
✅ Responsive design

UI/Theme Constants:
- Background: bg-slate-950, bg-slate-900
- Borders: border-slate-800
- Text: text-white, text-slate-400
- Accent: emerald-600, emerald-400
- Cards: gradient backgrounds with border
- Rounded: rounded-lg
- Padding: p-6, p-4
- Gap: gap-4, gap-6
- Mobile: pt-[70px] (navbar height)
- Desktop: md:ml-64 (sidebar width)
- Bottom nav: pb-24 md:pb-0

Components Needed:
✅ Navbar (updated)
✅ Sidebar (updated with consistent nav)
✅ BottomNav (updated with all icons)
✅ StatCard (new - gradient with icon)
✅ MemberCard (new - member profile)
✅ ContributionCard (new - contribution item)
✅ QuickActionButton (new)
