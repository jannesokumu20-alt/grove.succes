# 🌿 Grove - Tech-Powered Savings Management for African CHAMAs

Complete chama savings management web application built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## 📋 Features

### V1 - Core Foundation
- ✅ User Authentication (Signup/Login)
- ✅ Dashboard with Summary Cards
- ✅ Members Management
- ✅ Contributions Tracking
- ✅ Loans Management
- ✅ Reports & Analytics
- ✅ Settings Page
- ✅ Mobile Responsive
- ✅ Public Join Page

### V2 - Engagement Features
- SMS Reminders via Africa's Talking
- Member Self-Service Portal
- Penalty and Fines Tracking
- Meeting Management
- Announcements
- Contribution Targets

### V3 - Scale Features
- MPESA STK Push Integration
- AI Financial Insights
- WhatsApp Bot
- Multiple Chama Management
- SACCO Mode with Shares
- Credit Scoring System

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone or setup the project:**
```bash
git clone <repo-url>
cd grove
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env.local
```

3. **Setup Supabase:**
   - Create project at [supabase.com](https://supabase.com)
   - Add credentials to `.env.local`
   - Run `SUPABASE_SCHEMA.sql` in Supabase SQL Editor

4. **Run development server:**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
grove/
├── src/
│   ├── app/              # Next.js app pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── join/
│   │   └── ...
│   ├── components/       # React components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & Supabase client
│   ├── store/            # Zustand state stores
│   └── types/            # TypeScript interfaces
├── .env.example          # Environment template
├── SUPABASE_SCHEMA.sql   # Database schema
└── package.json
```

## 🔑 Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

Optional (for V2/V3):
- `AT_API_KEY` - Africa's Talking API key
- `MPESA_CONSUMER_KEY` - MPESA API key
- `TWILIO_ACCOUNT_SID` - Twilio account SID

## 🎨 Color Scheme

- Primary: `#166534` (Deep Green)
- Dark: `#0f172a` (Dark Blue)
- Card: `#1e293b` (Slate)
- Accent: `#22c55e` (Bright Green)

## 📦 Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## 🗄️ Database

Run the SQL schema in Supabase SQL Editor:
1. Copy contents of `SUPABASE_SCHEMA.sql`
2. Paste into Supabase SQL Editor
3. Execute

Tables created:
- chamas
- members
- contributions
- loans
- loan_repayments
- fines
- meetings
- meeting_attendance
- announcements
- reminders
- mpesa_transactions
- shares
- whatsapp_logs

## 🚢 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
git push origin main
```

## 📝 Usage

### Create Account
1. Go to `/signup`
2. Fill in personal details (Step 1)
3. Fill in chama details (Step 2)
4. Confirm email

### Join Existing Chama
- Use invite code: `/join/CODE`
- No account needed initially

### Dashboard
- View summary cards
- Quick action buttons
- Recent transactions

### Manage Contributions
- Record member contributions
- Filter by month/year
- View member history

### Manage Loans
- Create loan requests
- Approve/decline loans
- Record repayments
- Track loan status

## 🔒 Security

- Row Level Security (RLS) on all tables
- User authentication required
- Protected API routes
- Environment variables for secrets

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 📧 Support

For support, contact via email or create an issue in the repository.

## 🎯 Roadmap

- [ ] V2 Features (SMS, Member Portal)
- [ ] V3 Features (MPESA, WhatsApp, AI)
- [ ] Mobile App (React Native)
- [ ] Advanced Analytics
- [ ] Custom Reports

---

Built with ❤️ for African CHAMAs | Grove v1.0
