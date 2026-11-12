# English Activity Gallery (working name)

A toolkit for ARYSE counselors: icebreakers, game-based English activities,
a day-one picture survey and a lesson planner for immigrant and refugee
students ages 11 to 21. So no counselor has to start from a blank page.

> Independent demo, not an official ARYSE website. The name, colors and logo
> are placeholders until decided. **All translations are drafts and need a
> check by native speakers before students see them.**

Built on the same setup as STEM Lesson Gallery: plain HTML, CSS and
JavaScript, with content stored as JSON so pages are built from pieces.

## Who it's for

| | |
|---|---|
| Users | Camp counselors |
| Students | Ages 11–14 and 15–21 |
| English levels | Beginner, middle, confident (every activity has all three) |
| Home languages | French, Spanish, Arabic, Swahili |

## Pages

| File | Page | What counselors do there |
|---|---|---|
| `index.html` | Home | Learn what the site is for |
| `icebreakers.html` | Icebreaker library | Filter by group size, age, level and time |
| `activities.html` | Activity library | Filter by topic, age and level; re-theme by interest |
| `planner.html` | Lesson planner | Get icebreaker + key words + phrases + game + wrap-up |
| `survey.html` | Day-one survey | Students tap pictures; counselor sees results |
| `slideshow.html` | Slideshow | Run any icebreaker, activity or full lesson full screen |
| `add.html` | Add your own | Design and share a lesson or icebreaker |

## Project structure

```
.
├── index.html, icebreakers.html, activities.html, planner.html,
│   survey.html, slideshow.html, add.html
├── style.css            # all styles; colors at the top
├── data/
│   ├── activities.json  # topics: words + translations, phrases per level, game
│   ├── icebreakers.json # icebreakers: steps, group size, minutes, say-it lines
│   └── themes.json      # interest themes + a scenario for every topic x theme
└── js/
    ├── config.js        # site name, Google Form/Sheet links, approval switch
    ├── core.js          # loads data, nav/footer, icons, helpers (every page)
    ├── icebreakers.js, activities.js, planner.js,
    ├── survey.js, slideshow.js, add.js
```

## How the pieces fit

- **Activity** = topic + level. Key words and the game stay the same; phrases
  and the game "tweak" change with the level.
- **Theme** (from the survey) re-frames the activity: Ordering food + Soccer =
  "Ordering snacks at a soccer game". See `scenarios` in `themes.json`.
- **Lesson** = an icebreaker that fits the group + one activity + a wrap-up.

To add a topic, add it to `topics` in `activities.json` and add a scenario for
it under every theme in `themes.json`.

## The picture survey

1. The counselor picks the age group (this sets which topics students can vote on).
2. Each student answers three picture questions: what they like, how much
   English they know, and what they want to learn. Then "Next student".
3. **Results** shows the totals. "Plan a lesson from this" opens the planner
   with the top interest, topic and level already picked.

Answers are saved in this browser only (`localStorage` key `eag-survey`).

## Slideshow controls

| Key | Does |
|---|---|
| Right arrow, Space, click | Next slide |
| Left arrow | Previous slide |
| 1–4 | Give team 1–4 a point (Shift + number takes one away) |
| S | Show / hide the scoreboard |
| F | Full screen |

On the key words slide, tap a language to hide or show it. Tap a phrase to
spotlight it while the group says it together.

## "Add your own": connecting Google Forms

A GitHub Pages site can't save what people type, so shared lessons go through
a Google Form that saves to a Google Sheet.

1. **Make a Google Form** with these short-answer or paragraph questions:
   Type, Title, Age, Level, Minutes, Materials, Steps, Phrases, Author.
2. In the Form's menu (three dots), choose **Get pre-filled link**, type
   something in every field, and click **Get link**. The link has parts like
   `entry.123456=...`. Copy each `entry.` number into `formFields` in
   `js/config.js`, and the form's address into `formUrl`.
3. **Link the Form to a Sheet** (Responses tab > Link to Sheets). In the Sheet,
   add a column called **Approved**.
4. In the Sheet: **File > Share > Publish to web**, pick the responses sheet and
   **CSV**, then paste that link into `sheetCsvUrl`.
5. With `requireApproval: true`, a submission appears on the site only after
   someone types **yes** in its Approved cell. Set it to `false` to show
   everything right away.

Until this is set up, counselors can still design an idea and **Copy as text**
or **Save file**.

## Run it on your computer

Pages load JSON, so use a local server instead of double-clicking:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Publish with GitHub Pages

Same as STEM Lesson Gallery: push to a public repo, then
**Settings > Pages > Deploy from a branch > main / (root)**.
Check the open questions below before making it public.

## Open questions

- [ ] Which home languages come up most at ARYSE? (Started with French, Spanish, Arabic, Swahili.)
- [ ] Name, colors and logo for this site
- [ ] Does ARYSE need to approve the site before it goes public?
- [ ] Should counselor-added lessons show up right away, or be checked first? (Default: checked first.)
