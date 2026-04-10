# ByteZone Overhaul — Design Spec
**Date:** 2026-04-10  
**Scope:** Security hardening, UI modernisation, full admin panel, Razorpay payment integration

---

## 1. Security Hardening

### 1.1 JWT Cookie Flags
- **File:** `controller/controllers.js` — all `res.cookie("uid", token)` calls  
- **Fix:** Add `{ httpOnly: true, sameSite: 'strict' }` options. Add `secure: true` if running HTTPS.

### 1.2 JWT Expiry
- **File:** `services/auth.js`  
- **Fix:** Pass `{ expiresIn: '7d' }` to `jwt.sign()`.

### 1.3 No Hardcoded Fallback Secret
- **File:** `services/auth.js`  
- **Fix:** If `process.env.SECRET_KEY` is falsy, throw at startup instead of falling back to a literal string.

### 1.4 Static File Exposure
- **File:** `index.js`  
- **Current:** `app.use(express.static(__dirname))` — serves `.env`, source files, etc.  
- **Fix:** Create a `public/` directory, move `css/`, `img/` into it, change to `app.use(express.static(path.join(__dirname, 'public')))`. Update all asset paths in views accordingly.

### 1.5 Remove Unauthenticated User Listing
- **File:** `routes/buyroutes.js:18`  
- **Fix:** Delete the `/buy/userRecord` endpoint entirely — any logged-in user can fetch all user records.

### 1.6 Remove API_KEY Admin Bypass
- **File:** `middleware/auth.js`  
- **Fix:** Remove `API_KEY` query-string fallback in `restrictToUserAdmin`. Admin access must be cookie-only.

### 1.7 Rate Limiting on Login
- **File:** `routes/staticRoutes.js`  
- **Fix:** Add `express-rate-limit` middleware — max 10 requests per 15 minutes on `POST /account/login` and `POST /account/signup`.

### 1.8 Security Headers
- **File:** `index.js`  
- **Fix:** Add `helmet` package and `app.use(helmet())` near the top of middleware chain.

### 1.9 File Upload Validation
- **File:** `routes/routes.js`  
- **Fix:** Add `fileFilter` to multer config to allow only `image/jpeg`, `image/png`, `image/webp`. Add `limits: { fileSize: 5 * 1024 * 1024 }` (5 MB cap).

### 1.10 Inventory Check Before Purchase
- **File:** `routes/buyroutes.js` POST `/`  
- **Fix:** After fetching `productDetails`, check `productDetails.qty >= quantity` before decrementing. Return 400 with message if insufficient stock.

### 1.11 Purchase Without Payment
- **File:** `routes/buyroutes.js` POST `/`  
- **Fix:** Remove direct DB update on POST. Purchase only recorded after Razorpay signature verification (see §4).

---

## 2. UI Modernisation

### Design Tokens (keep existing dark theme, modernise)
- Font: Add Inter via Google Fonts
- Colors: keep existing CSS variables, add `--radius: 0.75rem`, `--transition: 0.2s ease`
- Buttons: unified `.btn`, `.btn-primary`, `.btn-ghost` classes in a shared partial

### 2.1 Home Page (`views/home.ejs`)
- Large hero: headline + subline + "Shop Now" CTA → `/store`
- Three feature cards: Fast Delivery / Warranty / Support icons with text
- Featured products strip (latest 6 items from DB, passed from route)

### 2.2 Store Page (`views/store.ejs`)
- Product cards: show name **and** price
- Category tabs styled as pill buttons (already partially done, needs CSS polish)
- Out-of-stock items shown as greyed cards with "Out of Stock" badge (currently just hidden)
- Search bar (client-side filter on product name)

### 2.3 Single Product (`views/singleProduct.ejs`)
- Two-column layout: image left, details right
- Specs rendered in a `<table>` instead of `<ul>`
- Sticky bottom bar on mobile with Buy/Cart buttons

### 2.4 Buy Page (`views/buy.ejs`)
- Order summary card (product name, qty picker, total)
- Delivery details section (address, contact — pre-filled)
- Replace form submit with Razorpay checkout button (see §4)

### 2.5 Account Page (`views/account.ejs`)
- Profile card at top (name, email, contact, address)
- Tabbed section: "My Orders" | "My Cart"
- Orders show: image, name, qty, price, date
- Cart items show: image, name, price, remove button

### 2.6 Login / Signup (`views/account.ejs`)
- Centred card, max-width 420px
- Inline validation messages per field
- Password show/hide toggle

### 2.7 Shared
- Update `views/partials/navbar.ejs` — highlight active page, cart count badge
- Add loading spinner for form submits
- Consistent footer

---

## 3. Admin Panel

### 3.1 Routes (all under `/adm`, protected by `restrictToUserAdmin`)
| Route | Description |
|---|---|
| `GET /adm/` | Dashboard (already exists) |
| `GET /adm/products` | Product list with edit/delete |
| `GET /adm/products/add` | Add product form (rename from `/adm/addItem`) |
| `POST /adm/products/add` | Create product |
| `GET /adm/products/edit/:id/:type` | Edit product form |
| `POST /adm/products/edit/:id/:type` | Save edits |
| `POST /adm/products/delete/:id/:type` | Delete product |
| `GET /adm/users` | All users table |
| `POST /adm/users/role/:id` | Toggle user role NORMAL ↔ ADMIN |
| `GET /adm/orders` | All orders across all users |
| `POST /adm/logout` | Admin logout |

### 3.2 Admin Sidebar
Wire all existing dead sidebar links to their routes. Logout button posts to `/adm/logout` → clears cookie → redirects to `/account/login`.

### 3.3 Users Table
Columns: Name, Email, Contact, Role, Orders (count), Joined date, Change Role button.

### 3.4 Orders Table
Columns: Item name, Type, Buyer name, Qty, Price, Date. Sorted newest first.

### 3.5 Products Management
- List view same as current but with Edit (pencil) and Delete (trash) icon buttons
- Edit form pre-fills all fields
- Delete does a POST with method override (no JS fetch needed)

---

## 4. Razorpay Integration

### 4.1 Flow
1. User fills quantity on buy page, clicks "Proceed to Pay"
2. `POST /buy/create-order` — server creates Razorpay order via API, returns `order_id` + `amount`
3. Client opens Razorpay checkout modal with `order_id`
4. On payment success, client gets `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
5. Client posts these to `POST /buy/verify` — server verifies HMAC signature
6. On valid signature: decrement stock, record purchase in DB, redirect to success page
7. On invalid: return 400, do not record purchase

### 4.2 New Routes
| Route | Description |
|---|---|
| `POST /buy/create-order` | Creates Razorpay order, returns JSON |
| `POST /buy/verify` | Verifies signature, records purchase |

### 4.3 Environment Variables Required
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 4.4 Package
```
npm install razorpay
```

### 4.5 Test Setup Instructions (for user)
1. Go to https://razorpay.com → Sign up (free)
2. Dashboard → Settings → API Keys → Generate Test Key
3. Copy `Key ID` and `Key Secret` into `.env`
4. Use test card: **4111 1111 1111 1111**, expiry any future date, CVV any 3 digits
5. UPI test: use `success@razorpay` as VPA

---

## 5. File Structure Changes
- `public/css/` — moved from `css/`
- `public/img/` — moved from `img/`
- `public/uploads/` — moved from `public/uploads/` (already in public)
- `docs/superpowers/specs/` — design docs

## 6. New Packages
| Package | Purpose |
|---|---|
| `helmet` | Security headers |
| `express-rate-limit` | Login rate limiting |
| `razorpay` | Payment integration |

---

## Out of Scope
- Email notifications
- Product reviews/ratings
- Discount codes
- Multi-image upload per product
