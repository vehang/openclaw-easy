# BaoBoxs 项目配置

## 仓库信息

### baoboxs-nav (前端)
- **类型**: Next.js 15 前端项目
- **仓库**: https://github.com/vehang/baoboxs-nav
- **分支**: master
- **本地目录**: `projects/baoboxs-nav/`
- **Token**: `<stored-in-secrets>`

### baoboxs-service (后端)
- **类型**: Spring Boot 2.1.5 后端项目 (Java 8)
- **仓库**: https://github.com/vehang/baoboxs-service
- **分支**: master
- **本地目录**: `projects/baoboxs-service/`
- **Token**: `<stored-in-secrets>`

---

## Git 操作

### 推送更新 (baoboxs-nav)
```bash
cd projects/baoboxs-nav
git remote set-url origin https://x-access-token:TOKEN@github.com/vehang/baoboxs-nav.git
git push origin master
```

### 推送更新 (baoboxs-service)
```bash
cd projects/baoboxs-service
git remote set-url origin https://x-access-token:TOKEN@github.com/vehang/baoboxs-service.git
git push origin master
```

---

_创建时间: 2026-03-21_
