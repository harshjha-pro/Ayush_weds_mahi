// All BFI business details live here. Edit this file to change what the app shows.
// Anything set to null or [] is hidden. Lines marked ⟶ TO ADD still need real details.

export const config = {
  brand: {
    short: 'BFI',
    name: 'BFI', // ⟶ TO ADD: full agency name, e.g. "BFI Wedding Invitations"
    tagline: 'Marwari wedding invitations, made with heart',
    taglineHindi: 'शुभ विवाह के निमंत्रण, परम्परा के संग',
    city: null, // ⟶ TO ADD: e.g. "Jaipur, Rajasthan"
  },

  contact: {
    whatsapp: null, // ⟶ TO ADD: digits only with country code, e.g. "919876543210"
    phone: null, // ⟶ TO ADD: e.g. "+91 98765 43210"
    email: null, // ⟶ TO ADD
    instagram: null, // ⟶ TO ADD: handle without @
    address: null, // ⟶ TO ADD
    hours: 'Mon–Sat · 10 am – 8 pm',
  },

  services: [
    {
      icon: 'scroll',
      title: 'Digital e-invites',
      text: 'Shareable card sets for every function, sized for WhatsApp and Instagram, in Hindi, English or both.',
    },
    {
      icon: 'film',
      title: 'Video invitations',
      text: 'Animated invites with music, family names and ceremony cards. Delivered as MP4 ready to forward.',
    },
    {
      icon: 'globe',
      title: 'Wedding websites',
      text: 'A personal invitation site with countdown, venue map, schedule, RSVP and your photos.',
    },
    {
      icon: 'card',
      title: 'Printed cards',
      text: 'Traditional kankotri and boxed invitations, with foil, laser cut and dry fruit box options.',
    },
    {
      icon: 'face',
      title: 'Caricature invites',
      text: 'Hand-drawn caricatures of the couple in Rajasthani attire for a playful, personal touch.',
    },
    {
      icon: 'calendar',
      title: 'Save the date',
      text: 'Teasers and save-the-date reels to send out before the main invitation.',
    },
  ],

  // Marwari wedding functions. Each one can get its own card in an invite set.
  ceremonies: [
    { name: 'Ganesh Sthapana', hindi: 'गणेश स्थापना', text: 'Lord Ganesh is invited first so that every ritual ahead goes smoothly.' },
    { name: 'Tilak', hindi: 'तिलक', text: 'The bride’s family visits the groom’s home and applies tilak to welcome him.' },
    { name: 'Mahira Dastoor', hindi: 'माहिरा दस्तूर', text: 'The maternal uncle’s family arrives with gifts, clothes and blessings.' },
    { name: 'Pithi Dastoor', hindi: 'पीठी दस्तूर', text: 'Haldi and sandalwood paste for the bride and groom, with songs from the women of the house.' },
    { name: 'Mehendi', hindi: 'मेहंदी', text: 'Henna, dholak and dancing, often the most colourful evening of the wedding.' },
    { name: 'Mayra / Bhaat', hindi: 'मायरा / भात', text: 'The mother’s brothers bring the bhaat for the family, a ritual of love and support.' },
    { name: 'Nikasi & Baraat', hindi: 'निकासी व बारात', text: 'The groom rides out on a ghodi with the baraat dancing to the venue.' },
    { name: 'Phere', hindi: 'फेरे', text: 'Seven rounds around the sacred fire and seven promises for a lifetime together.' },
    { name: 'Bidaai', hindi: 'विदाई', text: 'A tearful farewell as the bride leaves for her new home.' },
  ],

  steps: [
    { title: 'Tell us about the wedding', text: 'Share the names, functions, dates and the look you have in mind.' },
    { title: 'First design in 48 hours', text: 'We send a draft of the main card for you and the family to review.' },
    { title: 'Revisions on WhatsApp', text: 'Change wording, colours or photos until everyone is happy.' },
    { title: 'Final files delivered', text: 'You get every card, video and link ready to share, plus print files if needed.' },
  ],

  // price: null shows "On request".
  packages: [
    {
      name: 'Shagun',
      price: null, // ⟶ TO ADD
      features: ['Main invitation card', '2 function cards', 'Hindi or English text', '2 rounds of changes'],
    },
    {
      name: 'Utsav',
      price: null, // ⟶ TO ADD
      featured: true,
      features: ['Main card + up to 6 function cards', 'Animated video invite', 'Hindi and English versions', 'Unlimited small changes'],
    },
    {
      name: 'Rajwada',
      price: null, // ⟶ TO ADD
      features: ['Everything in Utsav', 'Personal wedding website with RSVP', 'Caricature artwork', 'Print-ready kankotri files'],
    },
  ],

  // Photos of real past work. Each item: { src: 'images/xyz.jpg', caption: '…' }.
  // While empty, the gallery shows sample designs made by the invite maker.
  portfolio: [],

  faqs: [
    { q: 'How early should we book?', a: 'Four to six weeks before the first function is comfortable. Rush orders are possible when our calendar allows.' },
    { q: 'Can you write the invitation text?', a: 'Yes. We can draft the wording in Hindi, English or Marwari, including family names and the Ganesh vandana.' },
    { q: 'Do you work with families outside Rajasthan?', a: 'Yes. Everything digital is done over WhatsApp and email, and printed cards can be couriered.' },
    { q: 'What do we need to send?', a: 'Names of the couple and parents, function dates, times and venues, and any photos you would like used.' },
  ],
};
