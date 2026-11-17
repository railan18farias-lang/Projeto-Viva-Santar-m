-- Mantém o registro no banco, mas tira a entrada duplicada da listagem pública de praias.
update public.destinations
set is_published = false
where name = 'Ponta do Maguari' and category = 'praias';
