# Mailtrap Email Setup Guide — Phase 1

**Status**: In Progress  
**Frontend Vercel URL**: https://kubikart-frontend.vercel.app/de  
**API Token**: `your_mailtrap_token_here`

---

## Step 1: Environment Configuration

Add these to your `.env.local` (frontend):

```bash
# Mailtrap Configuration
MAILTRAP_TOKEN=your_mailtrap_token_here
MAILTRAP_TEMPLATE_NEWSLETTER=YOUR_TEMPLATE_ID
MAILTRAP_TEMPLATE_NEWSLETTER_WELCOME=YOUR_TEMPLATE_ID
MAILTRAP_TEMPLATE_ORDER=YOUR_TEMPLATE_ID
MAILTRAP_TEMPLATE_PASSWORD_RESET=YOUR_TEMPLATE_ID
MAILTRAP_TEMPLATE_CONTACT=YOUR_TEMPLATE_ID
MAILTRAP_TEMPLATE_ACCOUNT_CREATED=YOUR_TEMPLATE_ID
MAILTRAP_TEMPLATE_ORDER_STATUS=YOUR_TEMPLATE_ID
```

---

## Step 2: Create Email Templates in Mailtrap Dashboard

Visit: https://mailtrap.io/

### Template 1: Newsletter Confirmation (Bilingual)

**Name**: `Newsletter Confirmation`  
**Template ID**: (Copy to MAILTRAP_TEMPLATE_NEWSLETTER)

**HTML Content**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: "Manrope", system-ui, sans-serif;
        line-height: 1.6;
        color: #101828;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #faf7f2;
      }
      .header {
        background: #0a1d37;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
      }
      .content {
        background: white;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .cta-button {
        background: #f78801;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 999px;
        display: inline-block;
        margin: 20px 0;
        font-weight: 600;
      }
      .divider {
        border-top: 1px solid #e5e7eb;
        margin: 30px 0;
      }
      .footer {
        font-size: 12px;
        color: #667085;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p class="logo">Kubikart</p>
      </div>
      <div class="content">
        <!-- GERMAN VERSION -->
        <h2>Willkommen bei Kubikart!</h2>
        <p>Danke für dein Interesse am Kubikart Newsletter.</p>
        <p>Bitte bestätige deine E-Mail-Adresse mit einem Klick auf den Button unten:</p>
        <a href="{{confirmation_url}}" class="cta-button">E-Mail bestätigen</a>
        <p>
          <strong>Oder nutze diesen Link:</strong><br />
          <a href="{{confirmation_url}}" style="color: #f78801;">{{confirmation_url}}</a>
        </p>
        <p>Wenn du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren.</p>

        <div class="divider"></div>

        <!-- ENGLISH VERSION -->
        <h2>Welcome to Kubikart!</h2>
        <p>Thank you for your interest in the Kubikart Newsletter.</p>
        <p>Please confirm your email address by clicking the button below:</p>
        <a href="{{confirmation_url}}" class="cta-button">Confirm Email</a>
        <p>
          <strong>Or use this link:</strong><br />
          <a href="{{confirmation_url}}" style="color: #f78801;">{{confirmation_url}}</a>
        </p>
        <p>If you did not sign up, you can ignore this email.</p>

        <div class="footer">
          <p style="margin: 0;">© 2026 Kubikart — Personalisierte Produkte | Personalized Products</p>
          <p style="margin: 5px 0 0 0;">
            <a href="https://kubikart-frontend.vercel.app/de/impressum" style="color: #667085; text-decoration: none;">Impressum</a> |
            <a href="https://kubikart-frontend.vercel.app/de/datenschutz" style="color: #667085; text-decoration: none;">Datenschutz</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
```

---

### Template 2: Order Confirmation (Bilingual)

**Name**: `Order Confirmation`  
**Template ID**: (Copy to MAILTRAP_TEMPLATE_ORDER)

**HTML Content**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: "Manrope", system-ui, sans-serif;
        line-height: 1.6;
        color: #101828;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #faf7f2;
      }
      .header {
        background: #0a1d37;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
      }
      .content {
        background: white;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .order-info {
        background: #f3f4f6;
        padding: 15px;
        border-radius: 6px;
        margin: 15px 0;
      }
      .order-id {
        font-size: 18px;
        font-weight: 600;
        color: #0a1d37;
      }
      .order-status {
        color: #059669;
        font-weight: 600;
      }
      .divider {
        border-top: 1px solid #e5e7eb;
        margin: 30px 0;
      }
      .footer {
        font-size: 12px;
        color: #667085;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
      .button {
        background: #f78801;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 999px;
        display: inline-block;
        margin: 15px 0;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p class="logo">Kubikart</p>
      </div>
      <div class="content">
        <!-- GERMAN VERSION -->
        <h2>Bestellung bestätigt! ✓</h2>
        <p>Hallo {{customer_name}},</p>
        <p>vielen Dank für deine Bestellung! Wir haben alles erhalten und beginnen mit der Bearbeitung.</p>

        <div class="order-info">
          <div class="order-id">Bestellnummer: {{order_number}}</div>
          <div style="margin-top: 10px; color: #667085;">Bestelldatum: <strong>{{order_date}}</strong></div>
        </div>

        <h3 style="margin-top: 25px; color: #0a1d37;">Bestellte Produkte:</h3>
        <pre style="background: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto;">{{items}}</pre>

        <h3>Versandadresse:</h3>
        <p>{{shipping_address}}</p>

        <h3 style="color: #f78801;">Gesamtbetrag: €{{total}}</h3>

        <p><strong>Nächste Schritte:</strong></p>
        <ul>
          <li>Wir bereiten deine Bestellung vor</li>
          <li>Du erhältst bald eine Versandbestätigung mit Tracking-Nummer</li>
          <li>Bei Fragen: <a href="https://kubikart-frontend.vercel.app/de/kontakt" style="color: #f78801;">Kontaktiere uns</a></li>
        </ul>

        <a href="https://kubikart-frontend.vercel.app/de/account" class="button">Meine Bestellung ansehen</a>

        <div class="divider"></div>

        <!-- ENGLISH VERSION -->
        <h2>Order Confirmed! ✓</h2>
        <p>Hi {{customer_name}},</p>
        <p>thank you for your order! We've received everything and will start processing it right away.</p>

        <div class="order-info">
          <div class="order-id">Order Number: {{order_number}}</div>
          <div style="margin-top: 10px; color: #667085;">Order Date: <strong>{{order_date}}</strong></div>
        </div>

        <h3 style="margin-top: 25px; color: #0a1d37;">Items Ordered:</h3>
        <pre style="background: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto;">{{items}}</pre>

        <h3>Shipping Address:</h3>
        <p>{{shipping_address}}</p>

        <h3 style="color: #f78801;">Total: €{{total}}</h3>

        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>We're preparing your order</li>
          <li>You'll receive a shipping confirmation with tracking number soon</li>
          <li>Questions? <a href="https://kubikart-frontend.vercel.app/de/kontakt" style="color: #f78801;">Contact us</a></li>
        </ul>

        <a href="https://kubikart-frontend.vercel.app/de/account" class="button">View My Order</a>

        <div class="footer">
          <p style="margin: 0;">© 2026 Kubikart — Personalisierte Produkte | Personalized Products</p>
        </div>
      </div>
    </div>
  </body>
</html>
```

---

### Template 3: Password Reset (Bilingual)

**Name**: `Password Reset`  
**Template ID**: (Copy to MAILTRAP_TEMPLATE_PASSWORD_RESET)

**HTML Content**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: "Manrope", system-ui, sans-serif;
        line-height: 1.6;
        color: #101828;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #faf7f2;
      }
      .header {
        background: #0a1d37;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
      }
      .content {
        background: white;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .warning {
        background: #fff3e4;
        border-left: 4px solid #f78801;
        padding: 15px;
        margin: 15px 0;
        border-radius: 4px;
      }
      .cta-button {
        background: #f78801;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 999px;
        display: inline-block;
        margin: 20px 0;
        font-weight: 600;
      }
      .divider {
        border-top: 1px solid #e5e7eb;
        margin: 30px 0;
      }
      .footer {
        font-size: 12px;
        color: #667085;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p class="logo">Kubikart</p>
      </div>
      <div class="content">
        <!-- GERMAN VERSION -->
        <h2>Passwort zurücksetzen</h2>
        <p>Hallo,</p>
        <p>wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten. Klicke auf den Button unten, um ein neues Passwort zu erstellen:</p>

        <a href="{{reset_url}}" class="cta-button">Passwort zurücksetzen</a>

        <p>
          <strong>Oder nutze diesen Link:</strong><br />
          <a href="{{reset_url}}" style="color: #f78801;">{{reset_url}}</a>
        </p>

        <div class="warning">
          <strong>⚠️ Sicherheitshinweis:</strong> Der Link ist 24 Stunden gültig. Wenn du diese E-Mail nicht angefordert hast, ignoriere sie einfach.
        </div>

        <p>Dein Passwort ist sicher bei uns. Wir fragen es nie per E-Mail ab.</p>

        <div class="divider"></div>

        <!-- ENGLISH VERSION -->
        <h2>Reset Your Password</h2>
        <p>Hi,</p>
        <p>we received a request to reset your password. Click the button below to create a new password:</p>

        <a href="{{reset_url}}" class="cta-button">Reset Password</a>

        <p>
          <strong>Or use this link:</strong><br />
          <a href="{{reset_url}}" style="color: #f78801;">{{reset_url}}</a>
        </p>

        <div class="warning"><strong>⚠️ Security Notice:</strong> This link is valid for 24 hours. If you didn't request this email, simply ignore it.</div>

        <p>Your password is safe with us. We never ask for it via email.</p>

        <div class="footer">
          <p style="margin: 0;">© 2026 Kubikart — Personalisierte Produkte | Personalized Products</p>
        </div>
      </div>
    </div>
  </body>
</html>
```

---

### Template 4: Contact Form Confirmation (Bilingual)

**Name**: `Contact Confirmation`  
**Template ID**: (Copy to MAILTRAP_TEMPLATE_CONTACT)

**HTML Content**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: "Manrope", system-ui, sans-serif;
        line-height: 1.6;
        color: #101828;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #faf7f2;
      }
      .header {
        background: #0a1d37;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
      }
      .content {
        background: white;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .info-box {
        background: #f3f4f6;
        padding: 15px;
        border-radius: 6px;
        margin: 15px 0;
      }
      .divider {
        border-top: 1px solid #e5e7eb;
        margin: 30px 0;
      }
      .footer {
        font-size: 12px;
        color: #667085;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p class="logo">Kubikart</p>
      </div>
      <div class="content">
        <!-- GERMAN VERSION -->
        <h2>Danke für deine Anfrage! ✓</h2>
        <p>Hallo {{customer_name}},</p>
        <p>wir haben deine Anfrage erhalten und werden uns so schnell wie möglich bei dir melden.</p>

        <div class="info-box">
          <p style="margin: 0;"><strong>Art der Anfrage:</strong> {{inquiry_type}}</p>
        </div>

        <h3>Deine Nachricht:</h3>
        <p style="white-space: pre-wrap; background: #f3f4f6; padding: 15px; border-radius: 6px;">{{message}}</p>

        <p><strong>Wir antworten in der Regel innerhalb von 24 Stunden.</strong></p>

        <div class="divider"></div>

        <!-- ENGLISH VERSION -->
        <h2>Thank You for Your Inquiry! ✓</h2>
        <p>Hi {{customer_name}},</p>
        <p>we've received your inquiry and will get back to you as soon as possible.</p>

        <div class="info-box">
          <p style="margin: 0;"><strong>Inquiry Type:</strong> {{inquiry_type}}</p>
        </div>

        <h3>Your Message:</h3>
        <p style="white-space: pre-wrap; background: #f3f4f6; padding: 15px; border-radius: 6px;">{{message}}</p>

        <p><strong>We typically reply within 24 hours.</strong></p>

        <div class="footer">
          <p style="margin: 0;">© 2026 Kubikart — Personalisierte Produkte | Personalized Products</p>
        </div>
      </div>
    </div>
  </body>
</html>
```

---

### Template 5: Newsletter Welcome (Bilingual)

**Name**: `Newsletter Welcome`  
**Template ID**: (Copy to MAILTRAP_TEMPLATE_NEWSLETTER_WELCOME)

**HTML Content**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: "Manrope", system-ui, sans-serif;
        line-height: 1.6;
        color: #101828;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #faf7f2;
      }
      .header {
        background: #0a1d37;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
      }
      .content {
        background: white;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .coupon-box {
        background: linear-gradient(135deg, #f78801 0%, #ff9b2f 100%);
        color: white;
        padding: 25px;
        text-align: center;
        border-radius: 8px;
        margin: 20px 0;
      }
      .coupon-code {
        font-size: 32px;
        font-weight: bold;
        font-family: monospace;
        margin: 10px 0;
        letter-spacing: 2px;
      }
      .divider {
        border-top: 1px solid #e5e7eb;
        margin: 30px 0;
      }
      .footer {
        font-size: 12px;
        color: #667085;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p class="logo">Kubikart</p>
      </div>
      <div class="content">
        <!-- GERMAN VERSION -->
        <h2>Willkommen im Kubikart Newsletter! 🎉</h2>
        <p>Vielen Dank, dass du dich für unseren Newsletter anmeldest!</p>
        <p>Du erhältst jetzt exklusive Updates über:</p>
        <ul>
          <li>Neue Produkte & Designs</li>
          <li>Spezielle Angebote & Rabatte</li>
          <li>Tipps für Personalisierung</li>
          <li>Limited Editions</li>
        </ul>

        <div class="coupon-box">
          <p style="margin-top: 0; color: rgba(255,255,255,0.9);">Dein Willkommensrabatt:</p>
          <div class="coupon-code">WELCOME10</div>
          <p style="margin-bottom: 0; font-size: 14px;">10% auf deine erste Bestellung</p>
        </div>

        <p><a href="https://kubikart-frontend.vercel.app/de/shop" style="color: #f78801; font-weight: 600;">Jetzt shoppen</a> und Rabatt nutzen!</p>

        <div class="divider"></div>

        <!-- ENGLISH VERSION -->
        <h2>Welcome to Kubikart Newsletter! 🎉</h2>
        <p>Thank you for subscribing to our newsletter!</p>
        <p>You'll now receive exclusive updates about:</p>
        <ul>
          <li>New products & designs</li>
          <li>Special offers & discounts</li>
          <li>Personalization tips</li>
          <li>Limited editions</li>
        </ul>

        <div class="coupon-box">
          <p style="margin-top: 0; color: rgba(255,255,255,0.9);">Your welcome discount:</p>
          <div class="coupon-code">WELCOME10</div>
          <p style="margin-bottom: 0; font-size: 14px;">10% off your first order</p>
        </div>

        <p><a href="https://kubikart-frontend.vercel.app/de/shop" style="color: #f78801; font-weight: 600;">Shop now</a> and use your discount!</p>

        <div class="footer">
          <p style="margin: 0;">© 2026 Kubikart — Personalisierte Produkte | Personalized Products</p>
          <p style="margin: 5px 0 0 0;">
            <a href="https://kubikart-frontend.vercel.app/de/datenschutz" style="color: #667085; text-decoration: none;">Manage Preferences</a> |
            <a href="https://kubikart-frontend.vercel.app/de/datenschutz" style="color: #667085; text-decoration: none;">Privacy</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
```

---

## Step 3: Get Template IDs from Mailtrap

1. Go to **Mailtrap Dashboard** → **Email Templates**
2. For each template, copy the **Template ID** (number in the URL or template card)
3. Update `.env.local` with the actual template IDs:

```bash
MAILTRAP_TEMPLATE_NEWSLETTER=123456
MAILTRAP_TEMPLATE_NEWSLETTER_WELCOME=123457
MAILTRAP_TEMPLATE_ORDER=123458
MAILTRAP_TEMPLATE_PASSWORD_RESET=123459
MAILTRAP_TEMPLATE_CONTACT=123460
MAILTRAP_TEMPLATE_ACCOUNT_CREATED=123461
MAILTRAP_TEMPLATE_ORDER_STATUS=123462
```

---

## Step 4: Add Logo to Templates (Optional)

In Mailtrap dashboard, each template can be customized:

1. Open template editor
2. Add your Kubikart logo in the header area
3. Customize colors to match brand (Navy: #0a1d37, Orange: #f78801)
4. Save template

---

## Step 5: Next — Update API Routes

Once templates are created and template IDs are configured, the next steps are:

1. Update `/api/newsletter/route.ts` to use `sendNewsletterConfirmation()`
2. Update `/api/newsletter/confirm/route.ts` to use `sendNewsletterWelcome()`
3. Update `/api/orders/create/route.ts` to use `sendOrderConfirmation()`
4. Update `/api/contact/route.ts` to use `sendContactConfirmation()`
5. Update WordPress for password reset emails to use Mailtrap SMTP

---

## Testing

### Local Testing (before deployment)

```bash
# Send test email
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Mailtrap Dashboard

1. Go to **Inbox** → View all emails sent
2. Check **Email Logs** for delivery status
3. Monitor **Email Analytics** for open rates, clicks

---

## Verification Checklist

- [ ] Mailtrap account created
- [ ] API token stored in `.env.local`
- [ ] All 7 templates created in Mailtrap
- [ ] Template IDs added to `.env.local`
- [ ] `lib/email.ts` utility created
- [ ] API routes updated to use email utility
- [ ] Newsletter emails tested end-to-end
- [ ] Order confirmation emails tested
- [ ] Contact form notifications tested
- [ ] All templates rendered correctly in Mailtrap inbox
- [ ] Bilingual content displays properly
- [ ] Logo appears in all emails
- [ ] Links work correctly (resolve to frontend URLs)
