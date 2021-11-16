<script>
  import { assets, balances } from '$lib/stores.js'

  import AddVoucher			from '$lib/AddVoucher.svelte'
  import UpdateVoucher  from '$lib/UpdateVoucher.svelte'
  import SendVoucher		from '$lib/SendVoucher.svelte'
  import Spinner        from '$lib/Spinner.svelte'

  export let selected_merchant_name

  let selected_voucher_name
  let state = 'edit'

  function getNodeByPath(chain, path) {
    let node = chain
    let path_parts = path.split('/')
    for (let j=0; j<path_parts.length; j++) {
      node = node.get(path_parts[j])
    }
    return node
  }

  function isVoucherOf(name, merchant_name) {
    return (name.startsWith(`${merchant_name}/`) && name.split('/').length==3)
  }

  async function init() {
    selected_voucher_name = undefined
  }

  $: if (selected_merchant_name) init()

  async function select_voucher(voucher_name) {
    if ($assets[voucher_name] && $assets[voucher_name].info) {
      selected_voucher_name = voucher_name
      state = 'edit'
    } else {
      selected_voucher_name = undefined
    }
  }

  async function addNewVoucher() {
    selected_voucher_name = ''
    state = 'add'
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
                Issued
              </th>
              <th scope="col" class="px-5 sm:px-3 py-3 text-left text-sm font-medium text-gray-900 tracking-wider">
                Held
              </th>
              <th scope="col" class="px-5 sm:px-3 py-3 text-left text-sm font-medium text-gray-900 tracking-wider">
                Title
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each Object.keys($assets).sort() as asset_name}
              {#if (isVoucherOf(asset_name, selected_merchant_name))}
                <tr on:click="{()=>select_voucher(asset_name)}" class="voucher hover:bg-gray-100 hover:text-gray-800 cursor-pointer text-sm text-gray-600" class:selected="{asset_name==selected_voucher_name}">
                  <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                    {$assets[asset_name].name}
                  </td>
                  <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                    {$assets[asset_name].amount || ''}
                  </td>
                  <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                    {#if $balances[asset_name] && $assets[asset_name].amount}
                      {$balances[asset_name].confirmed}
                    {/if}
                  </td>
                  <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                    {#if $assets[asset_name].info != undefined}
                      {$assets[asset_name].info.title}
                    {:else}
                      <Spinner color="green" />
                    {/if}
                  </td>
                </tr>
              {/if}
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

{#if selected_voucher_name != undefined}
  <div class="-mt-1 sm:px-4 max-w-2xl">
    <div class="border-t border-gray-200 px-5 sm:px-6">
      {#if state == 'add'}
        <AddVoucher parent_name={$assets[selected_merchant_name].name} />
      {:else}
        <UpdateVoucher {selected_voucher_name} />
        <SendVoucher {selected_voucher_name} />
      {/if}
    </div>
  </div>
{/if}
