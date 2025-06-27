#!/bin/bash

echo "🚀 Final DeepWiki Deployment Solution with Persistent Storage"
echo "============================================================="

# Create a service.yaml with proper startup probe configuration and volume mounts
cat > service.yaml << EOF
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: deepwiki-open
  annotations:
    run.googleapis.com/launch-stage: BETA
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/execution-environment: gen2
        run.googleapis.com/cpu-throttling: "false"
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containerConcurrency: 1000
      timeoutSeconds: 600
      containers:
      - image: gcr.io/srpdev-7b1d3/deepwiki-open
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          value: "sk-82HhpCHH06eCY_nutInQ-A"
        - name: OPENAI_BASE_URL
          value: "https://litellm.vllm.yesy.dev"
        - name: GOOGLE_API_KEY
          value: "AIzaSyAixcUIaxjpQO_pnpr6Gy1VEdsZN5N680Y"
        - name: NODE_ENV
          value: "production"
        - name: SERVER_BASE_URL
          value: "http://localhost:8001"
        - name: NEXT_PUBLIC_SERVER_BASE_URL
          value: "http://localhost:8001"
        - name: LOG_LEVEL
          value: "DEBUG"
        - name: LOG_FILE_PATH
          value: "api/logs/application.log"
        - name: ADALFLOW_CACHE_DIR
          value: "/tmp/adalflow"
        resources:
          limits:
            cpu: "4"
            memory: "8Gi"
        volumeMounts:
        - name: adalflow-cache
          mountPath: /tmp/adalflow
        - name: logs-volume
          mountPath: /app/api/logs
        startupProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 10
          failureThreshold: 18  # 3 minutes total
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
      volumes:
      - name: adalflow-cache
        emptyDir:
          sizeLimit: 4Gi
      - name: logs-volume
        emptyDir:
          sizeLimit: 1Gi
  traffic:
  - percent: 100
    latestRevision: true
EOF

echo "📝 Deploying with persistent storage configuration..."

# Deploy using the YAML configuration
gcloud run services replace service.yaml --region=us-central1

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed!"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe deepwiki-open --region=us-central1 --format="value(status.url)")
    echo "🔗 Service URL: ${SERVICE_URL}"
    
    echo ""
    echo "📊 Monitoring service startup (this may take up to 3 minutes)..."
    
    # Monitor the service status
    for i in {1..20}; do
        echo "🔍 Check $i/20..."
        STATUS=$(gcloud run services describe deepwiki-open --region=us-central1 --format="value(status.conditions[0].status)")
        
        if [ "${STATUS}" = "True" ]; then
            echo "🎉 SUCCESS! Service is healthy and ready!"
            echo "🌐 Access your application at: ${SERVICE_URL}"
            echo ""
            echo "💡 重要提示: 添加了持久化存储来解决嵌入缓存问题"
            echo "📦 临时存储: /tmp/adalflow (4GB) 用于缓存仓库和嵌入"
            break
        fi
        
        if [ $i -eq 20 ]; then
            echo "⚠️ Service is still starting up. Check logs for details:"
            echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=deepwiki-open\" --limit=10"
        fi
        
        sleep 15
    done
    
    # Clean up
    rm -f service.yaml
    
else
    echo "❌ Deployment failed!"
    rm -f service.yaml
    exit 1
fi 