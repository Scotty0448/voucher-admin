import { readable, writable, derived } from '../../node_modules/svelte-persistent-store/dist/local'

export const authorized = writable('authorized', false)
