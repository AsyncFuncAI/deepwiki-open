#!/bin/bash
# DeepWiki 部署脚本 - 本地执行
# 使用方法: ./deploy.sh

set -e

IMAGE_NAME="deepwiki"
ARCHIVE_NAME="deepwiki-deploy.tar.gz"

echo "======================================"
echo "  DeepWiki Docker 部署包生成"
echo "======================================"

# 1. 构建镜像
echo ""
echo "[1/3] 构建 Docker 镜像..."
docker build -t ${IMAGE_NAME}:latest .

# 2. 导出镜像
echo ""
echo "[2/3] 导出镜像到 ${ARCHIVE_NAME}..."
docker save ${IMAGE_NAME}:latest -o ${ARCHIVE_NAME}

# 3. 复制部署文件
echo ""
echo "[3/3] 复制部署配置文件..."
mkdir -p deploy-package
cp ${ARCHIVE_NAME} deploy-package/
cp docker-compose.yml deploy-package/
cp .env.example deploy-package/.env
chmod +x deploy.sh
cp deploy.sh deploy-package/

echo ""
echo "======================================"
echo "  部署包已生成: deploy-package/"
echo "======================================"
echo ""
echo "上传到服务器:"
echo "  scp -r deploy-package user@your-server:/opt/deepwiki/"
echo ""
echo "在服务器上运行:"
echo "  cd /opt/deepwiki/deploy-package"
echo "  cp .env .env.bak"
echo "  vim .env  # 填写 API Key 和端口"
echo "  docker-compose up -d"
echo ""
