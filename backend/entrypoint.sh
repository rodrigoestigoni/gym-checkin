#!/bin/sh
set -e

# Executa as migrações
python -m alembic upgrade head

# Inicia o uvicorn
exec uvicorn main:app --host 0.0.0.0 --port 8443 --ssl-keyfile /etc/letsencrypt/live/ultimoingresso.com.br/privkey.pem --ssl-certfile /etc/letsencrypt/live/ultimoingresso.com.br/fullchain.pem --root-path /api
