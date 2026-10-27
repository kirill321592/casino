import path from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') assertBuildEnv(loadEnv(mode, process.cwd(), 'VITE_'))

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      // Node by default — the suites here are pure logic and a DOM would only cost
      // startup time. A component test opts in with `// @vitest-environment jsdom`.
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.ts', 'src/**/*.tsx'],
      },
    },
  }
})

/*
 * The app falls back to localhost for the dev server's sake. A built bundle
 * doing the same would load fine and then fail every request on every player's
 * machine, so a build without a real server address stops here instead.
 */
function assertBuildEnv(env: Record<string, string>): void {
  const url = env.VITE_GAME_SERVER_URL

  if (!url) {
    throw new Error('VITE_GAME_SERVER_URL is not set. See .env.example.')
  }

  if (!URL.canParse(url) || !/^https?:$/.test(new URL(url).protocol)) {
    throw new Error(`VITE_GAME_SERVER_URL must be an http(s) URL, got "${url}".`)
  }

  if (url.endsWith('/')) {
    throw new Error(`VITE_GAME_SERVER_URL must not end with a slash, got "${url}".`)
  }
}
