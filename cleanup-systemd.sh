#!/bin/bash
set -e

echo "🧹 Nettoyage des services systemd In-Spectra"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  ATTENTION: Ce script va supprimer les services systemd${NC}"
echo -e "${YELLOW}   Assurez-vous que Docker fonctionne correctement !${NC}"
echo ""
read -p "Continuer ? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Annulé."
    exit 1
fi
echo ""

echo -e "${YELLOW}📋 Étape 1: Arrêt des services systemd${NC}"
sudo systemctl stop in-spectra-api || true
sudo systemctl stop in-spectra-trpc || true
echo -e "${GREEN}✅ Services arrêtés${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 2: Désactivation des services${NC}"
sudo systemctl disable in-spectra-api || true
sudo systemctl disable in-spectra-trpc || true
echo -e "${GREEN}✅ Services désactivés${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 3: Suppression des fichiers service${NC}"
sudo rm -f /etc/systemd/system/in-spectra-api.service
sudo rm -f /etc/systemd/system/in-spectra-trpc.service
echo -e "${GREEN}✅ Fichiers supprimés${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 4: Rechargement de systemd${NC}"
sudo systemctl daemon-reload
echo -e "${GREEN}✅ Systemd rechargé${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 5: Arrêt de PostgreSQL systemd (optionnel)${NC}"
read -p "Arrêter PostgreSQL systemd ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo systemctl stop postgresql@16-main
    sudo systemctl disable postgresql@16-main
    echo -e "${GREEN}✅ PostgreSQL arrêté${NC}"
else
    echo "PostgreSQL systemd conservé (peut coexister avec Docker)"
fi
echo ""

echo -e "${YELLOW}📋 Étape 6: Arrêt de Nginx systemd (optionnel)${NC}"
read -p "Arrêter Nginx systemd ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo systemctl stop nginx
    sudo systemctl disable nginx
    echo -e "${GREEN}✅ Nginx arrêté${NC}"
    echo -e "${YELLOW}⚠️  Le Nginx Docker doit être utilisé maintenant${NC}"
else
    echo "Nginx systemd conservé"
fi
echo ""

echo -e "${GREEN}🎉 Nettoyage terminé !${NC}"
echo ""
echo "📝 Vérification:"
echo "  - Services systemd supprimés: in-spectra-api, in-spectra-trpc"
echo "  - Services Docker actifs:"
docker-compose ps
echo ""
echo "🔄 Pour restaurer les services systemd:"
echo "  sudo systemctl enable --now in-spectra-api"
echo "  sudo systemctl enable --now in-spectra-trpc"
