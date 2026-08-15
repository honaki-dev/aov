(function () {
    const modeLinkBtn = document.getElementById("modeLinkBtn");
    const modeHarBtn = document.getElementById("modeHarBtn");
    const linkModeWrap = document.getElementById("linkModeWrap");
    const harModeWrap = document.getElementById("harModeWrap");
    const harDropzone = document.getElementById("harDropzone");
    const harFileInput = document.getElementById("harFileInput");
    const harDropzoneEmpty = document.getElementById("harDropzoneEmpty");
    const harDropzoneSelected = document.getElementById("harDropzoneSelected");
    const harDropzoneText = document.getElementById("harDropzoneText");
    const harStatus = document.getElementById("harStatus");
    const playerUrl = document.getElementById("playerUrl");
    const pasteBtn = document.getElementById("pasteBtn");

    let inputMode = "link";
    let harFile = null;
    let extractedUrl = null;
    let isProcessing = false;

    function isValidDomain(url) {
        try {
            const parsed = new URL(url);
            const hostname = parsed.hostname;
            return (
                hostname === "kgvn-camp.mobagarena.com" ||
                hostname.endsWith(".kgvn-camp.mobagarena.com")
            );
        } catch {
            return false;
        }
    }

    function normalizeUrl(url) {
        try {
            const parsed = new URL(url);
            if (!isValidDomain(url)) {
                return null;
            }
            return parsed.toString();
        } catch {
            return null;
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
        if (isLink) {
            harStatus.textContent = "";
            harStatus.className = "har-status";
        }
    }

    modeLinkBtn.addEventListener("click", () => setMode("link"));
    modeHarBtn.addEventListener("click", () => setMode("har"));

    harDropzone.addEventListener("click", () => {
        harFileInput.value = "";
        harFileInput.click();
    });

    function extractLinkFromHar(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const har = JSON.parse(e.target.result);
                    const entries = har.log?.entries || [];

                    for (const entry of entries) {
                        const url = entry.request?.url || "";
                        if (
                            isValidDomain(url) &&
                            url.includes("player-poster")
                        ) {
                            resolve(url);
                            return;
                        }
                    }

                    for (const entry of entries) {
                        const url = entry.request?.url || "";
                        if (isValidDomain(url)) {
                            resolve(url);
                            return;
                        }
                    }

                    reject(
                        new Error(
                            "Không tìm thấy link hợp lệ (chỉ hỗ trợ kgvn-camp.mobagarena.com)",
                        ),
                    );
                } catch (err) {
                    reject(new Error("File HAR không hợp lệ"));
                }
            };
            reader.onerror = () => reject(new Error("Không thể đọc file"));
            reader.readAsText(file);
        });
    }

    function setHarFile(file) {
        if (isProcessing) return;
        isProcessing = true;

        harFile = file;
        harDropzoneText.textContent = "Đã chọn: " + file.name;
        harDropzoneEmpty.classList.add("hidden");
        harDropzoneSelected.classList.remove("hidden");
        harStatus.textContent = "⏳ Đang xử lý...";
        harStatus.className = "har-status";

        extractLinkFromHar(file)
            .then((url) => {
                extractedUrl = normalizeUrl(url);
                if (extractedUrl) {
                    harStatus.textContent =
                        "✅ Đã tìm thấy link! Click 'Chuyển tới trang game' để vào.";
                    harStatus.className = "har-status success";
                } else {
                    harStatus.textContent =
                        "❌ Link không hợp lệ (chỉ hỗ trợ kgvn-camp.mobagarena.com)";
                    harStatus.className = "har-status error";
                    extractedUrl = null;
                }
            })
            .catch((err) => {
                harStatus.textContent = "❌ " + err.message;
                harStatus.className = "har-status error";
                extractedUrl = null;
            })
            .finally(() => {
                isProcessing = false;
            });
    }

    harFileInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setHarFile(file);
    });

    ["dragenter", "dragover"].forEach((evt) => {
        harDropzone.addEventListener(evt, (e) => {
            e.preventDefault();
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
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;
        setHarFile(file);
    });

    pasteBtn.addEventListener("click", async () => {
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
            playerUrl.focus();
        } catch (err) {
            showModal(
                "Không thể tự dán (trình duyệt chặn quyền truy cập clipboard). Hãy nhấn giữ vào ô Link rồi chọn Dán, hoặc bấm Ctrl+V.",
                "error",
            );
            playerUrl.focus();
        }
    });

    function extractUrlFromText(text) {
        if (!text) return null;
        const match = text.match(/https?:\/\/[^\s"'<>]+/);
        return match ? match[0] : null;
    }

    const modalOverlay = document.getElementById("modalOverlay");
    const modalBox = document.getElementById("modalBox");
    const modalIcon = document.getElementById("modalIcon");
    const modalMessage = document.getElementById("modalMessage");
    const modalCloseBtn = document.getElementById("modalCloseBtn");
    const modalCloseX = document.getElementById("modalCloseX");

    function showModal(message, type = "error") {
        modalBox.className = "modal-box " + type;
        modalIcon.textContent = type === "success" ? "✓" : "!";
        modalMessage.innerHTML = message;
        modalOverlay.classList.add("show");
    }

    function closeModal() {
        modalOverlay.classList.remove("show");
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

    document
        .getElementById("copyInjectBtn")
        .addEventListener("click", function () {
            const injectCode = `javascript:(function(){const s=document.createElement("script");s.src="https://aov.honaki.site/assets/scripts/aov-bg-uploader.min.js";document.head.appendChild(s);})();`;
            navigator.clipboard
                .writeText(injectCode)
                .then(() => {
                    const originalText = this.textContent;
                    this.textContent = "✅ Đã copy!";
                    this.style.borderColor = "#6fcf97";
                    this.style.color = "#6fcf97";
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.style.borderColor = "";
                        this.style.color = "";
                    }, 2000);
                })
                .catch(() => {
                    const input = document.createElement("input");
                    input.value = injectCode;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand("copy");
                    input.remove();
                    const originalText = this.textContent;
                    this.textContent = "✅ Đã copy!";
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 2000);
                });
        });

    document
        .getElementById("goToGameBtn")
        .addEventListener("click", function () {
            let targetUrl = null;

            if (inputMode === "har" && extractedUrl) {
                targetUrl = extractedUrl;
            } else {
                const urlText = document
                    .getElementById("playerUrl")
                    .value.trim();
                const match = urlText.match(/https?:\/\/[^\s"'<>]+/);
                if (match) {
                    const normalized = normalizeUrl(match[0]);
                    if (normalized) {
                        targetUrl = normalized;
                    }
                }
            }

            if (targetUrl) {
                window.location.href = targetUrl;
            } else {
                showModal(
                    "Không tìm thấy link hợp lệ (chỉ hỗ trợ kgvn-camp.mobagarena.com)",
                    "error",
                );
            }
        });
})();
