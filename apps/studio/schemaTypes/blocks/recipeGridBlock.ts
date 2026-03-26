import {defineField, defineType} from 'sanity'

export const recipeGridBlockSchema = defineType({
  name: 'recipeGridBlock',
  title: 'Recipe Grid',
  type: 'object',
  fields: [
    defineField({
      name: 'showTitle',
      title: 'Vis tittel',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'showDescription',
      title: 'Vis beskrivelse',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'description',
      title: 'Beskrivelse',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'kategori',
      title: 'Kategori',
      type: 'reference',
      to: [{type: 'kategori'}],
      description: 'Velg kategori som oppskrifter skal hentes fra.',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      initialValue: 'grid',
      options: {
        list: [
          {title: 'Grid (4 kolonner)', value: 'grid'},
          {title: 'Karusell', value: 'carousel'},
        ],
        layout: 'radio',
      },
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'maxItems',
      title: 'Maks antall oppskrifter',
      type: 'number',
      initialValue: 8,
      validation: rule => rule.required().min(1).max(24).integer(),
    }),
    defineField({
      name: 'useCta',
      title: 'Bruk CTA',
      type: 'boolean',
      initialValue: false,
      description: 'Slå på for å vise CTA-knapper i denne modulen.',
    }),
    defineField({
      name: 'ctaCount',
      title: 'Antall CTA',
      type: 'string',
      initialValue: 'one',
      options: {
        list: [
          {title: '1 CTA', value: 'one'},
          {title: '2 CTA', value: 'two'},
        ],
        layout: 'radio',
      },
      hidden: ({parent}) => !parent?.useCta,
      validation: rule =>
        rule.custom((value, context) => {
          if (context.parent?.useCta && !value) {
            return 'Velg antall CTA når "Bruk CTA" er aktiv.'
          }
          return true
        }),
    }),
    defineField({
      name: 'primaryCta',
      title: 'Primær CTA',
      type: 'object',
      hidden: ({parent}) => !parent?.useCta,
      fields: [
        defineField({
          name: 'label',
          title: 'Knappetekst',
          type: 'string',
        }),
        defineField({
          name: 'href',
          title: 'Lenke',
          type: 'string',
          description: 'Bruk intern path som /oppskrift eller full URL.',
        }),
      ],
      validation: rule =>
        rule.custom((value, context) => {
          if (!context.parent?.useCta) {
            return true
          }
          if (!value?.label || !value?.href) {
            return 'Primær CTA må ha både knappetekst og lenke.'
          }
          return true
        }),
    }),
    defineField({
      name: 'secondaryCta',
      title: 'Sekundær CTA',
      type: 'object',
      hidden: ({parent}) => !parent?.useCta || parent?.ctaCount !== 'two',
      fields: [
        defineField({
          name: 'label',
          title: 'Knappetekst',
          type: 'string',
        }),
        defineField({
          name: 'href',
          title: 'Lenke',
          type: 'string',
          description: 'Bruk intern path som /kontakt eller full URL.',
        }),
      ],
      validation: rule =>
        rule.custom((value, context) => {
          if (!context.parent?.useCta || context.parent?.ctaCount !== 'two') {
            return true
          }
          if (!value?.label || !value?.href) {
            return 'Sekundær CTA må ha både knappetekst og lenke når du bruker 2 CTA.'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      layout: 'layout',
    },
    prepare({title, layout}) {
      return {
        title: 'Recipe Grid',
        subtitle: `${title || 'Uten tittel'} · ${layout === 'carousel' ? 'Karusell' : 'Grid'}`,
      }
    },
  },
})
