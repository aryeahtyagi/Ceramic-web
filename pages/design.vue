<template>
  <div class="design-page">
    <!-- Top Banner -->
    <div class="top-banner">
      <p class="banner-text">Designed to impress, Made to use</p>
    </div>

    <!-- Header -->
    <header class="topbar">
      <button class="menu-btn" type="button" aria-label="Menu" @click="menuOpen = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>
      <NuxtLink to="/" class="brand-logo">
        <span class="logo-text">SVRVE</span>
        <span class="logo-dot">•</span>
      </NuxtLink>
      <div class="topbar-actions">
        <button class="cart-btn" type="button" @click="router.push('/cart')" aria-label="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span v-if="cart.totalQty.value" class="cart-badge" aria-label="Cart items">{{ cart.totalQty.value }}</span>
        </button>
        <AccountDropdown />
      </div>
    </header>

    <!-- Hamburger Menu -->
    <HamburgerMenu :is-open="menuOpen" @close="menuOpen = false" />

    <!-- Required sign-up gate: cannot be dismissed except by logging in -->
    <div v-if="authReady && !auth.isAuthenticated.value" class="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div class="auth-modal">
        <h2 id="auth-modal-title" class="auth-modal-title">Sign Up Required</h2>
        <p class="auth-modal-message">Please sign up or log in to design your own plate.</p>
        <NuxtLink :to="'/login?redirect=' + encodeURIComponent('/design')" class="auth-modal-btn">Log In / Sign Up</NuxtLink>
      </div>
    </div>

    <div class="content" :class="{ 'content-blurred': authReady && !auth.isAuthenticated.value }">
      <section class="page-header">
        <h1 class="page-title">Design Your Own Plate</h1>
        <p class="page-subtitle">Add your own words to a plate — pick a font, a color, and place it exactly where you want.</p>
      </section>

      <section class="designer">
        <!-- My Designs / Trending sidebar -->
        <aside class="designs-sidebar">
          <div class="designs-sidebar-tabs">
            <button
              type="button"
              class="designs-tab-btn"
              :class="{ active: sidebarTab === 'mine' }"
              @click="sidebarTab = 'mine'"
            >My Designs</button>
            <button
              type="button"
              class="designs-tab-btn"
              :class="{ active: sidebarTab === 'trending' }"
              @click="openTrendingTab"
            >Trending</button>
          </div>

          <template v-if="sidebarTab === 'mine'">
            <div class="designs-sidebar-header">
              <h2 class="designs-sidebar-title">My Designs</h2>
              <button type="button" class="designs-new-btn" @click="startNewDesign">+ New</button>
            </div>

            <div v-if="loadingMyDesigns" class="designs-empty">Loading…</div>
            <div v-else-if="!myDesigns.length" class="designs-empty">
              No saved designs yet.<br />Create one and hit Save Design.
            </div>
            <div v-else class="designs-sidebar-list">
              <button
                v-for="d in myDesigns"
                :key="d.id"
                type="button"
                class="designs-sidebar-item"
                :class="{ active: d.id === currentDesignId }"
                @click="openDesign(d)"
              >
                <img :src="d.thumbnail" class="designs-sidebar-thumb" alt="" />
                <span class="designs-sidebar-info">
                  <span class="designs-sidebar-name">{{ d.name }}</span>
                  <span class="designs-sidebar-date">{{ formatUpdatedAt(d.updatedAt) }}</span>
                </span>
                <span class="designs-sidebar-remove" role="button" aria-label="Delete design" @click.stop="deleteDesign(d.id)">✕</span>
              </button>
            </div>
          </template>

          <template v-else>
            <div class="designs-sidebar-header">
              <h2 class="designs-sidebar-title">Trending</h2>
            </div>
            <p class="trending-hint">Hand-picked by our team — tap one to customize it as your own.</p>

            <div v-if="loadingTrending" class="designs-empty">Loading…</div>
            <div v-else-if="!trendingDesigns.length" class="designs-empty">No trending designs yet — check back soon!</div>
            <div v-else class="designs-sidebar-list">
              <button
                v-for="d in trendingDesigns"
                :key="d.id"
                type="button"
                class="designs-sidebar-item"
                @click="openFeaturedDesign(d)"
              >
                <img :src="d.thumbnail" class="designs-sidebar-thumb" alt="" />
                <span class="designs-sidebar-info">
                  <span class="designs-sidebar-name">{{ d.name }}</span>
                  <span class="designs-sidebar-date">★ Trending</span>
                </span>
              </button>
            </div>
          </template>
        </aside>

        <!-- Plate Preview -->
        <div class="preview-pane">
          <div
            ref="plateRef"
            class="plate"
            :class="{ 'drag-over': isDraggingFile }"
            :style="{ background: plateGradient }"
            @dragenter.prevent="onPlateDragEnter"
            @dragover.prevent="onPlateDragOver"
            @dragleave.prevent="onPlateDragLeave"
            @drop.prevent="onPlateDrop"
          >
            <div class="plate-rim"></div>
            <p v-if="!layers.length" class="plate-empty-hint">Tap "Add Text", "Add Image", or "Add Shape" to start designing</p>
            <template v-for="layer in layers" :key="layer.id">
              <div
                v-if="layer.type === 'text'"
                class="text-layer"
                :class="{ selected: layer.id === selectedId }"
                :style="layerStyle(layer)"
                @pointerdown="onLayerPointerDown($event, layer)"
                @click="selectedId = layer.id"
              >{{ layer.text || ' ' }}</div>
              <canvas
                v-else-if="layer.type === 'image'"
                :ref="(el) => setCanvasRef(layer.id, el)"
                class="image-layer"
                :class="{ selected: layer.id === selectedId, erasing: layer.eraserActive }"
                :style="layerStyle(layer)"
                @pointerdown="onLayerPointerDown($event, layer)"
                @click="selectedId = layer.id"
              ></canvas>
              <svg
                v-else
                viewBox="0 0 100 100"
                class="shape-layer"
                :class="{ selected: layer.id === selectedId }"
                :style="layerStyle(layer)"
                @pointerdown="onLayerPointerDown($event, layer)"
                @click="selectedId = layer.id"
              >
                <component
                  :is="shapeDefs[layer.shapeType].tag"
                  v-bind="shapeDefs[layer.shapeType].attrs"
                  :fill="layer.noFill ? 'none' : layer.fill"
                  :stroke="layer.strokeWidth > 0 ? layer.stroke : 'none'"
                  :stroke-width="layer.strokeWidth"
                />
              </svg>
            </template>
            <div v-if="isDraggingFile" class="drop-overlay">Drop image here</div>
          </div>
          <p class="preview-hint">Drag items to reposition them, or drop an image straight onto the plate</p>

          <div class="plate-color-row">
            <span class="plate-color-label">Plate Color</span>
            <div class="plate-color-swatches">
              <button
                v-for="c in plateColorPresets"
                :key="c"
                type="button"
                class="plate-color-swatch"
                :style="{ background: c }"
                :class="{ active: plateColor.toLowerCase() === c.toLowerCase() }"
                @click="plateColor = c"
                :aria-label="`Use plate color ${c}`"
              ></button>
              <label class="plate-color-custom" :style="{ background: plateColor }">
                <input type="color" v-model="plateColor" class="plate-color-custom-input" aria-label="Custom plate color" />
              </label>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls-pane">
          <div class="design-meta-row">
            <input
              v-model="designName"
              type="text"
              class="design-name-input"
              placeholder="Untitled Design"
              maxlength="80"
            />
          </div>

          <div class="toolbar-row">
            <button class="add-text-btn" type="button" @click="addLayer">+ Add Text</button>
            <button class="add-image-btn" type="button" @click="triggerFileDialog">+ Add Image</button>
            <div class="shape-picker-wrap">
              <button class="add-shape-btn" type="button" @click="showShapePicker = !showShapePicker">+ Add Shape</button>
              <div v-if="showShapePicker" class="shape-picker">
                <button
                  v-for="s in shapeTypes"
                  :key="s.type"
                  type="button"
                  class="shape-picker-btn"
                  @click="addShapeLayer(s.type)"
                >
                  <svg viewBox="0 0 100 100" class="shape-icon">
                    <component :is="shapeDefs[s.type].tag" v-bind="shapeDefs[s.type].attrs" fill="#2c2c2c" />
                  </svg>
                  <span class="shape-picker-label">{{ s.label }}</span>
                </button>
              </div>
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden-file-input"
              tabindex="-1"
              @change="onFileInputChange"
            />
          </div>
          <p v-if="imageError" class="image-error">{{ imageError }}</p>

          <div v-if="layers.length" class="layer-list">
            <button
              v-for="layer in layers"
              :key="layer.id"
              type="button"
              class="layer-chip"
              :class="{ active: layer.id === selectedId }"
              @click="selectedId = layer.id"
            >
              <img v-if="layer.type === 'image'" :src="layer.src" class="layer-chip-thumb" alt="" />
              <svg v-else-if="layer.type === 'shape'" viewBox="0 0 100 100" class="layer-chip-thumb">
                <component
                  :is="shapeDefs[layer.shapeType].tag"
                  v-bind="shapeDefs[layer.shapeType].attrs"
                  :fill="layer.noFill ? 'none' : layer.fill"
                  :stroke="layer.noFill ? '#2c2c2c' : 'none'"
                  stroke-width="4"
                />
              </svg>
              <span class="layer-chip-label">{{ layerLabel(layer) }}</span>
              <span class="layer-chip-remove" role="button" aria-label="Remove layer" @click.stop="removeLayer(layer.id)">✕</span>
            </button>
          </div>

          <div v-if="selectedLayer && selectedLayer.type === 'text'" class="edit-panel">
            <label class="field">
              <span class="field-label">Text</span>
              <textarea
                v-model="selectedLayer.text"
                class="text-input"
                rows="2"
                maxlength="60"
                placeholder="Enter your text"
              ></textarea>
            </label>

            <label class="field">
              <span class="field-label">Font</span>
              <select v-model="selectedLayer.fontFamily" class="select-input">
                <optgroup label="Fonts">
                  <option v-for="f in fontOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
                </optgroup>
                <optgroup v-if="customFonts.length" label="My Fonts">
                  <option v-for="f in customFonts" :key="f.value" :value="f.value">{{ f.label }}</option>
                </optgroup>
              </select>
            </label>

            <div class="font-upload-row">
              <button type="button" class="upload-font-btn" @click="triggerFontDialog">+ Upload Custom Font</button>
              <input
                ref="fontInputRef"
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                class="hidden-file-input"
                tabindex="-1"
                @change="onCustomFontFileChange"
              />
            </div>
            <p v-if="fontError" class="image-error">{{ fontError }}</p>

            <div class="field-row">
              <label class="field">
                <span class="field-label">Size</span>
                <input v-model.number="selectedLayer.fontSize" type="range" min="14" max="56" step="1" class="range-input" />
              </label>
              <label class="field">
                <span class="field-label">Rotation</span>
                <input v-model.number="selectedLayer.rotation" type="range" min="-180" max="180" step="1" class="range-input" />
              </label>
            </div>

            <div class="field-row">
              <label class="field field-color">
                <span class="field-label">Color</span>
                <input v-model="selectedLayer.color" type="color" class="color-input" />
              </label>
              <div class="field field-style-toggles">
                <span class="field-label">Style</span>
                <div class="toggle-group">
                  <button
                    type="button"
                    class="toggle-btn"
                    :class="{ active: selectedLayer.bold }"
                    @click="selectedLayer.bold = !selectedLayer.bold"
                    aria-label="Bold"
                  ><strong>B</strong></button>
                  <button
                    type="button"
                    class="toggle-btn"
                    :class="{ active: selectedLayer.italic }"
                    @click="selectedLayer.italic = !selectedLayer.italic"
                    aria-label="Italic"
                  ><em>I</em></button>
                </div>
              </div>
            </div>

            <div class="preset-colors">
              <button
                v-for="c in presetColors"
                :key="c"
                type="button"
                class="preset-swatch"
                :style="{ background: c }"
                :class="{ active: selectedLayer.color.toLowerCase() === c.toLowerCase() }"
                @click="selectedLayer.color = c"
                :aria-label="`Use color ${c}`"
              ></button>
            </div>

            <button class="remove-layer-btn" type="button" @click="removeLayer(selectedLayer.id)">Remove this text</button>
          </div>

          <div v-else-if="selectedLayer && selectedLayer.type === 'image'" class="edit-panel">
            <div class="image-preview-row">
              <img :src="selectedLayer.src" class="image-edit-thumb" alt="" />
            </div>

            <div class="field-row">
              <label class="field">
                <span class="field-label">Size</span>
                <input v-model.number="selectedLayer.scale" type="range" min="15" max="70" step="1" class="range-input" />
              </label>
              <label class="field">
                <span class="field-label">Rotation</span>
                <input v-model.number="selectedLayer.rotation" type="range" min="-180" max="180" step="1" class="range-input" />
              </label>
            </div>

            <div class="eraser-block">
              <button
                type="button"
                class="toggle-btn eraser-toggle"
                :class="{ active: selectedLayer.eraserActive }"
                @click="selectedLayer.eraserActive = !selectedLayer.eraserActive"
              >{{ selectedLayer.eraserActive ? 'Erasing — click to stop' : 'Erase Part of Image' }}</button>

              <label v-if="selectedLayer.eraserActive" class="field">
                <span class="field-label">Eraser Size</span>
                <input v-model.number="selectedLayer.eraserSize" type="range" min="3" max="25" step="1" class="range-input" />
              </label>
              <p v-if="selectedLayer.eraserActive" class="eraser-hint">Drag over the image on the plate to erase parts of it.</p>
            </div>

            <button class="remove-layer-btn" type="button" @click="removeLayer(selectedLayer.id)">Remove this image</button>
          </div>

          <div v-else-if="selectedLayer && selectedLayer.type === 'shape'" class="edit-panel">
            <div class="field-row">
              <label class="field field-color">
                <span class="field-label">Fill</span>
                <input v-model="selectedLayer.fill" type="color" class="color-input" :disabled="selectedLayer.noFill" />
              </label>
              <label class="field field-color">
                <span class="field-label">Outline</span>
                <input v-model="selectedLayer.stroke" type="color" class="color-input" />
              </label>
            </div>

            <label class="checkbox-field">
              <input type="checkbox" v-model="selectedLayer.noFill" @change="onNoFillToggle" />
              <span>No fill (hollow shape)</span>
            </label>

            <div class="field-row">
              <label class="field">
                <span class="field-label">Outline Width</span>
                <input v-model.number="selectedLayer.strokeWidth" type="range" min="0" max="10" step="1" class="range-input" />
              </label>
              <label class="field">
                <span class="field-label">Size</span>
                <input v-model.number="selectedLayer.scale" type="range" min="10" max="70" step="1" class="range-input" />
              </label>
            </div>

            <label class="field">
              <span class="field-label">Rotation</span>
              <input v-model.number="selectedLayer.rotation" type="range" min="-180" max="180" step="1" class="range-input" />
            </label>

            <button class="remove-layer-btn" type="button" @click="removeLayer(selectedLayer.id)">Remove this shape</button>
          </div>

          <div v-else class="edit-panel-empty">
            <p>Select a text, image, or shape layer above to edit it, or add a new one.</p>
          </div>

          <div class="save-section">
            <button class="save-btn" type="button" :disabled="!layers.length || saving" @click="saveDesign">
              {{ saving ? 'Saving…' : (currentDesignId ? 'Update Design' : 'Save Design') }}
            </button>
            <p v-if="saveError" class="image-error">{{ saveError }}</p>
            <p v-if="savedMessage" class="save-confirmation">
              ✓ Saved "{{ designName }}" — find it anytime under My Designs.
            </p>
          </div>

          <div v-if="currentDesignId" class="share-section">
            <div class="share-row">
              <button type="button" class="share-btn" @click="shareDesign">
                {{ shareCopied ? '✓ Link Copied' : 'Share Design' }}
              </button>
              <a :href="mailtoOrderLink" class="order-btn">Place Order</a>
            </div>
            <label v-if="showShareLink" class="share-link-field">
              <span class="field-label">Shareable Link</span>
              <input type="text" readonly class="share-link-input" :value="shareUrl" @focus="$event.target.select()" />
            </label>
          </div>
          <p v-else class="share-hint">Save your design to share it or place an order.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watchEffect } from 'vue'

const router = useRouter()
const route = useRoute()
const cart = useCart()
const auth = useAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

// Auth state comes from localStorage, which the server can't see. Wait until
// mounted before showing the sign-up gate, so server and initial client
// render match (no hydration mismatch) — the gate can only briefly be absent.
const authReady = ref(false)
onMounted(async () => {
  authReady.value = true
  if (auth.isAuthenticated.value) {
    await refreshMyDesigns()
    const queryId = Number(route.query.designId)
    if (Number.isFinite(queryId)) {
      const match = myDesigns.value.find((d) => d.id === queryId)
      if (match) await openDesign(match)
    }
  }
})

// --- SEO (admin-editable via /admin/seo) ---
// Awaited so the fetch resolves during SSR, before the head tags below are
// written into the response HTML — required for Google to see them at all.
const { data: pageSeo } = await useFetch(`${apiBase}/page-seo/design`)

function getSeoValue(apiValue, fallback) {
  if (apiValue && String(apiValue).trim() !== '') return String(apiValue).trim()
  return fallback
}

const DEFAULT_SEO_TITLE = 'Design Your Own Plate - SVRVE Ceramics'
const DEFAULT_SEO_DESCRIPTION =
  'Create a one-of-a-kind ceramic plate. Add your own text, choose a font and color, and place it exactly where you want.'

watchEffect(() => {
  const seo = pageSeo.value || {}
  const seoTitle = getSeoValue(seo.seoTitle, DEFAULT_SEO_TITLE)
  const metaDesc = getSeoValue(seo.metaDescription, DEFAULT_SEO_DESCRIPTION)
  const ogTitle = getSeoValue(seo.ogTitle, seoTitle)
  const ogDesc = getSeoValue(seo.ogDescription, metaDesc)
  const ogImage = getSeoValue(seo.ogImageUrl, '')
  const siteUrlBase = String(config.public.siteUrl || '').replace(/\/$/, '')
  const canonical = getSeoValue(seo.canonicalUrl, `${siteUrlBase}/design`)

  const metaTags = [{ name: 'description', content: metaDesc }]

  if (seo.primaryKeyword && String(seo.primaryKeyword).trim() !== '') {
    const keywords = [String(seo.primaryKeyword).trim()]
    if (seo.secondaryKeywords && String(seo.secondaryKeywords).trim() !== '') {
      keywords.push(String(seo.secondaryKeywords).trim())
    }
    metaTags.push({ name: 'keywords', content: keywords.join(', ') })
  }

  metaTags.push({ property: 'og:title', content: ogTitle })
  metaTags.push({ property: 'og:description', content: ogDesc })
  if (ogImage) metaTags.push({ property: 'og:image', content: ogImage })

  const indexStatus = String(seo.indexStatus || '').trim().toLowerCase()
  if (indexStatus.startsWith('noindex')) {
    metaTags.push({ name: 'robots', content: indexStatus })
  }

  useHead({
    title: seoTitle,
    meta: metaTags,
    link: [
      { rel: 'canonical', href: canonical },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600&family=Oswald:wght@400;600&family=Bebas+Neue&family=Dancing+Script&family=Pacifico&family=Caveat&display=swap'
      }
    ]
  })
})

// --- Menu ---
const menuOpen = ref(false)

// --- Fonts ---
const fontOptions = [
  { label: 'Classic Serif', value: "'Georgia', 'Times New Roman', serif" },
  { label: 'Modern Sans', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" },
  { label: 'Elegant Script', value: "'Brush Script MT', 'Segoe Script', cursive" },
  { label: 'Typewriter', value: "'Courier New', monospace" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Merriweather', value: "'Merriweather', serif" },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Oswald', value: "'Oswald', sans-serif" },
  { label: 'Bebas Neue', value: "'Bebas Neue', sans-serif" },
  { label: 'Dancing Script', value: "'Dancing Script', cursive" },
  { label: 'Pacifico', value: "'Pacifico', cursive" },
  { label: 'Caveat', value: "'Caveat', cursive" }
]

// Fonts a user has uploaded themselves this session: { label, value }
const customFonts = ref([])
const fontInputRef = ref(null)
const fontError = ref('')
let customFontCounter = 0

function triggerFontDialog() {
  fontInputRef.value?.click()
}

async function onCustomFontFileChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) {
    fontError.value = 'Please choose a .ttf, .otf, .woff or .woff2 font file.'
    return
  }

  fontError.value = ''
  customFontCounter++
  const familyName = `CustomFont${customFontCounter}`

  try {
    const buffer = await file.arrayBuffer()
    const fontFace = new FontFace(familyName, buffer)
    await fontFace.load()
    document.fonts.add(fontFace)

    const label = file.name.replace(/\.[^.]+$/, '')
    const value = `'${familyName}'`
    customFonts.value.push({ label, value })

    if (selectedLayer.value && selectedLayer.value.type === 'text') {
      selectedLayer.value.fontFamily = value
    }
  } catch {
    fontError.value = 'Could not load that font file. Please try another one.'
  }
}

const presetColors = ['#2c2c2c', '#8a5a3b', '#b0323a', '#2f5d50', '#1f4e79', '#c9a227', '#6b6b6b']

// --- Plate color ---
const plateColorPresets = ['#ffffff', '#f3ead9', '#3a3a3a', '#1f4e79', '#8a9a7e', '#c1673a', '#e8b4b8']
const plateColor = ref('#ffffff')

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = parseInt(full, 16) || 0
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function mixHex(hexA, hexB, weight) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  return rgbToHex(a.r + (b.r - a.r) * weight, a.g + (b.g - a.g) * weight, a.b + (b.b - a.b) * weight)
}

// Ceramic-style shading for any base color: a bright highlight toward white,
// darkening gradually toward the rim — matches the original white plate exactly
// when the base color is white, and looks plausible for any other color too.
function plateGradientForColor(base) {
  const highlight = mixHex(base, '#ffffff', 0.6)
  const mid = mixHex(base, '#000000', 0.03)
  const edge = mixHex(base, '#000000', 0.08)
  const rim = mixHex(base, '#000000', 0.16)
  return `radial-gradient(circle at 35% 30%, ${highlight} 0%, ${mid} 55%, ${edge} 78%, ${rim} 100%)`
}

const plateGradient = computed(() => plateGradientForColor(plateColor.value))

// --- Shapes ---
const shapeDefs = {
  circle: { tag: 'circle', label: 'Circle', attrs: { cx: 50, cy: 50, r: 42 } },
  square: { tag: 'rect', label: 'Square', attrs: { x: 8, y: 8, width: 84, height: 84 } },
  triangle: { tag: 'polygon', label: 'Triangle', attrs: { points: '50,6 94,90 6,90' } },
  line: { tag: 'rect', label: 'Line', attrs: { x: 4, y: 42, width: 92, height: 16, rx: 8 } },
  star: {
    tag: 'polygon',
    label: 'Star',
    attrs: { points: '50,4 61,36 96,36 68,56 79,90 50,70 21,90 32,56 4,36 39,36' }
  },
  heart: {
    tag: 'path',
    label: 'Heart',
    attrs: { d: 'M50,90 C22,68 5,45 5,26 C5,13 16,4 29,7 C39,10 46,18 50,27 C54,18 61,10 71,7 C84,4 95,13 95,26 C95,45 78,68 50,90 Z' }
  }
}
const shapeTypes = Object.keys(shapeDefs).map((type) => ({ type, label: shapeDefs[type].label }))
const showShapePicker = ref(false)

function addShapeLayer(shapeType) {
  const id = nextId++
  layers.value.push({
    id,
    type: 'shape',
    shapeType,
    x: 50,
    y: 50,
    scale: 30,
    rotation: 0,
    fill: '#2c2c2c',
    noFill: false,
    stroke: '#2c2c2c',
    strokeWidth: 0
  })
  selectedId.value = id
  showShapePicker.value = false
}

function onNoFillToggle() {
  const layer = selectedLayer.value
  if (layer?.type === 'shape' && layer.noFill && layer.strokeWidth === 0) {
    layer.strokeWidth = 3
  }
}

function layerLabel(layer) {
  if (layer.type === 'image') return 'Image'
  if (layer.type === 'shape') return shapeDefs[layer.shapeType].label
  return layer.text || 'Empty text'
}

// --- Layers ---
let nextId = 1
const layers = ref([
  {
    id: nextId++,
    type: 'text',
    text: 'Your Text Here',
    x: 50,
    y: 50,
    fontSize: 28,
    fontFamily: fontOptions[0].value,
    color: '#2c2c2c',
    bold: false,
    italic: false,
    rotation: 0
  }
])
const selectedId = ref(layers.value[0].id)

const selectedLayer = computed(() => layers.value.find((l) => l.id === selectedId.value) || null)

function addLayer() {
  showShapePicker.value = false
  const id = nextId++
  layers.value.push({
    id,
    type: 'text',
    text: 'New Text',
    x: 50,
    y: 50,
    fontSize: 24,
    fontFamily: fontOptions[0].value,
    color: '#2c2c2c',
    bold: false,
    italic: false,
    rotation: 0
  })
  selectedId.value = id
}

function removeLayer(id) {
  canvasRegistry.delete(id)
  layers.value = layers.value.filter((l) => l.id !== id)
  if (selectedId.value === id) {
    selectedId.value = layers.value[layers.value.length - 1]?.id ?? null
  }
}

function layerStyle(layer) {
  if (layer.type === 'image' || layer.type === 'shape') {
    return {
      left: `${layer.x}%`,
      top: `${layer.y}%`,
      transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
      width: `${layer.scale}%`
    }
  }
  return {
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
    fontFamily: layer.fontFamily,
    fontSize: `${layer.fontSize}px`,
    color: layer.color,
    fontWeight: layer.bold ? '700' : '400',
    fontStyle: layer.italic ? 'italic' : 'normal'
  }
}

// --- Images (upload via file picker or drag-and-drop) ---
const fileInputRef = ref(null)
const isDraggingFile = ref(false)
const imageError = ref('')
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
let dragCounter = 0

function clampToCircle(px, py) {
  const cx = px - 50
  const cy = py - 50
  const dist = Math.sqrt(cx * cx + cy * cy)
  const maxRadius = 38
  if (dist > maxRadius) {
    const scale = maxRadius / dist
    return { x: 50 + cx * scale, y: 50 + cy * scale }
  }
  return { x: px, y: py }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Live, erasable pixel data for each image layer lives outside Vue's reactivity
// (canvas elements/contexts shouldn't be proxied). Keyed by layer id.
const canvasRegistry = new Map()

function setCanvasRef(id, el) {
  if (!el) return
  const existing = canvasRegistry.get(id)
  canvasRegistry.set(id, { ...(existing || {}), el })
}

function paintImageOntoCanvas(id, dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxDim = 900
      let w = img.naturalWidth || 1
      let h = img.naturalHeight || 1
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h)
        w = Math.max(1, Math.round(w * ratio))
        h = Math.max(1, Math.round(h * ratio))
      }
      const meta = canvasRegistry.get(id)
      const canvasEl = meta?.el
      if (!canvasEl) {
        resolve()
        return
      }
      canvasEl.width = w
      canvasEl.height = h
      const ctx = canvasEl.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      canvasRegistry.set(id, { el: canvasEl, ctx, width: w, height: h })
      resolve()
    }
    img.onerror = () => resolve()
    img.src = dataUrl
  })
}

async function addImageLayer(file, pos) {
  if (!file.type || !file.type.startsWith('image/')) {
    imageError.value = 'Please choose an image file.'
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    imageError.value = 'That image is too large (max 8MB).'
    return
  }
  imageError.value = ''
  try {
    const src = await readFileAsDataUrl(file)
    const id = nextId++
    const { x, y } = pos || { x: 50, y: 50 }
    layers.value.push({ id, type: 'image', src, x, y, scale: 35, rotation: 0, eraserActive: false, eraserSize: 8 })
    selectedId.value = id
    await nextTick()
    await paintImageOntoCanvas(id, src)
  } catch {
    imageError.value = 'Could not read that image. Please try another file.'
  }
}

// Erase a circular hole (in the image's own pixel space) around canvasX/canvasY
function eraseAt(layer, canvasX, canvasY) {
  const meta = canvasRegistry.get(layer.id)
  if (!meta?.ctx) return
  const radius = (layer.eraserSize / 100) * meta.width
  meta.ctx.save()
  meta.ctx.globalCompositeOperation = 'destination-out'
  meta.ctx.beginPath()
  meta.ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2)
  meta.ctx.fill()
  meta.ctx.restore()
}

// Map a pointer event (screen coords) to a point in the image layer's own canvas
// pixel space, accounting for the layer's position, rotation and on-plate size.
function pointerToCanvasCoords(e, layer) {
  const plateEl = plateRef.value
  const meta = canvasRegistry.get(layer.id)
  if (!plateEl || !meta) return null
  const plateRect = plateEl.getBoundingClientRect()

  const centerX = (layer.x / 100) * plateRect.width
  const centerY = (layer.y / 100) * plateRect.height
  const dx = e.clientX - plateRect.left - centerX
  const dy = e.clientY - plateRect.top - centerY

  // Undo the layer's rotation to get coordinates in its unrotated local space
  const angle = (-layer.rotation * Math.PI) / 180
  const rx = dx * Math.cos(angle) - dy * Math.sin(angle)
  const ry = dx * Math.sin(angle) + dy * Math.cos(angle)

  const displayW = (layer.scale / 100) * plateRect.width
  const displayH = displayW * (meta.height / meta.width)
  const localX = rx + displayW / 2
  const localY = ry + displayH / 2

  if (localX < 0 || localY < 0 || localX > displayW || localY > displayH) return null

  return {
    x: (localX / displayW) * meta.width,
    y: (localY / displayH) * meta.height
  }
}

function triggerFileDialog() {
  showShapePicker.value = false
  fileInputRef.value?.click()
}

function onFileInputChange(e) {
  const file = e.target.files?.[0]
  if (file) addImageLayer(file)
  e.target.value = ''
}

function onPlateDragEnter() {
  dragCounter++
  isDraggingFile.value = true
}

function onPlateDragOver() {
  // no-op: .prevent on the listener is what allows the drop
}

function onPlateDragLeave() {
  dragCounter = Math.max(0, dragCounter - 1)
  if (dragCounter === 0) isDraggingFile.value = false
}

function onPlateDrop(e) {
  dragCounter = 0
  isDraggingFile.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file || !plateRef.value) return
  const rect = plateRef.value.getBoundingClientRect()
  const px = ((e.clientX - rect.left) / rect.width) * 100
  const py = ((e.clientY - rect.top) / rect.height) * 100
  addImageLayer(file, clampToCircle(px, py))
}

// --- Dragging ---
const plateRef = ref(null)
let dragState = null

function onLayerPointerDown(e, layer) {
  selectedId.value = layer.id

  if (layer.type === 'image' && layer.eraserActive) {
    const pt = pointerToCanvasCoords(e, layer)
    if (pt) eraseAt(layer, pt.x, pt.y)
    dragState = { id: layer.id, mode: 'erase' }
    try {
      e.target.setPointerCapture(e.pointerId)
    } catch {
      // ignore unsupported pointer capture
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return
  }

  const plateEl = plateRef.value
  if (!plateEl) return
  const rect = plateEl.getBoundingClientRect()
  dragState = { id: layer.id, rect, mode: 'move' }
  try {
    e.target.setPointerCapture(e.pointerId)
  } catch {
    // ignore unsupported pointer capture
  }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  if (!dragState) return
  const layer = layers.value.find((l) => l.id === dragState.id)
  if (!layer) return

  if (dragState.mode === 'erase') {
    const pt = pointerToCanvasCoords(e, layer)
    if (pt) eraseAt(layer, pt.x, pt.y)
    return
  }

  const { rect } = dragState
  const px = ((e.clientX - rect.left) / rect.width) * 100
  const py = ((e.clientY - rect.top) / rect.height) * 100

  // Keep the layer within a circular boundary matching the plate's rim
  const clamped = clampToCircle(px, py)
  layer.x = clamped.x
  layer.y = clamped.y
}

function onPointerUp() {
  dragState = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

// Clicking/tapping anywhere that isn't a layer or the controls panel clears
// the selection, so the dashed selection outline doesn't linger indefinitely.
function onWindowPointerDown(e) {
  const target = e.target
  if (target?.closest && !target.closest('.shape-picker-wrap')) {
    showShapePicker.value = false
  }
  if (target?.closest && target.closest('.text-layer, .image-layer, .shape-layer, .controls-pane')) {
    return
  }
  selectedId.value = null
}

onMounted(() => {
  window.addEventListener('pointerdown', onWindowPointerDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointerdown', onWindowPointerDown)
})

// --- Saved designs (save / resume / My Designs) ---
const currentDesignId = ref(null)
const designName = ref('Untitled Design')
const saving = ref(false)
const saveError = ref('')
const savedMessage = ref(false)
let savedTimeout = null

const myDesigns = ref([])
const loadingMyDesigns = ref(false)

// --- Trending (admin-curated designs, public) ---
const sidebarTab = ref('mine')
const trendingDesigns = ref([])
const loadingTrending = ref(false)
let trendingLoaded = false

async function openTrendingTab() {
  sidebarTab.value = 'trending'
  if (trendingLoaded) return
  loadingTrending.value = true
  try {
    trendingDesigns.value = await $fetch(`${apiBase}/designs/featured`)
    trendingLoaded = true
  } catch {
    // non-critical — tab just stays empty, user can retry by switching tabs again
  } finally {
    loadingTrending.value = false
  }
}

// Opening a trending design forks it: id stays null so Save creates a new
// design under the current user rather than overwriting the shared original.
async function openFeaturedDesign(design) {
  await loadDesign({ id: null, name: design.name, layers: design.layers, plateColor: design.plateColor })
}

function formatUpdatedAt(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

// Builds a Path2D for a shape type using the exact same 0-100 viewBox coordinates
// the live SVG uses, so the canvas thumbnail matches what's rendered on the plate.
function buildShapePath2D(shapeType) {
  const def = shapeDefs[shapeType]
  if (def.tag === 'path') return new Path2D(def.attrs.d)
  const path = new Path2D()
  if (def.tag === 'circle') {
    path.arc(def.attrs.cx, def.attrs.cy, def.attrs.r, 0, Math.PI * 2)
  } else if (def.tag === 'rect') {
    const { x, y, width, height, rx } = def.attrs
    if (rx && path.roundRect) path.roundRect(x, y, width, height, rx)
    else path.rect(x, y, width, height)
  } else if (def.tag === 'polygon') {
    const pts = def.attrs.points.trim().split(' ').map((p) => p.split(',').map(Number))
    pts.forEach(([px, py], i) => (i === 0 ? path.moveTo(px, py) : path.lineTo(px, py)))
    path.closePath()
  }
  return path
}

// Composites the current plate (text/images/shapes) into a flat PNG thumbnail,
// entirely from the layer data we already track — no DOM screenshot needed.
function renderThumbnail() {
  const size = 400
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const grad = ctx.createRadialGradient(size * 0.35, size * 0.3, 0, size * 0.5, size * 0.5, size * 0.6)
  grad.addColorStop(0, mixHex(plateColor.value, '#ffffff', 0.6))
  grad.addColorStop(0.55, mixHex(plateColor.value, '#000000', 0.03))
  grad.addColorStop(0.78, mixHex(plateColor.value, '#000000', 0.08))
  grad.addColorStop(1, mixHex(plateColor.value, '#000000', 0.16))
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2)
  ctx.stroke()

  for (const layer of layers.value) {
    const xPx = (layer.x / 100) * size
    const yPx = (layer.y / 100) * size

    if (layer.type === 'text') {
      ctx.save()
      ctx.translate(xPx, yPx)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      const scaledFontSize = layer.fontSize * (size / 420)
      let fontStr = ''
      if (layer.italic) fontStr += 'italic '
      if (layer.bold) fontStr += '700 '
      fontStr += `${scaledFontSize}px ${layer.fontFamily}`
      ctx.font = fontStr
      ctx.fillStyle = layer.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const lines = String(layer.text || '').split('\n')
      const lineHeight = scaledFontSize * 1.2
      const startY = -((lines.length - 1) * lineHeight) / 2
      lines.forEach((line, i) => ctx.fillText(line, 0, startY + i * lineHeight))
      ctx.restore()
    } else if (layer.type === 'image') {
      const meta = canvasRegistry.get(layer.id)
      if (!meta?.el) continue
      const dispW = (layer.scale / 100) * size
      const dispH = dispW * (meta.height / meta.width)
      ctx.save()
      ctx.translate(xPx, yPx)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.drawImage(meta.el, -dispW / 2, -dispH / 2, dispW, dispH)
      ctx.restore()
    } else if (layer.type === 'shape') {
      const dispW = (layer.scale / 100) * size
      ctx.save()
      ctx.translate(xPx, yPx)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.scale(dispW / 100, dispW / 100)
      ctx.translate(-50, -50)
      const path = buildShapePath2D(layer.shapeType)
      if (!layer.noFill) {
        ctx.fillStyle = layer.fill
        ctx.fill(path)
      }
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.stroke
        ctx.lineWidth = layer.strokeWidth
        ctx.stroke(path)
      }
      ctx.restore()
    }
  }

  return canvas.toDataURL('image/png')
}

// For image layers, capture the *current* canvas pixels (including any erasing)
// rather than the original upload — that's what should be restored on reload.
function serializeLayersForSave() {
  return layers.value.map((layer) => {
    if (layer.type === 'image') {
      const meta = canvasRegistry.get(layer.id)
      const src = meta?.el ? meta.el.toDataURL('image/png') : layer.src
      return { ...layer, src }
    }
    return { ...layer }
  })
}

async function saveDesign() {
  if (!auth.user.value?.id || !layers.value.length) return
  saving.value = true
  saveError.value = ''
  try {
    const payload = {
      id: currentDesignId.value,
      userId: auth.user.value.id,
      name: designName.value.trim() || 'Untitled Design',
      layers: serializeLayersForSave(),
      thumbnail: renderThumbnail(),
      plateColor: plateColor.value
    }
    const saved = await $fetch(`${apiBase}/designs/save`, { method: 'POST', body: payload })
    currentDesignId.value = saved.id
    designName.value = saved.name
    savedMessage.value = true
    if (savedTimeout) clearTimeout(savedTimeout)
    savedTimeout = setTimeout(() => {
      savedMessage.value = false
    }, 5000)
    await refreshMyDesigns()
  } catch {
    saveError.value = 'Could not save your design. Please try again.'
  } finally {
    saving.value = false
  }
}

// --- Share & Place Order (only available once the design has an id, i.e. saved) ---
const shareCopied = ref(false)
const showShareLink = ref(false)
let shareCopiedTimeout = null

const shareUrl = computed(() => {
  if (!currentDesignId.value) return ''
  const base = String(config.public.siteUrl || '').replace(/\/$/, '')
  return `${base}/shared/${currentDesignId.value}`
})

async function shareDesign() {
  showShareLink.value = true
  if (navigator.share) {
    try {
      await navigator.share({
        title: designName.value,
        text: `Check out my custom plate design: ${designName.value}`,
        url: shareUrl.value
      })
      return
    } catch {
      // user cancelled the native share sheet or it's unsupported — fall back to copy
    }
  }
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    shareCopied.value = true
    if (shareCopiedTimeout) clearTimeout(shareCopiedTimeout)
    shareCopiedTimeout = setTimeout(() => {
      shareCopied.value = false
    }, 3000)
  } catch {
    // clipboard permission denied — the visible link field lets them copy manually
  }
}

const mailtoOrderLink = computed(() => {
  const name = designName.value || 'Untitled Design'
  const subject = `Custom Plate Order - ${name}`
  const body =
    `Hi SVRVE team,\n\n` +
    `I'd like to place an order for my custom plate design.\n\n` +
    `Design: ${name}\n` +
    `View it here: ${shareUrl.value}\n\n` +
    `Please let me know the next steps (pricing, delivery, etc.)\n\n` +
    `Thanks!`
  return `mailto:svrve.ceramic@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})

async function refreshMyDesigns() {
  if (!auth.user.value?.id) return
  loadingMyDesigns.value = true
  try {
    myDesigns.value = await $fetch(`${apiBase}/designs`, { params: { userId: auth.user.value.id } })
  } catch {
    // non-critical — list just stays as-is
  } finally {
    loadingMyDesigns.value = false
  }
}

// Repaints image-layer canvases from their saved pixel data and rebuilds the
// layer list from a loaded design (either a fresh blank one, or one fetched from the server).
async function loadDesign(design) {
  canvasRegistry.clear()
  layers.value = (design.layers || []).map((l) => ({ ...l }))
  const maxId = layers.value.reduce((m, l) => Math.max(m, l.id || 0), 0)
  nextId = maxId + 1
  currentDesignId.value = design.id ?? null
  designName.value = design.name || 'Untitled Design'
  plateColor.value = design.plateColor || '#ffffff'
  selectedId.value = layers.value[0]?.id ?? null
  showShapePicker.value = false
  savedMessage.value = false
  saveError.value = ''
  showShareLink.value = false
  shareCopied.value = false

  await nextTick()
  for (const layer of layers.value) {
    if (layer.type === 'image' && layer.src) {
      await paintImageOntoCanvas(layer.id, layer.src)
    }
  }
}

async function openDesign(summary) {
  try {
    const full = await $fetch(`${apiBase}/designs/${summary.id}`, { params: { userId: auth.user.value.id } })
    await loadDesign(full)
  } catch {
    saveError.value = 'Could not load that design.'
  }
}

async function deleteDesign(id) {
  try {
    await $fetch(`${apiBase}/designs/${id}`, { method: 'DELETE', params: { userId: auth.user.value.id } })
    myDesigns.value = myDesigns.value.filter((d) => d.id !== id)
    if (currentDesignId.value === id) {
      startNewDesign()
    }
  } catch {
    saveError.value = 'Could not delete that design.'
  }
}

function startNewDesign() {
  loadDesign({
    id: null,
    name: 'Untitled Design',
    plateColor: '#ffffff',
    layers: [
      {
        id: 1,
        type: 'text',
        text: 'Your Text Here',
        x: 50,
        y: 50,
        fontSize: 28,
        fontFamily: fontOptions[0].value,
        color: '#2c2c2c',
        bold: false,
        italic: false,
        rotation: 0
      }
    ]
  })
}

onBeforeUnmount(() => {
  if (savedTimeout) clearTimeout(savedTimeout)
  if (shareCopiedTimeout) clearTimeout(shareCopiedTimeout)
})
</script>

<style scoped>
.design-page {
  min-height: 100vh;
  background: #fff;
}

/* Top Banner */
.top-banner {
  background: #fafafa;
  padding: 8px 0;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.banner-text {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: #666;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-style: italic;
  letter-spacing: 0.05em;
}

/* Header */
.topbar {
  position: sticky;
  top: 0;
  z-index: 150;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-btn svg {
  width: 24px;
  height: 24px;
  stroke: #333;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #333;
  font-weight: 600;
  font-size: 1.125rem;
  letter-spacing: 0.05em;
}

.logo-text {
  font-family: sans-serif;
}

.logo-dot {
  font-size: 0.75rem;
  color: #333;
}

.topbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cart-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-btn svg {
  width: 20px;
  height: 20px;
  stroke: #333;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #d32f2f;
  color: #fff;
  font-size: 0.625rem;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 60px;
}

.page-header {
  text-align: center;
  padding: 40px 20px 20px;
}

.auth-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-modal {
  background: #fff;
  width: 100%;
  max-width: 400px;
  padding: 36px 28px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-modal-title {
  margin: 0 0 12px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2c2c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.auth-modal-message {
  margin: 0 0 24px;
  color: #666;
  font-size: 0.9375rem;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.auth-modal-btn {
  display: inline-block;
  background: #2c2c2c;
  color: #fff;
  border: 1px solid #2c2c2c;
  padding: 14px 32px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.auth-modal-btn:hover {
  background: #000;
}

.content-blurred {
  filter: blur(6px);
  pointer-events: none;
  user-select: none;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c2c2c;
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.page-subtitle {
  margin: 0;
  color: #666;
  font-size: 0.9375rem;
  max-width: 480px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* Designer layout */
.designer {
  display: grid;
  grid-template-columns: 220px 1.1fr 1fr;
  gap: 32px;
  margin-top: 32px;
  align-items: start;
}

.designs-sidebar {
  position: sticky;
  top: 80px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fafafa;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.designs-sidebar-tabs {
  display: flex;
  gap: 6px;
}

.designs-tab-btn {
  flex: 1;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 8px 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.designs-tab-btn.active {
  background: #2c2c2c;
  border-color: #2c2c2c;
  color: #fff;
}

.trending-hint {
  margin: 0;
  color: #999;
  font-size: 0.75rem;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.designs-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.designs-sidebar-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2c2c2c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.designs-new-btn {
  background: #2c2c2c;
  color: #fff;
  border: 1px solid #2c2c2c;
  padding: 6px 10px;
  font-size: 0.6875rem;
  font-weight: 500;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.designs-new-btn:hover {
  background: #000;
}

.designs-empty {
  color: #999;
  font-size: 0.8125rem;
  font-style: italic;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.designs-sidebar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.designs-sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 8px;
  cursor: pointer;
  text-align: left;
}

.designs-sidebar-item.active {
  border-color: #2c2c2c;
  box-shadow: 0 0 0 1px #2c2c2c;
}

.designs-sidebar-thumb {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #f0f0f0;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.designs-sidebar-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.designs-sidebar-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  color: #2c2c2c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.designs-sidebar-date {
  font-size: 0.6875rem;
  color: #999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.designs-sidebar-remove {
  color: #ccc;
  font-size: 0.75rem;
  line-height: 1;
  padding: 4px;
  flex-shrink: 0;
}

.designs-sidebar-remove:hover {
  color: #d32f2f;
}

.preview-pane {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.plate {
  position: relative;
  width: min(85vw, 420px);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffff 0%, #f7f7f5 55%, #ececea 78%, #dcdcda 100%);
  box-shadow:
    0 -6px 14px rgba(0, 0, 0, 0.06) inset,
    0 18px 40px rgba(0, 0, 0, 0.12);
  touch-action: none;
  transition: box-shadow 0.15s;
}

.plate.drag-over {
  box-shadow:
    0 -6px 14px rgba(0, 0, 0, 0.06) inset,
    0 18px 40px rgba(0, 0, 0, 0.12),
    0 0 0 3px rgba(44, 44, 44, 0.2);
}

.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border: 2px dashed #2c2c2c;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 500;
  color: #2c2c2c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.plate-rim {
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5) inset, 0 4px 10px rgba(0, 0, 0, 0.05) inset;
  pointer-events: none;
}

.plate-empty-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 0.875rem;
  font-style: italic;
  text-align: center;
  width: 60%;
  margin: 0;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.text-layer {
  position: absolute;
  cursor: grab;
  white-space: pre-wrap;
  text-align: center;
  padding: 4px 8px;
  user-select: none;
  max-width: 80%;
  line-height: 1.2;
  touch-action: none;
}

.text-layer:active {
  cursor: grabbing;
}

.text-layer.selected {
  outline: 1px dashed #999;
  outline-offset: 4px;
}

.image-layer {
  position: absolute;
  display: block;
  height: auto;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.image-layer:active {
  cursor: grabbing;
}

.image-layer.selected {
  outline: 1px dashed #999;
  outline-offset: 4px;
}

.image-layer.erasing {
  cursor: crosshair;
}

.shape-layer {
  position: absolute;
  display: block;
  aspect-ratio: 1 / 1;
  height: auto;
  cursor: grab;
  user-select: none;
  touch-action: none;
  overflow: visible;
}

.shape-layer:active {
  cursor: grabbing;
}

.shape-layer.selected {
  outline: 1px dashed #999;
  outline-offset: 4px;
}

.preview-hint {
  margin: 0;
  color: #999;
  font-size: 0.8125rem;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.plate-color-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.plate-color-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.plate-color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.plate-color-swatch {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  padding: 0;
}

.plate-color-swatch.active {
  border-color: #2c2c2c;
}

.plate-color-custom {
  position: relative;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 0 0 2px #fff;
  cursor: pointer;
  overflow: hidden;
}

.plate-color-custom-input {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  border: none;
  padding: 0;
  cursor: pointer;
  background: none;
}

/* Controls */
.controls-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.design-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.design-name-input {
  flex: 1;
  min-width: 160px;
  padding: 10px 12px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #2c2c2c;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.design-name-input:focus {
  outline: none;
  border-color: #2c2c2c;
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.add-text-btn,
.add-image-btn {
  align-self: flex-start;
  background: #2c2c2c;
  color: #fff;
  border: 1px solid #2c2c2c;
  padding: 10px 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.2s, color 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.add-text-btn:hover {
  background: #000;
}

.add-image-btn {
  background: #fff;
  color: #2c2c2c;
}

.add-image-btn:hover {
  background: #2c2c2c;
  color: #fff;
}

.shape-picker-wrap {
  position: relative;
}

.add-shape-btn {
  background: #fff;
  color: #2c2c2c;
  border: 1px solid #2c2c2c;
  padding: 10px 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.2s, color 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.add-shape-btn:hover {
  background: #2c2c2c;
  color: #fff;
}

.shape-picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 220px;
}

.shape-picker-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 8px 6px;
  cursor: pointer;
}

.shape-picker-btn:hover {
  border-color: #2c2c2c;
}

.shape-icon {
  width: 28px;
  height: 28px;
}

.shape-picker-label {
  font-size: 0.6875rem;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.hidden-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.image-error {
  margin: 0;
  color: #d32f2f;
  font-size: 0.8125rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.layer-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.layer-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 6px 8px 6px 12px;
  font-size: 0.8125rem;
  color: #2c2c2c;
  cursor: pointer;
  max-width: 220px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.layer-chip.active {
  border-color: #2c2c2c;
  background: #fff;
}

.layer-chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.layer-chip-thumb {
  width: 22px;
  height: 22px;
  object-fit: cover;
  flex-shrink: 0;
}

.image-preview-row {
  display: flex;
  justify-content: center;
}

.image-edit-thumb {
  max-width: 100%;
  max-height: 140px;
  object-fit: contain;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  padding: 8px;
}

.layer-chip-remove {
  color: #999;
  font-size: 0.75rem;
  line-height: 1;
  padding: 2px;
}

.layer-chip-remove:hover {
  color: #d32f2f;
}

.edit-panel,
.edit-panel-empty {
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 20px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-panel-empty {
  color: #666;
  font-size: 0.875rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.edit-panel-empty p {
  margin: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: #2c2c2c;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.checkbox-field input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.font-upload-row {
  display: flex;
}

.upload-font-btn {
  align-self: flex-start;
  background: none;
  border: none;
  color: #2c2c2c;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.text-input,
.select-input {
  border: 1px solid rgba(0, 0, 0, 0.15);
  padding: 10px 12px;
  font-size: 0.9375rem;
  color: #2c2c2c;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  resize: vertical;
}

.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: #2c2c2c;
}

.range-input {
  width: 100%;
}

.color-input {
  width: 48px;
  height: 36px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  padding: 2px;
  background: #fff;
  cursor: pointer;
}

.color-input:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.field-style-toggles {
  justify-content: flex-end;
}

.toggle-group {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: #fff;
  color: #2c2c2c;
  cursor: pointer;
  font-size: 0.9375rem;
}

.toggle-btn.active {
  background: #2c2c2c;
  color: #fff;
  border-color: #2c2c2c;
}

.preset-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-swatch {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
}

.preset-swatch.active {
  border-color: #2c2c2c;
}

.eraser-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.eraser-toggle {
  align-self: flex-start;
  width: auto;
  height: auto;
  padding: 8px 14px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.eraser-hint {
  margin: 0;
  color: #666;
  font-size: 0.75rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.remove-layer-btn {
  align-self: flex-start;
  background: none;
  border: none;
  color: #d32f2f;
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.save-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.save-btn {
  background: #2c2c2c;
  color: #fff;
  border: 1px solid #2c2c2c;
  padding: 14px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.save-btn:hover:not(:disabled) {
  background: #000;
}

.save-btn:disabled {
  background: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
}

.save-confirmation {
  margin: 0;
  padding: 12px 14px;
  background: #f0f7f1;
  border: 1px solid #cfe8d4;
  color: #2f5d3a;
  font-size: 0.8125rem;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.share-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-row {
  display: flex;
  gap: 12px;
}

.share-btn,
.order-btn {
  flex: 1;
  text-align: center;
  padding: 12px 16px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.share-btn {
  background: #fff;
  color: #2c2c2c;
  border: 1px solid #2c2c2c;
}

.share-btn:hover {
  background: #2c2c2c;
  color: #fff;
}

.order-btn {
  background: #2c2c2c;
  color: #fff;
  border: 1px solid #2c2c2c;
}

.order-btn:hover {
  background: #000;
}

.share-link-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.share-link-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.8125rem;
  color: #666;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: #fafafa;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.share-hint {
  margin: 0;
  color: #999;
  font-size: 0.8125rem;
  font-style: italic;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

@media (max-width: 860px) {
  .designer {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .preview-pane {
    position: static;
  }

  .designs-sidebar {
    position: static;
    max-height: none;
  }

  .designs-sidebar-list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .designs-sidebar-item {
    flex: 1 1 200px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.375rem;
  }

  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
