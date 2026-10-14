// Spanish (Spain) strings for the shared scripts. See i18n/README.md.
(window.SWX_I18N = window.SWX_I18N || {}).es = {
  locale: 'es-ES',
  themeLabel: ['Activar el modo oscuro', 'Activar el modo claro'],

  assistantT: {
    think: ['Analizando su problema…', 'Buscando las soluciones que mejor encajan…', 'Revisando nuestros proyectos anteriores…', 'Redactando el correo para nuestro equipo…'],
    understood: 'Lo que hemos entendido', offTopic: 'Respuesta',
    retryHint: 'Describa una tarea o un problema de su empresa que le gustaría simplificar, por ejemplo quién lo hace, cuánto tiempo lleva y qué software utiliza.', retry: 'Describirlo de otra forma',
    kind: { agent: 'Agente de IA', automation: 'Automatización', integration: 'Integración', app: 'Aplicación a medida' },
    cx: { simple: 'Sencillo', medium: 'Complejidad media', complex: 'Complejo' },
    tooShort: 'Describa el problema con algo más de detalle, al menos en una o dos frases.',
    err: { rate: 'Demasiadas solicitudes seguidas. Inténtelo de nuevo dentro de unos minutos.', off: 'El asistente de IA no está disponible en este momento. Escríbanos más abajo o reserve directamente una llamada.', generic: 'No se ha podido obtener una respuesta. Inténtelo de nuevo.' },
    needFields: 'Introduzca su nombre y una dirección de correo electrónico válida y marque la casilla de consentimiento.',
    sending: 'Enviando…', send: 'Enviar el correo',
    sent: function (n) { return 'Muchas gracias, ' + n + '. Hemos recibido su correo y le responderemos por correo electrónico. Si prefiere hablar antes, reserve una llamada más abajo.' },
    sendOff: 'El envío automático no funciona en este momento. Abra el correo en su programa de correo. Ya está preparado:',
    openMail: 'Abrir en el programa de correo',
    sendErr: 'No se ha podido enviar. Inténtelo de nuevo o escriba directamente a info@swiftrix.eu.',
    rateSend: 'Acaba de enviarse un correo desde aquí. Si desea añadir algo, escriba directamente a info@swiftrix.eu.',
    calFail: 'No se ha podido cargar el calendario.',
    notesPrefix: 'Del asistente de IA de swiftrix.eu'
  },

  assistantCases: {
    hakom: ['Firma digital de protocolos', 'Hemos digitalizado todo el proceso de firma de protocolos en la planta de producción. Los empleados acceden con su tarjeta de trabajo, ven cada documento nuevo que deben revisar y lo firman de forma digital. Cientos de formularios en papel se sustituyeron por un registro completamente trazable.', 'hakom.sk'],
    aluprint: ['Firma digital de protocolos', 'Hemos implantado el mismo sistema de firma con tarjeta en la línea de producción de Aluprint. Así, la dirección comprueba de un vistazo que todos los empleados han leído y confirmado los últimos protocolos, sin papeleo.', 'aluprint.sk'],
    gaya: ['Depuración del archivo de facturas', 'Hemos desarrollado un programa conectado al escáner que compara cada factura en papel escaneada con la base de datos e indica exactamente cuáles se pueden destruir. Esto liberó mucho espacio de almacenamiento.', 'gaya.sk'],
    geosoul: ['Programa de cálculo estructural', 'Una aplicación a medida que realiza los cálculos estructurales de sus proyectos geotécnicos y genera automáticamente un informe en Word adaptado a cada proyecto. Está vinculada a los productos del cliente y tiene en cuenta distintos tipos de anclajes y condiciones del terreno.', 'geosoul.sk'],
    unisport: ['Migración de bases de datos', 'Hemos automatizado la migración completa de una base de datos antigua muy grande desde el sitio web anterior al nuevo, depurando y reordenando los datos por el camino para que cada registro acabara en su sitio.', 'unisport-kovac.sk'],
    urbarlamac: ['Liquidación mensual de propiedades', 'Una automatización que genera cada mes los cálculos de pagos en Excel de la cooperativa para sus socios, a partir de las últimas notas registrales. Una tarea manual tediosa que ahora se ejecuta sola.', 'urbarlamac.sk'],
    joinupshift: ['Portal de captación y gestión de clippers', 'Un portal completo para gestionar a los clippers de principio a fin: captarlos e incorporarlos, gestionar sus cuentas, automatizar sus pagos y ver en un único panel las ventas, visualizaciones e ingresos que genera cada clipper.', 'joinupshift.com']
  },

  calcT: {
    perMonth: '/mes', perYear: '/año', h: 'h', days: 'días laborables', months: 'meses',
    per: { day: 'h/día', week: 'h/semana', month: 'h/mes' }, people: 'pers.',
    prefilled: 'Hemos tomado el tiempo dedicado de su descripción. Ajústelo si es necesario.',
    summary: function (c, f) {
      var T = window.SWX_I18N.es.calcT
      return 'Calculadora: ' + c.amount + ' ' + T.per[c.per] + ' × ' + c.people + ' ' + T.people + ', ' + f.money(c.rate) + '/h → hoy ' +
        f.money(c.costMonth) + '/mes (' + f.money(c.costMonth * 12) + '/año). Si la automatización asumiera el ' + c.share + ' %, ahorraría ~' +
        f.money(c.saveYear) + '/año y ' + f.num(c.hoursFreedYear) + ' h/año' + (c.payback ? ', con una amortización en ~' + f.num(c.payback, 1) + ' meses' : '') + '.'
    }
  },

  demoT: {
    own: 'Su correo', ownSubj: 'Pegue cualquier correo', from: 'De', subject: 'Asunto', to: 'Para',
    run: 'Iniciar el agente', rerun: 'Iniciar de nuevo', working: 'El agente está trabajando…',
    idle: 'En espera', busy: 'Trabajando', done: 'Listo',
    pick: 'Elija un correo a la izquierda y pulse «Iniciar el agente».',
    resultIdle: 'Aquí aparecerán el resumen del agente y el borrador de respuesta.',
    missing: 'Información que falta', reply: 'Borrador de respuesta', approve: 'Aprobar y enviar', edit: 'Editar', editing: 'Terminar de editar',
    toast: 'Modo demo: en una instalación real, esta respuesta saldría desde su propio buzón hacia el cliente.',
    empty: 'La hoja aún está vacía. Inicie el agente.',
    cols: ['N.º', 'Cliente', 'Artículo / servicio', 'Cantidad', 'Importe', 'Entrega', 'Estado'],
    status: { ready: 'Listo', waiting: 'Falta info', review: 'Revisar' },
    tooShort: 'El correo es demasiado corto. Pegue al menos unas cuantas frases.',
    reading: 'Leyendo el correo…',
    liveNote: 'En el modo en vivo el agente no está conectado a su catálogo y, por eso, no comprueba precios ni existencias. En una instalación real trabaja con su CRM, ERP o Excel.',
    err: { rate: 'Demasiados intentos seguidos. Inténtelo de nuevo dentro de unos minutos.', off: 'El modo en vivo está desactivado en este momento. Pruebe los correos de ejemplo.', generic: 'No se ha podido procesar el correo. Inténtelo de nuevo o pruebe uno de los ejemplos.' },
    live: {
      type: { order: 'Correo leído: un pedido', quote: 'Correo leído: una solicitud de presupuesto', question: 'Correo leído: una consulta de un cliente', complaint: 'Correo leído: una reclamación', other: 'Correo leído: ni un pedido ni una consulta' },
      sender: 'Remitente identificado: ', noSender: 'El correo no indica la empresa del remitente',
      items: function (n) { return n ? n + (n === 1 ? ' línea registrada' : ' líneas registradas') : 'No se han encontrado líneas de artículos ni de servicios' },
      missing: function (n) { return n ? (n === 1 ? 'Falta 1 dato, así que he incluido una pregunta' : 'Faltan ' + n + ' datos, así que he incluido preguntas') + ' en la respuesta' : 'Están todos los datos necesarios' },
      sheet: 'Registrado en la hoja de pedidos', reply: 'Respuesta preparada, a la espera de su aprobación'
    },
    sys: { mail: 'Correo', crm: 'CRM', stock: 'Almacén', sheet: 'Hoja de pedidos' }
  },

  demoSamples: [
    {
      id: 'build', fromName: 'Javier Martínez', fromEmail: 'j.martinez@construccionesalba.es', time: '08:47',
      subject: 'Pedido para la obra de la calle Alcalá',
      body: 'Buenos días:\n\nQuerríamos pedir el siguiente material para nuestra obra de la calle Alcalá, 68, en Alcalá de Henares:\n- Cemento CEM II/A-LL 42,5 R, 40 sacos de 25 kg\n- Acero corrugado B500 Ø12, 1,2 t\n- Bloques de hormigón de 25 cm, 6 palés\n\nLa entrega tendría que ser el 15 de octubre antes de las 10:00. La mercancía la recibirá nuestro jefe de obra, Marcos, tel. +34 600 000 000.\nPor favor, emitan la factura a nombre de Construcciones Alba, S.L.\n\nMuchas gracias.\nJavier Martínez\nCompras',
      steps: [
        ['mail', 'Correo leído: un pedido nuevo'],
        ['crm', 'Cliente encontrado en el CRM: Construcciones Alba, S.L., factura a nombre de la empresa'],
        ['stock', '3 artículos asignados al catálogo y precios comprobados'],
        ['stock', 'Existencias comprobadas: todos los artículos están en stock'],
        ['sheet', 'Pedido registrado: 3 líneas, 2.186,00 € sin IVA'],
        ['mail', 'Confirmación para el cliente preparada, a la espera de su aprobación']
      ],
      result: {
        summary: 'Pedido nuevo para la obra de la calle Alcalá, 68, en Alcalá de Henares: 3 artículos, entrega el 15 de octubre antes de las 10:00. Constan todos los datos.',
        customer: 'Construcciones Alba, S.L.', status: 'ready', delivery: '15 oct. antes de las 10:00, calle Alcalá, 68',
        items: [['Cemento CEM II/A-LL 42,5 R, 25 kg', '40 sacos', '248,00 €'], ['Acero corrugado B500 Ø12', '1,2 t', '1.068,00 €'], ['Bloques de hormigón de 25 cm', '6 palés', '870,00 €']],
        missing: [],
        reply: { subject: 'RE: Pedido para la obra de la calle Alcalá', body: 'Buenos días, Sr. Martínez:\n\nMuchas gracias por su pedido. Le confirmamos:\n- Cemento CEM II/A-LL 42,5 R, 40 sacos: 248,00 €\n- Acero corrugado B500 Ø12, 1,2 t: 1.068,00 €\n- Bloques de hormigón de 25 cm, 6 palés: 870,00 €\nTotal: 2.186,00 € más IVA.\n\nEntregaremos el 15 de octubre antes de las 10:00 en la calle Alcalá, 68, de Alcalá de Henares. El conductor llamará a Marcos antes de llegar.\nLa factura se emitirá a nombre de Construcciones Alba, S.L.\n\n¡Que tenga un buen día!' }
      }
    },
    {
      id: 'freight', fromName: 'Sabina Ortega', fromEmail: 's.ortega@norteclean.es', time: '09:15',
      subject: 'Transporte a Lisboa',
      body: 'Hola:\n\nNecesitaríamos llevar 4 europalés (unos 1.800 kg) desde nuestro almacén de Madrid a Lisboa. La carga podría hacerse el próximo martes por la tarde. Mercancía: limpiadores domésticos, no son mercancías peligrosas.\n\n¿Cuánto costaría y sería posible entregar el miércoles?\n\nSabina Ortega\nNorteclean Productos de Limpieza, S.L.',
      steps: [
        ['mail', 'Correo leído: una solicitud de presupuesto de transporte'],
        ['crm', 'Cliente nuevo, ficha creada: Norteclean Productos de Limpieza, S.L.'],
        ['mail', 'Carga registrada: 4 europalés, unos 1.800 kg, sin mercancías peligrosas'],
        ['mail', 'Faltan 3 datos sin los cuales no se puede calcular el precio'],
        ['sheet', 'Solicitud registrada en la hoja con el estado «Falta info»'],
        ['mail', 'Respuesta con preguntas preparada, a la espera de su aprobación']
      ],
      result: {
        summary: 'Solicitud de presupuesto: 4 europalés (unos 1.800 kg) de Madrid a Lisboa, carga el próximo martes por la tarde, entrega deseada el miércoles.',
        customer: 'Norteclean Productos de Limpieza, S.L.', status: 'waiting', delivery: 'Carga mar., entrega mié.',
        items: [['Transporte Madrid → Lisboa, limpiadores domésticos (sin mercancías peligrosas), unos 1.800 kg', '4 palés', '-']],
        missing: ['Dirección exacta de carga en Madrid', 'Dirección de entrega en Lisboa y persona de contacto allí', 'Si los palés son apilables (y qué altura tienen)'],
        reply: { subject: 'RE: Transporte a Lisboa', body: 'Hola, Sabina:\n\nMuchas gracias por su solicitud. Para poder darle un precio exacto y confirmarle la entrega del miércoles, necesitaríamos:\n1. La dirección exacta de carga en Madrid.\n2. La dirección de entrega en Lisboa y una persona de contacto allí.\n3. ¿Los palés son apilables y qué altura tienen?\n\nEn cuanto tengamos los datos, le enviaremos el precio en menos de una hora.\n\n¡Que tenga un buen día!' }
      }
    },
    {
      id: 'cafe', fromName: 'Julia', fromEmail: 'julia@cafealba.es', time: '10:02',
      subject: 'pedido',
      body: 'hola, como la otra vez, pero el doble de café 🙂 y añadid 2 cajas de los vasos de cartón de 300 ml. ¿tenéis bebida de avena? si es así, 12 unidades.\nentrega como siempre\n\nJulia, Café Alba',
      steps: [
        ['mail', 'Correo leído: un pedido repetido'],
        ['crm', 'Cliente encontrado en el CRM: Café Alba, calle del Carmen, 10, Valencia'],
        ['crm', 'Último pedido n.º 1042 consultado: café 6 kg, sobres de azúcar 2 cajas'],
        ['stock', 'Existencias comprobadas: hay bebida de avena disponible (34 unidades)'],
        ['sheet', 'Pedido registrado: 4 líneas, 343,80 € sin IVA'],
        ['mail', 'Respuesta preparada y pregunta contestada, a la espera de su aprobación']
      ],
      result: {
        summary: 'Pedido repetido como el n.º 1042 con el doble de café, además de vasos y bebida de avena. Dirección y día de entrega habituales.',
        customer: 'Café Alba', status: 'ready', delivery: 'Martes, calle del Carmen, 10',
        items: [['Café en grano «Espresso», 1 kg (como n.º 1042 × 2)', '12 uds.', '226,80 €'], ['Sobres de azúcar, 1000 uds. (como n.º 1042)', '2 cajas', '23,00 €'], ['Vasos de cartón 300 ml, 1000 uds.', '2 cajas', '64,00 €'], ['Bebida de avena Barista, 1 l', '12 uds.', '30,00 €']],
        missing: [],
        reply: { subject: 'RE: pedido', body: 'Hola, Julia:\n\nHemos recibido vuestro pedido:\n- Café «Espresso» 1 kg: 12 uds. (el doble que la última vez)\n- Sobres de azúcar: 2 cajas\n- Vasos de cartón 300 ml: 2 cajas\n- Bebida de avena Barista 1 l: 12 uds. (¡sí, la tenemos!)\nTotal: 343,80 € más IVA.\n\nLo entregaremos como siempre el martes en la calle del Carmen, 10.\n\n¡Que tengáis un buen día!' }
      }
    }
  ],

  faq: {
    '¿tengo que pagar por adelantado sus servicios?': 'Para empezar pedimos un anticipo del 30–50 %, y el resto se abona a la entrega. Después mantenemos en funcionamiento las automatizaciones activas mediante una cuota mensual que incluye supervisión, mantenimiento y soporte.',
    '¿es swiftrix adecuado también para equipos pequeños y startups?': 'Por supuesto. Los equipos pequeños suelen beneficiarse más, porque el trabajo manual ocupa una parte mayor de su jornada. Adaptamos cada solución a su tamaño, su presupuesto y sus herramientas.',
    '¿con qué herramientas y plataformas trabajan?': 'Con prácticamente todo lo que tenga una API: CRM, hojas de cálculo, correo electrónico, Slack, bases de datos, sistemas de pago y herramientas internas propias. Si existe una interfaz, normalmente podemos automatizarlo.',
    '¿optimizan también procesos o solo desarrollan?': 'Ambas cosas. Primero analizamos sus procesos para eliminar el desperdicio y después construimos las automatizaciones. La optimización continua forma parte de todos los proyectos.',
    '¿puedo cancelar en cualquier momento si no estoy satisfecho?': 'Sí. No hay contratos de permanencia largos. Si no le aportamos valor, puede dejarlo cuando quiera, aunque la mayoría de los equipos se queda.',
    '¿qué diferencia a swiftrix de otros proveedores?': 'Somos ingenieros, no una agencia estándar. Cada automatización se construye a medida de sus sistemas, se supervisa de forma continua y cuenta con el respaldo de nuestra garantía de disponibilidad.',
    '¿construyen las automatizaciones o solo asesoran sobre la estrategia?': 'Construimos. La estrategia está incluida, pero al final dispondrá de automatizaciones que funcionan y están listas para producción, y no solo de una presentación con recomendaciones.'
  },

  heroWords: ['flujos de trabajo'],
  aboutLabel: '/ SOBRE NOSOTROS',
  aboutWords: ['agencia']
}
