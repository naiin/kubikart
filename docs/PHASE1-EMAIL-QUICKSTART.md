# Phase 1: Email Integration — Quick Start Guide

**Status**: ✅ All code changes completed  
**API Token**: `your_mailtrap_token_here`  
**Frontend Vercel URL**: `https://kubikart-frontend.vercel.app/de`

---

## 🚀 What's Done

✅ **Email utility created** — `src/lib/email.ts`

- Bilingual email support (German + English)
- Mailtrap template integration
- Functions for: newsletter, order, password reset, contact, welcome, account-created, login-alert, order-status

✅ **API routes updated**:

- `POST /api/newsletter` — sends confirmation email
- `GET /api/newsletter/confirm` — sends welcome email after confirmation
- `POST /api/contact` — sends contact confirmation to user
- `POST /api/orders/create` — sends order confirmation email
- `POST /api/auth/register` — sends account created email
- `POST /api/auth/login` — sends login/security alert email
- `POST /api/webhooks/stripe` — sends order status updates
- `POST /api/webhooks/paypal` — sends order status updates

✅ **Mailtrap package installed** — `mailtrap@4.6.0`

✅ **Template templates created** (in docs/) with bilingual HTML:

- Newsletter Confirmation
- Order Confirmation
- Password Reset
- Contact Confirmation
- Newsletter Welcome

✅ **Environment configuration template** — `.env.local.example`

---

## 📋 To Complete Setup (Next 30 minutes)

### Step 1: Create Templates in Mailtrap (10 mins)

1. **Go to**: https://mailtrap.io/
2. **Login** with your account
3. **Navigate**: Email Sending → **Email Templates**
4. **Create templates** with the HTML provided in `docs/MAILTRAP-SETUP.md`:
   - Template 1: Newsletter Confirmation
   - Template 2: Order Confirmation
   - Template 3: Password Reset
   - Template 4: Contact Confirmation
   - Template 5: Newsletter Welcome

- Template 6: Account Created
- Template 7: Order Status Update
  - Template 8: Login Alert
  - Optional variants for distinct status messaging:
    - Order Status Pending
    - Order Status Processing
    - Order Status Shipped
    - Order Status Delivered
    - Order Status Failed
    - Order Status Refunded

**For each template**:

- Copy the HTML from `docs/MAILTRAP-SETUP.md`
- Paste into Mailtrap template editor
- Save template
- **Copy the Template UUID** (visible in dashboard/API response)

### Step 2: Update `.env.local` (5 mins)

Create/update `frontend/.env.local`:

```bash
# Copy from .env.local.example and update with your template UUIDs
MAILTRAP_TOKEN=your_mailtrap_token_here
MAILTRAP_TEMPLATE_NEWSLETTER=123456        # Replace with actual ID
MAILTRAP_TEMPLATE_NEWSLETTER_WELCOME=123457
MAILTRAP_TEMPLATE_ORDER=123458
MAILTRAP_TEMPLATE_PASSWORD_RESET=123459
MAILTRAP_TEMPLATE_CONTACT=123460
MAILTRAP_TEMPLATE_ACCOUNT_CREATED=123461
MAILTRAP_TEMPLATE_ORDER_STATUS=123462
MAILTRAP_TEMPLATE_LOGIN_ALERT=123463

# Optional status variants (fallback to MAILTRAP_TEMPLATE_ORDER_STATUS)
MAILTRAP_TEMPLATE_ORDER_STATUS_PENDING=123464
MAILTRAP_TEMPLATE_ORDER_STATUS_PROCESSING=123465
MAILTRAP_TEMPLATE_ORDER_STATUS_SHIPPED=123466
MAILTRAP_TEMPLATE_ORDER_STATUS_DELIVERED=123467
MAILTRAP_TEMPLATE_ORDER_STATUS_FAILED=123468
MAILTRAP_TEMPLATE_ORDER_STATUS_REFUNDED=123469

# Optional legal PDF attachment paths (relative to frontend/public)
MAIL_PDF_AGB_PATH=legal/agb.pdf
MAIL_PDF_WIDERRUF_PATH=legal/widerruf.pdf
```

**Where to find Template UUIDs**:

- Mailtrap Dashboard → Email Templates
- Click on each template
- UUID is shown in template details (or from API create response)

### Step 3: Test Email Flow (15 mins)

**Option A: Local Testing** (if you have local dev env)

```bash
cd frontend
pnpm dev
# Visit http://localhost:3000/de/
```

Then:

1. **Newsletter**: Try signing up for newsletter → Check Mailtrap inbox for confirmation email
2. **Click confirmation link** → Should see welcome email
3. **Contact form**: Submit contact form → Check for confirmation email
4. **Order**: Create a test order → Check for order confirmation email

**Option B: Check Mailtrap Inbox**

- After template creation, Mailtrap will show test sends
- Visit: https://mailtrap.io/ → Inbox
- All emails sent via API appear there

---

## 🔍 Verification Checklist

- [ ] **Mailtrap account accessible** (https://mailtrap.io/)
- [ ] **API Token stored** in `.env.local`
- [ ] Templates created in Mailtrap dashboard (including login alert)
- [ ] **Template UUIDs added** to `.env.local`
- [ ] **Frontend builds without errors**:
  ```bash
  cd frontend && pnpm build
  ```
- [ ] **No TypeScript errors**:
  ```bash
  cd frontend && pnpm typecheck
  ```
- [ ] **Newsletter signup tested** — confirmation email arrives in Mailtrap inbox
- [ ] **Newsletter confirmation link works** — welcome email sent
- [ ] **Contact form tested** — confirmation email sent to user
- [ ] **Order creation tested** — order confirmation email sent
- [ ] **Login tested** — login alert email sent
- [ ] **Webhook tested** — status update email sent after status change

### PDF Attachments

- `order.pdf` is generated and attached automatically on order confirmation emails.
- Place legal PDFs under `frontend/public/legal/`:
  - `agb.pdf`
  - `widerruf.pdf`
- Optional locale-specific files:
  - `frontend/public/legal/de/agb.pdf`, `frontend/public/legal/de/widerruf.pdf`
  - `frontend/public/legal/en/agb.pdf`, `frontend/public/legal/en/widerruf.pdf`

---

## 📧 Email Templates Reference

| Name                        | Trigger                      | Recipients | Status                                    |
| --------------------------- | ---------------------------- | ---------- | ----------------------------------------- |
| **Newsletter Confirmation** | User signs up for newsletter | Subscriber | ✅ Ready                                  |
| **Newsletter Welcome**      | Subscriber confirms email    | Subscriber | ✅ Ready                                  |
| **Order Confirmation**      | Order created after payment  | Customer   | ✅ Ready                                  |
| **Contact Confirmation**    | Contact form submitted       | Inquirer   | ✅ Ready                                  |
| **Password Reset**          | User requests password reset | User       | ⏳ WordPress backend (not yet integrated) |

---

## 🎨 Email Template Customization

Each template includes:

- **Kubikart branding** (navy header, orange accent)
- **Bilingual content** (German on top, English below)
- **Your logo area** (can be customized in Mailtrap editor)
- **Responsive design** (mobile-friendly)
- **Call-to-action buttons** (link to frontend URLs)

To customize in Mailtrap:

1. Open template editor
2. Replace placeholder links (e.g., `https://kubikart-frontend.vercel.app/de`)
3. Add your logo image (drag & drop in header)
4. Adjust colors if needed (currently navy-900 & orange-600)

---

## 🐛 Troubleshooting

### Emails not arriving?

1. Check Mailtrap inbox (https://mailtrap.io/) — emails logged there?
2. Verify API token in `.env.local` — correct?
3. Check template UUIDs in `.env.local` — match Mailtrap dashboard?
4. Check browser console for errors during email send

### Template not found error?

- Verify template value is a UUID (not a numeric ID or template name)
- Check Mailtrap dashboard for correct ID

### Bilingual content not showing?

- Both versions are in single template HTML
- Mailtrap renders both automatically
- User sees entire email with German + English

### Links broken in email?

- Update domain in templates (currently: `https://kubikart-frontend.vercel.app/de`)
- Replace with your actual domain before deploying to production

---

## 📱 Next Steps After Setup

1. **Password Reset Integration** — Update WordPress plugin to use Mailtrap SMTP
2. **Deploy to Vercel** — Production frontend deployment
3. **Monitor email delivery** — Check Mailtrap analytics dashboard
4. **A/B test templates** — Use Mailtrap editor to test variations

---

## 📞 Support

- **Mailtrap Docs**: https://mailtrap.io/
- **Email Utility Location**: `frontend/src/lib/email.ts`
- **Template HTML Location**: `docs/MAILTRAP-SETUP.md`
- **API Routes Updated**:
  - `frontend/src/app/api/newsletter/route.ts`
  - `frontend/src/app/api/newsletter/confirm/route.ts`
  - `frontend/src/app/api/contact/route.ts`
  - `frontend/src/app/api/orders/create/route.ts`

---

## ✅ Success Indicators

Once fully set up, you'll see:

- ✅ Confirmation emails arriving when users sign up for newsletter
- ✅ Welcome email with coupon code after email confirmation
- ✅ Order confirmation emails when orders are created
- ✅ Contact confirmation emails when form submitted
- ✅ All emails bilingual (German + English)
- ✅ All emails branded with Kubikart logo & colors
