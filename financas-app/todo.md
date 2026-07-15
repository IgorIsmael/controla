# Projeto TODO - Saldo (Controle Financeiro)

## Funcionalidades Principais

### Autenticação e Acesso
- [x] Autenticação com lista de e-mails permitidos (Igor e Giovana)
- [x] Restrição de acesso apenas para usuários autorizados
- [x] Logout e gerenciamento de sessão

### Dashboard
- [x] Dashboard mensal com resumo de saldo
- [x] Exibição de entradas e saídas
- [x] Identificação de gastos por pessoa (Igor/Giovana)
- [x] Orçamento mensal configurável
- [x] Indicador de progresso do orçamento

### Cartões de Crédito
- [x] Cadastro de múltiplos cartões de crédito
- [x] Campos: nome, limite total, bandeira
- [x] Cálculo de limite disponível
- [x] Visão consolidada de todos os cartões
- [x] Soma geral de limites (total, usado, disponível)

### Lançamentos
- [x] Registro de lançamentos com descrição, valor, data
- [x] Seleção de método de pagamento (Pix ou Cartão)
- [x] Atribuição de responsável (Igor ou Giovana)
- [x] Seleção de categoria
- [x] Marcação de lançamento como fixo/recorrente

### Pix
- [x] Débito imediato no saldo ao usar Pix
- [x] Rastreamento de saldo disponível em Pix

### Cartão de Crédito
- [x] Débito no limite do cartão escolhido
- [x] Atualização automática de limite disponível
- [x] Suporte a múltiplos cartões por transação

### Lançamentos Recorrentes
- [ ] Lançamentos fixos no cartão descontam automaticamente
- [ ] Recorrência mensal automática
- [ ] Histórico de recorrências aplicadas

### Categorias
- [ ] Categorias de gastos personalizáveis
- [ ] Ícones para cada categoria
- [ ] Filtros por categoria

### Histórico e Filtros
- [ ] Histórico completo de lançamentos
- [ ] Filtro por período (dia, semana, mês)
- [ ] Filtro por pessoa (Igor/Giovana)
- [ ] Filtro por método de pagamento (Pix/Cartão)
- [ ] Busca por descrição

### Previsão de Contas
- [ ] Cálculo de média dos últimos meses
- [ ] Previsão de contas fixas (ex.: luz, água)
- [ ] Exibição de estimativas

### Design Visual
- [ ] Fundo desfocado em gradiente teal/laranja
- [ ] Tipografia sans-serif em branco
- [ ] Detalhes geométricos minimalistas
- [ ] Visual cinematográfico e sofisticado
- [ ] Responsividade para mobile

## Fase 1: Backend (Schema e APIs)
- [x] Schema do banco de dados
- [x] Procedures tRPC para autenticação
- [x] Procedures tRPC para cartões
- [x] Procedures tRPC para lançamentos
- [x] Procedures tRPC para categorias
- [x] Procedures tRPC para recorrências

## Fase 2: Frontend (UI e Interações)
- [x] Página de login com restrição de e-mails
- [x] Dashboard principal
- [x] Página de cartões
- [x] Modal de novo lançamento
- [x] Página de histórico
- [x] Página de configurações

## Fase 3: Testes
- [x] Testes unitários das procedures
- [x] Testes de integração
- [ ] Testes de UI

## Fase 4: Deploy
- [ ] Checkpoint final
- [ ] Publicação do projeto
