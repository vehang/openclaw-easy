# Next.js Standalone Docker 部署
FROM node:18-alpine AS runner

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 支持运行时动态API环境配置
# 可通过 docker run -e API_ENV=development 来覆盖
ENV API_ENV=production

# 复制standalone构建产物（包含所有依赖）
COPY --chown=nextjs:nodejs .next/standalone ./

# 复制静态文件到正确位置
COPY --chown=nextjs:nodejs .next/static ./.next/static

# 复制public目录
COPY --chown=nextjs:nodejs public ./public

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]


## Next.js Standalone Docker 部署
#FROM node:18-alpine AS runner
#
## 安装必要的系统依赖
#RUN apk add --no-cache libc6-compat
#
## 创建非root用户
#RUN addgroup --system --gid 1001 nodejs
#RUN adduser --system --uid 1001 nextjs
#
#WORKDIR /app
#
## 设置环境变量
#ENV NODE_ENV=production
#ENV NEXT_TELEMETRY_DISABLED=1
#ENV PORT=3000
#ENV HOSTNAME="0.0.0.0"
#
## 复制standalone构建产物（包含所有依赖）
#COPY --chown=nextjs:nodejs .next/standalone ./
#
## 复制静态文件到正确位置
#COPY --chown=nextjs:nodejs .next/static ./.next/static
#
## 复制public目录
#COPY --chown=nextjs:nodejs public ./public
#
## 切换到非root用户
#USER nextjs
#
## 暴露端口
#EXPOSE 3000
#
## 启动命令
#CMD ["node", "server.js"]