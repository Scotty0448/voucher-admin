<script>
	import md5 from 'crypto-js/md5.js'

	import { authorized } from '$lib/local_stores.js'

	import { onMount }  from 'svelte'
	import Merchant			from '$lib/Merchant.svelte'

	let asset_names = []
	let selected_merchant
	let state = 'list'
	let window_width
	let merchants = []

	onMount(async () => {
		let resp = await fetch(`/api/assets.json?prefix=VCH/`)
		asset_names = await resp.json()
		asset_names = asset_names.filter(asset_name => asset_name != 'VCH/PR6')

		for (let i=0; i<asset_names.length; i++) {
			if (isMerchant(asset_names[i])) {
				merchants = [...merchants, {name:asset_names[i]}]
			}
		}

		for (let i=0; i<merchants.length; i++) {
			let resp = await fetch(`/api/assets/${merchants[i].name.replace( /\//g, '|' )}.json?mempool=false`)
      if (resp.status == 200) {
				let asset = await resp.json()
				if (asset.info) {
					merchants[i].info = asset.info
				}
			}
		}
  })

	async function select_merchant(merchant) {
		selected_merchant = merchant
		state = 'detail'
	}

	function parentOf(name) {
		let parts = name.split('/')
		parts.pop()
		return parts.join('/')
	}

	function isMerchant(name) {
		return parentOf(name) == 'VCH'
	}

	async function login() {
		let password = prompt("Enter your password:")
		$authorized = (md5(password) == 'fb1c9e05e53928d05f77f4eab0dc587c')
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
		        <!-- Breadcrumb -->
		        <nav class="flex items-start px-4 pt-4 sm:px-6 lg:px-8 md:hidden" aria-label="Breadcrumb">
		          <div on:click="{()=>state='list'}" class="inline-flex items-center space-x-1 text-sm font-medium text-gray-900">
		            <!-- Heroicon name: solid/chevron-left -->
		            <svg class="-ml-1.5 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
		              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
		            </svg>
		            <span>Merchants</span>
		          </div>
		        </nav>

						{#if selected_merchant != undefined}
							<Merchant bind:merchants={merchants} name={selected_merchant} />
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
			                  <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
			                  </svg>
			                </div>
			                <input type="search" name="search" id="search" class="focus:ring-pink-500 focus:border-pink-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" placeholder="Search">
			              </div>
			            </div>
			          </form>
			        </div>
							<div>
								<button type="button" on:click="{()=>select_merchant('new')}" class="mt-3 mr-4 w-8 h-8 flex items-center justify-center border border-gray-300 shadow-sm rounded text-green-700 bg-white hover:bg-gray-50 focus:outline-none">
									<!-- Heroicon name: solid/plus -->
									<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
									</svg>
								</button>
							</div>
						</div>

		        <nav class="flex-1 min-h-0 overflow-y-auto" aria-label="Directory">
		          <div class="border-t border-gray-200">
		            <ul class="relative z-0 divide-y divide-gray-200">

									{#each merchants as merchant}
			              <li>
			                <div class="relative px-4 py-3 flex items-center space-x-3 focus-within:bg-gray-200 hover:bg-gray-100" class:selected="{merchant.name==selected_merchant}">
			                  <div class="flex-1 min-w-0">
			                    <div class="focus:outline-none cursor-pointer" on:click="{()=>select_merchant(merchant.name)}">
			                      <!-- Extend touch target to entire panel -->
			                      <span class="absolute inset-0" aria-hidden="true"></span>
														<div class="text-sm font-medium text-gray-900">
															<div class="text-xs text-yellow-600">{merchant.name}</div>
															<div class="">{#if merchant.info}{merchant.info.name}{/if}</div>
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
