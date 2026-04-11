import numpy as np

class GoalAdvisor:
    def __init__(self):
        self.inflation_rate = 0.06  # 6% average inflation
        self.market_return = 0.12   # 12% average market return
        self.market_volatility = 0.15 # 15% volatility

    def analyze_goal(self, target, saved, monthly_sip):
        if monthly_sip <= 0:
            return {"error": "Monthly savings must be greater than 0"}

        gap = target - saved
        if gap <= 0:
            return {"status": "Achieved", "success_prob": 100}

        # 1. Basic time to goal (Months)
        months_needed = gap / monthly_sip
        years_needed = months_needed / 12

        # 2. Inflation Adjusted Target
        real_target = target * ((1 + self.inflation_rate) ** years_needed)

        # 3. Monte Carlo Simulation for Success Probability
        # Simulate 1000 market scenarios
        num_simulations = 1000
        success_count = 0
        
        for _ in range(num_simulations):
            current_val = saved
            step_sip = monthly_sip
            for m in range(int(months_needed)):
                # Monthly return with volatility
                m_return = np.random.normal(self.market_return/12, self.market_volatility/np.sqrt(12))
                current_val = (current_val + step_sip) * (1 + m_return)
            
            if current_val >= target:
                success_count += 1

        success_prob = (success_count / num_simulations) * 100

        # 4. AI Recommendation (Step-up SIP)
        # Calculate how much faster if SIP increases 10% every year
        optimized_months = 0
        current_val_opt = saved
        step_sip_opt = monthly_sip
        while current_val_opt < target and optimized_months < 600: # cap at 50yrs
            optimized_months += 1
            if optimized_months % 12 == 1 and optimized_months > 1:
                step_sip_opt *= 1.10 # 10% step up
            current_val_opt = (current_val_opt + step_sip_opt) * (1 + self.market_return/12)

        time_saved_months = max(0, months_needed - optimized_months)

        return {
            "probability": round(success_prob, 1),
            "inflation_adjusted_target": int(round(real_target)),
            "recommended_step_up": 10,
            "years_saved": round(time_saved_months / 12, 1),
            "real_value_at_end": int(round(target / ((1 + self.inflation_rate) ** years_needed))),
            "status": "On Track" if success_prob > 70 else "At Risk" if success_prob > 40 else "Difficult"
        }
