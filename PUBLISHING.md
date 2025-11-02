# Guide de Publication sur NPM

Ce guide explique comment publier `@medusa-payment/paystack-civ` sur NPM pour le rendre disponible à la communauté.

## 📋 Prérequis

1. Un compte NPM (créez-en un sur [npmjs.com](https://www.npmjs.com/))
2. Les droits de publication sur l'organisation `@medusa-payment` OU publiez sous votre propre scope

## 🚀 Étapes de publication

### Option 1 : Publier sous votre propre scope

Si vous n'avez pas accès à `@medusa-payment`, modifiez le `package.json` :

```json
{
  "name": "@votre-username/paystack-civ",
  // ...
}
```

### Option 2 : Publier sous @medusa-payment

Pour publier sous `@medusa-payment`, vous devez :
1. Créer une organisation NPM `medusa-payment`
2. Être membre avec les droits de publication

### Étapes de publication

1. **Connectez-vous à NPM**
   ```bash
   npm login
   ```

2. **Vérifiez que vous êtes bien connecté**
   ```bash
   npm whoami
   ```

3. **Build le projet**
   ```bash
   npm run build
   ```

4. **Testez localement (optionnel mais recommandé)**
   ```bash
   npm pack
   # Cela crée un fichier .tgz que vous pouvez tester
   ```

5. **Vérifiez que le package est prêt**
   - Vérifiez que le `dist/` contient tous les fichiers compilés
   - Vérifiez que le `package.json` est correct
   - Vérifiez la version dans `package.json`

6. **Publiez sur NPM**
   ```bash
   npm publish --access public
   ```
   
   Si vous publiez un scoped package (`@medusa-payment/...`), vous devez utiliser `--access public` la première fois.

7. **Vérifiez la publication**
   - Allez sur https://www.npmjs.com/package/@medusa-payment/paystack-civ
   - Vérifiez que le package est bien publié

## 📝 Gestion des versions

Utilisez [Semantic Versioning](https://semver.org/) :

- **MAJOR** (1.0.0 → 2.0.0) : Changements incompatibles
- **MINOR** (1.0.0 → 1.1.0) : Nouvelles fonctionnalités rétro-compatibles
- **PATCH** (1.0.0 → 1.0.1) : Corrections de bugs

Pour publier une nouvelle version :

```bash
# Modifiez manuellement la version dans package.json
# OU utilisez npm version
npm version patch  # pour 1.0.0 → 1.0.1
npm version minor  # pour 1.0.0 → 1.1.0
npm version major  # pour 1.0.0 → 2.0.0

# Puis publiez
npm publish --access public
```

## 🔄 Publication automatique avec GitHub Actions

Le fichier `.github/workflows/publish.yml` est configuré pour publier automatiquement lors de la création d'une release GitHub.

Pour utiliser cette méthode :

1. **Créez un token NPM**
   - Allez sur https://www.npmjs.com/settings/VOTRE-USERNAME/tokens
   - Créez un "Automation" token
   - Copiez le token

2. **Ajoutez le token comme secret GitHub**
   - Allez dans Settings → Secrets and variables → Actions
   - Ajoutez un secret nommé `NPM_TOKEN` avec la valeur du token

3. **Créez une release GitHub**
   - Allez dans Releases → Draft a new release
   - Choisissez une version (ex: v1.0.0)
   - Le workflow publiera automatiquement sur NPM

## ✅ Checklist avant publication

- [ ] Code testé et fonctionnel
- [ ] Build réussi sans erreurs
- [ ] README.md à jour
- [ ] Version correcte dans package.json
- [ ] LICENSE présent
- [ ] Fichiers `.npmignore` ou `package.json` files configurés correctement
- [ ] Pas de fichiers sensibles (clés API, etc.) dans le package

## 📚 Ressources

- [Documentation NPM sur la publication](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [NPM scoped packages](https://docs.npmjs.com/about-scoped-packages)

---

Bon courage avec votre publication ! 🚀
