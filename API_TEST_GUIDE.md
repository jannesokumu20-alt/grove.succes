# Grove API - Endpoint Testing Guide

Complete guide for testing all Grove API endpoints.

## Prerequisites
- Grove dev server running: `npm run dev`
- Logged-in user session active
- Postman or curl available

---

## 1. Authentication Endpoints

### 1.1 Signup - Create Account & Chama
**Endpoint:** `POST /api/auth/signup`
**Test Command:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "fullName": "Test User",
    "phone": "+254712345678",
    "chamaName": "Test Chama",
    "contributionAmount": 5000,
    "meetingDay": "Monday",
    "savingsGoal": 500000
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid...",
    "email": "test@example.com"
  },
  "chama": {
    "id": "uuid...",
    "name": "Test Chama",
    "invite_code": "ABC123XYZ"
  }
}
```

### 1.2 Login
**Endpoint:** `POST /api/auth/login`
**Test Command:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid...",
    "email": "test@example.com",
    "chama_id": "uuid..."
  }
}
```

### 1.3 Get Session
**Endpoint:** `GET /api/auth/session`
**Test Command:**
```bash
curl http://localhost:3000/api/auth/session
```
**Expected Response:**
```json
{
  "user": {
    "id": "uuid...",
    "email": "test@example.com"
  }
}
```

---

## 2. Member Endpoints

### 2.1 Add Single Member
**Endpoint:** `POST /api/members`
**Test Command:**
```bash
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grace Omondi",
    "phone": "+254723456789"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "member": {
    "id": "uuid...",
    "name": "Grace Omondi",
    "phone": "+254723456789",
    "chama_id": "uuid...",
    "created_at": "2026-04-30T..."
  }
}
```

### 2.2 Get All Members
**Endpoint:** `GET /api/members`
**Test Command:**
```bash
curl http://localhost:3000/api/members
```
**Expected Response:**
```json
{
  "success": true,
  "members": [
    {
      "id": "uuid...",
      "name": "Grace Omondi",
      "phone": "+254723456789",
      "chama_id": "uuid..."
    },
    {
      "id": "uuid...",
      "name": "David Kipchoge",
      "phone": "+254734567890",
      "chama_id": "uuid..."
    }
  ]
}
```

### 2.3 Get Member by ID
**Endpoint:** `GET /api/members/:id`
**Test Command:**
```bash
curl http://localhost:3000/api/members/uuid-here
```
**Expected Response:**
```json
{
  "success": true,
  "member": {
    "id": "uuid...",
    "name": "Grace Omondi",
    "phone": "+254723456789",
    "total_contributions": 10000,
    "total_loans": 0
  }
}
```

### 2.4 Update Member
**Endpoint:** `PUT /api/members/:id`
**Test Command:**
```bash
curl -X PUT http://localhost:3000/api/members/uuid-here \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+254723456789"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "member": {
    "id": "uuid...",
    "phone": "+254723456789"
  }
}
```

### 2.5 Bulk Import Members
**Endpoint:** `POST /api/members/bulk`
**Test Command:**
```bash
curl -X POST http://localhost:3000/api/members/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "members": [
      { "name": "Mary Wanjiru", "phone": "+254745678901" },
      { "name": "Samuel Kipchoge", "phone": "+254756789012" }
    ]
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "imported": 2,
  "errors": [],
  "members": [...]
}
```

---

## 3. Contribution Endpoints

### 3.1 Record Contribution
**Endpoint:** `POST /api/contributions`
**Test Command:**
```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "uuid-here",
    "amount": 5000,
    "date": "2026-04-30"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "contribution": {
    "id": "uuid...",
    "member_id": "uuid...",
    "amount": 5000,
    "date": "2026-04-30T00:00:00Z",
    "created_at": "2026-04-30T..."
  }
}
```

### 3.2 Get All Contributions
**Endpoint:** `GET /api/contributions`
**Test Command:**
```bash
curl http://localhost:3000/api/contributions
```
**Expected Response:**
```json
{
  "success": true,
  "contributions": [
    {
      "id": "uuid...",
      "member": { "name": "Grace Omondi" },
      "amount": 5000,
      "date": "2026-04-30"
    },
    {
      "id": "uuid...",
      "member": { "name": "David Kipchoge" },
      "amount": 5000,
      "date": "2026-04-30"
    }
  ]
}
```

### 3.3 Get Member Contributions
**Endpoint:** `GET /api/contributions?member_id=uuid`
**Test Command:**
```bash
curl "http://localhost:3000/api/contributions?member_id=uuid-here"
```
**Expected Response:**
```json
{
  "success": true,
  "contributions": [
    {
      "id": "uuid...",
      "amount": 5000,
      "date": "2026-04-30"
    }
  ],
  "total": 5000
}
```

### 3.4 Get Monthly Contribution Summary
**Endpoint:** `GET /api/contributions/summary?month=4&year=2026`
**Test Command:**
```bash
curl "http://localhost:3000/api/contributions/summary?month=4&year=2026"
```
**Expected Response:**
```json
{
  "success": true,
  "month": 4,
  "year": 2026,
  "total": 25000,
  "count": 5,
  "by_member": [
    { "name": "Grace Omondi", "total": 10000 },
    { "name": "David Kipchoge", "total": 5000 }
  ]
}
```

---

## 4. Loan Endpoints

### 4.1 Create Loan
**Endpoint:** `POST /api/loans`
**Test Command:**
```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "uuid-here",
    "amount": 50000,
    "interest_rate": 10,
    "repayment_months": 6,
    "purpose": "Business expansion"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "loan": {
    "id": "uuid...",
    "member_id": "uuid...",
    "amount": 50000,
    "interest_rate": 10,
    "repayment_months": 6,
    "status": "PENDING",
    "created_at": "2026-04-30T..."
  }
}
```

### 4.2 Get All Loans
**Endpoint:** `GET /api/loans`
**Test Command:**
```bash
curl http://localhost:3000/api/loans
```
**Expected Response:**
```json
{
  "success": true,
  "loans": [
    {
      "id": "uuid...",
      "member": { "name": "David Kipchoge" },
      "amount": 50000,
      "status": "PENDING",
      "repayment_months": 6
    }
  ]
}
```

### 4.3 Get Loan by ID
**Endpoint:** `GET /api/loans/:id`
**Test Command:**
```bash
curl http://localhost:3000/api/loans/uuid-here
```
**Expected Response:**
```json
{
  "success": true,
  "loan": {
    "id": "uuid...",
    "member": { "name": "David Kipchoge" },
    "amount": 50000,
    "interest_rate": 10,
    "status": "PENDING",
    "repaid": 0,
    "outstanding": 50000,
    "monthly_payment": 8333.33
  }
}
```

### 4.4 Approve Loan
**Endpoint:** `PUT /api/loans/:id/approve`
**Test Command:**
```bash
curl -X PUT http://localhost:3000/api/loans/uuid-here/approve \
  -H "Content-Type: application/json"
```
**Expected Response:**
```json
{
  "success": true,
  "loan": {
    "id": "uuid...",
    "status": "APPROVED",
    "approved_at": "2026-04-30T..."
  }
}
```

### 4.5 Reject Loan
**Endpoint:** `PUT /api/loans/:id/reject`
**Test Command:**
```bash
curl -X PUT http://localhost:3000/api/loans/uuid-here/reject \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Insufficient collateral"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "loan": {
    "id": "uuid...",
    "status": "REJECTED"
  }
}
```

---

## 5. Loan Repayment Endpoints

### 5.1 Record Repayment
**Endpoint:** `POST /api/loans/:id/repay`
**Test Command:**
```bash
curl -X POST http://localhost:3000/api/loans/uuid-here/repay \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "date": "2026-04-30",
    "notes": "Monthly payment"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "repayment": {
    "id": "uuid...",
    "loan_id": "uuid...",
    "amount": 10000,
    "date": "2026-04-30",
    "created_at": "2026-04-30T..."
  },
  "loan_status": {
    "total_repaid": 10000,
    "remaining": 40000
  }
}
```

### 5.2 Get Loan Repayments
**Endpoint:** `GET /api/loans/:id/repayments`
**Test Command:**
```bash
curl http://localhost:3000/api/loans/uuid-here/repayments
```
**Expected Response:**
```json
{
  "success": true,
  "repayments": [
    {
      "id": "uuid...",
      "amount": 10000,
      "date": "2026-04-30"
    }
  ],
  "total_repaid": 10000
}
```

---

## 6. Chama Endpoints

### 6.1 Get Chama
**Endpoint:** `GET /api/chama`
**Test Command:**
```bash
curl http://localhost:3000/api/chama
```
**Expected Response:**
```json
{
  "success": true,
  "chama": {
    "id": "uuid...",
    "name": "Nairobi Savings Group",
    "invite_code": "ABC123XYZ",
    "contribution_amount": 5000,
    "meeting_day": "Monday",
    "savings_goal": 500000,
    "created_at": "2026-04-30T..."
  }
}
```

### 6.2 Update Chama
**Endpoint:** `PUT /api/chama`
**Test Command:**
```bash
curl -X PUT http://localhost:3000/api/chama \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elite Savings Circle",
    "contribution_amount": 7500,
    "meeting_day": "Saturday"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "chama": {
    "id": "uuid...",
    "name": "Elite Savings Circle",
    "contribution_amount": 7500,
    "meeting_day": "Saturday"
  }
}
```

### 6.3 Get Chama Stats
**Endpoint:** `GET /api/chama/stats`
**Test Command:**
```bash
curl http://localhost:3000/api/chama/stats
```
**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "total_members": 5,
    "total_contributions": 25000,
    "active_loans": 1,
    "loan_disbursed": 50000,
    "loan_repaid": 10000,
    "savings_pool": 25000
  }
}
```

### 6.4 Get Invite Code
**Endpoint:** `GET /api/chama/invite`
**Test Command:**
```bash
curl http://localhost:3000/api/chama/invite
```
**Expected Response:**
```json
{
  "success": true,
  "invite_code": "ABC123XYZ",
  "invite_url": "http://localhost:3000/join/ABC123XYZ"
}
```

---

## 7. Join/Invite Endpoints

### 7.1 Verify Invite Code
**Endpoint:** `GET /api/join/:code`
**Test Command:**
```bash
curl http://localhost:3000/api/join/ABC123XYZ
```
**Expected Response:**
```json
{
  "success": true,
  "chama": {
    "name": "Nairobi Savings Group",
    "contribution_amount": 5000,
    "member_count": 5
  }
}
```

### 7.2 Join Chama
**Endpoint:** `POST /api/join`
**Test Command:**
```bash
curl -X POST http://localhost:3000/api/join \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "NewPass123",
    "fullName": "New Member",
    "phone": "+254767890123",
    "invite_code": "ABC123XYZ"
  }'
```
**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid...",
    "email": "newuser@example.com"
  },
  "chama": {
    "id": "uuid...",
    "name": "Nairobi Savings Group"
  }
}
```

---

## 8. Reports Endpoints

### 8.1 Get Contribution Report
**Endpoint:** `GET /api/reports/contributions?month=4&year=2026`
**Test Command:**
```bash
curl "http://localhost:3000/api/reports/contributions?month=4&year=2026"
```
**Expected Response:**
```json
{
  "success": true,
  "report": {
    "month": 4,
    "year": 2026,
    "total_contributions": 25000,
    "by_member": [
      { "name": "Grace Omondi", "amount": 10000, "status": "paid" },
      { "name": "David Kipchoge", "amount": 5000, "status": "paid" },
      { "name": "Mary Wanjiru", "amount": 0, "status": "pending" }
    ],
    "defaulters": [
      { "name": "Mary Wanjiru", "months_missed": 1 }
    ]
  }
}
```

### 8.2 Get Loan Report
**Endpoint:** `GET /api/reports/loans`
**Test Command:**
```bash
curl http://localhost:3000/api/reports/loans
```
**Expected Response:**
```json
{
  "success": true,
  "report": {
    "total_loans": 2,
    "total_disbursed": 80000,
    "total_repaid": 10000,
    "total_outstanding": 70000,
    "loans": [
      {
        "member": "David Kipchoge",
        "amount": 50000,
        "repaid": 10000,
        "outstanding": 40000,
        "status": "ACTIVE"
      }
    ]
  }
}
```

### 8.3 Get Financial Summary
**Endpoint:** `GET /api/reports/summary?month=4&year=2026`
**Test Command:**
```bash
curl "http://localhost:3000/api/reports/summary?month=4&year=2026"
```
**Expected Response:**
```json
{
  "success": true,
  "summary": {
    "month": 4,
    "year": 2026,
    "inflow": 35000,
    "outflow": 50000,
    "net": -15000,
    "savings_pool": 25000
  }
}
```

---

## Testing Workflow

### Complete Test Sequence
```bash
# 1. Create Account
POST /api/auth/signup

# 2. Verify Login
POST /api/auth/login

# 3. Add Members
POST /api/members
POST /api/members/bulk

# 4. Record Contributions
POST /api/contributions
GET /api/contributions
GET /api/contributions/summary

# 5. Create & Approve Loans
POST /api/loans
PUT /api/loans/:id/approve
GET /api/loans

# 6. Record Repayments
POST /api/loans/:id/repay
GET /api/loans/:id/repayments

# 7. View Stats
GET /api/chama/stats

# 8. Generate Reports
GET /api/reports/contributions
GET /api/reports/loans
GET /api/reports/summary

# 9. Invite New Member
GET /api/chama/invite
POST /api/join
```

---

## Error Testing

### Test Invalid Inputs
```bash
# Empty name
POST /api/members -d '{"name": "", "phone": "+254712345678"}'
# Expected: 400 - Name required

# Invalid phone
POST /api/members -d '{"name": "Test", "phone": "123"}'
# Expected: 400 - Invalid phone format

# Negative amount
POST /api/contributions -d '{"member_id": "uuid", "amount": -1000}'
# Expected: 400 - Amount must be positive

# Expired invite code
GET /api/join/INVALID_CODE
# Expected: 404 - Invite not found
```

---

## Performance Testing

### Load Test
```bash
# Test with 100 members
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/members \
    -d "{\"name\": \"Member $i\", \"phone\": \"+254712345$i\"}"
done

# Expected: All succeed, no timeouts
```

---

## Success Criteria

✅ All endpoints respond with correct status codes
✅ Response format matches documentation
✅ Input validation works correctly
✅ Data persists in database
✅ Errors are descriptive
✅ Performance acceptable (<500ms)
✅ Authorization enforced (user-specific data)

---

Generated: April 30, 2026
Status: Ready for Testing ✅
