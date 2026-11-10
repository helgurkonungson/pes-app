// Guides (articles) for search. Same slugs as ru.mjs — pages are linked through hreflang.
export default {
  nav: "Guides",
  hubTitle: "Guides: how to learn and remember",
  hubLead: "Short, practical articles on remembering what you read, reviewing smartly and checking that you really understood.",
  updated: "Updated",
  faqTitle: "FAQ",
  ctaH: "Try it on your own material",
  ctaP: "Chompbook turns your books, PDFs and notes into short lessons with quizzes and an open question checked by AI. Free, no accounts or ads.",
  more: "Related guides",
  items: [
    {
      slug: "remember-what-you-read",
      title: "How to remember what you read: 6 research-backed techniques",
      desc: "Why books fade from memory so fast and what to do about it: retrieval instead of rereading, spaced repetition, explaining in your own words and three more techniques.",
      lead: "A week after finishing a book, most people can retell a couple of ideas from it. That's not bad memory — it's how we read. Here are six techniques that are well studied in cognitive psychology and work for books, articles and textbooks.",
      body: `
<h2>Why we forget what we read</h2>
<p>In 1885 Hermann Ebbinghaus measured how fast he forgot what he had learned and found the <b>forgetting curve</b>: most is lost in the first hours and days, then forgetting slows down. Every successful recall makes the curve flatter.</p>
<p>The second reason is the <b>illusion of knowing</b>. When you reread, the text feels familiar and the brain mistakes familiarity for understanding. The test is simple: close the book and try to explain the chapter in your own words.</p>
<h2>1. Recall instead of rereading</h2>
<p>The most reliable technique is <b>retrieval practice</b>, also called the testing effect. In a well-known study by Roediger and Karpicke (2006), students who tried to recall a text after reading it remembered noticeably more a week later than students who spent the same time rereading.</p>
<p>How to use it: after each chapter, close the book and write down 3–5 main ideas from memory. Then check the text and add what you missed.</p>
<h2>2. Review with growing gaps</h2>
<p>The same review time pays off more when it's spread over days. This is the <b>spacing effect</b>. Come back to the key ideas after a day, then a few days, a week and a month. More in the guide on <a href="/guides/spaced-repetition/">spaced repetition</a>.</p>
<h2>3. Explain it in your own words</h2>
<p>If you can explain an idea simply, you understand it. If you stumble, you've found a gap. That's the core of the <a href="/guides/feynman-technique/">Feynman technique</a>. Answering "why?" and "how does this connect to…?" helps more than just retelling.</p>
<h2>4. Read in small portions</h2>
<p>Memory starts with attention: what you skim half-distracted is never encoded. Fifteen focused minutes without your phone beat an hour in the background. A little every day works better than three hours once a week.</p>
<h2>5. Interleave topics</h2>
<p>When you mix similar topics instead of studying them in blocks, the brain has to work out which approach each one needs. It feels harder and less productive, but it sticks better — especially for problems and skills.</p>
<h2>6. Connect it to what you already know</h2>
<p>New information holds better when you hook it to something familiar: an everyday example, your own experience, another book. Ask yourself: where have I seen this? How is it different from what I knew? Where will I use it this week?</p>
<h2>How to do all this without the effort</h2>
<p>All six techniques work, but they take discipline: writing your own questions, remembering when to review and testing yourself honestly. <a href="/">Chompbook</a> does it for you: add a book or PDF, choose 5–60 minutes a day, and the app cuts the text into lessons in order. Each lesson has a quiz and ends with an open question: you answer in your own words, and AI checks the answer against the source, scores it out of 10 and points out what you missed. Mistakes come back in later lessons.</p>
<p>To try it without your own files, start with the free course <a href="/courses/learning/">"How to Learn Effectively"</a> — it's about memory and review.</p>`,
      faq: [
        ["How many times should I reread a book to remember it?", "Rereading on its own helps little. Read carefully once, then recall the main points from memory a few times with growing gaps: after a day, a few days, a week and a month."],
        ["Do notes help?", "Yes, if you write in your own words and from memory rather than copying. Turning notes into questions and answering them later helps even more."],
        ["Can I remember a book reading 10–15 minutes a day?", "Yes. Short daily sessions that end with recall work better than rare long ones. Consistency and self-testing matter most."],
      ],
    },
    {
      slug: "spaced-repetition",
      title: "Spaced repetition: what it is and how to use it",
      desc: "What spaced repetition is, why it works, which intervals to use and how reviewing lessons differs from flashcards.",
      lead: "Spaced repetition is one of the best-studied ways to remember for the long term. The idea is simple: come back to the material not in a row but with growing gaps, just as it starts to fade.",
      body: `
<h2>What spaced repetition is</h2>
<p>Instead of reviewing something five times in one evening, you review it five times over a month — for example after 1 day, 3 days, a week, two weeks and a month. If recall was easy, the next gap is longer. If you got it wrong, it comes back sooner.</p>
<h2>Why it works</h2>
<p>This is the <b>spacing effect</b>, one of the most robust findings in memory research, replicated in hundreds of experiments (a large review: Cepeda and colleagues, 2006). Recalling something that has started to fade takes effort, and that effort makes the memory stronger. Reviewing while it's fresh adds almost nothing: you just recognise what you saw a minute ago.</p>
<h2>Which intervals to use</h2>
<ul>
<li><b>To start:</b> 1 day → 3 days → 7 days → 14 days → 30 days.</li>
<li><b>Got it wrong?</b> Bring it back the next day and restart the chain.</li>
<li><b>Exact numbers matter less</b> than the principle: gaps grow, mistakes come back earlier.</li>
</ul>
<p>Apps calculate intervals for you. The classic algorithm is SM-2 from SuperMemo, long used by Anki; a newer one, FSRS, adapts to your own memory.</p>
<h2>Flashcards or lessons</h2>
<p>Flashcards are great for facts: words, dates, terms, formulas. For books and complex topics they fall short: you can remember a definition and still not know how to apply it. Understanding needs reviewing ideas and how they connect — explaining in your own words, solving problems, answering "why".</p>
<h2>How review works in Chompbook</h2>
<p>In <a href="/">Chompbook</a> you don't make cards. The app builds lessons from your material, and review is built into studying:</p>
<ul>
<li>questions you got wrong come back later;</li>
<li>every fifth lesson starts with a check of what you've covered;</li>
<li>AI remembers what you missed in your open answer and brings it back in later lessons until you've got it.</li>
</ul>
<h2>Common mistakes</h2>
<ul>
<li><b>Cramming the night before.</b> It gets you through tomorrow's test, but a week later most of it is gone.</li>
<li><b>Reviewing only what you already know.</b> Pleasant but useless — time should go to the hard parts.</li>
<li><b>Taking on too much new material.</b> Reviews pile up; less new material, but every day, works better.</li>
</ul>
<p>Review principles are also covered in the free course <a href="/courses/learning/">"How to Learn Effectively"</a>.</p>`,
      faq: [
        ["How many reviews does it take to remember forever?", "Usually 4–6 successful reviews with growing gaps give memory for months. The exact number depends on how hard and how familiar the material is."],
        ["How is spaced repetition different from cramming?", "Cramming is many reviews in a short time. Spaced repetition is the same effort spread over days, and it gives much longer-lasting memory."],
        ["Do I need a special app?", "You can keep a schedule in a notebook, but an app calculates intervals and won't let you skip a review. Anki is handy for flashcards, Chompbook for lessons from books and PDFs."],
      ],
    },
    {
      slug: "feynman-technique",
      title: "The Feynman technique: how to check you really understand",
      desc: "The Feynman technique in 4 steps: explain a topic simply, find the gaps and simplify. Why it works, where it fails and how to get feedback.",
      lead: "The Feynman technique is named after physicist Richard Feynman, famous for explaining hard things simply. The point: if you can't explain a topic in simple words, you don't understand it yet.",
      body: `
<h2>The technique in four steps</h2>
<ol>
<li><b>Pick a topic</b> and write its name at the top of a page.</li>
<li><b>Explain it in simple words</b>, as if to a friend who knows nothing about it. No terms you can't unpack.</li>
<li><b>Find the gaps.</b> Where you stumbled, skipped a step or hid behind a clever word — that's where understanding is missing. Go back to the source and work it out.</li>
<li><b>Simplify and add an example.</b> Rewrite the explanation shorter and add an everyday example.</li>
</ol>
<h2>Why it works</h2>
<p>When you explain, you don't recognise a ready answer — you build one, which trains memory and understanding much harder (the generation effect and self-explanation). Explaining also breaks the <b>illusion of explanatory depth</b>: in a study by Rozenblit and Keil (2002), people confidently rated how well they understood a zipper or a flush toilet, and their confidence dropped sharply once they tried to explain it step by step.</p>
<h2>An example</h2>
<p>Topic: "why rereading helps less than recalling". First attempt: "Well, recalling activates memory better." "Activates" explains nothing — that's a gap. After working it out: "When you reread, the text feels familiar and we confuse familiarity with knowledge. When you recall without hints, the brain retrieves the information itself, and that effort strengthens memory. This is called the testing effect."</p>
<h2>Where the technique fails</h2>
<p>Its main weakness is <b>no feedback</b>. Explaining to yourself, it's easy to miss an error or an important idea: you don't know what you don't know. The technique works better when someone checks your explanation — a teacher, a colleague or the source.</p>
<h2>The Feynman technique with AI feedback</h2>
<p>In <a href="/">Chompbook</a> every lesson ends with an open question — a small Feynman exercise. You answer in your own words, and AI checks the answer against your source and the lesson's key ideas: a score out of 10, what worked, what's missing and how to improve, plus a model answer. What you missed comes back in later lessons.</p>
<p>Without AI you can compare your answer with the model answer yourself — lessons work offline too.</p>`,
      faq: [
        ["Do I have to explain out loud?", "No. Writing works — it even makes gaps easier to spot and compare with the source."],
        ["Does the Feynman technique work for humanities?", "Yes. It works for any ideas, from economics and history to psychology. An everyday example matters most for abstract topics."],
        ["How long does one topic take?", "Usually 10–20 minutes for a small topic or chapter. Short and regular is better."],
      ],
    },
    {
      slug: "pdf-to-lessons",
      title: "How to turn a PDF or book into lessons and quizzes",
      desc: "How to make short lessons with quizzes from a PDF, EPUB or notes: by hand, with an AI chatbot, and automatically in the Chompbook app.",
      lead: "A textbook, work documentation or a book in PDF sits untouched for months, because reading 300 pages is hard to start. It's much easier when the material is split into short lessons with questions. Here are three ways to do it.",
      body: `
<h2>Why turn text into lessons</h2>
<p>A short lesson with questions at the end makes you recall, not just read — the most effective way to remember (more in <a href="/guides/remember-what-you-read/">how to remember what you read</a>). Small portions also remove the main obstacle: "no time to sit down with the book".</p>
<h2>Option 1. By hand</h2>
<ol>
<li>Split the text into parts of 5–10 pages.</li>
<li>After each part, write 3–5 questions: "what is…", "why…", "how is it different from…".</li>
<li>A day later, answer from memory; again a week later.</li>
</ol>
<p>It works well but takes a lot of time: writing questions takes almost as long as reading.</p>
<h2>Option 2. With an AI chatbot</h2>
<p>You can upload the file to a chatbot and ask for questions on a chapter. The downsides: you have to write a prompt every time and remember where you stopped, there's no plan and no review, and the model's answers need checking — it can be confidently wrong. Writing prompts and checking AI answers is covered in the free course <a href="/courses/ai/">"AI Literacy"</a>.</p>
<h2>Option 3. Automatically in Chompbook</h2>
<ol>
<li><b>Add your material.</b> PDF, EPUB, Word, TXT, Markdown, HTML, a web page link, pasted text, or photos and scans — text in scans is recognised right on the phone. Files from Google Drive, Dropbox or OneDrive are picked in the standard file picker.</li>
<li><b>Choose your time:</b> 5, 15, 30 or 60 minutes a day. Lessons are sized to it.</li>
<li><b>Take the placement test</b> — it skips what you already know.</li>
<li><b>Study in order.</b> Each lesson has theory, a quiz and an open question checked by AI. Mistakes come back later.</li>
</ol>
<h2>What about privacy</h2>
<p>Files and progress stay on your phone; there are no accounts. Text leaves the phone only for the AI service you chose: a free AI connected in a couple of taps, your own key, or Chompbook Pro. Details in the <a href="/privacy/">privacy policy</a>.</p>`,
      faq: [
        ["Can I make a quiz from a PDF for free?", "Yes. Chompbook is free: for AI lessons you can connect a free AI in a couple of taps or use your own key. Chompbook Pro is only needed if you want AI lessons without your own key."],
        ["Does it work with scans and photos of pages?", "Yes, text is recognised right on the phone, without sending images to a server."],
        ["How much text can I add?", "A whole book: lessons go through it in order, part by part, until it's finished."],
      ],
    },
    {
      slug: "anki-alternative",
      title: "Anki, Quizlet or Chompbook: which to choose for remembering",
      desc: "Anki vs Quizlet vs Chompbook: how material is created, how knowledge is checked, price, and which tasks each app suits best.",
      lead: "Anki and Quizlet are the best-known apps for memorising. Chompbook tackles a similar problem differently. Here's an honest comparison: who each one suits and when to combine them.",
      body: `
<h2>At a glance</h2>
<table>
<thead><tr><th></th><th>Anki</th><th>Quizlet</th><th>Chompbook</th></tr></thead>
<tbody>
<tr><td>Format</td><td>Flashcards</td><td>Flashcards and tests</td><td>Short lessons: theory, quiz, open question</td></tr>
<tr><td>Where material comes from</td><td>You make cards or download decks</td><td>Your own sets or others' from the catalogue</td><td>Your books, PDFs, notes or ready courses</td></tr>
<tr><td>How it checks</td><td>You rate whether you remembered</td><td>Multiple choice, typing a word</td><td>AI checks an answer in your own words against the source</td></tr>
<tr><td>Best for</td><td>Words, terms, facts</td><td>Words, terms, school topics</td><td>Books, textbooks, understanding ideas</td></tr>
</tbody>
</table>
<h2>Anki</h2>
<p>Anki is a free, open-source desktop program; on Android there's the free AnkiDroid, on iPhone the paid AnkiMobile app. Its strengths are powerful spaced repetition (including the modern FSRS algorithm) and flexibility: you can make a card for anything.</p>
<p>The downsides: you create cards yourself, which takes time; the interface is unfamiliar to beginners; cards test short facts well but understanding of long texts poorly.</p>
<h2>Quizlet</h2>
<p>Quizlet is a flashcard-set service with study modes, tests and games, plus a huge catalogue of other users' sets. There's a free version; some modes are in the paid subscription. It's good for vocabulary, terms and school test prep.</p>
<p>The downsides are similar: a "question — short answer" format, and others' sets sometimes contain mistakes.</p>
<h2>Chompbook</h2>
<p><a href="/">Chompbook</a> doesn't ask you to make cards. You add a book or PDF and the app cuts it into lessons sized to your time and takes you through them in order. Each lesson ends with an open question: you answer in your own words, and AI checks whether you understood, scores it and points out what you missed. Review is built in: mistakes and gaps come back later.</p>
<p>Honest limits: Android only for now, an iPhone version is planned; for drilling large vocabularies or characters, Anki's cards are more convenient.</p>
<h2>Which to choose</h2>
<ul>
<li><b>Learning words, terms, anatomy, dates</b> — Anki or Quizlet.</li>
<li><b>Want to finish and understand a book, textbook or documentation</b> — Chompbook.</li>
<li><b>Need both</b> — combine them: understanding through lessons, separate facts through cards.</li>
</ul>
<p>You can start with Chompbook's free courses, such as <a href="/courses/thinking/">"Critical Thinking"</a> or <a href="/courses/money/">"Financial Literacy"</a>.</p>`,
      faq: [
        ["Can I import Anki decks into Chompbook?", "No, Chompbook works with texts: books, PDFs, notes and web pages. Your decks stay in Anki."],
        ["Is Chompbook a free alternative to Anki?", "Chompbook is free, but it's less a replacement than a different approach: lessons from your material with a check of understanding instead of flashcards."],
        ["Is Chompbook on iPhone?", "Not yet — it's available for Android. An iPhone version is planned."],
      ],
    },
  ],
};
