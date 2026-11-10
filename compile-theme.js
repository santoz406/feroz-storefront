const fs = require('fs');
const path = require('path');
const { Liquid } = require('liquidjs');

const themeDir = 'C:/Projects/feroz-zens/optimizer/website/shopify-live-theme';

// Load settings_data.json
const rawSettings = fs.readFileSync(path.join(themeDir, 'config/settings_data.json'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').trim();
const settingsData = JSON.parse(rawSettings).current;

// Load index.json
const rawIndex = fs.readFileSync(path.join(themeDir, 'templates/index.json'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').trim();
const indexData = JSON.parse(rawIndex);

const engine = new Liquid({
  root: [
    path.join(themeDir, 'layout'),
    path.join(themeDir, 'sections'),
    path.join(themeDir, 'snippets')
  ],
  extname: '.liquid'
});

// Register Shopify filters
engine.registerFilter('asset_url', (v) => `assets/${String(v).split('&')[0]}`);
engine.registerFilter('image_url', (v) => {
  if (!v) return '';
  const clean = String(v).split('&')[0];
  return clean.startsWith('shopify://') ? `assets/${path.basename(clean)}` : `assets/${clean}`;
});
engine.registerFilter('money', (v) => {
  const val = parseInt(v || 0, 10);
  return val > 0 ? `€${(val / 100).toFixed(2)}` : '€49.99';
});
engine.registerFilter('color_lighten', (c, amt) => c || '#ff2a3c');
engine.registerFilter('color_darken', (c, amt) => c || '#b50f1e');
engine.registerFilter('t', (v) => v);
engine.registerFilter('newline_to_br', (v) => String(v || '').replace(/\n/g, '<br />'));
engine.registerFilter('split', (v, sep) => String(v || '').split(sep));
engine.registerFilter('replace', (v, a, b) => String(v || '').replace(a, b));
engine.registerFilter('append', (v, a) => {
  if (String(a).includes('width=')) return String(v);
  return String(v) + String(a);
});

async function renderSection(sectionName, sectionConfig) {
  const filePath = path.join(themeDir, 'sections', `${sectionConfig.type}.liquid`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Section file not found: ${filePath}`);
    return '';
  }
  let tpl = fs.readFileSync(filePath, 'utf8')
    .replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/g, '')
    .replace(/{%\s*javascript\s*%}[\s\S]*?{%\s*endjavascript\s*%}/g, '')
    .replace(/{%\s*stylesheet\s*%}[\s\S]*?{%\s*endstylesheet\s*%}/g, '');

  // Convert blocks object to blocks array
  const blocks = [];
  if (sectionConfig.blocks && sectionConfig.block_order) {
    for (const bId of sectionConfig.block_order) {
      if (sectionConfig.blocks[bId]) {
        blocks.push(sectionConfig.blocks[bId]);
      }
    }
  }

  const mockProducts = {
    'digital-product-2': { price: 4999, compare_at_price: 9999, selected_or_first_available_variant: { id: 'apex' } },
    'digital-product-3': { price: 4999, compare_at_price: 9999, selected_or_first_available_variant: { id: 'viper' } },
    'digital-product-4': { price: 4999, compare_at_price: 9999, selected_or_first_available_variant: { id: 'mamba' } },
    'digital-product-5': { price: 9997, compare_at_price: 19997, selected_or_first_available_variant: { id: 'bundle' } }
  };

  // Resolve products in blocks
  if (sectionConfig.blocks) {
    for (const bId of Object.keys(sectionConfig.blocks)) {
      const b = sectionConfig.blocks[bId];
      if (b.settings && b.settings.product && mockProducts[b.settings.product]) {
        b.settings.product = mockProducts[b.settings.product];
      }
    }
  }

  const context = {
    section: {
      id: sectionName,
      settings: sectionConfig.settings || {},
      blocks: blocks
    },
    settings: settingsData,
    shop: {
      name: 'Feroz Zens',
      money_format: '€{{amount}}'
    },
    routes: {
      root_url: '/',
      cart_url: '/cart'
    },
    cart: {
      item_count: 0,
      items: []
    }
  };

  return engine.parseAndRender(tpl, context);
}

async function run() {
  console.log('Rendering all sections in order...');
  const renderedSections = [];

  // Render header
  const headerHtml = await renderSection('header', settingsData.sections.header);

  // Render index order sections
  for (const sId of indexData.order) {
    console.log(`Rendering ${sId}...`);
    const sConf = indexData.sections[sId];
    if (sConf) {
      const html = await renderSection(sId, sConf);
      renderedSections.push(html);
    }
  }

  // Render footer
  const footerHtml = await renderSection('footer', settingsData.sections.footer);

  // Render cart-drawer snippet
  let cartDrawerHtml = '';
  const cartDrawerPath = path.join(themeDir, 'snippets/cart-drawer.liquid');
  if (fs.existsSync(cartDrawerPath)) {
    const rawCartDrawer = fs.readFileSync(cartDrawerPath, 'utf8')
      .replace(/{%\s*doc\s*%}[\s\S]*?{%\s*enddoc\s*%}/g, '');
    cartDrawerHtml = await engine.parseAndRender(rawCartDrawer, {
      settings: settingsData,
      cart: { item_count: 0, items: [] }
    });
  }

  // Combine into full page
  const fullHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link rel="icon" type="image/png" href="assets/newappiconlogo_00000.png">
  <title>Feroz Zens - Next-Gen Cronus Zen Optimizer & Scripts</title>
  <meta name="description" content="Instant boost for your Cronus Zen experience. High-performance Fortnite, Call of Duty, and NBA 2K scripts powered by Feroz Optimizer.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap">
  <link rel="stylesheet" href="assets/base.css">

  <style>
    :root{
      --red: #e11526;
      --red-bright: #ff2a3c;
      --red-deep: #b50f1e;
      --glow: color-mix(in srgb, var(--red) 32%, transparent);
      --glow-soft: color-mix(in srgb, var(--red) 16%, transparent);
    }
  </style>

  <script>
    window.FZ = { moneyFormat: "€{{amount}}", routes: { cart: "/cart" } };
  </script>
  <script src="assets/feroz.js" defer></script>
</head>
<body class="template-index">

  <!-- fixed backdrop layers -->
  <div style="position:fixed;inset:0;z-index:0;pointer-events:none;background:#000;"></div>
  <div style="position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.5;background-image:radial-gradient(circle at 1px 1px, rgba(255,255,255,.03) 1px, transparent 0);background-size:46px 46px;"></div>
  <div id="scrollbar" style="position:fixed;top:0;left:0;height:2px;width:100%;transform:scaleX(0);transform-origin:0 50%;z-index:60;background:linear-gradient(90deg,var(--red-deep),var(--red-bright));box-shadow:0 0 10px var(--glow);pointer-events:none;transition:transform .08s linear;"></div>

  ${headerHtml}

  <main id="MainContent" role="main">
    ${renderedSections.join('\n')}
  </main>

  ${footerHtml}

  <a class="fz-discord-float" href="${settingsData.discord_url || 'https://discord.gg/pZrkfnrqKJ'}" target="_blank" rel="noopener" aria-label="Join Feroz Zens on Discord">
    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.6 5.6A17 17 0 0 0 15.4 4.3l-.2.4a13 13 0 0 0-6.4 0l-.2-.4A17 17 0 0 0 4.4 5.6 17.6 17.6 0 0 0 1.5 17.3a17 17 0 0 0 5.2 2.6l.6-1a11 11 0 0 1-1.8-.9l.4-.3a12 12 0 0 0 10.2 0l.4.3c-.6.4-1.2.7-1.8.9l.6 1a17 17 0 0 0 5.2-2.6 17.5 17.5 0 0 0-2.9-11.7zM8.6 14.6c-1 0-1.8-1-1.8-2.1s.8-2.1 1.8-2.1 1.9 1 1.8 2.1c0 1.2-.8 2.1-1.8 2.1zm6.8 0c-1 0-1.8-1-1.8-2.1s.8-2.1 1.8-2.1 1.9 1 1.8 2.1c0 1.2-.8 2.1-1.8 2.1z"></path></svg>
    <span class="fz-discord-label">Join Discord</span>
  </a>

  ${cartDrawerHtml}

  <!-- Stripe & Discord Integration Bridge -->
  <script>
    const API_BASE = 'https://feroz-server.onrender.com';

    // Wire up Add to Cart & Instant Checkout to Stripe
    document.addEventListener('DOMContentLoaded', () => {
      // Hijack buy buttons
      document.querySelectorAll('[data-add-variant], .addCart, [data-add-premium]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          let tier = 'apex';
          const card = btn.closest('#prod-apex, #prod-viper, #prod-mamba') || btn.closest('.prodCard');
          if (card) {
            if (card.id.includes('viper')) tier = 'viper';
            else if (card.id.includes('mamba')) tier = 'mamba';
          }
          if (btn.hasAttribute('data-add-premium')) tier = 'bundle';

          btn.innerText = 'Redirecting...';
          fetch(API_BASE + '/v1/checkout/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier, return_url: window.location.origin })
          })
          .then(r => r.json())
          .then(data => {
            if (data.ok && data.url) window.location.href = data.url;
            else alert('Could not initiate checkout. Please ask in Discord.');
          })
          .catch(() => alert('Checkout service temporarily unavailable.'));
        });
      });

      // Hijack Login button
      const loginBtn = document.querySelector('.fz-login, a[href*="account"], #navGet');
      if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'https://discord.com/api/oauth2/authorize?client_id=1512469722585759866&redirect_uri=https%3A%2F%2Fferoz-server.onrender.com%2Fv1%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify&prompt=consent&state=' + encodeURIComponent(btoa(JSON.stringify({ mode: 'web', origin: window.location.origin + '/portal.html' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
        });
      }
    });
  </script>
</body>
</html>`;

  const outputPath = 'C:/Projects/feroz-zens/storefront/index.html';
  fs.writeFileSync(outputPath, fullHtml, 'utf8');
  console.log(`Saved compiled exact theme to ${outputPath}`);
}

run().catch(console.error);
