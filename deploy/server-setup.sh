#!/bin/bash
# =============================================================================
# LoveWish — One-shot server setup script
# Run this ONCE on a fresh Hetzner CX22 (Ubuntu 22.04) as root or sudo user
#
# BEFORE RUNNING: fill in the 5 variables below, then:
#   chmod +x server-setup.sh && sudo bash server-setup.sh
# =============================================================================
set -e

# ── FILL THESE IN ─────────────────────────────────────────────────────────────
DOMAIN="yourdomain.com"                         # e.g. lovewish.com
ADMIN_EMAIL="your@email.com"                    # for Let's Encrypt alerts
ADMIN_USERNAME="your_admin_username"            # admin login username
ADMIN_PASSWORD="your_strong_password_here"      # min 12 chars
JWT_SECRET="PASTE_YOUR_JWT_SECRET_HERE"         # use the one we generated
# ──────────────────────────────────────────────────────────────────────────────

APP_DIR="/home/deploy/lovewish"
GITHUB_REPO="https://github.com/cholapandian441/lovewish.git"

echo "==> [1/9] Creating deploy user..."
if ! id -u deploy &>/dev/null; then
  adduser --disabled-password --gecos "" deploy
  usermod -aG sudo deploy
  mkdir -p /home/deploy/.ssh
  cp ~/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true
fi

echo "==> [2/9] Installing system packages..."
apt update -qq
apt install -y -qq git curl nginx certbot python3-certbot-nginx ufw

echo "==> [3/9] Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2

echo "==> [4/9] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> [5/9] Cloning repository..."
mkdir -p "$APP_DIR"
git clone "$GITHUB_REPO" "$APP_DIR"
chown -R deploy:deploy "$APP_DIR"

echo "==> [6/9] Installing backend dependencies..."
cd "$APP_DIR/backend"
sudo -u deploy npm install --omit=dev

echo "==> [7/9] Writing .env..."
sudo -u deploy tee "$APP_DIR/backend/.env" > /dev/null << ENV
PORT=3000
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}
ENV

echo "==> [8/9] Seeding database & starting app with PM2..."
cd "$APP_DIR/backend"
sudo -u deploy npm run seed
sudo -u deploy pm2 start pm2.config.js --env production
sudo -u deploy pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
systemctl enable pm2-deploy

echo "==> [9/9] Configuring nginx & SSL..."
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/lovewish
sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" /etc/nginx/sites-available/lovewish
ln -sf /etc/nginx/sites-available/lovewish /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

certbot --nginx \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "${ADMIN_EMAIL}" \
  --redirect

echo ""
echo "============================================="
echo " Deployment complete!"
echo " Your site is live at https://${DOMAIN}"
echo " Admin panel: https://${DOMAIN}/admin"
echo "============================================="
