export type Categoria = string

export interface Receita {
  id: string
  mes: number
  ano: number
  data: string | null
  descricao: string
  categoria: string
  valor: number
  recebido: boolean
  observacao?: string
  tipo: 'empresa' | 'pessoal'
  created_at?: string
}

export interface DespesaEmpresa {
  id: string
  mes: number
  ano: number
  vencimento: string | null
  descricao: string
  categoria: string
  valor: number
  pago: boolean
  pago_em: string | null
  observacao?: string
  transportado?: boolean
}

export interface DespesaPessoal {
  id: string
  mes: number
  ano: number
  vencimento: string | null
  descricao: string
  categoria: string
  valor: number
  pago: boolean
  pago_em: string | null
  cartao?: string
  observacao?: string
  transportado?: boolean
}

export interface Pendencia {
  id: string
  mes: number
  ano: number
  vencimento: string | null
  descricao: string
  valor: number
  pago: boolean
  pago_em: string | null
  observacao?: string
  origem: 'empresa' | 'pessoal'
  transportado?: boolean
}

export interface Recibo {
  id: string
  numero: string
  data: string
  beneficiario: string
  descricao: string
  valor: number
  tipo: 'adiantamento' | 'vale' | 'pagamento'
  observacao?: string
  created_at?: string
}

export interface Configuracoes {
  id: number
  nome_familia: string
  nome_empresa: string
  logo_url: string | null
  receita_meta: number
}

export interface AIParseResult {
  descricao: string
  valor: number
  categoria: string
  data: string | null
  observacao?: string
}

export type TabName = 'receitas' | 'empresa' | 'pessoal' | 'resumo' | 'recibos' | 'config'
