<script>
	import md5 from 'crypto-js/md5.js'

	import { gun_host, gun }  from '$lib/gun.js'
	import { authorized } 		from '$lib/local_stores.js'
	import { gun_user, gun_user_chain, root_asset, asset_address, block_count }  from '$lib/stores.js'

	import Merchant				from '$lib/Merchant.svelte'

	import { onMount }  	from 'svelte'

	let merchants = []
	let selected_merchant_idx
	let state = 'list'
	let window_width

	onMount(async () => {
		let resp = await fetch(`/api/assets/user_pub.json`)
		let pub = (await resp.json()).user_pub
		$gun_user = gun.user(pub)
		$gun_user_chain = $gun_user.get('rito-testnet')
		$gun_user_chain.get('block_count').on(async (count) => {
			$block_count = count
		})
		merchants = []
		resp = await fetch(`/api/assets/root.json`)
		$root_asset = (await resp.json()).root
		resp = await fetch(`/api/assets/asset_address.json`)
		$asset_address = (await resp.json()).asset_address
		let assets = $gun_user_chain.get('assets')
		assets.map().on((asset, name) => {
			if (name.startsWith(`${$root_asset}/`)) {
				if (name.split('/').length==2) {
					assets.get(name).get('data').get('info').on(info => {
		        delete info['_']
		        let idx = merchants.findIndex((merchant, idx) => merchant.name == name)
		        if (idx > -1) {
		          merchants[idx] = {name:name, info:info}
		        } else {
		          merchants = [...merchants, {name:name, info:info}]
							merchants.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0))
		        }
		      })
				}
			}
		})
	})

	async function select_merchant(idx) {
		selected_merchant_idx = idx
		state = 'detail'
	}

	async function login() {
		let password = prompt("Enter your password:")
		$authorized = (md5(password) == 'fb1c9e05e53928d05f77f4eab0dc587c')
	}

	function merchant_name(merchant) {
		try {
			return merchant.info.name
		} catch(err) {
			return ''
		}
	}
</script>

<style>
	.selected { @apply bg-gray-100; }
</style>

<svelte:window bind:innerWidth={window_width}/>

<main>

	<div class="h-screen flex overflow-hidden bg-white">

	  <div class="flex flex-col min-w-0 flex-1 overflow-hidden">
	    <div class="flex-1 relative z-0 flex overflow-hidden">
				{#if window_width >= 768 || state=='detail'}
		      <main class="flex-1 relative z-0 overflow-y-auto focus:outline-none md:order-last" tabindex="0">
						<div class="float-right text-xs text-gray-400 pt-1 pr-1.5">Last block: {$block_count}</div>

		        <!-- Breadcrumb -->
		        <nav class="flex items-start px-4 pt-4 sm:px-6 lg:px-8 md:hidden" aria-label="Breadcrumb">
		          <div on:click="{()=>state='list'}" class="inline-flex items-center space-x-1 text-sm font-medium text-gray-900">
		            <!-- Heroicon name: solid/chevron-left -->
		            <svg class="-ml-1.5 h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
		              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
		            </svg>
		            <span>Merchants</span>
		          </div>
		        </nav>

						{#if (selected_merchant_idx == -1) || (merchants[selected_merchant_idx] != undefined)}
							<Merchant merchants={merchants} selected_merchant_idx={selected_merchant_idx} />
						{/if}
		      </main>
				{/if}

				{#if window_width >= 768 || state=='list'}
		      <aside class="order-first flex flex-col flex-shrink-0 w-full max-w-sm sm:w-80 border-r border-gray-200">
						<div class="flex items-between">
			        <div class="pl-4 pt-4 pb-4 w-full">
			          <h2 on:click={login} class="text-xl font-medium text-gray-900">Merchants</h2>
			          <form class="hidden mt-4 flex space-x-4" action="#">
			            <div class="flex-1 min-w-0">
			              <label for="search" class="sr-only">Search</label>
			              <div class="relative rounded-md shadow-sm">
			                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
			                  <!-- Heroicon name: solid/search -->
			                  <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
			                  </svg>
			                </div>
			                <input type="search" name="search" id="search" class="focus:ring-pink-500 focus:border-pink-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" placeholder="Search">
			              </div>
			            </div>
			          </form>
			        </div>
							<div>
								<button type="button" on:click="{()=>select_merchant(-1)}" class="mt-3 mr-4 w-8 h-8 flex items-center justify-center border border-gray-300 shadow-sm rounded text-green-700 bg-white hover:bg-gray-50 focus:outline-none">
									<!-- Heroicon name: solid/plus -->
									<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
									</svg>
								</button>
							</div>
						</div>

		        <nav class="flex-1 min-h-0 overflow-y-auto border-t border-gray-200" aria-label="Directory">
		          <div class="border-b border-gray-200">
		            <ul class="relative z-0 divide-y divide-gray-200">

									{#each merchants as merchant, idx}
			              <li>
			                <div class="relative px-4 py-3 flex items-center space-x-3 focus-within:bg-gray-200 hover:bg-gray-100" class:selected="{idx==selected_merchant_idx}">
			                  <div class="flex-1 min-w-0">
			                    <div class="focus:outline-none cursor-pointer" on:click="{()=>select_merchant(idx)}">
			                      <!-- Extend touch target to entire panel -->
			                      <span class="absolute inset-0" aria-hidden="true"></span>
														<div class="text-sm font-medium text-gray-900">
															<div class="text-xs text-yellow-600">{merchant.name}</div>
															<div class="">{merchant_name(merchant)}</div>
														</div>
			                    </div>
			                  </div>
			                </div>
			              </li>
									{/each}

		            </ul>
		          </div>
		        </nav>
		      </aside>
				{/if}

	    </div>
	  </div>
	</div>

</main>
