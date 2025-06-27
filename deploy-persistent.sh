#!/bin/bash

# 检查必需的环境变量
check_env_vars() {
    local missing_vars=()
    
    if [ -z "$PROJECT_ID" ]; then
        missing_vars+=("PROJECT_ID")
    fi
    
    if [ -z "$OPENAI_API_KEY" ]; then
        missing_vars+=("OPENAI_API_KEY")
    fi
    
    if [ -z "$GOOGLE_API_KEY" ]; then
        missing_vars+=("GOOGLE_API_KEY")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ 缺少必需的环境变量: ${missing_vars[*]}"
        echo "请设置这些环境变量然后重新运行脚本。"
        exit 1
    fi
}

# 创建Cloud Storage bucket用于持久化
create_storage_bucket() {
    local bucket_name="deepwiki-cache-${PROJECT_ID}"
    
    echo "🗄️ 检查存储桶: ${bucket_name}"
    
    if ! gsutil ls -b gs://${bucket_name} > /dev/null 2>&1; then
        echo "📦 创建存储桶: ${bucket_name}"
        gsutil mb -p ${PROJECT_ID} -l us-central1 gs://${bucket_name}
        
        # 设置生命周期规则，删除超过30天的旧文件
        cat > lifecycle.json << EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 30
      }
    }
  ]
}
EOF
        gsutil lifecycle set lifecycle.json gs://${bucket_name}
        rm lifecycle.json
        
        echo "✅ 存储桶创建完成"
    else
        echo "✅ 存储桶已存在"
    fi
}

# 设置gcloud默认项目
setup_gcloud() {
    echo "🔧 设置gcloud配置"
    gcloud config set project ${PROJECT_ID}
    
    # 启用必需的API
    echo "🔌 启用必需的API服务"
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
}

# 部署应用
deploy_app() {
    echo "🚀 开始部署DeepWiki到Cloud Run"
    
    # 构建环境变量参数
    local env_vars="NODE_ENV=production,SERVER_BASE_URL=http://localhost:8001,WIKI_CACHE_PATH=/mnt/cache"
    
    # 添加API密钥
    env_vars="${env_vars},OPENAI_API_KEY=${OPENAI_API_KEY}"
    env_vars="${env_vars},GOOGLE_API_KEY=${GOOGLE_API_KEY}"
    
    # 添加可选的环境变量
    if [ -n "$OPENROUTER_API_KEY" ]; then
        env_vars="${env_vars},OPENROUTER_API_KEY=${OPENROUTER_API_KEY}"
    fi
    
    if [ -n "$GITHUB_TOKEN" ]; then
        env_vars="${env_vars},GITHUB_TOKEN=${GITHUB_TOKEN}"
    fi
    
    if [ -n "$DEEPWIKI_AUTH_MODE" ]; then
        env_vars="${env_vars},DEEPWIKI_AUTH_MODE=${DEEPWIKI_AUTH_MODE}"
    fi
    
    if [ -n "$DEEPWIKI_AUTH_CODE" ]; then
        env_vars="${env_vars},DEEPWIKI_AUTH_CODE=${DEEPWIKI_AUTH_CODE}"
    fi
    
    # 使用gcloud builds submit进行构建和部署
    gcloud builds submit . \
        --config=cloudbuild.persistent.yaml \
        --substitutions=_CACHE_BUCKET=deepwiki-cache-${PROJECT_ID}
    
    if [ $? -eq 0 ]; then
        echo "✅ 部署成功！"
        
        # 获取服务URL
        SERVICE_URL=$(gcloud run services describe deepwiki-persistent --region=us-central1 --format='value(status.url)')
        echo "🌐 应用访问地址: ${SERVICE_URL}"
        
        # 显示有用的管理命令
        echo ""
        echo "📋 有用的管理命令:"
        echo "  查看日志: gcloud run services logs read deepwiki-persistent --region=us-central1"
        echo "  查看服务状态: gcloud run services describe deepwiki-persistent --region=us-central1"
        echo "  删除服务: gcloud run services delete deepwiki-persistent --region=us-central1"
        echo "  查看存储桶: gsutil ls -la gs://deepwiki-cache-${PROJECT_ID}"
    else
        echo "❌ 部署失败，请检查错误信息"
        exit 1
    fi
}

# 主函数
main() {
    echo "🚀 DeepWiki 持久化部署脚本"
    echo "=================================="
    
    check_env_vars
    setup_gcloud
    create_storage_bucket
    deploy_app
    
    echo ""
    echo "🎉 部署完成！"
}

# 显示帮助信息
show_help() {
    cat << EOF
DeepWiki 持久化部署脚本

使用方法:
  $0 [选项]

选项:
  -h, --help     显示此帮助信息

必需的环境变量:
  PROJECT_ID        Google Cloud项目ID
  OPENAI_API_KEY    OpenAI API密钥
  GOOGLE_API_KEY    Google API密钥

可选的环境变量:
  OPENROUTER_API_KEY    OpenRouter API密钥
  GITHUB_TOKEN          GitHub Personal Access Token
  DEEPWIKI_AUTH_MODE    启用认证模式 (true/false)
  DEEPWIKI_AUTH_CODE    认证代码

示例:
  export PROJECT_ID="my-project"
  export OPENAI_API_KEY="sk-..."
  export GOOGLE_API_KEY="AIza..."
  export GITHUB_TOKEN="ghp_..."
  $0

EOF
}

# 处理命令行参数
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac 