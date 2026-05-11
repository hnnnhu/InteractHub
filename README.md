# 🌐 InteractHub

> **Ứng dụng mạng xã hội full-stack** — Bài tập lớn môn C# and .NET Development, Spring 2026  
> Trường Đại học Sài Gòn — Khoa Công Nghệ Thông Tin

---

## 🔗 Demo trực tuyến

**🌍 Public Website:**  
👉 [https://interact-hub-git-main-hnnnhus-projects.vercel.app/login](https://interact-hub-git-main-hnnnhus-projects.vercel.app/

> Frontend được deploy trên **Vercel**. Backend API chạy trên **Railway** (PostgreSQL).

---

## 📖 Giới thiệu

InteractHub là nền tảng mạng xã hội cho phép người dùng:

- 🔐 Đăng ký, đăng nhập và xác thực bảo mật (JWT + Refresh Token)
- 📝 Đăng bài viết kèm hình ảnh, thêm hashtag và mention
- 📖 Đăng story (nội dung tạm thời)
- ❤️ React (like/love/haha...), bình luận và lưu bài viết
- 👥 Gửi và quản lý lời mời kết bạn, danh sách bạn thân
- 🔔 Nhận thông báo real-time qua SignalR
- 🔍 Tìm kiếm người dùng và hashtag
- ⚙️ Quản lý hồ sơ, bảo mật, quyền riêng tư
- 🚫 Chặn / tắt tiếng người dùng
- 🛡️ Quản trị viên (Admin): duyệt báo cáo vi phạm, quản lý người dùng & bài đăng

---

## 🛠️ Công nghệ sử dụng

### Frontend
| Công nghệ | Mô tả |
|---|---|
| React 18 + TypeScript | Framework UI chính |
| Vite | Build tool |
| Tailwind CSS | Styling utility-first |
| Zustand | Global state management |
| React Query (TanStack) | Data fetching & caching |
| React Hook Form | Quản lý form & validation |
| Axios | HTTP client |
| @microsoft/signalr | Real-time notifications |
| Framer Motion | Animations |
| React Router v6 | Routing & protected routes |

### Backend
| Công nghệ | Mô tả |
|---|---|
| ASP.NET Core 8.0 | Web API framework |
| Entity Framework Core 8 | ORM |
| PostgreSQL (Railway) | Database |
| ASP.NET Core Identity | Quản lý người dùng & phân quyền |
| JWT + Refresh Token | Authentication |
| SignalR | Real-time hub |
| FluentValidation | Validation layer |
| AutoMapper | Object mapping |
| Swagger / OpenAPI | API documentation |
| Cloudinary | Lưu trữ hình ảnh |

---

## 🚀 Chạy dự án cục bộ

### Yêu cầu
- [Node.js](https://nodejs.org/) >= 18
- [.NET SDK](https://dotnet.microsoft.com/) >= 8.0
- [PostgreSQL](https://www.postgresql.org/) hoặc kết nối Railway

---

### 1. Clone repository

```bash
git clone https://github.com/<your-username>/InteractHub.git
cd InteractHub
```

---

### 2. Chạy Backend

```bash
cd SourceCode/SocialGraphPlatform.API
```

Tạo / cập nhật file `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=interacthub;Username=postgres;Password=yourpassword"
  },
  "JwtSettings": {
    "Secret": "your-secret-key-at-least-64-characters-long",
    "Issuer": "SocialGraphPlatform",
    "Audience": "SocialGraphUser",
    "ExpiryMinutes": 60,
    "RefreshTokenExpiryDays": 7
  },
  "BaseUrl": "https://localhost:7042"
}
```

Chạy migration và khởi động API:

```bash
dotnet ef database update
dotnet run
```

> Swagger UI: [https://localhost:7042/swagger](https://localhost:7042/swagger)

---

### 3. Chạy Frontend

```bash
cd SourceCode/social-graph-platform-frontend
npm install
npm run dev
```

> Ứng dụng chạy tại: [http://localhost:5173](http://localhost:5173)

Tạo file `.env.local` nếu cần override URL backend:

```env
VITE_API_BASE_URL=https://localhost:7042
```

---

## 🧪 Chạy Unit Test

```bash
cd SourceCode/SocialGraphPlatform.Tests
dotnet test --collect:"XPlat Code Coverage"
```

Xem báo cáo coverage tại thư mục `coveragereport/index.html`.

---

## 📁 Cấu trúc dự án

```
SourceCode/
├── SocialGraphPlatform.API/          # Web API (controllers, middleware, Program.cs)
├── SocialGraphPlatform.Application/  # DTOs, interfaces, validators, AutoMapper profiles
├── SocialGraphPlatform.Domain/       # Entities, enums
├── SocialGraphPlatform.Infrastructure/ # Services, repositories, EF DbContext, migrations
├── SocialGraphPlatform.Tests/        # Unit tests (xUnit + Moq)
├── social-graph-platform-frontend/   # React + TypeScript frontend
│   └── src/
│       ├── api/          # Axios API modules
│       ├── components/   # React components
│       ├── context/      # AuthContext, NotificationContext
│       ├── hooks/        # Custom hooks
│       ├── pages/        # Route pages
│       ├── routes/       # ProtectedRoute, router config
│       ├── services/     # SignalR hub
│       └── types/        # TypeScript interfaces
└── Dockerfile                        # Container build cho backend
```

---

## 👤 Thông tin sinh viên

| Thông tin | Chi tiết |
|---|---|
| Môn học | C# and .NET Development |
| Học kỳ | Spring 2026 |
| Trường | Đại học Sài Gòn |
| Khoa | Công Nghệ Thông Tin |
| MSSV | 3122410285 |
