(window.SWX_I18N = window.SWX_I18N || {}).pt = {
  locale: 'pt-PT',
  themeLabel: ['Ativar tema escuro', 'Ativar tema claro'],

  assistantT: {
    think: ['A analisar o seu problema…', 'A procurar as soluções mais adequadas…', 'A consultar os nossos projetos anteriores…', 'A redigir o email para a nossa equipa…'],
    understood: 'Foi assim que percebemos', offTopic: 'Resposta',
    retryHint: 'Descreva uma tarefa ou um problema na sua empresa que gostaria de simplificar, por exemplo quem a executa, quanto tempo demora e que software utiliza.', retry: 'Descrever de outra forma',
    kind: { agent: 'Agente de IA', automation: 'Automatização', integration: 'Integração', app: 'Aplicação à medida' },
    cx: { simple: 'Simples', medium: 'Esforço médio', complex: 'Complexo' },
    tooShort: 'Descreva o problema com um pouco mais de detalhe, pelo menos numa ou duas frases.',
    err: { rate: 'Demasiados pedidos seguidos. Tente novamente dentro de alguns minutos.', off: 'O assistente de IA não está disponível neste momento. Escreva-nos abaixo ou marque diretamente uma reunião.', generic: 'Não foi recebida nenhuma resposta. Tente novamente.' },
    needFields: 'Indique o seu nome e um endereço de email válido e confirme o consentimento.',
    sending: 'A enviar…', send: 'Enviar email',
    sent: function (n) { return 'Obrigado, ' + n + '! Recebemos o seu email e responderemos por email. Se preferir falar mais cedo, marque uma reunião abaixo.' },
    sendOff: 'O envio automático não está a funcionar neste momento. Abra o email na sua aplicação de correio. Já está preparado:',
    openMail: 'Abrir na aplicação de correio',
    sendErr: 'Não foi possível enviar. Tente novamente ou escreva diretamente para info@swiftrix.eu.',
    rateSend: 'Foi enviado um email a partir daqui há pouco. Se quiser acrescentar algo, escreva diretamente para info@swiftrix.eu.',
    calFail: 'Não foi possível carregar o calendário.',
    notesPrefix: 'Do assistente de IA em swiftrix.eu'
  },

  assistantCases: {
    hakom: ['Aprovação digital de protocolos', 'Digitalizámos toda a aprovação de protocolos na produção. Os colaboradores iniciam sessão com o seu cartão de acesso à fábrica, veem cada novo documento que têm de analisar e confirmam-no digitalmente. Centenas de formulários em papel foram assim substituídos por um registo completo e rastreável.', 'hakom.sk'],
    aluprint: ['Aprovação digital de protocolos', 'Implementámos o mesmo sistema de aprovação por cartão na linha de produção da Aluprint. Assim, a administração vê num relance que todos os colaboradores leram e confirmaram os protocolos atuais, sem papelada.', 'aluprint.sk'],
    gaya: ['Limpeza do arquivo de faturas', 'Desenvolvemos um programa ligado ao scanner que compara cada fatura em papel digitalizada com a base de dados e mostra exatamente quais podem ser eliminadas. Isto libertou muito espaço de armazenamento.', 'gaya.sk'],
    geosoul: ['Programa de cálculo estrutural', 'Uma aplicação à medida que realiza os cálculos estruturais de projetos geotécnicos e cria automaticamente, para cada projeto, o relatório Word correspondente. Está ligada aos produtos do cliente e tem em conta diferentes tipos de ancoragem e condições do solo.', 'geosoul.sk'],
    unisport: ['Migração de base de dados', 'Automatizámos a migração completa de uma base de dados antiga muito grande do site antigo para o novo, limpando e reordenando os dados pelo caminho, de modo que cada registo ficou no lugar certo.', 'unisport-kovac.sk'],
    urbarlamac: ['Cálculo mensal de propriedade', 'Uma automatização que elabora os cálculos mensais de pagamentos em Excel da cooperativa para os seus membros, com base nas certidões prediais mais recentes. Um trabalho manual penoso que agora corre automaticamente.', 'urbarlamac.sk'],
    joinupshift: ['Portal de recrutamento & gestão de clippers', 'Um portal completo para gerir clippers de A a Z: captá-los e integrá-los, gerir contas, automatizar pagamentos e acompanhar num painel as vendas, visualizações e receitas geradas por cada clipper.', 'joinupshift.com']
  },

  calcT: {
    perMonth: '/mês', perYear: '/ano', h: 'h', days: 'dias úteis', months: 'meses',
    per: { day: 'h/dia', week: 'h/semana', month: 'h/mês' }, people: 'pess.',
    prefilled: 'Retirámos o tempo gasto da sua descrição. Ajuste-o se necessário.',
    summary: function (c, f) {
      var T = window.SWX_I18N.pt.calcT
      return 'Calculadora: ' + c.amount + ' ' + T.per[c.per] + ' × ' + c.people + ' ' + T.people + ', ' + f.money(c.rate) + '/h → hoje ' +
        f.money(c.costMonth) + '/mês (' + f.money(c.costMonth * 12) + '/ano). Se uma automatização assumir ' + c.share + ' %, poupa ~' +
        f.money(c.saveYear) + '/ano e ' + f.num(c.hoursFreedYear) + ' h/ano' + (c.payback ? ', com retorno do investimento em ~' + f.num(c.payback, 1) + ' meses' : '') + '.'
    }
  },

  demoT: {
    own: 'O seu email', ownSubj: 'Colar um email à sua escolha', from: 'De', subject: 'Assunto', to: 'Para',
    run: 'Iniciar o agente', rerun: 'Iniciar novamente', working: 'O agente está a trabalhar…',
    idle: 'Em espera', busy: 'A trabalhar', done: 'Concluído',
    pick: 'Escolha um email à esquerda e clique em “Iniciar o agente”.',
    resultIdle: 'Aqui aparecem o resumo do agente e o rascunho da resposta.',
    missing: 'Informação em falta', reply: 'Rascunho da resposta', approve: 'Aprovar e enviar', edit: 'Editar', editing: 'Edição concluída',
    toast: 'Modo de demonstração: numa configuração real, esta resposta seguiria da sua própria caixa de correio para o cliente.',
    empty: 'A folha ainda está vazia. Inicie o agente.',
    cols: ['N.º', 'Cliente', 'Artigo / Serviço', 'Quantidade', 'Valor', 'Entrega', 'Estado'],
    status: { ready: 'Pronta', waiting: 'Falta info', review: 'Rever' },
    tooShort: 'O email é demasiado curto. Cole pelo menos algumas frases.',
    reading: 'A ler o email…',
    liveNote: 'No modo em direto, o agente não está ligado ao seu catálogo e por isso não verifica preços nem stocks. Numa configuração real, trabalha com o seu CRM, ERP ou Excel.',
    err: { rate: 'Demasiadas tentativas seguidas. Tente novamente dentro de alguns minutos.', off: 'O modo em direto está desativado neste momento. Experimente os emails de exemplo.', generic: 'Não foi possível processar o email. Tente novamente ou escolha um exemplo.' },
    live: {
      type: { order: 'Email lido: uma encomenda', quote: 'Email lido: um pedido de preços', question: 'Email lido: uma pergunta de cliente', complaint: 'Email lido: uma reclamação', other: 'Email lido: nem encomenda nem pedido' },
      sender: 'Remetente identificado: ', noSender: 'A empresa do remetente não consta do email',
      items: function (n) { return n ? n + (n === 1 ? ' linha registada' : ' linhas registadas') : 'Não foram encontradas linhas de artigos ou serviços' },
      missing: function (n) { return n ? (n === 1 ? 'Falta 1 informação, por isso incluí uma pergunta' : 'Faltam ' + n + ' informações, por isso incluí perguntas') + ' na resposta' : 'Estão disponíveis todas as informações necessárias' },
      sheet: 'Registado na folha de encomendas', reply: 'Resposta preparada, à espera da sua aprovação'
    },
    sys: { mail: 'Email', crm: 'CRM', stock: 'Stock', sheet: 'Folha de encomendas' }
  },

  demoSamples: [
    {
      id: 'build', fromName: 'Ricardo Almeida', fromEmail: 'r.almeida@construcoesritmo.pt', time: '08:47',
      subject: 'Encomenda para a obra da Rua das Oliveiras',
      body: 'Bom dia,\n\ngostaríamos de encomendar o seguinte material para a nossa obra na Rua das Oliveiras, n.º 68, em Braga:\n- Cimento CEM II/A-L 42,5 R, 40 sacos de 25 kg\n- Aço B500 Ø12, 1,2 t\n- Tijolo de 25 cm, 6 paletes\n\nA entrega teria de ser a 15 de outubro até às 10h00. A mercadoria será recebida pelo nosso encarregado, o Marcos, tel. +351 910 000 000.\nPor favor, emitam a fatura em nome de Construções Ritmo, Lda.\n\nMuito obrigado\nRicardo Almeida\nCompras',
      steps: [
        ['mail', 'Email lido: uma nova encomenda'],
        ['crm', 'Cliente encontrado no CRM: Construções Ritmo, Lda., fatura em nome da empresa'],
        ['stock', '3 artigos associados ao catálogo e preços verificados'],
        ['stock', 'Stock verificado: todos os artigos estão disponíveis'],
        ['sheet', 'Encomenda registada: 3 linhas, 2.186,00 € sem IVA'],
        ['mail', 'Confirmação ao cliente preparada, à espera da sua aprovação']
      ],
      result: {
        summary: 'Nova encomenda para a obra na Rua das Oliveiras, n.º 68, em Braga: 3 artigos, entrega a 15 de outubro até às 10h00. Estão disponíveis todas as informações.',
        customer: 'Construções Ritmo, Lda.', status: 'ready', delivery: '15 out. até às 10h00, Rua das Oliveiras 68',
        items: [['Cimento CEM II/A-L 42,5 R, 25 kg', '40 sacos', '248,00 €'], ['Aço B500 Ø12', '1,2 t', '1.068,00 €'], ['Tijolo de 25 cm', '6 pal.', '870,00 €']],
        missing: [],
        reply: { subject: 'RE: Encomenda para a obra da Rua das Oliveiras', body: 'Bom dia, Sr. Ricardo Almeida,\n\nmuito obrigado pela sua encomenda. Confirmamos:\n- Cimento CEM II/A-L 42,5 R, 40 sacos: 248,00 €\n- Aço B500 Ø12, 1,2 t: 1.068,00 €\n- Tijolo de 25 cm, 6 paletes: 870,00 €\nTotal: 2.186,00 € + IVA.\n\nEntregamos a 15 de outubro até às 10h00 na Rua das Oliveiras, n.º 68, em Braga. O motorista ligará ao Marcos antes de chegar.\nA fatura será emitida em nome de Construções Ritmo, Lda.\n\nTenha um bom dia!' }
      }
    },
    {
      id: 'freight', fromName: 'Sabina Carvalho', fromEmail: 's.carvalho@nortelimpeza.pt', time: '09:15',
      subject: 'Transporte para Madrid',
      body: 'Olá,\n\nprecisávamos de transportar 4 paletes europeias (cerca de 1.800 kg) do nosso armazém no Porto para Madrid. A carga poderia ser feita na próxima terça-feira à tarde. Mercadoria: produtos de limpeza doméstica, sem mercadorias perigosas.\n\nQuanto custaria, e seria possível entregar na quarta-feira?\n\nSabina Carvalho\nNorte Limpeza, Lda.',
      steps: [
        ['mail', 'Email lido: um pedido de preços para um transporte'],
        ['crm', 'Cliente novo, ficha criada: Norte Limpeza, Lda.'],
        ['mail', 'Carga registada: 4 paletes europeias, cerca de 1.800 kg, sem mercadorias perigosas'],
        ['mail', 'Faltam 3 informações, sem as quais não é possível calcular o preço'],
        ['sheet', 'Pedido registado na folha com o estado “Falta info”'],
        ['mail', 'Resposta com perguntas preparada, à espera da sua aprovação']
      ],
      result: {
        summary: 'Pedido de preços: 4 paletes europeias (cerca de 1.800 kg) Porto → Madrid, carga na próxima terça-feira à tarde, entrega pretendida na quarta-feira.',
        customer: 'Norte Limpeza, Lda.', status: 'waiting', delivery: 'Carga ter., entrega qua.',
        items: [['Transporte Porto → Madrid, produtos de limpeza doméstica (sem mercadorias perigosas), cerca de 1.800 kg', '4 pal.', '-']],
        missing: ['Morada exata de carga no Porto', 'Morada de entrega em Madrid e pessoa de contacto no local', 'Se as paletes são empilháveis (e que altura têm)'],
        reply: { subject: 'RE: Transporte para Madrid', body: 'Olá, Sra. Sabina Carvalho,\n\nmuito obrigado pelo seu pedido. Para podermos indicar-lhe um preço exato e confirmar a entrega na quarta-feira, precisaríamos ainda de:\n1. A morada exata de carga no Porto.\n2. A morada de entrega em Madrid e uma pessoa de contacto no local.\n3. As paletes são empilháveis e que altura têm?\n\nAssim que tivermos estas informações, enviamos-lhe o preço no prazo de uma hora.\n\nTenha um bom dia!' }
      }
    },
    {
      id: 'cafe', fromName: 'Joana', fromEmail: 'joana@cafe-aurora.pt', time: '10:02',
      subject: 'encomenda',
      body: 'olá, como da última vez, só que o dobro do café, e juntem por favor 2 caixas dos copos de cartão de 300 ml. têm bebida de aveia? se sim, 12 unidades.\nentrega como sempre\n\nJoana, Café Aurora',
      steps: [
        ['mail', 'Email lido: uma reposição de encomenda'],
        ['crm', 'Cliente encontrado no CRM: Café Aurora, Rua do Almada 10, Porto'],
        ['crm', 'Última encomenda n.º 1042 consultada: café 6 kg, pacotes de açúcar 2 caixas'],
        ['stock', 'Stock verificado: a bebida de aveia está disponível (34 unidades)'],
        ['sheet', 'Encomenda registada: 4 linhas, 343,80 € sem IVA'],
        ['mail', 'Resposta preparada e pergunta respondida, à espera da sua aprovação']
      ],
      result: {
        summary: 'Reposição como a n.º 1042 com o dobro do café, mais copos e bebida de aveia. Morada habitual, dia de entrega habitual.',
        customer: 'Café Aurora', status: 'ready', delivery: 'Terça-feira, Rua do Almada 10',
        items: [['Café em grão “Espresso”, 1 kg (como n.º 1042 × 2)', '12 un.', '226,80 €'], ['Pacotes de açúcar, 1000 un. (como n.º 1042)', '2 cx.', '23,00 €'], ['Copos de cartão 300 ml, 1000 un.', '2 cx.', '64,00 €'], ['Bebida de aveia Barista, 1 l', '12 un.', '30,00 €']],
        missing: [],
        reply: { subject: 'RE: encomenda', body: 'Olá, Joana,\n\na vossa encomenda chegou:\n- Café “Espresso” 1 kg: 12 un. (o dobro da última vez)\n- Pacotes de açúcar: 2 caixas\n- Copos de cartão 300 ml: 2 caixas\n- Bebida de aveia Barista 1 l: 12 un. (sim, temos!)\nTotal: 343,80 € + IVA.\n\nEntregamos como de costume na terça-feira, na Rua do Almada, n.º 10.\n\nTenha um bom dia!' }
      }
    }
  ],

  faq: {
    'tenho de pagar antecipadamente pelos vossos serviços?': 'No arranque pedimos um sinal de 30 a 50 %, e o restante é pago na entrega. As automatizações em funcionamento são depois acompanhadas por uma avença mensal que cobre monitorização, manutenção e suporte.',
    'a swiftrix também é adequada para pequenas equipas e startups?': 'Com certeza. As pequenas equipas são muitas vezes as que mais beneficiam, porque o trabalho manual ocupa uma parte maior do seu dia. Ajustamos cada solução à sua dimensão, ao seu orçamento e às suas ferramentas.',
    'com que ferramentas e plataformas trabalham?': 'Com praticamente tudo o que tenha uma API: CRMs, folhas de cálculo, email, Slack, bases de dados, sistemas de pagamento e ferramentas internas próprias. Se existe uma interface, normalmente conseguimos automatizar.',
    'também otimizam processos ou apenas constroem?': 'Ambos. Primeiro analisamos os seus processos para eliminar desperdício e depois construímos as automatizações. A otimização contínua faz parte de todos os projetos.',
    'posso cancelar a qualquer momento se não estiver satisfeito?': 'Sim. Não há vínculos contratuais longos. Se não entregarmos valor, pode parar a qualquer momento, embora a maioria das equipas fique.',
    'o que distingue a swiftrix de outros fornecedores?': 'Somos engenheiros, não uma agência de prateleira. Cada automatização é construída à medida dos seus sistemas, monitorizada continuamente e protegida pela nossa garantia de disponibilidade.',
    'constroem as automatizações ou apenas aconselham sobre a estratégia?': 'Nós construímos. A estratégia está incluída, mas no fim fica com automatizações funcionais e prontas para produção, e não apenas com uma apresentação de recomendações.'
  },

  heroWords: ['workflows'],
  aboutLabel: '/ SOBRE NÓS',
  aboutWords: ['agência']
}
