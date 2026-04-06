-- Baseline de segurança para uso do Supabase como banco do backend Django.
--
-- Este projeto autentica usuários no Django, não no Supabase Auth.
-- Por isso, a política abaixo protege o acesso direto via APIs do Supabase
-- (roles anon/authenticated) e mantém acesso total apenas para service_role.
--
-- Observação importante:
-- A conexão direta do backend usando a role postgres/service_role continua
-- privilegiada. Para RLS por usuário, seria necessário integrar Supabase Auth
-- ou propagar claims JWT customizadas até o Postgres.

begin;

do $$
declare
	target_table text;
	protected_tables text[] := array[
		'api_alvo',
		'api_aportefinanceiro',
		'api_comboio',
		'api_comboio_operacoes',
		'api_delegacia',
		'api_departamento',
		'api_departamentoevento',
		'api_equipe',
		'api_equipe_membros',
		'api_equipeoperacao',
		'api_equipeoperacao_membros',
		'api_escalapolicial',
		'api_eventooperacao',
		'api_feriado',
		'api_frequenciapolicial',
		'api_logauditoria',
		'api_notificacaodepartamento',
		'api_operacao',
		'api_operacaopolicial',
		'api_operacaopolicial_departamentos_apoio',
		'api_pagamento',
		'api_perfildepartamento',
		'api_perfildelegacia',
		'api_perfilpolicial',
		'api_policial',
		'api_resultadooperacao',
		'api_sessaousuario',
		'api_substitutooperacao',
		'api_vaga',
		'api_viatura',
		'auth_group',
		'auth_group_permissions',
		'auth_permission',
		'auth_user',
		'auth_user_groups',
		'auth_user_user_permissions',
		'django_admin_log',
		'django_content_type',
		'django_session'
	];
begin
	foreach target_table in array protected_tables loop
		execute format('alter table if exists public.%I enable row level security', target_table);

		execute format('revoke all on table public.%I from anon', target_table);
		execute format('revoke all on table public.%I from authenticated', target_table);
		execute format('grant all on table public.%I to service_role', target_table);

		execute format('drop policy if exists %I on public.%I', 'sr_all_' || target_table, target_table);
		execute format(
			'create policy %I on public.%I as permissive for all to service_role using (true) with check (true)',
			'sr_all_' || target_table,
			target_table
		);
	end loop;
end
$$;

do $$
declare
	target_sequence text;
begin
	for target_sequence in
		select format('%I.%I', sequence_schema, sequence_name)
		from information_schema.sequences
		where sequence_schema = 'public'
	loop
		execute format('revoke all on sequence %s from anon', target_sequence);
		execute format('revoke all on sequence %s from authenticated', target_sequence);
		execute format('grant usage, select on sequence %s to service_role', target_sequence);
	end loop;
end
$$;

commit;
