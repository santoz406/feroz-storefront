/* ============================================================
   Feroz Zens — theme interactivity
   Ported from the original Claude Design runtime (support.js)
   to framework-free vanilla JS for Shopify.
   ============================================================ */
(function () {
  'use strict';

  var FZ = window.FZ || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- money ---------- */
  function formatMoney(cents) {
    cents = parseInt(cents, 10) || 0;
    var fmt = (FZ.moneyFormat || '${{amount}}');
    var value = (cents / 100).toFixed(2);
    var parts = value.split('.');
    var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var amount = intPart + '.' + parts[1];
    var amountNoDec = intPart;
    return fmt
      .replace(/\{\{\s*amount\s*\}\}/g, amount)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, amountNoDec)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  }

  /* ============================================================
     REVEAL ANIMATIONS (hero stagger + scroll reveal)
     ============================================================ */
  function initReveal() {
    var hero = document.querySelectorAll('.heroV2 [data-reveal]');
    hero.forEach(function (e) {
      e.classList.add('in');
      e.dataset.shown = '1';
    });

    function reveal() {
      var vh = window.innerHeight || 800;
      var i = 0;
      document.querySelectorAll('[data-reveal]:not(.in)').forEach(function (e) {
        if (e.closest('.heroV2')) return;
        if (reduce || e.getBoundingClientRect().top < vh * 0.85) {
          if (!reduce && !e.style.transitionDelay) e.style.transitionDelay = Math.min(i, 4) * 60 + 'ms';
          e.classList.add('in'); e.dataset.shown = '1'; i++;
        }
      });
    }

    function onScroll() {
      reveal();
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var nw = document.getElementById('navWrap');
      if (nw) nw.classList.add('float');
      var bar = document.getElementById('scrollbar');
      if (bar) {
        var docH = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (docH > 0 ? Math.min(1, y / docH) : 0) + ')';
      }
    }

    var startRest = reduce ? 0 : 760;
    [startRest, startRest + 300, startRest + 700, startRest + 1200].forEach(function (ms) { setTimeout(reveal, ms); });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ============================================================
     VIMEO SDK LOADER
     ============================================================ */
  function loadVimeoSDK(cb) {
    if (window.Vimeo && window.Vimeo.Player) {
      cb();
      return;
    }
    if (window.__fzVimeoLoading) {
      window.__fzVimeoQueue = window.__fzVimeoQueue || [];
      window.__fzVimeoQueue.push(cb);
      return;
    }
    window.__fzVimeoLoading = true;
    window.__fzVimeoQueue = [cb];
    var script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.onload = function () {
      var q = window.__fzVimeoQueue || [];
      window.__fzVimeoQueue = [];
      q.forEach(function (fn) { fn(); });
    };
    document.head.appendChild(script);
  }

  /* ============================================================
     HERO VIDEO — autoplay, freeze on last frame
     ============================================================ */
  function initHeroVideo() {
    var iframe = document.querySelector('[data-hero-vimeo]');
    if (iframe && !iframe.dataset.bound) {
      iframe.dataset.bound = '1';
      if (iframe.dataset.src && !iframe.src) iframe.src = iframe.dataset.src;
      var heroMedia = iframe.closest('[data-hero-media]');
      loadVimeoSDK(function () {
        var player = new window.Vimeo.Player(iframe);
        var played = false;
        function showHeroVideo() {
          if (heroMedia) heroMedia.classList.add('is-ready');
        }
        function tryPlay() {
          player.setMuted(true).catch(function () {});
          player.setLoop(true).catch(function () {});
          player.play().catch(function () {});
        }
        player.ready().then(function () {
          player.setLoop(true).catch(function () {});
          player.setCurrentTime(0).catch(function () {}).then(tryPlay);
        }).catch(function () { tryPlay(); });
        player.on('timeupdate', function (data) {
          if (data && data.seconds > 0.03) showHeroVideo();
        });
        player.on('ended', function () {
          player.setCurrentTime(0).then(function () {
            player.play().catch(function () {});
          }).catch(function () {});
        });
        [120, 420, 900, 1700].forEach(function (ms) { setTimeout(tryPlay, ms); });
        window.addEventListener('pointerdown', tryPlay, { once: true });
      });
    }

    var v = document.getElementById('heroVideo');
    if (!v) return;
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.addEventListener('ended', function () {
      try { v.currentTime = 0; v.play().catch(function () {}); } catch (e) {}
    });
    function tryPlay() {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    if (v.readyState >= 2) tryPlay();
    v.addEventListener('loadeddata', tryPlay, { once: true });
    v.addEventListener('canplay', tryPlay, { once: true });
    [80, 300, 800, 1600].forEach(function (ms) { setTimeout(tryPlay, ms); });
    window.addEventListener('pointerdown', tryPlay, { once: true });
  }

  /* ============================================================
     FOOTER STARS
     ============================================================ */
  function initFooterStars() {
    var host = document.getElementById('footStars');
    if (!host || host.dataset.done) return;
    host.dataset.done = '1';
    var svg = '<svg width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">';
    for (var i = 0; i < 70; i++) {
      var x = (Math.random() * 100).toFixed(2);
      var y = (Math.random() * 100).toFixed(2);
      var r = (Math.random() * 1.1 + 0.3).toFixed(2);
      var o = (Math.random() * 0.5 + 0.15).toFixed(2);
      svg += '<circle cx="' + x + '%" cy="' + y + '%" r="' + r + '" fill="#fff" opacity="' + o + '"/>';
    }
    svg += '</svg>';
    host.innerHTML = svg;
  }

  /* ============================================================
     FAQ ACCORDION
     ============================================================ */
  function initFaq(root) {
    (root || document).querySelectorAll('[data-faq-item]').forEach(function (item) {
      var btn = item.querySelector('[data-faq-toggle]');
      if (!btn || btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var open = item.getAttribute('data-open') === '1';
        item.closest('[data-faq-list]').querySelectorAll('[data-faq-item]').forEach(function (o) {
          o.setAttribute('data-open', '0');
        });
        item.setAttribute('data-open', open ? '0' : '1');
      });
    });
  }

  /* ============================================================
     OPTIMIZER CAROUSEL
     ============================================================ */
  function initOptimizer(root) {
    var stage = (root || document).querySelector('[data-opt]');
    if (!stage || stage.dataset.bound) return;
    stage.dataset.bound = '1';
    var slides = [].slice.call(stage.querySelectorAll('[data-opt-slide]'));
    var segs = [].slice.call(stage.querySelectorAll('[data-opt-seg]'));
    var idx = 0;
    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
      segs.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
    }
    var prev = stage.querySelector('[data-opt-prev]');
    var next = stage.querySelector('[data-opt-next]');
    if (prev) prev.addEventListener('click', function () { show(idx - 1); });
    if (next) next.addEventListener('click', function () { show(idx + 1); });
    segs.forEach(function (s, i) { s.addEventListener('click', function () { show(i); }); });
    show(0);
  }

  /* ============================================================
     VIDEO REVIEW PLAYERS — click play/pause, hover scrub, drag-seek
     ============================================================ */
  function initVideoCards(root) {
    (root || document).querySelectorAll('[data-vidcard]').forEach(function (card) {
      if (card.dataset.bound) return;
      card.dataset.bound = '1';
      var v = card.querySelector('video');
      var frame = card.querySelector('[data-review-vimeo]');
      var btn = card.querySelector('[data-playbtn]');
      var bar = card.querySelector('[data-progbar]');
      var seek = card.querySelector('[data-seek]');
      var track = card.querySelector('[data-track]');
      var knob = card.querySelector('[data-knob]');
      var seeking = false;
      var duration = 0;
      function showBtn(s) { if (btn) { btn.style.opacity = s ? '1' : '0'; btn.style.pointerEvents = s ? 'auto' : 'none'; } }
      function paintByRatio(ratio) {
        var p = Math.min(100, Math.max(0, ratio * 100));
        if (bar) bar.style.width = p + '%';
        if (knob) knob.style.left = p + '%';
      }
      function grow(on) { if (track) track.style.height = on ? '6px' : '3px'; if (knob) knob.style.opacity = on ? '1' : '0'; }
      card.addEventListener('mouseenter', function () { grow(true); });
      card.addEventListener('mouseleave', function () { if (!seeking) grow(false); });

      if (frame) {
        function activateFrame(cb) {
          if (!frame.src || frame.src === 'about:blank') {
            if (frame.dataset.src) frame.src = frame.dataset.src;
          }
          loadVimeoSDK(function () {
            if (!card._vimeoPlayer) {
              var player = new window.Vimeo.Player(frame);
              card._vimeoPlayer = player;
              player.ready().then(function () {
                player.setMuted(true).catch(function () {});
                player.setLoop(true).catch(function () {});
                player.getDuration().then(function (d) { duration = d || 0; }).catch(function () {});
                if (cb) cb(player);
              }).catch(function () {});

              player.on('play', function () { card.dataset.playing = '1'; showBtn(false); });
              player.on('pause', function () { delete card.dataset.playing; showBtn(true); });
              player.on('ended', function () {
                // Auto-replay smoothly; prevent Vimeo recommendation end-screens
                player.setCurrentTime(0).then(function () {
                  player.play().catch(function () {});
                }).catch(function () {});
              });
              player.on('timeupdate', function (data) {
                duration = data.duration || duration;
                if (!seeking && duration > 0) {
                  paintByRatio(data.seconds / duration);
                  // Seamless buffer rewind 0.18s before duration so Vimeo never flashes end cards
                  if (duration > 1.5 && data.seconds >= duration - 0.18) {
                    player.setCurrentTime(0).then(function () {
                      player.play().catch(function () {});
                    }).catch(function () {});
                  }
                }
              });

              if (seek && track) {
                function seekTo(clientX) {
                  if (!duration) return;
                  var r = track.getBoundingClientRect();
                  var ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
                  player.setCurrentTime(ratio * duration).catch(function () {});
                  paintByRatio(ratio);
                }
                seek.addEventListener('pointerdown', function (e) {
                  seeking = true; grow(true);
                  try { seek.setPointerCapture(e.pointerId); } catch (err) {}
                  seekTo(e.clientX); e.stopPropagation(); e.preventDefault();
                });
                seek.addEventListener('pointermove', function (e) { if (seeking) { seekTo(e.clientX); e.preventDefault(); } });
                function endSeek() { if (seeking) { seeking = false; grow(card.matches(':hover')); } }
                seek.addEventListener('pointerup', endSeek);
                seek.addEventListener('pointercancel', endSeek);
                seek.addEventListener('click', function (e) { e.stopPropagation(); });
              }
            } else if (cb) {
              cb(card._vimeoPlayer);
            }
          });
        }

        if ('IntersectionObserver' in window) {
          var observer = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
              activateFrame();
              observer.disconnect();
            }
          }, { rootMargin: '200px' });
          observer.observe(card);
        } else {
          activateFrame();
        }

        function toggle() {
          activateFrame(function (player) {
            player.getPaused().then(function (paused) {
              if (paused) {
                player.getEnded().then(function (ended) {
                  var start = ended ? player.setCurrentTime(0) : Promise.resolve();
                  start.then(function () {
                    player.setMuted(true).catch(function () {});
                    player.play().catch(function () {});
                  });
                });
              } else {
                player.pause().catch(function () {});
              }
            }).catch(function () {});
          });
        }
        card.addEventListener('click', toggle);
        if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
        return;
      }

      if (!v) return;
      v.muted = true; v.loop = true; v.playsInline = true; v.currentTime = 0;
      function paint() {
        if (!v.duration) return;
        var p = Math.min(100, Math.max(0, v.currentTime / v.duration * 100));
        if (bar) bar.style.width = p + '%';
        if (knob) knob.style.left = p + '%';
      }
      function toggle() {
        if (v.paused || v.ended) { if (v.ended) v.currentTime = 0; v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else { v.pause(); }
      }
      v.addEventListener('click', toggle);
      if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
      v.addEventListener('play', function () { card.dataset.playing = '1'; showBtn(false); });
      v.addEventListener('pause', function () { delete card.dataset.playing; showBtn(true); });
      v.addEventListener('ended', function () { v.currentTime = 0; v.play().catch(function () {}); });
      v.addEventListener('timeupdate', paint);
      v.addEventListener('loadedmetadata', paint);
      if (seek && track) {
        function seekTo(clientX) {
          if (!v.duration) return;
          var r = track.getBoundingClientRect();
          var ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
          v.currentTime = ratio * v.duration; paint();
        }
        seek.addEventListener('pointerdown', function (e) {
          seeking = true; grow(true);
          try { seek.setPointerCapture(e.pointerId); } catch (err) {}
          seekTo(e.clientX); e.stopPropagation(); e.preventDefault();
        });
        seek.addEventListener('pointermove', function (e) { if (seeking) { seekTo(e.clientX); e.preventDefault(); } });
        function endSeek() { if (seeking) { seeking = false; grow(card.matches(':hover')); } }
        seek.addEventListener('pointerup', endSeek);
        seek.addEventListener('pointercancel', endSeek);
        seek.addEventListener('click', function (e) { e.stopPropagation(); });
      }
    });
  }

  /* ============================================================
     CART (Instant Local Cart + Drawer + Stripe Checkout)
     ============================================================ */
  var CATALOG = {
    apex: { id: 'apex', title: 'Apex | Fortnite', price: 4999, image: 'assets/product-apex.png', game: 'Fortnite' },
    viper: { id: 'viper', title: 'Viper | Call of Duty', price: 4999, image: 'assets/product-viper.png', game: 'Call of Duty' },
    mamba: { id: 'mamba', title: 'Mamba | NBA 2K26', price: 4999, image: 'assets/product-mamba.png', game: 'NBA 2K26' },
    bundle: { id: 'bundle', title: 'All-Access Script Suite', price: 9999, image: 'assets/product-apex.png', game: 'Fortnite · COD · 2K26' }
  };

  var Cart = {
    getItems: function () {
      try {
        var raw = localStorage.getItem('fz_cart');
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    },
    saveItems: function (items) {
      try { localStorage.setItem('fz_cart', JSON.stringify(items)); } catch (e) {}
      this.refresh();
    },
    open: function () {
      var d = document.getElementById('fzCart');
      if (d) { d.hidden = false; document.body.style.overflow = 'hidden'; }
      this.refresh();
    },
    close: function () {
      var d = document.getElementById('fzCart');
      if (d) { d.hidden = true; document.body.style.overflow = ''; }
    },
    add: function (tierId) {
      var key = String(tierId || 'apex').toLowerCase();
      var prod = CATALOG[key] || CATALOG.apex;
      var items = this.getItems();
      var existing = items.find(function (it) { return it.id === prod.id; });
      if (existing) {
        existing.quantity += 1;
      } else {
        items.push({
          id: prod.id,
          title: prod.title,
          price: prod.price,
          image: prod.image,
          game: prod.game,
          quantity: 1
        });
      }
      this.saveItems(items);
      this.open();
    },
    changeQty: function (id, qty) {
      var items = this.getItems();
      if (qty <= 0) {
        items = items.filter(function (it) { return it.id !== id; });
      } else {
        var item = items.find(function (it) { return it.id === id; });
        if (item) item.quantity = qty;
      }
      this.saveItems(items);
    },
    refresh: function () {
      var items = this.getItems();
      var totalCount = items.reduce(function (sum, it) { return sum + it.quantity; }, 0);
      var totalPrice = items.reduce(function (sum, it) { return sum + (it.price * it.quantity); }, 0);
      if (items.length >= 2 && totalPrice > 9999) totalPrice = 9999;
      this.render({ items: items, item_count: totalCount, total_price: totalPrice });
    },
    checkout: function () {
      var items = this.getItems();
      if (!items.length) {
        alert('Your cart is empty. Please select a script.');
        return;
      }
      var tier = 'apex';
      if (items.length >= 2 || items.some(function(it) { return it.id === 'bundle'; })) {
        tier = 'bundle';
      } else {
        tier = items[0].id;
      }

      var checkoutBtn = document.querySelector('[data-cart-checkout]');
      if (checkoutBtn) {
        checkoutBtn.innerText = 'Redirecting to Stripe...';
        checkoutBtn.disabled = true;
      }

      fetch('https://ferozzens.com/v1/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier, return_url: window.location.origin })
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok && data.url) {
          window.location.href = data.url;
        } else {
          alert('Could not initiate checkout: ' + (data.error || 'Server error'));
          if (checkoutBtn) { checkoutBtn.innerText = 'Proceed to Checkout'; checkoutBtn.disabled = false; }
        }
      })
      .catch(function () {
        alert('Checkout service temporarily unreachable.');
        if (checkoutBtn) { checkoutBtn.innerText = 'Proceed to Checkout'; checkoutBtn.disabled = false; }
      });
    },
    render: function (cart) {
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        el.textContent = cart.item_count;
        el.closest('[data-cart-badge]') && (el.closest('[data-cart-badge]').hidden = cart.item_count === 0);
      });
      var body = document.getElementById('fzCartBody');
      var footer = document.getElementById('fzCartFooter');
      if (!body) return;
      if (!cart.items.length) {
        body.innerHTML = '<div style="text-align:center;padding:60px 10px;color:var(--mut);">'
          + '<div style="display:inline-flex;width:54px;height:54px;align-items:center;justify-content:center;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.03);margin-bottom:16px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.1"></circle><circle cx="18" cy="20" r="1.1"></circle><path d="M2.5 3h2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2L21.5 7H6"></path></svg></div>'
          + '<div style="font-size:15px;font-weight:600;color:#d0d0d6;">Your cart is empty</div>'
          + '<div style="font-size:13px;margin-top:6px;">Add a script to get started.</div></div>';
        if (footer) footer.hidden = true;
        return;
      }
      var html = '<div style="display:flex;flex-direction:column;gap:12px;">';
      cart.items.forEach(function (it) {
        html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.03);">'
          + '<img src="' + it.image + '" alt="" width="42" height="42" loading="lazy" style="width:42px;height:42px;object-fit:contain;flex:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5));">'
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:14px;font-weight:600;">' + it.title + '</div>'
          + '<div style="font-size:12px;color:var(--dim);margin-top:2px;">' + it.game + '</div>'
          + '<div style="font-size:12px;color:var(--dim);margin-top:3px;">Qty ' + it.quantity + ' · €' + (it.price / 100).toFixed(2) + '</div>'
          + '</div>'
          + '<div style="font-size:14px;font-weight:600;">€' + ((it.price * it.quantity) / 100).toFixed(2) + '</div>'
          + '<button data-cart-remove="' + it.id + '" aria-label="Remove" style="display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:7px;cursor:pointer;color:var(--mut);border:1px solid var(--line);background:rgba(255,255,255,.03);"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"></path></svg></button>'
          + '</div>';
      });
      html += '</div>';
      body.innerHTML = html;
      if (footer) {
        footer.hidden = false;
        var sub = footer.querySelector('[data-cart-subtotal]');
        if (sub) sub.textContent = '€' + (cart.total_price / 100).toFixed(2);
      }
      body.querySelectorAll('[data-cart-remove]').forEach(function (b) {
        b.addEventListener('click', function () { Cart.changeQty(b.getAttribute('data-cart-remove'), 0); });
      });
    }
  };
  window.FZCart = Cart;

  function initCart() {
    // Cart removed - storefront uses direct Stripe checkout
  }

  /* ============================================================
     SCRIPTS DROPDOWN (nav) — pulse target product
     ============================================================ */
  function initScriptJump() {
    document.querySelectorAll('[data-script-jump]').forEach(function (a) {
      a.addEventListener('click', function () {
        var id = a.getAttribute('data-script-jump');
        var el = document.getElementById(id);
        if (!el) return;
        setTimeout(function () {
          el.classList.add('pulse');
          setTimeout(function () { el.classList.remove('pulse'); }, 650);
        }, 360);
      });
    });
  }

  /* ============================================================
     DESKTOP SMOOTH WHEEL SCROLL - removed 2026-08-23.
     This hand-rolled wheel interception (intercept wheel events, run our
     own requestAnimationFrame easing loop, guess "precision"/trackpad vs
     mouse-wheel input from delta magnitude/timing heuristics) was fighting
     the browser's own native scrolling: the precision-scroll heuristic
     misclassified plenty of ordinary mouse wheels as trackpads (or vice
     versa) tick-to-tick, and even after pinning scrollTo() to
     behavior:'instant' to stop it fighting CSS scroll-behavior:smooth, the
     report was still "scrolling down sometimes jumps back up" - a resync
     race between the animate() loop and the native scroll it was
     overriding. Reset to native scroll (0 JS on the hot path, which is the
     only thing guaranteed to feel right on every input device). Anchor-link
     navigation still eases via the plain CSS `scroll-behavior: smooth` on
     <html> in base.css - no JS, no wheel interception, nothing to fight.
     If a distinct "premium" feel is wanted later, prefer scroll-triggered
     reveal/parallax effects (see initReveal below, IntersectionObserver-
     driven) over anything that intercepts the scroll position itself.
     ============================================================ */

  /* ============================================================
     MOBILE NAV MENU
     ============================================================ */
  function initMobileMenu() {
    var btn = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-menu]');
    if (!btn || !panel || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    function setOpen(open) {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.classList.toggle('is-open', open);
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(panel.hidden); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !e.target.closest('#navWrap')) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 880 && !panel.hidden) setOpen(false);
    }, { passive: true });
  }

  /* ============================================================
     ANIMATION GOVERNOR — pause infinite CSS animations while their
     section is offscreen (battery + scroll smoothness, esp. mobile)
     ============================================================ */
  function initAnimGovernor() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle('fz-anim-off', !en.isIntersecting);
      });
    }, { rootMargin: '200px 0px' });
    document.querySelectorAll('.shopify-section').forEach(function (s) { io.observe(s); });
  }

  /* Release will-change once a reveal transition has finished */
  function initRevealCleanup() {
    document.addEventListener('transitionend', function (e) {
      var t = e.target;
      if (t && t.nodeType === 1 && t.hasAttribute && t.hasAttribute('data-reveal') && t.classList.contains('in')) {
        t.style.willChange = 'auto';
      }
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    initAnimGovernor();
    initRevealCleanup();
    initReveal();
    initHeroVideo();
    initFooterStars();
    initFaq();
    initOptimizer();
    initVideoCards();
    initCart();
    initScriptJump();
    initMobileMenu();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* Shopify theme editor — re-bind when a section is re-rendered */
  document.addEventListener('shopify:section:load', function (e) {
    initFaq(e.target); initOptimizer(e.target);
    initVideoCards(e.target); initFooterStars(); initScriptJump();
    initMobileMenu();
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in'); el.dataset.shown = '1'; });
  });
})();
