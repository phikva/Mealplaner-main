import {defineField, defineType} from 'sanity'
import {OnboardingIcon} from './icons'

export const onboardingSchema = defineType({
  name: 'onboarding',
  title: 'Onboarding',
  type: 'document',
  icon: OnboardingIcon,
  groups: [
    {name: 'general', title: 'Generelt', default: true},
    {name: 'content', title: 'Innhold'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      group: 'general',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL-slug',
      type: 'slug',
      group: 'general',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      group: 'general',
      initialValue: true,
    }),
    defineField({
      name: 'content',
      title: 'Innholdsblokker',
      type: 'array',
      group: 'content',
      of: [{type: 'onboardingSection'}],
      description: 'Legg til og sorter onboarding-seksjoner.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      isActive: 'isActive',
    },
    prepare({title, isActive}) {
      return {
        title: title || 'Uten tittel',
        subtitle: isActive ? 'Aktiv' : 'Inaktiv',
      }
    },
  },
})
