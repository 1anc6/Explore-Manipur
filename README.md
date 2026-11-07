# Explore Manipur

**Explore Manipur** is a student-built travel site about Manipur: its places, culture, food and sport, with tools for planning a visit.

It is plain HTML, CSS and JavaScript with no build step. Motion comes from GSAP, ScrollTrigger and Lenis, and the map from Leaflet with OpenStreetMap tiles, all loaded from public CDNs. Every page stays readable without JavaScript or with reduced motion turned on.

## Pages

| Page | What is on it |
| --- | --- |
| `index.html` | Home. Loktak's round phumdi opens into a full-screen photo as you scroll. Destinations slider, Grimwood quote, live Imphal weather, local time, a Sangai Festival countdown, festivals, food |
| `places.html` | Interactive map of 14 places, filters, and a detail view for each place (time needed, best season, how to get there, OpenStreetMap link) |
| `culture.html` | Ras Leela, Lai Haraoba, Sankirtana, Thang-Ta, crafts, a full festival calendar, Manipur's peoples |
| `cuisine.html` | Flavours, dishes with a vegetarian, fish, sweet and snack filter, a singju recipe, where to eat |
| `sports.html` | Polo's birthplace, traditional games, Manipur's champions |
| `plan.html` | Trip planner (3, 5 or 7 days, by interest; copy or email the plan), live weather, permits and travel essentials, seasons, Meiteilon phrases, a packing list that remembers your ticks |
| `quiz.html` | A 10-question quiz with a photo for each question; your best score is kept |
| `credits.html` | Credit and licence for every photograph |

## Files

```
assets/css/main.css      all styles
assets/js/core.js        scrolling, menu, sliders, filters, lightbox, animation
assets/js/features.js    map, planner, weather, clock, countdown, packing list, quiz
assets/photos/           photos: name.jpg (large) and name-m.jpg (phone size)
assets/src/credits.json  source, author and licence for each downloaded photo
```

## Run it locally

```bash
python -m http.server 5517
```

Then open http://localhost:5517.

## Notes

- Live weather comes from Open-Meteo (no key needed). When it can't be reached, the page shows typical temperatures for the month instead.
- Festival dates follow the lunar calendar and change every year. The Sangai Festival usually runs from 21 to 30 November.
- Photographs come from Wikimedia Commons and Openverse under Creative Commons licences (see `credits.html`). A few come from the original project.
