(function () {
    const OUT_W = 1080,
        OUT_H = 1701;
    const MAX_HAR_FILE_SIZE = 30 * 1024 * 1024; // 30MB

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
    const userInfoEl = document.getElementById("userInfo");
    const playerImageEl = document.getElementById("playerImage");
    const playerRankEl = document.getElementById("playerRank");
    const playerRankTextEl = document.getElementById("playerRankText");
    const playerNameEl = document.getElementById("playerName");
    let isProcessing = false;
    let modalPreviewObjectUrl = null;
    let currentFetchController = null;
    let isValidLink = false;
    let userInfoData = null;
    let linkError = null;
    let inputMode = "link"; // "link" | "har" - mặc định dùng link
    let harFile = null; // File .har đang chọn (mode "har")
    let shareEnabled = false; // mặc định: chỉ lưu, không chia sẻ công khai

    // 7 tham số bắt buộc
    const REQUIRED_PARAMS = [
        { key: "partition", label: "partition" },
        { key: "channelid", label: "channelid" },
        { key: "gameid", label: "gameid" },
        { key: "itopencodeparam", label: "itopencodeparam" },
        { key: "os", label: "os" },
        { key: "lang", label: "lang" },
        { key: "aov_region", label: "aov_region" },
    ];

    // Cache
    const cache = new Map();
    const CACHE_DURATION = 5 * 60 * 1000;

    // Debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Kiểm tra link có đủ tham số không
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

    function updateSubmitButton() {
        const hasValidLink = isValidLink && userInfoData !== null;
        submitBtn.disabled = !(hasValidLink && hasImage && !isProcessing);

        if (!hasValidLink) {
            submitBtn.title = "Link chưa hợp lệ hoặc chưa tải thông tin";
        } else if (!hasImage) {
            submitBtn.title = "Chưa chọn ảnh";
        } else {
            submitBtn.title = "Đổi ảnh poster";
        }
    }

    // cacheKey: string (mode "link") hoặc File (mode "har")
    // requestInit: { method: "json", body } hoặc { method: "form", form }
    async function fetchUserInfoRaw(cacheKey, buildRequest) {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        if (currentFetchController) {
            currentFetchController.abort();
        }
        currentFetchController = new AbortController();

        try {
            const response = await fetch(
                `${apiEndpoint.value}/api/getUserInfo`,
                {
                    ...buildRequest(),
                    method: "POST",
                    signal: currentFetchController.signal,
                },
            );
            const result = await response.json();

            if (result.ok && result.data) {
                cache.set(cacheKey, {
                    data: result.data,
                    timestamp: Date.now(),
                });
                return result.data;
            }
            return null;
        } catch (error) {
            if (error.name === "AbortError") {
                console.log("Fetch cancelled");
                return null;
            }
            throw error;
        } finally {
            currentFetchController = null;
        }
    }

    function fetchUserInfo(url) {
        return fetchUserInfoRaw(url, () => ({
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ url }),
        }));
    }

    function fetchUserInfoByHar(file) {
        // key theo tên + kích thước + lastModified để cache đúng file
        const cacheKey = `har:${file.name}:${file.size}:${file.lastModified}`;
        return fetchUserInfoRaw(cacheKey, () => {
            const form = new FormData();
            form.append("har", file);
            return { body: form };
        });
    }

    async function renderLinkStatus(rawValue) {
        const url = (rawValue || "").trim();

        // Reset trạng thái link
        isValidLink = false;
        userInfoData = null;
        userInfoEl.classList.add("hidden");
        linkError = null;

        if (!url) {
            if (!hasImage) {
                clearStatus();
            }
            updateSubmitButton();
            return;
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            linkError = "Link không hợp lệ";
            setStatus(linkError, "error");
            updateSubmitButton();
            return;
        }

        // Kiểm tra tham số
        const paramCheck = validateLinkParams(url);
        if (!paramCheck.valid) {
            linkError = `Link thiếu ${paramCheck.missingCount} tham số (${paramCheck.missing.map((m) => m.label).join(", ")})`;
            setStatus(linkError, "error");
            updateSubmitButton();
            return;
        }

        setStatus("Đang tải thông tin...");

        let data;
        try {
            data = await fetchUserInfo(url);
        } catch (error) {
            if (error.name !== "AbortError") {
                linkError = "Lỗi kết nối đến server";
                setStatus(linkError, "error");
                console.error("Fetch error:", error);
            }
            updateSubmitButton();
            return;
        }

        if (!data) {
            linkError =
                "Không tìm thấy thông tin người chơi, hãy vào game và lấy lại link";
            setStatus(linkError, "error");
            updateSubmitButton();
            return;
        }

        try {
            isValidLink = true;
            userInfoData = data;
            userInfoEl.classList.remove("hidden");
            playerImageEl.src = data.avatarUrl;
            playerRankEl.src = data.rank.imageUrl;
            playerNameEl.textContent = data.playerName;
            playerRankTextEl.textContent =
                data.rank.text + " " + data.rank.star + " ⭐";
            clearStatus();
        } catch (error) {
            isValidLink = false;
            userInfoData = null;
            userInfoEl.classList.add("hidden");
            linkError = "Dữ liệu người chơi trả về không hợp lệ";
            setStatus(linkError, "error");
            console.error("Render user info error:", error);
        } finally {
            updateSubmitButton();
        }
    }

    const debouncedRenderLinkStatus = debounce(renderLinkStatus, 500);

    async function renderHarStatus(file) {
        isValidLink = false;
        userInfoData = null;
        userInfoEl.classList.add("hidden");
        linkError = null;

        if (!file) {
            if (!hasImage) clearStatus();
            updateSubmitButton();
            return;
        }

        setStatus("Đang đọc file HAR...");

        let data;
        try {
            data = await fetchUserInfoByHar(file);
        } catch (error) {
            if (error.name !== "AbortError") {
                linkError = "Lỗi kết nối đến server";
                setStatus(linkError, "error");
                console.error("Fetch error:", error);
            }
            updateSubmitButton();
            return;
        }

        if (!data) {
            linkError =
                "Không tìm thấy thông tin người chơi, hãy vào game và lấy lại file";
            setStatus(linkError, "error");
            updateSubmitButton();
            return;
        }

        try {
            isValidLink = true;
            userInfoData = data;
            userInfoEl.classList.remove("hidden");
            playerImageEl.src = data.avatarUrl;
            playerRankEl.src = data.rank.imageUrl;
            playerNameEl.textContent = data.playerName;
            playerRankTextEl.textContent =
                data.rank.text + " " + data.rank.star + " ⭐";
            clearStatus();
        } catch (error) {
            isValidLink = false;
            userInfoData = null;
            userInfoEl.classList.add("hidden");
            linkError = "Dữ liệu người chơi trả về không hợp lệ";
            setStatus(linkError, "error");
            console.error("Render user info error:", error);
        } finally {
            updateSubmitButton();
        }
    }

    function resetValidityState() {
        isValidLink = false;
        userInfoData = null;
        userInfoEl.classList.add("hidden");
        linkError = null;
        if (!hasImage) clearStatus();
        updateSubmitButton();
    }

    function setMode(mode) {
        if (inputMode === mode) return;
        inputMode = mode;

        if (currentFetchController) {
            currentFetchController.abort();
        }

        const isLink = mode === "link";
        modeLinkBtn.classList.toggle("active", isLink);
        modeHarBtn.classList.toggle("active", !isLink);
        linkModeWrap.classList.toggle("hidden", !isLink);
        harModeWrap.classList.toggle("hidden", isLink);

        resetValidityState();

        if (isLink) {
            const existingUrl = extractUrlFromText(playerUrl.value);
            if (existingUrl) renderLinkStatus(existingUrl);
        } else if (harFile) {
            renderHarStatus(harFile);
        }
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

    // har dropzone / file input
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
        renderHarStatus(file);
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

    // Event listeners
    playerUrl.addEventListener("input", () => {
        const url = playerUrl.value.trim();

        isValidLink = false;
        userInfoData = null;
        userInfoEl.classList.add("hidden");
        linkError = null;

        if (!hasImage) {
            clearStatus();
        }
        updateSubmitButton();

        if (url) {
            debouncedRenderLinkStatus(url);
        }
    });

    playerUrl.addEventListener("paste", () => {
        isValidLink = false;
        userInfoData = null;
        userInfoEl.classList.add("hidden");
        linkError = null;

        if (!hasImage) {
            clearStatus();
        }
        updateSubmitButton();

        setTimeout(() => {
            const extracted = extractUrlFromText(playerUrl.value);
            if (extracted) {
                playerUrl.value = extracted;
                debouncedRenderLinkStatus(extracted);
            } else {
                isValidLink = false;
                userInfoData = null;
                userInfoEl.classList.add("hidden");
                if (!hasImage) {
                    clearStatus();
                }
                updateSubmitButton();
            }
        }, 0);
    });

    pasteBtn.addEventListener("click", async () => {
        if (isProcessing) return;
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                throw new Error("unsupported");
            }
            const text = await navigator.clipboard.readText();
            const extracted = extractUrlFromText(text) || text.trim();
            if (!extracted) throw new Error("empty");

            isValidLink = false;
            userInfoData = null;
            userInfoEl.classList.add("hidden");
            linkError = null;

            if (!hasImage) {
                clearStatus();
            }
            updateSubmitButton();

            playerUrl.value = extracted;
            debouncedRenderLinkStatus(extracted);
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

        // giải phóng blob URL của ảnh trước đó (nếu có) để tránh rò bộ nhớ
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
        }
        const url = URL.createObjectURL(file);
        currentBlobUrl = url;

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
        img.src = url;
    }

    // file input / dropzone
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

    // zoom
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

    // drag
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

    // reset
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

    // getCroppedBlob
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

    // submit
    submitBtn.addEventListener("click", async () => {
        if (submitBtn.disabled) {
            showModal("Vui lòng kiểm tra lại link và ảnh.", "error");
            return;
        }

        clearStatus();
        const endpoint = apiEndpoint.value.trim();
        const purl =
            inputMode === "link" ? extractUrlFromText(playerUrl.value) : null;

        if (!endpoint) {
            showModal("Thiếu Worker API endpoint.", "error");
            return;
        }
        if (inputMode === "link" && !purl) {
            showModal("Không tìm thấy link hợp lệ.", "error");
            return;
        }
        if (inputMode === "har" && !harFile) {
            showModal("Chưa chọn file HAR.", "error");
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
                    isValidLink = false;
                    userInfoData = null;
                    userInfoEl.classList.add("hidden");
                    linkError = "Link đã hết hạn";
                    setStatus(linkError, "error");
                    updateSubmitButton();
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

    // Khởi tạo trạng thái ban đầu
    updateSubmitButton();
})();
