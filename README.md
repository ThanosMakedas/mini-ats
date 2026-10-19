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
| Backend | Supabase: PostgreSQL, Auth och Edge Functions |
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

## Antaganden

- Ett kundkonto motsvarar ett företag, med en användare per företag i den här versionen.
- En kandidat hör till ett jobb. Söker samma person två jobb läggs hen in två gånger.
- Stegen på tavlan är fasta och samma för alla kunder.
- Konton skapas bara av en admin, som lämnar inloggningsuppgifterna till kunden.
  Appen skickar inga e-postmeddelanden.
- CV-filer laddas inte upp, profilen består av LinkedIn-länk, kontaktuppgifter och anteckningar.
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
npx supabase functions deploy create-user set-password --use-api
```

`db push` skapar tabeller, regler och triggers från `supabase/migrations`.
`functions deploy` publicerar de två Edge Functions från `supabase/functions`.

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
  migrations/       Databasschema, Row Level Security och triggers
  functions/        Edge Functions: create-user och set-password
  config.toml       Supabase-inställningar
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
- Uppladdning av CV och AI-stöd för att bedöma CV mot jobbets krav
- Egna steg på tavlan per kund
- E-postinbjudan i stället för att admin delar lösenordet
