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
// ==/UserScript==

(function () {
  "use strict";
  console.log("Yui user script running on", location.hostname);

  if (
    !/^(sicilykioskuser-[^.]+\.flazio\.com|(?:.*\.)?sicilykiosk\.genr234\.com)$/.test(
      location.hostname
    )
  ) {
    console.log("Yui: not on supported domain, exiting");
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        const popup = node.querySelector(".popupClose");
        if (popup) {
          console.log("PopupClose element found inside new node", popup);

          const table = document.querySelector("table");
          const flazioBanner = document.querySelector("img[alt='flazio-logo']");
          if (table) {
            table.innerHTML = "Successfully jailbroken using Yui v1.0rc!";
          }
          if (flazioBanner) {
            flazioBanner.src = "https://files.catbox.moe/kc0pkk.png";
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
