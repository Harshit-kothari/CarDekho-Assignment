<div align="center">
  <h1>🚗 BharatMotors AI Assistant</h1>
  <p>An intelligent, conversational car discovery platform built for the Indian automotive market.</p>
  
  [![Live Demo](https://img.shields.io/badge/Live-Demo-emerald?style=for-the-badge)](https://car-dekho-assignment.vercel.app/browse?carId=creta-sx)
</div>

---

## 🙋‍♂️ What did you build and why?
I built **BharatMotors AI**, an intelligent car recommendation platform that replaces overwhelming, complex filter menus with a guided conversational agent. Finding the right car in the Indian market requires balancing budget, fuel type, seating, safety ratings, and usage contexts (City vs. Highway). 

Instead of forcing users to figure out which filters to apply, the AI Agent chats with them to build a highly nuanced "Buyer Profile", mathematically scores the inventory against their needs, and visually presents the top matches for direct comparison.

## ✂️ What did you deliberately cut?
1. **Generative LLM Hallucinations:** I deliberately cut the use of a raw text-generation model (like ChatGPT/Gemini) for making recommendations. LLMs frequently hallucinate car prices and specifications. Instead, the chatbot uses rigorous Natural Language Processing (regex/intent-parsing) to understand the user, and runs those extracted variables through a **deterministic scoring algorithm** against a hardcoded, highly accurate inventory.
2. **Complex Authentication:** To minimize friction, profiles are bound to temporary anonymous session IDs rather than requiring a sign-up wall.
3. **External Databases:** The scope focuses purely on discovery logic, so the database is simulated entirely via a rich JSON-style inventory (`config.py`).

## 🛠️ What’s your tech stack and why did you pick it?
* **Frontend: Angular 19** – Selected for its robust dependency injection and its new, highly efficient **Signals** API, which made managing complex, deeply nested UI states (like the Comparison Cart) effortless.
* **Styling: Tailwind CSS** – Used for rapid, utility-first styling to create a polished, consumer-grade aesthetic without writing thousands of lines of custom CSS.
* **Backend: Python + FastAPI** – Selected because the scoring algorithms and NLP parsing are incredibly fast and easy to write in Python. FastAPI natively integrates with modern asynchronous workflows.
* **Deployment: Vercel Unified Serverless** – Chosen because Vercel can automatically build the Angular application while natively running the FastAPI backend as **Serverless Edge Functions** from the `/api` directory—removing CORS headaches entirely!

## 🤖 What did you delegate to AI tools vs. do manually?
* **Delegated to AI:** 
  * Initial scaffolding of Angular components and Tailwind layouts.
  * Generating the mock dataset of Indian cars with realistic specs (prices, mileage, NCAP ratings).
  * Refactoring the Vercel architecture (figuring out how to route API paths to Python serverless functions natively).
  * Git wizardry (rewriting commit authorship history!).
* **Done Manually:** 
  * Designing the mathematical weights for the scoring engine (deciding *how much* safety matters vs mileage).
  * Defining the core User Experience loop (such as ensuring the "+ Compare" buttons were accessible globally from the grid, not hidden behind menus).
  * Orchestrating the strictly-typed data contracts between the frontend and Python backend.

## 🚀 Where did the tools help most?
* **Debugging Infrastructure:** The AI was invaluable for resolving nuanced Vercel Serverless environment bugs, such as local Python path resolution errors (`sys.path.append()`) that crash AWS Lambdas.
* **Refactoring:** Converting standard RxJS/BehaviorSubjects over to Angular Signals cleanly.

## 🚧 Where did they get in the way?
* **Spatial UX Context:** The AI occasionally struggled with Z-index layering and complex UI interactions (e.g., when a chat window opened, the background dimmed incorrectly, or the comparison drawer popped up uncontrollably because it failed to grasp the visual consequences of its logic).

## ⏱️ If you had another 4 hours, what would you add?
1. **True Database Integration:** Hook up PostgreSQL (via Supabase) to persist user chat sessions across devices and store telemetry on which cars are viewed most.
2. **LLM Hybrid Mode:** Integrate the Gemini API purely for answering subjective automotive questions ("*Is a CVT better than a DCT for Bangalore traffic?*"), keeping the hard recommendations deterministic.
3. **Financing Calculators** Build a dynamic EMI slider directly into the Car Detail Drawer.
