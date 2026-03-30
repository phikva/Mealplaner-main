import {defineField, defineType} from 'sanity'

export const onboardingSectionBlockSchema = defineType({
  name: 'onboardingSection',
  title: 'Onboarding-seksjon',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Brødtekst (WYSIWYG)',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'image',
      title: 'Bilde',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'useCta',
      title: 'Bruk CTA',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'primaryCta',
      title: 'CTA',
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
          description: 'Intern path (f.eks. /kategori) eller full URL.',
        }),
      ],
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!context.parent?.useCta) {
            return true
          }
          if (!value?.label || !value?.href) {
            return 'CTA må ha både knappetekst og lenke når den er aktivert.'
          }
          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
    prepare({title, media}) {
      return {
        title: title || 'Uten tittel',
        subtitle: 'Onboarding-seksjon',
        media,
      }
    },
  },
})
