{{- define "deepwiki-open.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "deepwiki-open.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "deepwiki-open.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "deepwiki-open.selectorLabels" -}}
app.kubernetes.io/name: {{ include "deepwiki-open.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "deepwiki-open.labels" -}}
helm.sh/chart: {{ include "deepwiki-open.chart" . }}
{{ include "deepwiki-open.selectorLabels" . }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | trunc 63 | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end -}}

{{- define "deepwiki-open.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "deepwiki-open.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "deepwiki-open.image" -}}
{{- if .Values.image.digest -}}
{{- printf "%s@%s" .Values.image.repository .Values.image.digest -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository (.Values.image.tag | default .Chart.AppVersion) -}}
{{- end -}}
{{- end -}}

{{- define "deepwiki-open.claimName" -}}
{{- default (include "deepwiki-open.fullname" .) .Values.persistence.existingClaim -}}
{{- end -}}

{{/* HOME of the non-root user. ~/.adalflow lives under it. */}}
{{- define "deepwiki-open.home" -}}
/home/deepwiki
{{- end -}}

{{- define "deepwiki-open.validate" -}}
{{- if and .Values.secret.existingSecret .Values.secret.values -}}
{{- fail "secret: set either existingSecret or values, not both" -}}
{{- end -}}
{{- if and .Values.httpRoute.enabled (not .Values.httpRoute.parentRefs) -}}
{{- fail "httpRoute.enabled requires at least one entry in httpRoute.parentRefs" -}}
{{- end -}}
{{- end -}}
