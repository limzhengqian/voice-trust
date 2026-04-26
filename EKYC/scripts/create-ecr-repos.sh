#!/usr/bin/env bash
# Create ECR repositories for all services (run once before first deploy)
# Usage: ./scripts/create-ecr-repos.sh <region>
set -euo pipefail

REGION=${1:?Usage: create-ecr-repos.sh <region>}
REPOS=("ekyc-auth-service" "ekyc-kyc-service" "ekyc-api-gateway" "ekyc-frontend")

for REPO in "${REPOS[@]}"; do
  echo "Creating ECR repo: ${REPO}"
  aws ecr create-repository \
    --repository-name "$REPO" \
    --region "$REGION" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --output text --query 'repository.repositoryUri' 2>/dev/null || \
    echo "  (already exists, skipping)"
done

echo "Done. Run 'aws ecr describe-repositories --region ${REGION}' to verify."
