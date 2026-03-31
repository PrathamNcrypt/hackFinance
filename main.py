import os
import random
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from ortools.sat.python import cp_model

# --- DATA MODELS ---
class Transaction(BaseModel):
    name: str
    amount: float
    category: List[str]
    date: str

class AnalyzeRequest(BaseModel):
    transactions: List[Transaction]
    current_risk_score: Optional[int] = 50

app = FastAPI()

# --- MARKET DATABASE (CRASH-PROOF PROXY) ---
MARKET_DB = [
    {"name": "Nifty 50 Index Fund", "type": "Mutual Fund", "risk": "Moderate", "return_pct": 12.5, "desc": "Top 50 Indian companies. Core portfolio builder."},
    {"name": "Parag Parikh Flexi Cap", "type": "Mutual Fund", "risk": "Moderate", "return_pct": 15.2, "desc": "Diversified across large, mid, and US tech stocks."},
    {"name": "Quant Small Cap Fund", "type": "Mutual Fund", "risk": "High", "return_pct": 22.4, "desc": "High volatility, massive growth potential for aggressive profiles."},
    {"name": "Reliance Industries", "type": "Stock", "risk": "Moderate", "return_pct": 14.0, "desc": "India's largest conglomerate. Stable blue-chip growth."},
    {"name": "Tata Motors", "type": "Stock", "risk": "High", "return_pct": 18.5, "desc": "EV sector leader, high growth but subject to market cycles."},
    {"name": "TCS (Tata Consultancy)", "type": "Stock", "risk": "Low", "return_pct": 11.0, "desc": "Stable IT dividend payer. Good for capital protection."},
    {"name": "Sovereign Gold Bonds (SGB)", "type": "Commodity", "risk": "Low", "return_pct": 9.5, "desc": "Government-backed gold + 2.5% fixed interest. Ultimate safety."},
    {"name": "Silver ETF (Nippon)", "type": "Commodity", "risk": "Moderate", "return_pct": 11.8, "desc": "Industrial demand driven precious metal. Good inflation hedge."},
    {"name": "Liquid Debt Fund", "type": "Mutual Fund", "risk": "Low", "return_pct": 7.1, "desc": "Better than FD, highly liquid for emergency funds."}
]

class InvestmentRecommender:
    @staticmethod
    def get_picks(risk_score: int) -> List[dict]:
        """Picks 3 specific assets based on the user's calculated risk score (0-100)"""
        picks = []
        if risk_score >= 70: # Aggressive
            pool = [a for a in MARKET_DB if a["risk"] in ["High", "Moderate"]]
        elif risk_score >= 40: # Moderate
            pool = [a for a in MARKET_DB if a["risk"] in ["Moderate", "Low"]]
        else: # Conservative (Emergency/Job Loss)
            pool = [a for a in MARKET_DB if a["risk"] == "Low"]
            
        selected = random.sample(pool, min(3, len(pool)))
        return sorted(selected, key=lambda x: x["return_pct"], reverse=True)

# --- BEHAVIORAL HEURISTIC ENGINE ---
class TransactionAnalyzer:
    EMERGENCY_KEYWORDS = ['hospital', 'medical', 'pharmacy', 'doctor', 'clinic', 'ambulance', 'insurance claim']
    JOB_LOSS_KEYWORDS = ['severance', 'final salary', 'unemployment']
    LUXURY_KEYWORDS = ['jewellery', 'jewelry', 'luxury', 'premium', 'gold', 'diamond']
    
    def __init__(self, transactions: List[Transaction]):
        self.transactions = transactions
        self.total_spend = sum(abs(t.amount) for t in transactions if t.amount < 0)
        self.total_income = sum(t.amount for t in transactions if t.amount > 0)
        
    def detect_emergency(self):
        medical_spend = 0
        for t in self.transactions:
            if any(k in t.name.lower() for k in self.EMERGENCY_KEYWORDS) or any(k in c.lower() for k in self.EMERGENCY_KEYWORDS for c in t.category):
                medical_spend += abs(t.amount)
        if medical_spend > 0:
            return True, min(100, (medical_spend / max(self.total_spend, 1)) * 100), f"Medical emergency: ₹{medical_spend:,.0f}"
        return False, 0, ""
    
    def detect_income_change(self):
        for t in self.transactions:
            if any(k in t.name.lower() for k in self.JOB_LOSS_KEYWORDS):
                return True, 80, f"Job transition: {t.name}"
        if self.total_income < self.total_spend * 0.5 and self.total_spend > 10000:
            return True, 60, "Income below spending pattern"
        return False, 0, ""
    
    def detect_luxury_spending(self):
        luxury_spend = 0
        for t in self.transactions:
            if any(k in t.name.lower() for k in self.LUXURY_KEYWORDS):
                luxury_spend += abs(t.amount)
        if luxury_spend > 50000: 
            return True, 40, f"High luxury spending: ₹{luxury_spend:,.0f}"
        return False, 0, ""
    
    def calculate_liquidity_need(self) -> int:
        is_em, em_sev, _ = self.detect_emergency()
        is_jl, jl_sev, _ = self.detect_income_change()
        is_lux, lux_sev, _ = self.detect_luxury_spending()
        
        score = 0
        if is_em: score += em_sev
        if is_jl: score += jl_sev
        if is_lux: score += lux_sev * 0.5 
        return min(100, int(score))

# --- GOOGLE OR-TOOLS PORTFOLIO OPTIMIZER ---
class PortfolioOptimizer:
    def __init__(self, liquidity_need: int):
        self.liquidity_need = liquidity_need
    
    def optimize(self) -> dict:
        model = cp_model.CpModel()
        stocks = model.NewIntVar(0, 1000, 'stocks')
        bonds = model.NewIntVar(0, 1000, 'bonds')
        cash = model.NewIntVar(0, 1000, 'cash')
        
        model.Add(stocks + bonds + cash == 1000)
        model.Add(cash >= 50 + (self.liquidity_need * 250 // 100))
        model.Add(stocks <= 800 - (self.liquidity_need * 600 // 100))
        model.Add(bonds >= 100)
        
        model.Maximize(stocks * 7 + bonds * 4 + cash * 2)
        solver = cp_model.CpSolver()
        status = solver.Solve(model)
        
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            return {
                'stocks': solver.Value(stocks) // 10,
                'bonds': solver.Value(bonds) // 10,
                'cash': solver.Value(cash) // 10,
                'expected_return': solver.ObjectiveValue() / 1000,
                'status': 'optimal'
            }
        return {'stocks': 40, 'bonds': 40, 'cash': 20, 'expected_return': 4.6, 'status': 'fallback'}

# --- THE API ENDPOINT ---
@app.post("/api/engine/analyze")
async def analyze_behavior(data: AnalyzeRequest):
    analyzer = TransactionAnalyzer(data.transactions)
    is_em, _, em_r = analyzer.detect_emergency()
    is_jl, _, jl_r = analyzer.detect_income_change()
    is_lux, _, lux_r = analyzer.detect_luxury_spending()
    
    reasons = [r for b, r in [(is_em, em_r), (is_jl, jl_r), (is_lux, lux_r)] if b]
    liquidity_need = analyzer.calculate_liquidity_need()
    final_risk_score = max(0, 100 - liquidity_need)
    
    optimizer = PortfolioOptimizer(liquidity_need)
    result = optimizer.optimize()
    
    investment_picks = InvestmentRecommender.get_picks(final_risk_score)
    
    ai_message = f"Portfolio adjusted for safety: {'; '.join(reasons)}." if reasons else "Portfolio optimized for balanced growth."
    
    return {
        "new_risk_score": final_risk_score, 
        "allocation": {"stocks": result['stocks'], "bonds": result['bonds'], "cash": result['cash']},
        "ai_message": ai_message,
        "recommendations": investment_picks,
        "debug_info": {"expected_return": f"{result['expected_return']:.2f}%"}
    }