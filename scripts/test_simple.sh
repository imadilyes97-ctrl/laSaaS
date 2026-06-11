#!/bin/bash

# Script de Test Simplifié pour les Améliorations du Dashboard
# Ce script vérifie les fichiers et la structure sans dépendances externes

echo "🧪 Démarrage des tests simplifiés des améliorations du dashboard..."
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

# Fonction pour exécuter un test
test() {
    local name="$1"
    local condition="$2"

    if [ $condition -eq 0 ]; then
        echo -e "${GREEN}✅${NC} ${name}"
        ((passed++))
    else
        echo -e "${RED}❌${NC} ${name}"
        ((failed++))
    fi
}

# Fonction pour vérifier si un fichier contient un texte
grep_test() {
    local file="$1"
    local pattern="$2"

    if grep -q "$pattern" "$file" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

echo "📁 Vérification des fichiers..."

# Test 1: Vérifier que le fichier dashboard existe
test "Fichier dashboard existe" $([ -f "src/app/(dashboard)/dashboard/page.tsx" ] || echo 1)

# Test 2: Vérifier que le fichier sidebar existe
test "Fichier sidebar existe" $([ -f "src/components/sidebar.tsx" ] || echo 1)

echo ""
echo "🔍 Vérification des améliorations du dashboard..."

# Test 3: Vérifier les imports des composants ShadCN
test "Import Table" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "from \"@/components/ui/table\"")
test "Import Select" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "from \"@/components/ui/select\"")
test "Import DropdownMenu" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "from \"@/components/ui/dropdown-menu\"")
test "Import Tooltip" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "from \"@/components/ui/tooltip\"")
test "Import Avatar" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "from \"@/components/ui/avatar\"")
test "Import motion" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "from \"motion\"")

# Test 4: Vérifier les filtres
test "Filtre par période" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "dateRange")
test "Filtre par statut" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "statutFilter")
test "Recherche texte" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "searchTerm")

# Test 5: Vérifier le tableau interactif
test "Tableau avec Table component" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "<Table>")
test "Sélecteur de statut" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "updateOrderStatus")
test "Menu dropdown" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "<DropdownMenu>")
test "Tooltips" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "<Tooltip>")

# Test 6: Vérifier les animations
test "Animations motion.div" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "motion.div")
test "AnimatePresence" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "AnimatePresence")
test "Transitions" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "transition=")

# Test 7: Vérifier les actions rapides
test "Actions rapides" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "Actions rapides")
test "Bouton Ajouter produit" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "Ajouter produit")
test "Bouton Exporter" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "Exporter données")

# Test 8: Vérifier les cartes d'insights
test "Carte Taux d'annulation" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "Taux d'annulation")
test "Carte Panier moyen" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "Panier moyen")

echo ""
echo "👤 Vérification des améliorations du sidebar..."

# Test 9: Vérifier le profil utilisateur
test "État userProfile" $(grep_test "src/components/sidebar.tsx" "userProfile")
test "Avatar utilisateur" $(grep_test "src/components/sidebar.tsx" "<Avatar")
test "Nom de la boutique" $(grep_test "src/components/sidebar.tsx" "boutique_name")

# Test 10: Vérifier l'indicateur de commandes
test "Compteur de commandes" $(grep_test "src/components/sidebar.tsx" "newOrdersCount")
test "Indicateur commandes en attente" $(grep_test "src/components/sidebar.tsx" "commande.*en attente")

echo ""
echo "📊 Vérification des fonctions supplémentaires..."

# Test 11: Vérifier les fonctions utilitaires
test "Fonction exportData" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "exportData")
test "Fonction printOrder" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "printOrder")
test "Fonction updateOrderStatus" $(grep_test "src/app/(dashboard)/dashboard/page.tsx" "updateOrderStatus")

echo ""
echo "${YELLOW}💡 Vérifications supplémentaires (manuelles recommandées):${NC}"
echo "   • Tester les filtres dans l'interface utilisateur"
echo "   • Vérifier que les animations sont fluides"
echo "   • Tester l'export CSV"
echo "   • Vérifier l'impression des commandes"
echo "   • Tester le changement de statut"
echo ""

echo "=" ${#}50"
echo "📊 Résultats des tests:"
echo "   ${GREEN}✅ Réussis: $passed${NC}"
echo "   ${RED}❌ Échoués: $failed${NC}"
echo "=" ${#}50"

if [ $failed -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Tous les tests ont passé avec succès !${NC}"
    echo "Votre dashboard est prêt pour la production."
    echo -e "\n${YELLOW}Prochaines étapes recommandées:${NC}"
    echo "1. Tester manuellement dans le navigateur"
    echo "2. Vérifier la compatibilité mobile"
    echo "3. Déployer en production"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Certains tests ont échoué.${NC}"
    echo "Veuillez vérifier les échecs ci-dessus."
    echo -e "\n${YELLOW}Solutions possibles:${NC}"
    echo "• Vérifiez que tous les fichiers sont bien enregistrés"
    echo "• Assurez-vous que les imports sont corrects"
    echo "• Relancez les tests après les corrections"
    exit 1
fi
