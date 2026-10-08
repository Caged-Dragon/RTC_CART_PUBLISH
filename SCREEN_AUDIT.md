# RedThunder Screen Audit

## Original customer routes retained
1. `/` — Intro / Home
2. `/products` — Products catalogue
3. `/price-list` — Price list
4. `/cart` — Cart / order review
5. `/my-orders` — My Orders
6. `/track-order` — Order Tracker
7. `/whatsapp-order` — WhatsApp Ordering
8. `/email-bill` — Email Bill
9. `/login` — Authentication
10. `/gift-boxes` — Gift Boxes / Combo catalogue
11. `/transport` — Transport & Freight
12. `/safety` — Safety guide
13. `/reviews` — Customer reviews

## Added storefront routes
14. `/about` — About Us
15. `/contact` — Contact & Support

## Existing reusable screens/components retained
- CheckoutModal
- InvoiceModal
- OrderDetailsModal
- CartDrawer
- CustomerReviewsFeedback
- QuickOrder
- HomeBanner
- Hero
- GiftBoxesShowcase
- LiveOffersSection
- MinimumOrderBooster
- CagedDragonAd
- PwaInstallPrompt
- SafetyModal

## Product detail
`/product/:id` is handled by the catalogue screen and renders the dedicated `ProductDetailScreen`, preserving the existing ProductsContext/CartContext flow.
