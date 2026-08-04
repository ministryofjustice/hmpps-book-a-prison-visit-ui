echo "Pulling types into orchestration-api.d.ts"
npx -y openapi-typescript http://localhost:8080/v3/api-docs | sed "s/\"/'/g" | sed "s/;//g" > ./server/@types/orchestration-api.d.ts
echo "Formatting orchestration-api.d.ts"
eslint --fix "./server/@types/orchestration-api.d.ts"
