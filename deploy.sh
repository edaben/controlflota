#!/bin/bash
# deploy.sh - Script de deploy rápido para Control Bus
# Uso: ./deploy.sh [backend|frontend|all]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Control Bus - Deploy Rápido${NC}"
echo ""

# Pull latest code
echo -e "${YELLOW}📥 Descargando últimos cambios...${NC}"
git pull origin main

TARGET=${1:-auto}

# Auto-detect what changed
if [ "$TARGET" == "auto" ]; then
    # Check what files changed in the last commit
    CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "all")
    
    HAS_BACKEND=false
    HAS_FRONTEND=false
    
    if echo "$CHANGED" | grep -q "^src/\|^prisma/\|^scripts/\|^package"; then
        HAS_BACKEND=true
    fi
    
    if echo "$CHANGED" | grep -q "^frontend/"; then
        HAS_FRONTEND=true
    fi
    
    if [ "$HAS_BACKEND" == true ] && [ "$HAS_FRONTEND" == true ]; then
        TARGET="all"
    elif [ "$HAS_BACKEND" == true ]; then
        TARGET="backend"
    elif [ "$HAS_FRONTEND" == true ]; then
        TARGET="frontend"
    else
        TARGET="all"
    fi
    
    echo -e "${BLUE}🔍 Auto-detectado: cambios en ${TARGET}${NC}"
fi

case $TARGET in
    backend)
        echo -e "${GREEN}⚡ Reiniciando solo backend (sin rebuild ~5 segundos)...${NC}"
        # Backend has volume mounts for src/, so just restart to pick up compiled changes
        # But we need to rebuild if package.json or prisma changed
        docker compose restart backend
        echo -e "${GREEN}✅ Backend reiniciado!${NC}"
        ;;
    
    frontend)
        echo -e "${YELLOW}🔨 Reconstruyendo frontend...${NC}"
        docker compose up -d --build frontend
        echo -e "${GREEN}✅ Frontend actualizado!${NC}"
        ;;
    
    all)
        echo -e "${YELLOW}🔨 Actualizando todo...${NC}"
        # Backend: just restart (volumes handle code sync)
        docker compose restart backend
        # Frontend: needs rebuild
        docker compose up -d --build frontend
        echo -e "${GREEN}✅ Todo actualizado!${NC}"
        ;;
    
    quick)
        # Ultra-fast: just restart everything, no rebuild at all
        echo -e "${GREEN}⚡ Restart rápido de todos los servicios (~5 seg)...${NC}"
        docker compose restart backend
        docker compose restart frontend
        docker compose restart nginx
        echo -e "${GREEN}✅ Todos los servicios reiniciados!${NC}"
        ;;
    
    *)
        echo "Uso: ./deploy.sh [backend|frontend|all|quick|auto]"
        echo ""
        echo "  backend  - Solo reinicia backend (rápido, ~5 seg)"
        echo "  frontend - Reconstruye solo frontend (~2 min)"
        echo "  all      - Backend restart + frontend rebuild"
        echo "  quick    - Restart todo sin rebuild (~5 seg)"
        echo "  auto     - Detecta qué cambió y actúa (default)"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}📊 Estado de los servicios:${NC}"
docker compose ps
echo ""
echo -e "${GREEN}🎉 Deploy completado!${NC}"
