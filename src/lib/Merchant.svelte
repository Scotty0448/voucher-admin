<script>
  import MerchantDetails	from '$lib/MerchantDetails.svelte'
  import MerchantVouchers	from '$lib/MerchantVouchers.svelte'

  export let merchants
  export let name

  let asset
  let active_tab = 'details'
  let state

  async function load(name) {
    if (name == 'new') {
      asset = {name:'VCH/', info:{name:'', address1:'', address2:'', phone:'', logo:''}}
      state = 'add'
      active_tab = 'details'
    } else {
      let resp = await fetch(`/api/assets/${name.replace( /\//g, '|' )}.json`)
      if (resp.status == 200) {
        asset = await resp.json()
      } else {
        asset = {name:'', info:{name:'', address1:'', address2:'', phone:'', logo:''}}
      }
      state = 'edit'
    }
  }

  $: load(name)
</script>

<style>
  .tab { @apply cursor-pointer whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm; }
  .tab.active { @apply border-green-600 text-gray-900; }
  .tab.active:hover { @apply border-green-600; }
  .tab:not(active) { @apply border-transparent text-gray-500; }
  .tab:not(active):hover { @apply border-gray-300 text-gray-900; }
</style>

{#if asset}
  <div>
    <div class="max-w-5xl px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-end sm:space-x-5">
        <div class="flex-1 min-w-0 flex items-center justify-end space-x-6 pb-1">
          <div class="mt-5 min-w-0 flex-1">
            {#if name == 'new'}
              <h1 class="text-xl font-bold text-gray-900 truncate">
                New Merchant
              </h1>
            {:else}
              <h3 class="text-yellow-600">{asset.name}</h3>
              <h1 class="text-xl font-semibold text-gray-900 truncate">
                {asset.info.name} &nbsp;
              </h1>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-2 2xl:mt-5">
    <div class="border-b border-gray-200">
      <div class="max-w-5xl px-4 sm:px-6 lg:px-8">
        <nav class="-mb-px flex space-x-8">
          <div class="tab" on:click="{()=>active_tab='details'}"  class:active="{active_tab=='details'}">
            Details
          </div>
          {#if state != 'add'}
            <div class="tab" on:click="{()=>active_tab='vouchers'}" class:active="{active_tab=='vouchers'}">
              Vouchers
            </div>
          {/if}
        </nav>
      </div>
    </div>
  </div>

  {#if active_tab == 'details'}
    <MerchantDetails bind:merchants={merchants} bind:asset={asset} {state} />
  {:else if active_tab == 'vouchers'}
    <MerchantVouchers {asset} />
  {/if}
{/if}
