# Utiliser une image Node.js officielle comme image de base
# Utiliser une version Alpine pour une image plus légère
FROM node:20-alpine AS builder

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le package.json et package-lock.json
# Cela permet à Docker de mettre en cache les dépendances
COPY package*.json ./

# Installer les dépendances du projet
# Utiliser --frozen-lockfile pour des builds reproductibles
RUN npm install --frozen-lockfile

# Copier le reste du code de l'application
COPY . .

# Construire l'application Next.js pour la production
# Ceci génère le répertoire .next
RUN npm run build

# Étape 2 : Image de production
FROM node:20-alpine AS runner

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les artefacts construits depuis l'étape builder
# Ceci inclut la sortie .next, les assets publics, et la configuration nécessaire
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

# Copier les node_modules depuis l'étape builder pour éviter de réinstaller les dépendances de production
# C'est généralement plus rapide que d'exécuter `npm install --production`
COPY --from=builder /app/node_modules ./node_modules

# Exposer le port sur lequel l'application s'exécute (par défaut 3000 pour Next.js)
EXPOSE 3000

# Définir la commande pour lancer l'application
# Ceci suppose que 'npm start' dans package.json exécute 'next start'
CMD ["npm", "start"]