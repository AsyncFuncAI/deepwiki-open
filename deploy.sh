#!/bin/bash
# DeepWiki 部署脚本 - 在本地执行
# 使用方法: ./deploy.sh

set -e

IMAGE_NAME="deepwiki"
IMAGE_TAG="latest"
ARCHIVE_NAME="deepwiki-deploy.tar.gz"

echo "======================================"
echo "  DeepWiki Docker 部署包生成"
echo "======================================"

# 1. 构建镜像
echo ""
echo "[1/4] 构建 Docker 镜像..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# 2. 导出镜像
echo ""
echo "[2/4] 导出镜像到 ${ARCHIVE_NAME}..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} -o ${ARCHIVE_NAME}

# 3. 复制部署文件
echo ""
echo "[3/4] 复制部署配置文件..."
mkdir -p deploy-package
cp ${ARCHIVE_NAME} deploy-package/
cp docker-compose.yml deploy-package/
cp -r nginx deploy-package/
cp .env.example deploy-package/.env 2>/dev/null || echo "# 请复制 .env 文件到 deploy-package/ 目录" > deploy-package/.env.example

# 4. 创建服务器部署脚本
echo ""
echo "[4/4] 创建部署脚本..."
cat > deploy-package/deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
# DeepWiki 服务器部署脚本

set -e

echo "======================================"
echo "  DeepWiki 服务器部署"
echo "======================================"

# 1. 加载镜像
echo ""
echo "[1/6] 加载 Docker 镜像..."
docker load < deepwiki-deploy.tar.gz

# 2. 检查 .env 文件
echo ""
echo "[2/6] 检查环境变量..."
if [ ! -f .env ]; then
    echo "错误: .env 文件不存在!"
    echo "请创建 .env 文件并配置以下变量:"
    echo "  - OPENAI_API_KEY"
    echo "  - GOOGLE_API_KEY"
    echo "  - SERVER_BASE_URL"
    exit 1
fi

# 3. 生成 Basic Auth 密码
echo ""
echo "[3/6] 生成 Basic Auth 密码文件..."
if [ ! -f nginx/.htpasswd ]; then
    echo "请输入用户名: "
    read -r username
    docker run --rm --entrypoint htpasswd httpd:alpine -nb "$username" deepwiki > nginx/.htpasswd
    echo "已创建 Basic Auth 密码文件"
fi

# 4. 启动服务
echo ""
echo "[4/6] 启动服务..."
docker-compose up -d

# 5. 等待服务启动
echo ""
echo "[5/6] 等待服务启动..."
sleep 10

# 6. 检查状态
echo ""
echo "[6/6] 检查服务状态..."
docker-compose ps

echo ""
echo "======================================"
echo "  部署完成!"
echo "======================================"
echo ""
echo "访问 http://your-server-ip"
echo "输入 Basic Auth 用户名和密码登录"
echo ""
echo "常用命令:"
echo "  docker-compose logs -f    # 查看日志"
echo "  docker-compose restart   # 重启服务"
echo "  docker-compose down      # 停止服务"
DEPLOY_SCRIPT

chmod +x deploy-package/deploy.sh

# 创建 .env.example
cat > deploy-package/.env.example << 'ENVFILE'
# DeepWiki 环境变量配置
# 复制此文件为 .env 并填写实际值

# ====================
# API 密钥 (必需)
# ====================
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_API_KEY=your-google-api-key

# ====================
# 服务器配置
# ====================
PORT=8001
SERVER_BASE_URL=http://localhost:8001

# ====================
# 日志配置
# ====================
LOG_LEVEL=INFO
ENVFILE

echo ""
echo "======================================"
echo "  部署包已生成!"
echo "======================================"
echo ""
echo "部署包位置: deploy-package/"
echo ""
echo "上传到服务器:"
echo "  scp -r deploy-package user@your-server:/path/to/"
echo ""
echo "在服务器上运行:"
echo "  cd /path/to/deploy-package"
echo "  cp .env.example .env"
echo "  vim .env  # 编辑环境变量"
echo "  ./deploy.sh"
echo ""
echo "======================================"
