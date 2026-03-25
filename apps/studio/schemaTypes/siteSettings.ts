import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const siteSettingsSchema = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'general', title: 'Generelt', default: true},
    {name: 'header', title: 'Header'},
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
      name: 'header',
      title: 'Header',
      type: 'object',
      group: 'header',
      fields: [
        defineField({
          name: 'navigation',
          title: 'Navigasjon',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'label',
                  title: 'Label',
                  type: 'string',
                  validation: rule => rule.required(),
                }),
                defineField({
                  name: 'href',
                  title: 'Link',
                  type: 'string',
                  description: 'Bruk intern path som /oppskrifter eller full URL.',
                  validation: rule => rule.required(),
                }),
              ],
              preview: {
                select: {title: 'label', subtitle: 'href'},
              },
            },
          ],
        }),
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
        defineField({
          name: 'links',
          title: 'Footer lenker',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'label',
                  title: 'Label',
                  type: 'string',
                  validation: rule => rule.required(),
                }),
                defineField({
                  name: 'href',
                  title: 'Link',
                  type: 'string',
                  validation: rule => rule.required(),
                }),
              ],
              preview: {
                select: {title: 'label', subtitle: 'href'},
              },
            },
          ],
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
