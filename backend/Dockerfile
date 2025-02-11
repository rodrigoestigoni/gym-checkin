# backend/Dockerfile

FROM python:3.10-slim
WORKDIR /app

# Instala dependências do sistema e Python
RUN apt-get update && apt-get install -y gcc

# Copia os requirements e instala as dependências
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copia todo o código da aplicação, incluindo a pasta alembic e o alembic.ini
COPY . .

EXPOSE 8443

CMD ["/entrypoint.sh"]

