import { writable } from 'svelte/store'

export const block_count = writable('')
export const root_asset = writable('')
export const assets = writable([])
export const balances = writable({})
