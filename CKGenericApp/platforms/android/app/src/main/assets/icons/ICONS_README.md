Place PNG icon files for app shortcuts in this folder (app/src/main/assets/icons/).

Expected filenames (no extension when referenced in code):

- ai_search -> ic_ai_search.png
- astral_compute -> ic_astral_compute.png
- local_food -> ic_local_food.png
- memory_board -> ic_memory_board.png
- meteo -> ic_meteo.png
- news -> ic_news.png

Notes:
- The code will try to load `assets/icons/{iconName}.png` first. If not found, it will try `drawable/{iconName}` resource.
- To use the images you attached, copy them into this folder and rename them to the expected names above (e.g. `ic_ai_search.png`).
- After adding the files, rebuild the app. Shortcuts created afterwards will use these images as icons.

How to test:
1. Put PNG files into `app/src/main/assets/icons/` (or add them as drawables in `res/drawable/`).
2. Build and install the app.
3. In the app, create a shortcut for an app (Main UI > create shortcut). The pinned shortcut should use the provided image.

If you want me to also add the PNG files under `res/drawable-nodpi/`, upload them here and I will place them in the repo.
