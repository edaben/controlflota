#!/bin/bash
# scripts/setup-vps.sh - Instalación automática de dependencias para Control Bus en VPS (Ubuntu)

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Control Bus: Optimizador de VPS ===${NC}"

# 1. Actualizar sistema
echo "Actualizando paquetes..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependencias básicas
echo "Instalando Git, Curl y herramientas básicas..."
sudo apt install -y git curl build-essential

# 3. Instalar Docker
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker instalado exitosamente.${NC}"
else
    echo "Docker ya está instalado."
fi

# 4. Instalar Docker Compose Plugin
echo "Instalando Docker Compose Plugin..."
sudo apt install -y docker-compose-plugin

# 5. Configurar SWAP (Mucha gente usa VPS de 1GB/2GB, Next.js necesita más para build)
if [ ! -f /swapfile ]; then
    echo "Configurando 2GB de memoria SWAP para evitar fallos en el Build..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/etc/fstab
    echo -e "${GREEN}SWAP configurada.${NC}"
else
    echo "SWAP ya configurada."
fi

# 6. Configurar Firewall (UFW)
echo "Configurando Firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8081
sudo ufw --force enable

# 7. Crear carpetas de persistencia
echo "Creando carpeta para cargas de archivos (uploads)..."
mkdir -p uploads/tickets
mkdir -p uploads/reports
chmod -R 777 uploads/

echo ""
echo -e "${GREEN}=== Configuración Completada! ===${NC}"
echo -e "${BLUE}Paso siguiente:${NC}"
echo "1. Configura tu archivo .env (cp .env.example .env)"
echo "2. Ejecuta: docker compose up -d --build"
echo ""
echo "Nota: Si acabas de instalar Docker, es posible que necesites cerrar sesión y volver a entrar para usar el comando 'docker' sin sudo."
