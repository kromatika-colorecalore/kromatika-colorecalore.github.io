(() => {
  const NAV_BP = 1180;
  const mqNav = window.matchMedia(`(max-width: ${NAV_BP}px)`);

  const WA_URL =
    "https://wa.me/393398602509?text=Buongiorno%2C%20vorrei%20un%20preventivo%20per%20tinteggiatura%20interni.%20Posso%20avere%20informazioni%3F";

  const MAIL_URL =
    "mailto:colorecalore1974@gmail.com?subject=Richiesta%20informazioni%20-%20KROMATIKA%20%2B%20Colore%26Calore&body=Buongiorno%2C%0A%0Asono%20interessato%20a%20un%20preventivo%20per%20tinteggiatura%20interni.%0APotete%20contattarmi%20a%20questo%20indirizzo%20o%20al%20numero%3A%20%0A%0AGrazie%2C";

  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  document.querySelectorAll("[data-wa]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(WA_URL, "_blank");
    })
  );
  document.querySelectorAll("[data-mail]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = MAIL_URL;
    })
  );

  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav__toggle");
  const list = document.getElementById("menu");

  function setExpanded(expanded) {
    if (!toggle || !list) return;
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    list.classList.toggle("is-open", expanded);
    document.documentElement.classList.toggle("nav-lock", expanded);
    document.body.classList.toggle("nav-lock", expanded);
  }

  function closeMenu() {
    setExpanded(false);
  }

  if (toggle && list) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      setExpanded(!expanded);
    });

    list.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

    document.addEventListener("click", (e) => {
      if (!mqNav.matches) return;
      if (!nav) return;
      if (!nav.contains(e.target)) closeMenu();
    });

    window.addEventListener("resize", () => {
      if (!mqNav.matches) closeMenu();
    });
  }

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReduced) {
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

    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
  }

  function setNavVisible(btnEl, visible) {
    if (!btnEl) return;
    btnEl.disabled = !visible;
    btnEl.tabIndex = visible ? 0 : -1;
    btnEl.setAttribute("aria-disabled", visible ? "false" : "true");
    btnEl.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  function initSlider({ track, prevBtn, nextBtn, statusEl, itemSelector, perView, statusText }) {
    if (!track || !prevBtn || !nextBtn) return;

    const items = Array.from(track.querySelectorAll(itemSelector));
    if (!items.length) {
      setNavVisible(prevBtn, false);
      setNavVisible(nextBtn, false);
      if (statusEl) statusEl.textContent = "";
      return;
    }

    let index = 0;

    const maxIndex = () => Math.max(0, items.length - perView());

    const updateNav = () => {
      const m = maxIndex();
      setNavVisible(prevBtn, index > 0);
      setNavVisible(nextBtn, index < m);
    };

    const updateStatus = () => {
      if (!statusEl) return;
      const pv = perView();
      statusEl.textContent = statusText({
        from: index + 1,
        to: Math.min(index + pv, items.length),
        total: items.length
      });
    };

    const setIndex = (i) => {
      const m = maxIndex();
      index = Math.min(Math.max(i, 0), m);

      const gap = parseFloat(getComputedStyle(track).gap || "0") || 0;
      const itemW = items[0].getBoundingClientRect().width;
      const x = (itemW + gap) * index;

      track.style.transform = `translateX(-${x}px)`;
      updateNav();
      updateStatus();
    };

    prevBtn.addEventListener("click", () => setIndex(index - 1));
    nextBtn.addEventListener("click", () => setIndex(index + 1));
    window.addEventListener("resize", () => setIndex(index));

    setIndex(0);
  }

  initSlider({
    track: document.getElementById("galleryTrack"),
    prevBtn: document.querySelector(".galleryNav--prev"),
    nextBtn: document.querySelector(".galleryNav--next"),
    statusEl: document.getElementById("galleryStatus"),
    itemSelector: ".shot",
    perView: () => {
      if (window.matchMedia("(max-width: 720px)").matches) return 1;
      if (window.matchMedia("(max-width: 980px)").matches) return 2;
      return 4;
    },
    statusText: ({ from, to, total }) => `Galleria: immagini ${from} a ${to} di ${total}.`
  });

  const dlg = document.getElementById("lightbox");
  const dlgImg = dlg ? dlg.querySelector(".lightbox__img") : null;
  const dlgTitle = dlg ? dlg.querySelector(".lb__title") : null;
  const dlgCount = dlg ? dlg.querySelector(".lb__count") : null;
  const prevBtn = dlg ? dlg.querySelector(".lightbox__nav--prev") : null;
  const nextBtn = dlg ? dlg.querySelector(".lightbox__nav--next") : null;
  const closeBtn = dlg ? dlg.querySelector(".lightbox__close") : null;

  const shots = Array.from(document.querySelectorAll("#galleryTrack .shot"));
  const items = shots.map((a, idx) => ({
    href: a.getAttribute("href"),
    alt: a.querySelector("img")?.alt || `Lavoro ${idx + 1}`
  }));

  let current = 0;
  let lastScrollY = 0;
  let lastActiveEl = null;

  let prevScrollBehavior = "";

  const ZOOM_SCALE = 1.9;
  let isZoom = false;
  let pan = { x: 0, y: 0 };
  let drag = { on: false, sx: 0, sy: 0, px: 0, py: 0 };

  function lockScroll() {
    lastScrollY = window.scrollY || 0;

    prevScrollBehavior = document.documentElement.style.scrollBehavior || "";
    document.documentElement.style.scrollBehavior = "auto";

    document.documentElement.classList.add("lb-lock");
    document.body.classList.add("lb-lock");
    document.body.style.top = `-${lastScrollY}px`;
  }

  function unlockScroll() {
    document.documentElement.classList.remove("lb-lock");
    document.body.classList.remove("lb-lock");
    document.body.style.top = "";
    window.scrollTo(0, lastScrollY);

    document.documentElement.style.scrollBehavior = prevScrollBehavior || "";
  }

  function updateLbNav() {
    if (!items.length) return;
    setNavVisible(prevBtn, current > 0);
    setNavVisible(nextBtn, current < items.length - 1);
  }

  function renderCaption() {
    if (dlgTitle) dlgTitle.textContent = items[current]?.alt || "";
    if (dlgCount) dlgCount.textContent = `${current + 1} / ${items.length}`;
  }

  function preloadNeighbors() {
    const prev = items[current - 1]?.href;
    const next = items[current + 1]?.href;

    [prev, next].filter(Boolean).forEach((src) => {
      const im = new Image();
      im.src = src;
    });
  }

  function applyPan() {
    if (!dlgImg) return;
    dlgImg.style.transform = `scale(${isZoom ? ZOOM_SCALE : 1}) translate(${pan.x}px, ${pan.y}px)`;
  }

  function resetZoom() {
    isZoom = false;
    pan = { x: 0, y: 0 };
    if (dlg) dlg.classList.remove("is-zoom");
    applyPan();
  }

  function toggleZoom() {
    if (!dlg || !dlgImg) return;
    isZoom = !isZoom;
    if (!isZoom) {
      resetZoom();
      return;
    }
    dlg.classList.add("is-zoom");
    pan = { x: 0, y: 0 };
    applyPan();
  }

  function showAt(index) {
    if (!dlg || !dlgImg) return;
    const len = items.length;

    current = Math.min(Math.max(index, 0), len - 1);
    resetZoom();

    dlgImg.classList.remove("is-loaded");
    dlgImg.src = items[current].href;
    dlgImg.alt = items[current].alt;

    preloadNeighbors();
    renderCaption();
    updateLbNav();

    dlgImg.addEventListener("load", () => dlgImg.classList.add("is-loaded"), { once: true });
    dlgImg.addEventListener("error", () => dlgImg.classList.add("is-loaded"), { once: true });
  }

  function openLightbox(index, triggerEl) {
    if (!dlg || !items.length) return;
    lastActiveEl = triggerEl || shots[index] || document.activeElement;
    lockScroll();
    showAt(index);
    dlg.showModal();
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!dlg) return;
    dlg.close();
  }

  shots.forEach((a, idx) => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      openLightbox(idx, a);
    });
  });

  if (prevBtn) prevBtn.addEventListener("click", () => showAt(current - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => showAt(current + 1));
  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);

  if (dlgImg) {
    dlgImg.addEventListener("dblclick", (e) => {
      e.preventDefault();
      toggleZoom();
    });

    dlgImg.addEventListener("click", () => {
      if (isZoom) return;
      if (dlg) dlg.classList.toggle("is-ui-hidden");
    });

    dlgImg.addEventListener("pointerdown", (e) => {
      if (!isZoom) return;
      drag.on = true;
      drag.sx = e.clientX;
      drag.sy = e.clientY;
      drag.px = pan.x;
      drag.py = pan.y;
      dlgImg.setPointerCapture(e.pointerId);
    });

    dlgImg.addEventListener("pointermove", (e) => {
      if (!isZoom || !drag.on) return;
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      pan.x = drag.px + dx / ZOOM_SCALE;
      pan.y = drag.py + dy / ZOOM_SCALE;
      applyPan();
    });

    dlgImg.addEventListener("pointerup", () => (drag.on = false));
    dlgImg.addEventListener("pointercancel", () => (drag.on = false));
  }

  if (dlg) {
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) closeLightbox();
    });

    dlg.addEventListener("close", () => {
      if (dlg) dlg.classList.remove("is-ui-hidden");
      resetZoom();

      unlockScroll();

      if (lastActiveEl && typeof lastActiveEl.focus === "function") {
        requestAnimationFrame(() => {
          try {
            lastActiveEl.focus({ preventScroll: true });
          } catch {
            lastActiveEl.focus();
          }
          requestAnimationFrame(() => window.scrollTo(0, lastScrollY));
        });
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (!dlg || !dlg.open) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showAt(current - 1);
    if (e.key === "ArrowRight") showAt(current + 1);
    if (e.key.toLowerCase() === "z") toggleZoom();
  });

  let sx = 0;
  if (dlgImg) {
    dlgImg.addEventListener("touchstart", (e) => (sx = e.touches[0]?.clientX || 0), { passive: true });

    dlgImg.addEventListener(
      "touchend",
      (e) => {
        if (isZoom) return;
        const ex = e.changedTouches[0]?.clientX || 0;
        const dx = ex - sx;

        if (Math.abs(dx) > 40) {
          if (dx > 0 && current > 0) showAt(current - 1);
          if (dx < 0 && current < items.length - 1) showAt(current + 1);
        }
      },
      { passive: true }
    );
  }

  initSlider({
    track: document.getElementById("reviewsTrack"),
    prevBtn: document.querySelector(".reviewsNav--prev"),
    nextBtn: document.querySelector(".reviewsNav--next"),
    statusEl: document.getElementById("reviewsStatus"),
    itemSelector: ".reviewSlide",
    perView: () => (window.matchMedia("(max-width: 980px)").matches ? 1 : 3),
    statusText: ({ from, to, total }) => `Recensioni: ${from} a ${to} di ${total}.`
  });

  function ensureReviewDialog() {
    let dlg = document.getElementById("reviewDialog");
    if (dlg) return dlg;

    dlg = document.createElement("dialog");
    dlg.id = "reviewDialog";
    dlg.className = "reviewDialog";
    dlg.innerHTML = `
      <div class="reviewDialog__inner">
        <div class="reviewDialog__top">
          <div>
            <p class="reviewDialog__name" id="reviewDlgName"></p>
            <div class="reviewDialog__meta" id="reviewDlgMeta"></div>
            <div class="reviewDialog__job" id="reviewDlgJob"></div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:10px;">
            <div class="reviewDialog__stars" id="reviewDlgStars" aria-label="Valutazione"></div>
            <button class="reviewDialog__close" type="button" aria-label="Chiudi">×</button>
          </div>
        </div>

        <div class="reviewDialog__media" id="reviewDlgMedia" style="display:none;">
          <img alt="Foto collegata alla recensione" />
        </div>

        <div class="reviewDialog__text" id="reviewDlgText"></div>
      </div>
    `;
    document.body.appendChild(dlg);

    dlg.querySelector(".reviewDialog__close").addEventListener("click", () => dlg.close());

    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });

    return dlg;
  }

  function starHTML(count) {
    const full = Math.max(0, Math.min(5, Number(count) || 0));
    let s = "";
    for (let i = 0; i < 5; i++) s += i < full ? "★" : "☆";
    return s;
  }

  function openReviewDialog(slide) {
    const dlg = ensureReviewDialog();

    const name = slide.querySelector(".reviewName")?.textContent?.trim() || "";
    const meta = slide.querySelector(".reviewMeta")?.textContent?.trim() || "";
    const job = slide.querySelector(".reviewJob")?.textContent?.trim() || "";
    const text = slide.querySelector(".reviewText")?.textContent?.trim() || "";
    const stars = slide.getAttribute("data-stars") || "5";

    const img = slide.querySelector(".reviewMedia img");
    const hasImg = !!(img && img.getAttribute("src"));

    dlg.querySelector("#reviewDlgName").textContent = name;
    dlg.querySelector("#reviewDlgMeta").textContent = meta;
    dlg.querySelector("#reviewDlgJob").textContent = job;
    dlg.querySelector("#reviewDlgText").textContent = text;

    const st = dlg.querySelector("#reviewDlgStars");
    st.textContent = starHTML(stars);

    const mediaWrap = dlg.querySelector("#reviewDlgMedia");
    const mediaImg = mediaWrap.querySelector("img");

    if (hasImg) {
      mediaImg.src = img.getAttribute("src");
      mediaImg.alt = img.getAttribute("alt") || "Foto collegata alla recensione";
      mediaWrap.style.display = "";
    } else {
      mediaImg.removeAttribute("src");
      mediaWrap.style.display = "none";
    }

    dlg.showModal();
  }

  function isTextTruncated(el) {
    if (!el) return false;
    return el.scrollHeight > el.clientHeight + 2;
  }

  function addReviewReadMoreButtons() {
    const isMobile = window.matchMedia("(max-width: 980px)").matches;

    document.querySelectorAll(".reviewSlide").forEach((slide) => {
      const p = slide.querySelector(".reviewText");
      if (!p) return;

      const existing = slide.querySelector(".reviewMore");

      if (!isMobile) {
        if (existing) existing.remove();
        return;
      }

      requestAnimationFrame(() => {
        const needsButton = isTextTruncated(p);
        const btnNow = slide.querySelector(".reviewMore");

        if (needsButton && !btnNow) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "reviewMore";
          b.textContent = "Leggi tutta";
          b.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openReviewDialog(slide);
          });
          p.insertAdjacentElement("afterend", b);
        }

        if (!needsButton && btnNow) {
          btnNow.remove();
        }
      });
    });
  }

  addReviewReadMoreButtons();
  window.addEventListener("resize", addReviewReadMoreButtons);

  function initReviewMediaFallback() {
    document.querySelectorAll(".reviewMedia img").forEach((img) => {
      img.addEventListener(
        "error",
        () => {
          img.style.display = "none";
          img.parentElement?.classList.add("is-empty");
        },
        { once: true }
      );
    });
  }

  initReviewMediaFallback();
})();
