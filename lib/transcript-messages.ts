export const TRANSCRIPT_MESSAGES = {
  empty:
    "Vnesite transkript sestanka. Prilepite besedilo ali naložite datoteko (.txt, .pdf, .docx).",
  tooLong: (max: number) =>
    `Transkript je predolg (največ ${max.toLocaleString("sl-SI")} znakov). Skrajšajte besedilo.`,
  fileMissing: "Datoteka ni bila poslana. Poskusite znova ali prilepite besedilo ročno.",
  fileTooLarge:
    "Datoteka je prevelika (največ 5 MB). Prilepite besedilo ročno ali uporabite manjšo datoteko.",
  fileUnsupported:
    "Ta vrsta datoteke ni podprta. Dovoljene so datoteke .txt, .pdf in .docx.",
  extractFailed:
    "Besedila iz datoteke ni bilo mogoče prebrati. Prilepite transkript ročno v polje spodaj.",
} as const;
