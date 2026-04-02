# 🤖 Robo-Advisor 2.0

> **🔴 Live Demo:** [https://hackfinance-cokc.onrender.com/](https://hackfinance-cokc.onrender.com/)

> **A contextual, deterministic wealth management engine that adapts to your life events in real-time.** Most financial robo-advisors are blind. They ask you for your "risk tolerance" when you sign up, put your money in a 60/40 split, and forget about you. If you lose your job or have a sudden medical emergency six months later, they keep risking your capital in the stock market because your "static profile" says you are aggressive.

**Robo-Advisor 2.0 fixes this.** It doesn't ask for your risk tolerance; it watches your actual spending behavior. By parsing your bank statements, it detects financial stress signals (like healthcare spikes or job loss) and instantly recalculates your portfolio using **Mathematical Constraint Programming** to protect your liquidity.

## ✨ Key Features

* **📄 Real-Time Statement Parsing:** Upload standard bank `.csv` statements. The engine categorizes transactions and calculates a dynamic "Liquidity Need" score.
* **🧠 Deterministic AI (Google OR-Tools):** Instead of using flaky, probabilistic LLMs, we use Operations Research. The engine mathematically guarantees the highest possible portfolio yield without violating your current risk threshold. 100% crash-proof. 100% instant.
* **📈 10-Year Wealth Forecaster:** An interactive Chart.js integration that calculates compound annual growth rate (CAGR) on the fly, showing how your current spending habits impact your long-term wealth.
* **🎯 Actionable Market Picks:** Maps your dynamic risk profile to a curated database of high-yield Indian equities, commodities (like SGBs), and debt instruments based on 10-year historical trailing returns.
* **⚡ "Challenge the AI" Simulator:** A sandbox feature to input hypothetical future transactions (e.g., "Buying a ₹85,000 necklace") to see how the engine instantly locks down your portfolio in response.

## 🛠️ Tech Stack

This project was built to be lightweight, fast, and entirely local.

* **Backend Math Engine:** Python 3.11, FastAPI, Uvicorn, Google OR-Tools (Constraint Solver)
* **Frontend Gateway:** Node.js, Express.js
* **UI/UX:** HTML5, Vanilla JavaScript, Tailwind CSS, Chart.js

---

## 🚀 How to Run It Locally

You will need two terminal windows to run the frontend gateway and the Python math engine simultaneously.

### 1. Start the Python Optimization Engine
Open your first terminal, navigate to the project folder, and install the required Python packages:
```bash
pip install fastapi uvicorn pydantic ortools
