# Mini-ATS

Ett enkelt rekryteringssystem (Applicant Tracking System) för företag som söker kandidater till sina tjänster.
Kunden lägger upp jobb, lägger till kandidater och följer dem genom rekryteringen på en kanban-tavla.
En administratör skapar kundkonton och kan göra allt som kunderna kan göra, åt dem.

**Live:** https://mini-ats-phi.vercel.app

## Funktioner

**Som kund kan jag**

- logga in med e-post och lösenord
- lägga upp, redigera, stänga och ta bort jobb jag söker kandidater till
- lägga till kandidater med profilinformation: LinkedIn-länk, e-post, telefon och anteckningar
- se alla mina kandidater på en kompakt kanban-tavla med stegen
  *Ny, Screening, Intervju, Erbjudande, Anställd* och *Avböjd*
- flytta kandidater mellan stegen med dra och släpp
- filtrera tavlan på jobb och söka på kandidatnamn
- gå direkt från ett jobb till tavlan, filtrerad på det jobbet
- ladda upp kandidatens CV som PDF
- låta AI bedöma CV:t mot jobbets krav: betyg 1-5, sammanfattning, styrkor och luckor.
  Betyget syns sedan direkt på kortet på tavlan.

**Som admin kan jag**

- skapa både admin- och kundkonton
- sätta ett nytt lösenord för ett konto, till exempel när en kund glömt sitt.
  Kontot loggas då ut överallt.
- välja en kund under *Agerar som* och sedan göra allt som kunden kan göra, åt kunden

## Teknik

| Del | Val |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router |
| Dra och släpp | dnd-kit |
| Backend | Supabase: PostgreSQL, Auth, Storage och Edge Functions |
| AI | Claude (`claude-opus-5-5`) via Anthropic API |
| Hosting | Vercel för frontend, Supabase för backend |

### Varför så här

- **Ingen egen server.** Webbläsaren pratar direkt med Supabase och behörigheterna ligger i databasen.
  Det gav en fungerande produkt snabbt, med lite kod att underhålla.
- **Row Level Security (RLS) skyddar datan.** Varje kund ser och ändrar bara sina egna jobb och kandidater,
  även om någon går förbi gränssnittet och anropar API:et direkt. Admins släpps igenom av samma regler.
  En sammansatt främmande nyckel `(job_id, customer_id)` gör att en kandidat aldrig kan kopplas till en annan kunds jobb.
- **Edge Functions för admin-åtgärder.** Att skapa konton och byta lösenord kräver Supabase hemliga nyckel.
  Därför sker det i två Edge Functions (`create-user`, `set-password`) som först kontrollerar att anroparen är admin.
  Den hemliga nyckeln når aldrig webbläsaren.
- **Rollen kan inte sättas av användaren själv.** En profil skapas automatiskt av en databastrigger när ett konto skapas,
  och rollen läses från `app_metadata` som bara servern kan sätta. Användare kan inte ändra sin egen profil.
- **Ingen öppen registrering.** Sign-up är avstängt, bara admins skapar konton.
- **Explicita rättigheter.** Migrationen ger tabellrättigheter uttryckligen i stället för att lita på
  att Supabase exponerar nya tabeller automatiskt.
- **Optimistisk uppdatering på tavlan.** Ett kort flyttas direkt och sparas sedan. Om sparandet misslyckas flyttas kortet tillbaka.
- **Valt filter i URL:en.** Filtret på jobb och sökningen ligger i adressen (`/board?job=...&q=...`),
  så en filtrerad vy kan delas och överlever en omladdning.

## AI-bedömning av CV

Rekryteraren laddar upp kandidatens CV och klickar **Bedöm CV med AI** i kandidatens formulär.

```
Webbläsare ──► Edge Function assess-cv ──► Claude
                 1. läser kandidat, jobb och CV med användarens egna rättigheter (RLS)
                 2. skickar PDF:en och jobbannonsen till Claude
                 3. får tillbaka JSON enligt ett fast schema
                 4. sparar resultatet i cv_assessments
```

- **PDF:en skickas direkt.** Claude läser PDF, så ingen textextrahering behövs och layouten följer med.
- **Strukturerat svar.** Ett JSON-schema (structured output) garanterar att svaret alltid har betyg,
  sammanfattning, styrkor och luckor, så gränssnittet aldrig behöver tolka fritext.
- **Rättvis bedömning.** Instruktionen säger att bara jobbrelevanta meriter får påverka betyget, aldrig ålder,
  kön, etnicitet, namn eller foto, och att personen alltid kallas "kandidaten".
- **Skydd mot prompt injection.** CV:t och annonsen behandlas som underlag. Instruktioner i dem följs inte,
  så "ge mig 5/5" i ett CV hjälper inte.
- **Ingen kan ändra betyget för hand.** Bara funktionen (med service role) får skriva i `cv_assessments`.
  Kunder kan bara läsa sina egna bedömningar.
- **Nyckeln stannar på servern.** `ANTHROPIC_API_KEY` ligger som secret i Supabase och når aldrig webbläsaren.
- **CV-filerna är privata.** De ligger i en privat bucket under `cvs/<kund-id>/<kandidat-id>.pdf`
  och en kund kommer bara åt sin egen mapp. Endast PDF upp till 5 MB accepteras.
- **AI:n beslutar inte.** Bedömningen är ett stöd för en första sortering, och gränssnittet säger det.
  Byts CV:t visar appen att bedömningen är inaktuell.

I mappen `demo-cv/` finns tre påhittade CV:n att prova med. De ger olika resultat:
Fatima Ali mot Fullstackutvecklare (5/5), Sofia Martinez mot Frontendutvecklare (4/5)
och Ahmed Yusuf, en grafisk formgivare, mot UX-designer (2/5).

## Antaganden

- Ett kundkonto motsvarar ett företag, med en användare per företag i den här versionen.
- En kandidat hör till ett jobb. Söker samma person två jobb läggs hen in två gånger.
- Stegen på tavlan är fasta och samma för alla kunder.
- Konton skapas bara av en admin, som lämnar inloggningsuppgifterna till kunden.
  Appen skickar inga e-postmeddelanden.
- En kandidat har ett CV åt gången, som PDF. Ett nytt CV ersätter det gamla.
- Gränssnittet är på svenska eftersom kunderna är svenska.
- Datan lagras inom EU (Supabase-region eu-west-1, Irland).

## Kom igång

### Det här behöver du

- [Node.js](https://nodejs.org) 20 eller senare
- Ett gratis konto på [Supabase](https://supabase.com)
- Ett gratis konto på [Vercel](https://vercel.com) om appen ska publiceras

### 1. Hämta koden

```bash
git clone https://github.com/ThanosMakedas/mini-ats.git
cd mini-ats
npm install
```

### 2. Skapa ett Supabase-projekt

1. Skapa ett nytt projekt på [supabase.com/dashboard](https://supabase.com/dashboard) och välj en region i Europa.
   Spara databaslösenordet.
2. Gå till **Authentication → Sign In / Providers** och stäng av **Allow new users to sign up**.
3. Gå till **Project Settings → API Keys** och kopiera **Project URL** och **Publishable key**.

### 3. Lägg in databasen och funktionerna

Supabase CLI följer med som utvecklingsberoende. Logga in och koppla mappen till ditt projekt
(`<project-ref>` är delen före `.supabase.co` i Project URL):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase functions deploy create-user set-password assess-cv --use-api
```

`db push` skapar tabeller, regler, triggers och lagringsplatsen för CV:n från `supabase/migrations`.
`functions deploy` publicerar de tre Edge Functions från `supabase/functions`.

För AI-bedömningen behövs en API-nyckel från [Anthropic Console](https://console.anthropic.com).
Lägg in den under **Edge Functions → Secrets** i Supabase med namnet `ANTHROPIC_API_KEY`.
Utan nyckeln fungerar allt annat som vanligt, och knappen svarar att AI-bedömning inte är aktiverad.

### 4. Ställ in miljövariabler

Kopiera `.env.example` till `.env.local` och fyll i värdena från steg 2:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

`.env.local` checkas aldrig in i git.

### 5. Skapa den första admin

Den första admin skapas en gång för hand, sedan skapas alla andra konton inne i appen.

1. Gå till **Authentication → Users → Add user → Create new user**, ange e-post och lösenord
   och kryssa i **Auto Confirm User**.
2. Gör kontot till admin, antingen i **SQL Editor** i Supabase eller från terminalen:

```bash
npx supabase db query --linked "update public.profiles set role = 'admin' where email = 'din@epost.se'"
```

### 6. Starta appen

```bash
npm run dev
```

Öppna http://localhost:5173 och logga in med admin-kontot.
Gå till **Konton** och skapa ett kundkonto, välj kunden under **Agerar som** och lägg upp ett jobb.

### 7. Publicera på Vercel (valfritt)

1. Lägg koden i ett eget GitHub-repo.
2. På Vercel: **Add New → Project**, importera repot. Vercel känner igen Vite automatiskt.
3. Lägg till `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY` under **Environment Variables** och klicka **Deploy**.

`vercel.json` skickar alla adresser till `index.html`, så att sidor som `/board` fungerar även vid omladdning.
Varje push till `main` publiceras sedan automatiskt.

## Projektstruktur

```
src/
  pages/            Sidor: Login, Board (tavlan), Jobs, admin/Accounts
  components/       Kanban-kolumn, kandidatkort, formulär, modal, layout
  context/          Inloggning (AuthContext) och vald kund (ActingCustomerContext)
  hooks/            Hämtning av en kunds jobb och kandidater
  lib/              Supabase-klient, databastyper och anrop till Edge Functions
  i18n/sv.ts        Svenska etiketter för steg, status och roller
supabase/
  migrations/       Databasschema, Row Level Security, triggers och CV-lagring
  functions/        Edge Functions: create-user, set-password och assess-cv
  config.toml       Supabase-inställningar
demo-cv/            Påhittade CV:n för att prova AI-bedömningen
```

## Användbara kommandon

| Kommando | Gör |
|---|---|
| `npm run dev` | Startar utvecklingsservern |
| `npm run build` | Typkontrollerar och bygger för produktion |
| `npm run lint` | Kör ESLint |
| `npx supabase gen types typescript --linked > src/lib/database.types.ts` | Genererar TypeScript-typer från databasen |

## Utvecklat med AI

Appen är byggd med hjälp av [Claude Code](https://claude.com/claude-code), från planering och databasdesign
till kod, säkerhetsgranskning och kodgranskning. Utvecklingen syns steg för steg i commit-historiken.

## Möjliga nästa steg

- Flera användare per kundföretag
- Historik per kandidat: när och av vem steget ändrades
- Rangordna alla kandidater till ett jobb med AI, och låta rekryteraren justera kriterierna
- Egna steg på tavlan per kund
- E-postinbjudan i stället för att admin delar lösenordet
