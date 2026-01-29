// Create .env.local file for local development
import { writeFileSync } from 'fs'
import { join } from 'path'

const envContent = `NUXT_PUBLIC_API_BASE=http://localhost:9090
NUXT_PUBLIC_SITE_URL=http://localhost:3000
`

const envPath = join(process.cwd(), '.env.local')
writeFileSync(envPath, envContent, 'utf8')
console.log('✅ Created .env.local with local backend configuration')
console.log('   API Base: http://localhost:9090')
console.log('   Site URL: http://localhost:3000')
