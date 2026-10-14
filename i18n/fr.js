(window.SWX_I18N = window.SWX_I18N || {}).fr = {
  locale: "fr-FR",
  themeLabel: ["Activer le mode sombre", "Activer le mode clair"],

  assistantT: {
    think: ["J'analyse votre problème…", "Je cherche les solutions les plus adaptées…", "Je consulte nos projets précédents…", "Je rédige l'e-mail à notre équipe…"],
    understood: "Voici ce que nous avons compris", offTopic: "Réponse",
    retryHint: "Décrivez une tâche ou un problème de votre entreprise que vous aimeriez simplifier, par exemple qui s'en occupe, combien de temps cela prend et quels logiciels vous utilisez.", retry: "Décrire autrement",
    kind: { agent: "Agent IA", automation: "Automatisation", integration: "Intégration", app: "Application sur mesure" },
    cx: { simple: "Simple", medium: "Effort moyen", complex: "Complexe" },
    tooShort: "Décrivez le problème un peu plus précisément, en une ou deux phrases au moins.",
    err: { rate: "Trop de demandes à la suite. Veuillez réessayer dans quelques minutes.", off: "L'assistant IA est momentanément indisponible. Écrivez-nous ci-dessous ou réservez directement un échange.", generic: "Aucune réponse n'est arrivée. Veuillez réessayer." },
    needFields: "Veuillez saisir votre nom et une adresse e-mail valide, et confirmer votre accord.",
    sending: "Envoi en cours…", send: "Envoyer l'e-mail",
    sent: function (n) { return "Merci, " + n + " ! Nous avons bien reçu votre e-mail et nous vous répondrons par e-mail. Si vous souhaitez échanger plus tôt, réservez un créneau ci-dessous." },
    sendOff: "L'envoi automatique ne fonctionne pas pour le moment. Ouvrez l'e-mail dans votre messagerie, il est déjà prêt :",
    openMail: "Ouvrir dans la messagerie",
    sendErr: "L'envoi a échoué. Veuillez réessayer ou écrire directement à info@swiftrix.eu.",
    rateSend: "Un e-mail vient d'être envoyé depuis cette page. Pour ajouter quelque chose, écrivez directement à info@swiftrix.eu.",
    calFail: "Le calendrier n'a pas pu être chargé.",
    notesPrefix: "Depuis l'assistant IA de swiftrix.eu"
  },

  assistantCases: {
    hakom: ["Validation numérique de procès-verbaux", "Nous avons numérisé toute la validation des procès-verbaux en production. Les employés se connectent avec leur badge d'entreprise, voient chaque nouveau document à examiner et le valident numériquement. Des centaines de formulaires papier ont ainsi été remplacés par une traçabilité complète.", "hakom.sk"],
    aluprint: ["Validation numérique de procès-verbaux", "Nous avons déployé le même système de validation par badge sur la ligne de production d'Aluprint. La direction voit ainsi d'un coup d'œil que tous les employés ont lu et validé les procès-verbaux en vigueur, sans aucune paperasse.", "aluprint.sk"],
    gaya: ["Tri des archives de factures", "Nous avons développé un programme relié au scanner qui compare chaque facture papier numérisée à la base de données et indique précisément lesquelles peuvent être détruites. Cela a libéré beaucoup d'espace de stockage.", "gaya.sk"],
    geosoul: ["Logiciel de calcul de structures", "Une application sur mesure qui réalise les calculs de structure pour des projets géotechniques et génère automatiquement, pour chaque projet, un rapport Word adapté. Elle est liée aux produits du client et prend en compte différents types d'ancrages et de conditions de sol.", "geosoul.sk"],
    unisport: ["Migration de base de données", "Nous avons automatisé la migration complète d'une très grande base de données historique de l'ancien site vers le nouveau, en nettoyant et en réorganisant les données pour que chaque enregistrement trouve sa place.", "unisport-kovac.sk"],
    urbarlamac: ["Décompte mensuel de propriété", "Une automatisation qui établit les calculs mensuels de versement sous Excel de la coopérative pour ses membres, à partir des derniers extraits du registre foncier. Un travail manuel fastidieux qui tourne désormais automatiquement.", "urbarlamac.sk"],
    joinupshift: ["Portail de recrutement & de gestion des clippeurs", "Un portail complet pour gérer les clippeurs de A à Z : les recruter et les former, gérer les comptes, automatiser les paiements et suivre dans un tableau de bord les ventes, les vues et le chiffre d'affaires de chacun.", "joinupshift.com"]
  },

  calcT: {
    perMonth: "/mois", perYear: "/an", h: "h", days: "jours ouvrés", months: "mois",
    per: { day: "h/jour", week: "h/semaine", month: "h/mois" }, people: "pers.",
    prefilled: "Nous avons repris le temps passé à partir de votre description. Ajustez-le si besoin.",
    summary: function (c, f) {
      return "Calculateur : " + c.amount + " " + window.SWX_I18N.fr.calcT.per[c.per] + " × " + c.people + " " + window.SWX_I18N.fr.calcT.people + ", " + f.money(c.rate) + "/h → aujourd'hui " +
        f.money(c.costMonth) + "/mois (" + f.money(c.costMonth * 12) + "/an). Si l'automatisation prenait en charge " + c.share + " %, elle ferait économiser ~" +
        f.money(c.saveYear) + "/an et " + f.num(c.hoursFreedYear) + " h/an" + (c.payback ? ", rentabilisée en ~" + f.num(c.payback, 1) + " mois" : "") + "."
    }
  },

  demoT: {
    own: "Votre e-mail", ownSubj: "Collez n'importe quel e-mail", from: "De", subject: "Objet", to: "À",
    run: "Lancer l'agent", rerun: "Relancer", working: "L'agent travaille…",
    idle: "En attente", busy: "En cours", done: "Terminé",
    pick: "Choisissez un e-mail à gauche et cliquez sur « Lancer l'agent ».",
    resultIdle: "Le résumé de l'agent et le brouillon de réponse apparaîtront ici.",
    missing: "Informations manquantes", reply: "Brouillon de réponse", approve: "Valider et envoyer", edit: "Modifier", editing: "Modification terminée",
    toast: "Mode démo : dans une vraie configuration, cette réponse partirait de votre propre messagerie vers le client.",
    empty: "Le tableau est encore vide. Lancez l'agent.",
    cols: ["N°", "Client", "Article / prestation", "Quantité", "Montant", "Livraison", "Statut"],
    status: { ready: "Prêt", waiting: "Infos manquantes", review: "À vérifier" },
    tooShort: "L'e-mail est trop court. Collez au moins quelques phrases.",
    reading: "Lecture de l'e-mail…",
    liveNote: "En mode réel, l'agent n'est pas relié à votre catalogue et ne vérifie donc ni les prix ni les stocks. Dans une vraie configuration, il travaille avec votre CRM, votre ERP ou votre Excel.",
    err: { rate: "Trop d'essais à la suite. Veuillez réessayer dans quelques minutes.", off: "Le mode réel est actuellement désactivé. Essayez les exemples d'e-mails.", generic: "L'e-mail n'a pas pu être traité. Réessayez ou prenez un exemple." },
    live: {
      type: { order: "E-mail lu : une commande", quote: "E-mail lu : une demande de prix", question: "E-mail lu : une question de client", complaint: "E-mail lu : une réclamation", other: "E-mail lu : ni commande ni demande" },
      sender: "Expéditeur identifié : ", noSender: "L'entreprise de l'expéditeur ne figure pas dans l'e-mail",
      items: function (n) { return n ? n + (n === 1 ? " ligne saisie" : " lignes saisies") : "Aucune ligne d'article ou de prestation trouvée" },
      missing: function (n) { return n ? (n === 1 ? "1 information manque, j'ai donc ajouté une question" : n + " informations manquent, j'ai donc ajouté des questions") + " dans la réponse" : "Toutes les informations nécessaires sont présentes" },
      sheet: "Saisi dans le tableau des commandes", reply: "Réponse préparée, en attente de votre validation"
    },
    sys: { mail: "E-mail", crm: "CRM", stock: "Stock", sheet: "Tableau des commandes" }
  },

  demoSamples: [
    {
      id: "build", fromName: "Julien Marchand", fromEmail: "j.marchand@batirythme.fr", time: "08:47",
      subject: "Commande pour le chantier de la rue des Tilleuls",
      body: "Bonjour,\n\nnous souhaitons commander le matériel suivant pour notre chantier situé 68 rue des Tilleuls à Lyon :\n- Ciment CEM II/A-LL 42,5 R, 40 sacs de 25 kg\n- Acier à béton HA500 Ø12, 1,2 t\n- Parpaings de 25 cm, 6 palettes\n\nLa livraison devrait avoir lieu le 15 octobre avant 10 h. La marchandise sera réceptionnée par notre conducteur de travaux, Marc, tél. 06 00 00 00 00.\nMerci d'établir la facture au nom de Bâti Rythme SARL.\n\nCordialement\nJulien Marchand\nService achats",
      steps: [
        ["mail", "E-mail lu : une nouvelle commande"],
        ["crm", "Client trouvé dans le CRM : Bâti Rythme SARL, facture à l'entreprise"],
        ["stock", "3 articles rapprochés du catalogue et prix vérifiés"],
        ["stock", "Stock vérifié : tous les articles sont disponibles"],
        ["sheet", "Commande saisie : 3 lignes, 2 186,00 € HT"],
        ["mail", "Confirmation au client préparée, en attente de votre validation"]
      ],
      result: {
        summary: "Nouvelle commande pour le chantier du 68 rue des Tilleuls à Lyon : 3 articles, livraison le 15 octobre avant 10 h 00. Toutes les informations sont présentes.",
        customer: "Bâti Rythme SARL", status: "ready", delivery: "15 oct. avant 10 h 00, 68 rue des Tilleuls",
        items: [["Ciment CEM II/A-LL 42,5 R, 25 kg", "40 sacs", "248,00 €"], ["Acier à béton HA500 Ø12", "1,2 t", "1 068,00 €"], ["Parpaings de 25 cm", "6 pal.", "870,00 €"]],
        missing: [],
        reply: { subject: "RE : Commande pour le chantier de la rue des Tilleuls", body: "Bonjour Monsieur Marchand,\n\nmerci pour votre commande. Nous confirmons :\n- Ciment CEM II/A-LL 42,5 R, 40 sacs : 248,00 €\n- Acier à béton HA500 Ø12, 1,2 t : 1 068,00 €\n- Parpaings de 25 cm, 6 palettes : 870,00 €\nTotal : 2 186,00 € HT\n\nNous livrons le 15 octobre avant 10 h au 68 rue des Tilleuls à Lyon. Le chauffeur appellera Marc avant son arrivée.\nLa facture sera établie au nom de Bâti Rythme SARL.\n\nExcellente journée !" }
      }
    },
    {
      id: "freight", fromName: "Sophie Lambert", fromEmail: "s.lambert@nordclean.fr", time: "09:15",
      subject: "Transport vers Bruxelles",
      body: "Bonjour,\n\nnous devons acheminer 4 palettes Europe (environ 1 800 kg) de notre entrepôt de Lille vers Bruxelles. Le chargement pourrait avoir lieu mardi prochain dans l'après-midi. Marchandise : produits d'entretien ménager, pas de matières dangereuses.\n\nQuel serait le prix, et une livraison mercredi serait-elle possible ?\n\nSophie Lambert\nNordClean Produits d'entretien SAS",
      steps: [
        ["mail", "E-mail lu : une demande de prix pour un transport"],
        ["crm", "Nouveau client, fiche créée : NordClean Produits d'entretien SAS"],
        ["mail", "Chargement saisi : 4 palettes Europe, environ 1 800 kg, pas de matières dangereuses"],
        ["mail", "3 informations manquent, sans lesquelles aucun prix ne peut être calculé"],
        ["sheet", "Demande saisie dans le tableau avec le statut « Infos manquantes »"],
        ["mail", "Réponse avec questions préparée, en attente de votre validation"]
      ],
      result: {
        summary: "Demande de prix : 4 palettes Europe (environ 1 800 kg) Lille → Bruxelles, chargement mardi prochain dans l'après-midi, livraison souhaitée mercredi.",
        customer: "NordClean Produits d'entretien SAS", status: "waiting", delivery: "Chargement mar., livraison mer.",
        items: [["Transport Lille → Bruxelles, produits d'entretien ménager (sans matières dangereuses), environ 1 800 kg", "4 pal.", "-"]],
        missing: ["Adresse exacte de chargement à Lille", "Adresse de livraison à Bruxelles et personne à contacter sur place", "Si les palettes sont gerbables (et sur quelle hauteur)"],
        reply: { subject: "RE : Transport vers Bruxelles", body: "Bonjour Madame Lambert,\n\nmerci pour votre demande. Pour vous indiquer un prix précis et confirmer la livraison de mercredi, il nous manque encore :\n1. L'adresse exacte de chargement à Lille.\n2. L'adresse de livraison à Bruxelles et une personne à contacter sur place.\n3. Les palettes sont-elles gerbables, et quelle est leur hauteur ?\n\nDès que nous aurons ces informations, nous vous enverrons le prix dans l'heure.\n\nExcellente journée !" }
      }
    },
    {
      id: "cafe", fromName: "Julie", fromEmail: "julie@cafe-aurore.fr", time: "10:02",
      subject: "commande",
      body: "bonjour, comme la dernière fois, mais avec deux fois plus de café 🙂 et ajoutez 2 cartons de gobelets en carton de 300 ml. vous avez du lait d'avoine ? si oui, 12 bouteilles.\nlivraison comme d'habitude\n\nJulie, Café Aurore",
      steps: [
        ["mail", "E-mail lu : une recommande"],
        ["crm", "Client trouvé dans le CRM : Café Aurore, 10 rue de la Gare, Nantes"],
        ["crm", "Dernière commande n° 1042 retrouvée : café 6 kg, sticks de sucre 2 cartons"],
        ["stock", "Stock vérifié : le lait d'avoine est disponible (34 bouteilles)"],
        ["sheet", "Commande saisie : 4 lignes, 343,80 € HT"],
        ["mail", "Réponse préparée avec réponse à la question, en attente de votre validation"]
      ],
      result: {
        summary: "Recommande identique à la n° 1042 avec une quantité de café doublée, plus des gobelets et du lait d'avoine. Adresse et jour de livraison habituels.",
        customer: "Café Aurore", status: "ready", delivery: "Mardi, 10 rue de la Gare",
        items: [["Café en grains « Espresso », 1 kg (comme n° 1042 × 2)", "12 pcs", "226,80 €"], ["Sticks de sucre, 1 000 pcs (comme n° 1042)", "2 cart.", "23,00 €"], ["Gobelets en carton 300 ml, 1 000 pcs", "2 cart.", "64,00 €"], ["Lait d'avoine Barista, 1 l", "12 pcs", "30,00 €"]],
        missing: [],
        reply: { subject: "RE : commande", body: "Bonjour Julie,\n\nnous avons bien reçu votre commande :\n- Café « Espresso » 1 kg : 12 pcs (deux fois plus que la dernière fois)\n- Sticks de sucre : 2 cartons\n- Gobelets en carton 300 ml : 2 cartons\n- Lait d'avoine Barista 1 l : 12 pcs (oui, nous en avons !)\nTotal : 343,80 € HT\n\nNous livrons comme d'habitude mardi au 10 rue de la Gare.\n\nExcellente journée !" }
      }
    }
  ],

  faq: {
    "dois-je payer d'avance vos prestations ?": "Nous demandons un acompte de 30 à 50 % pour démarrer, le solde étant dû à la livraison. Les automatisations en service sont ensuite maintenues moyennant un forfait mensuel couvrant le suivi, la maintenance et l'assistance.",
    "swiftrix convient-il aussi aux petites équipes et aux start-ups ?": "Tout à fait. Les petites équipes tirent souvent le plus grand bénéfice, car le travail manuel occupe chez elles une plus grande part de la journée. Chaque solution est adaptée à votre taille, à votre budget et à vos outils.",
    "avec quels outils et quelles plateformes travaillez-vous ?": "Avec pratiquement tout ce qui dispose d'une API : CRM, tableurs, e-mail, Slack, bases de données, systèmes de paiement et outils internes sur mesure. S'il existe une interface, nous pouvons généralement l'automatiser.",
    "optimisez-vous aussi les processus ou ne faites-vous que construire ?": "Les deux. Nous commençons par analyser vos processus pour éliminer les gaspillages, puis nous construisons les automatisations. L'optimisation continue fait partie de chaque projet.",
    "puis-je résilier à tout moment si je ne suis pas satisfait ?": "Oui. Il n'y a pas d'engagement de longue durée. Si nous n'apportons pas de valeur, vous pouvez arrêter à tout moment, même si la plupart des équipes choisissent de rester.",
    "qu'est-ce qui distingue swiftrix des autres prestataires ?": "Nous sommes des ingénieurs, pas une agence générique. Chaque automatisation est construite sur mesure pour vos systèmes, surveillée en continu et couverte par notre garantie de disponibilité.",
    "construisez-vous les automatisations ou ne conseillez-vous que sur la stratégie ?": "Nous construisons. La stratégie est incluse, mais vous repartez avec des automatisations opérationnelles, prêtes pour la production, et pas seulement avec une présentation de recommandations."
  },

  heroWords: ["workflows"],
  aboutLabel: "/ À PROPOS",
  aboutWords: ["agence"]
}
