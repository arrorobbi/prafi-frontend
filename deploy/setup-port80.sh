#!/usr/bin/env bash
# Move port 80 from nginx to prafi-frontend (Next.js).
# nginx keeps 443: transniaga -> frontend, core.transniaga -> Webmin.
set -euo pipefail
cd "$(dirname "$0")"

echo "[1/4] Installing nginx configs (no port 80)"
cp nginx-default /etc/nginx/sites-available/default
cp nginx-core.transniaga /etc/nginx/sites-available/core.transniaga

echo "[2/4] Testing and reloading nginx"
nginx -t
systemctl reload nginx
sleep 1
if ss -ltnp | grep -q 'nginx.*:80\b\|:80 .*nginx'; then
  echo "nginx still on port 80, restarting it"; systemctl restart nginx
fi

echo "[3/4] Installing and starting prafi-frontend on port 80"
cp prafi-frontend.service /etc/systemd/system/prafi-frontend.service
systemctl daemon-reload
systemctl enable prafi-frontend
systemctl restart prafi-frontend
sleep 3

echo "[4/4] Status"
systemctl --no-pager --lines=10 status prafi-frontend || true
ss -ltnp | grep -E ':(80|443) '
