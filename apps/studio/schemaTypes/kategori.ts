import { defineField, defineType } from 'sanity'
import { CategoryIcon } from './icons'

export default defineType({
  name: 'kategori',
  title: 'Kategori',
  type: 'document',
  icon: CategoryIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Kategori Navn',
      type: 'string',
      description: 'Navn på kategorien',
    }),
    defineField({
      name: 'image',
      title: 'Kategori Bilde',
      type: 'image',
      options: {
        hotspot: true,
        accept: 'image/svg+xml,image/*',
        storeOriginalFilename: true,
        metadata: ['exif', 'location', 'lqip', 'palette', 'blurhash'],
      },
      description: 'Bilde for kategorien (støtter også SVG-filer)',
    }),
  ],
}) 