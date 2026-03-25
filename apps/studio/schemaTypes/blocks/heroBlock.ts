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
