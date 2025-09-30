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
        render: async (root, ctx) => {
          ctx.enterFullscreen();

          // Custom Virtual Keyboard Implementation
          let currentActiveInput = null;
          let isShiftActive = false;
          let isCapsLockActive = false;

          function createCustomKeyboard() {
            const keyboard = document.createElement("div");
            keyboard.id = "custom-virtual-keyboard-youtube";
            keyboard.style.cssText = `
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: #f0f0f0;
              border-top: 2px solid #ccc;
              padding: 10px;
              z-index: 10000;
              display: none;
              box-shadow: 0 -4px 8px rgba(0,0,0,0.2);
              font-family: Arial, sans-serif;
            `;

            // Keyboard layout
            const keyboardLayout = [
              ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Backspace"],
              ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
              ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
              ["Shift", "z", "x", "c", "v", "b", "n", "m", "Enter"],
              ["Space", "Hide"],
            ];

            keyboardLayout.forEach((row, rowIndex) => {
              const rowDiv = document.createElement("div");
              rowDiv.style.cssText = `
                display: flex;
                justify-content: center;
                margin: 3px 0;
                gap: 4px;
              `;

              row.forEach((key) => {
                const keyButton = document.createElement("button");
                keyButton.textContent = getKeyDisplay(key);
                keyButton.dataset.key = key;

                let buttonWidth = "40px";
                if (key === "Space") buttonWidth = "200px";
                else if (key === "Backspace" || key === "Enter")
                  buttonWidth = "80px";
                else if (key === "Shift") buttonWidth = "60px";
                else if (key === "Hide") buttonWidth = "60px";

                keyButton.style.cssText = `
                  width: ${buttonWidth};
                  height: 40px;
                  margin: 1px;
                  border: 1px solid #999;
                  border-radius: 4px;
                  background: ${getKeyBackground(key)};
                  color: #333;
                  font-size: 14px;
                  font-weight: bold;
                  cursor: pointer;
                  user-select: none;
                  transition: all 0.1s ease;
                `;

                keyButton.addEventListener("mousedown", (e) => {
                  e.preventDefault();
                  keyButton.style.background = "#bbb";
                  handleKeyPress(key);
                });

                keyButton.addEventListener("mouseup", () => {
                  keyButton.style.background = getKeyBackground(key);
                });

                keyButton.addEventListener("mouseleave", () => {
                  keyButton.style.background = getKeyBackground(key);
                });

                rowDiv.appendChild(keyButton);
              });

              keyboard.appendChild(rowDiv);
            });

            document.body.appendChild(keyboard);
            return keyboard;
          }

          function getKeyDisplay(key) {
            if (key === "Space") return "Space";
            if (key === "Backspace") return "⌫";
            if (key === "Enter") return "↵";
            if (key === "Shift") return "⇧";
            if (key === "Hide") return "⌄";

            if (isShiftActive || isCapsLockActive) {
              return key.toUpperCase();
            }
            return key;
          }

          function getKeyBackground(key) {
            if (key === "Shift" && isShiftActive) return "#007acc";
            if (["Backspace", "Enter", "Shift", "Hide"].includes(key))
              return "#e0e0e0";
            if (key === "Space") return "#f5f5f5";
            return "#fff";
          }

          function handleKeyPress(key) {
            if (!currentActiveInput) return;

            const input = currentActiveInput;
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const value = input.value;

            switch (key) {
              case "Backspace":
                if (start > 0) {
                  input.value = value.slice(0, start - 1) + value.slice(end);
                  input.setSelectionRange(start - 1, start - 1);
                }
                break;

              case "Enter":
                // Trigger search
                const searchBtn = document.querySelector(
                  "#youtube-search-button"
                );
                if (searchBtn) searchBtn.click();
                hideKeyboard();
                break;

              case "Space":
                input.value = value.slice(0, start) + " " + value.slice(end);
                input.setSelectionRange(start + 1, start + 1);
                break;

              case "Shift":
                isShiftActive = !isShiftActive;
                updateKeyboardDisplay();
                break;

              case "Hide":
                hideKeyboard();
                break;

              default:
                let char = key;
                if (isShiftActive || isCapsLockActive) {
                  char = char.toUpperCase();
                }
                input.value = value.slice(0, start) + char + value.slice(end);
                input.setSelectionRange(start + 1, start + 1);

                // Reset shift after character input
                if (isShiftActive) {
                  isShiftActive = false;
                  updateKeyboardDisplay();
                }
            }

            // Trigger input event for any listeners
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }

          function updateKeyboardDisplay() {
            const keyboard = document.getElementById(
              "custom-virtual-keyboard-youtube"
            );
            if (!keyboard) return;

            const buttons = keyboard.querySelectorAll("button");
            buttons.forEach((button) => {
              const key = button.dataset.key;
              button.textContent = getKeyDisplay(key);
              button.style.background = getKeyBackground(key);
            });
          }

          function showKeyboard(input) {
            currentActiveInput = input;
            const keyboard = document.getElementById(
              "custom-virtual-keyboard-youtube"
            );
            if (keyboard) {
              keyboard.style.display = "block";
              updateKeyboardDisplay();
            }
          }

          function hideKeyboard() {
            const keyboard = document.getElementById(
              "custom-virtual-keyboard-youtube"
            );
            if (keyboard) {
              keyboard.style.display = "none";
            }
            currentActiveInput = null;
          }

          // Create the keyboard
          const virtualKeyboard = createCustomKeyboard();

          function extractYouTubeResults(ytInitialData) {
            try {
              const contents =
                ytInitialData.contents?.twoColumnSearchResultsRenderer
                  ?.primaryContents?.sectionListRenderer?.contents || [];

              const results = [];

              for (const section of contents) {
                const items = section.itemSectionRenderer?.contents || [];

                for (const item of items) {
                  if (!item.videoRenderer) continue;

                  const v = item.videoRenderer;

                  results.push({
                    title: v.title?.runs?.[0]?.text || "Unknown",
                    videoId: v.videoId,
                    url: `https://www.youtube.com/watch?v=${v.videoId}`,
                    thumbnail: v.thumbnail?.thumbnails?.pop()?.url || "",
                    channel: v.ownerText?.runs?.[0]?.text || "Unknown",
                    views: v.viewCountText?.simpleText || "N/A",
                    uploaded: v.publishedTimeText?.simpleText || "N/A",
                  });
                }
              }

              return results;
            } catch (e) {
              console.error("Failed to parse search results:", e);
              return [];
            }
          }
          function createYouTubeIframe(videoId, startTime = 0) {
            const iframe = document.createElement("iframe");
            iframe.width = "100%";
            iframe.height = "100%";

            let src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&enablejsapi=1`;
            if (startTime > 0) {
              src += `&start=${Math.floor(startTime)}`;
            }

            iframe.src = src;
            iframe.title = "YouTube video player";
            iframe.frameBorder = "0";
            iframe.allow =
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            iframe.allowFullscreen = true;
            iframe.setAttribute("yui-security-ignore", "true");
            iframe.id = `youtube-player-${videoId}`;
            return iframe;
          }
          const container = document.createElement("div");
          container.style.width = "100%";
          container.style.height = "100%";
          container.style.display = "flex";
          container.style.flexDirection = "column";
          container.style.backgroundColor = "#000";
          container.style.position = "relative";

          const searchContainer = document.createElement("div");
          searchContainer.style.display = "flex";
          searchContainer.style.alignItems = "center";
          searchContainer.style.padding = "10px";
          searchContainer.style.gap = "10px";
          searchContainer.style.backgroundColor = "#111";
          searchContainer.style.borderBottom = "1px solid #333";

          const searchInput = document.createElement("input");
          searchInput.type = "text";
          searchInput.placeholder =
            "Search YouTube... (Tap to open virtual keyboard)";
          searchInput.style.flex = "1";
          searchInput.style.padding = "10px";
          searchInput.style.fontSize = "16px";
          searchInput.style.borderRadius = "5px";
          searchInput.style.border = "2px solid #4CAF50";
          searchInput.style.outline = "none";

          // Add keyboard functionality to input
          searchInput.addEventListener("focus", () => {
            showKeyboard(searchInput);
          });

          // Hide keyboard when clicking outside
          document.addEventListener("click", (e) => {
            if (
              !e.target.closest("#custom-virtual-keyboard-youtube") &&
              e.target !== searchInput
            ) {
              hideKeyboard();
            }
          });

          const searchButton = document.createElement("button");
          searchButton.id = "youtube-search-button";
          searchButton.textContent = "Search";
          searchButton.style.padding = "10px 20px";
          searchButton.style.fontSize = "16px";
          searchButton.style.borderRadius = "5px";
          searchButton.style.border = "none";
          searchButton.style.backgroundColor = "#ff0000";
          searchButton.style.color = "#fff";
          searchButton.style.cursor = "pointer";

          searchContainer.appendChild(searchInput);
          searchContainer.appendChild(searchButton);

          // Add keyboard status indicator
          const keyboardStatus = document.createElement("div");
          keyboardStatus.textContent = "✅ Virtual keyboard ready";
          keyboardStatus.style.color = "#4CAF50";
          keyboardStatus.style.fontSize = "12px";
          keyboardStatus.style.padding = "5px 10px";
          keyboardStatus.style.backgroundColor = "#111";
          keyboardStatus.style.borderBottom = "1px solid #333";
          keyboardStatus.style.textAlign = "center";

          container.appendChild(searchContainer);
          container.appendChild(keyboardStatus);

          const contentArea = document.createElement("div");
          contentArea.style.flex = "1";
          contentArea.style.display = "flex";
          contentArea.style.justifyContent = "center";
          contentArea.style.alignItems = "center";
          contentArea.style.width = "100%";
          contentArea.style.height = "100%";
          container.appendChild(contentArea);

          searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              const searchBtn = document.getElementById(
                "youtube-search-button"
              );
              if (searchBtn) searchBtn.click();
            }
          });

          const savedVideo = Yui.storage.get("currentVideo", null);
          const savedProgress = Yui.storage.get("videoProgress", 0);

          let welcomeScreen;
          if (savedVideo && savedProgress > 30) {
            welcomeScreen = document.createElement("div");
            welcomeScreen.style.textAlign = "center";
            welcomeScreen.style.color = "#fff";
            welcomeScreen.style.padding = "40px";

            const resumeContainer = document.createElement("div");
            resumeContainer.style.backgroundColor = "#1a1a1a";
            resumeContainer.style.border = "1px solid #333";
            resumeContainer.style.borderRadius = "12px";
            resumeContainer.style.padding = "24px";
            resumeContainer.style.marginBottom = "32px";
            resumeContainer.style.maxWidth = "500px";
            resumeContainer.style.margin = "0 auto 32px";

            const resumeTitle = document.createElement("div");
            resumeTitle.style.fontSize = "18px";
            resumeTitle.style.fontWeight = "600";
            resumeTitle.style.marginBottom = "12px";
            resumeTitle.textContent = "Continue Watching";

            const videoTitle = document.createElement("div");
            videoTitle.style.fontSize = "14px";
            videoTitle.style.color = "#aaa";
            videoTitle.style.marginBottom = "16px";
            videoTitle.style.maxWidth = "400px";
            videoTitle.style.margin = "0 auto 16px";
            videoTitle.textContent = savedVideo.title;

            const progressText = document.createElement("div");
            progressText.style.fontSize = "12px";
            progressText.style.color = "#888";
            progressText.style.marginBottom = "20px";
            const minutes = Math.floor(savedProgress / 60);
            const seconds = Math.floor(savedProgress % 60);
            progressText.textContent = `Resume at ${minutes}:${seconds
              .toString()
              .padStart(2, "0")}`;

            const resumeButton = document.createElement("button");
            resumeButton.textContent = "▶ Resume Video";
            resumeButton.style.padding = "12px 24px";
            resumeButton.style.fontSize = "16px";
            resumeButton.style.borderRadius = "6px";
            resumeButton.style.border = "none";
            resumeButton.style.backgroundColor = "#ff0000";
            resumeButton.style.color = "#fff";
            resumeButton.style.cursor = "pointer";
            resumeButton.style.fontWeight = "600";
            resumeButton.style.marginRight = "12px";

            const clearButton = document.createElement("button");
            clearButton.textContent = "Clear";
            clearButton.style.padding = "12px 24px";
            clearButton.style.fontSize = "16px";
            clearButton.style.borderRadius = "6px";
            clearButton.style.border = "1px solid #555";
            clearButton.style.backgroundColor = "transparent";
            clearButton.style.color = "#aaa";
            clearButton.style.cursor = "pointer";

            resumeButton.addEventListener("click", () => {
              contentArea.innerHTML = "";
              playVideo(savedVideo, savedProgress);
            });

            clearButton.addEventListener("click", () => {
              Yui.storage.remove("currentVideo");
              Yui.storage.remove("videoProgress");
              contentArea.innerHTML = "";
              showDefaultWelcome();
            });

            resumeContainer.appendChild(resumeTitle);
            resumeContainer.appendChild(videoTitle);
            resumeContainer.appendChild(progressText);
            resumeContainer.appendChild(resumeButton);
            resumeContainer.appendChild(clearButton);

            welcomeScreen.appendChild(resumeContainer);

            const defaultText = document.createElement("div");
            defaultText.innerHTML = `
              <div style="font-size: 48px; margin-bottom: 16px;">📺</div>
              <div style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">YouTube Player</div>
              <div style="font-size: 14px; color: #aaa;">Or search for new videos above</div>
            `;
            welcomeScreen.appendChild(defaultText);
          } else {
            showDefaultWelcome();
          }

          function showDefaultWelcome() {
            const defaultWelcome = document.createElement("div");
            defaultWelcome.style.textAlign = "center";
            defaultWelcome.style.color = "#fff";
            defaultWelcome.style.padding = "40px";
            defaultWelcome.innerHTML = `
              <div style="font-size: 64px; margin-bottom: 24px;">📺</div>
              <div style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">YouTube Player</div>
              <div style="font-size: 16px; color: #aaa;">Enter a search term above and press Enter or click Search to find videos</div>
            `;
            contentArea.appendChild(defaultWelcome);
          }

          function playVideo(video, startTime = 0, returnToResults = null) {
            const backButton = document.createElement("button");
            backButton.textContent = returnToResults
              ? "← Back to Results"
              : "← Back";
            backButton.style.position = "absolute";
            backButton.style.top = "20px";
            backButton.style.left = "20px";
            backButton.style.zIndex = "1000";
            backButton.style.padding = "8px 16px";
            backButton.style.backgroundColor = "rgba(0,0,0,0.8)";
            backButton.style.color = "#fff";
            backButton.style.border = "1px solid #555";
            backButton.style.borderRadius = "4px";
            backButton.style.cursor = "pointer";
            backButton.style.fontSize = "14px";

            backButton.addEventListener("click", () => {
              contentArea.innerHTML = "";
              if (returnToResults) {
                contentArea.appendChild(returnToResults);
              } else {
                showDefaultWelcome();
              }
            });

            const playerContainer = document.createElement("div");
            playerContainer.style.width = "100%";
            playerContainer.style.height = "100%";
            playerContainer.style.position = "relative";

            Yui.storage.set("currentVideo", video);

            const iframe = createYouTubeIframe(video.videoId, startTime);

            let progressInterval = setInterval(() => {
              const estimatedProgress =
                startTime + (Date.now() - playStartTime) / 1000;
              Yui.storage.set("videoProgress", estimatedProgress);
            }, 5000);

            const playStartTime = Date.now();

            const originalRemove = contentArea.removeChild;
            contentArea.removeChild = function (child) {
              if (child === playerContainer && progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
              }
              return originalRemove.call(this, child);
            };

            playerContainer.appendChild(backButton);
            playerContainer.appendChild(iframe);
            contentArea.appendChild(playerContainer);
          }

          if (welcomeScreen) {
            contentArea.appendChild(welcomeScreen);
          }

          searchButton.addEventListener("click", async () => {
            contentArea.innerHTML = "";
            const loadingMsg = document.createElement("div");
            loadingMsg.style.color = "#fff";
            loadingMsg.style.fontSize = "18px";
            loadingMsg.textContent = "Searching YouTube...";
            contentArea.appendChild(loadingMsg);

            const query = searchInput.value || "trending";
            let videos = [];

            GM_xmlhttpRequest({
              method: "GET",
              url:
                "https://www.youtube.com/results?search_query=" +
                encodeURIComponent(query),
              onload: function (response) {
                const html = response.responseText;
                const match = html.match(
                  /ytInitialData\s*=\s*(\{.*?\});<\/script>/s
                );

                if (match) {
                  const ytInitialData = JSON.parse(match[1]);
                  videos = extractYouTubeResults(ytInitialData);
                  console.log("Extracted videos:", videos);
                  contentArea.innerHTML = "";

                  if (videos.length === 0) {
                    const errorMsg = document.createElement("div");
                    errorMsg.style.color = "#fff";
                    errorMsg.style.fontSize = "18px";
                    errorMsg.textContent = "No videos found.";
                    contentArea.appendChild(errorMsg);
                    return;
                  }

                  const resultsGrid = document.createElement("div");
                  resultsGrid.style.display = "grid";
                  resultsGrid.style.gridTemplateColumns =
                    "repeat(auto-fill, minmax(320px, 1fr))";
                  resultsGrid.style.gap = "16px";
                  resultsGrid.style.padding = "20px";
                  resultsGrid.style.maxHeight = "100%";
                  resultsGrid.style.overflowY = "auto";
                  resultsGrid.style.width = "100%";

                  videos.forEach((video) => {
                    const videoCard = document.createElement("div");
                    videoCard.style.backgroundColor = "#222";
                    videoCard.style.borderRadius = "8px";
                    videoCard.style.overflow = "hidden";
                    videoCard.style.cursor = "pointer";
                    videoCard.style.transition =
                      "transform 0.2s ease, box-shadow 0.2s ease";
                    videoCard.style.border = "1px solid #333";

                    videoCard.addEventListener("mouseenter", () => {
                      videoCard.style.transform = "translateY(-2px)";
                      videoCard.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
                    });

                    videoCard.addEventListener("mouseleave", () => {
                      videoCard.style.transform = "translateY(0)";
                      videoCard.style.boxShadow = "none";
                    });

                    const thumbnail = document.createElement("img");
                    thumbnail.src = video.thumbnail;
                    thumbnail.style.width = "100%";
                    thumbnail.style.height = "180px";
                    thumbnail.style.objectFit = "cover";
                    thumbnail.style.display = "block";
                    thumbnail.onerror = () => {
                      thumbnail.style.display = "none";
                    };

                    const infoContainer = document.createElement("div");
                    infoContainer.style.padding = "12px";

                    const title = document.createElement("div");
                    title.textContent = video.title;
                    title.style.color = "#fff";
                    title.style.fontSize = "14px";
                    title.style.fontWeight = "600";
                    title.style.marginBottom = "8px";
                    title.style.lineHeight = "1.3";
                    title.style.display = "-webkit-box";
                    title.style.webkitLineClamp = "2";
                    title.style.webkitBoxOrient = "vertical";
                    title.style.overflow = "hidden";

                    const channel = document.createElement("div");
                    channel.textContent = video.channel;
                    channel.style.color = "#aaa";
                    channel.style.fontSize = "12px";
                    channel.style.marginBottom = "4px";

                    const metadata = document.createElement("div");
                    metadata.textContent = `${video.views} • ${video.uploaded}`;
                    metadata.style.color = "#888";
                    metadata.style.fontSize = "11px";

                    infoContainer.appendChild(title);
                    infoContainer.appendChild(channel);
                    infoContainer.appendChild(metadata);

                    videoCard.appendChild(thumbnail);
                    videoCard.appendChild(infoContainer);

                    videoCard.addEventListener("click", () => {
                      contentArea.innerHTML = "";
                      playVideo(video, 0, resultsGrid);
                    });

                    resultsGrid.appendChild(videoCard);
                  });

                  contentArea.appendChild(resultsGrid);
                } else {
                  console.error("ytInitialData not found");
                  contentArea.innerHTML = "";
                  const errorMsg = document.createElement("div");
                  errorMsg.style.color = "#fff";
                  errorMsg.style.fontSize = "18px";
                  errorMsg.textContent = "Failed to load search results.";
                  contentArea.appendChild(errorMsg);
                }
              },
              onerror: function (error) {
                console.error("Search request failed:", error);
                contentArea.innerHTML = "";
                const errorMsg = document.createElement("div");
                errorMsg.style.color = "#fff";
                errorMsg.style.fontSize = "18px";
                errorMsg.textContent = "Search failed. Please try again.";
                contentArea.appendChild(errorMsg);
              },
            });
          });

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
