# Min tu dîtî

An interactive quiz for practicing transitivity and split ergativity in Kurmanji (nominative vs. oblique pronouns and nouns, verb agreement in present and past tenses, plural agents and patients, perfect, pluperfect and past progressive, relative clauses).

The whole interface is in Kurmanji. Each question shows the English translation, a sentence with dropdown gaps (whole words, several words or only a suffix; "(vala)" selects a blank), feedback with a short explanation after checking, and a results page at the end. Levels: Hêsan, Navîn, Zor, Tevlihev.

## Running

The questions are loaded with `fetch`, so the page must be served over HTTP (opening `index.html` from the file system will not work):

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Files

- `index.html` – page markup
- `css/style.css` – styles (light and dark)
- `js/app.js` – quiz logic
- `data/questions.json` – questions

## Question format

```json
{
	"id": "e02",
	"level": "easy",
	"translation": "I saw you.",
	"parts": [
		{ "options": ["Ez", "Min"], "answer": "Min" },
		" ",
		{ "options": ["tu", "te"], "answer": "tu" },
		" dît",
		{ "options": ["im", "î", "in"], "answer": "î", "suffix": true },
		"."
	],
	"explanation": "..."
}
```

- `level`: `easy`, `medium` or `hard`.
- `parts`: plain strings are fixed text; objects are gaps. Spacing is written explicitly in the strings, so a suffix gap follows its stem directly.
- `answer`: a string or an array of accepted strings. `""` means the blank "(vala)" option is correct. The blank option is always added automatically, so it is not listed in `options`.
- `suffix`: optional, shows options with a leading hyphen.
