-- Reforco de RLS: garante que RLS esteja habilitado em todas as tabelas do app.
-- Necessario quando algum deploy/reload recria tabelas sem manter relrowsecurity=true.

begin;

do $$
declare
    target_table text;
begin
    for target_table in
        select tablename
        from pg_tables
        where schemaname = 'public'
          and (
              left(tablename, 4) = 'api_'
              or left(tablename, 5) = 'auth_'
              or left(tablename, 7) = 'django_'
          )
    loop
        execute format('alter table public.%I enable row level security', target_table);
    end loop;
end
$$;

commit;
