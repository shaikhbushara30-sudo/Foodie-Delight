# 🍔 Foodie Delight — MVC Food Ordering App

A full-stack conversion of the original static HTML/CSS/JS "Foodie Delight" site into a
**Node.js + Express + MySQL** application, built with proper **MVC architecture**, customer
**login/signup**, and a full **Admin Dashboard**.

---

## ✨ Features

**Customer-facing site**
- Home, Menu (with category filters), About, Contact pages — all data-driven from MySQL
- Signup / Login (passwords hashed with bcrypt, **JWT-based auth** stored in an httpOnly cookie — stays logged in even across server restarts, since the token lives in the browser, not server memory)
- Cart (client-side, persisted in `localStorage`)
- Checkout — prices are **re-validated on the server** against the database (never trusts the client)
- **Two payment options**: Cash on Delivery, or online payment via **Razorpay** (UPI / Cards / Netbanking) with server-side signature verification
- Order history ("My Orders") + a bill/receipt page with **Download as TXT** and **Print/PDF**
- Contact form → saved to the database
- Profile dropdown (top-right) with Logout

**Admin Dashboard** (`/admin`)
- Secure admin login (role-based, same `users` table with `role = 'admin'`)
- **Analytics**: total revenue, total orders, total customers, unread messages, a 7-day revenue chart, order-status breakdown, recent orders, top-selling items
- **Menu management**: add / edit / delete menu items, toggle featured & availability
- **Orders**: view all orders, filter by status, view order detail, update order status (pending → preparing → out for delivery → delivered / cancelled)
- **Contact messages**: view, mark as read, delete

---

## 🏗️ Project Structure (MVC)

```
foodie-delight-mvc/
├── app.js                  # Entry point — wires up middleware & routes
├── config/
│   └── db.js                # MySQL connection pool (mysql2)
├── models/                  # Data layer — all SQL queries live here
│   ├── userModel.js
│   ├── menuModel.js
│   ├── orderModel.js
│   └── contactModel.js
├── controllers/              # Business logic
│   ├── authController.js
│   ├── siteController.js
│   ├── contactController.js
│   ├── orderController.js
│   └── admin/
│       ├── dashboardController.js
│       ├── menuController.js
│       ├── orderController.js
│       └── messageController.js
├── routes/                   # Express routers
│   ├── siteRoutes.js
│   ├── authRoutes.js
│   ├── orderRoutes.js
│   └── adminRoutes.js
├── middleware/
│   └── authMiddleware.js     # isAuthenticated / isAdmin route guards
├── views/                    # EJS templates
│   ├── partials/              # layout, navbar, footer, cart modal, admin shell
│   └── admin/                 # admin dashboard, menu, orders, messages views
├── public/                   # Static assets served as-is
│   ├── css/ (style.css, admin.css)
│   ├── js/  (script.js — cart & checkout logic, admin.js)
│   └── img/
├── database/
│   └── schema.sql            # Full MySQL schema + menu seed data
├── scripts/
│   └── seedAdmin.js          # Creates/resets the admin account (bcrypt-hashed)
├── .env.example
└── package.json
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ and npm
- MySQL 8+ (or MariaDB 10.6+, fully compatible)

### 2. Install dependencies
```bash
cd foodie-delight-mvc
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in your MySQL credentials:
```bash
cp .env.example .env
```
```env
PORT=3000
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=foodie_delight
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@foodiedelight.com
ADMIN_PASSWORD=Admin@123
```

### 4. Create the database
Run the schema file (creates the database, all tables, and seeds the menu items):
```bash
mysql -u root -p < database/schema.sql
```

**If the `mysql` command isn't recognized** (common on Windows when MySQL isn't added to your
system PATH), use this instead — it does the same thing using Node.js directly:
```bash
npm run db:load
```

### 5. Create the admin account
Passwords must be bcrypt-hashed, so the admin account is created via a script (reads
`ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`):
```bash
npm run seed:admin
```

### 6. Set up Razorpay (for online payments)
1. Sign up free at https://dashboard.razorpay.com/signup
2. Go to **Settings → API Keys → Generate Test Key**
3. Copy the **Key ID** and **Key Secret** into your `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```
4. That's it — no code changes needed. Test mode uses **fake cards/UPI**, so you can test the
   full payment flow without real money. Razorpay's test card: `4111 1111 1111 1111`, any future
   expiry date, any CVV. For test UPI, use `success@razorpay`.
5. Cash on Delivery works with **no Razorpay setup at all** — it's always available as an option.

### 7. Start the app
```bash
npm start          # production
npm run dev         # development, auto-restarts with nodemon
```

Visit:
- **Public site** → http://localhost:3000
- **Admin panel** → http://localhost:3000/admin/login (use the credentials from step 5)

---

## 🔐 Security notes
- Passwords are hashed with `bcryptjs` (10 salt rounds) — never stored in plain text.
- **Authentication uses JWT** (JSON Web Tokens), signed with `JWT_SECRET` and stored in an
  `httpOnly` cookie named `token`. This means login sessions are stateless (no server-side
  session store needed) and **survive server restarts** — the token itself carries the
  identity, verified fresh on every request.
- `isAuthenticated` / `isCustomer` / `isAdmin` middleware protect routes by role — admin
  accounts cannot access customer checkout routes and vice versa.
- **Checkout prices are recalculated server-side** from the `menu_items` table — the client
  only sends item IDs and quantities, so a manipulated `localStorage` cart can't be used to
  under-pay.
- Change `JWT_SECRET` and the default admin password before deploying anywhere public.
- In production (served over HTTPS), uncomment `secure: true` in the cookie options inside
  `controllers/authController.js` so the auth cookie is only ever sent over HTTPS.

## 🗄️ Database schema (summary)
| Table | Purpose |
|---|---|
| `users` | Customers and admins (`role` column distinguishes them) |
| `menu_items` | Food items — name, price, category, image, featured/available flags |
| `orders` | One row per placed order (`status`, `total_amount`, `delivery_address`) |
| `order_items` | Line items belonging to an order (snapshotted name/price at order time) |
| `contact_messages` | Messages submitted via the Contact page |

## 🧩 Notes on this version
- Guest checkout was intentionally removed — customers must sign up / log in before ordering, per the requirements this was built against.
- Both Cash on Delivery and Razorpay online payment are supported — customers choose at checkout. Online payments are verified server-side via HMAC signature before being marked as paid.
- All original design/CSS/branding from the static site has been preserved.
