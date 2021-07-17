import { readable, writable, derived } from '../../node_modules/svelte-persistent-store/dist/local'

export const root_asset = writable('root_asset', '')
export const authorized = writable('authorized', false)
