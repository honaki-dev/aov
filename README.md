<div align="center">

# 🎮 AOV Custom Background Uploader
### Công Cụ Đổi Ảnh Loading Trận Liên Quân Mobile Online

[![Website](https://img.shields.io/badge/Website-aov.honaki.site-5056ac?style=for-the-badge&logo=google-chrome&logoColor=white)](https://aov.honaki.site)
[![Version](https://img.shields.io/badge/Version-0.0.6-ffd873?style=for-the-badge&labelColor=241608)](https://github.com/honaki-dev)
[![License](https://img.shields.io/badge/License-MIT-4ade80?style=for-the-badge)](https://github.com/honaki-dev)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-5867c0?style=for-the-badge)](https://aov.honaki.site)

<p align="center">
  <b>Công cụ mã nguồn mở hỗ trợ tùy chỉnh và đổi ảnh loading poster trận Liên Quân Mobile (Arena of Valor) trực tiếp trên giao diện AOV Camp an toàn, tiện lợi và tức thì.</b>
</p>

[🌐 Mở Trang Web Công Cụ](https://aov.honaki.site) • [✨ Tính Năng Nổi Bật](#tinh-nang-noi-bat) • [📖 Hướng Dẫn Sử Dụng](#huong-dan-su-dung) • [🛡️ Tuyên Bố Trách Nhiệm](#tuyen-bo-trach-nhiem)

---

</div>

<a id="gioi-thieu"></a>
## 🌟 Giới thiệu (Overview)

**AOV Custom Background Uploader** là công cụ cộng đồng do **Honaki** phát triển nhằm giúp người chơi Liên Quân Mobile (AOV) dễ dàng tùy biến ảnh nền loading trận đấu (Player Poster & Flowborn Poster) theo sở thích cá nhân (anime, ảnh đôi, waifu, idol, v.v.).

Công cụ hoạt động hoàn toàn **Client-side** thông qua kỹ thuật **Bookmarklet / JavaScript Script Injection**, tương tác trực tiếp với giao diện Poster chính thức của Garena mà không can thiệp vào tệp tin cài đặt APK/IPA gốc của game.

---

<a id="tinh-nang-noi-bat"></a>
## ✨ Tính năng nổi bật (Features)

- ⚡ **Đổi ảnh tức thì (Instant 0ms)**: Áp dụng ảnh nền chất lượng 100% (1.0) ngay lập tức không có độ trễ qua `toDataURL`.
- 🖼️ **Tích hợp khung Cắt & Phóng to ảnh (Crop & Zoom)**: Tự động căn chỉnh ảnh về tỷ lệ chuẩn `1080 x 1701 px` với thanh trượt mượt mà.
- 🎨 **Giao diện chuẩn Game 100%**: Thiết kế tái hiện hoàn hảo hệ thống AOV Camp (background gradient, hoa văn hoàng gia, modal popup, nút bấm decorate).
- 🔒 **Bảo mật & Quyền riêng tư tuyệt đối**: Toàn bộ thao tác xử lý trực tiếp trên trình duyệt, máy chủ không lưu file HAR, không thu thập token hay thông tin đăng nhập.
- 📱 **Hỗ trợ đa nền tảng**: Tương thích hoàn hảo trên cả máy tính (PC/Laptop) và điện thoại di động (iOS Safari, Android Chrome).

---

<a id="huong-dan-su-dung"></a>
## 📖 Hướng dẫn sử dụng (How to Use)

### 🔹 Bước 1: Xác thực & Mở trang Game
1. Truy cập [https://aov.honaki.site](https://aov.honaki.site).
2. Chọn phương thức xác thực:
   - **Link CAMP**: Dán đường link poster của bạn vào ô nhập (hoặc bấm nút **Dán**).
   - **File HAR**: Kéo thả file `.har` đã lưu vào khung chọn file.
3. Chọn chế độ: **Ảnh Load Trận** hoặc **Ảnh Load Flowborn**.
4. Nhấn nút **"Chuyển tới trang game"** để mở hệ thống Poster của Garena.

### 🔹 Bước 2: Nạp Script & Tải ảnh nền
1. Nhấn nút **"Copy Code Inject"** trên web công cụ:
   ```javascript
   javascript:(function(){const s=document.createElement("script");s.src="https://aov.honaki.site/assets/scripts/aov-bg-uploader.min.js?t="+Date.now();document.head.appendChild(s);})();
   ```
2. Dán mã vừa sao chép vào thanh địa chỉ trình duyệt hoặc chạy qua Bookmarklet trên trang game.
3. Nhấn vào ô dấu cộng `+` ở đầu danh sách (hoặc gõ lệnh `__AOV.upload()` trong Console) để chọn ảnh từ máy tính / điện thoại.
4. Căn chỉnh góc ảnh bằng khung Crop, thu phóng theo ý thích và nhấn **"Dùng ảnh này"** để áp dụng ngay lập tức!

---

<a id="cong-nghe"></a>
## 🛠️ Công nghệ sử dụng (Tech Stack)

- **HTML5 & Vanilla JavaScript**: Tối ưu hiệu năng tải siêu nhẹ, không phụ thuộc framework cồng kềnh.
- **Canvas 2D API**: Xử lý cắt ghép ảnh, phóng to thu nhỏ và render pixel tức thì.
- **CSS3 Modern Layout**: CSS Custom Properties, Shadow DOM, Glassmorphism, Flexbox.
- **Schema.org SEO**: Tích hợp `WebApplication` và `FAQPage` JSON-LD chuẩn quốc tế.

---

<a id="tuyen-bo-trach-nhiem"></a>
## 🛡️ Tuyên bố trách nhiệm (Disclaimer)

- Đây là dự án cá nhân phi thương mại phục vụ mục đích giải trí và tiện ích cộng đồng.
- Dự án **hoàn toàn độc lập** và **không thuộc quyền quản lý, tài trợ hay liên kết** với Garena, Tencent hay TiMi Studios.
- Mọi hình ảnh và tài nguyên thuộc bản quyền của nhà phát hành trò chơi tương ứng.

---

<a id="tac-gia"></a>
## 👨‍💻 Tác giả & Đóng góp (Author)

- **Tác giả**: [Honaki Tran](https://github.com/honaki-dev)
- **Website chính thức**: [https://aov.honaki.site](https://aov.honaki.site)
- **Facebook**: [Honaki](https://fb.com/honaki10)

<div align="center">

Made with ♥ by [Honaki](https://github.com/honaki-dev)

</div>
