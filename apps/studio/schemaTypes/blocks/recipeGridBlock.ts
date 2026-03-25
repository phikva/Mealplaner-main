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
