export type Lang = 'en' | 'lt' | 'de';

export type Text = {
  lang: string; // name of the language, shown in the switcher
  h1: string;
  intro: string;
  email: string;
  password: string;
  passwordHint: string;
  show: string;
  experience: string;
  experiencePh: string;
  consent: string;
  privacyLink: string;
  dataNote: string;
  submit: string;
  sending: string;
  doneTitle: string;
  doneBody: string;
  signIn: string;
  errors: Record<string, string>;
};

export const TEXT: Record<Lang, Text> = {
  en: {
    lang: 'English',
    h1: 'Apply as a sales partner',
    intro: 'Leave your email, choose a password for the Swiftrix sales tool and tell us about your experience. We review every application. Once you are approved, you can sign in with these details.',
    email: 'Email',
    password: 'Choose a password',
    passwordHint: 'At least 10 characters. Use one you do not use anywhere else.',
    show: 'Show password',
    experience: 'Your experience',
    experiencePh: 'Sales, phone work, customer service, anything relevant. If you have none yet, just say so.',
    consent: 'I have read the privacy notice and agree that Swiftrix stores these details to review my application.',
    privacyLink: 'Privacy notice',
    dataNote: 'We store your email, a hashed password and your answer. If you are not approved, we delete them within 6 months.',
    submit: 'Send application',
    sending: 'Sending...',
    doneTitle: 'Thank you, we have your application.',
    doneBody: 'We will review it and get back to you by email or on LinkedIn. You can sign in at app.swiftrix.eu/login once you are approved.',
    signIn: 'Already approved? Sign in',
    errors: {
      consent: 'Please confirm that you have read the privacy notice.',
      email: 'Please enter a valid email address.',
      password_short: 'The password must be at least 10 characters.',
      password_long: 'The password is too long (72 bytes at most).',
      experience_short: 'Please tell us a little about your experience.',
      experience_long: 'Please keep your experience under 1,500 characters.',
      rate: 'We are receiving a lot of applications right now. Please try again later.',
      unavailable: 'Applications are not possible right now. Please try again later.',
      generic: 'Something went wrong. Please try again.',
    },
  },
  lt: {
    lang: 'Lietuvių',
    h1: 'Paraiška pardavimų partnerio vaidmeniui',
    intro: 'Palikite el. paštą, pasirinkite slaptažodį Swiftrix pardavimų įrankiui ir papasakokite apie savo patirtį. Peržiūrime kiekvieną paraišką. Kai ją patvirtinsime, galėsite prisijungti naudodami šiuos duomenis.',
    email: 'El. paštas',
    password: 'Pasirinkite slaptažodį',
    passwordHint: 'Bent 10 simbolių. Nenaudokite slaptažodžio, kurį naudojate kitur.',
    show: 'Rodyti slaptažodį',
    experience: 'Jūsų patirtis',
    experiencePh: 'Pardavimai, darbas telefonu, klientų aptarnavimas ar bet kas, kas aktualu. Jei patirties dar neturite, tiesiog parašykite.',
    consent: 'Perskaičiau privatumo pranešimą ir sutinku, kad Swiftrix saugotų šiuos duomenis, kad galėtų išnagrinėti mano paraišką.',
    privacyLink: 'Privatumo pranešimas',
    dataNote: 'Saugome jūsų el. paštą, užšifruotą slaptažodį ir jūsų atsakymą. Jei paraiška nebus patvirtinta, per 6 mėnesius juos ištrinsime.',
    submit: 'Siųsti paraišką',
    sending: 'Siunčiama...',
    doneTitle: 'Ačiū, gavome jūsų paraišką.',
    doneBody: 'Peržiūrėsime ją ir susisieksime el. paštu arba „LinkedIn“. Kai paraišką patvirtinsime, galėsite prisijungti adresu app.swiftrix.eu/login.',
    signIn: 'Jau patvirtinta? Prisijungti',
    errors: {
      consent: 'Patvirtinkite, kad perskaitėte privatumo pranešimą.',
      email: 'Įveskite teisingą el. pašto adresą.',
      password_short: 'Slaptažodį turi sudaryti bent 10 simbolių.',
      password_long: 'Slaptažodis per ilgas (daugiausia 72 baitai).',
      experience_short: 'Trumpai papasakokite apie savo patirtį.',
      experience_long: 'Patirties aprašymas turi būti trumpesnis nei 1 500 simbolių.',
      rate: 'Šiuo metu gauname labai daug paraiškų. Pabandykite vėliau.',
      unavailable: 'Paraiškos šiuo metu nepriimamos. Pabandykite vėliau.',
      generic: 'Kažkas nepavyko. Pabandykite dar kartą.',
    },
  },
  de: {
    lang: 'Deutsch',
    h1: 'Bewerbung als Vertriebspartner',
    intro: 'Hinterlassen Sie Ihre E-Mail-Adresse, wählen Sie ein Passwort für das Swiftrix-Vertriebstool und erzählen Sie uns von Ihrer Erfahrung. Wir prüfen jede Bewerbung. Sobald wir sie freigegeben haben, können Sie sich mit diesen Angaben anmelden.',
    email: 'E-Mail-Adresse',
    password: 'Passwort wählen',
    passwordHint: 'Mindestens 10 Zeichen. Verwenden Sie ein Passwort, das Sie sonst nirgends nutzen.',
    show: 'Passwort anzeigen',
    experience: 'Ihre Erfahrung',
    experiencePh: 'Vertrieb, Telefonarbeit, Kundenservice oder alles, was passt. Wenn Sie noch keine Erfahrung haben, schreiben Sie das einfach.',
    consent: 'Ich habe die Datenschutzhinweise gelesen und bin damit einverstanden, dass Swiftrix diese Angaben speichert, um meine Bewerbung zu prüfen.',
    privacyLink: 'Datenschutzhinweise',
    dataNote: 'Wir speichern Ihre E-Mail-Adresse, ein verschlüsseltes Passwort und Ihre Antwort. Wenn Sie nicht freigegeben werden, löschen wir sie innerhalb von 6 Monaten.',
    submit: 'Bewerbung senden',
    sending: 'Wird gesendet ...',
    doneTitle: 'Vielen Dank, wir haben Ihre Bewerbung erhalten.',
    doneBody: 'Wir prüfen sie und melden uns per E-Mail oder auf LinkedIn. Nach der Freigabe können Sie sich unter app.swiftrix.eu/login anmelden.',
    signIn: 'Schon freigegeben? Anmelden',
    errors: {
      consent: 'Bitte bestätigen Sie, dass Sie die Datenschutzhinweise gelesen haben.',
      email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      password_short: 'Das Passwort muss mindestens 10 Zeichen lang sein.',
      password_long: 'Das Passwort ist zu lang (höchstens 72 Byte).',
      experience_short: 'Bitte schreiben Sie kurz etwas zu Ihrer Erfahrung.',
      experience_long: 'Bitte fassen Sie sich kürzer (höchstens 1.500 Zeichen).',
      rate: 'Wir erhalten gerade sehr viele Bewerbungen. Bitte versuchen Sie es später noch einmal.',
      unavailable: 'Bewerbungen sind derzeit nicht möglich. Bitte versuchen Sie es später noch einmal.',
      generic: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es noch einmal.',
    },
  },
};
