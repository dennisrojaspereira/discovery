#!/bin/sh
# Cria bancos/usuários adicionais na primeira inicialização do Postgres.
# - mattermost: banco dedicado ao Mattermost
# - medagenda_shadow: shadow database do Prisma Migrate
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER mmuser WITH PASSWORD 'mmuser_local_dev_only';
  CREATE DATABASE mattermost OWNER mmuser;
  GRANT ALL PRIVILEGES ON DATABASE mattermost TO mmuser;
  CREATE DATABASE medagenda_shadow OWNER $POSTGRES_USER;
  CREATE DATABASE medagenda_test OWNER $POSTGRES_USER;
EOSQL
