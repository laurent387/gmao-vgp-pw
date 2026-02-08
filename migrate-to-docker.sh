#!/bin/bash
set -e

echo "🔄 Migration vers Docker - In-Spectra"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Ne pas exécuter ce script en root${NC}"
   exit 1
fi

echo -e "${YELLOW}📋 Étape 1: Sauvegarde de la base de données PostgreSQL${NC}"
BACKUP_DIR="./backups/migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Création du backup dans $BACKUP_DIR..."
sudo -u postgres pg_dump in_spectra > "$BACKUP_DIR/in_spectra.sql"
echo -e "${GREEN}✅ Backup créé${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 2: Arrêt des services systemd${NC}"
echo "Arrêt de in-spectra-api..."
sudo systemctl stop in-spectra-api || true

echo "Arrêt de in-spectra-trpc..."
sudo systemctl stop in-spectra-trpc || true

echo -e "${GREEN}✅ Services arrêtés${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 3: Désactivation des services systemd${NC}"
sudo systemctl disable in-spectra-api || true
sudo systemctl disable in-spectra-trpc || true
echo -e "${GREEN}✅ Services désactivés${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 4: Construction des images Docker${NC}"
docker-compose build
echo -e "${GREEN}✅ Images construites${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 5: Démarrage des containers${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Containers démarrés${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 6: Attente de la base de données${NC}"
sleep 10
echo -e "${GREEN}✅ PostgreSQL ready${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 7: Restauration de la base de données${NC}"
echo "Restauration du backup..."
docker exec -i in-spectra-db psql -U api_user -d in_spectra < "$BACKUP_DIR/in_spectra.sql"
echo -e "${GREEN}✅ Base de données restaurée${NC}"
echo ""

echo -e "${YELLOW}📋 Étape 8: Vérification des services${NC}"
docker-compose ps
echo ""

echo -e "${YELLOW}📋 Étape 9: Test des APIs${NC}"
echo "Test API Fastify (port 4000)..."
curl -s http://localhost:4000/health && echo -e "${GREEN}✅ API OK${NC}" || echo -e "${RED}❌ API KO${NC}"

echo "Test TRPC (port 3000)..."
curl -s http://localhost:3000/health && echo -e "${GREEN}✅ TRPC OK${NC}" || echo -e "${RED}❌ TRPC KO${NC}"
echo ""

echo -e "${GREEN}🎉 Migration terminée !${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifier les logs: docker-compose logs -f"
echo "  2. Tester l'application web: https://api.in-spectra.com"
echo "  3. Si tout fonctionne, désactiver le Nginx systemd:"
echo "     sudo systemctl stop nginx"
echo "     sudo systemctl disable nginx"
echo ""
echo "📦 Backup disponible dans: $BACKUP_DIR"
echo ""
echo "🔄 Commandes utiles:"
echo "  - Voir les logs: docker-compose logs -f"
echo "  - Redémarrer: docker-compose restart"
echo "  - Arrêter: docker-compose down"
echo "  - Restaurer systemd: sudo systemctl start in-spectra-api in-spectra-trpc"
