-- Proteção no nível do banco contra agendamentos concorrentes:
-- dois registros SCHEDULED do mesmo médico não podem ter intervalos
-- de tempo sobrepostos. Mesmo que duas transações passem pela checagem
-- da aplicação ao mesmo tempo, o segundo INSERT falha com 23P01
-- (exclusion_violation), que a API converte em HTTP 409.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments"
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    "doctorId" WITH =,
    tsrange("startsAt", "endsAt") WITH &&
  )
  WHERE (status = 'SCHEDULED');
