#!/bin/bash
set -e

# Install Docker
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose-v2

sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Create .env file
cat > /home/ubuntu/.env << 'ENVEOF'
CORE_DB=Host=YOUR_NEON_HOST;Port=5432;Database=postgres;Username=neondb_owner;Password=YOUR_PASSWORD;SslMode=Require;Trust Server Certificate=true;
TENANT_TEMPLATE_DB=Host=YOUR_NEON_HOST;Port=5432;Database=tenant_template;Username=neondb_owner;Password=YOUR_PASSWORD;SslMode=Require;Trust Server Certificate=true;
JWT_KEY=CHANGE_ME_MINIMUM_32_CHARACTERS_LONG_KEY_HERE_PLEASE
DOMAIN=YOUR_EC2_PUBLIC_IP.sslip.io
ENVEOF

# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | sudo docker login ghcr.io -u johanloperez --password-stdin

# Run compose
cd /home/ubuntu
sudo docker compose -f docker-compose.yml --env-file .env up -d
