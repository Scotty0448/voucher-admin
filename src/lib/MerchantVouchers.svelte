<script>
  import { gun_user_chain, asset_address, block_count }   	from '$lib/stores.js'

  import AddVoucher			from '$lib/AddVoucher.svelte'
  import UpdateVoucher  from '$lib/UpdateVoucher.svelte'
  import SendVoucher		from '$lib/SendVoucher.svelte'

  export let merchants
  export let selected_merchant_idx

  let vouchers = []
  let selected_voucher
  let state = 'edit'

  function getNodeByPath(chain, path) {
    let node = chain
    let path_parts = path.split('/')
    for (let j=0; j<path_parts.length; j++) {
      node = node.get(path_parts[j])
    }
    return node
  }

  async function loadVouchers(selected_merchant_idx) {
    vouchers = []
    let assets = $gun_user_chain.get('assets')
    assets.map().once((asset, name) => {
			if (name.startsWith(`${merchants[selected_merchant_idx].name}/`)) {
				assets.get(name).get('data').once(data => {
	        delete data['_']
          $gun_user_chain.get('addresses').get($asset_address).get('asset_balances').get(name).get('data').once(balance_data => {
            if (balance_data) {
              data.balance = balance_data ? balance_data.confirmed : undefined
            }
            assets.get(name).get('data').get('info').once(info => {
              delete info['_']
              data.info = info
              let idx = vouchers.findIndex((voucher, idx) => voucher.name == name)
              if (idx > -1) {
                vouchers[idx] = data
              } else {
                vouchers = [...vouchers, data]
                vouchers.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
              }
            })
          })
	      })
			}
    })
    selected_voucher = undefined
  }

  async function updateBalances(selected_merchant_idx, block_count) {
    for (let i=0; i<vouchers.length; i++) {
      $gun_user_chain.get('addresses').get($asset_address).get('asset_balances').get(vouchers[i].name).get('data').once(balance_data => {
        vouchers[i].balance = balance_data ? balance_data.confirmed : undefined
      })
    }
  }

  $: loadVouchers(selected_merchant_idx)
  $: updateBalances($block_count)

  async function select_voucher(idx) {
    selected_voucher = idx
    state = 'edit'
  }

  async function addNewVoucher() {
    selected_voucher = -1
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
            {#each vouchers as voucher, idx}
              <tr on:click="{()=>select_voucher(idx)}" class="voucher hover:bg-gray-100 hover:text-gray-800 cursor-pointer text-sm text-gray-600" class:selected="{idx==selected_voucher}">
                <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                  {voucher.name}
                </td>
                <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                  {voucher.amount || ''}
                </td>
                <td class="px-5 sm:px-3 py-2 whitespace-nowrap">
                  {voucher.balance || ''}
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

{#if selected_voucher != undefined}
  <div class="-mt-1 sm:px-4 max-w-2xl">
    <div class="border-t border-gray-200 px-5 sm:px-6">
      {#if state == 'add'}
        <AddVoucher parent_name={merchants[selected_merchant_idx].name} />
      {:else}
        <UpdateVoucher {vouchers} {selected_voucher} />
        <SendVoucher {vouchers} {selected_voucher} />
      {/if}
    </div>
  </div>
{/if}
