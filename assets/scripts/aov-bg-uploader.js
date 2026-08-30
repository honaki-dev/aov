// ================================================================
//              [AOV Custom Background Uploader]
//   Version: 0.0.6
//   Author: Honaki Tran (https://aov.honaki.site)
//   GitHub: https://github.com/honaki-dev
//   Contact: me@honaki.site
// ================================================================

(function () {
    "use strict";

    const CONFIG = {
        VERSION: "0.0.6",
        AUTHOR: "Honaki Tran",
        GITHUB: "https://github.com/honaki-dev",
        WEBSITE: "https://aov.honaki.site",
    };

    console.log("[AOV BG Uploader] Loaded!");
    console.log(`%c📦 Version: ${CONFIG.VERSION}`, "color:#96909e;");
    console.log(`%c👨‍💻 Author: ${CONFIG.AUTHOR}`, "color:#96909e;");
    console.log(`%c🔗 GitHub: ${CONFIG.GITHUB}`, "color:#4ade80;");
    console.log(`%c🔗 Website: ${CONFIG.WEBSITE}`, "color:#4ade80;");

    const nowLocation = window.location.pathname
        .replace("/app/", "")
        .replace(/\/+$/, "");
    const selector = {
        "flowborn-poster-editor": {
            backgroundLayer: ".container-EHg4Y > div[data-id]",
            backgroundImage: ".container-EHg4Y img[data-id]",
        },
        "player-poster-editor": {
            backgroundLayer: ".container-g_mSG > div[data-id]",
            backgroundImage: ".container-g_mSG img[data-id]",
        },
    };
    const selectorConfig = selector[nowLocation];
    if (!selectorConfig) {
        console.warn("[AOV BG Uploader] Trang không được hỗ trợ:", nowLocation);
        return;
    }
    const bgLayerSelect = selectorConfig.backgroundLayer;
    const bgImgSelect = selectorConfig.backgroundImage;

    function findBackgroundLayerBox() {
        const boxes = document.querySelectorAll(bgLayerSelect);
        let best = null,
            bestArea = 0;
        boxes.forEach((box) => {
            const area = box.offsetWidth * box.offsetHeight;
            if (area > bestArea) {
                bestArea = area;
                best = box;
            }
        });
        return best;
    }

    function findBackgroundImgEl() {
        const imgs = document.querySelectorAll(bgImgSelect);
        if (imgs.length === 0) return null;
        if (nowLocation.includes("flowborn")) {
            return imgs[imgs.length - 1];
        }
        let best = null,
            bestArea = 0;
        imgs.forEach((img) => {
            const area = img.offsetWidth * img.offsetHeight;
            if (area > bestArea) {
                bestArea = area;
                best = img;
            }
        });
        return best || imgs[imgs.length - 1];
    }

    function getImageDisplayRatio(imgEl) {
        if (!imgEl || !imgEl.offsetWidth || !imgEl.offsetHeight)
            return 1701 / 1080;
        return imgEl.offsetHeight / imgEl.offsetWidth;
    }

    function openCropModal(file, onConfirm) {
        const currentImg = findBackgroundImgEl();
        const aspect = currentImg
            ? getImageDisplayRatio(currentImg)
            : 1701 / 1080;

        const layerBox = findBackgroundLayerBox();
        const finalAspect =
            layerBox && layerBox.offsetWidth && layerBox.offsetHeight
                ? layerBox.offsetHeight / layerBox.offsetWidth
                : aspect;

        const OUT_W = 1080;
        const OUT_H = Math.round(OUT_W * finalAspect);

        const host = document.createElement("div");
        host.id = "aov-crop-modal-host";
        host.style.cssText = "position:fixed;inset:0;z-index:2147483647;";
        document.body.appendChild(host);
        const root = host.attachShadow({ mode: "open" });

        root.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    -webkit-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                }
                .adm-mask {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
                }
                .camp-game-model {
                    position: relative;
                    width: 100%;
                    max-width: 360px;
                    display: flex;
                    justify-content: center;
                }
                .camp-game-model__container {
                    background: linear-gradient(#333469 0%, #4d559d 100%);
                    border: none;
                    outline: none;
                    border-radius: 4px;
                    flex-direction: column;
                    width: 100%;
                    display: flex;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
                }
                .camp-game-model__close {
                    cursor: pointer;
                    z-index: 10;
                    justify-content: center;
                    align-items: center;
                    display: flex;
                    position: absolute;
                    top: 11px;
                    right: 14px;
                    width: 20px;
                    height: 20px;
                }
                .camp-game-model__close img {
                    width: 20px;
                    height: 20px;
                    display: block;
                    pointer-events: none;
                }
                .camp-game-model__header {
                    color: #fae7bd;
                    border-top: 1px solid #7d5f56;
                    border-bottom: 1px solid #7d5f56;
                    align-items: center;
                    font-weight: 500;
                    display: flex;
                    position: relative;
                    height: 42px;
                    overflow: hidden;
                }
                .camp-game-model__header-bg {
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                }
                .camp-game-model__header-bg img {
                    height: 100%;
                    display: block;
                }
                .camp-game-model__title {
                    z-index: 1;
                    color: #fae7bd;
                    font-weight: 500;
                    position: relative;
                    font-size: 15px;
                    margin-left: 16px;
                    letter-spacing: 0.04em;
                }
                .camp-game-model__content {
                    padding: 16px 18px 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                .stage-wrap {
                    width: 100%;
                    max-width: 260px;
                    margin: 0 auto;
                    aspect-ratio: ${OUT_W} / ${OUT_H};
                    background: #0d0f1f;
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    overflow: hidden;
                    position: relative;
                    touch-action: none;
                    cursor: grab;
                }
                .stage-wrap.grabbing {
                    cursor: grabbing;
                }
                .stage-img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    transform-origin: 0 0;
                    pointer-events: none;
                    user-select: none;
                    will-change: transform;
                }
                .zoom-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 100%;
                    max-width: 260px;
                    margin-top: 14px;
                    height: 24px;
                    user-select: none;
                }
                .zoom-btn {
                    all: unset;
                    cursor: pointer;
                    color: #fae7bd;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.08);
                    transition: background 0.15s ease, transform 0.1s ease;
                    flex-shrink: 0;
                    box-sizing: border-box;
                }
                .zoom-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                }
                .zoom-btn:active {
                    transform: scale(0.92);
                }
                .zoom-slider-wrap {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    height: 24px;
                }
                .zoom-slider-wrap input[type=range] {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 18px;
                    background: transparent;
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    cursor: pointer;
                    margin: 0;
                    padding: 0;
                    display: block;
                }
                .zoom-slider-wrap input[type=range]:focus {
                    outline: none !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                .zoom-slider-wrap input[type=range]::-webkit-slider-runnable-track {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.22);
                    border-radius: 999px;
                    border: none;
                    outline: none;
                }
                .zoom-slider-wrap input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: linear-gradient(180deg, #ffe182 0%, #f0b93f 100%);
                    border: 1.5px solid #ffffff;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
                    cursor: pointer;
                    margin-top: -5px;
                    transition: transform 0.1s ease;
                }
                .zoom-slider-wrap input[type=range]::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
                .zoom-slider-wrap input[type=range]::-moz-range-track {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.22);
                    border-radius: 999px;
                    border: none;
                }
                .zoom-slider-wrap input[type=range]::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: linear-gradient(180deg, #ffe182 0%, #f0b93f 100%);
                    border: 1.5px solid #ffffff;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
                    cursor: pointer;
                    transition: transform 0.1s ease;
                }
                .zoom-slider-wrap input[type=range]::-moz-range-thumb:hover {
                    transform: scale(1.2);
                }
                .camp-game-model__footer {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 0 18px 18px;
                    gap: 10px;
                }
                button {
                    font-family: inherit;
                    cursor: pointer;
                    border: none;
                    border-radius: 4px;
                    padding: 10px 14px;
                    font-size: 13px;
                    font-weight: 500;
                    letter-spacing: 0.01em;
                    text-align: center;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    box-sizing: border-box;
                    user-select: none;
                }
                .btn-ghost {
                    height: 38px;
                    color: #ffffff;
                    background:
                        url(https://aov.honaki.site/assets/imgs/buttons/secondary-decorate.png) 50% / contain no-repeat,
                        linear-gradient(#5867c0 0%, #7b9be6 100%);
                    box-shadow: inset 0 1px #688cdb, inset 0 -2px #80abff;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }
                .btn-ghost:hover { filter: brightness(1.06); }
                .btn-ghost:active { filter: brightness(0.94); }

                .btn-primary {
                    height: 38px;
                    color: #ffffff;
                    background:
                        url(https://aov.honaki.site/assets/imgs/buttons/primary-decorate.png) 50% / contain no-repeat,
                        linear-gradient(#bf8357 0%, #dfb16d 100%);
                    box-shadow: inset 0 1px #dca369, inset 0 -2px #ffcb78;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }
                .btn-primary:hover { filter: brightness(1.06); }
                .btn-primary:active { filter: brightness(0.94); }
            </style>
            <div class="adm-mask" id="admMask">
                <div class="camp-game-model">
                    <div class="camp-game-model__container">
                        <div class="camp-game-model__close" id="btnModalClose">
                            <img src="https://aov.honaki.site/assets/imgs/modal/close-icon.png" alt="Close" />
                        </div>
                        <div class="camp-game-model__header">
                            <div class="camp-game-model__header-bg">
                                <img src="https://aov.honaki.site/assets/imgs/modal/model-top-bg.png" alt="" />
                            </div>
                            <div class="camp-game-model__title">Chỉnh ảnh nền</div>
                        </div>
                        <div class="camp-game-model__content">
                            <div class="stage-wrap" id="stageWrap">
                                <img class="stage-img" id="stageImg" />
                            </div>
                            <div class="zoom-row">
                                <button type="button" class="zoom-btn" id="zoomOutBtn" aria-label="Thu nhỏ">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </button>
                                <div class="zoom-slider-wrap">
                                    <input type="range" id="zoomSlider" min="1" max="4" step="0.01" value="1" />
                                </div>
                                <button type="button" class="zoom-btn" id="zoomInBtn" aria-label="Phóng to">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </button>
                            </div>
                        </div>
                        <div class="camp-game-model__footer">
                            <button type="button" class="btn-ghost" id="btnCancel">Huỷ</button>
                            <button type="button" class="btn-primary" id="btnConfirm">Dùng ảnh này</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const admMask = root.getElementById("admMask");
        const btnModalClose = root.getElementById("btnModalClose");
        const stageWrap = root.getElementById("stageWrap");
        const stageImg = root.getElementById("stageImg");
        const zoomSlider = root.getElementById("zoomSlider");
        const zoomOutBtn = root.getElementById("zoomOutBtn");
        const zoomInBtn = root.getElementById("zoomInBtn");
        const btnCancel = root.getElementById("btnCancel");
        const btnConfirm = root.getElementById("btnConfirm");

        function close() {
            window.removeEventListener("mousemove", onWindowMouseMove);
            window.removeEventListener("mouseup", onWindowMouseUp);
            window.removeEventListener("keydown", onKeyDown);
            URL.revokeObjectURL(objectUrl);
            host.remove();
        }
        function onKeyDown(e) {
            if (e.key === "Escape") close();
        }
        window.addEventListener("keydown", onKeyDown);
        btnCancel.addEventListener("click", close);
        btnModalClose.addEventListener("click", close);
        admMask.addEventListener("click", (e) => {
            if (e.target === admMask) close();
        });

        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        let naturalW = 0,
            naturalH = 0;
        let containerW = 0,
            containerH = 0;
        let baseScale = 1,
            scale = 1,
            zoomFactor = 1;
        let tx = 0,
            ty = 0;
        let dragging = false,
            lastX = 0,
            lastY = 0;

        function clamp(v, min, max) {
            return Math.min(max, Math.max(min, v));
        }
        function clampPosition() {
            const dispW = naturalW * scale;
            const dispH = naturalH * scale;
            tx = clamp(tx, containerW - dispW, 0);
            ty = clamp(ty, containerH - dispH, 0);
        }
        function applyTransform() {
            stageImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        }
        function measure() {
            const rect = stageWrap.getBoundingClientRect();
            containerW = rect.width;
            containerH = rect.height;
        }

        img.onload = function () {
            naturalW = img.naturalWidth;
            naturalH = img.naturalHeight;
            stageImg.src = objectUrl;
            stageImg.style.width = naturalW + "px";
            stageImg.style.height = naturalH + "px";

            measure();
            baseScale = Math.max(containerW / naturalW, containerH / naturalH);
            zoomFactor = 1;
            scale = baseScale;
            tx = (containerW - naturalW * scale) / 2;
            ty = (containerH - naturalH * scale) / 2;
            clampPosition();
            applyTransform();
        };
        img.onerror = function () {
            alert("Không thể tải ảnh này. Vui lòng thử chọn ảnh khác.");
            close();
        };
        img.src = objectUrl;

        function applyZoom(newVal) {
            const val = clamp(newVal, 1, 4);
            zoomSlider.value = val;
            const cx = containerW / 2,
                cy = containerH / 2;
            const imgX = (cx - tx) / scale;
            const imgY = (cy - ty) / scale;
            zoomFactor = val;
            scale = baseScale * zoomFactor;
            tx = cx - imgX * scale;
            ty = cy - imgY * scale;
            clampPosition();
            applyTransform();
        }

        zoomSlider.addEventListener("input", () => {
            applyZoom(parseFloat(zoomSlider.value));
        });

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener("click", () => {
                applyZoom(parseFloat(zoomSlider.value) - 0.25);
            });
        }

        if (zoomInBtn) {
            zoomInBtn.addEventListener("click", () => {
                applyZoom(parseFloat(zoomSlider.value) + 0.25);
            });
        }

        function startDrag(x, y) {
            dragging = true;
            lastX = x;
            lastY = y;
            stageWrap.classList.add("grabbing");
        }
        function moveDrag(x, y) {
            if (!dragging) return;
            tx += x - lastX;
            ty += y - lastY;
            lastX = x;
            lastY = y;
            clampPosition();
            applyTransform();
        }
        function endDrag() {
            dragging = false;
            stageWrap.classList.remove("grabbing");
        }
        const onWindowMouseMove = (e) => moveDrag(e.clientX, e.clientY);
        const onWindowMouseUp = () => endDrag();
        stageWrap.addEventListener("mousedown", (e) =>
            startDrag(e.clientX, e.clientY),
        );
        window.addEventListener("mousemove", onWindowMouseMove);
        window.addEventListener("mouseup", onWindowMouseUp);
        stageWrap.addEventListener(
            "touchstart",
            (e) => {
                const t = e.touches[0];
                startDrag(t.clientX, t.clientY);
            },
            { passive: true },
        );
        stageWrap.addEventListener(
            "touchmove",
            (e) => {
                const t = e.touches[0];
                moveDrag(t.clientX, t.clientY);
            },
            { passive: true },
        );
        stageWrap.addEventListener("touchend", endDrag);

        btnConfirm.addEventListener("click", () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = OUT_W;
                canvas.height = OUT_H;
                const ctx = canvas.getContext("2d");
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                const sx = -tx / scale;
                const sy = -ty / scale;
                const sW = containerW / scale;
                const sH = containerH / scale;
                ctx.drawImage(img, sx, sy, sW, sH, 0, 0, OUT_W, OUT_H);

                const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
                if (onConfirm) onConfirm(dataUrl);
            } catch (err) {
                console.error("[AOV BG Uploader] Crop error:", err);
            } finally {
                close();
            }
        });
    }

    let lastAppliedObjectUrl = null;

    function applyBackgroundImage(imageInput) {
        const bgImg = findBackgroundImgEl();
        if (!bgImg) {
            alert("Không tìm thấy layer ảnh nền, thử lại sau.");
            return false;
        }

        const layerBox = findBackgroundLayerBox();
        const isString = typeof imageInput === "string";
        const newUrl = isString ? imageInput : URL.createObjectURL(imageInput);

        if (layerBox) {
            const w = layerBox.offsetWidth;
            const h = layerBox.offsetHeight;

            bgImg.style.width = w + "px";
            bgImg.style.height = h + "px";
            bgImg.style.objectFit = "cover";
            bgImg.style.objectPosition = "center center";

            bgImg.style.display = "block";
            bgImg.style.position = "absolute";
            bgImg.style.top = "0";
            bgImg.style.left = "0";
        }

        bgImg.removeAttribute("srcset");
        bgImg.removeAttribute("sizes");
        bgImg.src = newUrl;

        if (!isString) {
            if (lastAppliedObjectUrl && lastAppliedObjectUrl !== newUrl) {
                URL.revokeObjectURL(lastAppliedObjectUrl);
            }
            lastAppliedObjectUrl = newUrl;
        }

        return true;
    }

    function injectUploadTile() {
        const grid = document.querySelector(".camp-grid-list");
        if (!grid) return;
        if (grid.querySelector("[data-aov-upload-tile]")) return;

        const tile = document.createElement("div");
        tile.className = "camp-grid-list__item camp-grid-list__item--square";
        tile.setAttribute("data-aov-upload-tile", "1");
        tile.style.padding = "4px";
        tile.innerHTML = `
            <div class="camp-grid-list__item-placeholder">
                <div class="camp-grid-list__item-content">
                    <div style="
                        width:100%;height:100%;
                        display:flex;align-items:center;justify-content:center;
                        border:1.5px dashed rgba(255,255,255,0.5);
                        border-radius:8px;
                        background:rgba(255,255,255,0.06);
                        cursor:pointer;
                    ">
                        <span style="font-size:26px;color:#fff;line-height:1;">+</span>
                    </div>
                </div>
            </div>
        `;

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.style.display = "none";

        tile.addEventListener("click", () => {
            fileInput.value = "";
            fileInput.click();
        });

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            openCropModal(file, (blob) => {
                applyBackgroundImage(blob);
            });
        });

        tile.appendChild(fileInput);
        grid.insertBefore(tile, grid.firstChild);
    }

    injectUploadTile();

    document.addEventListener("click", (e) => {
        const tile = e.target.closest(
            ".camp-grid-list__item, [dt-eid='yuan_edit_background']",
        );
        if (
            !tile ||
            tile.hasAttribute("data-aov-upload-tile") ||
            tile.querySelector("[data-aov-upload-tile]")
        )
            return;

        if (lastAppliedObjectUrl) {
            URL.revokeObjectURL(lastAppliedObjectUrl);
            lastAppliedObjectUrl = null;
        }

        const thumbImg = tile.querySelector("img");
        if (thumbImg && thumbImg.src) {
            const bgImg = findBackgroundImgEl();
            if (bgImg) {
                const fullSrc = thumbImg.src.split("?")[0];
                bgImg.src = fullSrc;
            }
        }
    });

    new MutationObserver(() => {
        injectUploadTile();
    }).observe(document.body, {
        childList: true,
        subtree: true,
    });

    function uploadFunction() {
        const uploadTile = document.querySelector("[data-aov-upload-tile]");
        if (uploadTile) {
            uploadTile.click();
        } else {
            const tempInput = document.createElement("input");
            tempInput.type = "file";
            tempInput.accept = "image/*";
            tempInput.style.display = "none";
            tempInput.onchange = (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) openCropModal(file, applyBackgroundImage);
                tempInput.remove();
            };
            document.body.appendChild(tempInput);
            tempInput.click();
        }
    }
    window.__AOV = {
        upload: uploadFunction,
        version: CONFIG.VERSION,
        author: CONFIG.AUTHOR,
        github: CONFIG.GITHUB,
    };

    console.log("[AOV BG Uploader] Commands:");
    console.log("> __AOV.upload() -> mở upload");
})();
