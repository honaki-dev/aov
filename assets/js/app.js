(function () {
    const OUT_W = 1080,
        OUT_H = 1701;

    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const cropContainer = document.getElementById("cropContainer");
    const cropStage = document.getElementById("cropStage");
    const cropImg = document.getElementById("cropImg");
    const emptyState = document.getElementById("emptyState");
    const zoomSlider = document.getElementById("zoomSlider");
    const submitBtn = document.getElementById("submitBtn");
    const resetBtn = document.getElementById("resetBtn");
    const apiEndpoint = {
        value: "https://api.honaki.site",
    };
    const playerUrl = document.getElementById("playerUrl");
    const pasteBtn = document.getElementById("pasteBtn");
    const linkStatusEl = document.getElementById("linkStatus");
    const statusLine = document.getElementById("statusLine");
    const modalOverlay = document.getElementById("modalOverlay");
    const modalBox = document.getElementById("modalBox");
    const modalIcon = document.getElementById("modalIcon");
    const modalPreviewImg = document.getElementById("modalPreviewImg");
    const modalMessage = document.getElementById("modalMessage");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalCloseX = document.getElementById("modalCloseX");
    const hiddenCanvas = document.getElementById("hiddenCanvas");
    let isProcessing = false;
    let modalPreviewObjectUrl = null;

    // 7 tham số bắt buộc để tạo globalHeaders phía worker
    const REQUIRED_PARAMS = [
        { key: "partition", label: "partition" },
        { key: "channelid", label: "channelid" },
        { key: "gameid", label: "gameid" },
        { key: "itopencodeparam", label: "itopencodeparam" },
        { key: "os", label: "os" },
        { key: "lang", label: "lang" },
        { key: "aov_region", label: "aov_region" },
    ];

    // Cho phép người dùng dán nguyên cả đoạn text/lỗi trình duyệt,
    // tự tìm URL http(s) nằm bên trong.
    function extractUrlFromText(text) {
        if (!text) return null;
        const match = text.match(/https?:\/\/[^\s"'<>]+/);
        return match ? match[0] : null;
    }

    function renderLinkStatus(rawValue) {
        linkStatusEl.innerHTML = "";
        const raw = (rawValue || "").trim();
        if (!raw) return;

        const url = extractUrlFromText(raw);
        if (!url) {
            const msg = document.createElement("div");
            msg.className = "link-status-msg err";
            msg.textContent =
                "Không tìm thấy link hợp lệ trong nội dung đã dán.";
            linkStatusEl.appendChild(msg);
            return;
        }

        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            const msg = document.createElement("div");
            msg.className = "link-status-msg err";
            msg.textContent = "Link không đúng định dạng URL.";
            linkStatusEl.appendChild(msg);
            return;
        }

        const params = parsed.searchParams;
        let missing = 0;
        REQUIRED_PARAMS.forEach(({ key, label }) => {
            const has = !!params.get(key);
            if (!has) missing++;
            const chip = document.createElement("span");
            chip.className = "link-chip " + (has ? "ok" : "missing");
            const dot = document.createElement("span");
            dot.className = "dot";
            chip.appendChild(dot);
            chip.appendChild(document.createTextNode(label));
            linkStatusEl.appendChild(chip);
        });

        const msg = document.createElement("div");
        msg.className = "link-status-msg " + (missing === 0 ? "ok" : "err");
        msg.textContent =
            missing === 0
                ? "Link hợp lệ"
                : `Thiếu ${missing} tham số, hãy lấy lại link mới`;
        linkStatusEl.appendChild(msg);
    }

    playerUrl.addEventListener("input", () =>
        renderLinkStatus(playerUrl.value),
    );
    playerUrl.addEventListener("paste", () => {
        // đợi nội dung paste được chèn xong rồi mới xử lý
        setTimeout(() => {
            const extracted = extractUrlFromText(playerUrl.value);
            if (extracted) playerUrl.value = extracted; // tự dọn, chỉ giữ lại link
            renderLinkStatus(playerUrl.value);
        }, 0);
    });

    // --- nút Dán (đọc clipboard) ---
    pasteBtn.addEventListener("click", async () => {
        if (isProcessing) return;
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                throw new Error("unsupported");
            }
            const text = await navigator.clipboard.readText();
            const extracted = extractUrlFromText(text) || text.trim();
            if (!extracted) throw new Error("empty");
            playerUrl.value = extracted;
            renderLinkStatus(playerUrl.value);
            playerUrl.focus();
        } catch (err) {
            // Fallback khi trình duyệt chặn quyền đọc clipboard hoặc không hỗ trợ
            showModal(
                "Không thể tự dán (trình duyệt chặn quyền truy cập clipboard). Hãy nhấn giữ vào ô Link rồi chọn Dán, hoặc bấm Ctrl+V.",
                "error",
            );
            playerUrl.focus();
        }
    });

    function showModal(message, type = "error", previewUrl = null) {
        modalBox.className = "modal-box " + type;
        modalIcon.textContent = type === "success" ? "✓" : "!";
        modalMessage.textContent = message;
        if (previewUrl) {
            modalPreviewImg.src = previewUrl;
            modalPreviewImg.classList.add("show");
        } else {
            modalPreviewImg.classList.remove("show");
            modalPreviewImg.removeAttribute("src");
        }
        modalOverlay.classList.add("show");
    }
    function closeModal() {
        modalOverlay.classList.remove("show");
        if (modalPreviewObjectUrl) {
            URL.revokeObjectURL(modalPreviewObjectUrl);
            modalPreviewObjectUrl = null;
        }
    }
    modalCloseBtn.addEventListener("click", closeModal);
    modalCloseX.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalOverlay.classList.contains("show")) {
            closeModal();
        }
    });
    let img = new Image();
    let naturalW = 0,
        naturalH = 0;
    let baseScale = 1; // scale so image covers the container at zoom=1
    let scale = 1; // baseScale * zoomFactor
    let zoomFactor = 1;
    let tx = 0,
        ty = 0; // top-left position of image within container (px)
    let containerW = 0,
        containerH = 0;
    let dragging = false;
    let lastX = 0,
        lastY = 0;
    let hasImage = false;
    let currentFileName = "image.jpg";

    function setStatus(msg, type) {
        statusLine.textContent = msg;
        statusLine.className = "status-line show" + (type ? " " + type : "");
    }
    function clearStatus() {
        statusLine.textContent = "";
        statusLine.className = "status-line";
    }

    function setProcessing(state) {
        isProcessing = state;
        submitBtn.disabled = state || !hasImage;
        resetBtn.disabled = state;
        zoomSlider.disabled = state || !hasImage;
        dropzone.classList.toggle("disabled", state);
        cropStage.classList.toggle("disabled", state);
    }

    function measureContainer() {
        const rect = cropContainer.getBoundingClientRect();
        containerW = rect.width;
        containerH = rect.height;
    }

    function clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    }

    function clampPosition() {
        const dispW = naturalW * scale;
        const dispH = naturalH * scale;
        const minTx = containerW - dispW;
        const minTy = containerH - dispH;
        tx = clamp(tx, minTx, 0);
        ty = clamp(ty, minTy, 0);
    }

    function applyTransform() {
        cropImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }

    function loadImageFile(file) {
        if (isProcessing) return;
        if (!file || !file.type.startsWith("image/")) return;
        currentFileName = file.name || "image.jpg";
        const url = URL.createObjectURL(file);
        img = new Image();
        img.onload = function () {
            naturalW = img.naturalWidth;
            naturalH = img.naturalHeight;
            cropImg.src = url;
            cropImg.style.width = naturalW + "px";
            cropImg.style.height = naturalH + "px";
            cropImg.style.display = "block";
            emptyState.style.display = "none";

            measureContainer();
            baseScale = Math.max(containerW / naturalW, containerH / naturalH);
            zoomFactor = 1;
            scale = baseScale;
            // center the image
            tx = (containerW - naturalW * scale) / 2;
            ty = (containerH - naturalH * scale) / 2;
            clampPosition();
            applyTransform();

            zoomSlider.value = 1;
            zoomSlider.disabled = false;
            submitBtn.disabled = false;
            hasImage = true;
            clearStatus();
        };
        img.src = url;
    }

    // --- file input / dropzone ---
    dropzone.addEventListener("click", () => {
        if (isProcessing) return;
        fileInput.click();
    });
    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0])
            loadImageFile(e.target.files[0]);
    });
    ["dragenter", "dragover"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            if (isProcessing) return;
            dropzone.classList.add("drag");
        });
    });
    ["dragleave", "drop"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzone.classList.remove("drag");
        });
    });
    dropzone.addEventListener("drop", (e) => {
        if (isProcessing) return;
        if (e.dataTransfer.files && e.dataTransfer.files[0])
            loadImageFile(e.dataTransfer.files[0]);
    });

    // --- zoom ---
    zoomSlider.addEventListener("input", () => {
        if (!hasImage || isProcessing) return;
        const cx = containerW / 2,
            cy = containerH / 2;
        // image-space point currently at container center, before zoom change
        const imgX = (cx - tx) / scale;
        const imgY = (cy - ty) / scale;

        zoomFactor = parseFloat(zoomSlider.value);
        scale = baseScale * zoomFactor;

        // keep the same image point centered after zoom
        tx = cx - imgX * scale;
        ty = cy - imgY * scale;
        clampPosition();
        applyTransform();
    });

    // --- drag (mouse + touch) ---
    function startDrag(x, y) {
        if (!hasImage || isProcessing) return;
        dragging = true;
        lastX = x;
        lastY = y;
        cropStage.classList.add("grabbing");
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
        cropStage.classList.remove("grabbing");
    }

    cropStage.addEventListener("mousedown", (e) =>
        startDrag(e.clientX, e.clientY),
    );
    window.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
    window.addEventListener("mouseup", endDrag);

    cropStage.addEventListener(
        "touchstart",
        (e) => {
            const t = e.touches[0];
            startDrag(t.clientX, t.clientY);
        },
        { passive: true },
    );
    cropStage.addEventListener(
        "touchmove",
        (e) => {
            const t = e.touches[0];
            moveDrag(t.clientX, t.clientY);
        },
        { passive: true },
    );
    cropStage.addEventListener("touchend", endDrag);

    window.addEventListener("resize", () => {
        if (!hasImage) return;
        measureContainer();
        baseScale = Math.max(containerW / naturalW, containerH / naturalH);
        scale = baseScale * zoomFactor;
        clampPosition();
        applyTransform();
    });

    // --- reset ---
    resetBtn.addEventListener("click", () => {
        hasImage = false;
        cropImg.style.display = "none";
        cropImg.src = "";
        emptyState.style.display = "flex";
        zoomSlider.value = 1;
        zoomSlider.disabled = true;
        submitBtn.disabled = true;
        fileInput.value = "";
        clearStatus();
    });

    // --- produce final cropped blob at 320x504 ---
    function getCroppedBlob() {
        return new Promise((resolve, reject) => {
            const ctx = hiddenCanvas.getContext("2d");
            ctx.clearRect(0, 0, OUT_W, OUT_H);

            const sx = -tx / scale;
            const sy = -ty / scale;
            const sW = containerW / scale;
            const sH = containerH / scale;

            try {
                ctx.drawImage(img, sx, sy, sW, sH, 0, 0, OUT_W, OUT_H);
            } catch (e) {
                reject(e);
                return;
            }
            hiddenCanvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Không tạo được ảnh crop"));
                },
                "image/png",
                0.95,
            );
        });
    }

    // --- submit ---
    submitBtn.addEventListener("click", async () => {
        clearStatus();
        const endpoint = apiEndpoint.value.trim();
        const purl = extractUrlFromText(playerUrl.value);

        if (!endpoint) {
            showModal("Thiếu Worker API endpoint.", "error");
            return;
        }
        if (!purl) {
            showModal(
                "Không tìm thấy link hợp lệ - dán lại link từ trình duyệt.",
                "error",
            );
            return;
        }
        try {
            const parsed = new URL(purl);
            const missing = REQUIRED_PARAMS.filter(
                ({ key }) => !parsed.searchParams.get(key),
            );
            if (missing.length > 0) {
                showModal(
                    `Link thiếu ${missing.length} tham số (${missing
                        .map((m) => m.label)
                        .join(", ")}) - poster có thể lỗi.`,
                    "error",
                );
            }
        } catch {
            showModal("Link không đúng định dạng URL.", "error");
            return;
        }
        if (!hasImage) {
            showModal("Chưa chọn ảnh.", "error");
            return;
        }

        setProcessing(true);
        setStatus("Crop ảnh...");

        try {
            const blob = await getCroppedBlob();

            const form = new FormData();
            form.append("url", purl);
            form.append(
                "image",
                blob,
                currentFileName.replace(/\.[^.]+$/, "") + "_cropped.png",
            );

            setStatus("Đang đổi...");
            const resp = await fetch(endpoint, {
                method: "POST",
                body: form,
            });
            const data = await resp.json().catch(() => ({}));

            if (data.ok) {
                setStatus("Thành công", "success");
                modalPreviewObjectUrl = URL.createObjectURL(blob);
                showModal(
                    "Đổi ảnh poster thành công!",
                    "success",
                    modalPreviewObjectUrl,
                );
            } else {
                setStatus("Thất bại", "error");
                const errMsg = data.error || "";
                const resultBlob = (
                    JSON.stringify(data.result || "") +
                    " " +
                    JSON.stringify(data.details || "")
                ).toLowerCase();

                if (resp.status === 403 && /createposter/i.test(errMsg)) {
                    showModal(
                        "Link đã sai hoặc hết hạn - vui lòng lấy link mới.",
                        "error",
                    );
                } else if (
                    /pic\s*invalid/i.test(errMsg) ||
                    resultBlob.includes("pic invalid")
                ) {
                    showModal(
                        "Ảnh có thể chứa nội dung nhạy cảm - vui lòng đổi ảnh khác.",
                        "error",
                    );
                } else {
                    showModal(
                        errMsg || "Đã xảy ra lỗi, vui lòng thử lại.",
                        "error",
                    );
                }
            }
        } catch (err) {
            setStatus("Thất bại", "error");
            showModal("Không thể kết nối tới máy chủ - thử lại sau.", "error");
        } finally {
            setProcessing(false);
        }
    });
})();
