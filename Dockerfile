# --- Estágio 1: Build ---
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de manifesto do pacote
COPY package.json package-lock.json ./

# Instala dependências de produção
RUN npm install --omit=dev

# Copia o restante do código-fonte
COPY . .

# Compila o TypeScript
RUN npm run build

# --- Estágio 2: Produção ---
FROM node:20-alpine AS production

WORKDIR /app

# Copia os arquivos de manifesto do pacote
COPY package.json package-lock.json ./

# Instala apenas as dependências de produção
RUN npm install --omit=dev

# Copia os artefatos construídos do estágio 'builder'
COPY --from=builder /app/dist ./dist

# Expõe a porta que a aplicação vai rodar
# (Lembre-se de usar a variável PORT do .env)
EXPOSE 3333

# Comando para iniciar a aplicação
CMD ["node", "dist/server.js"]