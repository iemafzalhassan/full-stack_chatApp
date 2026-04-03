echo "installing ingress"
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash > /dev/null 2>&1
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx --force-update > /dev/null
helm repo update > /dev/null
helm upgrade --install my-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace > /dev/null
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
echo "installed ingress succesfully "
