# 🚀 Guia de Deploy — Finanças Daniel & Priscila / AG Security

Tempo estimado: **15 a 20 minutos**. Sem precisar saber programar!

---

## PASSO 1 — Criar conta no GitHub (2 min)

1. Acesse https://github.com e clique em **Sign up**
2. Coloque seu e-mail, crie uma senha e escolha um nome de usuário
3. Confirme seu e-mail

---

## PASSO 2 — Criar o banco de dados no Supabase (5 min)

1. Acesse https://supabase.com e clique em **Start your project**
2. Entre com sua conta Google ou crie uma conta
3. Clique em **New project**
4. Preencha:
   - **Name:** `financas-familia`
   - **Database Password:** anote essa senha em algum lugar!
   - **Region:** South America (São Paulo)
5. Clique em **Create new project** e aguarde ~2 minutos
6. No menu lateral, clique em **SQL Editor**
7. Clique em **New query**
8. Copie **todo o conteúdo** do arquivo `supabase-schema.sql` e cole aqui
9. Clique em **Run** (botão verde)
10. Você verá "Success" — as tabelas foram criadas!
11. Vá em **Settings → API** e copie:
    - **Project URL** → ex: `https://abcdefgh.supabase.co`
    - **anon public key** → chave longa começando com `eyJ...`

---

## PASSO 3 — Publicar o código no GitHub (3 min)

1. Acesse https://github.com/new
2. **Repository name:** `financas-familia`
3. Deixe como **Private** (privado — só você vê)
4. Clique em **Create repository**
5. Você verá uma página com instruções. Abra o **terminal** do seu computador:
   - No Windows: pressione `Win + R`, digite `cmd`, Enter
   - No Mac: abra o app "Terminal"
6. Execute os comandos abaixo **um por um**:

```bash
cd ~/Desktop
```
*(ou a pasta onde você salvou o projeto)*

```bash
git init financas-familia
cd financas-familia
```

Agora copie todos os arquivos do projeto para esta pasta, depois:

```bash
git add .
git commit -m "inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/financas-familia.git
git push -u origin main
```

*(substitua SEU_USUARIO pelo seu usuário do GitHub)*

---

## PASSO 4 — Deploy no Vercel (5 min)

1. Acesse https://vercel.com e clique em **Sign up**
2. Escolha **Continue with GitHub** — autorize a conexão
3. Clique em **Add New → Project**
4. Você verá seu repositório `financas-familia` — clique em **Import**
5. Em **Environment Variables**, adicione as 3 variáveis abaixo:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase (ex: https://abc.supabase.co) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase (eyJ...) |
| `ANTHROPIC_API_KEY` | Sua chave da Anthropic (sk-ant-...) |

6. Clique em **Deploy** e aguarde ~3 minutos
7. Pronto! Você receberá um link tipo: `https://financas-familia.vercel.app`

---

## PASSO 5 — Compartilhar com seu marido (1 min)

1. Copie o link do Vercel: `https://financas-familia.vercel.app`
2. Envie para seu marido pelo WhatsApp
3. Ambos abrem o link no celular
4. **Opcional: adicionar na tela inicial do celular**
   - **Android:** Toque nos 3 pontos do Chrome → "Adicionar à tela inicial"
   - **iPhone:** Toque no botão compartilhar → "Adicionar à tela de início"
5. O app vai aparecer como ícone, igual a um app normal!

---

## Como obter sua chave da Anthropic (para o input por IA)

1. Acesse https://console.anthropic.com
2. Vá em **API Keys → Create Key**
3. Copie a chave (começa com `sk-ant-`)
4. Cole no Vercel como `ANTHROPIC_API_KEY`

---

## ✅ Funcionalidades do app

- **Receitas** — lançar entradas, marcar como recebido, exportar CSV/PDF
- **Empresa (AG Security)** — despesas por categoria, baixa com data, exportar PDF por categoria
- **Pessoal** — contas pessoais, cartões, pendências de meses anteriores
- **Transporte automático** — pendentes vão automaticamente para o próximo mês
- **Input inteligente (IA)** — descreva em texto ou foto a compra, a IA categoriza e lança
- **Recibos** — gera PDF de adiantamento/vale com valor por extenso e assinatura
- **Exportar** — PDF geral, PDF por categoria, CSV — todos com logo e cabeçalho
- **Sincronização real** — você e seu marido veem as mesmas informações em tempo real
- **PWA** — funciona como app no celular, sem precisar instalar pela loja

---

## Dúvidas frequentes

**O app some se eu fechar?**
Não! Os dados ficam no Supabase (nuvem). Você pode fechar, trocar de celular, usar no computador — tudo sincroniza.

**E se eu quiser trocar o logo?**
Vá em **Config** dentro do app → Trocar logo.

**Posso adicionar mais categorias?**
Sim! Edite o arquivo `src/lib/utils.ts` e adicione nas listas `CATS_EMP`, `CATS_PES` etc.

**O input por IA consome créditos?**
Sim, usa a API da Anthropic. Cada lançamento consome centavos de dólar. Para uso familiar normal (50-100 lançamentos/mês) vai gastar menos de US$1/mês.

---

## Precisa de ajuda?

Volte aqui no Claude e diga:
- "Estou com erro no passo X do deploy"
- "Quero adicionar a categoria Y"
- "Quero mudar a cor do app"

Que eu ajudo na hora! 🎉
