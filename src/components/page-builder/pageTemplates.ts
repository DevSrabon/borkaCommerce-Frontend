import { PageBlock } from '@/types/page-builder';

export interface PageTemplateInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  suggestedSlug: string;
  suggestedTitle: string;
  suggestedMetaDesc: string;
  blocks: PageBlock[];
}

export const PAGE_TEMPLATES: PageTemplateInfo[] = [
  // ─── 1. ABOUT US TEMPLATE ───────────────────────────────────────────────────
  {
    id: 'about-us',
    name: 'About Us (Haute Couture Heritage)',
    category: 'Brand & Story',
    description: 'Complete brand narrative with luxury hero banner, atelier story, craftsmanship metrics, core values, client testimonials, and FAQ.',
    badge: 'Popular',
    suggestedSlug: 'about-us',
    suggestedTitle: 'About Us | Saba Al Wadi Luxury Abayas Dubai',
    suggestedMetaDesc: 'Discover the heritage, atelier craftsmanship, and bespoke modest couture of Saba Al Wadi — based in Dubai, UAE.',
    blocks: [
      {
        id: 'about-hero',
        type: 'HERO',
        data: {
          badge: 'The House of Modesty & Prestige',
          title: 'Elegance Rooted in Grace, Modesty & Perfection',
          subtitle: 'Crafted for connoisseurs of timeless modest luxury. Every stitch celebrates Arabian heritage married with contemporary architectural silhouettes.',
          alignment: 'center',
          background_type: 'gradient',
          primary_button: { label: 'Explore Collections', url: '/catalog' },
          secondary_button: { label: 'Our Heritage', url: '#heritage' },
        },
      },
      {
        id: 'about-story',
        type: 'TWO_COLUMN',
        data: {
          heading: 'Our Craftsmanship & Heritage',
          subheading: 'DUBAI ATELIER — BESPOKE MODESTY',
          content: 'Saba Al Wadi was founded with an unyielding commitment to elevate modest attire into haute couture art. Working with master artisans in Dubai, we hand-source genuine Japanese crepe, pure Korean Nida, and French Chantilly lace to craft garments that empower women with grace, dignity, and confidence.',
          image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
          image_position: 'left',
          highlights: [
            '100% Breathable, lightweight Japanese & Korean textiles',
            'Hand-finished zardozi embroidery and Swarovski crystal accents',
            'Tailored flowing drape designed for supreme modesty',
            'Custom length alteration available for bespoke orders',
          ],
          cta_button: { label: 'View Abaya Collections', url: '/catalog' },
        },
      },
      {
        id: 'about-stats',
        type: 'STATS_COUNTER',
        data: {
          title: 'A Legacy of Excellence in Numbers',
          stats: [
            { number: '25,000+', label: 'Discerning Clients' },
            { number: '100%', label: 'Imported Premium Fabrics' },
            { number: '3', label: 'Dubai Showroom Suites' },
            { number: '4.9 / 5', label: 'Client Satisfaction Rating' },
          ],
        },
      },
      {
        id: 'about-values',
        type: 'FEATURES_GRID',
        data: {
          heading: 'The Four Pillars of Our Maison',
          subtitle: 'Guided by reverence for both faith and high fashion',
          columns: 4,
          items: [
            { icon: 'Sparkles', title: 'Master Tailoring', description: 'Architectural cuts that drape naturally without clinging.' },
            { icon: 'Shield', title: 'Pure Materials', description: 'Certified breathable Nida, matte silks, and Japanese crepes.' },
            { icon: 'Truck', title: 'Worldwide Express', description: 'Complimentary shipping across UAE & rapid global delivery.' },
            { icon: 'Award', title: 'Flawless Finish', description: 'Each piece undergoes a 12-point inspection before presentation.' },
          ],
        },
      },
      {
        id: 'about-testimonials',
        type: 'TESTIMONIALS',
        data: {
          title: 'Words from Our Privileged Patrons',
          subtitle: 'Read authentic experiences from women around the world',
          items: [
            {
              quote: 'The fabric quality of Saba Al Wadi abayas is unmatched. Even in the Dubai summer heat, the Japanese crepe remains cool and exquisitely structured.',
              author: 'Fatima Al Mansoori',
              role: 'Dubai, UAE',
              rating: 5,
            },
            {
              quote: 'Fast international delivery to London and the tailoring fit was absolutely divine. The packaging felt like opening a piece of high jewelry.',
              author: 'Amina Rahman',
              role: 'London, UK',
              rating: 5,
            },
            {
              quote: 'I ordered the Midnight Luxe cape abaya for Eid and received endless compliments. Truly the definition of understated luxury.',
              author: 'Maryam Qureshi',
              role: 'Abu Dhabi, UAE',
              rating: 5,
            },
          ],
        },
      },
      {
        id: 'about-faq',
        type: 'FAQ_ACCORDION',
        data: {
          title: 'Frequently Asked Questions',
          subtitle: 'Answers regarding our sizing, atelier processes, and fabric care',
          items: [
            {
              question: 'How do I choose the correct abaya size?',
              answer: 'Our sizes correspond to garment length in inches: Size 52 (Height 5\'0" - 5\'2"), Size 54 (Height 5\'3" - 5\'4"), Size 56 (Height 5\'5" - 5\'6"), Size 58 (Height 5\'7" - 5\'8"), and Size 60 (Height 5\'9"+).',
            },
            {
              question: 'What is the recommended fabric care?',
              answer: 'We recommend gentle dry cleaning or cold hand washing with mild detergent for silk and embellished abayas to preserve delicate embroidery.',
            },
            {
              question: 'Do you offer worldwide delivery?',
              answer: 'Yes! We ship globally via DHL Express and Aramex with tracking provided directly to your phone and email upon dispatch.',
            },
          ],
        },
      },
      {
        id: 'about-cta',
        type: 'CTA_BANNER',
        data: {
          title: 'Experience The Pinnacle of Modest Luxury',
          subtitle: 'Discover our newest seasonal collection crafted in our Dubai atelier.',
          button_text: 'Shop New Arrivals',
          button_link: '/catalog',
        },
      },
    ],
  },

  // ─── 2. CONTACT US TEMPLATE ─────────────────────────────────────────────────
  {
    id: 'contact-us',
    name: 'Contact Us (Boutique & Concierge)',
    category: 'Communication',
    description: 'Comprehensive contact page with 24/7 concierge banner, direct phone & WhatsApp cards, showroom suite locations, Google Maps, and inquiry FAQ.',
    badge: 'Essential',
    suggestedSlug: 'contact-us',
    suggestedTitle: 'Contact Us | Saba Al Wadi Boutique Dubai',
    suggestedMetaDesc: 'Connect with Saba Al Wadi luxury abaya concierge. Visit our Abu Hail showrooms in Deira-Dubai or contact via WhatsApp and phone.',
    blocks: [
      {
        id: 'contact-hero',
        type: 'HERO',
        data: {
          badge: '24/7 Dedicated Client Concierge',
          title: 'We Are Delighted to Assist You',
          subtitle: 'Have questions regarding bespoke sizing, tracking an existing order, or visiting our Dubai showrooms? Our atelier consultants are at your service.',
          alignment: 'center',
          background_type: 'gradient',
          primary_button: { label: 'Message on WhatsApp', url: 'https://wa.me/971557917409' },
          secondary_button: { label: 'Our Showroom Locations', url: '#locations' },
        },
      },
      {
        id: 'contact-channels',
        type: 'FEATURES_GRID',
        data: {
          heading: 'Direct Concierge Channels',
          subtitle: 'Choose your preferred method to reach our customer care specialists',
          columns: 3,
          items: [
            { icon: 'Phone', title: 'Telephone & WhatsApp', description: 'Tel: +971 55 642 4758\nMob: +971 55 79 17 409\nMob: +971 50 93 75 919' },
            { icon: 'Mail', title: 'Electronic Mail', description: 'General: contact@sabaalwadi.com\nOrders: concierge@sabaalwadi.com\nReplies within 4 business hours.' },
            { icon: 'Clock', title: 'Operating Hours', description: 'Saturday – Thursday: 09:00 AM – 11:00 PM\nFriday: 04:00 PM – 10:00 PM\n(Gulf Standard Time)' },
          ],
        },
      },
      {
        id: 'contact-map',
        type: 'MAP',
        data: {
          title: 'Saba Al Wadi Flagship Showrooms',
          subtitle: 'Visit us in person to experience our luxury textiles and bespoke fitting',
          map_url: 'https://maps.google.com/maps?q=Abu+Hail+Centre+Deira+Dubai&t=&z=15&ie=UTF8&iwloc=&output=embed',
          address: 'Suit No: M-49, M-104 & M-16, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail Street, Deira-Dubai, P.O Box: 67242, UAE',
          phone: '+971 55 642 4758 / +971 55 79 17 409',
          email: 'contact@sabaalwadi.com',
          hours: 'Sat-Thu: 09:00am - 11:00pm | Fri: 04:00pm - 10:00pm',
          map_height: 440,
          layout: 'split',
          show_card: true,
        },
      },
      {
        id: 'contact-faq',
        type: 'FAQ_ACCORDION',
        data: {
          title: 'Common Inquiries',
          subtitle: 'Quick answers before you reach out to our team',
          items: [
            {
              question: 'Can I visit without an appointment?',
              answer: 'Yes! Walk-in visitors are warmly welcomed at all our Abu Hail Centre suites during operating hours for ready-to-wear purchases and fittings.',
            },
            {
              question: 'How do I check the status of my order?',
              answer: 'You can track your order status in real time by logging into your profile or by providing your 4-digit order number to our WhatsApp concierge.',
            },
            {
              question: 'Do you offer cash on delivery (COD)?',
              answer: 'Yes, Cash on Delivery is gladly available across the entire United Arab Emirates.',
            },
          ],
        },
      },
      {
        id: 'contact-cta',
        type: 'CTA_BANNER',
        data: {
          title: 'Looking for a Custom Design or Bridal Order?',
          subtitle: 'Connect with our master designer to commission one-of-a-kind bespoke creations.',
          button_text: 'Chat on WhatsApp',
          button_link: 'https://wa.me/971557917409',
        },
      },
    ],
  },

  // ─── 3. PRIVACY POLICY TEMPLATE ─────────────────────────────────────────────
  {
    id: 'privacy-policy',
    name: 'Privacy Policy (Data Security & GDPR)',
    category: 'Legal & Compliance',
    description: 'Formatted luxury legal policy covering data collection, payment security (Stripe & 3D Secure), cookie disclosure, return terms, and client rights.',
    badge: 'Legal',
    suggestedSlug: 'privacy-policy',
    suggestedTitle: 'Privacy Policy | Saba Al Wadi Luxury Abayas',
    suggestedMetaDesc: 'Read the privacy policy of Saba Al Wadi. Learn how we safeguard your personal information, order data, and payment confidentiality.',
    blocks: [
      {
        id: 'privacy-hero',
        type: 'HERO',
        data: {
          badge: 'Security & Confidentiality',
          title: 'Privacy Policy & Data Protection',
          subtitle: 'Your privacy, financial security, and confidence are the foundation of our client relationship. Last updated: October 2026.',
          alignment: 'center',
          background_type: 'gradient',
          primary_button: { label: 'Contact Privacy Officer', url: 'mailto:privacy@sabaalwadi.com' },
          secondary_button: { label: 'Security Pillars', url: '#security' },
        },
      },
      {
        id: 'privacy-security-grid',
        type: 'FEATURES_GRID',
        data: {
          heading: 'Our Data Protection Commitments',
          subtitle: 'Bank-grade standards ensuring your personal information is never compromised',
          columns: 4,
          items: [
            { icon: 'Shield', title: '256-Bit SSL Encryption', description: 'All web traffic and checkout transactions are protected by high-grade TLS.' },
            { icon: 'Award', title: 'PCI-DSS Compliant', description: 'Credit card data is processed directly via Stripe with zero merchant storage.' },
            { icon: 'CheckCircle2', title: 'Cloudflare Turnstile', description: 'Non-intrusive bot mitigation keeping your account safe from unauthorized intrusion.' },
            { icon: 'Sparkles', title: 'Never Sold to Third Parties', description: 'Your email, phone, and delivery addresses are kept strictly confidential.' },
          ],
        },
      },
      {
        id: 'privacy-article',
        type: 'RICH_TEXT',
        data: {
          title: 'Detailed Privacy Disclosure',
          max_width: 'normal',
          html_content: `
            <h3>1. Introduction and Scope</h3>
            <p>Saba Al Wadi Abaya & Shaila L.L.C ("Saba Al Wadi", "we", "us", or "our") respects your privacy and is dedicated to safeguarding your personal data. This policy outlines how we collect, store, and process your information when you visit our website, purchase garments, or contact our atelier concierge.</p>

            <h3>2. Information We Collect</h3>
            <p>We may collect and process the following categories of information:</p>
            <ul>
              <li><strong>Identity & Contact Details:</strong> Full name, email address, telephone number, and physical shipping address.</li>
              <li><strong>Transaction Data:</strong> Details of orders placed, product variants selected, invoices, and payment confirmations.</li>
              <li><strong>Technical & Usage Data:</strong> IP address, device viewport, browser type, and interaction metrics to optimize performance.</li>
            </ul>

            <h3>3. How We Use Your Information</h3>
            <p>Your data is used strictly for legitimate business purposes:</p>
            <ul>
              <li>Fulfilling, packaging, and dispatching your orders to your doorstep.</li>
              <li>Sending automated SMS and email notifications regarding delivery status.</li>
              <li>Providing responsive customer care via WhatsApp or telephone.</li>
              <li>Preventing fraudulent transactions and mitigating bot activity.</li>
            </ul>

            <h3>4. Payment & Financial Security</h3>
            <p>We never store, see, or transmit raw credit card or debit card numbers on our servers. All digital payments are handled through Stripe Inc., a PCI-DSS Level 1 certified payment service provider. Cash on Delivery (COD) orders are verified prior to courier dispatch.</p>

            <h3>5. Cookies and Bot Mitigation</h3>
            <p>We use essential cookies for cart persistence, currency selection (AED base), and authentication sessions. We also employ Cloudflare Turnstile to protect checkout forms from automated spam without storing intrusive personal trackers.</p>

            <h3>6. Your Statutory Rights</h3>
            <p>Under applicable UAE Data Protection Law and international standards, you have the right to request access to your personal data, request corrections, or request deletion of your account. For any privacy requests, please contact our Data Protection Officer at <strong>privacy@sabaalwadi.com</strong>.</p>
          `,
        },
      },
      {
        id: 'privacy-cta',
        type: 'CTA_BANNER',
        data: {
          title: 'Questions Regarding Your Personal Data?',
          subtitle: 'Our legal and compliance team is readily available to answer any questions.',
          button_text: 'Email Privacy Concierge',
          button_link: 'mailto:contact@sabaalwadi.com',
        },
      },
    ],
  },

  // ─── 4. TERMS OF SERVICE TEMPLATE ───────────────────────────────────────────
  {
    id: 'terms-of-service',
    name: 'Terms of Service & Atelier Policies',
    category: 'Legal & Compliance',
    description: 'Complete legal terms covering order confirmation, exchange & return timelines, bespoke alterations, pricing in AED, and intellectual property.',
    badge: 'Legal',
    suggestedSlug: 'terms-and-conditions',
    suggestedTitle: 'Terms & Conditions | Saba Al Wadi Dubai',
    suggestedMetaDesc: 'Review the official terms of service, returns policy, and purchasing conditions for Saba Al Wadi Luxury Abayas.',
    blocks: [
      {
        id: 'terms-hero',
        type: 'HERO',
        data: {
          badge: 'Official Storefront Conditions',
          title: 'Terms & Conditions of Sale',
          subtitle: 'Please review our terms governing purchases, tailoring conditions, delivery, and exchange procedures.',
          alignment: 'center',
          background_type: 'gradient',
          primary_button: { label: 'Explore Storefront', url: '/catalog' },
          secondary_button: { label: 'Read Terms', url: '#terms' },
        },
      },
      {
        id: 'terms-article',
        type: 'RICH_TEXT',
        data: {
          title: 'Storefront & Atelier Terms',
          max_width: 'normal',
          html_content: `
            <h3>1. Agreement to Terms</h3>
            <p>By browsing, accessing, or placing an order through Saba Al Wadi (admin.sabaalwadi.com and affiliated domains), you agree to be bound by these Terms of Service and all applicable laws of the Emirate of Dubai and the United Arab Emirates.</p>

            <h3>2. Pricing, Currency & Orders</h3>
            <p>All prices are quoted in <strong>United Arab Emirates Dirham (AED)</strong> as the base currency. Any conversion to USD, GBP, or EUR is provided as an estimation based on live interbank exchange rates. We reserve the right to correct any pricing or typographical errors prior to order fulfillment.</p>

            <h3>3. Alterations and Bespoke Tailoring</h3>
            <p>Standard abayas are produced according to our published size chart (length 50 to 60 inches). Items customized with bespoke length, bust, or sleeve measurements upon client request are made specifically for the client and are non-refundable once cutting has commenced.</p>

            <h3>4. Delivery & Risk of Loss</h3>
            <p>Orders within the UAE are delivered within 1 to 3 business days via our courier partners. International delivery is handled via DHL Express within 3 to 7 business days. Risk of loss passes to the customer upon delivery to the specified address.</p>

            <h3>5. Exchanges & Returns</h3>
            <p>Unworn, unaltered ready-to-wear garments in original packaging with intact security tags may be exchanged within <strong>7 days</strong> of delivery. Return courier fees may apply unless the garment was received with a defect.</p>

            <h3>6. Intellectual Property</h3>
            <p>All original garment designs, photographs, monograms, trademarks, and text content remain the exclusive property of Saba Al Wadi Abaya & Shaila L.L.C.</p>
          `,
        },
      },
      {
        id: 'terms-cta',
        type: 'CTA_BANNER',
        data: {
          title: 'Ready to Experience Saba Al Wadi Haute Couture?',
          subtitle: 'Browse our latest bespoke arrivals crafted in Deira-Dubai.',
          button_text: 'Explore Catalog',
          button_link: '/catalog',
        },
      },
    ],
  },
];
