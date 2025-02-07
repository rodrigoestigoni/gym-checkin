# Etapa 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . ./
RUN npm run build

# Etapa 2: Servidor Nginx para arquivos estáticos
FROM nginx:alpine
# Copia o arquivo de configuração (que você montará via volume no docker-compose)
# Se preferir, você pode copiar um arquivo padrão aqui e sobrescrever via volume em produção.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
