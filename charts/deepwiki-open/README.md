# deepwiki-open

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: latest](https://img.shields.io/badge/AppVersion-latest-informational?style=flat-square)

DeepWiki-Open generates interactive wikis for GitHub, GitLab and Bitbucket repositories.

The chart runs the image published by this repository (`ghcr.io/asyncfuncai/deepwiki-open`), which starts the Python API on port 8001 and the Next.js frontend on port 3000 in the same container. It runs as a single replica: cloned repositories, embeddings and the wiki cache live in `~/.adalflow`, kept on a PersistentVolumeClaim.

The image has no `USER`, so the chart runs it as UID 1000 with a read-only root filesystem, sets `HOME` to a writable volume and mounts emptyDirs where the app writes (logs, Next.js cache, `/tmp`).

## Install

```console
kubectl create namespace deepwiki
kubectl -n deepwiki create secret generic deepwiki-keys \
  --from-literal=GOOGLE_API_KEY=... \
  --from-literal=OPENAI_API_KEY=...

git clone https://github.com/AsyncFuncAI/deepwiki-open.git
helm upgrade --install deepwiki ./deepwiki-open/charts/deepwiki-open \
  --namespace deepwiki \
  --set secret.existingSecret=deepwiki-keys
```

Every key of the Secret becomes an environment variable, so any variable from the main README works there (`OPENROUTER_API_KEY`, `AWS_ACCESS_KEY_ID`, `DASHSCOPE_API_KEY`, `DEEPWIKI_AUTH_CODE`...). Non-secret settings go in `config`:

```yaml
config:
  DEEPWIKI_EMBEDDER_TYPE: ollama
  OLLAMA_HOST: http://ollama.ollama:11434
  DEEPWIKI_AUTH_MODE: "true"
```

Then forward both ports and open http://localhost:3000:

```console
kubectl -n deepwiki port-forward svc/deepwiki-deepwiki-open 3000:3000 8001:8001
```

The image tag defaults to `latest`. Pin `image.tag` to a `sha-<commit>` tag (or set `image.digest`) to control upgrades.

## Exposing it

The frontend builds the chat WebSocket URL in the browser as `<page host>:8001`, because `NEXT_PUBLIC_*` variables are fixed when the image is built. With the published image the browser must reach the API on port 8001 of the same hostname as the frontend. Options:

- `service.type: LoadBalancer`, which exposes 3000 and 8001 like `docker run` does.
- Gateway API with a second listener on port 8001: the chart renders one HTTPRoute for the frontend and, when `httpRoute.api.parentRefs` is set, another one for the API.

  ```yaml
  httpRoute:
    enabled: true
    parentRefs:
      - name: public
        namespace: gateway-system
        sectionName: https
    hostnames: [deepwiki.example.com]
    api:
      parentRefs:
        - name: public
          namespace: gateway-system
          sectionName: api   # listener on port 8001
  ```

- An image built with `NEXT_PUBLIC_WS_BASE_URL=https://deepwiki.example.com`. The browser then uses the same host and port, and `ingress.apiPaths` (or `httpRoute.apiPaths`) sends `/ws` and `/codemap` to the API:

  ```yaml
  image:
    repository: registry.example.com/deepwiki-open
    tag: my-build
  ingress:
    enabled: true
    className: nginx
    hosts:
      - host: deepwiki.example.com
        paths:
          - path: /
    apiPaths: [/ws, /codemap]
  ```

## Tests

```console
helm lint charts/deepwiki-open
helm unittest charts/deepwiki-open
helm test deepwiki -n deepwiki   # after install: calls /health and the frontend proxy
```

## Requirements

Kubernetes: `>=1.25.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` | Affinity rules. |
| commonLabels | object | `{}` | Extra labels added to every resource. |
| config | object | `{"LOG_LEVEL":"INFO"}` | Non-secret settings rendered into a ConfigMap and loaded as environment variables, for example DEEPWIKI_EMBEDDER_TYPE, OLLAMA_HOST, OPENAI_BASE_URL, AWS_REGION or DEEPWIKI_AUTH_MODE. |
| env | list | `[]` | Extra environment variables. |
| envFrom | list | `[]` | Extra envFrom sources. |
| extraVolumeMounts | list | `[]` | Extra volume mounts. |
| extraVolumes | list | `[]` | Extra volumes, for example a custom CA bundle. |
| fullnameOverride | string | `""` | Overrides the fully qualified resource name. |
| httpRoute.annotations | object | `{}` | HTTPRoute annotations. |
| httpRoute.api.parentRefs | list | `[]` | Gateway listeners for a second HTTPRoute that sends everything to the API, for example a listener on port 8001 for the same hostname. This is what the published image needs for chat over WebSocket. |
| httpRoute.apiPaths | list | `[]` | Path prefixes sent to the API instead of the frontend, same as `ingress.apiPaths`. |
| httpRoute.enabled | bool | `false` | Create a Gateway API HTTPRoute for the frontend. |
| httpRoute.hostnames | list | `["deepwiki.local"]` | Hostnames matched by the route. |
| httpRoute.parentRefs | list | `[{"name":"gateway","sectionName":"http"}]` | Gateways (and listeners) the route attaches to. |
| image.digest | string | `""` | Image digest. When set it takes precedence over the tag. |
| image.pullPolicy | string | `""` | Image pull policy. Left empty, Kubernetes uses Always for `latest` and IfNotPresent otherwise. |
| image.repository | string | `"ghcr.io/asyncfuncai/deepwiki-open"` | Image published by this repository's Docker workflow. It runs the Python API (port 8001) and the Next.js frontend (port 3000) in one container. |
| image.tag | string | `""` | Image tag. Defaults to the chart appVersion. Pin a `sha-<commit>` tag or a digest for reproducible installs. |
| imagePullSecrets | list | `[]` | Secrets used to pull the image. |
| ingress.annotations | object | `{}` | Ingress annotations. |
| ingress.apiPaths | list | `[]` | Path prefixes routed to the API on every host, for example `[/ws, /codemap]` with an image built with `NEXT_PUBLIC_WS_BASE_URL` set to the public URL. |
| ingress.className | string | `""` | IngressClass name. |
| ingress.enabled | bool | `false` | Create an Ingress for the frontend. |
| ingress.hosts | list | `[{"host":"deepwiki.local","paths":[{"path":"/","pathType":"Prefix"}]}]` | Hosts and paths routed to the frontend. |
| ingress.tls | list | `[]` | TLS configuration. |
| nameOverride | string | `""` | Overrides the chart name used in resource names and labels. |
| nodeSelector | object | `{}` | Node selector. |
| persistence.accessModes | list | `["ReadWriteOnce"]` | Access modes of the created claim. |
| persistence.annotations | object | `{}` | Annotations of the created claim, for example helm.sh/resource-policy: keep. |
| persistence.enabled | bool | `true` | Persist `~/.adalflow` (cloned repositories, embeddings and the wiki cache). When disabled an emptyDir is used and the data is lost on restart. |
| persistence.existingClaim | string | `""` | Use an existing PersistentVolumeClaim instead of creating one. |
| persistence.size | string | `"10Gi"` | Size of the created claim. |
| persistence.storageClass | string | `""` | StorageClass of the created claim. Empty uses the cluster default. |
| podAnnotations | object | `{}` | Extra annotations added to the pod. |
| podLabels | object | `{}` | Extra labels added to the pod. |
| podSecurityContext | object | `{"fsGroup":1000,"fsGroupChangePolicy":"OnRootMismatch","runAsGroup":1000,"runAsNonRoot":true,"runAsUser":1000,"seccompProfile":{"type":"RuntimeDefault"}}` | Pod security context. The image has no USER, so the chart runs it as an arbitrary non-root UID and points HOME at a writable volume. |
| priorityClassName | string | `""` | Priority class of the pod. |
| probes.liveness | object | `{"enabled":true,"failureThreshold":3,"httpGet":{"path":"/health","port":"api"},"periodSeconds":30,"timeoutSeconds":10}` | Liveness probe on the API health endpoint. |
| probes.readiness | object | `{"enabled":true,"failureThreshold":3,"httpGet":{"path":"/api/auth/status","port":"http"},"periodSeconds":10,"timeoutSeconds":5}` | Readiness probe through the frontend. Next.js proxies this path to the API, so both processes have to be up. |
| probes.startup | object | `{"enabled":true,"failureThreshold":60,"httpGet":{"path":"/health","port":"api"},"periodSeconds":5}` | Startup probe on the API health endpoint. |
| resources | object | `{"limits":{"memory":"6Gi"},"requests":{"cpu":"250m","memory":"2Gi"}}` | CPU and memory. The memory values follow docker-compose.yml (2g reserved, 6g limit); embedding large repositories needs the headroom. |
| revisionHistoryLimit | int | `3` | Revisions kept for rollback. |
| scratchSizeLimit | string | `"1Gi"` | Size limit of the emptyDir volumes used for HOME, logs, the Next.js cache and /tmp. |
| secret.existingSecret | string | `""` | Existing Secret whose keys are loaded as environment variables, for example OPENAI_API_KEY, GOOGLE_API_KEY, OPENROUTER_API_KEY, AWS_ACCESS_KEY_ID or DEEPWIKI_AUTH_CODE. Preferred over `secret.values`. |
| secret.values | object | `{}` | Key/value pairs rendered into a Secret managed by the chart. Empty by default; use it only when the values file is not committed anywhere. |
| securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]},"readOnlyRootFilesystem":true}` | Container security context. Paths the app writes to (HOME, data, logs, Next.js cache, /tmp) are mounted as volumes, so the root filesystem can stay read-only. |
| service.annotations | object | `{}` | Service annotations. |
| service.ports.api | int | `8001` | Port for the Python API. The published frontend opens its chat WebSocket on `<page host>:8001`, so keep 8001 when the browser reaches the API directly. |
| service.ports.http | int | `3000` | Port for the Next.js frontend. |
| service.type | string | `"ClusterIP"` | Service type. LoadBalancer exposes both ports the same way `docker run -p 3000:3000 -p 8001:8001` does. |
| serviceAccount.annotations | object | `{}` | ServiceAccount annotations, for example eks.amazonaws.com/role-arn to reach Bedrock with IRSA. |
| serviceAccount.automountServiceAccountToken | bool | `false` | The app does not talk to the Kubernetes API, so the token is not mounted. |
| serviceAccount.create | bool | `true` | Create a dedicated ServiceAccount. |
| serviceAccount.name | string | `""` | Name of the ServiceAccount. Generated when empty. |
| strategy | object | `{"type":"Recreate"}` | Deployment strategy. Recreate is the default because the data volume is ReadWriteOnce and the app keeps local state, so it runs as a single replica. |
| terminationGracePeriodSeconds | int | `30` | Seconds Kubernetes waits after SIGTERM before killing the pod. |
| tests.image | string | `"busybox:1.37"` | Image of the `helm test` pod that calls the API health endpoint. |
| tolerations | list | `[]` | Tolerations. |
