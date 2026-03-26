import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const siteSettingsSchema = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'general', title: 'Generelt', default: true},
    {name: 'links', title: 'Lenker'},
    {name: 'footer', title: 'Footer'},
    {name: 'seo', title: 'Global SEO'},
  ],
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site navn',
      type: 'string',
      group: 'general',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'siteUrl',
      title: 'Site URL',
      type: 'url',
      group: 'general',
      description: 'Full URL, f.eks. https://mealplaner.no',
    }),
    defineField({
      name: 'links',
      title: 'Lenker',
      type: 'array',
      group: 'links',
      description: 'Felles lenker som kan brukes i både header og footer.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'Teksten som vises i menyen.',
              validation: rule => rule.required(),
            }),
            defineField({
              name: 'linkType',
              title: 'Lenketype',
              type: 'string',
              initialValue: 'custom',
              options: {
                list: [
                  {title: 'Custom link', value: 'custom'},
                  {title: 'Referanse til side', value: 'page'},
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
              validation: rule => rule.required(),
            }),
            defineField({
              name: 'customHref',
              title: 'Custom link',
              type: 'string',
              description: 'Bruk intern path som /oppskrifter eller full URL.',
              hidden: ({parent}) => parent?.linkType !== 'custom',
              validation: rule =>
                rule.custom((value, context) => {
                  if (context.parent?.linkType === 'custom' && !value) {
                    return 'Custom link er påkrevd når lenketype er custom'
                  }
                  return true
                }),
            }),
            defineField({
              name: 'page',
              title: 'Side',
              type: 'reference',
              to: [{type: 'page'}],
              hidden: ({parent}) => parent?.linkType !== 'page',
              options: {
                filter: 'defined(slug.current) && isActive == true',
              },
              validation: rule =>
                rule.custom((value, context) => {
                  if (context.parent?.linkType === 'page' && !value) {
                    return 'Side er påkrevd når lenketype er referanse'
                  }
                  return true
                }),
            }),
            defineField({
              name: 'showInHeader',
              title: 'Vis i header',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'showInFooter',
              title: 'Vis i footer',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              title: 'label',
              linkType: 'linkType',
              customHref: 'customHref',
              pageTitle: 'page.title',
              pageSlug: 'page.slug.current',
            },
            prepare({title, linkType, customHref, pageTitle, pageSlug}) {
              const subtitle =
                linkType === 'custom'
                  ? customHref ?? '(mangler custom link)'
                  : pageSlug
                    ? `/${pageSlug}`
                    : pageTitle
                      ? `Side: ${pageTitle}`
                      : '(mangler side)'
              return {title: title ?? 'Uten label', subtitle}
            },
          },
        },
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      group: 'footer',
      fields: [
        defineField({
          name: 'text',
          title: 'Footer tekst',
          type: 'text',
          rows: 2,
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'Global SEO',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'defaultMetaTitle',
          title: 'Default Meta Title',
          type: 'string',
          validation: rule => rule.required().min(10).max(60),
        }),
        defineField({
          name: 'defaultMetaDescription',
          title: 'Default Meta Description',
          type: 'text',
          rows: 3,
          validation: rule => rule.required().min(50).max(160),
        }),
        defineField({
          name: 'defaultOgImage',
          title: 'Default OG image',
          type: 'image',
          options: {hotspot: true},
        }),
        defineField({
          name: 'robots',
          title: 'Robots defaults',
          type: 'object',
          fields: [
            defineField({
              name: 'noIndex',
              title: 'Noindex',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'noFollow',
              title: 'Nofollow',
              type: 'boolean',
              initialValue: false,
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'siteName',
      subtitle: 'siteUrl',
    },
  },
})
