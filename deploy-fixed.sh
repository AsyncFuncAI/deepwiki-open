#!/bin/bash

BUILD_ID="352c3811-c011-475f-ba89-88a71d3e7f49"
PROJECT_ID="srpdev-7b1d3"
SERVICE_NAME="deepwiki-open"
REGION="us-central1"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🔄 Waiting for optimized build ${BUILD_ID} to complete..."

# Wait for build to complete
while true; do
    STATUS=$(gcloud builds describe ${BUILD_ID} --format="value(status)" 2>/dev/null)
    echo "Build status: ${STATUS}"
    
    if [ "${STATUS}" = "SUCCESS" ]; then
        echo "✅ Optimized build completed successfully!"
        break
    elif [ "${STATUS}" = "FAILURE" ] || [ "${STATUS}" = "CANCELLED" ]; then
        echo "❌ Build failed or was cancelled"
        exit 1
    fi
    
    sleep 10
done

echo "🚀 Deploying optimized version to Cloud Run..."

# Deploy to Cloud Run with proper startup probe timeout
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE} \
  --platform managed \
  --region ${REGION} \
  --port 3000 \
  --allow-unauthenticated \
  --memory 6Gi \
  --cpu 2 \
  --timeout 600 \
  --concurrency 1000 \
  --max-instances 10 \

  --set-env-vars "OPENAI_API_KEY=sk-82HhpCHH06eCY_nutInQ-A,OPENAI_BASE_URL=https://litellm.vllm.yesy.dev,NODE_ENV=production,SERVER_BASE_URL=http://localhost:8001,NEXT_PUBLIC_SERVER_BASE_URL=http://localhost:8001,LOG_LEVEL=INFO,LOG_FILE_PATH=api/logs/application.log"

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
    echo "🔗 Service URL: ${SERVICE_URL}"
    
    echo ""
    echo "📊 Checking service health in 60 seconds..."
    sleep 60
    
    # Check service status
    STATUS=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.conditions[0].status)")
    if [ "${STATUS}" = "True" ]; then
        echo "🎉 Service is healthy and ready!"
        echo "🌐 You can access your application at: ${SERVICE_URL}"
    else
        echo "⚠️  Service might have issues. Checking recent logs..."
        gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}" --limit=10 --format="value(textPayload,jsonPayload.message)" --freshness=5m
    fi
else
    echo "❌ Deployment failed!"
    exit 1
fi 