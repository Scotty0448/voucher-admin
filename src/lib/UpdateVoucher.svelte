<script>
  import { authorized } from '$lib/local_stores.js'
  import { assets }     from '$lib/stores.js'
  import Spinner        from '$lib/Spinner.svelte'

  export let selected_voucher_name

  let voucher

  let message = ''
  let error_message = ''
  let wait = false

  $: init(selected_voucher_name)

  function init(selected_voucher_name) {
    message = ''
    error_message = ''
    voucher = $assets[selected_voucher_name]
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
      let resp = await fetch(`/api/assets/${voucher.name.replace( /\//g, '|' )}.json`, { method:'PUT', body:JSON.stringify(voucher) })
      let result = await resp.json()
      if (resp.status == 200) {
        message = 'Updated successfully'
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

<div class="mt-6 sm:mt-5 space-y-6 sm:space-y-3">
  <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-2 sm:pb-3">
    <label for="title" class="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
      Title
    </label>
    <div class="mt-1 sm:mt-0 sm:col-span-4">
      <input id="title" type="text" bind:value="{voucher.info.title}" class="block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md">
    </div>
  </div>

  <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-2">
    <label for="qty_issued" class="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
      Qty Issued
    </label>
    <div class="mt-1 sm:mt-0 sm:col-span-1">
      <input id="qty_issued" type="text" bind:value="{voucher.amount}" class="block w-32 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md">
    </div>
  </div>
</div>

<div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start pt-6 sm:pt-8">
  <label for="none"></label>
  <div class="mt-1 sm:mt-0 sm:col-span-4">
    <button on:click={updateVoucher} disabled={wait} class="inline-flex justify-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">
      <div hidden={!wait} class="pr-2"><Spinner color="white" /></div>
      Update Voucher
    </button>
    <div class="my-6 text-sm">
      <div class="text-green-700">
        {message}
      </div>
      <div class="text-red-600">
        {error_message}
      </div>
    </div>
  </div>
</div>
