<script>
  import { authorized } from '$lib/local_stores.js'
  import Spinner        from '$lib/Spinner.svelte'

  export let voucher

  let message = ''
  let error_message = ''
  let wait = false

  let balance
  let recipient_address = ''
  let qty_to_send

  $: initMessages(voucher)
  $: if (voucher) { balance = voucher.balance }

  function initMessages(voucher) {
    message = ''
    error_message = ''
  }

  async function send() {
    if (!$authorized) {
      error_message = 'You are not authorized to send.'
      return
    }
    try {
      wait = true
      error_message = ''
      message = ''
      let resp = await fetch(`/api/assets/${voucher.name.replace( /\//g, '|' )}`, { method:'POST', body:JSON.stringify({address:recipient_address, qty:qty_to_send}) })
      let result = await resp.json()
      if (resp.status == 200) {
        message = 'Sent ' + qty_to_send + ' to ' + recipient_address + '<br>' + '<a href="https://blockbook.ritocoin.org/tx/' + result.tx_id + '" class="underline" target="_blank">View transaction details</a>'
        balance -= qty_to_send
        recipient_address = ''
        qty_to_send = ''
      } else {
        error_message = result.message
      }
    } catch(err) {
      error_message = err.message
    }
    wait = false
  }
</script>

<div class="mt-2 mb-8 lg:mx-10 px-6 bg-gray-100 border border-gray-200">
  <div class="sm:pt-3 sm:mt-0 space-y-6 sm:space-y-3">
    <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start pt-5 sm:pt-2">
      <label class="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
        Qty Held
      </label>
      <div class="mt-1 sm:mt-0 sm:col-span-1 pt-1.5">{balance}</div>
    </div>
  </div>

  <div class="mt-6 sm:mt-5 space-y-6 sm:space-y-3">
    <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-2">
      <label class="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
        Address
      </label>
      <div class="mt-1 sm:mt-0 sm:col-span-1">
        <input type="text" bind:value="{recipient_address}" class="block w-full sm:w-72 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md">
      </div>
    </div>
  </div>

  <div class="mt-6 sm:mt-5 space-y-6 sm:space-y-3">
    <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-2">
      <label class="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
        Qty to Send
      </label>
      <div class="mt-1 sm:mt-0 sm:col-span-1">
        <input type="text" bind:value="{qty_to_send}" class="block w-32 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md">
      </div>
    </div>
  </div>

  <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start pt-6 sm:pt-8">
    <label></label>
    <div class="mt-1 sm:mt-0 sm:col-span-4">
      <button on:click={send} disabled={wait} class="inline-flex justify-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">
        <div hidden={!wait} class="pr-2"><Spinner color="white" /></div>
        Send
      </button>
      <div class="my-6 text-sm">
        <div class="text-green-700">
          {@html message}
        </div>
        <div class="text-red-600">
          {error_message}
        </div>
      </div>
    </div>
  </div>
</div>
