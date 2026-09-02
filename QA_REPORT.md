# VELORA QA / smoke-test report

## Static checks completed
- Client JS/JSX syntax parsed successfully across all source files.
- Express server source passes Node syntax validation.
- 40 React Router routes detected.
- 64 static internal links checked; all resolve to declared routes.
- 18 seeded products detected.
- Every product has at least 4 gallery images.
- Every product gallery uses distinct image URLs within that product.
- Every product has sizes, colour options and numeric stock.

## Manual browser flow to verify after `npm run dev`
1. Register a new customer.
2. Browse another page and return to Account; session should remain active.
3. Search and filter New Arrivals.
4. Open a product, switch all four gallery thumbnails and toggle zoom.
5. Change colour and size, then Add to Bag.
6. Add/remove wishlist items.
7. Change cart quantities and remove an item.
8. Checkout using demo card `4242 4242 4242 4242`.
9. Open Orders and the order-detail page.
10. Update Profile and confirm the new information remains during the session.
11. Sign out and sign in as admin.
12. Admin: create a product, edit it, then delete it.
13. Admin: change an order from Processing → Packed → Shipped → Delivered.
14. Submit Contact form and confirm it appears under Admin → Messages.
15. Submit Newsletter form.
16. Test mobile menu and pages at ~390px width.

## Persistence note
Without `MONGO_URI`, the backend intentionally uses an in-memory demo database, so API accounts/orders reset after the Node server restarts. Add MongoDB Atlas to make them persistent.
