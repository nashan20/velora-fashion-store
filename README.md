# VELORA — Premium Full-Stack MERN Fashion Store

VELORA is a Fiverr/portfolio-ready fashion e-commerce project built with React + Vite and an Express/Mongoose REST API. It works immediately in local demo mode and can switch to MongoDB Atlas simply by adding `MONGO_URI`.

## What is included

### Storefront
- Premium responsive homepage
- New Arrivals, Women, Men, Accessories, Dresses and Outerwear catalogues
- Search, sorting and advanced filters
- 18 seeded fashion products
- Four distinct gallery images per product
- Thumbnail image switcher and click-to-zoom
- Colour variants, size selection and live stock state
- Related products and verified-style review section
- Persistent wishlist and cart
- Full Cart page and slide-out bag
- Contact and newsletter forms connected to the API

### Full-stack customer system
- Register and login through Express API
- bcrypt password hashing
- JWT sessions
- Protected Account / Orders / Profile / Checkout routes
- Editable profile
- Three-step checkout
- Demo-card payment flow using `4242 4242 4242 4242`
- Optional Stripe test-mode hosted Checkout
- Orders stored in MongoDB when configured (in-memory database fallback otherwise)
- Customer-specific order history and order-detail pages

### Admin Studio
Routes are protected by the `admin` role.
- Dashboard: revenue, order count, customer count, total inventory
- Product list
- Create product
- Edit product
- Delete product
- Order management
- Change order status: Processing / Packed / Shipped / Delivered / Cancelled
- Customer directory
- Client contact-message inbox

### Deployment support
- MongoDB Atlas ready
- Render `render.yaml`
- Vercel SPA rewrite config
- `.env.example` files
- Optional Stripe test mode + webhook endpoint
- Full deployment instructions in `DEPLOYMENT.md`
- Fiverr listing/screenshots plan in `FIVERR_PORTFOLIO.md`

## Routes

Public / store:
`/`, `/shop`, `/new-arrivals`, `/women`, `/men`, `/accessories`, `/dresses`, `/outerwear`, `/product/:id`, `/collections`, `/journal`, `/about`, `/sustainability`, `/shipping`, `/returns`, `/size-guide`, `/faq`, `/privacy`, `/terms`, `/search`, `/wishlist`, `/cart`, `/contact`, `/newsletter`

Customer:
`/login`, `/register`, `/account`, `/profile`, `/orders`, `/orders/:id`, `/checkout`, `/order-success`

Admin:
`/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`, `/admin/orders`, `/admin/customers`, `/admin/messages`

## Run locally

From the `velora-mern` project folder:

```bash
npm install
npm install --prefix client
npm install --prefix server
npm run dev
```

Open:
- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health

### Important
The server works without MongoDB by using an in-memory demo store. Accounts and API orders are therefore reset when the backend process restarts. To persist everything, copy `server/.env.example` to `server/.env` and add a MongoDB Atlas URI.

## MongoDB mode

Create `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/velora
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@velora.demo
ADMIN_PASSWORD=VeloraAdmin123!
```

On the first successful MongoDB connection, VELORA seeds the portfolio catalogue and admin account automatically.

## Demo accounts

Customer: register any email from `/register`.

Default local admin:
- `admin@velora.demo`
- `VeloraAdmin123!`

Change this password before a public deployment.

## Payment modes

### Built-in portfolio demo
Use:
- Card: `4242 4242 4242 4242`
- Any future-looking expiry shown in the form
- Any 3-digit CVC

No raw payment data is saved or charged.

### Stripe test mode (optional)
Install server dependencies and add Stripe test keys to `server/.env`. The checkout automatically detects Stripe configuration and displays a Stripe-hosted test-checkout button. See `DEPLOYMENT.md` for webhook setup.

## Fiverr package
Open `FIVERR_PORTFOLIO.md` for the recommended title, description, tags, screenshot sequence and screen-recording flow.
