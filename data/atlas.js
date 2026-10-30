(window.__ATLAS_DATA=window.__ATLAS_DATA||{})["data/atlas.json"]={
 "format": "atlas-registry/1",
 "disciplines": {
  "civil": {
   "name": "Drept civil",
   "color": "#2B5C8A"
  },
  "proc-civ": {
   "name": "Procedură civilă",
   "color": "#1F7A74"
  },
  "familie": {
   "name": "Dreptul familiei",
   "color": "#A84E3A"
  },
  "executare": {
   "name": "Executare",
   "color": "#8C6A1C"
  },
  "penal": {
   "name": "Drept penal",
   "color": "#7E2338"
  },
  "muncii": {
   "name": "Dreptul muncii",
   "color": "#3F6B2E"
  },
  "administrativ": {
   "name": "Drept administrativ",
   "color": "#5A5F8C"
  },
  "constitutional": {
   "name": "Drept constituțional",
   "color": "#6B4A2B"
  },
  "avocatura": {
   "name": "Avocatură",
   "color": "#4B4B4B"
  }
 },
 "raioane": [
  {
   "unit": "chisinau",
   "disc": "civil",
   "title": "Partea generală I",
   "about": "Codul civil, art. 1–170: dispozițiile comune și persoana fizică. Capitala hărții: de aici pornește totul.",
   "boss": "Domnul Discernământ",
   "places": [
    {
     "act": "CC",
     "role": "capital",
     "from": "1",
     "to": "170"
    }
   ],
   "short": "Partea generală I"
  },
  {
   "unit": "ialoveni",
   "disc": "civil",
   "title": "Partea generală II",
   "about": "Codul civil, art. 171–452: persoana juridică, actul juridic, reprezentarea, termenele, prescripția și publicitatea.",
   "boss": "Ceasornicarul Prescripției",
   "places": [
    {
     "act": "CC",
     "role": "capital",
     "from": "171",
     "to": "452"
    }
   ],
   "requires": "chisinau",
   "short": "Partea generală II"
  },
  {
   "unit": "straseni",
   "disc": "civil",
   "title": "Drepturile reale",
   "about": "Codul civil, Cartea a doua (art. 453–773): patrimoniul, posesiunea, proprietatea și celelalte drepturi reale.",
   "boss": "Posesorul de Rea-Credință",
   "places": [
    {
     "act": "CC",
     "role": "capital",
     "from": "453",
     "to": "773"
    }
   ],
   "short": "Drepturile reale",
   "requires": "ialoveni"
  },
  {
   "unit": "criuleni",
   "disc": "civil",
   "title": "Obligațiile. Partea generală",
   "about": "Codul civil, art. 774–1107: obligațiile în general și contractele în general.",
   "boss": "Debitorul în Întârziere",
   "places": [
    {
     "act": "CC",
     "role": "capital",
     "from": "774",
     "to": "1107"
    }
   ],
   "short": "Obligațiile",
   "requires": "straseni"
  },
  {
   "unit": "orhei",
   "disc": "civil",
   "title": "Contractele I",
   "about": "Codul civil, art. 1108–1471: de la vânzare-cumpărare la transport.",
   "boss": "Vânzătorul Evicțiunii",
   "places": [
    {
     "act": "CC",
     "role": "capital",
     "from": "1108",
     "to": "1471"
    }
   ],
   "requires": "criuleni",
   "short": "Contractele I"
  },
  {
   "unit": "telenesti",
   "disc": "civil",
   "title": "Contractele II",
   "about": "Codul civil, art. 1472–1810: de la mandat la contractele bancare.",
   "boss": "Mandatarul fără Mandat",
   "places": [
    {
     "act": "CC",
     "role": "capital",
     "from": "1472",
     "to": "1810"
    }
   ],
   "requires": "orhei",
   "short": "Contractele II"
  },
  {
   "unit": "rezina",
   "disc": "civil",
   "title": "Contractele III și fiducia",
   "about": "Codul civil, art. 1811–2161: factoringul, asigurarea, răspunderea delictuală și fiducia.",
   "boss": "Fiduciarul Infidel",
   "places": [
    {
     "act": "CC",
     "role": "capital",
     "from": "1811",
     "to": "2161"
    }
   ],
   "requires": "telenesti",
   "short": "Contractele III"
  },
  {
   "unit": "hincesti",
   "disc": "civil",
   "title": "Moștenirea I",
   "about": "Codul civil, art. 2162–2388: dispozițiile generale, moștenirea legală și testamentară.",
   "boss": "Moștenitorul Nedemn",
   "places": [
    {
     "act": "CC",
     "role": "capital",
     "from": "2162",
     "to": "2388"
    }
   ],
   "short": "Moștenirea I",
   "requires": "rezina"
  },
  {
   "unit": "leova",
   "disc": "civil",
   "title": "Moștenirea II și dreptul internațional privat",
   "about": "Codul civil, art. 2389–2671: statutul moștenitorului, rezerva succesorală și normele conflictuale.",
   "boss": "Legatarul de peste Hotare",
   "places": [
    {
     "act": "CC",
     "role": "capital",
     "from": "2389",
     "to": "2671"
    }
   ],
   "requires": "hincesti",
   "short": "Moștenirea II · DIP"
  },
  {
   "unit": "calarasi",
   "disc": "civil",
   "title": "Legile civile conexe",
   "about": "Cadastrul bunurilor imobile, procedura notarială și asigurarea obligatorie RCA.",
   "boss": "Registratorul Cadastral",
   "places": [
    {
     "act": "L1543",
     "role": "capital"
    },
    {
     "act": "L246",
     "role": "suburb"
    },
    {
     "act": "L106",
     "role": "village"
    }
   ],
   "short": "Legi conexe",
   "requires": "leova"
  },
  {
   "unit": "anenii-noi",
   "disc": "proc-civ",
   "title": "Procedura civilă I",
   "about": "Codul de procedură civilă, art. 1–356: dispozițiile generale și procedura în prima instanță.",
   "boss": "Grefiera Termenelor",
   "places": [
    {
     "act": "CPC",
     "role": "capital",
     "from": "1",
     "to": "356"
    }
   ],
   "short": "Procedura I",
   "requires": "calarasi"
  },
  {
   "unit": "causeni",
   "disc": "proc-civ",
   "title": "Procedura civilă II",
   "about": "CPC art. 357–492 (căile de atac, extraneitatea, arbitrajul), taxa de stat, medierea și organizarea judecătorească.",
   "boss": "Recurentul Tardiv",
   "places": [
    {
     "act": "CPC",
     "role": "capital",
     "from": "357",
     "to": "492"
    },
    {
     "act": "LTS",
     "role": "suburb"
    },
    {
     "act": "L9",
     "role": "suburb"
    },
    {
     "act": "L514",
     "role": "village"
    },
    {
     "act": "L76",
     "role": "village"
    }
   ],
   "requires": "anenii-noi",
   "short": "Procedura II"
  },
  {
   "unit": "nisporeni",
   "disc": "familie",
   "title": "Familia",
   "about": "Codul familiei și legile despre starea civilă, adopție, protecția copilului și violența în familie.",
   "boss": "Fostul Soț",
   "places": [
    {
     "act": "CF",
     "role": "capital"
    },
    {
     "act": "L100",
     "role": "suburb"
    },
    {
     "act": "L99",
     "role": "suburb"
    },
    {
     "act": "L140",
     "role": "village"
    },
    {
     "act": "L45",
     "role": "village"
    }
   ],
   "short": "Familia",
   "requires": "causeni"
  },
  {
   "unit": "stefan-voda",
   "disc": "executare",
   "title": "Executarea",
   "about": "Codul de executare: executarea hotărârilor civile și penale.",
   "boss": "Executorul Sechestrului",
   "places": [
    {
     "act": "CE",
     "role": "capital"
    }
   ],
   "short": "Executarea",
   "requires": "nisporeni"
  }
 ],
 "reserved": [
  {
   "unit": "balti",
   "disc": "penal"
  },
  {
   "unit": "floresti",
   "disc": "muncii"
  },
  {
   "unit": "cahul",
   "disc": "administrativ"
  },
  {
   "unit": "soroca",
   "disc": "constitutional"
  },
  {
   "unit": "ungheni",
   "disc": "avocatura"
  }
 ],
 "pendingActs": {},
 "finalBoss": {
  "name": "Decanul",
  "unit": "chisinau"
 }
};
