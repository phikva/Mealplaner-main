import {defineField, defineType} from 'sanity'

export const heroBlockSchema = defineType({
  name: 'heroBlock',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Undertekst (WYSIWYG)',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'useCta',
      title: 'Bruk CTA',
      type: 'boolean',
      initialValue: false,
      description: 'Slå på for å vise CTA-knapper i hero.',
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
    defineField({
      name: 'mediaType',
      title: 'Medietype',
      type: 'string',
      initialValue: 'image',
      options: {
        list: [
          {title: 'Bilde', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
      },
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Hero-bilde',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}) => parent?.mediaType !== 'image',
      validation: rule =>
        rule.custom((value, context) => {
          if (context.parent?.mediaType === 'image' && !value) {
            return 'Legg til bilde når medietype er Bilde'
          }
          return true
        }),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      hidden: ({parent}) => parent?.mediaType !== 'video',
      validation: rule =>
        rule.custom((value, context) => {
          if (context.parent?.mediaType === 'video' && !value) {
            return 'Legg til video URL når medietype er Video'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      mediaType: 'mediaType',
      media: 'image',
    },
    prepare({title, mediaType, media}) {
      return {
        title: 'Hero',
        subtitle: `${title || 'Uten tittel'} · ${mediaType === 'video' ? 'Video' : 'Bilde'}`,
        media,
      }
    },
  },
})
