-- Políticas RLS granulares para acesso direto ao Supabase.
--
-- Essas políticas assumem que o JWT encaminhado ao Postgres contém claims como:
-- - app_role: admin | coordenador | policial | departamento | delegacia
-- - user_id: id do auth_user
-- - policial_id: id do api_policial
-- - departamento_id: id do api_departamento
-- - delegacia_id: id do api_delegacia
--
-- Sem esses claims, a baseline anterior continua valendo na prática:
-- apenas service_role acessa as tabelas.

begin;

create or replace function public.egide_jwt_claims()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

create or replace function public.egide_claim_text(claim_name text)
returns text
language sql
stable
as $$
  select nullif(public.egide_jwt_claims() ->> claim_name, '')
$$;

create or replace function public.egide_claim_bigint(claim_name text)
returns bigint
language sql
stable
as $$
  select case
    when public.egide_claim_text(claim_name) ~ '^\d+$' then public.egide_claim_text(claim_name)::bigint
    else null
  end
$$;

create or replace function public.egide_current_app_role()
returns text
language sql
stable
as $$
  select coalesce(
    public.egide_claim_text('app_role'),
    public.egide_claim_text('role_type'),
    public.egide_claim_text('user_role'),
    ''
  )
$$;

create or replace function public.egide_current_user_id()
returns bigint
language sql
stable
as $$
  select coalesce(
    public.egide_claim_bigint('user_id'),
    case
      when public.egide_claim_text('sub') ~ '^\d+$' then public.egide_claim_text('sub')::bigint
      else null
    end
  )
$$;

create or replace function public.egide_current_policial_id()
returns bigint
language sql
stable
as $$
  select public.egide_claim_bigint('policial_id')
$$;

create or replace function public.egide_current_delegacia_id()
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claim_delegacia_id bigint;
  claim_user_id bigint;
  resolved_delegacia_id bigint;
begin
  claim_delegacia_id := public.egide_claim_bigint('delegacia_id');
  if claim_delegacia_id is not null then
    return claim_delegacia_id;
  end if;

  claim_user_id := public.egide_current_user_id();
  if claim_user_id is null then
    return null;
  end if;

  select coalesce(pd.delegacia_id, p.delegacia_id)
    into resolved_delegacia_id
  from public.auth_user u
  left join public.api_perfildelegacia pd on pd.user_id = u.id
  left join public.api_policial p on p.usuario_id = u.id
  where u.id = claim_user_id
  limit 1;

  return resolved_delegacia_id;
end
$$;

create or replace function public.egide_current_departamento_id()
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claim_departamento_id bigint;
  claim_user_id bigint;
  resolved_departamento_id bigint;
begin
  claim_departamento_id := public.egide_claim_bigint('departamento_id');
  if claim_departamento_id is not null then
    return claim_departamento_id;
  end if;

  claim_user_id := public.egide_current_user_id();
  if claim_user_id is null then
    return null;
  end if;

  select coalesce(pd.departamento_id, d.departamento_id)
    into resolved_departamento_id
  from public.auth_user u
  left join public.api_perfildepartamento pd on pd.user_id = u.id
  left join public.api_policial p on p.usuario_id = u.id
  left join public.api_delegacia d on d.id = p.delegacia_id
  where u.id = claim_user_id
  limit 1;

  return resolved_departamento_id;
end
$$;

create or replace function public.egide_is_admin()
returns boolean
language sql
stable
as $$
  select public.egide_current_app_role() = 'admin'
$$;

create or replace function public.egide_is_coordenador()
returns boolean
language sql
stable
as $$
  select public.egide_current_app_role() in ('admin', 'coordenador')
$$;

create or replace function public.egide_same_departamento(target_departamento_id bigint)
returns boolean
language sql
stable
as $$
  select public.egide_is_admin()
    or (
      public.egide_current_departamento_id() is not null
      and public.egide_current_departamento_id() = target_departamento_id
    )
$$;

create or replace function public.egide_same_delegacia(target_delegacia_id bigint)
returns boolean
language sql
stable
as $$
  select public.egide_is_admin()
    or (
      public.egide_current_delegacia_id() is not null
      and public.egide_current_delegacia_id() = target_delegacia_id
    )
$$;

create or replace function public.egide_policial_departamento_id(target_policial_id bigint)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select d.departamento_id
  from public.api_policial p
  left join public.api_delegacia d on d.id = p.delegacia_id
  where p.id = target_policial_id
$$;

create or replace function public.egide_can_access_policial(target_policial_id bigint)
returns boolean
language sql
stable
as $$
  select public.egide_is_admin()
    or public.egide_current_policial_id() = target_policial_id
    or public.egide_same_departamento(public.egide_policial_departamento_id(target_policial_id))
$$;

create or replace function public.egide_can_access_equipe(target_equipe_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.api_equipe e
    join public.api_vaga v on v.id = e.vaga_id
    join public.api_delegacia d on d.id = v.delegacia_id
    where e.id = target_equipe_id
      and (
        public.egide_is_admin()
        or public.egide_same_departamento(d.departamento_id)
        or e.chefe_id = public.egide_current_policial_id()
        or exists (
          select 1
          from public.api_equipe_membros em
          where em.equipe_id = e.id
            and em.policial_id = public.egide_current_policial_id()
        )
      )
  )
$$;

create or replace function public.egide_can_access_operacao_policial(target_operacao_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.api_operacaopolicial op
    where op.id = target_operacao_id
      and (
        public.egide_is_admin()
        or public.egide_same_departamento(op.departamento_solicitante_id)
        or public.egide_same_delegacia(op.delegacia_solicitante_id)
        or public.egide_same_departamento(op.responsavel_custo_id)
        or op.responsavel_operacao_id = public.egide_current_policial_id()
        or exists (
          select 1
          from public.api_operacaopolicial_departamentos_apoio apo
          where apo.operacaopolicial_id = op.id
            and apo.departamento_id = public.egide_current_departamento_id()
        )
      )
  )
$$;

create or replace function public.egide_briefing_liberado(target_operacao_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.api_operacaopolicial op
    where op.id = target_operacao_id
      and (
        public.egide_is_coordenador()
        or op.data_hora_briefing is null
        or op.data_hora_briefing <= now()
      )
  )
$$;

create or replace function public.egide_can_access_departamento_evento(target_departamento_evento_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.api_departamentoevento de
    where de.id = target_departamento_evento_id
      and (
        public.egide_is_admin()
        or public.egide_same_departamento(de.departamento_id)
      )
  )
$$;

create or replace function public.egide_can_access_notificacao(target_notificacao_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.api_notificacaodepartamento nd
    join public.api_perfildepartamento remetente on remetente.id = nd.de_departamento_id
    join public.api_perfildepartamento destinatario on destinatario.id = nd.para_departamento_id
    where nd.id = target_notificacao_id
      and (
        public.egide_is_admin()
        or public.egide_same_departamento(remetente.departamento_id)
        or public.egide_same_departamento(destinatario.departamento_id)
      )
  )
$$;

grant execute on function public.egide_jwt_claims() to authenticated;
grant execute on function public.egide_claim_text(text) to authenticated;
grant execute on function public.egide_claim_bigint(text) to authenticated;
grant execute on function public.egide_current_app_role() to authenticated;
grant execute on function public.egide_current_user_id() to authenticated;
grant execute on function public.egide_current_policial_id() to authenticated;
grant execute on function public.egide_current_delegacia_id() to authenticated;
grant execute on function public.egide_current_departamento_id() to authenticated;
grant execute on function public.egide_is_admin() to authenticated;
grant execute on function public.egide_is_coordenador() to authenticated;
grant execute on function public.egide_same_departamento(bigint) to authenticated;
grant execute on function public.egide_same_delegacia(bigint) to authenticated;
grant execute on function public.egide_policial_departamento_id(bigint) to authenticated;
grant execute on function public.egide_can_access_policial(bigint) to authenticated;
grant execute on function public.egide_can_access_equipe(bigint) to authenticated;
grant execute on function public.egide_can_access_operacao_policial(bigint) to authenticated;
grant execute on function public.egide_briefing_liberado(bigint) to authenticated;
grant execute on function public.egide_can_access_departamento_evento(bigint) to authenticated;
grant execute on function public.egide_can_access_notificacao(bigint) to authenticated;

grant select on table public.api_departamento to authenticated;
grant select on table public.api_delegacia to authenticated;
grant select on table public.api_feriado to authenticated;
grant select on table public.api_viatura to authenticated;
grant select on table public.api_vaga to authenticated;
grant select on table public.api_equipe to authenticated;
grant select on table public.api_equipe_membros to authenticated;
grant select on table public.api_operacao to authenticated;
grant select on table public.api_comboio to authenticated;
grant select on table public.api_comboio_operacoes to authenticated;
grant select on table public.api_policial to authenticated;
grant select on table public.api_pagamento to authenticated;
grant select on table public.api_frequenciapolicial to authenticated;
grant select on table public.api_operacaopolicial to authenticated;
grant select, insert, update, delete on table public.api_operacaopolicial to authenticated;
grant select on table public.api_operacaopolicial_departamentos_apoio to authenticated;
grant select, insert, update, delete on table public.api_operacaopolicial_departamentos_apoio to authenticated;
grant select on table public.api_alvo to authenticated;
grant select, insert, update, delete on table public.api_alvo to authenticated;
grant select on table public.api_equipeoperacao to authenticated;
grant select, insert, update, delete on table public.api_equipeoperacao to authenticated;
grant select on table public.api_equipeoperacao_membros to authenticated;
grant select, insert, update, delete on table public.api_equipeoperacao_membros to authenticated;
grant select on table public.api_substitutooperacao to authenticated;
grant select, insert, update, delete on table public.api_substitutooperacao to authenticated;
grant select on table public.api_resultadooperacao to authenticated;
grant select, insert, update, delete on table public.api_resultadooperacao to authenticated;
grant select on table public.api_aportefinanceiro to authenticated;
grant select, insert, update, delete on table public.api_aportefinanceiro to authenticated;
grant select on table public.api_eventooperacao to authenticated;
grant select, insert, update, delete on table public.api_eventooperacao to authenticated;
grant select on table public.api_departamentoevento to authenticated;
grant select, insert, update, delete on table public.api_departamentoevento to authenticated;
grant select on table public.api_escalapolicial to authenticated;
grant select, insert, update, delete on table public.api_escalapolicial to authenticated;
grant select on table public.api_perfilpolicial to authenticated;
grant select on table public.api_perfildepartamento to authenticated;
grant select on table public.api_perfildelegacia to authenticated;
grant select on table public.api_notificacaodepartamento to authenticated;
grant select, insert, update on table public.api_notificacaodepartamento to authenticated;
grant select on table public.api_sessaousuario to authenticated;
grant select on table public.api_logauditoria to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists authenticated_read_departamentos on public.api_departamento;
create policy authenticated_read_departamentos
on public.api_departamento
for select
to authenticated
using (true);

drop policy if exists authenticated_read_delegacias on public.api_delegacia;
create policy authenticated_read_delegacias
on public.api_delegacia
for select
to authenticated
using (public.egide_same_departamento(departamento_id));

drop policy if exists authenticated_read_feriados on public.api_feriado;
create policy authenticated_read_feriados
on public.api_feriado
for select
to authenticated
using (true);

drop policy if exists authenticated_read_viaturas on public.api_viatura;
create policy authenticated_read_viaturas
on public.api_viatura
for select
to authenticated
using (
  delegacia_id is not null
  and exists (
    select 1 from public.api_delegacia d
    where d.id = delegacia_id
      and public.egide_same_departamento(d.departamento_id)
  )
);

drop policy if exists authenticated_read_vagas on public.api_vaga;
create policy authenticated_read_vagas
on public.api_vaga
for select
to authenticated
using (
  exists (
    select 1 from public.api_delegacia d
    where d.id = delegacia_id
      and public.egide_same_departamento(d.departamento_id)
  )
);

drop policy if exists authenticated_read_equipes on public.api_equipe;
create policy authenticated_read_equipes
on public.api_equipe
for select
to authenticated
using (public.egide_can_access_equipe(id));

drop policy if exists authenticated_read_equipe_membros on public.api_equipe_membros;
create policy authenticated_read_equipe_membros
on public.api_equipe_membros
for select
to authenticated
using (public.egide_can_access_equipe(equipe_id));

drop policy if exists authenticated_read_operacoes on public.api_operacao;
create policy authenticated_read_operacoes
on public.api_operacao
for select
to authenticated
using (
  equipe_id is not null
  and public.egide_can_access_equipe(equipe_id)
);

drop policy if exists authenticated_read_comboios on public.api_comboio;
create policy authenticated_read_comboios
on public.api_comboio
for select
to authenticated
using (
  public.egide_is_admin()
  or dpc_id = public.egide_current_policial_id()
  or oip_id = public.egide_current_policial_id()
  or exists (
    select 1
    from public.api_comboio_operacoes co
    join public.api_operacao o on o.id = co.operacao_id
    where co.comboio_id = public.api_comboio.id
      and o.equipe_id is not null
      and public.egide_can_access_equipe(o.equipe_id)
  )
);

drop policy if exists authenticated_read_comboio_operacoes on public.api_comboio_operacoes;
create policy authenticated_read_comboio_operacoes
on public.api_comboio_operacoes
for select
to authenticated
using (
  exists (
    select 1
    from public.api_operacao o
    where o.id = operacao_id
      and o.equipe_id is not null
      and public.egide_can_access_equipe(o.equipe_id)
  )
);

drop policy if exists authenticated_read_policiais on public.api_policial;
create policy authenticated_read_policiais
on public.api_policial
for select
to authenticated
using (public.egide_can_access_policial(id));

drop policy if exists authenticated_read_pagamentos on public.api_pagamento;
create policy authenticated_read_pagamentos
on public.api_pagamento
for select
to authenticated
using (public.egide_can_access_policial(policial_id));

drop policy if exists authenticated_read_frequencias on public.api_frequenciapolicial;
create policy authenticated_read_frequencias
on public.api_frequenciapolicial
for select
to authenticated
using (
  public.egide_can_access_policial(policial_id)
  or public.egide_can_access_equipe(equipe_id)
);

drop policy if exists authenticated_read_operacoes_policiais on public.api_operacaopolicial;
create policy authenticated_read_operacoes_policiais
on public.api_operacaopolicial
for select
to authenticated
using (public.egide_can_access_operacao_policial(id));

drop policy if exists authenticated_write_operacoes_policiais on public.api_operacaopolicial;
create policy authenticated_write_operacoes_policiais
on public.api_operacaopolicial
for all
to authenticated
using (
  public.egide_is_coordenador()
  and public.egide_can_access_operacao_policial(id)
)
with check (
  public.egide_is_coordenador()
  and (
    public.egide_same_departamento(departamento_solicitante_id)
    or public.egide_same_delegacia(delegacia_solicitante_id)
  )
);

drop policy if exists authenticated_read_operacoes_policiais_apoio on public.api_operacaopolicial_departamentos_apoio;
create policy authenticated_read_operacoes_policiais_apoio
on public.api_operacaopolicial_departamentos_apoio
for select
to authenticated
using (
  public.egide_can_access_operacao_policial(operacaopolicial_id)
  or public.egide_same_departamento(departamento_id)
);

drop policy if exists authenticated_write_operacoes_policiais_apoio on public.api_operacaopolicial_departamentos_apoio;
create policy authenticated_write_operacoes_policiais_apoio
on public.api_operacaopolicial_departamentos_apoio
for all
to authenticated
using (public.egide_is_coordenador())
with check (public.egide_is_coordenador());

drop policy if exists authenticated_read_alvos on public.api_alvo;
create policy authenticated_read_alvos
on public.api_alvo
for select
to authenticated
using (
  public.egide_can_access_operacao_policial(operacao_id)
  and (
    not visivel_apos_briefing
    or public.egide_briefing_liberado(operacao_id)
  )
);

drop policy if exists authenticated_write_alvos on public.api_alvo;
create policy authenticated_write_alvos
on public.api_alvo
for all
to authenticated
using (
  public.egide_is_coordenador()
  and public.egide_can_access_operacao_policial(operacao_id)
)
with check (
  public.egide_is_coordenador()
  and public.egide_can_access_operacao_policial(operacao_id)
);

drop policy if exists authenticated_read_equipes_operacao on public.api_equipeoperacao;
create policy authenticated_read_equipes_operacao
on public.api_equipeoperacao
for select
to authenticated
using (
  public.egide_can_access_operacao_policial(operacao_id)
  or public.egide_same_departamento(departamento_id)
  or chefe_id = public.egide_current_policial_id()
);

drop policy if exists authenticated_write_equipes_operacao on public.api_equipeoperacao;
create policy authenticated_write_equipes_operacao
on public.api_equipeoperacao
for all
to authenticated
using (
  public.egide_is_coordenador()
  and public.egide_can_access_operacao_policial(operacao_id)
)
with check (
  public.egide_is_coordenador()
  and public.egide_can_access_operacao_policial(operacao_id)
);

drop policy if exists authenticated_read_equipes_operacao_membros on public.api_equipeoperacao_membros;
create policy authenticated_read_equipes_operacao_membros
on public.api_equipeoperacao_membros
for select
to authenticated
using (
  exists (
    select 1
    from public.api_equipeoperacao eo
    where eo.id = equipeoperacao_id
      and (
        public.egide_can_access_operacao_policial(eo.operacao_id)
        or public.egide_same_departamento(eo.departamento_id)
      )
  )
);

drop policy if exists authenticated_write_equipes_operacao_membros on public.api_equipeoperacao_membros;
create policy authenticated_write_equipes_operacao_membros
on public.api_equipeoperacao_membros
for all
to authenticated
using (public.egide_is_coordenador())
with check (public.egide_is_coordenador());

drop policy if exists authenticated_read_substitutos_operacao on public.api_substitutooperacao;
create policy authenticated_read_substitutos_operacao
on public.api_substitutooperacao
for select
to authenticated
using (
  exists (
    select 1
    from public.api_equipeoperacao eo
    where eo.id = equipe_id
      and public.egide_can_access_operacao_policial(eo.operacao_id)
  )
);

drop policy if exists authenticated_write_substitutos_operacao on public.api_substitutooperacao;
create policy authenticated_write_substitutos_operacao
on public.api_substitutooperacao
for all
to authenticated
using (
  exists (
    select 1
    from public.api_equipeoperacao eo
    where eo.id = equipe_id
      and public.egide_is_coordenador()
      and public.egide_can_access_operacao_policial(eo.operacao_id)
  )
)
with check (
  exists (
    select 1
    from public.api_equipeoperacao eo
    where eo.id = equipe_id
      and public.egide_is_coordenador()
      and public.egide_can_access_operacao_policial(eo.operacao_id)
  )
);

drop policy if exists authenticated_read_resultados_operacao on public.api_resultadooperacao;
create policy authenticated_read_resultados_operacao
on public.api_resultadooperacao
for select
to authenticated
using (public.egide_can_access_operacao_policial(operacao_id));

drop policy if exists authenticated_write_resultados_operacao on public.api_resultadooperacao;
create policy authenticated_write_resultados_operacao
on public.api_resultadooperacao
for all
to authenticated
using (public.egide_can_access_operacao_policial(operacao_id))
with check (public.egide_can_access_operacao_policial(operacao_id));

drop policy if exists authenticated_read_aportes on public.api_aportefinanceiro;
create policy authenticated_read_aportes
on public.api_aportefinanceiro
for select
to authenticated
using (public.egide_can_access_operacao_policial(operacao_id));

drop policy if exists authenticated_write_aportes on public.api_aportefinanceiro;
create policy authenticated_write_aportes
on public.api_aportefinanceiro
for all
to authenticated
using (public.egide_is_coordenador() and public.egide_can_access_operacao_policial(operacao_id))
with check (public.egide_is_coordenador() and public.egide_can_access_operacao_policial(operacao_id));

drop policy if exists authenticated_read_eventos on public.api_eventooperacao;
create policy authenticated_read_eventos
on public.api_eventooperacao
for select
to authenticated
using (
  public.egide_is_admin()
  or exists (
    select 1
    from public.api_departamentoevento de
    where de.evento_id = public.api_eventooperacao.id
      and public.egide_same_departamento(de.departamento_id)
  )
);

drop policy if exists authenticated_write_eventos on public.api_eventooperacao;
create policy authenticated_write_eventos
on public.api_eventooperacao
for all
to authenticated
using (public.egide_is_coordenador())
with check (public.egide_is_coordenador());

drop policy if exists authenticated_read_departamentos_evento on public.api_departamentoevento;
create policy authenticated_read_departamentos_evento
on public.api_departamentoevento
for select
to authenticated
using (public.egide_can_access_departamento_evento(id));

drop policy if exists authenticated_write_departamentos_evento on public.api_departamentoevento;
create policy authenticated_write_departamentos_evento
on public.api_departamentoevento
for all
to authenticated
using (public.egide_is_coordenador() and public.egide_can_access_departamento_evento(id))
with check (public.egide_is_coordenador() and public.egide_same_departamento(departamento_id));

drop policy if exists authenticated_read_escalas on public.api_escalapolicial;
create policy authenticated_read_escalas
on public.api_escalapolicial
for select
to authenticated
using (
  public.egide_can_access_departamento_evento(departamento_evento_id)
  or (
    policial_id is not null
    and public.egide_can_access_policial(policial_id)
  )
);

drop policy if exists authenticated_write_escalas on public.api_escalapolicial;
create policy authenticated_write_escalas
on public.api_escalapolicial
for all
to authenticated
using (public.egide_is_coordenador() and public.egide_can_access_departamento_evento(departamento_evento_id))
with check (public.egide_is_coordenador() and public.egide_can_access_departamento_evento(departamento_evento_id));

drop policy if exists authenticated_read_perfis_policiais on public.api_perfilpolicial;
create policy authenticated_read_perfis_policiais
on public.api_perfilpolicial
for select
to authenticated
using (
  public.egide_is_admin()
  or policial_id = public.egide_current_policial_id()
  or public.egide_can_access_policial(policial_id)
);

drop policy if exists authenticated_read_perfis_departamento on public.api_perfildepartamento;
create policy authenticated_read_perfis_departamento
on public.api_perfildepartamento
for select
to authenticated
using (
  public.egide_is_admin()
  or user_id = public.egide_current_user_id()
  or public.egide_same_departamento(departamento_id)
);

drop policy if exists authenticated_read_perfis_delegacia on public.api_perfildelegacia;
create policy authenticated_read_perfis_delegacia
on public.api_perfildelegacia
for select
to authenticated
using (
  public.egide_is_admin()
  or user_id = public.egide_current_user_id()
  or public.egide_same_delegacia(delegacia_id)
  or exists (
    select 1
    from public.api_delegacia d
    where d.id = delegacia_id
      and public.egide_same_departamento(d.departamento_id)
  )
);

drop policy if exists authenticated_read_notificacoes on public.api_notificacaodepartamento;
create policy authenticated_read_notificacoes
on public.api_notificacaodepartamento
for select
to authenticated
using (public.egide_can_access_notificacao(id));

drop policy if exists authenticated_write_notificacoes on public.api_notificacaodepartamento;
create policy authenticated_write_notificacoes
on public.api_notificacaodepartamento
for all
to authenticated
using (
  public.egide_is_admin()
  or public.egide_can_access_notificacao(id)
)
with check (
  public.egide_is_admin()
  or exists (
    select 1
    from public.api_perfildepartamento remetente
    join public.api_perfildepartamento destinatario on destinatario.id = para_departamento_id
    where remetente.id = de_departamento_id
      and (
        public.egide_same_departamento(remetente.departamento_id)
        or public.egide_same_departamento(destinatario.departamento_id)
      )
  )
);

drop policy if exists authenticated_read_sessoes on public.api_sessaousuario;
create policy authenticated_read_sessoes
on public.api_sessaousuario
for select
to authenticated
using (
  public.egide_is_admin()
  or usuario_id = public.egide_current_user_id()
  or policial_id = public.egide_current_policial_id()
);

drop policy if exists authenticated_read_logs on public.api_logauditoria;
create policy authenticated_read_logs
on public.api_logauditoria
for select
to authenticated
using (
  public.egide_is_admin()
  or usuario_id = public.egide_current_user_id()
  or policial_id = public.egide_current_policial_id()
);

commit;