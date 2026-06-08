# Kubernetes (Phase 0)

This folder contains baseline Kubernetes manifests for the platform.

Goals (TZ-aligned):
- Secure defaults (non-root, resource limits, read-only filesystem where possible)
- Environment via Kubernetes Secrets + ConfigMaps
- Readiness/liveness probes
- Separate API and worker deployments

Production hardening (to be completed during Phase 0):
- Ingress/TLS
- External secret management
- Autoscaling (HPA)
- PostgreSQL/Redis/MinIO provisioning choices (managed vs self-hosted)
