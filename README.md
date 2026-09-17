<div align="center">

# 🎮 AOV Custom Background Uploader

**Công Cụ Đổi Ảnh Loading Trận Liên Quân Mobile Online**

[![Website](https://img.shields.io/badge/Website-pj.honaki.is--a.dev%2Faov-5056ac?style=for-the-badge&logo=google-chrome&logoColor=white)](https://pj.honaki.is-a.dev/aov)
[![Version](https://img.shields.io/badge/Version-0.0.6-ffd873?style=for-the-badge&labelColor=241608)](https://github.com/honaki-dev)
[![License](https://img.shields.io/badge/License-MIT-4ade80?style=for-the-badge)](https://github.com/honaki-dev)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-5867c0?style=for-the-badge)](https://pj.honaki.is-a.dev/aov)

<p align="center">
  <i>Công cụ mã nguồn mở hỗ trợ tùy chỉnh và đổi ảnh loading poster trận Liên Quân Mobile (Arena of Valor)<br/>trực tiếp trên giao diện AOV Camp <b>an toàn, tiện lợi và tức thì.</b></i>
</p>

[🚀 Mở Trang Công Cụ](https://pj.honaki.is-a.dev/aov) • [✨ Tính Năng](#-tính-năng-nổi-bật) • [📖 Hướng Dẫn](#-hướng-dẫn-sử-dụng) • [🛡️ Trách Nhiệm](#-tuyên-bố-trách-nhiệm)

---

</div>

## 🌟 Tổng quan dự án

**AOV Custom Background Uploader** là công cụ cộng đồng do **Honaki** phát triển nhằm giúp người chơi Liên Quân Mobile (AOV) dễ dàng tùy biến ảnh nền loading trận đấu (Player Poster & Flowborn Poster) theo sở thích cá nhân (anime, ảnh đôi, idol, v.v.).

> 💡 **Cơ chế hoạt động an toàn:**  
> Công cụ hoạt động hoàn toàn ở phía trình duyệt (**Client-side**) thông qua kỹ thuật **Bookmarklet / JavaScript Injection**. Hệ thống tương tác trực tiếp với giao diện Poster chính thức của Garena mà không can thiệp vào tệp cài đặt (APK/IPA) của game, đảm bảo **an toàn và không rủi ro khóa tài khoản**.

---

## ✨ Tính năng nổi bật

- ⚡ **Áp dụng tức thì (0ms latency):** Render ảnh nền chất lượng cao nhất (tỷ lệ 1.0) ngay lập tức thông qua công nghệ `toDataURL`, không có độ trễ tải mạng.
- 🖼️ **Trình chỉnh sửa ảnh tích hợp:** Tự động căn chỉnh và hỗ trợ **cắt, thu/phóng (Crop & Zoom)** ảnh về tỷ lệ chuẩn `1080 x 1701 px` với thanh trượt mượt mà.
- 🎨 **Giao diện chuẩn Game 100%:** Thiết kế UI/UX đồng bộ hoàn hảo với hệ thống AOV Camp (background gradient, hoa văn hoàng gia, modal popup, nút bấm decorate).
- 🔒 **Quyền riêng tư tuyệt đối:** Toàn bộ quá trình xử lý diễn ra trực tiếp trên trình duyệt thiết bị của bạn. Hệ thống **không lưu file HAR**, **không thu thập token** hay bất kỳ thông tin đăng nhập nào.
- 📱 **Đa nền tảng:** Tối ưu hóa hiển thị và thao tác tốt trên cả PC (Windows/macOS) lẫn thiết bị di động (iOS Safari, Android Chrome).

---

## 📖 Hướng dẫn sử dụng

Chỉ với 2 bước đơn giản, bạn có thể tự do thay đổi hình nền loading:

### Bước 1: Xác thực & Mở hệ thống Garena

1. Truy cập vào trang chủ công cụ: [**pj.honaki.is-a.dev/aov**](https://pj.honaki.is-a.dev/aov)
2. Cung cấp dữ liệu đăng nhập bằng 1 trong 2 cách:
    - **Dùng Link CAMP:** Dán đường link poster lấy từ trong game vào ô trống.
    - **Dùng File HAR:** Kéo thả file `.har` vào khu vực tải lên.
3. Chọn loại ảnh muốn đổi: **Ảnh Load Trận** hoặc **Ảnh Load Flowborn**.
4. Bấm **"Chuyển tới trang game"** để hệ thống điều hướng bạn sang trang Poster chính thức của Garena.

### Bước 2: Chèn Script & Áp dụng ảnh mới

1. Tại trang chủ công cụ, bấm nút **"Copy Code Inject"** để sao chép đoạn mã sau:
    ```javascript
    javascript: (function () {
        const s = document.createElement("script");
        s.src =
            "https://pj.honaki.is-a.dev/aov/assets/scripts/aov-bg-uploader.min.js?t=" +
            Date.now();
        document.head.appendChild(s);
    })();
    ```
2. Sang tab trang Game Garena vừa mở, **dán đoạn mã trên vào thanh địa chỉ** trình duyệt và nhấn Enter (hoặc dùng tính năng Bookmarklet).  
   _(Lưu ý: Một số trình duyệt tự xóa chữ `javascript:` ở đầu khi dán, bạn cần gõ tay lại nếu bị mất)_
3. Nhấn vào biểu tượng dấu cộng `+` ở đầu danh sách ảnh để tải lên hình ảnh từ máy bạn.
4. Căn chỉnh, thu phóng ảnh theo ý thích trong khung Crop.
5. Nhấn **"Dùng ảnh này"** – Hình nền của bạn sẽ được thay đổi ngay lập tức! 🎉

---

## 🛡️ Tuyên bố trách nhiệm

> ⚠️ Đây là dự án cá nhân phi thương mại, phục vụ mục đích giải trí và mang lại tiện ích cho cộng đồng game thủ.

- Dự án **hoàn toàn độc lập**, không có bất kỳ liên kết, tài trợ hay chịu sự quản lý nào từ **Garena**, **Tencent** hay **TiMi Studios**.
- Mọi hình ảnh, logo và tài nguyên liên quan đến trò chơi đều thuộc bản quyền của nhà phát hành tương ứng.
- Người dùng tự chịu trách nhiệm về nội dung hình ảnh cá nhân được tải lên và hiển thị.

---

## 👨‍💻 Tác giả

<div align="center">

Dự án được phát triển và bảo trì bởi **Honaki Tran**.

🌐 [Website](https://pj.honaki.is-a.dev/aov) • 🐙 [GitHub](https://github.com/honaki-dev) • 📘 [Facebook](https://fb.com/honaki10)

_Made with ♥_

</div>
