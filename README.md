# Bevis Impact Foundation website

A redesign of https://bevis-impact-foundation-site.vercel.app/. It is a static site: one HTML page, one stylesheet and two small scripts. There is no build step and nothing to install.

```
index.html               the page
css/styles.css           all styles (colour and type tokens at the top)
js/main.js               animations, the accordion, the Myth or fact quiz, the menu, the two forms
js/firebase-config.js    Firebase keys (two values to paste, see below)
assets/img/              photographs (all openly licensed, credited in the footer)
assets/favicon.svg
```

## See it locally

Double-click `index.html`, or serve the folder:

```
python3 -m http.server 8080    # then open http://localhost:8080
```

## Deploy to Vercel

Either drag the folder into vercel.com/new, or run `npx vercel` from inside it. Use the framework preset **Other**, with no build command and the root folder as output. `.vercelignore` keeps the working folders (`_original/`, `.taste-skill/`) out of the deployment.

## Switch the forms on (Firebase)

The two forms write to the same Firestore collections as the old site:

| Form | Collection | Fields |
| --- | --- | --- |
| Ask for testing support | `testingRequests` | name, age, province, need, message, createdAt, source = "website", status = "new" |
| Get updates | `newsletterSignups` | email, createdAt |

The old site's deployed config had a truncated API key (`AIzaSy...`), so its submissions were most likely failing.

1. Firebase console → Project settings → Your apps → Web app → copy `apiKey` and `appId`.
2. Paste them into `js/firebase-config.js`, replacing the two `PASTE_…` values.
3. Make sure the Firestore rules let the public **create** documents but never read them. For example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /testingRequests/{id} {
      allow create: if request.resource.data.keys().hasOnly(['name','age','province','need','message','createdAt','source','status'])
        && request.resource.data.name is string && request.resource.data.name.size() < 100
        && request.resource.data.message is string && request.resource.data.message.size() < 2000
        && request.resource.data.createdAt == request.time;
      allow read, update, delete: if false;
    }
    match /newsletterSignups/{id} {
      allow create: if request.resource.data.keys().hasOnly(['email','createdAt'])
        && request.resource.data.email is string && request.resource.data.email.size() < 200
        && request.resource.data.createdAt == request.time;
      allow read, update, delete: if false;
    }
  }
}
```

Until the keys are pasted, both forms still work: they offer to send the same details by email to hello@bevisimpactfoundation.org instead.

## Content to confirm before launch

- **Remove the `noindex` line** near the top of `index.html`. It is only there so the GitHub Pages test preview stays out of search engines.

- **Testimonials** (Sarah M., John K., Maria T.) came from the old site. Confirm they are real and that each person agreed to be quoted next to HIV testing. If not, remove them.
- **Form privacy line**: "We use these details only to get back to you about this request." Make sure it matches how requests are actually handled.
- **"We get back to you"** and **"self-testing access is on the way"** describe services. Keep them only if they are true.
- **Phone number**: the old site showed `+260 000 000 000`, so it was left off. Add a real number to the footer if there is one.
- **Social links**: the old footer had three icons linking to `#`. Add real links to the footer if wanted.
- **Statistics** are from the ZAMPHIA 2021 summary sheet (Zambia Ministry of Health with CDC and ICAP, December 2022): https://stacks.cdc.gov/view/cdc/133880. Update them when a newer survey is published.
- **Health facts** in the Myth or fact quiz and the testing steps are general, standard guidance. Have someone clinical review them.

## Photographs

None of the photographs are of the foundation's own work or people. They show Zambia (Lusaka, Mansa and a rural road), students at the University of Zambia seen from a distance, and HIV rapid test kits. They are all credited in the footer. Replace them with the foundation's own photographs when you have them (and consent from anyone shown), keeping the same file names or updating the `src` attributes.

| File | Source | Licence |
| --- | --- | --- |
| university-students-on-the-move.jpg | Duke Makangila, Wikimedia Commons | CC BY-SA 4.0 |
| lusaka-aero-view-01.jpg, lusaka-aero-view-17.jpg | Icem4k, Wikimedia Commons | CC BY-SA 4.0 |
| hiv-rapid-test-on-table.jpg | varnent / LGBT Free Media Collective, Wikimedia Commons | CC BY-SA 3.0 |
| hiv-test-kit.jpg | Mailane vanesa, Wikimedia Commons | CC0 |
| zambia-farm-produce-going-to-the-market.jpg | Thatlowdownwoman, Wikimedia Commons | CC BY-SA 4.0 |
| hiv-rapid-test-kit-orasure.jpg | Wheeler Cowperthwaite, Wikimedia Commons | CC BY-SA 2.0 |
| marketplace-in-mansa-zambia-1.jpg | Isaacgerg, Wikimedia Commons | CC BY 3.0 |

## Old links still work

Anchors from the old site (`#about`, `#programs`, `#get-tested`, `#resources`, `#impact`, `#testimonials`, `#involved`, `#contact`) still land on the matching section.
