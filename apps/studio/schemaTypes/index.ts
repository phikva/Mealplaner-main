import kategori from './kategori'
import oppskrift from './oppskrift'
import tier from './tier'
import { pageSchema } from './page'
import brukerprofil from './brukerprofil'
import { heroBlockSchema } from './blocks/heroBlock'
import { recipeGridBlockSchema } from './blocks/recipeGridBlock'
import { siteSettingsSchema } from './siteSettings'

export const schemaTypes = [
  // Core content types
  brukerprofil,
  oppskrift,
  kategori,
  tier,
  siteSettingsSchema,
  
  // Page structure
  heroBlockSchema,
  recipeGridBlockSchema,
  pageSchema,
]
