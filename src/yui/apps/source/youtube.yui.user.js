// ==UserScript==
// @name         Youtube (Yui)
// @namespace    https://yui.sicilykiosk.genr234.com/
// @version      1.0
// @description  YouTube client packed with various SicilyKiosk aimed improvements targeting the Yui API.
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

  // Your code here...
  console.log("Youtube (Yui) script loaded");
  if (unsafeWindow.Yui) {
    const Yui = unsafeWindow.Yui;
    if (!Yui.apps.find((app) => app.id === "youtube.yui")) {
      Yui.registerApp({
        id: "youtube.yui",
        name: "YouTube",
        author: "genr234",
        description:
          "YouTube client packed with various SicilyKiosk aimed improvements targeting the Yui API.",
        icon: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXlvdXR1YmUtaWNvbiBsdWNpZGUteW91dHViZSI+PHBhdGggZD0iTTIuNSAxN2EyNC4xMiAyNC4xMiAwIDAgMSAwLTEwIDIgMiAwIDAgMSAxLjQtMS40IDQ5LjU2IDQ5LjU2IDAgMCAxIDE2LjIgMEEyIDIgMCAwIDEgMjEuNSA3YTI0LjEyIDI0LjEyIDAgMCAxIDAgMTAgMiAyIDAgMCAxLTEuNCAxLjQgNDkuNTUgNDkuNTUgMCAwIDEtMTYuMiAwQTIgMiAwIDAgMSAyLjUgMTciLz48cGF0aCBkPSJtMTAgMTUgNS0zLTUtM3oiLz48L3N2Zz4=`,
        version: "1.0",
        fullscreen: true,
        immersive: true,
        render: (root, ctx) => {
          ctx.enterFullscreen();
          const container = document.createElement("div");
          container.style.width = "100%";
          container.style.height = "100%";
          container.style.display = "flex";
          container.style.justifyContent = "center";
          container.style.alignItems = "center";
          container.style.backgroundColor = "#000";

          const iframe = document.createElement("iframe");
          iframe.src = "https://www.youtube.com/tv";
          iframe.style.border = "none";
          iframe.style.width = "100%";
          iframe.style.height = "100%";

          container.appendChild(iframe);
          root.appendChild(container);
        },
      });
      console.log("YouTube app registered");
    } else {
      console.log("YouTube app already registered");
    }
  } else {
    console.error("Yui not detected. Exiting script.");
    return;
  }
})();
