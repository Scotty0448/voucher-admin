<script>
  import { authorized } from '$lib/local_stores.js'

  import Spinner from '$lib/Spinner.svelte'

  export let asset

  let vouchers = []
  let selected_voucher
  let voucher
  let message = ''
  let error_message = ''
  let wait = false
  let state = 'edit'

  $: initMessages(asset.name)

  function initMessages(name) {
    message = ''
    error_message = ''
  }

  async function loadVouchers(merchant) {
    vouchers = []
    let resp = await fetch(`/api/assets?prefix=${merchant}/`)
    let voucher_names = await resp.json()
    for (let i=0; i<voucher_names.length; i++) {
      let resp = await fetch(`/api/assets/${voucher_names[i].replace( /\//g, '|' )}`)
      if (resp.status == 200) {
        vouchers = [...vouchers, await resp.json()]
      } else {
        vouchers = [...vouchers, { name:name, amount:0, info: {title:''} }]
      }
    }
    selected_voucher = undefined
    voucher = undefined
  }

  $: loadVouchers(asset.name)

  async function select_voucher(idx) {
    selected_voucher = idx
    voucher = vouchers[selected_voucher]
    initMessages('')
    state = 'edit'
  }

  async function addNewVoucher() {
    selected_voucher = -1
    initMessages('')
    voucher = { name:asset.name+'/', amount:'', info:{title:''} }
    state = 'add'
  }

  async function addVoucher() {
    if (!$authorized) {
      error_message = 'You are not authorized to add a voucher.'
      message = ''
      return
    }
    try {
      wait = true
      error_message = ''
      message = ''
      let resp = await fetch('/api/assets', { method:'POST', body:JSON.stringify(voucher) })
      let result = await resp.json()
      if (resp.status == 201) {
        vouchers = [...vouchers, voucher]
        voucher = {name:asset.name+'/', amount:'', info:{title:''}}
        message = 'Added successfully'
      } else {
        error_message = result.message
      }
    } catch(err) {
      error_message = err.message
    }
    wait = false
  }

  async function updateVoucher() {
    if (!$authorized) {
      error_message = 'You are not authorized to update a voucher.'
      return
    }
    try {
      wait = true
      error_message = ''
      message = ''
      let resp = await fetch(`/api/assets/${voucher.name.replace( /\//g, '|' )}`, { method:'PUT', body:JSON.stringify(voucher) })
      let result = await resp.json()
      if (resp.status == 200) {
        message = 'Updated successfully'
        vouchers[selected_voucher] = voucher
      } else {
        error_message = result.message
        if (error_message == 'The quantity cannot be decreased') {
          voucher.amount = result.org_amount
        }
      }
    } catch(err) {
      error_message = err.message
    }
    wait = false
  }
</script>

<style>
  .voucher.selected { @apply bg-gray-100 text-gray-800; }
</style>

<div class="flex flex-col sm:px-4 py-3 max-w-2xl">
  <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
    <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
      <div class="overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th scope="col" class="px-5 sm:px-3 py-3 text-left text-sm font-medium text-gray-900 tracking-wider">
                Name
              </th>
              <th scope="col" class="px-5 sm:px-3 py-3 text-left text-sm font-medium text-gray-900 tracking-wider">
                Qty
              </th>
              <th scope="col" class="px-5 sm:px-3 py-3 text-left text-sm font-medium text-gray-900 tracking-wider">
                Title
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each vouchers as voucher, idx}
              <tr on:click="{()=>select_voucher(idx)}" class="voucher hover:bg-gray-100 hover:text-gray-800 cursor-pointer text-sm text-gray-600" class:selected="{idx==selected_voucher}">
                <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                  {voucher.name}
                </td>
                <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                  {#if voucher.amount > 0}
                    {voucher.amount}
                  {/if}
                </td>
                <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                  {#if voucher.info}{voucher.info.title}{/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        <button type="button" on:click={addNewVoucher} class="mt-2 ml-5 sm:ml-3 w-5 h-5 flex items-center justify-center border border-gray-300 shadow-sm rounded-sm text-green-700 bg-white hover:bg-gray-50 focus:outline-none">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>

{#if voucher}
  <div class="-mt-1 sm:px-4 max-w-2xl">
    <div class="border-t border-gray-200 px-5 sm:px-6">

      <div class="mt-6 sm:mt-5 space-y-6 sm:space-y-3">
        {#if state == 'add'}
          <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-2 sm:pb-3">
            <label class="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Asset Name
            </label>
            <div class="mt-1 sm:mt-0 sm:col-span-4">
              <input type="text" bind:value="{voucher.name}" class="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md">
            </div>
          </div>
        {/if}

        <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-2 sm:pb-3">
          <label class="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
            Title
          </label>
          <div class="mt-1 sm:mt-0 sm:col-span-4">
            <input type="text" bind:value="{voucher.info.title}" class="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md">
          </div>
        </div>

        <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-2">
          <label class="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
            Quantity
          </label>
          <div class="mt-1 sm:mt-0 sm:col-span-1">
            <input type="text" bind:value="{voucher.amount}" class="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md">
          </div>
        </div>
      </div>

      <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start pt-6 sm:pt-8">
        <label></label>
        <div class="mt-1 sm:mt-0 sm:col-span-4">
          {#if state == 'add'}
            <button on:click={addVoucher} disabled={wait} class="inline-flex justify-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">
              {#if wait}
                <div class="pr-2"><Spinner color="white" /></div>
              {/if}
              Add Voucher
            </button>
          {:else}
            <button on:click={updateVoucher} disabled={wait} class="inline-flex justify-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">
              {#if wait}
                <div class="pr-2"><Spinner color="white" /></div>
              {/if}
              Update Voucher
            </button>
          {/if}
          <div class="mt-6 text-sm">
            <div class="text-green-700">
              {message}
            </div>
            <div class="text-red-600">
              {error_message}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
{/if}
