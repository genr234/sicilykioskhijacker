// ==UserScript==
// @name         Yui
// @namespace    https://yui.sicilykiosk.genr234.com/
// @version      1.0rc
// @description  A fully featured, battery included SicilyKiosk jailbreak
// @author       genr234
// @include      https://*.sicilykiosk.genr234.com/*
// @include      https://sicilykioskuser-*.flazio.com/*
// @include      https://sicilykioskuser.flazio.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";
  console.log("Yui running on", location.hostname);

  function waitForElement(selector, callback) {
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        callback(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function watchXPath(xpath, callback) {
    const observer = new MutationObserver(() => {
      const el = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      if (el) {
        observer.disconnect();
        callback(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Simple event system
  const YuiEvents = {
    handlers: {},
    on(evt, fn) {
      (this.handlers[evt] ||= new Set()).add(fn);
      return () => this.off(evt, fn);
    },
    off(evt, fn) {
      this.handlers[evt]?.delete(fn);
    },
    emit(evt, data) {
      (this.handlers[evt] || []).forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error("[YuiEvents]", evt, e);
        }
      });
    },
  };

  const YUI_PREF_KEY = "yui_prefs";
  const YuiPrefs = {
    defaults: {
      theme: "light", // light | dark | high-contrast
      securityPatch: "auto", // auto | off
      accent: "#d2a400",
      restoreLastPage: true,
      lastPage: "Home",
      pinHash: null, // SHA-256 hex of PIN
    },
    current: null,
    _styleInjected: false,
    init() {
      const stored = (GM_getValue && GM_getValue(YUI_PREF_KEY)) || {};
      this.current = { ...this.defaults, ...(stored || {}) };
      if (!this._styleInjected) this._injectStyle();
      YuiEvents.emit("prefs:loaded", { prefs: this.current });
      return this.current;
    },
    save() {
      try {
        GM_setValue && GM_setValue(YUI_PREF_KEY, this.current);
        YuiEvents.emit("prefs:saved", { prefs: this.current });
      } catch (e) {
        console.warn("YuiPrefs.save failed", e);
      }
    },
    update(partial) {
      this.current = { ...this.current, ...(partial || {}) };
      this.save();
      if (partial.theme || partial.accent) this.applyTheme();
      YuiEvents.emit("prefs:updated", {
        prefs: this.current,
        changed: partial,
      });
    },
    setLastPage(page) {
      if (!this.current.restoreLastPage) return;
      if (this.current.lastPage === page) return;
      // Don't save app pages as last page - only save system pages
      if (page && page.startsWith("App:")) return;
      this.current.lastPage = page;
      this.save();
    },
    clearPin() {
      this.update({ pinHash: null });
    },
    async setPin(pin) {
      const hash = await this.hashPin(pin);
      this.update({ pinHash: hash });
    },
    async verifyPin(pin) {
      if (!this.current.pinHash) return true;
      const hash = await this.hashPin(pin);
      return hash === this.current.pinHash;
    },
    async hashPin(pin) {
      try {
        const enc = new TextEncoder().encode(String(pin));
        const buf = await crypto.subtle.digest("SHA-256", enc);
        return Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } catch (_) {
        let h = 0;
        const s = String(pin);
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
        return "fallback_" + Math.abs(h).toString(16);
      }
    },
    applyTheme() {
      const menu = document.getElementById("yui-menu");
      if (menu) {
        menu.dataset.theme = this.current.theme;
        menu.style.setProperty("--yui-accent", this.current.accent);
      }
      if (YuiNav && typeof YuiNav._highlightActive === "function") {
        try {
          YuiNav._highlightActive();
        } catch (_) {}
      }
    },
    ensurePinThen(cb) {
      if (!this.current.pinHash) {
        cb();
        return;
      }
      if (document.getElementById("yui-pin-overlay")) return; // already open
      const overlay = document.createElement("div");
      overlay.id = "yui-pin-overlay";
      overlay.style.position = "fixed";
      overlay.style.inset = 0;
      overlay.style.background = "rgba(0,0,0,0.55)";
      overlay.style.backdropFilter = "blur(6px)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = 10000;
      const panel = document.createElement("div");
      panel.style.background = "#fff";
      panel.style.padding = "24px 28px";
      panel.style.borderRadius = "16px";
      panel.style.minWidth = "280px";
      panel.style.fontFamily = "system-ui, sans-serif";
      panel.style.boxShadow = "0 10px 40px rgba(0,0,0,0.35)";
      panel.innerHTML = `<h3 style="margin:0 0 12px;font-size:20px;text-align:center;">Enter PIN</h3>`;
      const input = document.createElement("input");
      input.type = "password";
      input.inputMode = "numeric";
      input.autofocus = true;
      input.style.fontSize = "20px";
      input.style.width = "100%";
      input.style.padding = "10px 12px";
      input.style.textAlign = "center";
      input.style.border = "2px solid #333";
      input.style.borderRadius = "8px";
      panel.appendChild(input);
      const grid = document.createElement("div");
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "repeat(3, 1fr)";
      grid.style.gap = "8px";
      grid.style.margin = "14px 0 8px";
      const makeBtn = (t) => {
        const b = document.createElement("button");
        b.textContent = t;
        b.style.fontSize = "18px";
        b.style.padding = "10px 0";
        b.style.border = "2px solid #222";
        b.style.borderRadius = "10px";
        b.style.background = "linear-gradient(#fafafa,#e0e0e0)";
        b.style.cursor = "pointer";
        b.addEventListener(
          "click",
          () => {
            if (t === "←") input.value = input.value.slice(0, -1);
            else input.value += t;
          },
          { passive: true }
        );
        return b;
      };
      [1, 2, 3, 4, 5, 6, 7, 8, 9, "←", 0].forEach((n) =>
        grid.appendChild(makeBtn(String(n)))
      );
      panel.appendChild(grid);
      const status = document.createElement("div");
      status.style.minHeight = "18px";
      status.style.fontSize = "13px";
      status.style.textAlign = "center";
      status.style.color = "#b00";
      panel.appendChild(status);
      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "10px";
      const cancel = document.createElement("button");
      cancel.textContent = "Cancel";
      cancel.style.flex = "1";
      const ok = document.createElement("button");
      ok.textContent = "Unlock";
      ok.style.flex = "2";
      [cancel, ok].forEach((b) => {
        b.style.fontSize = "16px";
        b.style.padding = "10px 0";
        b.style.border = "2px solid #222";
        b.style.borderRadius = "10px";
        b.style.background = "linear-gradient(#fafafa,#eaeaea)";
        b.style.cursor = "pointer";
      });
      cancel.onclick = () => overlay.remove();
      ok.onclick = async () => {
        const pass = await this.verifyPin(input.value.trim());
        if (pass) {
          overlay.remove();
          cb();
        } else {
          status.textContent = "Incorrect PIN";
          input.value = "";
          input.focus();
        }
      };
      actions.appendChild(cancel);
      actions.appendChild(ok);
      panel.appendChild(actions);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") ok.click();
        if (e.key === "Escape") cancel.click();
      });
    },
    exportPrefs() {
      try {
        const str = JSON.stringify(this.current, null, 2);
        GM_setClipboard && GM_setClipboard(str, { type: "text" });
        YuiEvents.emit("prefs:export", {});
        return str;
      } catch (e) {
        console.warn(e);
      }
    },
    importPrefs(json) {
      try {
        const data = JSON.parse(json);
        this.update(data);
        YuiEvents.emit("prefs:import", {});
      } catch (e) {
        alert("Invalid preferences JSON");
      }
    },
    _injectStyle() {
      if (this._styleInjected) return;
      const css = `#yui-menu{--yui-accent:${this.current.accent};}
      #yui-menu button[data-active="true"]{outline:none}
      #yui-menu[data-theme="dark"]{background:#1e1f24;color:#f5f5f5;border-color:#444}
      #yui-menu[data-theme="dark"] #yui-menu-content{background:#2a2b31;border-color:#555;color:#f0f0f0}
      #yui-menu[data-theme="dark"] button{background:linear-gradient(#3a3b42,#2f3036);color:#f5f5f5;border-color:#555}
      #yui-menu[data-theme="high-contrast"]{background:#000;color:#fff;border-color:#fff}
      #yui-menu[data-theme="high-contrast"] #yui-menu-content{background:#000;border-color:#fff;color:#fff}
      #yui-menu[data-theme="high-contrast"] button{background:#000;color:#fff;border-color:#fff}
      #yui-menu button:focus-visible{box-shadow:0 0 0 3px var(--yui-accent, #d2a400) inset !important}
      #yui-menu[data-fullscreen="true"]{width:95vw;height:95vh;max-width:none;max-height:none}
      #yui-menu[data-fullscreen="true"] #yui-menu-content{flex:1;max-height:none;min-height:none}
      #yui-pin-overlay input{letter-spacing:4px;}
      `;
      const style = document.createElement("style");
      style.id = "yui-pref-style";
      style.textContent = css;
      document.head.appendChild(style);
      this._styleInjected = true;
    },
    patchVulnerabilities() {
      if (this.current.securityPatch === "off") return;
      const iframeDisabler = document.createElement("style");
      iframeDisabler.id = "yui-iframe-blocker";
      iframeDisabler.textContent = `
        iframe {
          pointer-events: none;
          user-select: none;
        }
        iframe[yui-security-ignore="true"] {
          pointer-events: auto;
          user-select: auto;
        }
      `;
      document.head.appendChild(iframeDisabler);
    },
  };
  YuiPrefs.init();
  YuiPrefs.patchVulnerabilities();

  // Update last page on navigation
  YuiEvents.on("nav:show", ({ page }) => {
    try {
      YuiPrefs.setLastPage(page);
    } catch (_) {}
  });

  const YuiNav = {
    pages: {},
    current: null,
    menuEl: null,
    contentEl: null,
    navBarEl: null,
    fullscreen: false,
    fullscreenHideNav: false,
    register(name, renderFn, options = {}) {
      this.pages[name] = { render: renderFn, options: options || {} };
      if (this.navBarEl) this._ensureNavButton(name);
      // Don't auto-show apps or pages, let the menu decide what to show
      if (!this.current && !name.startsWith("App:")) this.show(name);
      YuiEvents.emit("nav:registered", { page: name });
    },
    show(name) {
      const meta = this.pages[name];
      if (!meta) return console.warn("YuiNav: Unknown page", name);
      this.current = name;
      if (!this.contentEl) return;
      const shouldFullscreen = !!meta.options.fullscreen;
      const immersive = shouldFullscreen && meta.options.immersive === true;
      this.setFullscreen(shouldFullscreen, immersive);
      this.contentEl.textContent = "";
      try {
        const result =
          meta.render(this.contentEl, {
            fullscreen: shouldFullscreen,
            immersive,
            exitFullscreen: () => this.setFullscreen(false),
            enterFullscreen: () => this.setFullscreen(true, immersive),
            show: (n) => this.show(n),
            events: YuiEvents,
          }) || null;
        if (result instanceof Node) this.contentEl.appendChild(result);
      } catch (e) {
        console.error("YuiNav: error rendering page", name, e);
        const pre = document.createElement("pre");
        pre.textContent = String(e.stack || e);
        pre.style.whiteSpace = "pre-wrap";
        pre.style.color = "#b00";
        this.contentEl.appendChild(pre);
      }
      this._highlightActive();
      YuiEvents.emit("nav:show", { page: name });
    },
    setFullscreen(state, hideNav = false) {
      this.fullscreen = state;
      this.fullscreenHideNav = hideNav;
      if (!this.menuEl) return;
      if (state) {
        this.menuEl.setAttribute("data-fullscreen", "true");
        if (this.navBarEl)
          this.navBarEl.style.display = hideNav ? "none" : "flex";
        if (this.contentEl) {
          // Remove height constraints for true fullscreen
          this.contentEl.style.maxHeight = "none";
          this.contentEl.style.minHeight = "none";
          this.contentEl.style.height = "auto";
        }
      } else {
        this.menuEl.removeAttribute("data-fullscreen");
        if (this.navBarEl) this.navBarEl.style.display = "flex";
        if (this.contentEl) {
          this.contentEl.style.maxHeight = "50vh";
          this.contentEl.style.minHeight = "160px";
          this.contentEl.style.height = "auto";
        }
      }
      YuiEvents.emit("nav:fullscreen", { state, hideNav });
    },
    _highlightActive() {
      if (!this.navBarEl) return;
      this.navBarEl.querySelectorAll("button[data-yui-page]").forEach((btn) => {
        if (btn.getAttribute("data-yui-page") === this.current) {
          btn.dataset.active = "true";
          const accent =
            (YuiPrefs.current && YuiPrefs.current.accent) || "#d2a400";
          btn.style.background = `linear-gradient(${accent}22, ${accent}55)`;
          btn.style.boxShadow = `0 0 0 2px ${accent} inset, 0 2px 6px rgba(0,0,0,0.25)`;
        } else {
          btn.dataset.active = "false";
          btn.style.background = "linear-gradient(#fafafa, #eaeaea)";
          btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
        }
      });
    },
    _ensureNavButton(name) {
      if (!this.navBarEl) return;
      if (this.navBarEl.querySelector(`button[data-yui-page="${name}"]`))
        return;
      const meta = this.pages[name];
      if (meta && meta.options && meta.options.hideNavButton) return;
      const btn = document.createElement("button");
      const icon = meta?.options?.icon ? meta.options.icon + " " : "";
      btn.textContent = icon + name;
      btn.setAttribute("data-yui-page", name);
      btn.addEventListener("click", () => this.show(name), { passive: true });
      this.navBarEl.insertBefore(
        btn,
        this.navBarEl.querySelector("button[data-yui-role='close']")
      );
      this._highlightActive();
    },
    remove(name) {
      if (!this.pages[name]) return;
      delete this.pages[name];
      if (this.navBarEl) {
        const btn = this.navBarEl.querySelector(
          `button[data-yui-page="${name}"]`
        );
        if (btn) btn.remove();
      }
      if (this.current === name) {
        const fallback = Object.keys(this.pages)[0];
        if (fallback) this.show(fallback);
        else this.contentEl && (this.contentEl.textContent = "");
      }
      YuiEvents.emit("nav:removed", { page: name });
    },
  };

  // Context menu system (right click / long press)
  const YuiContext = (() => {
    let menuEl = null;
    function close() {
      if (menuEl && menuEl.parentNode) menuEl.parentNode.removeChild(menuEl);
      menuEl = null;
      document.removeEventListener("mousedown", onDocDown, true);
    }
    function onDocDown(e) {
      if (!menuEl) return;
      if (!menuEl.contains(e.target)) close();
    }
    function open(x, y, items) {
      close();
      menuEl = document.createElement("div");
      menuEl.style.position = "fixed";
      menuEl.style.left = x + "px";
      menuEl.style.top = y + "px";
      menuEl.style.background = "#fff";
      menuEl.style.border = "1px solid #333";
      menuEl.style.padding = "4px";
      menuEl.style.fontSize = "14px";
      menuEl.style.borderRadius = "6px";
      menuEl.style.zIndex = 10001;
      menuEl.style.minWidth = "160px";
      menuEl.style.boxShadow = "0 4px 18px rgba(0,0,0,0.25)";
      items.forEach((it) => {
        if (it.separator) {
          const hr = document.createElement("div");
          hr.style.margin = "4px 2px";
          hr.style.height = "1px";
          hr.style.background = "#ddd";
          menuEl.appendChild(hr);
          return;
        }
        const btn = document.createElement("button");
        btn.textContent = it.label;
        btn.style.display = "block";
        btn.style.width = "100%";
        btn.style.textAlign = "left";
        btn.style.padding = "6px 10px";
        btn.style.background = it.disabled ? "#f5f5f5" : "#fff";
        btn.style.border = "none";
        btn.style.cursor = it.disabled ? "not-allowed" : "pointer";
        btn.style.fontSize = "inherit";
        btn.style.fontFamily = "inherit";
        btn.onmouseenter = () => {
          if (!it.disabled) btn.style.background = "#eee";
        };
        btn.onmouseleave = () => {
          if (!it.disabled) btn.style.background = "#fff";
        };
        if (!it.disabled) {
          btn.addEventListener(
            "click",
            () => {
              close();
              try {
                it.action && it.action();
              } catch (e) {
                console.error(e);
              }
            },
            { passive: true }
          );
        }
        menuEl.appendChild(btn);
      });
      document.body.appendChild(menuEl);
      requestAnimationFrame(() => {
        const rect = menuEl.getBoundingClientRect();
        if (rect.right > window.innerWidth)
          menuEl.style.left = window.innerWidth - rect.width - 8 + "px";
        if (rect.bottom > window.innerHeight)
          menuEl.style.top = window.innerHeight - rect.height - 8 + "px";
      });
      document.addEventListener("mousedown", onDocDown, true);
    }
    function bind(el, getItems) {
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const items = getItems(e) || [];
        if (!items.length) return;
        open(e.clientX, e.clientY, items);
      });
      let touchTimer = null;
      el.addEventListener(
        "touchstart",
        (e) => {
          const t = e.touches[0];
          touchTimer = setTimeout(() => {
            const items = getItems(e) || [];
            if (!items.length) return;
            open(t.clientX, t.clientY, items);
          }, 650);
        },
        { passive: true }
      );
      ["touchend", "touchcancel", "touchmove"].forEach((ev) =>
        el.addEventListener(
          ev,
          () => {
            if (touchTimer) {
              clearTimeout(touchTimer);
              touchTimer = null;
            }
          },
          { passive: true }
        )
      );
    }
    return { open, close, bind };
  })();

  const YuiApps = {
    apps: {},
    register(def) {
      if (typeof def === "function") def = def();
      if (!def || !def.id) return console.warn("YuiApps.register: missing id");
      if (this.apps[def.id]) console.warn("YuiApps: overwriting app", def.id);
      def.name = def.name || def.id;
      def.version = def.version || "0.0.0";
      this.apps[def.id] = def;
      if (def.render) {
        const pageName = `App:${def.name}`;
        YuiNav.register(
          pageName,
          (root, ctx) => def.render(root, { ...ctx, app: def }),
          {
            fullscreen: !!def.fullscreen,
            immersive: !!def.immersive,
            icon: def.icon,
            hideNavButton: true, // Don't show apps in nav menu
          }
        );
      }
      if (YuiNav.current === "Apps") YuiNav.show("Apps");
      YuiEvents.emit("app:registered", { app: def });
      return def;
    },
    unregister(id) {
      const def = this.apps[id];
      if (!def) return;
      delete this.apps[id];
      const pageName = `App:${def.name}`;
      YuiNav.remove(pageName);
      if (YuiNav.current === pageName) YuiNav.show("Home");
      if (YuiNav.current === "Apps") YuiNav.show("Apps");
      YuiEvents.emit("app:unregistered", { app: def });
    },
    list() {
      return Object.values(this.apps);
    },
    install(manifest) {
      if (typeof manifest === "string") return this.fetch(manifest);
      return this.register(manifest);
    },
    find(id) {
      return this.apps[id] || null;
    },
    fetch(url) {
      return new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== "function") {
          reject(new Error("GM_xmlhttpRequest not available"));
          return;
        }
        GM_xmlhttpRequest({
          method: "GET",
          url,
          onload: (res) => {
            try {
              const text = res.responseText;
              let data;
              try {
                data = JSON.parse(text);
              } catch (_) {}
              if (data && data.id) {
                resolve(this.register(data));
                return;
              }
              const fn = new Function(
                "Yui",
                "YuiApps",
                "return (function(){\n" + text + "\n})();"
              );
              const maybe = fn(unsafeWindow.Yui || {}, this);
              if (maybe && typeof maybe === "object" && maybe.id)
                resolve(this.register(maybe));
              else resolve(maybe);
            } catch (e) {
              reject(e);
            }
          },
          onerror: (e) => reject(e),
        });
      });
    },
  };

  watchXPath("//span[text()='113']", (el) => {
    const newEl = document.createElement("span");
    newEl.textContent = "113";
    newEl.style.color = "red";
    newEl.style.fontWeight = "bold";
    newEl.onclick = () => {
      GM_setValue("yui_disabled", !GM_getValue("yui_disabled", false));
      location.reload();
    };
    el.replaceWith(newEl);
  });

  function spawnMenu() {
    if (document.getElementById("yui-menu")) return;

    const menu = document.createElement("div");
    menu.id = "yui-menu";
    menu.style.position = "fixed";
    menu.style.top = "50%";
    menu.style.left = "50%";
    menu.style.transform = "translate(-50%, -50%)";
    menu.style.backgroundColor = "#fff";
    menu.style.border = "2px solid #000";
    menu.style.borderRadius = "12px";
    menu.style.boxShadow = "0 8px 32px rgba(0,0,0,0.35)";
    menu.style.zIndex = 10000;
    menu.style.display = "flex";
    menu.style.flexDirection = "column";
    menu.style.alignItems = "stretch";
    menu.style.fontFamily =
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen";
    menu.style.touchAction = "none";

    function applyResponsiveLayout() {
      const minDim = Math.min(window.innerWidth, window.innerHeight);
      const baseUnit = Math.max(14, Math.round(minDim * 0.025)); // ~2.5% of shortest side, floor of 14px
      const gap = Math.round(baseUnit * 0.6);
      menu.style.padding = Math.round(baseUnit * 1.2) + "px";
      menu.style.gap = gap + "px";
      menu.style.minWidth =
        Math.min(560, Math.round(window.innerWidth * 0.6)) + "px";
      menu.style.maxWidth =
        Math.min(680, Math.round(window.innerWidth * 0.9)) + "px";
      menu.style.fontSize = Math.round(baseUnit * 0.9) + "px";

      const titleEl = menu.querySelector("h2");
      if (titleEl) {
        titleEl.style.margin = "0 0 " + gap + "px 0";
        titleEl.style.fontSize = Math.round(baseUnit * 1.25) + "px";
        titleEl.style.textAlign = "center";
        titleEl.style.letterSpacing = "0.5px";
      }

      menu.querySelectorAll("button").forEach((btn) => {
        btn.style.fontSize = Math.round(baseUnit * 0.95) + "px";
        btn.style.padding =
          Math.round(baseUnit * 0.7) +
          "px " +
          Math.round(baseUnit * 1.1) +
          "px";
        btn.style.borderRadius = Math.round(baseUnit * 0.5) + "px";
        btn.style.border = "2px solid #222";
        btn.style.background = "linear-gradient(#fafafa, #eaeaea)";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "600";
        btn.style.outline = "none";
        btn.style.width = "100%";
        btn.style.minHeight = Math.round(baseUnit * 2.4) + "px";
        btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
        btn.style.transition =
          "background 120ms, transform 120ms, box-shadow 150ms";
        btn.onpointerdown = () => {
          btn.style.transform = "scale(0.97)";
          btn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.25)";
        };
        btn.onpointerup = () => {
          btn.style.transform = "scale(1)";
          btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
        };
        btn.onpointerleave = () => {
          btn.style.transform = "scale(1)";
          btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
        };
      });
    }

    const blur = document.createElement("div");
    blur.style.position = "fixed";
    blur.style.top = 0;
    blur.style.left = 0;
    blur.style.width = "100%";
    blur.style.height = "100%";
    blur.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    blur.style.backdropFilter = "blur(5px)";
    blur.style.zIndex = 9999;
    document.body.appendChild(blur);
    blur.onclick = () => {
      document.body.removeChild(menu);
      document.body.removeChild(blur);
    };

    const title = document.createElement("img");
    title.src = "https://files.catbox.moe/jfrl9i.png";
    title.alt = "Yui Menu";
    title.style.width = "40%";
    title.style.height = "auto";
    title.style.display = "block";
    title.style.margin = "0 auto";
    menu.appendChild(title);

    const navBar = document.createElement("div");
    navBar.style.display = "flex";
    navBar.style.flexWrap = "wrap";
    navBar.style.gap = "8px";
    navBar.style.margin = "8px 0";
    menu.appendChild(navBar);

    const content = document.createElement("div");
    content.id = "yui-menu-content";
    content.style.background = "#fcfcfc";
    content.style.border = "1px solid #ccc";
    content.style.borderRadius = "8px";
    content.style.padding = "12px";
    content.style.minHeight = "160px";
    content.style.overflowY = "auto";
    content.style.maxHeight = "50vh";
    menu.appendChild(content);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.setAttribute("data-yui-role", "close");
    closeBtn.addEventListener(
      "click",
      () => {
        if (YuiNav.fullscreen) {
          YuiNav.setFullscreen(false);
        } else {
          window.removeEventListener("resize", applyResponsiveLayout);
          if (menu.parentNode) menu.parentNode.removeChild(menu);
          if (blur.parentNode) blur.parentNode.removeChild(blur);
        }
      },
      { passive: true }
    );
    menu.appendChild(closeBtn);

    YuiNav.menuEl = menu;
    YuiNav.contentEl = content;
    YuiNav.navBarEl = navBar;

    if (!YuiNav.pages.Home) {
      YuiNav.register("Home", (root) => {
        const wrap = document.createElement("div");
        wrap.innerHTML = `<strong>Welcome to Yui.</strong><br/><br/>Use the buttons above to navigate between sections. This interface is optimized for kiosk touch usage.<br/><br/>Right-click or long-press inside pages for context actions.`;
        root.appendChild(wrap);
        YuiContext.bind(root, () => [
          { label: "Reload Home", action: () => YuiNav.show("Home") },
          { separator: true },
          {
            label: "Close Menu",
            action: () =>
              document
                .querySelector("#yui-menu button[data-yui-role='close']")
                ?.click(),
          },
        ]);
      });
    }

    if (!YuiNav.pages.Apps) {
      YuiNav.register("Apps", (root) => {
        const wrap = document.createElement("div");
        wrap.style.display = "flex";
        wrap.style.flexDirection = "column";
        wrap.style.gap = "16px";

        const apps = YuiApps.list();
        if (!apps.length) {
          const empty = document.createElement("div");
          empty.style.textAlign = "center";
          empty.style.padding = "40px 20px";
          empty.style.color = "#666";
          empty.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No Apps Installed</div>
            <div style="font-size: 14px;">External scripts can register apps using Yui.apps.register({...})</div>
          `;
          wrap.appendChild(empty);
        } else {
          // Create a grid layout for better kiosk scaling
          const grid = document.createElement("div");
          grid.style.display = "grid";
          grid.style.gridTemplateColumns =
            "repeat(auto-fill, minmax(280px, 1fr))";
          grid.style.gap = "16px";
          grid.style.padding = "8px";

          apps.forEach((app) => {
            const card = document.createElement("button");
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.alignItems = "center";
            card.style.gap = "12px";
            card.style.padding = "24px 16px";
            card.style.border = "2px solid #ddd";
            card.style.borderRadius = "12px";
            card.style.background =
              "linear-gradient(135deg, #fff 0%, #f8f9fa 100%)";
            card.style.cursor = "pointer";
            card.style.transition = "all 0.2s ease";
            card.style.minHeight = "140px";
            card.style.textAlign = "center";
            card.style.position = "relative";
            card.style.overflow = "hidden";

            // Hover effects
            card.addEventListener("mouseenter", () => {
              card.style.transform = "translateY(-2px)";
              card.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              card.style.borderColor = "#bbb";
            });
            card.addEventListener("mouseleave", () => {
              card.style.transform = "translateY(0)";
              card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              card.style.borderColor = "#ddd";
            });

            // Icon section
            const iconContainer = document.createElement("div");
            iconContainer.style.width = "64px";
            iconContainer.style.height = "64px";
            iconContainer.style.display = "flex";
            iconContainer.style.alignItems = "center";
            iconContainer.style.justifyContent = "center";
            iconContainer.style.borderRadius = "12px";
            iconContainer.style.background = "rgba(0,0,0,0.05)";

            if (
              app.icon &&
              (app.icon.startsWith("http") || app.icon.startsWith("data:"))
            ) {
              const icon = document.createElement("img");
              icon.style.width = "48px";
              icon.style.height = "48px";
              icon.style.objectFit = "contain";
              icon.style.borderRadius = "8px";
              icon.src = app.icon;
              icon.onerror = () => {
                icon.style.display = "none";
                iconContainer.textContent = "📦";
                iconContainer.style.fontSize = "32px";
              };
              iconContainer.appendChild(icon);
            } else {
              iconContainer.style.fontSize = "32px";
              iconContainer.textContent = app.icon || "📦";
            }
            card.appendChild(iconContainer);

            // App name
            const name = document.createElement("div");
            name.style.fontSize = "16px";
            name.style.fontWeight = "600";
            name.style.color = "#333";
            name.style.marginBottom = "4px";
            name.textContent = app.name || app.id;
            card.appendChild(name);

            // App description
            if (app.description) {
              const desc = document.createElement("div");
              desc.style.fontSize = "12px";
              desc.style.color = "#666";
              desc.style.lineHeight = "1.3";
              desc.style.maxHeight = "32px";
              desc.style.overflow = "hidden";
              desc.textContent = app.description;
              card.appendChild(desc);
            }

            // Version badge
            const version = document.createElement("div");
            version.style.position = "absolute";
            version.style.top = "8px";
            version.style.right = "8px";
            version.style.fontSize = "10px";
            version.style.background = "rgba(0,0,0,0.1)";
            version.style.padding = "2px 6px";
            version.style.borderRadius = "4px";
            version.style.color = "#666";
            version.textContent = `v${app.version}`;
            card.appendChild(version);

            card.onclick = (e) => {
              e.preventDefault();
              if (app.render) {
                YuiNav.show(`App:${app.name || app.id}`);
              }
            };

            YuiContext.bind(card, (e) => {
              e.stopPropagation();
              return [
                {
                  label: `Open ${app.name || app.id}`,
                  action: () => YuiNav.show(`App:${app.name || app.id}`),
                },
                { separator: true },
                {
                  label: "App Info",
                  action: () => {
                    alert(
                      `Name: ${app.name || app.id}\nVersion: ${
                        app.version
                      }\nDescription: ${
                        app.description || "No description"
                      }\nID: ${app.id}`
                    );
                  },
                },
                {
                  label: "Uninstall",
                  action: () => {
                    if (confirm(`Uninstall ${app.name || app.id}?`)) {
                      YuiApps.unregister(app.id);
                    }
                  },
                },
                { separator: true },
                { label: "Back to Home", action: () => YuiNav.show("Home") },
              ];
            });

            grid.appendChild(card);
          });

          wrap.appendChild(grid);
        }

        root.appendChild(wrap);

        YuiContext.bind(root, () => [
          { label: "Refresh Apps", action: () => YuiNav.show("Apps") },
          { separator: true },
          { label: "Back to Home", action: () => YuiNav.show("Home") },
        ]);
      });
    }
    if (!YuiNav.pages.Settings) {
      YuiNav.register("Settings", (root) => {
        const prefs = YuiPrefs.current;
        const form = document.createElement("div");
        form.style.display = "flex";
        form.style.flexDirection = "column";
        form.style.gap = "14px";
        form.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:6px">
        <label style="font-weight:600">Patch Vulnerabilities</label>
        <select id="yui-security-patch" style="width:120px;padding:8px;border:1px solid #888;border-radius:6px;cursor:pointer">
          <option value="auto" ${
            prefs.securityPatch === "auto" ? "selected" : ""
          }>Auto (recommended)</option>
          <option value="off" ${
            prefs.securityPatch === "off" ? "selected" : ""
          }>Off (not recommended)</option>
        </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-weight:600">Theme</label>
            <select id="yui-pref-theme" style="width:120px;padding:8px;border:1px solid #888;border-radius:6px;cursor:pointer">
              <option value="light" ${
                prefs.theme === "light" ? "selected" : ""
              }>Light</option>
              <option value="dark" ${
                prefs.theme === "dark" ? "selected" : ""
              }>Dark</option>
              <option value="high-contrast" ${
                prefs.theme === "high-contrast" ? "selected" : ""
              }>High Contrast</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-weight:600">Accent Color
              <input id="yui-pref-accent" type="color" value="${
                prefs.accent
              }" style="width:120px;height:40px;border:1px solid #888;border-radius:6px;cursor:pointer" />
            </label>
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-weight:600"><input type="checkbox" id="yui-pref-restore" ${
            prefs.restoreLastPage ? "checked" : ""
          }/> Restore last opened page on open</label>
          <fieldset style="border:1px solid #aaa;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px">
            <legend style="padding:0 6px;font-weight:600">PIN Security</legend>
            <div id="yui-pin-no-set" ${
              prefs.pinHash ? "style=display:none" : ""
            }>
              <p style="margin:0 0 4px">Set a numeric PIN to restrict opening the menu.</p>
              <input type="password" id="yui-pin-new" placeholder="New PIN" style="padding:8px;border:1px solid #888;border-radius:6px"/>
              <input type="password" id="yui-pin-new2" placeholder="Confirm PIN" style="padding:8px;border:1px solid #888;border-radius:6px"/>
              <button id="yui-pin-set" style="margin-top:4px">Set PIN</button>
            </div>
            <div id="yui-pin-set-block" ${
              prefs.pinHash ? "" : "style=display:none"
            }>
              <p style="margin:0 0 4px">Change or remove existing PIN.</p>
              <input type="password" id="yui-pin-current" placeholder="Current PIN" style="padding:8px;border:1px solid #888;border-radius:6px"/>
              <input type="password" id="yui-pin-new3" placeholder="New PIN" style="padding:8px;border:1px solid #888;border-radius:6px"/>
              <input type="password" id="yui-pin-new4" placeholder="Confirm New PIN" style="padding:8px;border:1px solid #888;border-radius:6px"/>
              <div style="display:flex;gap:8px;margin-top:4px">
                <button id="yui-pin-change" style="flex:2">Change PIN</button>
                <button id="yui-pin-remove" style="flex:1">Remove</button>
              </div>
            </div>
          </fieldset>
          <fieldset style="border:1px solid #aaa;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px">
            <legend style="padding:0 6px;font-weight:600">Import / Export</legend>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button id="yui-pref-export" style="flex:1;min-width:120px">Copy JSON</button>
              <button id="yui-pref-import-btn" style="flex:1;min-width:120px">Import JSON</button>
            </div>
            <textarea id="yui-pref-import" placeholder="Paste JSON here then click Import" style="width:100%;min-height:90px;padding:8px;border:1px solid #888;border-radius:6px;resize:vertical"></textarea>
          </fieldset>
          <div id="yui-pref-status" style="min-height:18px;font-size:13px;color:#0a6"></div>
        `;
        root.appendChild(form);
        form.querySelector("#yui-pref-theme").value = prefs.theme;
        const status = form.querySelector("#yui-pref-status");
        function flash(msg, isErr) {
          status.textContent = msg;
          status.style.color = isErr ? "#b00" : "#0a6";
          setTimeout(() => {
            if (status.textContent === msg) status.textContent = "";
          }, 4000);
        }
        form.querySelector("#yui-pref-theme").addEventListener(
          "change",
          (e) => {
            YuiPrefs.update({ theme: e.target.value });
            YuiPrefs.applyTheme();
            flash("Theme updated");
          },
          { passive: true }
        );
        form.querySelector("#yui-pref-accent").addEventListener(
          "input",
          (e) => {
            YuiPrefs.update({ accent: e.target.value });
            flash("Accent updated");
          },
          { passive: true }
        );
        form.querySelector("#yui-security-patch").addEventListener(
          "change",
          (e) => {
            YuiPrefs.update({ securityPatch: e.target.value });
            YuiPrefs.patchVulnerabilities();
            flash("Security patch preference saved");
          },
          { passive: true }
        );
        form.querySelector("#yui-pref-restore").addEventListener(
          "change",
          (e) => {
            YuiPrefs.update({ restoreLastPage: e.target.checked });
            flash("Restore preference saved");
          },
          { passive: true }
        );
        // PIN set
        const pinSetBtn = form.querySelector("#yui-pin-set");
        pinSetBtn?.addEventListener("click", async () => {
          const a = form.querySelector("#yui-pin-new").value.trim();
          const b = form.querySelector("#yui-pin-new2").value.trim();
          if (!a || a !== b) {
            flash("PIN mismatch", true);
            return;
          }
          if (a.length < 4) {
            flash("PIN too short", true);
            return;
          }
          await YuiPrefs.setPin(a);
          form.querySelector("#yui-pin-no-set").style.display = "none";
          form.querySelector("#yui-pin-set-block").style.display = "block";
          flash("PIN set");
        });
        // PIN change
        form
          .querySelector("#yui-pin-change")
          ?.addEventListener("click", async () => {
            const cur = form.querySelector("#yui-pin-current").value.trim();
            const n1 = form.querySelector("#yui-pin-new3").value.trim();
            const n2 = form.querySelector("#yui-pin-new4").value.trim();
            if (!(await YuiPrefs.verifyPin(cur))) {
              flash("Wrong current PIN", true);
              return;
            }
            if (!n1 || n1 !== n2) {
              flash("PIN mismatch", true);
              return;
            }
            if (n1.length < 4) {
              flash("Too short", true);
              return;
            }
            await YuiPrefs.setPin(n1);
            flash("PIN changed");
            form.querySelector("#yui-pin-current").value = "";
            form.querySelector("#yui-pin-new3").value = "";
            form.querySelector("#yui-pin-new4").value = "";
          });
        form.querySelector("#yui-pin-remove")?.addEventListener("click", () => {
          if (!confirm("Remove PIN protection?")) return;
          YuiPrefs.clearPin();
          form.querySelector("#yui-pin-no-set").style.display = "block";
          form.querySelector("#yui-pin-set-block").style.display = "none";
          flash("PIN removed");
        });
        form.querySelector("#yui-pref-export").addEventListener("click", () => {
          YuiPrefs.exportPrefs();
          flash("Copied to clipboard");
        });

        form
          .querySelector("#yui-pref-import-btn")
          .addEventListener("click", () => {
            const txt = form.querySelector("#yui-pref-import").value.trim();
            if (!txt) {
              flash("Nothing to import", true);
              return;
            }
            try {
              YuiPrefs.importPrefs(txt);
              flash("Imported");
              YuiPrefs.applyTheme();
            } catch (e) {
              flash("Import failed", true);
            }
          });
        YuiContext.bind(root, () => [
          {
            label: "Export Prefs (Copy JSON)",
            action: () => {
              YuiPrefs.exportPrefs();
              flash("Copied");
            },
          },
          { label: "Home", action: () => YuiNav.show("Home") },
        ]);
      });
    }
    if (!YuiNav.pages.About) {
      YuiNav.register("About", (root) => {
        const div = document.createElement("div");
        div.innerHTML = `<div style=\"line-height:1.4\"><strong>Yui v1.0rc</strong><br/>Author: genr234<br/>A fully featured, battery included SicilyKiosk jailbreak.<br/><br/>API: window.Yui</div>`;
        root.appendChild(div);
      });
    }

    Object.keys(YuiNav.pages).forEach((name) => YuiNav._ensureNavButton(name));

    // Ensure we always start with a system page, not an app
    let startPage = "Home";
    if (YuiPrefs.current.restoreLastPage && YuiPrefs.current.lastPage) {
      const lastPage = YuiPrefs.current.lastPage;
      // Only restore if it's a system page (not an app) and it exists
      if (!lastPage.startsWith("App:") && YuiNav.pages[lastPage]) {
        startPage = lastPage;
      }
    }

    YuiNav.show(startPage);

    document.body.appendChild(menu);
    applyResponsiveLayout();
    window.addEventListener("resize", applyResponsiveLayout, { passive: true });
  }

  if (GM_getValue("yui_disabled", false)) {
    console.log("Yui is disabled");
  } else {
    goToMeteo = () => {
      YuiPrefs.ensurePinThen(() => {
        spawnMenu();
        YuiPrefs.applyTheme();
        try {
          if (
            YuiPrefs.current.restoreLastPage &&
            YuiPrefs.current.lastPage &&
            YuiNav.pages[YuiPrefs.current.lastPage] &&
            !YuiPrefs.current.lastPage.startsWith("App:")
          ) {
            YuiNav.show(YuiPrefs.current.lastPage);
          }
        } catch (_) {}
      });
    };

    // Inject into page
    waitForElement("#lollo", (icon) => {
      const img = document.createElement("img");
      img.src = "https://files.catbox.moe/jfrl9i.png";
      img.width = 100;
      img.height = 50;
      icon.replaceWith(img);
    });

    watchXPath("//span[text()='Air Quality']", (el) => {
      const newEl = document.createElement("span");
      newEl.textContent = "Yui";
      el.replaceWith(newEl);
    });
  }

  try {
    unsafeWindow.Yui = Object.freeze({
      nav: YuiNav,
      apps: YuiApps,
      context: YuiContext,
      events: YuiEvents,
      prefs: YuiPrefs,
      storage: {
        get: (k, def) => {
          const v = GM_getValue("yui_storage_" + YuiApps.current + k);
          return v === undefined ? def : v;
        },
        set: (k, v) => GM_setValue("yui_storage_" + YuiApps.current + k, v),
        remove: (k) => GM_deleteValue("yui_storage_" + YuiApps.current + k),
        clear: () => {
          Object.keys(GM_listValues()).forEach((k) => {
            if (k.startsWith("yui_storage_")) GM_deleteValue(k);
          });
        },
      },

      updatePrefs: (p) => YuiPrefs.update(p),
      registerApp: (def) => YuiApps.register(def),
      registerPage: (name, renderFn, options) =>
        YuiNav.register(name, renderFn, options || {}),
      show: (name) => YuiNav.show(name),
      install: (manifest) => YuiApps.install(manifest),
      fetchApp: (url) => YuiApps.fetch(url),
    });
  } catch (e) {
    console.warn("Unable to expose Yui API to unsafeWindow", e);
  }
})();
