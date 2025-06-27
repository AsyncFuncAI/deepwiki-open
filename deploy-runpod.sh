#!/bin/bash

# RunPod部署脚本
# 使用最新构建的Docker镜像部署到RunPod

echo "🚀 开始部署 DeepWiki 到 RunPod..."

# 检查runpod CLI是否安装
if ! command -v runpod &> /dev/null; then
    echo "❌ RunPod CLI 未安装，请先安装: pip install runpod"
    exit 1
fi

# 部署配置
POD_NAME="deepwiki-open-$(date +%Y%m%d-%H%M%S)"
IMAGE_NAME="shiqi/deepwiki-open:latest"

echo "📦 使用镜像: $IMAGE_NAME"
echo "🏷️  Pod名称: $POD_NAME"

# 创建Pod
runpod create pod \
  --name="$POD_NAME" \
  --image-name="$IMAGE_NAME" \
  --gpu-count=0 \
  --vcpu-count=2 \
  --memory=4 \
  --container-disk=10 \
  --volume-disk=10 \
  --ports="3000/http" \
  --env="OPENAI_API_KEY=sk-82HhpCHH06eCY_nutInQ-A" \
  --env="OPENAI_BASE_URL=https://litellm.vllm.yesy.dev" \
  --env="SERVER_BASE_URL=http://localhost:8001" \
  --env="NODE_ENV=production"

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo "🌐 请在RunPod控制台查看Pod状态和访问URL"
else
    echo "❌ 部署失败，请检查配置"
    exit 1
fi 