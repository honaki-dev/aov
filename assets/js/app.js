(function () {
    const OUT_W = 1080,
        OUT_H = 1701;
    const MAX_HAR_FILE_SIZE = 30 * 1024 * 1024; // 30MB

    const apiEndpoint = {
        value: "https://api.honaki.site",
    };
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const cropContainer = document.getElementById("cropContainer");
    const cropStage = document.getElementById("cropStage");
    const cropImg = document.getElementById("cropImg");
    const emptyState = document.getElementById("emptyState");
    const zoomSlider = document.getElementById("zoomSlider");
    const submitBtn = document.getElementById("submitBtn");
    const resetBtn = document.getElementById("resetBtn");
    const playerUrl = document.getElementById("playerUrl");
    const pasteBtn = document.getElementById("pasteBtn");
    const modeLinkBtn = document.getElementById("modeLinkBtn");
    const modeHarBtn = document.getElementById("modeHarBtn");
    const linkModeWrap = document.getElementById("linkModeWrap");
    const harModeWrap = document.getElementById("harModeWrap");
    const harDropzone = document.getElementById("harDropzone");
    const harFileInput = document.getElementById("harFileInput");
    const harDropzoneEmpty = document.getElementById("harDropzoneEmpty");
    const harDropzoneSelected = document.getElementById("harDropzoneSelected");
    const harDropzoneText = document.getElementById("harDropzoneText");
    const shareOptionOff = document.getElementById("shareOptionOff");
    const shareOptionOn = document.getElementById("shareOptionOn");
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
    let inputMode = "link"; // "link" | "har"
    let harFile = null;
    let shareEnabled = false;

    const REQUIRED_PARAMS = [
        { key: "partition", label: "partition" },
        { key: "channelid", label: "channelid" },
        { key: "gameid", label: "gameid" },
        { key: "itopencodeparam", label: "itopencodeparam" },
        { key: "os", label: "os" },
        { key: "lang", label: "lang" },
        { key: "aov_region", label: "aov_region" },
    ];

    function validateLinkParams(url) {
        try {
            const parsed = new URL(url);
            const missing = REQUIRED_PARAMS.filter(
                ({ key }) => !parsed.searchParams.get(key),
            );
            return {
                valid: missing.length === 0,
                missing: missing,
                missingCount: missing.length,
            };
        } catch {
            return {
                valid: false,
                missing: [],
                missingCount: 0,
            };
        }
    }

    function extractUrlFromText(text) {
        if (!text) return null;
        const match = text.match(/https?:\/\/[^\s"'<>]+/);
        return match ? match[0] : null;
    }

    function setStatus(msg, type) {
        statusLine.textContent = msg;
        statusLine.className = "status-line show" + (type ? " " + type : "");
    }

    function clearStatus() {
        statusLine.textContent = "";
        statusLine.className = "status-line";
    }

    // Chỉ check "có nhập/chọn gì chưa" để bật nút - còn đúng/sai thật sự
    // (đủ tham số, parse được, har hợp lệ...) sẽ check khi bấm nút submit.
    function hasInputForCurrentMode() {
        if (inputMode === "link") {
            return !!extractUrlFromText(playerUrl.value);
        }
        return !!harFile;
    }

    function updateSubmitButton() {
        const ready = hasInputForCurrentMode() && hasImage && !isProcessing;
        submitBtn.disabled = !ready;

        if (!hasInputForCurrentMode()) {
            submitBtn.title =
                inputMode === "link" ? "Chưa nhập link" : "Chưa chọn file HAR";
        } else if (!hasImage) {
            submitBtn.title = "Chưa chọn ảnh";
        } else {
            submitBtn.title = "Đổi ảnh poster";
        }
    }

    function setMode(mode) {
        if (inputMode === mode) return;
        inputMode = mode;

        const isLink = mode === "link";
        modeLinkBtn.classList.toggle("active", isLink);
        modeHarBtn.classList.toggle("active", !isLink);
        linkModeWrap.classList.toggle("hidden", !isLink);
        harModeWrap.classList.toggle("hidden", isLink);

        if (!hasImage) clearStatus();
        updateSubmitButton();
    }

    modeLinkBtn.addEventListener("click", () => setMode("link"));
    modeHarBtn.addEventListener("click", () => setMode("har"));

    function setShare(enabled) {
        shareEnabled = enabled;
        shareOptionOff.classList.toggle("active", !enabled);
        shareOptionOn.classList.toggle("active", enabled);
    }

    shareOptionOff.addEventListener("click", () => setShare(false));
    shareOptionOn.addEventListener("click", () => setShare(true));

    harDropzone.addEventListener("click", () => {
        if (isProcessing) return;
        harFileInput.value = "";
        harFileInput.click();
    });

    function setHarFile(file) {
        if (file.size > MAX_HAR_FILE_SIZE) {
            showModal(
                `File HAR quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB), tối đa 30MB.`,
                "error",
            );
            harFileInput.value = "";
            return;
        }
        harFile = file;
        harDropzoneText.textContent = "Đã chọn: " + file.name;
        harDropzoneEmpty.classList.add("hidden");
        harDropzoneSelected.classList.remove("hidden");
        if (!hasImage) clearStatus();
        updateSubmitButton();
    }

    harFileInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setHarFile(file);
    });

    ["dragenter", "dragover"].forEach((evt) => {
        harDropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            if (isProcessing) return;
            harDropzone.classList.add("drag");
        });
    });

    ["dragleave", "drop"].forEach((evt) => {
        harDropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            harDropzone.classList.remove("drag");
        });
    });

    harDropzone.addEventListener("drop", (e) => {
        if (isProcessing) return;
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;
        setHarFile(file);
    });

    playerUrl.addEventListener("input", () => {
        if (!hasImage) clearStatus();
        updateSubmitButton();
    });

    playerUrl.addEventListener("paste", () => {
        setTimeout(() => {
            const extracted = extractUrlFromText(playerUrl.value);
            if (extracted) playerUrl.value = extracted;
            if (!hasImage) clearStatus();
            updateSubmitButton();
        }, 0);
    });

    // SỬA BUG 4: Tách biệt thông báo khi Clipboard rỗng và lỗi cấp quyền
    pasteBtn.addEventListener("click", async () => {
        if (isProcessing) return;
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                throw new Error("unsupported");
            }
            const text = await navigator.clipboard.readText();
            if (!text || !text.trim()) {
                showModal("Bộ nhớ tạm (Clipboard) đang rỗng.", "error");
                return;
            }

            const extracted = extractUrlFromText(text) || text.trim();
            playerUrl.value = extracted;
            if (!hasImage) clearStatus();
            updateSubmitButton();
            playerUrl.focus();
        } catch (err) {
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
    let baseScale = 1;
    let scale = 1;
    let zoomFactor = 1;
    let tx = 0,
        ty = 0;
    let containerW = 0,
        containerH = 0;
    let dragging = false;
    let lastX = 0,
        lastY = 0;
    let hasImage = false;
    let currentFileName = "image.jpg";
    let currentBlobUrl = null;

    function setProcessing(state) {
        isProcessing = state;
        updateSubmitButton();
        zoomSlider.disabled = state || !hasImage;
        if (resetBtn) resetBtn.disabled = state;
        pasteBtn.disabled = state;
        playerUrl.disabled = state;
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

        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
        }
        const url = URL.createObjectURL(file);
        currentBlobUrl = url;

        img = new Image();
        img.onload = function () {
            naturalW = img.naturalWidth;
            naturalH = img.naturalHeight;

            // SỬA BUG 3: Kiểm tra kích thước ảnh hợp lệ để tránh chia cho 0
            if (!naturalW || !naturalH) {
                showModal(
                    "File ảnh không hợp lệ hoặc bị lỗi kích thước.",
                    "error",
                );
                hasImage = false;
                updateSubmitButton();
                return;
            }

            cropImg.src = url;
            cropImg.style.width = naturalW + "px";
            cropImg.style.height = naturalH + "px";
            cropImg.style.display = "block";
            emptyState.style.display = "none";

            measureContainer();
            baseScale = Math.max(containerW / naturalW, containerH / naturalH);
            zoomFactor = 1;
            scale = baseScale;
            tx = (containerW - naturalW * scale) / 2;
            ty = (containerH - naturalH * scale) / 2;
            clampPosition();
            applyTransform();

            zoomSlider.value = 1;
            zoomSlider.disabled = false;
            hasImage = true;
            if (resetBtn) resetBtn.classList.remove("hidden");
            updateSubmitButton();
        };
        img.onerror = function () {
            showModal("Không thể đọc định dạng ảnh này.", "error");
        };
        img.src = url;
    }

    dropzone.addEventListener("click", () => {
        if (isProcessing) return;
        fileInput.value = "";
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

    zoomSlider.addEventListener("input", () => {
        if (!hasImage || isProcessing) return;
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

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (isProcessing) return;
            hasImage = false;
            cropImg.style.display = "none";
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
                currentBlobUrl = null;
            }
            cropImg.src = "";
            emptyState.style.display = "flex";
            zoomSlider.value = 1;
            zoomSlider.disabled = true;
            fileInput.value = "";
            resetBtn.classList.add("hidden");
            clearStatus();
            updateSubmitButton();
        });
    }

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

    submitBtn.addEventListener("click", async () => {
        if (submitBtn.disabled) {
            showModal("Vui lòng kiểm tra lại link/file và ảnh.", "error");
            return;
        }

        clearStatus();
        const endpointRaw = apiEndpoint.value.trim();

        if (!endpointRaw) {
            showModal("Thiếu Worker API endpoint.", "error");
            return;
        }

        // Check đúng/sai của link (hoặc có file har chưa) NGAY LÚC BẤM GỬI,
        // không check trước đó nữa.
        let purl = null;
        if (inputMode === "link") {
            purl = extractUrlFromText(playerUrl.value);
            if (!purl) {
                showModal("Không tìm thấy link hợp lệ.", "error");
                return;
            }
            try {
                new URL(purl);
            } catch {
                showModal("Link không hợp lệ.", "error");
                return;
            }
            const paramCheck = validateLinkParams(purl);
            if (!paramCheck.valid) {
                showModal(
                    `Link thiếu ${paramCheck.missingCount} tham số (${paramCheck.missing
                        .map((m) => m.label)
                        .join(", ")}).`,
                    "error",
                );
                return;
            }
        } else {
            if (!harFile) {
                showModal("Chưa chọn file HAR.", "error");
                return;
            }
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
            if (inputMode === "link") {
                form.append("url", purl);
            } else {
                form.append("har", harFile);
            }
            form.append(
                "image",
                blob,
                currentFileName.replace(/\.[^.]+$/, "") + "_cropped.png",
            );
            form.append("share", String(shareEnabled));

            setStatus("Đang đổi...");

            // SỬA BUG 1: Chuẩn hóa URL và thêm endpoint route
            const baseUrl = endpointRaw.replace(/\/+$/, "");
            const targetEndpoint = `${baseUrl}/api/poster`;

            const resp = await fetch(targetEndpoint, {
                method: "POST",
                body: form,
            });
            const data = await resp.json().catch(() => ({}));

            if (data.ok) {
                setStatus("Thành công", "success");

                // SỬA BUG 2: Revoke ObjectURL cũ trước khi tạo mới để tránh memory leak
                if (modalPreviewObjectUrl) {
                    URL.revokeObjectURL(modalPreviewObjectUrl);
                }
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
                        "Link/File đã sai hoặc hết hạn - vui lòng lấy lại link hoặc file HAR mới.",
                        "error",
                    );
                    setStatus("Link/File đã hết hạn", "error");
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

    updateSubmitButton();
})();