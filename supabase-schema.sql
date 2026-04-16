-- =============================================
-- FINANCAS DANIEL & PRISCILA / AG SECURITY
-- Cole este SQL no SQL Editor do Supabase
-- =============================================

-- Receitas
create table if not exists receitas (
  id uuid default gen_random_uuid() primary key,
  mes int not null,
  ano int not null,
  data date,
  descricao text not null,
  categoria text not null default 'Faturamento',
  valor numeric(12,2) not null default 0,
  recebido boolean default false,
  observacao text,
  tipo text default 'pessoal', -- 'empresa' | 'pessoal'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Despesas empresa
create table if not exists despesas_empresa (
  id uuid default gen_random_uuid() primary key,
  mes int not null,
  ano int not null,
  vencimento date,
  descricao text not null,
  categoria text not null default 'Outros',
  valor numeric(12,2) not null default 0,
  pago boolean default false,
  pago_em date,
  observacao text,
  transportado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Despesas pessoal
create table if not exists despesas_pessoal (
  id uuid default gen_random_uuid() primary key,
  mes int not null,
  ano int not null,
  vencimento date,
  descricao text not null,
  categoria text not null default 'Outros',
  valor numeric(12,2) not null default 0,
  pago boolean default false,
  pago_em date,
  cartao text,
  observacao text,
  transportado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pendencias (meses anteriores)
create table if not exists pendencias (
  id uuid default gen_random_uuid() primary key,
  mes int not null,
  ano int not null,
  vencimento date,
  descricao text not null,
  valor numeric(12,2) not null default 0,
  pago boolean default false,
  pago_em date,
  observacao text,
  origem text default 'pessoal', -- 'empresa' | 'pessoal'
  transportado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recibos gerados
create table if not exists recibos (
  id uuid default gen_random_uuid() primary key,
  numero text not null,
  data date not null,
  beneficiario text not null,
  descricao text not null,
  valor numeric(12,2) not null,
  tipo text default 'adiantamento', -- 'adiantamento' | 'vale' | 'pagamento'
  observacao text,
  created_at timestamptz default now()
);

-- Configurações do app (logo, nomes, etc)
create table if not exists configuracoes (
  id int default 1 primary key,
  nome_familia text default 'Daniel & Priscila',
  nome_empresa text default 'AG Security',
  logo_url text,
  receita_meta numeric(12,2) default 0,
  updated_at timestamptz default now()
);

insert into configuracoes (id, nome_familia, nome_empresa) 
values (1, 'Daniel & Priscila', 'AG Security')
on conflict (id) do nothing;

-- Habilitar Realtime para todas as tabelas
alter publication supabase_realtime add table receitas;
alter publication supabase_realtime add table despesas_empresa;
alter publication supabase_realtime add table despesas_pessoal;
alter publication supabase_realtime add table pendencias;
alter publication supabase_realtime add table recibos;
alter publication supabase_realtime add table configuracoes;

-- Indexes para performance
create index if not exists idx_receitas_mes_ano on receitas(mes, ano);
create index if not exists idx_desp_emp_mes_ano on despesas_empresa(mes, ano);
create index if not exists idx_desp_pes_mes_ano on despesas_pessoal(mes, ano);
create index if not exists idx_pendencias_mes_ano on pendencias(mes, ano);

-- RLS desabilitado para uso familiar simples (sem login)
alter table receitas disable row level security;
alter table despesas_empresa disable row level security;
alter table despesas_pessoal disable row level security;
alter table pendencias disable row level security;
alter table recibos disable row level security;
alter table configuracoes disable row level security;
