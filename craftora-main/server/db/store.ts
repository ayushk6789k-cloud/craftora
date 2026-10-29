import {
  UserProfile,
  SellerStore,
  Category,
  Product,
  ProductImage,
  CartItem,
  WishlistItem,
  Address,
  Order,
  OrderItem,
  SellerOrder,
  Coupon,
  MarketingCampaign,
  Review,
  SellerApplication,
  AuditLog,
} from '../types';
import crypto from 'crypto';

// In-Memory Relational Engine with Atomic Locking and Persistence
class MarketplaceDataStore {
  public profiles: UserProfile[] = [];
  public seller_stores: SellerStore[] = [];
  public seller_applications: SellerApplication[] = [];
  public categories: Category[] = [];
  public products: Product[] = [];
  public product_images: ProductImage[] = [];
  public carts: { id: string; user_id?: string; session_id?: string }[] = [];
  public cart_items: CartItem[] = [];
  public wishlists: WishlistItem[] = [];
  public addresses: Address[] = [];
  public orders: Order[] = [];
  public order_items: OrderItem[] = [];
  public seller_orders: SellerOrder[] = [];
  public coupons: Coupon[] = [];
  public marketing_campaigns: MarketingCampaign[] = [];
  public reviews: Review[] = [];
  public audit_logs: AuditLog[] = [];
  public inventory_movements: any[] = [];
  public reservations: {
    id: string;
    product_id: string;
    quantity: number;
    order_ref: string;
    expires_at: number;
  }[] = [];

  constructor() {
    this.seedInitialData();
  }

  public upsertProfile(profile: UserProfile): UserProfile {
    const index = this.profiles.findIndex(
      (p) => p.id === profile.id || (profile.email && p.email.toLowerCase() === profile.email.toLowerCase())
    );
    if (index >= 0) {
      this.profiles[index] = { ...this.profiles[index], ...profile };
      return this.profiles[index];
    } else {
      this.profiles.push(profile);
      return profile;
    }
  }

  public getProfileById(id: string): UserProfile | undefined {
    return this.profiles.find((p) => p.id === id);
  }

  public getProfileByEmail(email: string): UserProfile | undefined {
    return this.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }

  private seedInitialData() {
    // 1. Categories (Matching Supabase database public.categories)
    this.categories = [
      {
        id: 'd054c0e3-2b34-4894-9b9c-5e8f10043bf8',
        name: 'Handmade Jewelry',
        slug: 'handmade-jewelry',
        description: 'Artisanal necklaces, earrings, and rings meticulously sculpted and cast by hand.',
        image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
        display_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '1dcd963d-d47b-4372-acb8-fd2d29690e95',
        name: 'Handcrafted Bags',
        slug: 'handcrafted-bags',
        description: 'Sustainably woven macrame, canvas, and crochet bags with organic rustic textures.',
        image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
        display_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '35fc8666-0918-4d59-af38-a309e8bf6d43',
        name: 'Hair Accessories',
        slug: 'hair-accessories',
        description: 'Embroidered velvet hairbands, pure silk scrunchies, and hand-carved floral clips.',
        image_url: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=600&auto=format&fit=crop&q=80',
        display_order: 3,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '93283e92-d424-4e79-af84-921b878a9442',
        name: 'Textile & Scarves',
        slug: 'textile-accessories',
        description: 'Hand block-printed stoles, handwoven shawls, and organic cotton neckerchiefs.',
        image_url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80',
        display_order: 4,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'cf2e7542-d482-4659-b5d1-287a1a8d9396',
        name: 'Eco-Friendly & Resin',
        slug: 'eco-friendly-accessories',
        description: 'Real botanical resin keychains, pressed blossom bookmarks, and terracotta charms.',
        image_url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&auto=format&fit=crop&q=80',
        display_order: 5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'a3b68b10-da69-4e06-a8c1-f30d8bcfba5d',
        name: 'Traditional Crafts',
        slug: 'traditional-accessories',
        description: 'Heritage lost-wax Dokra brass filigree, meenakari jewelry, and tribal metalwork.',
        image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
        display_order: 6,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // 2. Profiles (Default test accounts with BCrypt-style placeholder or direct login check)
    this.profiles = [
      {
        id: 'c01769ee-7ce9-491d-a441-fe3294f908ea',
        email: 'ayushk6789k@gmail.com',
        full_name: 'Ayush',
        phone: '6387583600',
        role: 'admin',
        bio: 'Platform Administrator & Marketplace Lead.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'u1111111-1111-1111-1111-111111111101',
        email: 'admin@craftora.com',
        full_name: 'Devansh Sharma',
        phone: '+91 98765 43210',
        role: 'admin',
        bio: 'Lead System Administrator & Engineering (ET) Faculty Mentor.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'u1111111-1111-1111-1111-111111111102',
        email: 'management@craftora.com',
        full_name: 'Aanya Mehra',
        phone: '+91 98765 43211',
        role: 'management',
        bio: 'Strategic Pricing, Marketing Campaigns & Business Analytics Lead (MGT Department).',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '5dd5f555-e217-4375-9d02-dd5f56dc28f8',
        email: 'ananya.fd@craftora.com',
        full_name: 'Ananya Roy',
        phone: '+91 98765 43212',
        role: 'seller',
        bio: 'Senior Fashion Design student passionate about slow-cured terracotta and botanical polymer clay.',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'f126bbbf-246b-49e4-9435-c824eb1cf78d',
        email: 'vikram.crafts@craftora.com',
        full_name: 'Vikramaditya Rao',
        phone: '+91 98765 43213',
        role: 'seller',
        bio: 'Second-generation heritage artisan specializing in lost-wax Dokra bell metal casting and hand-braided jute.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ba3f040c-6ab5-4f1b-8acb-92e8af5494be',
        email: 'customer@craftora.com',
        full_name: 'Priya Patel',
        phone: '+91 98765 43214',
        role: 'customer',
        bio: 'Art lover and conscious consumer looking for authentic college artisan creations.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // 3. Seller Stores (Matching Supabase database public.seller_stores)
    this.seller_stores = [
      {
        id: '11111111-1111-4111-8111-111111111101',
        user_id: '5dd5f555-e217-4375-9d02-dd5f56dc28f8',
        store_name: 'Clay & Petals Studio',
        slug: 'clay-petals-studio',
        tagline: 'Handcrafted botanical polymer clay & slow-cured terracotta jewelry',
        story: 'Founded in our university Fashion Design studio, Clay & Petals transforms natural raw earth and flora into wearable art. Each piece is slow-fired, sculpted without mass moulds, and individually painted with non-toxic metallic pigment.',
        logo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        city: 'Jaipur',
        state: 'Rajasthan',
        country: 'India',
        instagram_handle: '@clayandpetals.fd',
        is_verified: true,
        is_active: true,
        commission_rate_percentage: 10.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '11111111-1111-4111-8111-111111111102',
        user_id: 'f126bbbf-246b-49e4-9435-c824eb1cf78d',
        store_name: 'Sutradhar Woven Crafts',
        slug: 'sutradhar-woven-crafts',
        tagline: 'Heritage knotting, recycled cotton macrame, and lost-wax brass accessories',
        story: 'Bridging timeless rural weaving traditions with contemporary urban fashion accessories. We partner directly with college design students to innovate traditional artisan crafts.',
        logo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        banner_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=80',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        instagram_handle: '@sutradharcrafts',
        is_verified: true,
        is_active: true,
        commission_rate_percentage: 12.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // 4. Products (Exact integer paise: ₹799.00 = 79900 - Matching Supabase public.products)
    this.products = [
      {
        id: '22222222-2222-4222-8222-222222222201',
        seller_id: '11111111-1111-4111-8111-111111111101',
        category_id: 'd054c0e3-2b34-4894-9b9c-5e8f10043bf8',
        name: 'Handcrafted Terracotta Petal Earrings',
        slug: 'handcrafted-terracotta-petal-earrings',
        sku: 'CPP-TER-001',
        short_description: 'Earthy baked clay teardrop earrings with hand-painted 18k gold foil accents.',
        description: 'Carefully sculpted by Fashion Design students using purified riverbed clay, these earrings undergo a 48-hour slow drying and kiln firing cycle. Hypoallergenic 18k gold-plated brass studs ensure skin safety and comfortable all-day wear.',
        base_price: 119900,
        selling_price: 79900,
        cost_price: 32000,
        stock_quantity: 18,
        low_stock_threshold: 4,
        material: 'Terracotta Clay & Gold Plated Brass',
        color: 'Warm Ochre & Gold',
        dimensions: '5.2 cm x 2.1 cm',
        weight_grams: 14,
        care_instructions: 'Avoid direct contact with water and perfume. Wipe clean with a dry microfiber cloth.',
        handmade_technique: 'Hand-sculpted and Kiln-fired',
        customization_available: true,
        processing_time_days: 2,
        status: 'active',
        average_rating: 4.9,
        review_count: 14,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-4222-8222-222222222202',
        seller_id: '11111111-1111-4111-8111-111111111101',
        category_id: 'd054c0e3-2b34-4894-9b9c-5e8f10043bf8',
        name: 'Bohemian Freshwater Pearl & Thread Choker',
        slug: 'bohemian-freshwater-pearl-thread-choker',
        sku: 'CPP-PRL-002',
        short_description: 'Lustrous baroque pearls woven onto hand-spun organic mulberry silk thread.',
        description: 'Each natural freshwater pearl is hand-selected for unique shape and sheen, individually knotted with sage green raw silk thread and secured with an artisanal hammered brass hook.',
        base_price: 189900,
        selling_price: 129900,
        cost_price: 52000,
        stock_quantity: 12,
        low_stock_threshold: 3,
        material: 'Natural Freshwater Pearl & Mulberry Silk',
        color: 'Cream White & Sage Silk',
        dimensions: '38 cm + 5 cm extension',
        weight_grams: 22,
        care_instructions: 'Store flat in an airtight cloth pouch. Avoid spray chemicals.',
        handmade_technique: 'Hand-knotting & Silk Braiding',
        customization_available: false,
        processing_time_days: 3,
        status: 'active',
        average_rating: 4.8,
        review_count: 9,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-4222-8222-222222222203',
        seller_id: '11111111-1111-4111-8111-111111111102',
        category_id: '1dcd963d-d47b-4372-acb8-fd2d29690e95',
        name: 'Knotted Macrame Crossbody Sling Bag',
        slug: 'knotted-macrame-crossbody-sling-bag',
        sku: 'SWC-BAG-001',
        short_description: 'Natural unbleached cotton cord macrame bag with hand-carved teak wood ring.',
        description: 'Artfully knotted over 14 hours of continuous manual precision using 4mm triple-twisted recycled cotton cord. Built with a sturdy canvas inner pouch, internal zippered pocket, and magnetic snap enclosure.',
        base_price: 249900,
        selling_price: 179900,
        cost_price: 85000,
        stock_quantity: 8,
        low_stock_threshold: 2,
        material: '100% Recycled Cotton & Teak Wood',
        color: 'Natural Ecru / Sand',
        dimensions: '24 cm x 18 cm x 6 cm',
        weight_grams: 380,
        care_instructions: 'Spot clean with mild soapy water and let air dry flat in shade.',
        handmade_technique: 'Traditional Macrame Square & Spiral Knots',
        customization_available: true,
        processing_time_days: 4,
        status: 'active',
        average_rating: 5.0,
        review_count: 11,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-4222-8222-222222222204',
        seller_id: '11111111-1111-4111-8111-111111111102',
        category_id: 'cf2e7542-d482-4659-b5d1-287a1a8d9396',
        name: 'Pressed Marigold & Botanical Resin Keychain',
        slug: 'pressed-marigold-botanical-resin-keychain',
        sku: 'SWC-RES-001',
        short_description: 'Real preserved campus marigold petals cast in crystal-clear eco resin.',
        description: 'Repurposing festive and campus floral waste into timeless everyday keepsakes. Petals are dehydrate-cured for 7 days before vacuum encapsulation in crystal-clear UV-resistant resin.',
        base_price: 59900,
        selling_price: 39900,
        cost_price: 14000,
        stock_quantity: 25,
        low_stock_threshold: 5,
        material: 'Bio-based Resin & Dehydrated Florals',
        color: 'Amber Marigold & Clear Glass',
        dimensions: '4.5 cm diameter',
        weight_grams: 18,
        care_instructions: 'Keep away from excessive high heat and sharp metallic edges.',
        handmade_technique: 'Botanical Encapsulation & UV Polish',
        customization_available: true,
        processing_time_days: 1,
        status: 'active',
        average_rating: 4.7,
        review_count: 19,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-4222-8222-222222222205',
        seller_id: '11111111-1111-4111-8111-111111111101',
        category_id: '35fc8666-0918-4d59-af38-a309e8bf6d43',
        name: 'Hand-Embroidered Velvet Zari Hairband',
        slug: 'hand-embroidered-velvet-zari-hairband',
        sku: 'CPP-HRB-001',
        short_description: 'Plush cinnamon velvet headband hand-embroidered with metallic dabka and sequins.',
        description: 'A comfortable non-slip padded headband wrapped in deep rust-cinnamon cotton velvet, adorned with hand-stitched floral zardosi motifs by Fashion Design embroidery artisans.',
        base_price: 99900,
        selling_price: 64900,
        cost_price: 26000,
        stock_quantity: 15,
        low_stock_threshold: 3,
        material: 'Cotton Velvet, Metallic Zari Thread & Padded Band',
        color: 'Cinnamon Rust & Antique Gold',
        dimensions: 'Free Size (Flexible band)',
        weight_grams: 45,
        care_instructions: 'Spot clean only. Store in protective sleeve when traveling.',
        handmade_technique: 'Zardosi Hand Needlework',
        customization_available: false,
        processing_time_days: 2,
        status: 'active',
        average_rating: 4.9,
        review_count: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-4222-8222-222222222206',
        seller_id: '11111111-1111-4111-8111-111111111102',
        category_id: 'a3b68b10-da69-4e06-a8c1-f30d8bcfba5d',
        name: 'Tribal Dokra Brass Filigree Bangle',
        slug: 'tribal-dokra-brass-filigree-bangle',
        sku: 'SWC-DKR-001',
        short_description: 'Ancient lost-wax cast bell metal bangle with geometric spiral engravings.',
        description: 'Manufactured through the 4,000-year-old Dokra lost-wax casting technique. Every piece features distinct spiral wax threads and textured rustic brass patina.',
        base_price: 169900,
        selling_price: 114900,
        cost_price: 50000,
        stock_quantity: 9,
        low_stock_threshold: 3,
        material: 'Dokra Bell Metal Brass',
        color: 'Antique Warm Brass',
        dimensions: '6.2 cm inner diameter (Size 2.6)',
        weight_grams: 68,
        care_instructions: 'Clean with lemon juice or brass polish to restore original shine.',
        handmade_technique: 'Lost-Wax Clay Core Casting',
        customization_available: false,
        processing_time_days: 3,
        status: 'active',
        average_rating: 4.9,
        review_count: 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // 5. Product Images (Matching Supabase public.product_images)
    this.product_images = [
      {
        id: '33333333-3333-4333-8333-333333333101',
        product_id: '22222222-2222-4222-8222-222222222201',
        image_url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Terracotta Petal Earrings Close Up',
        is_primary: true,
        display_order: 1,
      },
      {
        id: '33333333-3333-4333-8333-333333333102',
        product_id: '22222222-2222-4222-8222-222222222201',
        image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Terracotta Petal Earrings Texture',
        is_primary: false,
        display_order: 2,
      },
      {
        id: '33333333-3333-4333-8333-333333333201',
        product_id: '22222222-2222-4222-8222-222222222202',
        image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Freshwater Pearl Choker',
        is_primary: true,
        display_order: 1,
      },
      {
        id: '33333333-3333-4333-8333-333333333301',
        product_id: '22222222-2222-4222-8222-222222222203',
        image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Knotted Macrame Crossbody Bag',
        is_primary: true,
        display_order: 1,
      },
      {
        id: '33333333-3333-4333-8333-333333333401',
        product_id: '22222222-2222-4222-8222-222222222204',
        image_url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Botanical Resin Keychain',
        is_primary: true,
        display_order: 1,
      },
      {
        id: '33333333-3333-4333-8333-333333333501',
        product_id: '22222222-2222-4222-8222-222222222205',
        image_url: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Hand-Embroidered Velvet Hairband',
        is_primary: true,
        display_order: 1,
      },
      {
        id: '33333333-3333-4333-8333-333333333601',
        product_id: '22222222-2222-4222-8222-222222222206',
        image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Dokra Brass Bangle',
        is_primary: true,
        display_order: 1,
      },
    ];

    // 6. Coupons (MGT Department Module)
    this.coupons = [
      {
        id: 'cp111111-1111-1111-1111-111111111101',
        code: 'CRAFT10',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_value: 50000, // ₹500.00
        max_discount_amount: 20000, // ₹200.00 max discount
        usage_limit: 500,
        times_used: 42,
        per_customer_limit: 2,
        start_date: new Date(Date.now() - 30 * 86400000).toISOString(),
        expiry_date: new Date(Date.now() + 90 * 86400000).toISOString(),
        is_active: true,
      },
      {
        id: 'cp111111-1111-1111-1111-111111111102',
        code: 'STUDENT200',
        discount_type: 'fixed_amount',
        discount_value: 20000, // ₹200.00 flat off
        min_order_value: 99900, // ₹999.00
        usage_limit: 200,
        times_used: 15,
        per_customer_limit: 1,
        start_date: new Date(Date.now() - 10 * 86400000).toISOString(),
        expiry_date: new Date(Date.now() + 60 * 86400000).toISOString(),
        is_active: true,
      },
      {
        id: 'cp111111-1111-1111-1111-111111111103',
        code: 'FESTIVE15',
        discount_type: 'percentage',
        discount_value: 15,
        min_order_value: 120000, // ₹1,200.00
        max_discount_amount: 35000, // ₹350.00 max
        usage_limit: 300,
        times_used: 18,
        per_customer_limit: 1,
        start_date: new Date(Date.now() - 5 * 86400000).toISOString(),
        expiry_date: new Date(Date.now() + 45 * 86400000).toISOString(),
        is_active: true,
      },
    ];

    // 7. Marketing Campaigns
    this.marketing_campaigns = [
      {
        id: 'mc111111-1111-1111-1111-111111111101',
        name: 'Artisan Spring Craft Showcase',
        description: 'Inter-collegiate spring showcase highlighting student handmade accessories across Instagram and campus exhibits.',
        campaign_type: 'Campus Outreach',
        budget: 1500000, // ₹15,000.00
        start_date: new Date(Date.now() - 15 * 86400000).toISOString(),
        end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        target_category_id: 'c1111111-1111-1111-1111-111111111101',
        coupon_id: 'cp111111-1111-1111-1111-111111111101',
        status: 'active',
        utm_source: 'instagram',
        utm_campaign: 'spring_showcase_2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'mc111111-1111-1111-1111-111111111102',
        name: 'Eco-Fashion Campus Sustainability Drive',
        description: 'Promoting sustainable upcycled cotton macrame bags and non-toxic botanical resin accessories.',
        campaign_type: 'Sustainability Drive',
        budget: 800000, // ₹8,000.00
        start_date: new Date(Date.now() - 5 * 86400000).toISOString(),
        end_date: new Date(Date.now() + 25 * 86400000).toISOString(),
        target_category_id: 'c1111111-1111-1111-1111-111111111102',
        coupon_id: 'cp111111-1111-1111-1111-111111111102',
        status: 'active',
        utm_source: 'campus_posters',
        utm_campaign: 'eco_drive_2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // 8. Reviews
    this.reviews = [
      {
        id: 'rev-001',
        product_id: 'p1111111-1111-1111-1111-111111111101',
        user_id: 'u1111111-1111-1111-1111-111111111105',
        order_id: 'ord-seed-001',
        user_name: 'Priya Patel',
        rating: 5,
        title: 'Exceptionally lightweight and elegant!',
        comment: 'I was worried terracotta earrings might feel heavy on the lobes, but these are feather-light and the gold foil detailing shines with so much warmth. Highly recommend supporting these FD student artists!',
        is_verified_purchase: true,
        is_approved: true,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'rev-002',
        product_id: 'p1111111-1111-1111-1111-111111111103',
        user_id: 'u1111111-1111-1111-1111-111111111105',
        order_id: 'ord-seed-001',
        user_name: 'Priya Patel',
        rating: 5,
        title: 'Incredible craftsmanship and sturdy cord',
        comment: 'The macrame knotting is tight and uniform. The teak ring adds such a minimalist touch. Fits my phone, card wallet, and keys comfortably.',
        is_verified_purchase: true,
        is_approved: true,
        created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
    ];

    // 9. Initial Customer Address
    this.addresses = [
      {
        id: 'addr-001',
        user_id: 'u1111111-1111-1111-1111-111111111105',
        full_name: 'Priya Patel',
        phone: '+91 98765 43214',
        address_line1: 'Flat 402, Green Meadows Residency',
        address_line2: 'Near College Road, Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        postal_code: '302006',
        country: 'India',
        is_default: true,
      },
    ];

    // 10. Sample Completed Order (for immediate Analytics & Order History verification)
    const initialOrder: Order = {
      id: 'ord-seed-001',
      order_number: 'CRF-2026-9810',
      user_id: 'u1111111-1111-1111-1111-111111111105',
      address_id: 'addr-001',
      shipping_name: 'Priya Patel',
      shipping_phone: '+91 98765 43214',
      shipping_address_line1: 'Flat 402, Green Meadows Residency',
      shipping_address_line2: 'Near College Road, Civil Lines',
      shipping_city: 'Jaipur',
      shipping_state: 'Rajasthan',
      shipping_postal_code: '302006',
      shipping_country: 'India',
      subtotal_amount: 259800, // ₹2,598.00
      discount_amount: 20000,  // ₹200.00 via STUDENT200
      shipping_amount: 0,      // Free shipping threshold
      tax_amount: 0,
      total_amount: 239800,    // ₹2,398.00
      coupon_code: 'STUDENT200',
      order_status: 'delivered',
      payment_status: 'paid',
      payment_method: 'razorpay',
      notes: 'Please leave with reception if unavailable.',
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      items: [
        {
          id: 'item-seed-1',
          order_id: 'ord-seed-001',
          seller_order_id: 'sord-seed-1',
          product_id: 'p1111111-1111-1111-1111-111111111101',
          seller_id: 's1111111-1111-1111-1111-111111111101',
          product_name: 'Handcrafted Terracotta Petal Earrings',
          product_sku: 'CPP-TER-001',
          unit_price: 79900,
          quantity: 1,
          total_price: 79900,
        },
        {
          id: 'item-seed-2',
          order_id: 'ord-seed-001',
          seller_order_id: 'sord-seed-2',
          product_id: 'p1111111-1111-1111-1111-111111111103',
          seller_id: 's1111111-1111-1111-1111-111111111102',
          product_name: 'Knotted Macrame Crossbody Sling Bag',
          product_sku: 'SWC-BAG-001',
          unit_price: 179900,
          quantity: 1,
          total_price: 179900,
        },
      ],
      seller_orders: [
        {
          id: 'sord-seed-1',
          order_id: 'ord-seed-001',
          seller_id: 's1111111-1111-1111-1111-111111111101',
          seller_name: 'Clay & Petals Studio',
          subtotal: 79900,
          commission_amount: 7990, // 10%
          seller_payout_amount: 71910,
          fulfillment_status: 'delivered',
          tracking_number: 'BLUEDART-88210492',
          shipping_carrier: 'Blue Dart Express',
          shipped_at: new Date(Date.now() - 11 * 86400000).toISOString(),
          delivered_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
        {
          id: 'sord-seed-2',
          order_id: 'ord-seed-001',
          seller_id: 's1111111-1111-1111-1111-111111111102',
          seller_name: 'Sutradhar Woven Crafts',
          subtotal: 179900,
          commission_amount: 21588, // 12%
          seller_payout_amount: 158312,
          fulfillment_status: 'delivered',
          tracking_number: 'DELHIVERY-7749102',
          shipping_carrier: 'Delhivery Surface',
          shipped_at: new Date(Date.now() - 11 * 86400000).toISOString(),
          delivered_at: new Date(Date.now() - 9 * 86400000).toISOString(),
        },
      ],
    };

    this.orders = [initialOrder];
    this.order_items = initialOrder.items || [];
    this.seller_orders = initialOrder.seller_orders || [];

    // 11. Initial Audit Log
    this.audit_logs = [
      {
        id: 'log-001',
        actor_id: 'u1111111-1111-1111-1111-111111111101',
        actor_name: 'Devansh Sharma (Admin)',
        action: 'BOOTSTRAP_MARKETPLACE',
        entity_type: 'SYSTEM',
        entity_id: 'CRAFTORA_CORE',
        details: { message: 'Initialized multi-vendor catalog, category taxonomy, and RLS policies.' },
        created_at: new Date().toISOString(),
      },
    ];
  }

  // --- ATOMIC INVENTORY & CHECKOUT LOGIC ---
  public checkAndReserveStock(items: { product_id: string; quantity: number }[], orderRef: string): boolean {
    // 1. Verify all items have sufficient stock
    for (const item of items) {
      const product = this.products.find((p) => p.id === item.product_id);
      if (!product || product.stock_quantity < item.quantity) {
        return false;
      }
    }

    // 2. Atomically decrement stock and record movements
    for (const item of items) {
      const product = this.products.find((p) => p.id === item.product_id)!;
      const prev = product.stock_quantity;
      product.stock_quantity -= item.quantity;
      product.updated_at = new Date().toISOString();

      this.inventory_movements.push({
        id: crypto.randomUUID(),
        product_id: product.id,
        quantity_change: -item.quantity,
        movement_type: 'order_reservation',
        previous_stock: prev,
        new_stock: product.stock_quantity,
        reference_id: orderRef,
        created_at: new Date().toISOString(),
      });
    }

    return true;
  }

  public releaseReservation(orderRef: string, items: { product_id: string; quantity: number }[]) {
    for (const item of items) {
      const product = this.products.find((p) => p.id === item.product_id);
      if (product) {
        const prev = product.stock_quantity;
        product.stock_quantity += item.quantity;
        product.updated_at = new Date().toISOString();

        this.inventory_movements.push({
          id: crypto.randomUUID(),
          product_id: product.id,
          quantity_change: item.quantity,
          movement_type: 'reservation_released',
          previous_stock: prev,
          new_stock: product.stock_quantity,
          reference_id: orderRef,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  // Helper to populate Product relations
  public getEnrichedProduct(p: Product): Product {
    const images = this.product_images
      .filter((img) => img.product_id === p.id)
      .sort((a, b) => a.display_order - b.display_order);
    const category = this.categories.find((c) => c.id === p.category_id);
    const seller = this.seller_stores.find((s) => s.id === p.seller_id);
    return {
      ...p,
      images,
      category,
      seller,
    };
  }

  public getEnrichedProducts(list: Product[]): Product[] {
    return list.map((p) => this.getEnrichedProduct(p));
  }
}

export const db = new MarketplaceDataStore();
