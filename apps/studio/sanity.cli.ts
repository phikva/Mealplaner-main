import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  studioHost: 'foodapptest1337',
  api: {
    projectId: 'nxq0o4ir',
    dataset: 'production'
  },
  deployment: {
    appId: 'nqwgr5tpa4q0nkh3pq9zsi5d',
    /**
     * Enable auto-updates for studios.
     * https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: false,
  },
})
