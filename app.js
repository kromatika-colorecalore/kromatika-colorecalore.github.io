/* app.js — moderno, leggero, accessibile */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- Constants / links
  const WA_URL =
    "https://wa.me/393398602509?text=Buongiorno%2C%20vorrei%20un%20preventivo%20per%20tinteggiatura%20interni.%20Posso%20avere%20informazioni%3F";

  const MAIL_URL =
    "mailto:colorecalore1974@gmail.com?subject=Richiesta%20informazioni%20-%20KROMATIKA%20%2B%20Colore%26Calore";

  $$("[data-wa-link]").forEach((a) => a.setAttribute("href", WA_URL));
  $$("[data-mail-link]").forEach((a) => a.setAttribute("href", MAIL_URL));

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---- Nav mobile
  const NAV_BP = 1180;
  const mqNav = window.matchMedia(`(max-width: ${NAV_BP}px)`);
  const navBtn = $(".nav-toggle");
  const navMenu = $(".nav-list");

  if (navBtn && navMenu) {
    const sr = $(".sr-only", navBtn);

    const closeMenu = () => {
      navMenu.classList.remove("is-open");
      navBtn.setAttribute("aria-expanded", "false");
      if (sr) sr.textContent = "Apri menu";
    };

    const openMenu = () => {
      navMenu.classList.add("is-open");
      navBtn.setAttribute("aria-expanded", "true");
      if (sr) sr.textContent = "Chiudi menu";
      const firstLink = $("a", navMenu);
      firstLink?.focus();
    };

    navBtn.addEventListener("click", () => {
      const open = navMenu.classList.contains("is-open");
      open ? closeMenu() : openMenu();
    });

    navMenu.addEventListener("click", (e) => {
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      if (!a) return;
      closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("is-open")) {
        closeMenu();
        navBtn.focus();
      }
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("is-open")) return;
      const nav = navBtn.closest(".nav");
      const t = e.target instanceof Element ? e.target : null;
      if (nav && t && nav.contains(t)) return;
      closeMenu();
    });

    window.addEventListener("resize", () => {
      if (!mqNav.matches) closeMenu();
    });
  }

  // ---- Reveal on scroll (IntersectionObserver)
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
  }

  // ---- Carousels (scroll-snap + buttons)
  function initCarousel(root, statusEl) {
    const viewport = $("[data-viewport]", root);
    const prev = $("[data-prev]", root);
    const next = $("[data-next]", root);

    if (!viewport || !prev || !next) return;

    const step = () => {
      // Scorri “quasi” una pagina: dinamico, funziona su qualsiasi device
      return Math.max(240, Math.floor(viewport.clientWidth * 0.9));
    };

    const updateButtons = () => {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const x = viewport.scrollLeft;

      const canPrev = x > 2;
      const canNext = x < maxScroll - 2;

      prev.disabled = !canPrev;
      next.disabled = !canNext;

      // Status ARIA: utile anche per screen reader
      if (statusEl) {
        const pct = maxScroll > 0 ? Math.round((x / maxScroll) * 100) : 0;
        statusEl.textContent = `Scorrimento: ${pct}%`;
      }
    };

    prev.addEventListener("click", () => viewport.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => viewport.scrollBy({ left: step(), behavior: "smooth" }));

    viewport.addEventListener("scroll", () => updateButtons(), { passive: true });
    window.addEventListener("resize", () => updateButtons());

    updateButtons();
  }

  const galleryCarousel = $('[data-carousel="gallery"]');
  const reviewsCarousel = $('[data-carousel="reviews"]');

  initCarousel(galleryCarousel, $("#galleryStatus"));
  initCarousel(reviewsCarousel, $("#reviewsStatus"));

  // ---- Lightbox (dialog) for gallery
  const dlg = $("#lightbox");
  if (dlg) {
    const lbImg = $(".lb-img", dlg);
    const lbTitle = $(".lb-title", dlg);
    const lbCount = $(".lb-count", dlg);
    const btnPrev = $(".lb-nav.prev", dlg);
    const btnNext = $(".lb-nav.next", dlg);
    const btnClose = $(".lb-close", dlg);

    const shots = $$("#galleryTrack .shot");
    const items = shots.map((a, idx) => ({
      href: a.getAttribute("href"),
      title: a.getAttribute("data-title") || a.querySelector("img")?.alt || `Lavoro ${idx + 1}`,
      tag: a.getAttribute("data-tag") || ""
    }));

    let current = 0;
    let lastActive = null;
    let lastScrollY = 0;

    const ZOOM = 1.9;
    let isZoom = false;
    let pan = { x: 0, y: 0 };
    let drag = { on: false, sx: 0, sy: 0, px: 0, py: 0 };

    const lockScroll = () => {
      lastScrollY = window.scrollY || 0;
      document.body.classList.add("lb-lock");
      document.body.style.top = `-${lastScrollY}px`;
    };

    const unlockScroll = () => {
      document.body.classList.remove("lb-lock");
      const top = document.body.style.top;
      document.body.style.top = "";
      const y = top ? Math.abs(parseInt(top, 10)) : lastScrollY;
      window.scrollTo(0, y);
    };

    const preload = (src) => {
      if (!src) return;
      const im = new Image();
      im.decoding = "async";
      im.src = src;
    };

    const preloadNeighbors = () => {
      preload(items[current - 1]?.href);
      preload(items[current + 1]?.href);
    };

    const updateNav = () => {
      btnPrev.disabled = current <= 0;
      btnNext.disabled = current >= items.length - 1;
    };

    const renderCaption = () => {
      if (lbTitle) lbTitle.textContent = items[current]?.title || "";
      if (lbCount) lbCount.textContent = `${current + 1} / ${items.length}`;
    };

    const applyPan = () => {
      if (!lbImg) return;
      if (!isZoom) {
        lbImg.style.transform = "";
        return;
      }
      lbImg.style.transform = `translateY(0) scale(${ZOOM}) translate(${pan.x}px, ${pan.y}px)`;
    };

    const resetZoom = () => {
      isZoom = false;
      pan = { x: 0, y: 0 };
      dlg.classList.remove("is-zoom");
      applyPan();
    };

    const toggleZoom = () => {
      if (!lbImg) return;
      isZoom = !isZoom;
      if (!isZoom) return resetZoom();
      dlg.classList.add("is-zoom");
      pan = { x: 0, y: 0 };
      applyPan();
    };

    const showAt = (index) => {
      if (!lbImg) return;
      const len = items.length;
      current = Math.min(Math.max(index, 0), len - 1);

      resetZoom();
      lbImg.src = items[current].href;
      lbImg.alt = items[current].title;

      preloadNeighbors();
      renderCaption();
      updateNav();
    };

    const openLightbox = (index) => {
      if (!items.length) return;
      lastActive = document.activeElement;
      lockScroll();
      showAt(index);
      dlg.showModal();
      btnClose?.focus();
    };

    const closeLightbox = () => dlg.close();

    shots.forEach((a, idx) => {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openLightbox(idx);
      });
    });

    btnPrev?.addEventListener("click", () => showAt(current - 1));
    btnNext?.addEventListener("click", () => showAt(current + 1));
    btnClose?.addEventListener("click", closeLightbox);

    // Click outside image closes
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) closeLightbox();
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (!dlg.open) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showAt(current - 1);
      if (e.key === "ArrowRight") showAt(current + 1);
      if (e.key.toLowerCase() === "z") toggleZoom();
    });

    // Zoom interactions
    lbImg?.addEventListener("dblclick", (e) => {
      e.preventDefault();
      toggleZoom();
    });

    lbImg?.addEventListener("pointerdown", (e) => {
      if (!isZoom || !lbImg) return;
      drag.on = true;
      drag.sx = e.clientX;
      drag.sy = e.clientY;
      drag.px = pan.x;
      drag.py = pan.y;
      lbImg.setPointerCapture(e.pointerId);
    });

    lbImg?.addEventListener("pointermove", (e) => {
      if (!isZoom || !drag.on) return;
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      pan.x = drag.px + dx / ZOOM;
      pan.y = drag.py + dy / ZOOM;
      applyPan();
    });

    lbImg?.addEventListener("pointerup", () => {
      drag.on = false;
    });

    lbImg?.addEventListener("pointercancel", () => {
      drag.on = false;
    });

    dlg.addEventListener("close", () => {
      resetZoom();
      unlockScroll();
      if (lastActive && typeof lastActive.focus === "function") lastActive.focus();
    });
  }

  // ---- Review media fallback (hide broken images)
  $$(".review-media img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        img.style.display = "none";
        img.parentElement?.classList.add("is-empty");
      },
      { once: true }
    );
  });
})();