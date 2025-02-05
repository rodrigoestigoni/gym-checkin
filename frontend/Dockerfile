# Etapa 1: Build
FROM node:18-alpine as build

WORKDIR /app

COPY package.json package-lock.json* ./
# Força a instalação de todas as dependências
RUN npm ci --include=dev

COPY . ./
RUN npm run build

# Etapa 2: Servidor Nginx para arquivos estáticos
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
