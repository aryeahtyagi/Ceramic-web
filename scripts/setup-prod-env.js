// Create .env.local file for production development
import { writeFileSync } from 'fs'
import { join } from 'path'

const envContent = `NUXT_PUBLIC_API_BASE=https://api.svrve.com
NUXT_PUBLIC_SITE_URL=https://www.svrve.com
`

const envPath = join(process.cwd(), '.env.local')
writeFileSync(envPath, envContent, 'utf8')
console.log('✅ Created .env.local with production backend configuration')
console.log('   API Base: https://api.svrve.com')
console.log('   Site URL: https://www.svrve.com')
