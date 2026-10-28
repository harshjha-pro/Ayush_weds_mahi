// Business constants and demo data. Prices, policies and SLAs live in
// settings so the admin can change them in-app.

export const STAGES = [
  { key: "consult", name: "Consultation", client: "We're getting to know your wedding.", need: "Share your dates, style and budget on a quick call." },
  { key: "scope", name: "Scope approved", client: "Your design, price and timeline are confirmed.", need: "Nothing right now — we'll ask for your details next." },
  { key: "collect", name: "Collecting details", client: "We're gathering names, photos and venue details.", need: "Fill in the details form and upload your photos and references." },
  { key: "build", name: "In design", client: "Your designer is crafting your invitation.", need: "Nothing — sit back. We'll share a preview soon." },
  { key: "review", name: "Client review", client: "Your preview is ready to view.", need: "Open the preview and send one consolidated set of changes, or approve it." },
  { key: "qa", name: "Quality check", client: "We're checking every name, date and link.", need: "Nothing — this takes about a day." },
  { key: "approve", name: "Final approval", client: "Ready to go live once you sign off.", need: "Clear any balance and give your final approval." },
  { key: "delivered", name: "Delivered", client: "Your invitation is live. Shubh vivah!", need: "Share your link, and tell us how we did." },
];

export const LEAD_STAGES = [
  { key: "new", name: "New enquiry" },
  { key: "contacted", name: "Contacted" },
  { key: "quoted", name: "Quoted" },
  { key: "converted", name: "Converted" },
  { key: "lost", name: "Lost" },
];

export const LOST_REASONS = ["Price too high", "Chose printed cards", "Went with a competitor", "No response", "Wedding cancelled / postponed", "Timeline too short", "Wanted DIY / free tool", "Other"];
export const SOURCES = ["Instagram", "Pinterest", "Google / SEO", "WhatsApp group", "Vendor referral", "Past client", "Walk-in / phone", "Other"];
export const PURPOSES = { couple: "Couple photos", family: "Family photos / names", venue: "Venue photos / details", inspiration: "Inspiration links", logo: "Logo / monogram", other: "Other" };
export const VENDOR_KINDS = ["Wedding planner", "Photographer", "Videographer", "Makeup artist", "Venue / banquet", "Content creator"];
export const OUTREACH_STAGES = [
  { key: "identified", name: "Identified" },
  { key: "pitched", name: "Invited" },
  { key: "talking", name: "In discussion" },
  { key: "trade", name: "Agreed · trade" },
  { key: "affiliate", name: "Agreed · affiliate" },
  { key: "declined", name: "Rejected" },
];
export const ROLES = {
  admin: { name: "Admin", desc: "Leads, projects, team, finance, compliance" },
  marketing: { name: "Marketing & outreach", desc: "Vendors, referrals, campaigns, SEO" },
  designer: { name: "Designer", desc: "My projects, references, previews, revisions" },
  qa: { name: "QA reviewer", desc: "Projects waiting for quality checks" },
  freelancer: { name: "Freelancer", desc: "Time-boxed access to assigned projects" },
  affiliate: { name: "Affiliate / vendor partner", desc: "Referral code, leads, commission" },
};

const DAY = 864e5;
const at = (days, hour = 11) => { const d = new Date(Date.now() + days * DAY); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
const day = (days) => at(days).slice(0, 10);

export function defaultSettings() {
  return {
    studio: "BFI — Marwari Invitations",
    whatsapp: "919800000000",
    email: "hello@bfi-invitations.in",
    upiId: "bfi.studio@upi",
    upiName: "BFI Marwari Invitations",
    gstin: "",
    address: "Jaipur, Rajasthan",
    tiers: {
      basic: { name: "Basic", price: 4999, revisions: 1, days: 5, desc: "Curated Marwari template, names/dates/venue/RSVP, one revision round" },
      premium: { name: "Premium", price: 11999, revisions: 2, days: 10, desc: "Personalized design, photos, event schedule, countdown, two revision rounds" },
      luxury: { name: "Luxury / Bespoke", price: 29999, revisions: 99, days: 21, desc: "Fully custom design, multiple event pages, storytelling, unlimited reasonable revisions" },
    },
    addons: [
      { id: "std", name: "Digital save-the-date", price: 1499 },
      { id: "event", name: "Extra function/event page", price: 999 },
      { id: "itin", name: "Digital wedding itinerary", price: 1999 },
      { id: "travel", name: "Guest info & travel guide", price: 2499 },
      { id: "thanks", name: "Digital thank-you page", price: 999 },
    ],
    commission: { basic: 10, premium: 12, luxury: 15 },
    rushFee: 25,
    hourlyCost: 600,
    hostingCost: 300,
    gatewayFee: 2,
    revisionCost: 900,
    slaDays: [2, 2, 4, 5, 3, 1, 2, 0],
    policy: {
      text: "Cancellation before design starts: 80% refund. After design starts: 40% refund. After the first preview: no refund. Late changes after final approval are charged as a new revision round. Rush orders (under half the standard turnaround) carry a rush fee.",
      refundPct: [100, 80, 80, 40, 0, 0, 0, 0],
    },
  };
}

export function seed({ empty = false } = {}) {
  const base = {
    settings: defaultSettings(),
    users: [], leads: [], projects: [], templates: [], library: [], payouts: [], commissions: [],
    vendors: [], campaigns: [], seo: [], ads: [], spend: [], traffic: [], msgTemplates: [], broadcasts: [],
    documents: [], audit: [], counters: { project: 1000, invoice: 0 },
  };
  if (empty) return base;

  base.users = [
    { id: "u_admin", name: "Studio Admin", role: "admin", email: "admin@bfi.in", phone: "919800000001", active: true, createdAt: at(-90) },
    { id: "u_mkt", name: "Riya Agarwal", role: "marketing", email: "riya@bfi.in", phone: "919800000002", active: true, createdAt: at(-80) },
    { id: "u_des1", name: "Kunal Jain", role: "designer", email: "kunal@bfi.in", phone: "919800000003", active: true, createdAt: at(-80) },
    { id: "u_des2", name: "Sneha Bansal", role: "designer", email: "sneha@bfi.in", phone: "919800000004", active: true, createdAt: at(-60) },
    { id: "u_qa", name: "Pooja Goenka", role: "qa", email: "pooja@bfi.in", phone: "919800000005", active: true, createdAt: at(-60) },
    { id: "u_fl", name: "Arjun Mehta (freelance)", role: "freelancer", email: "arjun@studio.in", phone: "919800000006", active: true, projectIds: ["p_1003"], accessUntil: day(20), createdAt: at(-10) },
    { id: "u_aff1", name: "Neha Daga · Shubh Events", role: "affiliate", partnerType: "affiliate", partnerKind: "Wedding planner", refCode: "SHUBH12", email: "neha@shubhevents.in", phone: "919800000007", active: true, commissionOverride: { premium: 14 }, payout: { upi: "nehadaga@okaxis", bank: "", pan: "" }, createdAt: at(-75) },
    { id: "u_aff2", name: "Lens & Vows Studio", role: "affiliate", partnerType: "affiliate", partnerKind: "Photographer", refCode: "LENSVOWS", email: "hello@lensvows.in", phone: "919800000008", active: true, payout: { upi: "", bank: "HDFC ••4421", pan: "" }, createdAt: at(-50) },
    { id: "u_aff3", name: "Glam by Tanvi", role: "affiliate", partnerType: "trade", partnerKind: "Makeup artist", refCode: "TANVI", email: "tanvi@glam.in", phone: "919800000009", active: true, tradeLimit: 3, payout: {}, createdAt: at(-20) },
  ];

  base.templates = [
    { id: "t1", name: "Royal Heritage", art: "royal-heritage", tier: "premium", tiers: ["premium", "luxury"], tags: ["haveli", "maroon", "classic"], status: "active", previewUrl: "" },
    { id: "t2", name: "Mandap Magic", art: "mandap-magic", tier: "premium", tiers: ["basic", "premium"], tags: ["ivory", "floral"], status: "active", previewUrl: "" },
    { id: "t3", name: "Golden Elegance", art: "golden-elegance", tier: "luxury", tiers: ["luxury"], tags: ["ornate", "gold"], status: "active", previewUrl: "" },
    { id: "t4", name: "Desert Dreams", art: "desert-dreams", tier: "basic", tiers: ["basic", "premium"], tags: ["sand", "minimal"], status: "active", previewUrl: "" },
    { id: "t5", name: "Marwari Classic", art: "marwari-classic", tier: "premium", tiers: ["basic", "premium", "luxury"], tags: ["red", "traditional"], status: "active", previewUrl: "" },
    { id: "t6", name: "Royal Palace", art: "royal-palace", tier: "luxury", tiers: ["luxury"], tags: ["black", "palace", "storytelling"], status: "active", previewUrl: "" },
  ];

  const L = (id, o) => ({ id, phone: "", email: "", notes: [], createdAt: at(-20), weddingDate: day(60), city: "Jaipur", refCode: "", affiliateId: null, ...o });
  base.leads = [
    L("l1", { name: "Ishita Maheshwari", phone: "919811100001", source: "Instagram", stage: "new", createdAt: at(-1), weddingDate: day(75), city: "Kolkata", interest: "premium" }),
    L("l2", { name: "Rohan Khandelwal", phone: "919811100002", source: "Vendor referral", refCode: "SHUBH12", affiliateId: "u_aff1", stage: "contacted", createdAt: at(-4), weddingDate: day(50), city: "Jaipur", interest: "luxury" }),
    L("l3", { name: "Priya Sethia", phone: "919811100003", source: "Google / SEO", stage: "quoted", createdAt: at(-9), weddingDate: day(40), city: "Mumbai", interest: "premium", quote: { tier: "premium", addons: ["std"], items: [], discount: 0, rush: false, total: 13498, at: at(-7) } }),
    L("l4", { name: "Ankit Somani", phone: "919811100004", source: "WhatsApp group", stage: "lost", lostReason: "Chose printed cards", createdAt: at(-30), city: "Surat" }),
    L("l5", { name: "Megha Rathi", phone: "919811100005", source: "Pinterest", stage: "lost", lostReason: "Price too high", createdAt: at(-25), city: "Delhi" }),
    L("l6", { name: "Kavya & Aditya", phone: "919811100006", source: "Vendor referral", refCode: "LENSVOWS", affiliateId: "u_aff2", stage: "new", createdAt: at(-2), weddingDate: day(90), city: "Udaipur", interest: "luxury" }),
    L("l8", { name: "Neha Soni", phone: "919811100008", source: "Past client", refCode: "ADITI001", stage: "new", createdAt: at(-5), weddingDate: day(110), city: "Jaipur", interest: "premium" }),
    L("l9", { name: "Kunal Jain", phone: "919811100009", source: "Instagram", stage: "lost", lostReason: "No response", createdAt: at(-14), city: "Pune" }),
    L("l10", { name: "Amit Agarwal", phone: "919811100010", source: "Google / SEO", stage: "converted", convertedAt: at(-5), createdAt: at(-8), city: "Mumbai" }),
    L("l7", { name: "Simran Bajaj", phone: "919811100007", source: "Vendor referral", refCode: "TANVI", affiliateId: "u_aff3", stage: "contacted", createdAt: at(-3), weddingDate: day(35), city: "Jodhpur", interest: "basic" }),
  ];

  const P = (o) => ({
    addons: [], items: [], discount: 0, rush: false, extraRevisions: 0, overrideNote: "", templateId: "t1",
    designerId: null, qaId: null, affiliateId: null, status: "active", city: "Jaipur",
    intake: { events: [] }, assets: [], previews: [], revisions: [], notes: [], messages: [], payments: [], invoices: [], refunds: [],
    handover: {}, qa: { status: "pending", notes: "", defects: 0 }, approval: null, delivery: null, review: null,
    consent: { photos: false, names: false, testimonial: false, showcase: false, at: null, method: "" },
    costs: { hours: 0, hosting: 0, other: 0 }, complaints: 0, testimonialRequest: null, ...o,
  });

  base.projects = [
    P({
      id: "p_1001", code: "BFI-1001", token: "q7m4xk2vthp9wce8nrb3da", leadId: null, clientName: "Aditi Kothari", brideName: "Aditi", groomName: "Varun",
      phone: "919822200001", email: "aditi@example.com", weddingDate: day(-12), city: "Jaipur", tier: "premium", addons: ["std"], price: 13498,
      templateId: "t2", designerId: "u_des1", qaId: "u_qa", affiliateId: "u_aff1", stage: 7, status: "delivered", stageSince: at(-30),
      createdAt: at(-62), dueDate: day(-40), deliveredAt: at(-41),
      intake: { brideName: "Aditi Kothari", groomName: "Varun Agarwal", brideParents: "Mr. & Mrs. Suresh Kothari", groomParents: "Mr. & Mrs. Manoj Agarwal", events: [{ name: "Mehendi", date: day(-14), time: "16:00", venue: "Kothari Haveli" }, { name: "Phera", date: day(-12), time: "20:00", venue: "Rambagh Palace" }], rsvpBy: day(-20), rsvpPhone: "919822200001", language: "English + Hindi", submittedAt: at(-55) },
      previews: [{ id: "pv1", url: "https://mahi-ayush.vercel.app/", note: "First preview", at: at(-50), by: "u_des1", round: 0 }],
      revisions: [{ id: "r1", round: 1, at: at(-48), summary: "Spelling and photo change", items: [{ text: "Change Nani's name to Smt. Kamla Devi", done: true }, { text: "Use the second couple photo on the cover", done: true }], status: "resolved" }],
      payments: [{ id: "pay1", at: at(-60), amount: 6749, method: "UPI", ref: "UPI-551" }, { id: "pay2", at: at(-42), amount: 6749, method: "UPI", ref: "UPI-902" }],
      invoices: [{ no: "BFI/2026/001", at: at(-42), amount: 13498 }], qa: { status: "pass", notes: "All good", defects: 1 },
      approval: { at: at(-42), name: "Aditi Kothari" }, delivery: { liveUrl: "https://mahi-ayush.vercel.app/", publishedAt: at(-41) },
      review: { rating: 5, text: "They understood every Marwari ritual we wanted — our families loved the invitation!", at: at(-38), consentPublic: true, approved: true },
      consent: { photos: true, names: true, testimonial: true, showcase: true, at: at(-38), method: "Client portal toggle" }, refCode: "ADITI001",
      costs: { hours: 9, hosting: 300, other: 0 }, testimonialRequest: { sentAt: at(-41), respondedAt: at(-38) },
      handover: { content: true, links: true, rsvp: true, mobile: true, privacy: true, spelling: true },
    }),
    P({
      id: "p_1002", code: "BFI-1002", token: "h3n8wd5prk2zmya7ftc4vb", clientName: "Nidhi Lohia", brideName: "Nidhi", groomName: "Sahil",
      phone: "919822200002", email: "nidhi@example.com", weddingDate: day(28), city: "Kolkata", tier: "luxury", addons: ["itin", "travel"], price: 34497,
      templateId: "t4", designerId: "u_des2", qaId: "u_qa", affiliateId: "u_aff2", stage: 4, stageSince: at(-2), createdAt: at(-20), dueDate: day(4),
      intake: { brideName: "Nidhi Lohia", groomName: "Sahil Poddar", brideParents: "Mr. & Mrs. Rajesh Lohia", groomParents: "Mr. & Mrs. Anil Poddar", events: [{ name: "Haldi", date: day(26), time: "10:00", venue: "Lohia Bari" }, { name: "Sangeet", date: day(27), time: "19:00", venue: "ITC Royal Bengal" }, { name: "Phera", date: day(28), time: "21:00", venue: "ITC Royal Bengal" }], rsvpBy: day(14), language: "English", submittedAt: at(-14) },
      previews: [{ id: "pv2", url: "https://mahi-ayush.vercel.app/", note: "Preview 1 — all event pages", at: at(-2), by: "u_des2", round: 0 }],
      payments: [{ id: "pay3", at: at(-19), amount: 17249, method: "Bank transfer", ref: "NEFT-118" }],
      invoices: [{ no: "BFI/2026/002", at: at(-19), amount: 34497 }],
      notes: [{ id: "n1", at: at(-3), byId: "u_des2", text: "Client wants gold foil effect on the cover — doable with CSS, no extra scope." }],
      messages: [
        { id: "m1", thread: "design", from: "u_des2", text: "Hi! We've updated the design with your feedback. Please take a look.", at: at(-2, 10) },
        { id: "m2", thread: "design", from: "client", text: "Looks great! Just one small change in the date font.", at: at(-2, 12) },
        { id: "m3", thread: "design", from: "u_des2", text: "Noted! Updating now.", at: at(-2, 13) },
        { id: "m4", thread: "admin", from: "u_admin", text: "Namaste Nidhi ji, your balance invoice is in the Payment section whenever you're ready.", at: at(-5, 16) },
      ],
      costs: { hours: 14, hosting: 300, other: 0 },
    }),
    P({
      id: "p_1003", code: "BFI-1003", token: "k9p2tf6xnd3wqh8mrc5yaz", clientName: "Riddhi Saraf", brideName: "Riddhi", groomName: "Karan",
      phone: "919822200003", email: "riddhi@example.com", weddingDate: day(18), city: "Jodhpur", tier: "basic", price: 4999, rush: true,
      templateId: "t3", designerId: "u_fl", qaId: "u_qa", stage: 3, stageSince: at(-7), createdAt: at(-12), dueDate: day(-1),
      intake: { brideName: "Riddhi Saraf", groomName: "Karan Mundra", events: [{ name: "Phera", date: day(18), time: "20:30", venue: "Umaid Bhawan" }], submittedAt: at(-9) },
      payments: [{ id: "pay4", at: at(-12), amount: 2500, method: "UPI", ref: "UPI-713" }],
      notes: [{ id: "n2", at: at(-2), byId: "u_fl", text: "Waiting on family names for the inside page." }],
      costs: { hours: 3, hosting: 300, other: 0 },
    }),
    P({
      id: "p_1004", code: "BFI-1004", token: "w4c8ry2hkm7nfp3xtd9qbe", clientName: "Tanya Jhunjhunwala", brideName: "Tanya", groomName: "Mohit",
      phone: "919822200004", email: "tanya@example.com", weddingDate: day(45), city: "Mumbai", tier: "premium", price: 11999,
      templateId: "t1", designerId: "u_des1", qaId: "u_qa", affiliateId: "u_aff1", stage: 2, stageSince: at(-3), createdAt: at(-5), dueDate: day(9),
      payments: [{ id: "pay5", at: at(-5), amount: 6000, method: "UPI", ref: "UPI-822" }],
    }),
    P({
      id: "p_1005", code: "BFI-1005", token: "z2b6mq9kdt4xhw7pnr3cfa", clientName: "Shruti Birla", brideName: "Shruti", groomName: "Yash",
      phone: "919822200005", email: "shruti@example.com", weddingDate: day(33), city: "Jaipur", tier: "premium", price: 11999, addons: ["thanks"],
      templateId: "t2", designerId: "u_des2", qaId: "u_qa", affiliateId: "u_aff3", stage: 5, stageSince: at(-1), createdAt: at(-16), dueDate: day(2),
      intake: { brideName: "Shruti Birla", groomName: "Yash Rungta", events: [{ name: "Phera", date: day(33), time: "20:00", venue: "Jai Mahal" }], submittedAt: at(-12) },
      previews: [{ id: "pv3", url: "https://mahi-ayush.vercel.app/", note: "Final preview", at: at(-4), by: "u_des2", round: 0 }],
      revisions: [{ id: "r2", round: 1, at: at(-6), summary: "Venue map + colours", items: [{ text: "Add Google Maps link for Jai Mahal", done: true }, { text: "Make the green a little softer", done: true }], status: "resolved" }],
      payments: [{ id: "pay6", at: at(-16), amount: 12998, method: "UPI", ref: "UPI-431" }],
      handover: { content: true, links: true, rsvp: true, mobile: true, privacy: true, spelling: true },
      costs: { hours: 8, hosting: 300, other: 0 },
    }),
  ];
  base.counters.project = 1005;
  base.counters.invoice = 2;
  base.projects[0].price = 13498;
  base.projects[4].price = 12998;

  base.commissions = [
    { id: "c1", partnerId: "u_aff1", projectId: "p_1001", amount: 1890, rate: 14, at: at(-41), status: "paid", payoutId: "po1" },
  ];
  base.payouts = [{ id: "po1", partnerId: "u_aff1", amount: 1890, at: at(-35), ref: "UPI-PAYOUT-77", entries: ["c1"] }];

  base.library = [
    { id: "a1", title: "Kothari wedding — cover reveal (before/after)", kind: "Before / after", source: "customer", projectId: "p_1001", status: "approved", url: "", at: at(-38) },
    { id: "a2", title: "Haveli Rang template — Reels clip", kind: "Reel clip", source: "stock", projectId: null, status: "approved", url: "", at: at(-30) },
    { id: "a3", title: "BFI one-pager for vendors (PDF)", kind: "One-pager", source: "stock", projectId: null, status: "approved", url: "", at: at(-30) },
    { id: "a4", title: "Lohia couple photo — cover draft", kind: "Before / after", source: "customer", projectId: "p_1002", status: "pending", url: "", at: at(-2) },
  ];

  base.vendors = [
    { id: "v1", name: "Shubh Events", contact: "Neha Daga", kind: "Wedding planner", city: "Jaipur", phone: "919800000007", handle: "@shubhevents", stage: "affiliate", terms: "14% on Premium, 10% Basic, 15% Luxury", nextFollowUp: day(10), partnerId: "u_aff1", notes: [], createdAt: at(-85) },
    { id: "v2", name: "Lens & Vows Studio", contact: "Rahul", kind: "Photographer", city: "Kolkata", phone: "919800000008", handle: "@lensandvows", stage: "affiliate", terms: "Standard commission", nextFollowUp: day(14), partnerId: "u_aff2", notes: [], createdAt: at(-70) },
    { id: "v3", name: "Glam by Tanvi", contact: "Tanvi", kind: "Makeup artist", city: "Jodhpur", phone: "919800000009", handle: "@glambytanvi", stage: "trade", terms: "Free Basic invite for next 3 clients, tag + intro", nextFollowUp: day(3), partnerId: "u_aff3", notes: [], createdAt: at(-25) },
    { id: "v4", name: "Rajwada Banquets", contact: "Mr. Bhandari", kind: "Venue / banquet", city: "Jaipur", phone: "919800000010", handle: "", stage: "pitched", terms: "Proposed 50% off next 3 clients", nextFollowUp: day(-1), notes: [{ at: at(-6), text: "Sent the one-pager on WhatsApp" }], createdAt: at(-8) },
    { id: "v5", name: "The Marwari Bride", contact: "Ananya", kind: "Content creator", city: "Mumbai", phone: "919800000011", handle: "@themarwaribride", stage: "talking", terms: "Free Premium invite for a collab Reel", nextFollowUp: day(1), notes: [], createdAt: at(-12) },
    { id: "v6", name: "Frames by Dev", contact: "Dev", kind: "Videographer", city: "Udaipur", phone: "919800000012", handle: "@framesbydev", stage: "identified", terms: "", nextFollowUp: day(2), notes: [], createdAt: at(-2) },
  ];

  base.campaigns = [
    { id: "cp1", title: "Reel: Kothari invitation reveal", kind: "social", channel: "Instagram", date: day(3), projectId: "p_1001", assetId: "a1", status: "scheduled", notes: "" },
    { id: "cp2", title: "Pinterest board: Royal Heritage", kind: "social", channel: "Pinterest", date: day(6), projectId: null, assetId: "a2", status: "in progress", notes: "" },
    { id: "cp3", title: "Vendor outreach — planners", kind: "vendor", channel: "Email", date: day(1), projectId: null, assetId: "a3", status: "scheduled", notes: "" },
    { id: "cp4", title: "Blog: real Marwari weddings", kind: "content", channel: "Website", date: day(9), projectId: null, assetId: null, status: "draft", notes: "" },
    { id: "cp5", title: "Newsletter: wedding season", kind: "email", channel: "Email", date: day(12), projectId: null, assetId: null, status: "scheduled", notes: "" },
  ];
  base.seo = [
    { id: "s1", title: "Marwari wedding invitation", url: "/marwari-wedding-invitation", keyword: "marwari wedding invitation", target: 10, position: 6, status: "live", visits: 420, leads: 6, updatedAt: at(-10) },
    { id: "s2", title: "Rajasthani wedding invite", url: "/rajasthani-wedding-invite", keyword: "rajasthani wedding invite", target: 10, position: 12, status: "live", visits: 180, leads: 2, updatedAt: at(-20) },
    { id: "s3", title: "Digital Marwari invite", url: "/digital-marwari-invite", keyword: "digital marwari invite", target: 20, position: 18, status: "live", visits: 90, leads: 1, updatedAt: at(-6) },
    { id: "s4", title: "Wedding invitation quotes", url: "/wedding-invitation-quotes", keyword: "marwari wedding invitation quotes", target: 20, position: 22, status: "draft", visits: 40, leads: 0, updatedAt: at(-2) },
  ];
  base.ads = [];
  base.spend = [
    { id: "sp1", month: day(-40).slice(0, 7), channel: "Instagram", amount: 2000, note: "Boosted Reel" },
    { id: "sp2", month: day(-10).slice(0, 7), channel: "Vendor referral", amount: 0, note: "Trade discounts counted in margin" },
  ];
  base.traffic = [
    { id: "tr1", month: day(-60).slice(0, 7), visitors: 310 },
    { id: "tr2", month: day(-30).slice(0, 7), visitors: 640 },
    { id: "tr3", month: day(0).slice(0, 7), visitors: 820 },
  ];
  base.msgTemplates = [
    { id: "m1", name: "Intake reminder", audience: "clients", body: "Namaste {{name}} 🙏 A gentle reminder to fill in your wedding details and upload photos so we can begin your invitation: {{link}}" },
    { id: "m2", name: "Preview ready", audience: "clients", body: "Hi {{name}}, your invitation preview is ready! View it and send your changes in one go here: {{link}}" },
    { id: "m3", name: "Revision request received", audience: "clients", body: "Thank you {{name}} — we've received your revision request ({{round}}). Your designer is on it." },
    { id: "m4", name: "Testimonial request", audience: "clients", body: "Shubh vivah, {{name}}! If you loved your invitation, we'd be grateful for a short review: {{link}}" },
    { id: "m5", name: "Partner monthly update", audience: "affiliates", body: "Hi {{name}}, your BFI referrals this month are updated in your partner app. Your code: {{code}}" },
  ];
  base.documents = [
    { id: "d1", title: "Terms of service v1", kind: "Terms of service", partyId: null, signedAt: at(-80), fileId: null, note: "Shown to every client before payment" },
    { id: "d2", title: "Affiliate agreement — Shubh Events", kind: "Affiliate agreement", partyId: "u_aff1", signedAt: at(-74), fileId: null, note: "" },
  ];
  base.audit = [{ id: "log0", at: at(-90), by: "System", action: "Created", entity: "Workspace", detail: "Demo data loaded" }];
  return base;
}
