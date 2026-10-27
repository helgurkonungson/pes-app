---
id: cb-ai-en
version: 1
title: AI Literacy
description: How chatbots like ChatGPT, Claude or Gemini work, when you can trust them, how to write prompts and how to avoid harming yourself and others. Eight short lessons without technical jargon.
goal: Use AI confidently and safely for study and work
language: English
minutes: 7
hue: 265
---

# ai-01 | How AI works | What a language model is
## A next-word predictor
Chatbots like ChatGPT, Claude or Gemini run on **large language models**. Such a model has been trained on a huge amount of text and does one thing very well: given the beginning of a text, it predicts what is most likely to come next. When it answers you, it builds the reply step by step out of small pieces — **tokens** (words or parts of words).

Remarkable abilities grow out of this simple mechanism: summarising, translating, explaining, writing code. But remember that the model doesn't "look the answer up in a database" — it composes a plausible continuation.

## What the model doesn't know
A model has a **knowledge cut-off date**: about events after it, it only knows what it finds if it is given web search. It doesn't remember your past conversations unless the service deliberately stores them. And it has no experience of its own — only patterns from texts.

!key A language model predicts the next piece of text — a token.
!key The answer is composed, not taken from a database.
!key A model has a knowledge cut-off; it learns about new events only through search.
!key The model's abilities come from patterns in texts, not from personal experience.

?q:e What does a large language model fundamentally do?
- Looks up a ready answer in a database
+ Predicts which piece of text is most likely to come next
- Copies answers from websites in real time
- Connects you to a human expert
= The model builds the text step by step, token by token.

?q:e What is a token?
- A password for logging into a chatbot
+ A piece of text — a word or part of a word — that the model works with
- A unit of cryptocurrency payment
- A single reply from the model
= The model reads and writes text in tokens.

?q:m Why might a model not know about yesterday's news?
+ Its knowledge is limited by the cut-off date of its training data unless it has web search
- It deliberately hides the news
- Discussing news with AI is forbidden
- The model updates every minute and simply hasn't caught up
= Without search, the model knows the world only as of its training.

?q:h Which statement about a chatbot is most accurate?
- It understands the world like a person with experience
- It always quotes its sources word for word
+ It builds a plausible answer from patterns in texts
- It remembers every conversation of every user
= This explains both the strengths and the mistakes of models.

?r:m Where does the model get its answer to your question?
- From pre-recorded answers
+ It composes it by predicting how the text continues
- It downloads it from Wikipedia
- The developers supply it by hand
= The answer is generated, not retrieved.

?r:e What limits a model's knowledge of recent events?
+ The knowledge cut-off date
- Screen size
- The language of the prompt
- The time of day
= After that date the model only knows what it finds through search.

!open Explain to a friend in 3–4 sentences how a chatbot works and why it shouldn't be taken at its word.
!rubric Predicting the next text is mentioned
!rubric It explains that the answer is composed
!rubric There is a conclusion about checking
!model A chatbot is a program that has read an enormous amount of text and learned to guess which words should come next. When you ask a question, it doesn't look up the answer in a reference book — it writes a plausible text. That's why it sounds confident even when it's wrong, and important facts need checking.

# ai-02 | How AI works | Hallucinations and fact-checking
## Confident but wrong
Sometimes a model produces facts that don't exist: invented quotes, books, legal clauses, links, figures. These are called **hallucinations**. The cause lies in how the model works: it builds a plausible text, and plausible isn't always true. It happens especially often with rare topics, exact numbers, dates and references to sources.

The danger is that a wrong answer sounds just as confident as a right one.

## How to check
- Check important facts against the primary source: an official website, a document, a reference work.
- Ask the model for sources — and open them. A link that doesn't exist is a warning sign.
- Probe further: "how sure are you?", "what are the counter-arguments?".
- The higher the stakes (health, money, law, your job), the stricter the check. The final decision belongs to a human.

!key A hallucination is invented information presented with confidence.
!key Errors are most common in rare topics, numbers, dates and links.
!key Check important facts against the primary source.
!key The higher the stakes, the stricter the check; a human makes the decision.

?q:e What is a model hallucination?
- A screen glitch while answering
+ Invented information presented with confidence
- An answer in another language
- An answer that is too long
= For example, a quote or link that doesn't exist.

?q:m Where are hallucinations most common?
- In translating simple phrases
+ In exact figures, dates, quotes and references to sources
- In replies to a greeting
- In fixing typos
= These are details the model "fills in" plausibly.

?q:m The model cites a link to a study. What is sensible to do?
- Quote it in your report straight away
+ Open the link and check that the study exists and says exactly that
- Ask the same model whether it's true and believe the answer
- Delete the link and keep the conclusion
= The link has to be checked at the primary source.

?q:h You ask an AI about a medicine dose for a relative. What is the right way to proceed?
- Trust the answer if it sounds confident
- Ask two more chatbots and take the average
+ Use the answer as a hint and check with a doctor, a pharmacist or the official leaflet
- Ignore the leaflet if the AI said otherwise
= When the stakes are high, a human decides based on a reliable source.

?r:m Why do models hallucinate?
+ They build plausible text, and plausible isn't always true
- They are deliberately trained to deceive
- Because of a slow internet connection
- Because the question was asked politely
= It follows from the very way the model works.

?r:e What should you do with important facts from an AI answer?
- Memorise them
+ Check them against the primary source
- Forward them to friends
- Nothing, AI doesn't make mistakes
= The primary source is the main way to check.

!open Ask any chatbot about a little-known fact from your profession or city. How will you check the answer? Describe the steps.
!rubric Concrete checking steps are named
!rubric The primary source is mentioned
!rubric It recognises that a confident tone is no guarantee
!model I'll ask what year our local museum was founded. Then I'll find the museum's official website and its page in the city directory and compare the year and the founder's name. If the sources disagree with the model, I trust the sources: a confident tone guarantees nothing.

# ai-03 | Good prompts | How to write a prompt
## Four elements
The model can't read your mind: the quality of the answer depends heavily on the prompt. A good prompt usually contains:
1. **Context** — who you are, what it's for, what's already known.
2. **Task** — exactly what to do: explain, shorten, compare, come up with.
3. **Format** — a list, a table, a letter, 5 points, no more than 100 words.
4. **Constraints and criteria** — tone, audience, what to avoid.

## Before and after
Weak: "Write about time management."

Better: "I lead a team of 5 designers and we keep missing deadlines. Suggest 5 specific weekly planning practices, each in 2–3 sentences, with no generic advice like 'be more organised'."

**Examples** help too: show a sample of the answer you want, and the model will match its style and structure.

!key A good prompt: context, task, format, constraints.
!key The more specific the task, the more useful the answer.
!key State the format and length explicitly.
!key A sample of the desired answer helps the model hit the style.

?q:e Which prompt is likely to give a more useful answer?
- "Tell me about CVs"
+ "I'm a junior analyst applying to a bank. Suggest 3 strong bullet points for the Experience section, each with a result in numbers"
- "CV"
- "Help"
= It has context, a task and a format.

?q:m Which of these is the "format" element?
- "I'm a maths teacher"
+ "Answer as a table with three columns"
- "Explain what fractions are"
- "I need this for tomorrow's lesson"
= Format is how the answer should look.

?q:m Why add an example of the desired answer to a prompt?
- So the model copies it unchanged
+ To show the style, structure and level of detail you need
- An example only confuses the model
- To make the answer shorter
= A sample sets the bar more precisely than any description.

?q:h You got an answer about marketing that is too generic. What should you change in the prompt first?
- Write the same thing in capital letters
+ Add context: the product, the audience, the budget and what you've already tried
- Ask it to answer faster
- Switch the language of the prompt
= A generic answer usually comes from a generic prompt without context.

?r:m Which four elements make up a good prompt?
+ Context, task, format, constraints
- Greeting, question, thanks, signature
- Topic, keywords, hashtags, emojis
- Length, font, colour, language
= These elements make the answer useful.

?r:e What is a prompt?
- The model's answer
+ The request you write to the model
- The name of the model
- A screen setting
= A prompt is your request.

!open Rewrite the weak prompt "Help with a presentation" into a strong one for a real task of yours, using the four elements.
!rubric There is context
!rubric The task is specific
!rubric Format and constraints are stated
!model I'm a product manager presenting quarterly results to leadership on Friday: revenue grew 12%, but customer churn rose too. Draft an 8-slide outline with a title and 2–3 key points for each slide. Business tone, no jargon; one separate slide on what we're doing about churn.

# ai-04 | Good prompts | Dialogue and iteration
## The first answer is a draft
The best result rarely comes on the first try. Treat the answer as a **draft** and refine it in conversation: "shorter", "simpler, for a beginner", "add an example from retail", "drop the third point".

Useful techniques:
- Ask for **several options**: "give me 3 different headlines" — then choose or combine.
- Ask the model to **ask you questions**: "before writing, ask what's missing".
- Ask for **criticism**: "find the weak spots in this plan" or "what would a sceptic object?".

## Break big tasks down
A complex task is better done in steps: first the structure, then each section, then a check. That makes it easier to control quality and correct course in time.

If the conversation gets stuck and the model keeps repeating mistakes, it's sometimes faster to start a new chat with an improved prompt.

!key The first answer is a draft; refine it in conversation.
!key Ask for options, clarifying questions and criticism.
!key Do big tasks in steps: structure → sections → check.
!key If the conversation is stuck, start again with a better prompt.

?q:e How should you treat the model's first answer?
+ As a draft that can be improved
- As the final result
- As a mistake if it isn't perfect
- As an answer that can't be changed
= Refining in conversation is a normal part of the work.

?q:m Which request helps find the weak spots in a text?
- "Make it better"
+ "What would a sceptic object to in this plan?"
- "Write the same thing again"
- "Thanks, all good"
= Asking for criticism reveals weaknesses.

?q:m Why ask the model to ask you questions before answering?
- To stall for time
+ So it finds out the missing context and answers more precisely
- It's a polite formality
- So the answer is shorter
= The model will show what information it lacks.

?q:h You need a 10-page report. Which approach is more reliable?
- Ask for the whole report in one message and send it straight away
+ Agree on the structure first, then write the sections one by one and check at the end
- Ask for ten different reports and pick one at random
- Write a one-line prompt
= Working step by step gives you control over quality.

?r:m What should you do if the model keeps repeating the same mistake in a conversation?
- Repeat the same request more loudly
+ Start a new chat with an improved prompt
- Delete the app
- Accept the mistake
= A fresh context often solves the problem.

?r:e How do you get several ideas to choose from?
+ Ask for several different options
- Ask for one perfect option
- Ask a question without context
- Ask for nothing
= Options can be compared and combined.

!open Describe how you'd run a conversation with an AI to prepare an apology email to a customer about a delayed order. What steps and refinements would you make?
!rubric There is an initial prompt with context
!rubric There are at least two refinements
!rubric There is a final human check
!model First I'll give context: the order is 5 days late because of a supplier, the customer is a regular, I want to keep the relationship. I'll ask for 2 versions of the email. Then: "make the second one shorter and warmer", "add compensation — 10% off the next order". At the end I'll check the dates, the amount and the customer's name myself before sending.

# ai-05 | Safety and responsibility | Data and privacy
## What you send
Everything you type into a chatbot goes to the company's servers. Depending on the service and the plan, conversations may be stored, reviewed for quality control or used to train future models. This is especially common on **free plans** — the terms are worth reading.

## What not to send
- passwords, SMS codes, bank card details;
- other people's personal data without consent: ID numbers, addresses, medical information;
- your employer's confidential documents, unless the company has an approved AI service.

## How to work more safely
- Anonymise: replace names and numbers with "Client A", "amount X".
- Learn your company's rules: many allow only corporate versions of AI services.
- Check the service settings: you can often turn off the use of your chats for training.

!key Everything you type into a chatbot goes to the company's servers.
!key Free plans more often use conversations for training — read the terms.
!key Don't send passwords, payment details or other people's personal data.
!key Anonymise data and follow your employer's rules.

?q:e Which of these must never be sent to a chatbot?
- A grammar question
+ An SMS code for confirming a payment
- A request to name a cat
- The text of your own public post
= SMS codes and passwords are never shared with anyone.

?q:m You want AI to help you analyse a customer complaint. What is the safer way?
- Paste the whole complaint with the customer's phone and address
+ Remove the name, contacts and contract number, replacing them with placeholders
- Send a screenshot of the customer's passport
- Ask the customer to write to the chatbot themselves
= Anonymising keeps the meaning and protects the person.

?q:m Why read the terms of an AI service's free plan?
+ Conversations on a free plan may be used to train models
- A free plan is always more dangerous than a paid one in every way
- Terms are only for lawyers
- They contain answers to all questions
= The terms decide what happens to your data.

?q:h Your company has a corporate AI service, but your personal free one is more convenient. You're preparing a report with internal figures. What is right?
- Use the personal one, since it's more convenient
+ Use the corporate service, as the rules require
- Send the figures to the personal one, then delete the chat
- Ask a colleague to send it for you
= Confidential company data goes only into approved services.

?r:m What does it mean to anonymise data?
- Delete all the text
+ Replace names, contacts and exact figures with placeholders
- Translate the text into another language
- Cut the text in half
= The meaning stays, the personal details don't.

?r:e Where does the text you type into a chatbot go?
+ To the servers of the company providing the service
- Nowhere, it stays on your phone
- Straight to the police
- Publicly onto the internet
= That's why what you send matters.

!open Take a real work or study task where AI would help you. Which data from it would you need to remove or replace before sending?
!rubric The task is described
!rubric Specific sensitive data is named
!rubric A way to anonymise is suggested
!model The task is to analyse a sales table by sales rep and find the reasons for a drop. Before sending, I'll replace the reps' names with "Rep 1–5", remove the client names and round the amounts. I'll keep the structure and trends — that's enough for the analysis.

# ai-06 | Safety and responsibility | Where AI is strong and where it's weak
## Strengths
AI does well at tasks that are about working with text and whose results are easy to check:
- drafts of emails, posts, plans;
- summarising and shortening long texts;
- explaining complex things in simple words, with examples;
- brainstorming: ideas, names, options;
- translation and style editing;
- help with code and formulas (with checking).

## Weak spots
- **Exact calculations**: models can get arithmetic wrong unless they use a calculator or code.
- **Recent events** without access to search.
- **Narrow facts**: rare names, quotes, document numbers.
- **High-stakes decisions**: diagnoses, legal and financial decisions — only with a specialist's check.

A good rule: use AI where **checking the result is easier than doing the work from scratch**.

!key AI is strong at drafts, summaries, explanations, ideas and translation.
!key Weak spots: exact calculations, recent events, rare facts.
!key High-stakes decisions are made by a person together with a specialist.
!key Use AI where checking is easier than doing it from scratch.

?q:e Which task is AI especially good for?
+ Drafting an email to colleagues
- Making a medical diagnosis
- Deciding whether to sign a contract
- Getting today's exact exchange rate without search
= A draft is easy to check and fix.

?q:m Why double-check a model's calculations?
- Models always calculate wrongly
+ A model can get arithmetic wrong unless it uses a calculator or code
- Calculations in chatbots are forbidden
- Numbers in answers are always rounded
= A language model predicts text; it doesn't compute.

?q:m Which rule helps you decide whether to use AI?
- Use AI for everything
- Never use AI at work
+ Use it where checking the result is easier than doing the work from scratch
- Use it only at weekends
= This saves time while keeping you in control.

?q:h Which task is an example of sensible AI use?
- Ask AI which loan to take and sign straight away
+ Ask AI to retell a long contract in plain words, and discuss the disputed clauses with a lawyer
- Copy an AI answer into a scientific paper without checking
- Let AI choose a medical treatment
= AI speeds up understanding; the decision stays with a person and a specialist.

?r:m Which of these is a weak spot of models?
- Rephrasing text
+ Rare facts: exact quotes, document numbers
- Brainstorming
- Explaining in simple words
= The model may invent narrow facts.

?r:e Who makes high-stakes decisions?
+ A person, with a specialist if needed
- The model, if it's confident
- Whoever answers fastest
- Nobody
= AI is an assistant, not the responsible party.

!open List three tasks from your week: one worth handing to AI, one to use it for with caution, and one not to use it for. Explain why.
!rubric Three tasks of different kinds
!rubric An explanation based on checkability or stakes
!rubric Realistic examples
!model Hand to AI: a draft of my weekly report — I can easily check it against my data. With caution: translating an email to a partner — I'll check the terms and tone. Not at all: deciding which candidate to hire — the stakes are high and a person has to decide.

# ai-07 | Safety and responsibility | Bias, authorship, honesty
## Bias
Models learn from human texts — along with their stereotypes. So answers can be biased: for example, assigning a gender to a profession by default or describing countries in clichés. Notice it and ask for alternatives: "what if we look at it from another angle?".

## Authorship and honesty
- **Openness**. If your school's or employer's rules require it, say that you used AI. Many universities and publishers already have such rules.
- **Responsibility**. You are responsible for the text you publish, even if a model wrote it.
- **Other people's rights**. A model can reproduce fragments of other people's texts; don't pass them off as your own and check for borrowings.
- **Deepfakes**. Don't create fake photos, voices or videos of real people without their consent, and don't use AI to deceive.

!key Models inherit stereotypes from texts — watch for bias.
!key Disclose AI use when the rules require it.
!key You, not the model, are responsible for the text you publish.
!key Don't use AI to deceive or to fake real people.

?q:e Where does bias in models come from?
- It is added on purpose
+ Models learn from human texts, stereotypes included
- From a bad internet connection
- Only people can be biased
= The data reflects society with all its distortions.

?q:m Who is responsible for a post written with AI and published under your name?
- The company that developed the model
+ You, as the author of the post
- Nobody
- The readers
= Whoever publishes is responsible for the publication.

?q:m Your university requires you to disclose AI use. You asked AI to shorten your essay's introduction. What should you do?
+ Disclose it the way the rules require
- Not mention it, since the changes are small
- Delete the chat history
- Rewrite the text with another AI to hide it
= Honesty and the rules come before convenience.

?q:h Which use of AI is unacceptable?
- Asking for ideas for a colleague's birthday message
- Asking for an explanation of a hard topic
+ Generating a voice message "from" an acquaintance to ask their friends for money
- Asking for a grammar check
= That's deception by faking a real person.

?r:m How should you react to a stereotype in a model's answer?
- Accept it as a fact
+ Notice it and ask for an alternative point of view
- Delete the app immediately
- Share the answer without comment
= Being critical of answers is part of AI literacy.

?r:e Can you pass off a model's text as entirely your own where the rules forbid it?
- Yes, if nobody finds out
+ No, follow the rules and disclose AI use
- Yes, if the text is short
- Yes, if you translate it
= The rules of honesty apply to AI too.

!open Write 3 personal rules for using AI honestly in study or work.
!rubric Three concrete rules
!rubric Responsibility and openness are covered
!rubric The rules are practical
!model 1) I check and edit everything AI writes — I only sign off on what I agree with. 2) If the course or client rules require it, I say that I used AI and what for. 3) I don't upload other people's personal data and don't create anything in the name of real people.

# ai-08 | Safety and responsibility | Learning together with AI
## A helper, not a replacement
AI can speed up learning — or quietly replace it. If the model solves problems for you, you get the answer but not the skill: memory and understanding grow only from your own effort. Remember the first course: **recalling and explaining** make knowledge durable.

## How to use AI for learning
- Ask it to **explain** a topic in different ways, with examples from your life.
- Ask it to **quiz you** on the topic and check your answers — that's retrieval practice.
- Ask for a **hint**, not a ready solution: "give me a leading question".
- Explain the topic to the model yourself and ask it to find mistakes — that's the Feynman technique.
- Check the facts: an AI explanation can contain mistakes too.

## AI in Chompbook
If you connect an AI, Chompbook writes lessons from your own materials and checks your written answers. AI lessons are labelled, and the flag at the top of a lesson lets you report a mistake. Without AI the app still works — with ready-made courses and your own sources.

!key If AI does the work for you, the skill doesn't grow.
!key Ask for explanations, questions and hints, not ready solutions.
!key Explain the topic to the model yourself and ask it to find mistakes.
!key AI explanations need checking too.

?q:e Why is it risky to have AI solve all your study tasks?
+ You get answers but not the skill: understanding grows from your own effort
- AI always solves them wrongly
- It's against the law
- It's too expensive
= Knowledge is strengthened by your own recalling and explaining.

?q:m Which request to AI trains your memory best?
- "Solve the problem for me"
+ "Ask me 5 questions on this topic and check my answers"
- "Write a summary, I'll read it later"
- "Just tell me the answer"
= That's retrieval practice with feedback.

?q:m You're stuck on a problem. How do you ask for help so that you learn rather than copy?
- "Give me the full solution"
+ "Give me one leading question without revealing the answer"
- "Solve all the similar problems"
- "Just tell me the number"
= A hint leaves the main work to you.

?q:h How can you use the Feynman technique with AI?
- Ask AI to explain the topic and memorise its text
+ Explain the topic to the model in your own words and ask it to find mistakes and gaps
- Ask AI to write the essay for you
- Compare two answers from different models
= You explain — the model helps you see the gaps.

?r:m What should you do with an explanation an AI gave you?
- Accept it without checking
+ Check the key facts against a reliable source
- Learn it word for word
- Present it as your own work
= Explanations can contain mistakes too.

?r:e Which kind of help from AI keeps your learning intact?
+ Explanations, questions and hints
- Ready answers to all assignments
- Writing your papers for you
- Taking tests for you
= The main effort should stay yours.

!open Write a prompt for AI that will help you prepare for an exam or a job interview without doing the work for you.
!rubric Context and topic are given
!rubric The prompt requires your active participation
!rubric There is feedback
!model I'm preparing for a data analyst interview. Ask me one question at a time on SQL and statistics, from easy to hard. After each answer, tell me what was right and what was missing, and only then ask the next question. Don't show model answers until I ask.
