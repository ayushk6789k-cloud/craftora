# Craftora - Interdisciplinary College Project Guide

## Overview: The Tri-Departmental Collaboration
Craftora represents a synthesis of technical engineering, aesthetic curation, and commercial viability across three academic departments:

```
                  ┌───────────────────────────────┐
                  │           CRAFTORA            │
                  │   Handcrafted Marketplace     │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  ENGINEERING &   │    │  FASHION DESIGN  │    │    MANAGEMENT    │
│ TECHNOLOGY (ET)  │    │       (FD)       │    │      (MGT)       │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ • Full-Stack App │    │ • Handcrafted    │    │ • Pricing & Cost │
│ • Express + Vite │    │   Accessory Line │    │   Margin Models  │
│ • PostgreSQL     │    │ • Visual Styling │    │ • Discount &     │
│   Schema & RLS   │    │   & Storytelling │    │   Coupon Strategy│
│ • Razorpay Test  │    │ • Sustainable    │    │ • UTM Campaign   │
│   Integration    │    │   Materials Cur. │    │   Attribution    │
│ • Inventory ACID │    │ • Artisan Brand  │    │ • Sales GMV &    │
│   Reservations   │    │   Identity       │    │   Profit Reports │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 1. Engineering & Technology (ET) Focus
1. **Concurrency-Safe Inventory Ledger**:
   Uses atomic reservations with expiration locks to guarantee zero overselling during flash sales.
2. **Server-Side Financial Accuracy**:
   All transactions computed in integer paise (₹1 = 100 paise) to eliminate JavaScript IEEE-754 floating point imprecision.
3. **Role-Based Security (RBAC)**:
   Backend middleware enforces role checking (`customer`, `seller`, `management`, `admin`) at every REST endpoint.
4. **Resilient Multi-Vendor Order Splitting**:
   Master order is automatically split into individual sub-orders for each artisan to fulfill independently.

---

## 2. Fashion Design (FD) Focus
1. **Curated Product Portfolios**:
   Polymer clay terracotta earrings, freshwater pearl macrame chokers, lost-wax Dokra brass filigree, and pressed flower botanical resin charms.
2. **Artisan Storytelling**:
   Public artisan storefronts showcasing craft technique, studio photos, design philosophy, and care guidelines.
3. **Material Transparency**:
   Explicit classification of hypoallergenic metals, organic mulberry silks, and upcycled cotton cord.

---

## 3. Management (MGT) Focus
1. **Pricing & Contribution Margin Analysis**:
   - `Gross Margin % = (Selling Price - Cost Price - Variable Fee) / Selling Price * 100`
   - Real-time simulation of marketplace commission vs. artisan payout.
2. **Strategic Promotional Engine**:
   - Percentage discounts with maximum discount caps (e.g. 10% off up to ₹200).
   - Fixed student launch coupons (`STUDENT200`) with minimum basket size thresholds.
3. **Marketing Performance & Attribution**:
   - Multi-channel campaigns tracking impressions, click-throughs, and order conversions via UTM tagging.
