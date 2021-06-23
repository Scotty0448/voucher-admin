import adapter from '@sveltejs/adapter-node';
import preprocess from "svelte-preprocess";
/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
      adapter: adapter({
      	// default options are shown
      	out: 'build',
      	precompress: false
      }),
		  // hydrate the <div id="svelte"> element in src/app.html
		  target: '#svelte'
    },
    preprocess: [preprocess({
        "postcss": true
    })]
};

export default config;
// Workaround until SvelteKit uses Vite 2.3.8 (and it's confirmed to fix the Tailwind JIT problem)
const mode = process.env.NODE_ENV;
const dev = mode === "development";
process.env.TAILWIND_MODE = dev ? "watch" : "build";
