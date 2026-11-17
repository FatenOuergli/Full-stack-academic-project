// Demo data for a traditional Tunisian pâtisserie. Prices are in millimes (TND x 1000).

export const categories = [
  { name: 'Baklawa & fruits secs', description: 'Feuilletés et pâtes d’amandes, pistaches et noisettes, la fierté des grandes occasions.' },
  { name: 'Gâteaux secs', description: 'Ghraiba, kaak et biscuits de la maison, pour le café et les visites.' },
  { name: 'Douceurs au miel', description: 'Makroudh, zlabia, mkharek et yo-yo, frits ou dorés puis trempés dans le miel.' },
  { name: 'Plateaux de fête', description: 'Assortiments prêts à offrir pour les mariages, l’Aïd et le Mouled.' },
];

const NUTS = ['fruits à coque'];
const GLUTEN = ['gluten'];

// category is the index in `categories` above.
export const products = [
  { category: 0, name: 'Baklawa aux pistaches', unit: 'kg', priceMillimes: 89000, stock: 20, occasions: ['aid', 'wedding'],
    description: 'Feuilles fines, pistaches d’Iran et sirop parfumé à l’eau de fleur d’oranger.',
    ingredients: ['pâte filo', 'pistaches', 'beurre', 'sucre', 'eau de fleur d’oranger'], allergens: [...GLUTEN, ...NUTS, 'lait'] },
  { category: 0, name: 'Baklawa aux amandes', unit: 'kg', priceMillimes: 65000, stock: 25, occasions: ['aid', 'wedding'],
    description: 'La baklawa tunisienne classique aux amandes et au sirop de miel.',
    ingredients: ['pâte filo', 'amandes', 'beurre', 'sucre', 'miel'], allergens: [...GLUTEN, ...NUTS, 'lait'] },
  { category: 0, name: 'Samsa aux amandes', unit: 'kg', priceMillimes: 48000, stock: 18, occasions: ['ramadan', 'aid'],
    description: 'Triangles croustillants farcis d’amandes et de sésame grillé.',
    ingredients: ['feuilles de malsouka', 'amandes', 'sésame', 'sucre', 'eau de géranium'], allergens: [...GLUTEN, ...NUTS, 'sésame'] },
  { category: 0, name: 'Bjaouia', unit: 'kg', priceMillimes: 72000, stock: 12, occasions: ['wedding'],
    description: 'Spécialité de Béja : pâte de fruits secs et sésame, enrobée de sucre glace.',
    ingredients: ['amandes', 'noisettes', 'pistaches', 'sésame', 'sucre'], allergens: [...NUTS, 'sésame'] },
  { category: 0, name: 'Mlabes', unit: 'box', weightGrams: 500, priceMillimes: 32000, stock: 15, occasions: ['wedding'],
    description: 'Pâte d’amande enrobée d’un glaçage blanc, décorée à la main.',
    ingredients: ['amandes', 'sucre', 'eau de fleur d’oranger'], allergens: NUTS },
  { category: 0, name: 'Kaak warka', unit: 'box', weightGrams: 500, priceMillimes: 34000, stock: 15, occasions: ['aid', 'wedding'],
    description: 'Couronnes fines de pâte fourrées à la pâte d’amande, recette de Zaghouan.',
    ingredients: ['farine', 'beurre', 'amandes', 'sucre', 'eau de fleur d’oranger'], allergens: [...GLUTEN, ...NUTS, 'lait'] },

  { category: 1, name: 'Ghraiba homs', unit: 'kg', priceMillimes: 32000, stock: 22, occasions: ['aid'],
    description: 'Ghraiba fondante à la farine de pois chiches grillés.',
    ingredients: ['farine de pois chiches', 'beurre', 'sucre glace'], allergens: ['lait'] },
  { category: 1, name: 'Ghraiba droô', unit: 'kg', priceMillimes: 30000, stock: 20, occasions: ['aid'],
    description: 'Ghraiba au sorgho, sablée et parfumée.',
    ingredients: ['farine de sorgho', 'beurre', 'sucre glace'], allergens: ['lait'] },
  { category: 1, name: 'Ghraiba aux amandes', unit: 'kg', priceMillimes: 45000, stock: 16, occasions: ['aid', 'wedding'],
    description: 'Petits dômes moelleux aux amandes et au zeste de citron.',
    ingredients: ['amandes', 'sucre', 'œufs', 'citron'], allergens: [...NUTS, 'œufs'] },
  { category: 1, name: 'Kaak anbar', unit: 'kg', priceMillimes: 38000, stock: 14, occasions: ['aid'],
    description: 'Couronnes à l’ambre et au sésame, tendres et parfumées.',
    ingredients: ['farine', 'beurre', 'sésame', 'sucre', 'ambre'], allergens: [...GLUTEN, 'sésame', 'lait'] },
  { category: 1, name: 'Sablés à la confiture', unit: 'kg', priceMillimes: 28000, stock: 25, occasions: [],
    description: 'Sablés au beurre garnis de confiture d’abricot.',
    ingredients: ['farine', 'beurre', 'sucre', 'œufs', 'confiture d’abricot'], allergens: [...GLUTEN, 'œufs', 'lait'] },
  { category: 1, name: 'Bachkoutou', unit: 'kg', priceMillimes: 24000, stock: 30, occasions: [],
    description: 'Biscuits secs aux amandes, parfaits avec le thé à la menthe.',
    ingredients: ['farine', 'amandes', 'œufs', 'sucre'], allergens: [...GLUTEN, ...NUTS, 'œufs'] },

  { category: 2, name: 'Makroudh aux dattes', unit: 'kg', priceMillimes: 26000, stock: 30, occasions: ['ramadan', 'aid'],
    description: 'Losanges de semoule fourrés à la pâte de dattes, à la façon de Kairouan.',
    ingredients: ['semoule', 'dattes', 'huile d’olive', 'miel'], allergens: GLUTEN },
  { category: 2, name: 'Zlabia', unit: 'kg', priceMillimes: 14000, stock: 0, occasions: ['ramadan'], isActive: false,
    description: 'Spirales croustillantes trempées dans le sirop, préparées pendant le Ramadan.',
    ingredients: ['farine', 'levure', 'sucre', 'eau de fleur d’oranger'], allergens: GLUTEN },
  { category: 2, name: 'Mkharek', unit: 'kg', priceMillimes: 14000, stock: 0, occasions: ['ramadan'], isActive: false,
    description: 'Bâtonnets frits au miel et au sésame, star des soirées de Ramadan.',
    ingredients: ['farine', 'miel', 'sésame'], allergens: [...GLUTEN, 'sésame'] },
  { category: 2, name: 'Yo-yo', unit: 'piece', priceMillimes: 1200, stock: 80, occasions: [],
    description: 'Beignet tunisien à l’orange, trempé dans le miel.',
    ingredients: ['farine', 'œufs', 'orange', 'miel'], allergens: [...GLUTEN, 'œufs'] },
  { category: 2, name: 'Debla', unit: 'kg', priceMillimes: 28000, stock: 12, occasions: ['wedding'],
    description: 'Rubans de pâte frits roulés en roses, nappés de miel et de pistaches.',
    ingredients: ['farine', 'œufs', 'miel', 'pistaches'], allergens: [...GLUTEN, 'œufs', ...NUTS] },

  { category: 3, name: 'Plateau de mariage assorti', unit: 'box', weightGrams: 1500, priceMillimes: 145000, stock: 8, occasions: ['wedding'],
    description: 'Baklawa, kaak warka, mlabes, bjaouia et ghraiba, dressés sur plateau.',
    ingredients: ['assortiment'], allergens: [...GLUTEN, ...NUTS, 'sésame', 'lait', 'œufs'] },
  { category: 3, name: 'Boîte de l’Aïd', unit: 'box', weightGrams: 1000, priceMillimes: 85000, stock: 10, occasions: ['aid'],
    description: 'Assortiment de baklawa, samsa, ghraiba et makroudh pour recevoir à l’Aïd.',
    ingredients: ['assortiment'], allergens: [...GLUTEN, ...NUTS, 'sésame', 'lait'] },
  { category: 3, name: 'Coffret assida zgougou', unit: 'box', weightGrams: 900, priceMillimes: 42000, stock: 6, occasions: ['mouled'],
    description: 'Six coupes de crème de pin d’Alep, crème pâtissière et fruits secs, pour le Mouled.',
    ingredients: ['graines de pin d’Alep', 'lait', 'œufs', 'amandes', 'pistaches'], allergens: [...NUTS, 'lait', 'œufs'] },
];

export const customers = [
  { email: 'amira.bensalah@example.tn', password: 'Client2026', firstName: 'Amira', lastName: 'Ben Salah', phone: '+21622123456',
    addresses: [{ label: 'Maison', street: '12 rue Habib Bourguiba', city: 'La Marsa', governorate: 'Tunis', postalCode: '2070', isDefault: true }] },
  { email: 'youssef.trabelsi@example.tn', password: 'Client2026', firstName: 'Youssef', lastName: 'Trabelsi', phone: '+21655987654',
    addresses: [{ label: 'Maison', street: '45 avenue Majida Boulila', city: 'Sfax', governorate: 'Sfax', postalCode: '3000', isDefault: true }] },
];

// items reference products by name; customer is the index in `customers`, or a guest email.
export const orders = [
  { customer: 0, status: 'delivered', paymentStatus: 'paid',
    items: [{ product: 'Baklawa aux pistaches', quantity: 1 }, { product: 'Kaak warka', quantity: 2 }] },
  { customer: 1, status: 'preparing', paymentStatus: 'paid',
    items: [{ product: 'Makroudh aux dattes', quantity: 2 }, { product: 'Ghraiba homs', quantity: 1 }] },
  { guestEmail: 'salma.guest@example.tn', status: 'pending', paymentStatus: 'unpaid',
    guestAddress: { fullName: 'Salma Gharbi', phone: '+21698765432', street: '3 rue de Marseille', city: 'Sousse', governorate: 'Sousse', postalCode: '4000' },
    items: [{ product: 'Plateau de mariage assorti', quantity: 1 }] },
];
