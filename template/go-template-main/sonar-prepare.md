# SonarQube Setup

## 1. Start SonarQube

```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:community
```

Wait until the server is ready:

```bash
until curl -s http://localhost:9000/api/system/status | grep -q '"status":"UP"'; do
  echo "Waiting for SonarQube..."; sleep 5
done
echo "SonarQube is UP"
```

## 2. Create Project & Token

```bash
# Create project
curl -s -u admin:admin -X POST "http://localhost:9000/api/projects/create" \
  -d "name=go-template-2026&project=go-template-2026"

# Generate token
curl -s -u admin:admin -X POST "http://localhost:9000/api/user_tokens/generate" \
  -d "name=go-template-token"
```

Save the returned `token` value for the next step.

## 3. Run Tests & Generate Coverage

```bash
set -a && source <(grep -v '^#' .env | grep -v '^$') && set +a

go test -v -coverprofile=coverage.out -coverpkg=./... -covermode=set ./... -timeout 120s

# Strip test files, main.go, and util/ from coverage report
grep -v "_test.go" coverage.out \
  | grep -v "go-template/main.go" \
  | grep -v "go-template/util/" \
  > coverage_filtered.out
```

## 4. Run Scanner

```bash
docker run --rm \
  -e SONAR_HOST_URL="http://host.docker.internal:9000" \
  -e SONAR_TOKEN="<your-token>" \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli
```

## 5. View Results

Open: http://localhost:9000/dashboard?id=go-template

Default credentials: `admin` / `admin`

---

## sonar-project.properties

```properties
sonar.projectKey=go-template
sonar.projectName=go-template
sonar.projectVersion=1.0

sonar.sources=.
sonar.exclusions=**/*_test.go,**/vendor/**

sonar.tests=.
sonar.test.inclusions=**/*_test.go

sonar.go.coverage.reportPaths=coverage_filtered.out
sonar.coverage.exclusions=main.go,util/**,router/**,middleware/**

sonar.sourceEncoding=UTF-8
sonar.scm.disabled=true
```
