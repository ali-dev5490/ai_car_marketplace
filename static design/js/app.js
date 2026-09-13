(function () {
  const PATH_MAP = {
  "browse-cars": "browse-search-results-7cbcb16f.html",
  "ai-search": "browse-search-results-7cbcb16f.html",
  "compare-cars": "browse-search-results-7cbcb16f.html",
  "how-it-works": "public-marketplace-home-b3a5a579.html",
  "saved-cars": "user-account-hub-my-listings-34b65c2a.html",
  "sell-car-ai": "sell-with-ai-photo-upload-ocr-specs-extraction-f2e7563a.html",
  "customer-portal": "user-account-hub-my-listings-34b65c2a.html",
  "payments": "escrow-payment-biometric-handover-confirmation-f851fba2.html",
  "enquiries-inbox": "buyer-seller-enquiries-inbox-7d90ff87.html",
  "admin-switch": "design-system-ui-kit-board-fd998556.html",
  "certified-inspection": "car-details-toyota-prado-tx-l-2022-0f486dac.html",
  "valuation-tool": "sell-with-ai-step-3-review-specs-pkr-price-lock-66376633.html",
  "dealer-program": "user-account-hub-my-listings-34b65c2a.html",
  "terms-conditions": "design-system-ui-kit-board-fd998556.html",
  "privacy-policy": "design-system-ui-kit-board-fd998556.html",
  "escrow-rules": "escrow-payment-biometric-handover-confirmation-f851fba2.html"
};

  function currentFile() {
    return decodeURIComponent((location.pathname.split("/").pop() || "").split("?")[0]);
  }

  function injectNav() {
    const pages = window.STITCH_PAGES || [];
    if (!pages.length) return;
    const file = currentFile();
    const idx = pages.findIndex((p) => p.file === file);
    if (idx < 0) return;
    const prev = pages[(idx - 1 + pages.length) % pages.length];
    const next = pages[(idx + 1) % pages.length];
    const page = pages[idx];

    const bar = document.createElement("div");
    bar.id = "stitch-proto-nav";
    bar.innerHTML = `
      <a class="spn-home" href="index.html" title="All screens">All screens</a>
      <a class="spn-btn" href="${prev.file}" title="${prev.title}">← Prev</a>
      <span class="spn-title">${idx + 1}/${pages.length} · ${page.title}</span>
      <a class="spn-btn" href="${next.file}" title="${next.title}">Next →</a>
    `;
    document.body.appendChild(bar);

    document.addEventListener("keydown", (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft") location.href = prev.file;
      if (e.key === "ArrowRight") location.href = next.file;
      if (e.key === "Escape") location.href = "index.html";
    });
  }

  function wirePaths() {
    document.querySelectorAll("[data-path]").forEach((el) => {
      const key = el.getAttribute("data-path");
      const href = PATH_MAP[key];
      if (href) el.setAttribute("href", href);
    });
  }

  function styleNav() {
    const css = document.createElement("style");
    css.textContent = `
      #stitch-proto-nav {
        position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
        z-index: 99999; display: flex; align-items: center; gap: 10px;
        padding: 8px 12px; border-radius: 999px;
        background: rgba(11,28,48,0.92); color: #fff;
        font: 600 12px/1.2 Inter, system-ui, sans-serif;
        box-shadow: 0 8px 24px rgba(15,23,42,0.25);
        max-width: calc(100vw - 24px);
      }
      #stitch-proto-nav a { color: #fff; text-decoration: none; white-space: nowrap; }
      #stitch-proto-nav .spn-btn, #stitch-proto-nav .spn-home {
        background: #2563eb; padding: 6px 10px; border-radius: 999px;
      }
      #stitch-proto-nav .spn-home { background: #0f172a; }
      #stitch-proto-nav .spn-title {
        max-width: 42vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
    `;
    document.head.appendChild(css);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      styleNav();
      injectNav();
      wirePaths();
    });
  } else {
    styleNav();
    injectNav();
    wirePaths();
  }
})();
