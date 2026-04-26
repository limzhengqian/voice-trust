#!/usr/bin/env bash
# Deploy all services to AWS ECR + ECS
# Usage: ./scripts/deploy-aws.sh <aws-account-id> <region> <cluster-name>
set -euo pipefail

AWS_ACCOUNT=${1:?Usage: deploy-aws.sh <account-id> <region> <cluster>}
REGION=${2:?Missing region}
CLUSTER=${3:?Missing cluster name}
ECR_BASE="${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"

SERVICES=("auth-service" "kyc-service" "api-gateway")

echo "==> Logging into ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$ECR_BASE"

for SERVICE in "${SERVICES[@]}"; do
  REPO="${ECR_BASE}/ekyc-${SERVICE}"
  IMAGE_TAG="$(git rev-parse --short HEAD)"

  echo "==> Building ${SERVICE}..."
  docker build \
    -t "${REPO}:${IMAGE_TAG}" \
    -t "${REPO}:latest" \
    -f "src/java-services/${SERVICE}/Dockerfile" \
    src/java-services/

  echo "==> Pushing ${SERVICE}..."
  docker push "${REPO}:${IMAGE_TAG}"
  docker push "${REPO}:latest"

  echo "==> Updating ECS service ekyc-${SERVICE}..."
  aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "ekyc-${SERVICE}" \
    --force-new-deployment \
    --region "$REGION" \
    --output text --query 'service.serviceName'
done

echo ""
echo "==> Building and pushing frontend..."
FRONTEND_REPO="${ECR_BASE}/ekyc-frontend"
IMAGE_TAG="$(git rev-parse --short HEAD)"

docker build \
  -t "${FRONTEND_REPO}:${IMAGE_TAG}" \
  -t "${FRONTEND_REPO}:latest" \
  src/frontend/

docker push "${FRONTEND_REPO}:${IMAGE_TAG}"
docker push "${FRONTEND_REPO}:latest"

aws ecs update-service \
  --cluster "$CLUSTER" \
  --service "ekyc-frontend" \
  --force-new-deployment \
  --region "$REGION" \
  --output text --query 'service.serviceName'

echo ""
echo "Deployment complete. Monitor at:"
echo "https://${REGION}.console.aws.amazon.com/ecs/v2/clusters/${CLUSTER}/services"
