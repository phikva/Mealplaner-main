import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'brukerprofil',
  title: 'Brukerprofil Innstillinger',
  type: 'document',
  groups: [
    { name: 'diet', title: 'Kosthold', default: true },
    { name: 'allergies', title: 'Allergier' },
    { name: 'kitchen', title: 'Kjøkken og preferanser' },
  ],
  fields: [
    defineField({
      name: 'kostholdsbehov',
      title: 'Kostholdsbehov',
      type: 'array',
      group: 'diet',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'navn',
              title: 'Navn',
              type: 'string',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'verdi',
              title: 'Verdi i systemet',
              type: 'string',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'beskrivelse',
              title: 'Beskrivelse',
              type: 'text'
            })
          ],
          preview: {
            select: {
              title: 'navn',
              subtitle: 'beskrivelse'
            }
          }
        }
      ]
    }),
    defineField({
      name: 'vanligeAllergier',
      title: 'Vanlige Allergier',
      type: 'array',
      group: 'allergies',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'navn',
              title: 'Navn',
              type: 'string',
              validation: Rule => Rule.required()
            }),
            defineField({
              name: 'beskrivelse',
              title: 'Beskrivelse',
              type: 'text'
            }),
            // defineField({
            //   name: 'alvorlighetsgrad',
            //   title: 'Alvorlighetsgrad',
            //   type: 'string',
            //   options: {
            //     list: [
            //       { title: 'Mild', value: 'mild' },
            //       { title: 'Moderat', value: 'moderate' },
            //       { title: 'Alvorlig', value: 'severe' }
            //     ]
            //   }
            // })
          ],
        //   preview: {
        //     select: {
        //       title: 'navn',
        //       subtitle: 'alvorlighetsgrad'
        //     }
        //   }
        }
      ]
    }),
    defineField({
      name: 'kjokkenTyper',
      title: 'Kjøkkentyper',
      type: 'array',
      group: 'kitchen',
      of: [
        {
          type: 'reference',
          to: [{ type: 'kategori' }]
        }
      ]
    }),

  ]
}) 