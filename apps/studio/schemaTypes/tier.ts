import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'

export default defineType({
  name: 'tier',
  title: 'Abonnement',
  type: 'document',
  icon: TagIcon,
  groups: [
    { name: 'general', title: 'Generelt', default: true },
    { name: 'pricing', title: 'Pris og standard' },
    { name: 'access', title: 'Tilgangsregler' },
    { name: 'features', title: 'Funksjoner' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Navn',
      type: 'string',
      group: 'general',
      description: 'Navn på abonnementet (f.eks. Basis, Premium, Pro)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'general',
      description: 'Unik identifikator for abonnementet (f.eks. basis, premium, pro)',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Beskrivelse',
      type: 'text',
      group: 'general',
      description: 'Kort beskrivelse av abonnementet og dets fordeler',
    }),
    defineField({
      name: 'price',
      title: 'Pris',
      type: 'number',
      group: 'pricing',
      description: 'Månedlig pris i NOK',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'features',
      title: 'Funksjoner',
      type: 'array',
      group: 'features',
      of: [{ type: 'string' }],
      description: 'Liste over funksjoner som er inkludert i abonnementet',
    }),
    defineField({
      name: 'isDefault',
      title: 'Standard abonnement',
      type: 'boolean',
      group: 'pricing',
      description: 'Sett til true hvis dette er standardabonnementet for nye brukere',
      initialValue: false,
    }),
    defineField({
      name: 'recipeAccess',
      title: 'Oppskrifts-tilgang',
      type: 'object',
      group: 'access',
      fields: [
        defineField({
          name: 'accessType',
          title: 'Tilgangstype',
          type: 'string',
          options: {
            list: [
              { title: 'Begrenset', value: 'limited' },
              { title: 'Full', value: 'full' },
            ],
          },
          description: 'Angir om nivået har begrenset eller full tilgang til oppskriftsdatabasen',
        }),
        defineField({
          name: 'maxRecipes',
          title: 'Maks antall tilgjengelige oppskrifter',
          type: 'number',
          description: 'Maksimalt antall tilgjengelige oppskrifter for nivåer med begrenset tilgang',
          hidden: ({ parent }) => parent?.accessType === 'full',
        }),
      ],
    }),
    defineField({
      name: 'mealStorage',
      title: 'Lagring av måltider',
      type: 'object',
      group: 'access',
      fields: [
        defineField({
          name: 'storageDuration',
          title: 'Lagringsvarighet (dager)',
          type: 'string',
          description: 'Antall dager lagrede måltider kan beholdes (eller "uendelig" for full tilgang)',
          options: {
            list: [
              { title: '7 dager', value: '7' },
              { title: '30 dager', value: '30' },
              { title: 'Uendelig', value: 'uendelig' },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'favoriteRecipes',
      title: 'Favorittoppskrifter',
      type: 'object',
      group: 'features',
      fields: [
        defineField({
          name: 'canFavorite',
          title: 'Kan lagre oppskrifter som favoritter',
          type: 'boolean',
          description: 'Tillater brukere å lagre oppskrifter som favoritter',
        }),
        defineField({
          name: 'maxFavorites',
          title: 'Maks antall favoritter',
          type: 'string',
          description: 'Maksimalt antall oppskrifter som kan lagres som favoritter (eller "uendelig" for full tilgang)',
          options: {
            list: [
              { title: '5 favoritter', value: '5' },
              { title: '20 favoritter', value: '20' },
              { title: '50 favoritter', value: '50' },
              { title: 'Uendelig', value: 'uendelig' },
            ],
          },
          hidden: ({ parent }) => !parent?.canFavorite,
        }),
      ],
    }),
    defineField({
      name: 'expertMealPlanning',
      title: 'Ekspert måltidsplanlegging',
      type: 'boolean',
      group: 'features',
      description: 'Tilgang til ukentlige måltidsplaner fra en ekspert',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'price',
      isDefault: 'isDefault',
    },
    prepare(selection) {
      const { title, subtitle, isDefault } = selection
      return {
        title,
        subtitle: `${subtitle} NOK/mnd ${isDefault ? '(Standard)' : ''}`,
      }
    },
  },
}) 