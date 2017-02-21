module.exports = {
  errors: {
    general: 'Es ist ein Fehler aufgetreten',
    401: 'Bitte melde Dich an, um das zu sehen',
    403: 'Du hast hierauf keinen Zugriff mit Deiner aktuellen Anmeldung',
    404: 'Hier ist nichts :('
  },
  auth: {
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    switchAccount: 'Konto wechseln',
    requestMembership: 'Mitgliedschaft anfragen',
    membershipProcessed: 'Deine Mitgliedschaft wird bearbeitet',
    membershipDenied: 'Deine Mitgliedschaft wurde abgelehnt'
  },
  language: {
    language: 'Sprache',
    de: 'Deutsch',
    en: 'Englisch'
  },
  settings: 'Einstellungen',
  overview: 'Übersicht',
  organization: {
    info: 'Organisationsinfos',
    domains: 'Organisations-Domains'
  },
  guest: {
    domains: 'Gast-Domains'
  },
  theme: 'Aussehen',
  general: 'Allgemein',
  permission: 'Berechtigung | Berechtigungen',
  name: 'Name',
  title: 'Titel',
  thisPlatform: 'Innovation Platform',
  domain: 'Domain | Domains',
  addDomain: 'Domain hinzufügen',
  user: 'Benutzer | Benutzer',
  roles: {
    admin: 'Administrator',
    member: 'Mitglied',
    guest: 'Gast',
    anyone: 'Jeder',
    applicant: 'Mitgliedschaft angefragt',
    denied: 'Abgewiesen'
  },
  changeStatus: 'Status ändern',
  elevationInfo: 'Das steigert die Wichtung im Ranking für Scorings und Likes dieses Nutzers - wirkt sich nur auf künftige Ranking-Updates aus',
  elevate: 'Erhöhen',
  unelevated: 'Nicht erhöht',
  elevated: 'Erhöht',
  resources: {
    organization: 'Organisation',
    objectives: 'Ziele',
    personal_objectives: 'Persönliche Ziele',
    ideas: 'Ideen',
    personal_ideas: 'Persönliche Ideen',
    insights: 'Erkenntnisse',
    personal_insights: 'Persönliche Erkenntnisse'
  },
  actions: {
    edit: 'Bearbeiten',
    delete: 'Entfernen',
    reset: 'Zurücksetzen',
    resetToDefaults: 'Auf Standard zurücksetzen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    restore: 'Wiederherstellen',
    downloadFile: '{file} herunterladen',
    removeFile: '{file} entfernen',
    read: 'Ansehen',
    write: 'Bearbeiten',
    search: 'Suchen',
    abort: 'Abbrechen',
    unlike: 'Mir gefällt das nicht mehr',
    like: 'Mir gefällt das'
  },
  results: {
    title: 'Zielvorgaben',
    check: 'Check',
    value: 'Wert',
    money: 'Geld',
    scorings: 'Scorings',
    ideas: 'Ideen',
    add: 'Zielvorgabe hinzufügen',
    none: 'Keine Zielvorgaben'
  },
  vision: {
    label: 'Vision Statement',
    title: 'Titel des Vision Statement',
    defaultTitle: 'Unsere Vision',
    placeholder: 'Geben Sie eine klar verständliche Zusammenfassung Ihrer Vision an'
  },
  mission: {
    label: 'Mission Statement',
    title: 'Titel des Mission Statement',
    defaultTitle: 'Unsere Mission',
    placeholder: 'Geben Sie eine klar verständliche Zusammenfassung Ihrer Mission an'
  },
  objectives: {
    title: 'Kurzer Titel des Ziels',
    this: 'Dieses Ziel',
    accusative: 'Ziele',
    personal_accusative: 'persönliche Ziele',
    accusative_one: 'eins'
  },
  ideas: {
    title: 'Kurzer Titel Deiner Idee',
    this: 'Diese Idee',
    accusative: 'Ideen',
    personal_accusative: 'persönliche Ideen',
    accusative_one: 'eine'
  },
  insights: {
    title: 'Kurzer Titel Deiner Erkenntnis',
    this: 'Diese Erkenntnis',
    accusative: 'Erkenntnisse',
    personal_accusative: 'persönliche Erkenntnisse',
    accusative_one: 'eine'
  },
  scoring: {
    title: 'Dein Scoring',
    criteria: {
      strategy: 'Strategie',
      need: 'Bedarf',
      impact: 'Einfluss',
      feasability: 'Umsetzbarkeit',
      feel: 'Gefühlt',
    },
    info: 'Bitte hilf uns beim Priorisieren, indem Du Deine persönliche Bewertung angibst - das werden nur Du und die Admins sehen können',
    help: {
      strategy: 'Wie gut passt das zur allgemeinen Vision/Mission von {organization}?',
      need: 'Wie gut passt das zu einer wichtigen Kundenanforderung?',
      impact: 'Wie hoch schätzt Du die Chancen hiervon auf dem Markt ein?',
      feasability: 'Wie einfach wird das umzusetzen sein?',
      feel: 'Wie überzeugt bist Du hiervon?',
    }
  },
  thereAreNo: 'Es gibt noch keine {accusative}',
  youDontHave: 'Du hast noch keine {accusative}',
  trashEmpty: 'Es ist nichts im Papierkorb.',
  howAbout: 'möchtest Du',
  addingOne: '{accusative_one} hinzufügen',
  fields: {
    subtitle: {
      label: 'Untertitel',
      placeholder: 'Knappe Zusammenfassung, um schnell eine Ahnung davon zu bekommen'
    },
    description: {
      label: 'Beschreibung',
      placeholder: 'Beschreibe detailliert, worum es hier geht'
    },
    title: 'Titel',
    initial: 'Anfangswert',
    target: 'Zielwert',
    image: 'Bild',
    attachments: 'Anhänge',
    created: 'Erstellt',
    updated: 'Aktualisiert',
    period: {
      label: 'Umsetzungszeitraum',
      placeholder: 'Wähle innerhalb welches Zeitraums das umgesetzt werden soll'
    },
    dueTime: 'Umsetzungszeitraum',
    rank: 'Relevanz'
  },
  file: {
    placeholder: 'Ziehe Dateien zum Upload hierher oder klicke hier.',
    errors: {
      notAdded: 'konnte nicht hinzugefügt werden | konnten nicht hinzugefügt werden',
      type: 'Falscher Dateityp',
      limit: 'Anzahl der Dateien überschritten'
    }
  },
  search: 'Suche',
  and: 'und',
  trash: 'Papierkorb',
  sort: {
    sort: 'Sortieren nach',
    order: 'Reihenfolge',
    asc: 'Aufsteigend',
    desc: 'Absteigend'
  },
  journal: {
    update: 'hat {fields} {resource} aktualisiert',
    on: 'für',
    create: 'hat {resource} hinzugefügt',
    remove: 'hat {resource} entfernt',
    restore: 'hat {resource} wiederhergestellt',
    like: 'gefällt',
    comment: 'kommentierte',
    confirmCommentDelete: 'Kommentar wirklich löschen?',
    this: 'das'
  },
  you: 'Du',
  quarter: 'Quartal',
  for: 'für',
  detail: {
    this: 'Das',
    created: 'Erstellt {ago}',
    updated: 'Aktualisiert {ago}',
    contributedBy: 'Beitrag von',
    you: 'Dir',
    likeThis: 'gefällt das',
    beFirstToLike: 'Sei der Erste, dem das gefällt',
    others: 'anderen',
    editHint: 'Bearbeite die Felder, indem Du in den Text klickst - Änderungen werden erst nach dem Speichern wirksam',
    saveHint: 'Du hast Deine Änderungen noch nicht gespeichert - klicke auf \'Speichern\' um sie zur veröffentlichen oder \'Zurücksetzen\', um sie zu verwerfen',
    readStatementsHint: 'Wir würden uns freuen, wenn Du dir Folgendes durchlesen und Deinen Beitrag damit in Einklang bringen könntest:',
    motivation: '<strong>Danke Dir {firstName},</strong><br>wir freuen uns sehr auf Deinen Beitrag - wir sind uns sicher, es wird Deine Mühe wert sein!',
    whatsAhead: 'Nachdem Du das gespeichert hast, werden es <strong>Du und die anderen</strong> sehen, liken und kommentieren können - wähle die Option unten aus, um das nur für Dich zu erstellen:',
    whatsAheadPersonal: 'Nachdem Du das gespeichert hast, wirst es <strong>nur Du</strong> sehen, liken und kommentieren können - wähle die Option unten ab, um das auch für die anderen sichtbar zu machen:',
    isPersonal: 'ist persönlich',
    isPublic: 'ist für alle sichtbar',
    makePersonal: 'persönlich machen',
    makePublic: 'öffentlich machen'
  },
  unload: {
    confirm: 'Du hast Deine Änderungen noch nicht gespeichert - willst Du fortfahren, ohne zu speichern?',
    text: 'Du hast Deine Änderungen noch nicht gespeichert - was möchtest Du tun?',
    continue: 'Fortfahren ohne zu speichern',
    save: 'Speichern und fortfahren'
  },
};
