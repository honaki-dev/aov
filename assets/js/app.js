(function () {
    const typePlayerBtn = document.getElementById("typePlayerBtn");
    const typeFlowbornBtn = document.getElementById("typeFlowbornBtn");
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

    let posterType = "player"; // "player" | "flowborn"
    let inputMode = "link";
    let extractedUrl = null;
    let isProcessing = false;
    let pendingFile = null;

    function setPosterType(type) {
        if (posterType === type) return;
        posterType = type;
        const isPlayer = type === "player";
        typePlayerBtn.classList.toggle("active", isPlayer);
        typeFlowbornBtn.classList.toggle("active", !isPlayer);
        playerUrl.placeholder = isPlayer
            ? "https://kgvn-camp.mobagarena.com/app/player-poster?..."
            : "https://kgvn-camp.mobagarena.com/app/flowborn-poster?...";

        if (extractedUrl) {
            extractedUrl = applyPosterTypeToUrl(extractedUrl, type);
        }
    }

    typePlayerBtn.addEventListener("click", () => setPosterType("player"));
    typeFlowbornBtn.addEventListener("click", () => setPosterType("flowborn"));

    function applyPosterTypeToUrl(url, type) {
        try {
            const parsed = new URL(url);
            const targetPath =
                type === "flowborn"
                    ? "/app/flowborn-poster"
                    : "/app/player-poster";
            parsed.pathname = targetPath;
            return parsed.toString();
        } catch {
            return url;
        }
    }

    function isValidDomain(url) {
        try {
            const parsed = new URL(url);
            const hostname = parsed.hostname.toLowerCase();
            return (
                hostname === "kgvn-camp.mobagarena.com" ||
                hostname.endsWith(".kgvn-camp.mobagarena.com")
            );
        } catch {
            return false;
        }
    }

    function trimTrailingJunk(url) {
        return url.replace(/[.,;:!?)\]}'"]+$/, "");
    }

    function normalizeUrl(url) {
        try {
            const cleaned = trimTrailingJunk(url.trim());
            if (!isValidDomain(cleaned)) {
                return null;
            }
            const parsed = new URL(cleaned);
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
            extractedUrl = null;
            harDropzoneEmpty.classList.remove("hidden");
            harDropzoneSelected.classList.add("hidden");
        }
    }

    modeLinkBtn.addEventListener("click", () => setMode("link"));
    modeHarBtn.addEventListener("click", () => setMode("har"));

    harFileInput.addEventListener("click", () => {
        harFileInput.value = "";
    });

    const API_POSTER_KEYWORD = "kgvn-api.mobagarena.com/api/game/poster";
    const HEADER_ALIASES = {
        partition: ["partition", "logicworldid", "worldid"],
        channelid: ["channelid", "msdk-channelid", "msdk_channelid"],
        gameid: ["gameid", "msdk-gameid", "msdk_gameid"],
        itopencodeparam: [
            "itopencodeparam",
            "msdk-itopencodeparam",
            "msdk_itopencodeparam",
        ],
        os: ["os", "msdk-os", "msdk_os"],
        lang: ["lang", "aov-language", "aov_language", "language"],
        aov_region: ["aov_region", "aov-region", "region"],
        aov_areaid: ["aov_areaid", "aov-areaid", "areaid"],
        access_token: ["access_token", "token", "msdk-token"],
        sig: ["sig", "signature", "msdk-sig"],
        seq: ["seq", "msdk-seq"],
        ts: ["ts", "timestamp", "msdk-ts"],
        nickname: ["nickname", "msdk-nickname", "name"],
        algorithm: ["algorithm"],
        encode: ["encode"],
        version: ["version"],
        from: ["from"],
        orientation: ["orientation"],
        isLowDevice: ["isLowDevice", "islowdevice"],
    };

    const REQUIRED_PARAMS = [
        "partition",
        "channelid",
        "gameid",
        "itopencodeparam",
        "os",
        "lang",
        "aov_region",
    ];

    function entryStatusOk(entry) {
        const status = entry?.response?.status;
        return typeof status !== "number" || (status >= 200 && status < 400);
    }

    function getParamValue(entry, key) {
        const aliases = HEADER_ALIASES[key] || [key];

        const headers = entry?.request?.headers;
        if (Array.isArray(headers)) {
            for (const alias of aliases) {
                const header = headers.find(
                    (h) => (h.name || "").toLowerCase() === alias.toLowerCase(),
                );
                if (
                    header &&
                    header.value !== undefined &&
                    header.value !== null &&
                    header.value !== ""
                ) {
                    return header.value;
                }
            }
        }

        const query = entry?.request?.queryString;
        if (Array.isArray(query)) {
            for (const alias of aliases) {
                const q = query.find(
                    (item) =>
                        (item.name || "").toLowerCase() === alias.toLowerCase(),
                );
                if (
                    q &&
                    q.value !== undefined &&
                    q.value !== null &&
                    q.value !== ""
                ) {
                    return q.value;
                }
            }
        }

        try {
            if (entry?.request?.url) {
                const parsed = new URL(entry.request.url);
                for (const alias of aliases) {
                    const val = parsed.searchParams.get(alias);
                    if (val !== null && val !== "") return val;
                }
            }
        } catch {}

        return null;
    }

    function buildCampUrlFromApiEntry(entry) {
        const params = new URLSearchParams();
        const missing = [];

        for (const key of REQUIRED_PARAMS) {
            const value = getParamValue(entry, key);
            if (value !== null && value !== "") {
                params.set(key, value);
            } else {
                missing.push(key);
            }
        }

        if (missing.length > 0) {
            return null;
        }

        for (const key of Object.keys(HEADER_ALIASES)) {
            if (!REQUIRED_PARAMS.includes(key)) {
                const value = getParamValue(entry, key);
                if (value !== null && value !== "") {
                    params.set(key, value);
                }
            }
        }

        const baseUrl =
            posterType === "flowborn"
                ? "https://kgvn-camp.mobagarena.com/app/flowborn-poster"
                : "https://kgvn-camp.mobagarena.com/app/player-poster";

        return baseUrl + "?" + params.toString();
    }

    function findCampUrlFromHarEntries(entries) {
        for (const e of entries) {
            const u = e.request?.url || "";
            if (
                u.includes("kgvn-camp.mobagarena.com/app/") &&
                (u.includes("player-poster") ||
                    u.includes("flowborn-poster")) &&
                u.includes("itopencodeparam=")
            ) {
                return u;
            }
        }

        const apiEntries = entries.filter((e) => {
            const url = (e.request?.url || "").toLowerCase();
            return url.includes(API_POSTER_KEYWORD);
        });
        if (apiEntries.length === 0) return null;

        apiEntries.sort((a, b) => {
            const aPost =
                (a.request?.method || "").toUpperCase() === "POST" ? 1 : 0;
            const bPost =
                (b.request?.method || "").toUpperCase() === "POST" ? 1 : 0;
            const aOk = entryStatusOk(a) ? 1 : 0;
            const bOk = entryStatusOk(b) ? 1 : 0;
            return bPost + bOk - (aPost + aOk);
        });

        for (const entry of apiEntries) {
            const campUrl = buildCampUrlFromApiEntry(entry);
            if (campUrl) return campUrl;
        }

        return null;
    }

    function extractLinkFromHar(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const har = JSON.parse(e.target.result);
                    const entries = har?.log?.entries;

                    if (!Array.isArray(entries) || entries.length === 0) {
                        reject(
                            new Error("File HAR không có dữ liệu request nào"),
                        );
                        return;
                    }

                    const campUrl = findCampUrlFromHarEntries(entries);
                    if (campUrl) {
                        resolve(campUrl);
                        return;
                    }

                    reject(
                        new Error(
                            "Không tìm thấy thông tin xác thực poster trong file HAR",
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
        if (isProcessing) {
            pendingFile = file;
            harStatus.textContent =
                "⏳ Đang xử lý file trước, sẽ chuyển sang file mới ngay sau đó...";
            harStatus.className = "har-status";
            return;
        }
        isProcessing = true;

        harDropzoneText.textContent = "Đã chọn: " + file.name;
        harDropzoneEmpty.classList.add("hidden");
        harDropzoneSelected.classList.remove("hidden");
        harStatus.textContent = "⏳ Đang xử lý...";
        harStatus.className = "har-status";
        extractedUrl = null;

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
                if (pendingFile) {
                    const next = pendingFile;
                    pendingFile = null;
                    setHarFile(next);
                }
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
        return match ? trimTrailingJunk(match[0]) : null;
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
        modalMessage.textContent = message;
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
            const injectCode = `javascript:(function(){const s=document.createElement("script");s.src="https://aov.honaki.site/assets/scripts/aov-bg-uploader.min.js?t="+Date.now();document.head.appendChild(s);})();`;
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

            if (inputMode === "har") {
                if (extractedUrl) {
                    targetUrl = extractedUrl;
                }
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
                targetUrl = applyPosterTypeToUrl(targetUrl, posterType);
                window.location.href = targetUrl;
            } else {
                showModal(
                    "Không tìm thấy link hợp lệ (chỉ hỗ trợ kgvn-camp.mobagarena.com)",
                    "error",
                );
            }
        });
})();
