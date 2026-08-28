// ================================================================
//              [AOV Custom Background Uploader]
//   Version: 0.0.5
//   Author: Honaki Tran (https://aov.honaki.site)
//   GitHub: https://github.com/honaki-dev
//   Contact: me@honaki.site
// ================================================================

(function () {
    "use strict";

    const CONFIG = {
        VERSION: "0.0.5",
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
                * { box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
                .overlay {
                    position: fixed; inset: 0;
                    background: rgba(6,7,12,0.82);
                    display: flex; align-items: center; justify-content: center;
                    padding: 20px;
                }
                .box {
                    width: 100%; max-width: 340px;
                    background: #141726; border: 1px solid #2e3350;
                    border-radius: 14px; padding: 18px;
                    color: #f3efe4;
                }
                .title {
                    font-size: 14px; font-weight: 700; margin-bottom: 12px; text-align: center;
                }
                .stage-wrap {
                    width: 100%; max-width: 260px; margin: 0 auto;
                    aspect-ratio: ${OUT_W} / ${OUT_H};
                    background: #0a0c14; border-radius: 10px; overflow: hidden;
                    position: relative; touch-action: none; cursor: grab;
                }
                .stage-wrap.grabbing { cursor: grabbing; }
                .stage-img {
                    position: absolute; top: 0; left: 0;
                    transform-origin: 0 0;
                    pointer-events: none; user-select: none;
                    will-change: transform;
                }
                .zoom-row {
                    display: flex; align-items: center; gap: 8px; margin-top: 14px;
                }
                .zoom-row input[type=range] { flex: 1; accent-color: #f0b93f; }
                .btn-row {
                    display: flex; gap: 8px; margin-top: 16px;
                }
                button {
                    flex: 1; border: none; border-radius: 8px; padding: 10px;
                    font-size: 13px; font-weight: 600; cursor: pointer;
                }
                .btn-cancel { background: transparent; color: #96909e; border: 1px solid #2e3350; }
                .btn-confirm { background: linear-gradient(180deg,#ffd873,#f0b93f); color: #241608; }
            </style>
            <div class="overlay">
                <div class="box">
                    <div class="title">Chỉnh ảnh nền</div>
                    <div class="stage-wrap" id="stageWrap">
                        <img class="stage-img" id="stageImg" />
                    </div>
                    <div class="zoom-row">
                        <span style="color:#96909e;font-size:13px;">–</span>
                        <input type="range" id="zoomSlider" min="1" max="4" step="0.01" value="1" />
                        <span style="color:#96909e;font-size:13px;">+</span>
                    </div>
                    <div class="btn-row">
                        <button class="btn-cancel" id="btnCancel">Huỷ</button>
                        <button class="btn-confirm" id="btnConfirm">Dùng ảnh này</button>
                    </div>
                </div>
            </div>
        `;

        const stageWrap = root.getElementById("stageWrap");
        const stageImg = root.getElementById("stageImg");
        const zoomSlider = root.getElementById("zoomSlider");
        const btnCancel = root.getElementById("btnCancel");
        const btnConfirm = root.getElementById("btnConfirm");

        function close() {
            window.removeEventListener("mousemove", onWindowMouseMove);
            window.removeEventListener("mouseup", onWindowMouseUp);
            URL.revokeObjectURL(objectUrl);
            host.remove();
        }
        btnCancel.addEventListener("click", close);

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

        zoomSlider.addEventListener("input", () => {
            const cx = containerW / 2,
                cy = containerH / 2;
            const imgX = (cx - tx) / scale;
            const imgY = (cy - ty) / scale;
            zoomFactor = parseFloat(zoomSlider.value);
            scale = baseScale * zoomFactor;
            tx = cx - imgX * scale;
            ty = cy - imgY * scale;
            clampPosition();
            applyTransform();
        });

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
            const canvas = document.createElement("canvas");
            canvas.width = OUT_W;
            canvas.height = OUT_H;
            const ctx = canvas.getContext("2d");
            const sx = -tx / scale;
            const sy = -ty / scale;
            const sW = containerW / scale;
            const sH = containerH / scale;
            ctx.drawImage(img, sx, sy, sW, sH, 0, 0, OUT_W, OUT_H);
            canvas.toBlob(
                (blob) => {
                    if (blob) onConfirm(blob);
                    close();
                },
                "image/jpeg",
                0.95,
            );
        });
    }

    let lastAppliedObjectUrl = null;

    function applyBackgroundImage(blob) {
        const bgImg = findBackgroundImgEl();
        if (!bgImg) {
            alert("Không tìm thấy layer ảnh nền, thử lại sau.");
            return false;
        }

        const layerBox = findBackgroundLayerBox();
        const newUrl = URL.createObjectURL(blob);

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

        if (lastAppliedObjectUrl && lastAppliedObjectUrl !== newUrl) {
            URL.revokeObjectURL(lastAppliedObjectUrl);
        }
        lastAppliedObjectUrl = newUrl;

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

    // cmds
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
