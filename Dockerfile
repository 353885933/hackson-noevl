# 多阶段构建 - 第一阶段：构建应用
FROM node:20-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package.json ./

# 删除package-lock.json（避免私有registry认证问题）
# 使用npm install重新生成依赖
RUN npm install --legacy-peer-deps --registry=https://registry.npmjs.org/

# 复制所有源代码
COPY . .

# 构建生产版本
RUN npm run build

# 验证构建产物
RUN ls -la /app/dist && echo "Build successful: dist directory exists"

# 第二阶段：运行应用
FROM nginx:alpine

# 复制构建产物到nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 暴露7860端口（魔搭创空间要求）
EXPOSE 7860

# 使用启动脚本
CMD ["/start.sh"]
