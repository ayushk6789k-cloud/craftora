-- ==============================================================================
-- CRAFTORA MARKETPLACE - SEED DATA (DEVELOPMENT & DEMO)
-- Description: Realistic initial data including categories, sample student/local
--              artisan profiles, handcrafted products, pricing, and active coupons.
-- All prices stored in integer paise (e.g. 89900 = ₹899.00).
-- ==============================================================================

-- 1. CATEGORIES
INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
VALUES
('c1111111-1111-1111-1111-111111111101', 'Handmade Jewelry', 'handmade-jewelry', 'Artisanal necklaces, earrings, and rings meticulously crafted by hand.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80', 1, true),
('c1111111-1111-1111-1111-111111111102', 'Handcrafted Bags', 'handcrafted-bags', 'Sustainably woven macrame, canvas, and crochet bags with organic textures.', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80', 2, true),
('c1111111-1111-1111-1111-111111111103', 'Hair Accessories', 'hair-accessories', 'Embroidered hairbands, silk scrunchies, and hand-carved wooden clips.', 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=600&auto=format&fit=crop&q=80', 3, true),
('c1111111-1111-1111-1111-111111111104', 'Textile & Scarves', 'textile-accessories', 'Hand block-printed stoles, handwoven shawls, and bandhani neckerchiefs.', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80', 4, true),
('c1111111-1111-1111-1111-111111111105', 'Eco-Friendly & Resin', 'eco-friendly-accessories', 'Botanical resin keychains, terracotta charms, and recycled paper accessories.', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&auto=format&fit=crop&q=80', 5, true),
('c1111111-1111-1111-1111-111111111106', 'Traditional Crafts', 'traditional-accessories', 'Heritage brass filigree, meenakari work, and terracotta jewelry.', 'https://images.unsplash.com/photo-1611591475155-426c04a29c01?w=600&auto=format&fit=crop&q=80', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. SAMPLE PROFILES
-- Password for all demo accounts: "Craftora@123" (hashed with bcrypt 10 rounds)
-- Hash: "$2a$10$7vN3K7sP1gP/rI7B1G.xheQZ5nKz0xQzPqZp3bJvFpQ3nZq123456"
INSERT INTO profiles (id, email, full_name, phone, role, bio)
VALUES
('u1111111-1111-1111-1111-111111111101', 'admin@craftora.com', 'Devansh Sharma (Admin)', '+919876543210', 'admin', 'Lead System Administrator & ET Faculty Advisor.'),
('u1111111-1111-1111-1111-111111111102', 'management@craftora.com', 'Aanya Mehra (MGT Lead)', '+919876543211', 'management', 'Strategic Pricing & Business Analytics Lead from Management Department.'),
('u1111111-1111-1111-1111-111111111103', 'ananya.fd@craftora.com', 'Ananya Roy (FD Student)', '+919876543212', 'seller', 'Senior Fashion Design student passionate about polymer clay and sustainable bohemian jewelry.'),
('u1111111-1111-1111-1111-111111111104', 'vikram.crafts@craftora.com', 'Vikramaditya Rao (Artisan)', '+919876543213', 'seller', 'Second-generation heritage artisan specializing in dokra metal casting and hand-braided jute.'),
('u1111111-1111-1111-1111-111111111105', 'priya.customer@craftora.com', 'Priya Patel (Customer)', '+919876543214', 'customer', 'Art lover and conscious buyer looking for authentic college artisan creations.')
ON CONFLICT (email) DO NOTHING;

-- 3. SELLER STORES
INSERT INTO seller_stores (id, user_id, store_name, slug, tagline, story, logo_url, banner_url, city, state, is_verified, is_active)
VALUES
('s1111111-1111-1111-1111-111111111101', 'u1111111-1111-1111-1111-111111111103', 'Clay & Petals Studio', 'clay-petals-studio', 'Handmade botanical polymer clay jewelry', 'Founded in the college Fashion Design studio, Clay & Petals blends floral inspirations with lightweight, slow-cured terracotta and polymer clay aesthetics.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80', 'Jaipur', 'Rajasthan', true, true),
('s1111111-1111-1111-1111-111111111102', 'u1111111-1111-1111-1111-111111111104', 'Sutradhar Woven Crafts', 'sutradhar-woven-crafts', 'Heritage knotting, macrame, and brass accessories', 'Carrying forward rural weaving and metal crafts into modern urban fashion accessories, designed collaboratively with university students.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=80', 'Kolkata', 'West Bengal', true, true)
ON CONFLICT (slug) DO NOTHING;

-- 4. PRODUCTS (Prices in Paise: e.g. 74900 = ₹749.00)
INSERT INTO products (id, seller_id, category_id, name, slug, sku, short_description, description, base_price, selling_price, cost_price, stock_quantity, low_stock_threshold, material, color, dimensions, care_instructions, handmade_technique, customization_available, processing_time_days, status, average_rating, review_count)
VALUES
(
    'p1111111-1111-1111-1111-111111111101',
    's1111111-1111-1111-1111-111111111101',
    'c1111111-1111-1111-1111-111111111101',
    'Handcrafted Terracotta Petal Earrings',
    'handcrafted-terracotta-petal-earrings',
    'CPP-TER-001',
    'Earthy baked clay teardrop earrings with hand-painted gold foil accents.',
    'Carefully sculpted by Fashion Design students using purified clay, these earrings undergo a 48-hour slow drying and kiln firing process. Hypoallergenic 18k gold-plated brass studs ensure skin safety.',
    119900, 79900, 32000, 18, 4,
    'Terracotta Clay & Gold Plated Brass',
    'Warm Ochre / Gold',
    '5.2 cm x 2.1 cm',
    'Avoid contact with water and perfume. Wipe with a dry microfiber cloth.',
    'Hand-sculpted and Kiln-fired',
    true, 2, 'active', 4.9, 14
),
(
    'p1111111-1111-1111-1111-111111111102',
    's1111111-1111-1111-1111-111111111101',
    'c1111111-1111-1111-1111-111111111101',
    'Bohemian Freshwater Pearl & Thread Choker',
    'bohemian-freshwater-pearl-thread-choker',
    'CPP-PRL-002',
    'Baroque pearls woven onto hand-spun organic mulberry silk thread.',
    'Each freshwater pearl is individually knotted with hand-spun raw silk thread, finished with a rustic adjustable brass clasp.',
    189900, 129900, 52000, 12, 3,
    'Natural Freshwater Pearl & Mulberry Silk',
    'Cream White / Sage Silk',
    '38 cm + 5 cm extension',
    'Store flat in an airtight cloth pouch.',
    'Hand-knotting & Silk Braiding',
    false, 3, 'active', 4.8, 9
),
(
    'p1111111-1111-1111-1111-111111111103',
    's1111111-1111-1111-1111-111111111102',
    'c1111111-1111-1111-1111-111111111102',
    'Knotted Macrame Crossbody Sling Bag',
    'knotted-macrame-crossbody-sling-bag',
    'SWC-BAG-001',
    'Natural unbleached cotton cord macrame bag with hand-carved teak wood ring.',
    'Hand-knotted over 14 hours using 4mm triple-twisted recycled cotton cord. Features a natural cotton canvas inner lining with secure zippered closure.',
    249900, 179900, 85000, 8, 2,
    '100% Recycled Cotton & Teak Wood',
    'Natural Ecru / Beige',
    '24 cm x 18 cm x 6 cm',
    'Spot clean with mild detergent and cold water.',
    'Traditional Macrame Square Knots',
    true, 4, 'active', 5.0, 11
),
(
    'p1111111-1111-1111-1111-111111111104',
    's1111111-1111-1111-1111-111111111102',
    'c1111111-1111-1111-1111-111111111105',
    'Pressed Marigold & Resin Botanical Keychain',
    'pressed-marigold-resin-botanical-keychain',
    'SWC-RES-001',
    'Real preserved campus marigold petals cast in crystal-clear eco resin.',
    'Created from discarded festive and campus garden marigold blossoms, dehydrated and encased in high-clarity UV-stabilized eco resin with antique bronze hardware.',
    59900, 39900, 14000, 25, 5,
    'Bio-based Resin & Dried Floral Petals',
    'Amber Marigold & Clear',
    '4.5 cm diameter',
    'Keep away from extreme heat and sharp objects.',
    'Casting and UV-Curing',
    true, 1, 'active', 4.7, 19
),
(
    'p1111111-1111-1111-1111-111111111105',
    's1111111-1111-1111-1111-111111111101',
    'c1111111-1111-1111-1111-111111111103',
    'Hand-Embroidered Velvet Zari Hairband',
    'hand-embroidered-velvet-zari-hairband',
    'CPP-HRB-001',
    'Plush cinnamon velvet headband hand-embroidered with metallic dabka and sequins.',
    'A comfortable padded headband wrapped in luxurious cotton velvet, adorned with intricate needlework hand-stitched by FD department embroidery specialists.',
    99900, 64900, 26000, 15, 3,
    'Cotton Velvet, Metallic Zari Thread & Padded Core',
    'Cinnamon Rust & Antique Gold',
    'Free Size (Flexible band)',
    'Dry clean only. Store in protective sleeve.',
    'Zardosi Hand Embroidery',
    false, 2, 'active', 4.9, 8
),
(
    'p1111111-1111-1111-1111-111111111106',
    's1111111-1111-1111-1111-111111111102',
    'c1111111-1111-1111-1111-111111111106',
    'Tribal Dokra Brass Filigree Bangle',
    'tribal-dokra-brass-filigree-bangle',
    'SWC-DKR-001',
    'Ancient lost-wax cast bell metal bangle with geometric spiral engravings.',
    'Crafted using the 4,000-year-old Dokra lost-wax technique. Every piece is unique, bearing slight organic textures and metallic lustre.',
    169900, 114900, 50000, 9, 3,
    'Dokra Bell Metal Brass',
    'Antique Rustic Brass',
    '6.2 cm inner diameter (Size 2.6)',
    'Rub with tamarind water or brass polish to renew shine.',
    'Lost-Wax Casting (Dokra)',
    false, 3, 'active', 4.9, 7
)
ON CONFLICT (slug) DO NOTHING;

-- 5. PRODUCT IMAGES
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
('p1111111-1111-1111-1111-111111111101', 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80', 'Terracotta Petal Earrings Close Up', true, 1),
('p1111111-1111-1111-1111-111111111101', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80', 'Terracotta Petal Earrings on Model', false, 2),
('p1111111-1111-1111-1111-111111111102', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80', 'Freshwater Pearl Choker', true, 1),
('p1111111-1111-1111-1111-111111111103', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80', 'Knotted Macrame Crossbody Bag', true, 1),
('p1111111-1111-1111-1111-111111111104', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&auto=format&fit=crop&q=80', 'Botanical Resin Keychain', true, 1),
('p1111111-1111-1111-1111-111111111105', 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&auto=format&fit=crop&q=80', 'Hand-Embroidered Velvet Hairband', true, 1),
('p1111111-1111-1111-1111-111111111106', 'https://images.unsplash.com/photo-1611591475155-426c04a29c01?w=800&auto=format&fit=crop&q=80', 'Dokra Brass Bangle', true, 1);

-- 6. COUPONS (MGT Department Module)
INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, times_used, per_customer_limit, start_date, expiry_date, is_active)
VALUES
('cp111111-1111-1111-1111-111111111101', 'CRAFT10', 'percentage', 10, 50000, 20000, 500, 42, 2, NOW() - INTERVAL '30 days', NOW() + INTERVAL '90 days', true),
('cp111111-1111-1111-1111-111111111102', 'STUDENT200', 'fixed_amount', 20000, 99900, 20000, 200, 15, 1, NOW() - INTERVAL '10 days', NOW() + INTERVAL '60 days', true),
('cp111111-1111-1111-1111-111111111103', 'FESTIVE15', 'percentage', 15, 120000, 35000, 300, 18, 1, NOW() - INTERVAL '5 days', NOW() + INTERVAL '45 days', true)
ON CONFLICT (code) DO NOTHING;

-- 7. MARKETING CAMPAIGNS
INSERT INTO marketing_campaigns (id, name, description, campaign_type, budget, start_date, end_date, target_category_id, coupon_id, status, utm_source, utm_campaign)
VALUES
('mc111111-1111-1111-1111-111111111101', 'Artisan Spring Craft Showcase', 'Inter-collegiate spring showcase highlighting student handmade accessories.', 'Campus Outreach', 1500000, NOW() - INTERVAL '15 days', NOW() + INTERVAL '30 days', 'c1111111-1111-1111-1111-111111111101', 'cp111111-1111-1111-1111-111111111101', 'active', 'instagram', 'spring_showcase_2026'),
('mc111111-1111-1111-1111-111111111102', 'Eco-Fashion Campus Drive', 'Awareness campaign on upcycled resin and natural fiber bags designed by FD students.', 'Sustainability Drive', 800000, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'c1111111-1111-1111-1111-111111111102', 'cp111111-1111-1111-1111-111111111102', 'active', 'campus_posters', 'eco_drive_2026')
ON CONFLICT DO NOTHING;
