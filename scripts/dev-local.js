// Set environment variables and run dev server
import { spawn } from 'child_process'

process.env.NUXT_PUBLIC_API_BASE = 'http://localhost:9090'
process.env.NUXT_PUBLIC_SITE_URL = 'http://localhost:3000'

console.log('🔧 Local Environment Configuration:')
console.log('   API Base:', process.env.NUXT_PUBLIC_API_BASE)
console.log('   Site URL:', process.env.NUXT_PUBLIC_SITE_URL)
console.log('')

const nuxt = spawn('npx', ['nuxt', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
})

nuxt.on('close', (code) => {
  process.exit(code)
})
