// ==UserScript==
// @name         Game Centre (Yui)
// @namespace    https://yui.sicilykiosk.genr234.com/
// @version      1.0
// @description  A game interface for the Sicily Kiosk platform using the Yui API.
// @author       genr234
// @require      https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js
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

  console.log("Game Centre (Yui) script loaded");
  if (unsafeWindow.Yui) {
    const Yui = unsafeWindow.Yui;
    if (
      !Yui.storage.get("coolmathGamesData") ||
      Date.now() - Yui.storage.get("coolmathGamesData").fetchedAt >
        24 * 60 * 60 * 1000
    ) {
      GM_xmlhttpRequest({
        method: "GET",
        url: "https://www.coolmathgames.com/sites/default/files/cmatgame_games_with_levels.json",
        onload: function (response) {
          try {
            const data = JSON.parse(response.responseText);
            console.log("Fetched game data:", data);
            const games = data.game;
            console.log("[CoolmathGames] Total games fetched:", games.length);
            Yui.storage.set("coolmathGamesData", {
              games,
              fetchedAt: Date.now(),
            });
          } catch (error) {
            console.error("[CoolmathGames] Error parsing game data:", error);
          }
        },
        onerror: function (error) {
          console.error("[CoolmathGames] Error fetching game data:", error);
        },
      });
    } else {
      console.log("Using cached game data");
    }
    Yui.registerApp({
      id: "games",
      name: "Game Centre",
      icon: "🎮",
      description:
        "A game interface for the Sicily Kiosk platform using the Yui API.",
      fullscreen: true,
      render: function (contentArea) {
        // Custom Virtual Keyboard Implementation
        let currentActiveInput = null;
        let isShiftActive = false;
        let isCapsLockActive = false;

        function createCustomKeyboard() {
          const keyboard = document.createElement("div");
          keyboard.id = "custom-virtual-keyboard";
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
              // Trigger search or form submission
              const searchBtn = document.querySelector("#search-button");
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
          const keyboard = document.getElementById("custom-virtual-keyboard");
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
          const keyboard = document.getElementById("custom-virtual-keyboard");
          if (keyboard) {
            keyboard.style.display = "block";
            updateKeyboardDisplay();
          }
        }

        function hideKeyboard() {
          const keyboard = document.getElementById("custom-virtual-keyboard");
          if (keyboard) {
            keyboard.style.display = "none";
          }
          currentActiveInput = null;
        }

        // Create the keyboard
        const virtualKeyboard = createCustomKeyboard();

        // Setup the main UI
        contentArea.style.display = "flex";
        contentArea.style.flexDirection = "column";
        contentArea.style.height = "100%";

        const container = document.createElement("div");
        container.style.padding = "20px";
        container.style.fontFamily = "Arial, sans-serif";
        contentArea.appendChild(container);

        const title = document.createElement("h2");
        title.textContent = "Game Centre";
        container.appendChild(title);

        const info = document.createElement("p");
        info.textContent =
          "Discover and play games from many different platforms.";

        const coolmathGamesData = Yui.storage.get("coolmathGamesData");

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder =
          "Search games... (Tap to open virtual keyboard)";
        searchInput.style.width = "100%";
        searchInput.style.padding = "10px";
        searchInput.style.marginBottom = "20px";
        searchInput.style.fontSize = "16px";
        searchInput.style.border = "2px solid #4CAF50";

        // Add keyboard functionality to input
        searchInput.addEventListener("focus", () => {
          showKeyboard(searchInput);
        });

        // Hide keyboard when clicking outside
        document.addEventListener("click", (e) => {
          if (
            !e.target.closest("#custom-virtual-keyboard") &&
            e.target !== searchInput
          ) {
            hideKeyboard();
          }
        });

        container.appendChild(searchInput);

        const keyboardStatus = document.createElement("p");
        keyboardStatus.textContent = "✅ Custom virtual keyboard ready";
        keyboardStatus.style.color = "#4CAF50";
        keyboardStatus.style.fontSize = "14px";
        keyboardStatus.style.margin = "0 0 10px 0";
        container.appendChild(keyboardStatus);

        const searchButton = document.createElement("button");
        searchButton.id = "search-button";
        searchButton.textContent = "Search";
        searchButton.style.padding = "10px 20px";
        searchButton.style.fontSize = "16px";
        searchButton.style.marginLeft = "10px";
        searchButton.addEventListener("click", () => {
          const query = searchInput.value.trim();
          if (query && coolmathGamesData) {
            const fuse = new Fuse(coolmathGamesData.games, {
              keys: ["title", "description", "tags"],
              threshold: 0.4,
            });
            const results = fuse.search(query).map((result) => result.item);
            displayResults(results);
          }
        });
        container.appendChild(searchButton);

        const resultsGrid = document.createElement("div");
        resultsGrid.style.display = "grid";
        resultsGrid.style.gridTemplateColumns =
          "repeat(auto-fill, minmax(150px, 1fr))";
        resultsGrid.style.gap = "20px";
        container.appendChild(resultsGrid);

        function displayResults(games) {
          resultsGrid.innerHTML = "";
          if (games.length === 0) {
            const noResults = document.createElement("p");
            noResults.textContent = "No games found.";
            resultsGrid.appendChild(noResults);
          } else {
            games.forEach((game) => {
              const gameCard = document.createElement("div");
              gameCard.style.border = "1px solid #ccc";
              gameCard.style.borderRadius = "5px";
              gameCard.style.padding = "10px";
              gameCard.style.textAlign = "center";

              const gameTitle = document.createElement("h3");
              gameTitle.textContent = game.title;
              gameCard.appendChild(gameTitle);

              const gameDescription = document.createElement("p");
              gameDescription.textContent = game.description;
              gameCard.appendChild(gameDescription);

              const playButton = document.createElement("button");
              playButton.textContent = "Play";
              playButton.style.padding = "5px 10px";
              playButton.style.fontSize = "14px";
              playButton.addEventListener("click", () => {
                window.open(
                  `https://www.coolmathgames.com/0-${game.alias}/play`,
                  "_blank"
                );
              });
              gameCard.appendChild(playButton);

              resultsGrid.appendChild(gameCard);
            });
          }
        }

        container.appendChild(info);
      },
    });
  } else {
    console.error("Yui API not found. Cannot register Game Centre app.");
  }
})();
// @require      https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js
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

  console.log("Game Centre (Yui) script loaded");
  if (unsafeWindow.Yui) {
    const Yui = unsafeWindow.Yui;
    if (
      !Yui.storage.get("coolmathGamesData") ||
      Date.now() - Yui.storage.get("coolmathGamesData").fetchedAt >
        24 * 60 * 60 * 1000
    ) {
      GM_xmlhttpRequest({
        method: "GET",
        url: "https://www.coolmathgames.com/sites/default/files/cmatgame_games_with_levels.json",
        onload: function (response) {
          try {
            const data = JSON.parse(response.responseText);
            console.log("Fetched game data:", data);
            const games = data.game;
            console.log("[CoolmathGames] Total games fetched:", games.length);
            Yui.storage.set("coolmathGamesData", {
              games,
              fetchedAt: Date.now(),
            });
          } catch (error) {
            console.error("[CoolmathGames] Error parsing game data:", error);
          }
        },
        onerror: function (error) {
          console.error("[CoolmathGames] Error fetching game data:", error);
        },
      });
    } else {
      console.log("Using cached game data");
    }
    Yui.registerApp({
      id: "games",
      name: "Game Centre",
      icon: "🎮",
      description:
        "A game interface for the Sicily Kiosk platform using the Yui API.",
      fullscreen: true,
      render: function (contentArea) {
        // Custom Virtual Keyboard Implementation
        let currentActiveInput = null;
        let isShiftActive = false;
        let isCapsLockActive = false;

        function createCustomKeyboard() {
          const keyboard = document.createElement("div");
          keyboard.id = "custom-virtual-keyboard";
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
              // Trigger search or form submission
              const searchBtn = document.querySelector("#search-button");
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
          const keyboard = document.getElementById("custom-virtual-keyboard");
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
          const keyboard = document.getElementById("custom-virtual-keyboard");
          if (keyboard) {
            keyboard.style.display = "block";
            updateKeyboardDisplay();
          }
        }

        function hideKeyboard() {
          const keyboard = document.getElementById("custom-virtual-keyboard");
          if (keyboard) {
            keyboard.style.display = "none";
          }
          currentActiveInput = null;
        }

        // Create the keyboard
        const virtualKeyboard = createCustomKeyboard();

        // Setup the main UI
        contentArea.style.display = "flex";
        contentArea.style.flexDirection = "column";
        contentArea.style.height = "100%";

        const container = document.createElement("div");
        container.style.padding = "20px";
        container.style.fontFamily = "Arial, sans-serif";
        contentArea.appendChild(container);

        const title = document.createElement("h2");
        title.textContent = "Game Centre";
        container.appendChild(title);

        const info = document.createElement("p");
        info.textContent =
          "Discover and play games from many different platforms.";

        const coolmathGamesData = Yui.storage.get("coolmathGamesData");

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder =
          "Search games... (Tap to open virtual keyboard)";
        searchInput.style.width = "100%";
        searchInput.style.padding = "10px";
        searchInput.style.marginBottom = "20px";
        searchInput.style.fontSize = "16px";
        searchInput.style.border = "2px solid #4CAF50";

        // Add keyboard functionality to input
        searchInput.addEventListener("focus", () => {
          showKeyboard(searchInput);
        });

        // Hide keyboard when clicking outside
        document.addEventListener("click", (e) => {
          if (
            !e.target.closest("#custom-virtual-keyboard") &&
            e.target !== searchInput
          ) {
            hideKeyboard();
          }
        });

        container.appendChild(searchInput);

        const keyboardStatus = document.createElement("p");
        keyboardStatus.textContent = "✅ Custom virtual keyboard ready";
        keyboardStatus.style.color = "#4CAF50";
        keyboardStatus.style.fontSize = "14px";
        keyboardStatus.style.margin = "0 0 10px 0";
        container.appendChild(keyboardStatus);

        const searchButton = document.createElement("button");
        searchButton.id = "search-button";
        searchButton.textContent = "Search";
        searchButton.style.padding = "10px 20px";
        searchButton.style.fontSize = "16px";
        searchButton.style.marginLeft = "10px";
        searchButton.addEventListener("click", () => {
          const query = searchInput.value.trim();
          if (query && coolmathGamesData) {
            const fuse = new Fuse(coolmathGamesData.games, {
              keys: ["title", "description", "tags"],
              threshold: 0.4,
            });
            const results = fuse.search(query).map((result) => result.item);
            displayResults(results);
          }
        });
        container.appendChild(searchButton);

        const resultsGrid = document.createElement("div");
        resultsGrid.style.display = "grid";
        resultsGrid.style.gridTemplateColumns =
          "repeat(auto-fill, minmax(150px, 1fr))";
        resultsGrid.style.gap = "20px";
        container.appendChild(resultsGrid);

        function displayResults(games) {
          resultsGrid.innerHTML = "";
          if (games.length === 0) {
            const noResults = document.createElement("p");
            noResults.textContent = "No games found.";
            resultsGrid.appendChild(noResults);
          } else {
            games.forEach((game) => {
              const gameCard = document.createElement("div");
              gameCard.style.border = "1px solid #ccc";
              gameCard.style.borderRadius = "5px";
              gameCard.style.padding = "10px";
              gameCard.style.textAlign = "center";

              const gameTitle = document.createElement("h3");
              gameTitle.textContent = game.title;
              gameCard.appendChild(gameTitle);

              const gameDescription = document.createElement("p");
              gameDescription.textContent = game.description;
              gameCard.appendChild(gameDescription);

              const playButton = document.createElement("button");
              playButton.textContent = "Play";
              playButton.style.padding = "5px 10px";
              playButton.style.fontSize = "14px";
              playButton.addEventListener("click", () => {
                window.open(
                  `https://www.coolmathgames.com/0-${game.alias}/play`,
                  "_blank"
                );
              });
              gameCard.appendChild(playButton);

              resultsGrid.appendChild(gameCard);
            });
          }
        }

        container.appendChild(info);
      },
    });
  } else {
    console.error("Yui API not found. Cannot register Game Centre app.");
  }
})();
