const DATA_URL = "data/questions.json";
const MIXED_COUNT = 15;
const BLANK_LABEL = "(vala)";
const PLACEHOLDER_LABEL = "…";

const LEVELS = [
	{ key: "easy", label: "Hêsan" },
	{ key: "medium", label: "Navîn" },
	{ key: "hard", label: "Zor" },
	{ key: "mixed", label: "Tevlihev" }
];

const state = {
	all: [],
	level: "",
	questions: [],
	index: 0,
	results: [],
	selects: []
};

const $ = (id) => document.getElementById(id);

// Fisher-Yates shuffle on a copy
function shuffle(list) {
	const copy = list.slice();
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = copy[i];
		copy[i] = copy[j];
		copy[j] = tmp;
	}
	return copy;
}

function isGap(part) {
	return typeof part === "object" && part !== null;
}

function acceptedAnswers(gap) {
	return Array.isArray(gap.answer) ? gap.answer : [gap.answer];
}

function isGapCorrect(gap, value) {
	return acceptedAnswers(gap).includes(value);
}

function optionLabel(gap, value) {
	if (value === "") {
		return BLANK_LABEL;
	}
	return gap.suffix === true ? "-" + value : value;
}

// Returns sentence segments; gap segments carry their correctness for highlighting
function buildSegments(question, values) {
	let gapIndex = 0;
	return question.parts.map((part) => {
		if (isGap(part)) {
			const value = values[gapIndex];
			gapIndex++;
			return { text: value, gap: true, correct: isGapCorrect(part, value) };
		}
		return { text: part, gap: false, correct: true };
	});
}

function renderSegments(container, segments) {
	container.textContent = "";
	segments.forEach((segment) => {
		if (segment.gap === false) {
			container.appendChild(document.createTextNode(segment.text));
		} else if (segment.correct === false) {
			const mark = document.createElement("mark");
			mark.className = "wrong";
			mark.textContent = segment.text === "" ? BLANK_LABEL : segment.text;
			container.appendChild(mark);
		} else if (segment.text !== "") {
			const mark = document.createElement("mark");
			mark.textContent = segment.text;
			container.appendChild(mark);
		}
	});
}

function correctValues(question) {
	return question.parts.filter(isGap).map((gap) => acceptedAnswers(gap)[0]);
}

function showScreen(id) {
	["screen-start", "screen-quiz", "screen-results"].forEach((screenId) => {
		$(screenId).hidden = screenId !== id;
	});
	window.scrollTo(0, 0);
}

function levelLabel(key) {
	const found = LEVELS.find((level) => level.key === key);
	return found === undefined ? "" : found.label;
}

function pickQuestions(level) {
	if (level === "mixed") {
		return shuffle(state.all).slice(0, MIXED_COUNT);
	}
	return shuffle(state.all.filter((q) => q.level === level));
}

function startQuiz(level) {
	state.level = level;
	state.questions = pickQuestions(level);
	state.index = 0;
	state.results = [];
	if (state.questions.length === 0) {
		return;
	}
	$("quiz-level").textContent = "Derece: " + levelLabel(level);
	showScreen("screen-quiz");
	renderQuestion();
}

function createSelect(gap) {
	const select = document.createElement("select");
	select.className = gap.suffix === true ? "gap suffix" : "gap";
	select.setAttribute("aria-label", gap.suffix === true ? "Dawî" : "Peyv");

	const placeholder = document.createElement("option");
	placeholder.value = "";
	placeholder.textContent = PLACEHOLDER_LABEL;
	placeholder.disabled = true;
	placeholder.selected = true;
	select.appendChild(placeholder);

	const values = shuffle(gap.options.filter((option) => option !== ""));
	values.push("");
	values.forEach((value) => {
		const option = document.createElement("option");
		option.value = value;
		option.textContent = optionLabel(gap, value);
		select.appendChild(option);
	});

	select.addEventListener("change", () => {
		$("hint").hidden = true;
	});
	return select;
}

function renderQuestion() {
	const question = state.questions[state.index];
	const total = state.questions.length;

	$("quiz-progress").textContent = "Pirs " + (state.index + 1) + " / " + total;
	$("progress-bar").style.width = (state.index / total * 100) + "%";
	$("translation").textContent = question.translation;

	const sentence = $("sentence");
	sentence.textContent = "";
	state.selects = [];
	question.parts.forEach((part) => {
		if (isGap(part)) {
			const select = createSelect(part);
			state.selects.push(select);
			sentence.appendChild(select);
		} else {
			sentence.appendChild(document.createTextNode(part));
		}
	});

	$("hint").hidden = true;
	$("feedback").hidden = true;
	$("btn-check").hidden = false;
	$("btn-next").hidden = true;
	state.selects[0].focus();
}

function checkAnswer() {
	const unanswered = state.selects.some((select) => select.selectedIndex === 0);
	if (unanswered === true) {
		$("hint").hidden = false;
		return;
	}

	const question = state.questions[state.index];
	const gaps = question.parts.filter(isGap);
	const values = state.selects.map((select) => select.value);
	let allCorrect = true;

	state.selects.forEach((select, i) => {
		const correct = isGapCorrect(gaps[i], values[i]);
		if (correct === false) {
			allCorrect = false;
		}
		select.classList.add(correct === true ? "is-correct" : "is-wrong");
		select.disabled = true;
	});

	state.results.push({ question: question, values: values, correct: allCorrect });

	const verdict = $("verdict");
	verdict.textContent = allCorrect === true ? "Rast e!" : "Xelet e.";
	verdict.className = allCorrect === true ? "verdict ok" : "verdict bad";
	renderSegments($("correct-sentence"), buildSegments(question, correctValues(question)));
	$("explanation").textContent = question.explanation;
	$("feedback").hidden = false;

	const isLast = state.index === state.questions.length - 1;
	$("btn-next").textContent = isLast === true ? "Netîceyê bibîne" : "Pirsa din";
	$("btn-check").hidden = true;
	$("btn-next").hidden = false;
	$("btn-next").focus();
}

function nextQuestion() {
	if (state.index < state.questions.length - 1) {
		state.index++;
		renderQuestion();
		return;
	}
	renderResults();
}

function renderResults() {
	const total = state.results.length;
	const correctCount = state.results.filter((r) => r.correct === true).length;
	const percent = total === 0 ? 0 : Math.round(correctCount / total * 100);
	$("score").textContent = "Derece: " + levelLabel(state.level) + ". " + correctCount + " ji " + total + " pirsan rast in (" + percent + "%).";

	const list = $("results");
	list.textContent = "";
	state.results.forEach((result) => {
		const item = document.createElement("li");
		item.className = result.correct === true ? "ok" : "bad";

		const head = document.createElement("p");
		head.className = "result-head";
		const status = document.createElement("span");
		status.className = "status";
		status.textContent = result.correct === true ? "Rast" : "Xelet";
		head.appendChild(status);
		head.appendChild(document.createTextNode(" " + result.question.translation));
		item.appendChild(head);

		const yours = document.createElement("p");
		yours.innerHTML = "<span class=\"label\">Cewabê te:</span> ";
		const yoursText = document.createElement("span");
		renderSegments(yoursText, buildSegments(result.question, result.values));
		yours.appendChild(yoursText);
		item.appendChild(yours);

		if (result.correct === false) {
			const right = document.createElement("p");
			right.innerHTML = "<span class=\"label\">Cewabê rast:</span> ";
			const rightText = document.createElement("span");
			renderSegments(rightText, buildSegments(result.question, correctValues(result.question)));
			right.appendChild(rightText);
			item.appendChild(right);
		}

		list.appendChild(item);
	});

	$("progress-bar").style.width = "100%";
	showScreen("screen-results");
}

function renderLevels() {
	const container = $("levels");
	container.textContent = "";
	LEVELS.forEach((level) => {
		const count = level.key === "mixed"
			? Math.min(MIXED_COUNT, state.all.length)
			: state.all.filter((q) => q.level === level.key).length;
		const button = document.createElement("button");
		button.type = "button";
		button.className = "level";
		button.disabled = count === 0;
		const name = document.createElement("span");
		name.className = "level-name";
		name.textContent = level.label;
		const info = document.createElement("span");
		info.className = "level-count";
		info.textContent = count + " pirs";
		button.appendChild(name);
		button.appendChild(info);
		button.addEventListener("click", () => startQuiz(level.key));
		container.appendChild(button);
	});
}

function validQuestion(q) {
	return typeof q === "object" && q !== null
		&& typeof q.translation === "string"
		&& typeof q.explanation === "string"
		&& Array.isArray(q.parts)
		&& q.parts.some(isGap);
}

async function loadData() {
	try {
		const response = await fetch(DATA_URL);
		if (response.ok !== true) {
			throw new Error("HTTP " + response.status);
		}
		const data = await response.json();
		if (Array.isArray(data.questions) === false) {
			throw new Error("questions missing");
		}
		state.all = data.questions.filter(validQuestion);
	} catch (error) {
		const message = $("load-error");
		message.textContent = "Pirs nehatin xwendin (" + error.message + "). Rûpelê bi serverekî veke.";
		message.hidden = false;
	}
	renderLevels();
}

function init() {
	$("btn-check").addEventListener("click", checkAnswer);
	$("btn-next").addEventListener("click", nextQuestion);
	$("btn-again").addEventListener("click", () => startQuiz(state.level));
	$("btn-home").addEventListener("click", () => showScreen("screen-start"));
	loadData();
}

init();
