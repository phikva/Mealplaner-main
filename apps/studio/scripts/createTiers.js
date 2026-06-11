// Script to create subscription tiers in Sanity
// Run with: npx sanity exec scripts/createTiers.js --with-user-token

import { getCliClient } from 'sanity/cli';

const client = getCliClient();

const tiers = [
  {
    _type: 'tier',
    name: 'Trial',
    slug: { _type: 'slug', current: 'trial' },
    description: 'Kom i gang med måltidsplanlegging',
    price: 0,
    features: [
      'Tilgang til 20 oppskrifter',
      'Lagre opptil 5 favoritter',
      'Måltidsplan (7 dager)',
    ],
    isDefault: true,
    recipeAccess: {
      accessType: 'limited',
      maxRecipes: 20,
    },
    mealStorage: {
      storageDuration: '7',
    },
    favoriteRecipes: {
      canFavorite: true,
      maxFavorites: '5',
    },
    expertMealPlanning: false,
  },
  {
    _type: 'tier',
    name: 'Basis',
    slug: { _type: 'slug', current: 'basis' },
    description: 'For deg som vil ha mer fleksibilitet i måltidsplanleggingen',
    price: 49,
    features: [
      'Tilgang til 50 oppskrifter',
      'Lagre opptil 20 favoritter',
      'Måltidsplan (30 dager)',
      'Handleliste-funksjon',
    ],
    isDefault: false,
    recipeAccess: {
      accessType: 'limited',
      maxRecipes: 50,
    },
    mealStorage: {
      storageDuration: '30',
    },
    favoriteRecipes: {
      canFavorite: true,
      maxFavorites: '20',
    },
    expertMealPlanning: false,
  },
  {
    _type: 'tier',
    name: 'Premium',
    slug: { _type: 'slug', current: 'premium' },
    description: 'Full tilgang til alle funksjoner og oppskrifter',
    price: 99,
    features: [
      'Ubegrenset tilgang til alle oppskrifter',
      'Ubegrenset favoritter',
      'Ubegrenset måltidslagring',
      'Ekspert måltidsplaner',
      'Prioritert kundeservice',
      'Nye oppskrifter først',
    ],
    isDefault: false,
    recipeAccess: {
      accessType: 'full',
    },
    mealStorage: {
      storageDuration: 'uendelig',
    },
    favoriteRecipes: {
      canFavorite: true,
      maxFavorites: 'uendelig',
    },
    expertMealPlanning: true,
  },
];

async function createTiers() {
  console.log('Creating subscription tiers...');

  for (const tier of tiers) {
    try {
      const existing = await client.fetch(
        `*[_type == "tier" && slug.current == $slug][0]`,
        { slug: tier.slug.current }
      );

      if (existing) {
        console.log(`Tier "${tier.name}" already exists, updating...`);
        await client.patch(existing._id).set(tier).commit();
        console.log(`✓ Updated tier: ${tier.name}`);
      } else {
        const result = await client.create(tier);
        console.log(`✓ Created tier: ${tier.name} (${result._id})`);
      }
    } catch (error) {
      console.error(`✗ Error creating tier "${tier.name}":`, error.message);
    }
  }

  console.log('\nDone! Created/updated subscription tiers.');
}

createTiers();
