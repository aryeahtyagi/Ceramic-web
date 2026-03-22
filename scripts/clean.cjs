#!/usr/bin/env node
/**
 * Remove Nuxt/Vite caches. Stop `nuxt dev` / `nuxt preview` first, or you may get EPERM on Windows.
 */
const fs = require('fs')
const path = require('path')

const dirs = ['.nuxt', '.output', 'node_modules/.vite', 'node_modules/.cache']
const cwd = process.cwd()

for (const dir of dirs) {
  const full = path.join(cwd, dir)
  try {
    fs.rmSync(full, { recursive: true, force: true })
    console.log('Removed', dir)
  } catch (e) {
    if (e.code === 'ENOENT') continue
    if (e.code === 'EPERM') {
      console.warn('Could not remove', dir, '— close dev servers / IDE locks and try again.')
    } else {
      throw e
    }
  }
}
