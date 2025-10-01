# SicilyKiosk Hijacker + Yui

This is a simple website i made to bypass the chrome sandbox contained in [Digikiosk 2.0](https://www.techlabworks.com/technical_data/Brochure%20Digikiosk%20Table.pdf) totems.

It features Yui, a "jailbreak" for the default page shown on digikiosk variants named "Sicilykiosks" which allows users to publish scripts specifivally targeting those units.

# Yui 

Yui features some apis (storage and others coming soon) that developers can use to extend the normal sicilykiosk functionality and can also go hidden if needed.

## Included apps
### Youtube
Youtube client specifically designed for kiosk usage that uses Yui apis to prevent the kiosk's default cooldown to make the video start over
### Game Center
A multi-platform game launcher comfortable to use on bigger screens (currently only supports CoolMathGames)

# Roadmap
- Yui Native Bridge (Would allow to offload work to native apps and for exposing windows apis)
- More Apps
- Information exchange between diffrent kiosks running Yui (via Yui.network)

# AI
### Where AI Helped:
AI (Mostly Tab Completions) helped build UI code (for example the mini apps components/virtual keyboards) and some api logic
