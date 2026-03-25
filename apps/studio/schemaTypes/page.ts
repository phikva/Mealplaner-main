import { defineField, defineType } from 'sanity'
import { PageIcon } from './icons'

type PageType = 'home' | 'recipeList' | 'categoryList' | 'profile' | 'settings'

const pageTypes: Record<PageType, string> = {
  home: 'Hjem',
  recipeList: 'Oppskriftsliste',
  categoryList: 'Kategoriliste',
  profile: 'Profil',
  settings: 'Innstillinger'
}

export const pageSchema = defineType({
  name: 'page',
  title: 'Sider',
  type: 'document',
  icon: PageIcon,
  groups: [
    { name: 'general', title: 'Generelt', default: true },
    { name: 'content', title: 'Innhold' },
    { name: 'seo', title: 'SEO' }
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Sidetittel',
      type: 'string',
      group: 'general',
      validation: rule => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'URL Lenke',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      group: 'general',
      validation: rule => rule.required()
    }),
    defineField({
      name: 'pageType',
      title: 'Sidetype',
      type: 'string',
      options: {
        list: [
          { title: 'Hjem', value: 'home' },
          { title: 'Oppskriftsliste', value: 'recipeList' },
          { title: 'Kategoriliste', value: 'categoryList' },
          { title: 'Profil', value: 'profile' },
          { title: 'Innstillinger', value: 'settings' }
        ]
      },
      group: 'general',
      validation: rule => rule.required()
    }),
    defineField({
      name: 'isActive',
      title: 'Side Aktiv',
      type: 'boolean',
      group: 'general',
      initialValue: true
    }),
    defineField({
      name: 'seo',
      title: 'SEO og deling',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta title',
          type: 'string',
          description: 'Anbefalt lengde: 50-60 tegn.',
          validation: rule => rule.required().min(10).max(60)
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta description',
          type: 'text',
          rows: 3,
          description: 'Anbefalt lengde: 120-160 tegn.',
          validation: rule => rule.required().min(50).max(160)
        }),
        defineField({
          name: 'canonicalUrl',
          title: 'Canonical URL',
          type: 'url',
          description: 'Full URL, f.eks. https://example.no/oppskrifter'
        }),
        defineField({
          name: 'robots',
          title: 'Robots',
          type: 'object',
          fields: [
            defineField({
              name: 'noIndex',
              title: 'Noindex',
              type: 'boolean',
              initialValue: false
            }),
            defineField({
              name: 'noFollow',
              title: 'Nofollow',
              type: 'boolean',
              initialValue: false
            })
          ]
        }),
        defineField({
          name: 'openGraph',
          title: 'Open Graph',
          type: 'object',
          fields: [
            defineField({
              name: 'ogTitle',
              title: 'OG title',
              type: 'string',
              description: 'Brukes i deling på Facebook/LinkedIn. Fallback: Meta title.'
            }),
            defineField({
              name: 'ogDescription',
              title: 'OG description',
              type: 'text',
              rows: 3,
              description: 'Brukes i deling. Fallback: Meta description.'
            }),
            defineField({
              name: 'ogImage',
              title: 'OG image',
              type: 'image',
              description: 'Anbefalt: 1200x630px.',
              options: {
                hotspot: true
              }
            })
          ]
        }),
        defineField({
          name: 'twitter',
          title: 'Twitter/X',
          type: 'object',
          fields: [
            defineField({
              name: 'cardType',
              title: 'Korttype',
              type: 'string',
              initialValue: 'summary_large_image',
              options: {
                list: [
                  { title: 'Summary', value: 'summary' },
                  { title: 'Summary Large Image', value: 'summary_large_image' }
                ]
              }
            }),
            defineField({
              name: 'twitterTitle',
              title: 'Twitter title',
              type: 'string',
              description: 'Fallback: OG title eller Meta title.'
            }),
            defineField({
              name: 'twitterDescription',
              title: 'Twitter description',
              type: 'text',
              rows: 3,
              description: 'Fallback: OG description eller Meta description.'
            }),
            defineField({
              name: 'twitterImage',
              title: 'Twitter image',
              type: 'image',
              description: 'Fallback: OG image.',
              options: {
                hotspot: true
              }
            })
          ]
        })
      ]
    }),
    defineField({
      name: 'content',
      title: 'Sideinnhold',
      type: 'array',
      group: 'content',
      of: [
        {type: 'heroBlock'},
        {type: 'recipeGridBlock'}
      ],
      description: 'Velg og sorter blokker for siden.'
    })
  ],
  preview: {
    select: {
      title: 'title',
      pageType: 'pageType'
    },
    prepare({ title, pageType }: { title?: string; pageType?: PageType }) {
      return {
        title,
        subtitle: `${pageTypes[pageType as PageType] || pageType} side`
      }
    }
  }
}) 