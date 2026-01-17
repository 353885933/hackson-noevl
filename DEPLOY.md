# 魔搭创空间部署说明

## 项目信息
- **项目名称**: 叙事引擎 (Narrative Engine)
- **版本**: V 2.0.4
- **技术栈**: Vite + React + TypeScript
- **部署类型**: Docker

## 部署文件说明

### 1. ms_deploy.json
魔搭创空间部署配置文件，包含：
- SDK类型: Docker
- 资源配置: xGPU (8核CPU + 32G内存 + 16G显存)
- 端口: 7860
- 环境变量: 所有API密钥

### 2. Dockerfile
多阶段构建配置：
- **Stage 1**: 使用Node.js 18构建Vite应用
- **Stage 2**: 使用Nginx Alpine镜像提供静态文件服务

### 3. nginx.conf
Nginx服务器配置：
- 监听7860端口
- SPA路由支持
- API代理配置（阿里云/ModelScope/Minimax）
- Gzip压缩
- 静态资源缓存

## 部署步骤

### 方式一：通过魔搭创空间Web界面

1. 访问 [魔搭创空间](https://modelscope.cn/studios)
2. 点击"创建创空间" → "编程式创空间"
3. 切换到"快速部署并创建"模式
4. 填写基础信息：
   - 英文名称: narrative-engine
   - 中文名称: 叙事引擎
   - 描述: AI驱动的小说到Galgame自动转换平台
5. 上传整个项目文件夹
6. 确认创建并部署

### 方式二：通过Git推送

```bash
# 添加魔搭Git仓库为远程仓库
git remote add modelscope <your-modelscope-git-url>

# 推送代码
git push modelscope main
```

## 环境变量说明

所有API密钥已配置在`ms_deploy.json`中：

- `VITE_ALIYUN_API_KEY`: 阿里云DashScope API密钥
- `VITE_DASHSCOPE_API_KEY`: DashScope API密钥（同上）
- `VITE_MODELSCOPE_API_KEY`: ModelScope API密钥
- `VITE_MINIMAX_API_KEY`: Minimax API密钥
- `NODE_ENV`: 生产环境标识

## 资源配置说明

选择 **xGPU** 资源的原因：
1. AI模型推理需要GPU加速
2. 图像生成服务需要较大内存
3. 确保流畅的用户体验

如果不需要GPU，可以修改为：
```json
"resource_configuration": "platform/2v-cpu-16g-mem"
```

## 常见问题

### 1. 部署失败：端口冲突
确保`nginx.conf`和`Dockerfile`中的端口都是7860

### 2. API调用失败
检查环境变量是否正确配置，API密钥是否有效

### 3. 静态资源404
确保`npm run build`成功执行，`dist`目录已生成

### 4. 跨域问题
Nginx已配置API代理，无需额外处理CORS

## 本地测试部署配置

```bash
# 构建Docker镜像
docker build -t narrative-engine .

# 运行容器
docker run -p 7860:7860 \
  -e VITE_ALIYUN_API_KEY=your_key \
  -e VITE_DASHSCOPE_API_KEY=your_key \
  -e VITE_MODELSCOPE_API_KEY=your_key \
  -e VITE_MINIMAX_API_KEY=your_key \
  narrative-engine

# 访问应用
open http://localhost:7860
```

## 注意事项

1. **API密钥安全**: 生产环境建议通过魔搭创空间的环境变量管理功能配置，不要硬编码在代码中
2. **资源限制**: xGPU资源需要申请权限，请先加入「xGPU乐园」组织
3. **构建时间**: 首次部署需要安装依赖和构建，可能需要5-10分钟
4. **日志查看**: 部署过程中可以通过"查看日志"功能实时监控

## 更新部署

修改代码后重新部署：
1. 点击创空间右上角"..." → "重新上传并部署"
2. 上传更新后的项目文件夹
3. 等待部署完成

## 技术支持

- 魔搭创空间文档: https://modelscope.cn/docs/
- 项目GitHub: https://github.com/353885933/hackson-noevl
