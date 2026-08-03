// Create .env.local file for production development
import { writeFileSync } from 'fs'
import { join } from 'path'

const envContent = `NUXT_PUBLIC_API_BASE=https://api.svrve.com
NUXT_PUBLIC_SITE_URL=https://svrve.com
NUXT_PUBLIC_GOOGLE_CLIENT_ID=1069497687982-qn8po112qgf64bs1eoug2l7nlumv08mh.apps.googleusercontent.com
`

const envPath = join(process.cwd(), '.env.local')
writeFileSync(envPath, envContent, 'utf8')
console.log('✅ Created .env.local with production backend configuration')
console.log('   API Base: https://api.svrve.com')
console.log('   Site URL: https://svrve.com')
