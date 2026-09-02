# VELORA deployment guide

## Recommended stack
- Frontend: Vercel
- API: Render
- Database: MongoDB Atlas
- Optional payment demo: Stripe test mode

## 1. MongoDB Atlas
1. Create a free Atlas project and database cluster.
2. Create a database user.
3. Allow your Render service to connect (Atlas Network Access settings).
4. Copy the `mongodb+srv://...` connection string.
5. Use database name `velora` in the URI.

The API automatically seeds the 18 portfolio products and the demo admin when the database is empty.

## 2. Deploy API on Render
This repository contains `render.yaml`.

Create a new Render Blueprint or Web Service pointing to the repository and use the `server` directory.
Set these environment variables:

- `CLIENT_URL=https://YOUR-FRONTEND.vercel.app`
- `MONGO_URI=your Atlas URI`
- `JWT_SECRET=a long random secret`
- `ADMIN_EMAIL=your preferred admin email`
- `ADMIN_PASSWORD=a strong demo/admin password`

Optional Stripe test mode:
- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`

After deploy, verify:
`https://YOUR-API.onrender.com/api/health`

## 3. Deploy frontend on Vercel
Use the `client` folder as the Vercel project root.
Build command: `npm run build`
Output directory: `dist`

Set:
`VITE_API_URL=https://YOUR-API.onrender.com/api`

Deploy, then put the final Vercel URL into the Render `CLIENT_URL` variable and redeploy/restart the API.

## 4. Stripe test checkout (optional)
The app works without Stripe by using the built-in portfolio demo-card flow.
If a Stripe test secret key is configured, Checkout also displays a button for Stripe-hosted test Checkout.

For webhook support, point Stripe test webhooks to:
`https://YOUR-API.onrender.com/api/stripe/webhook`
Listen for `checkout.session.completed` and copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

Never use live Stripe keys for a Fiverr portfolio demo unless the store is a real authorised merchant project.
