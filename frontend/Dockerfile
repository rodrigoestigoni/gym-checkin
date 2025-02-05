# Etapa 1: Build
FROM node:18-alpine as build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . ./
RUN npm run build

# Etapa 2: Servidor Nginx para arquivos estáticos
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
# Copia um arquivo de configuração customizado do Nginx, se necessário (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
