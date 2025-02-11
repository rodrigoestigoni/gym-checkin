FROM python:3.10-slim

WORKDIR /app

# Instala dependências do sistema (gcc para compilar pacotes se necessário)
RUN apt-get update && apt-get install -y gcc

# Copia os arquivos de requirements e instala as dependências
COPY requirements.txt ./requirements.txt
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copia todo o código da aplicação
COPY app/ ./ 

EXPOSE 8443

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8443", "--ssl-keyfile", "/etc/letsencrypt/live/ultimoingresso.com.br/privkey.pem", "--ssl-certfile", "/etc/letsencrypt/live/ultimoingresso.com.br/fullchain.pem", "--root-path", "/api"]
