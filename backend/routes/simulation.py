from flask import Blueprint, jsonify, request

simulation_bp = Blueprint("simulation", __name__)

RETURN_RATES = {
    "conservative": {"typical": 0.05, "best": 0.07, "worst": 0.02},
    "balanced": {"typical": 0.08, "best": 0.12, "worst": 0.03},
    "aggressive": {"typical": 0.12, "best": 0.18, "worst": -0.01},
}


def dca_future_value(monthly_amount: float, annual_rate: float, months: int) -> float:
    if annual_rate <= 0:
        return round(monthly_amount * months, 2)
    r = annual_rate / 12
    fv = monthly_amount * ((1 + r) ** months - 1) / r
    return round(fv, 2)


@simulation_bp.post("/simulate")
def simulate():
    data = request.get_json()
    monthly_amount = float(data.get("monthly_amount", 100))
    years = int(data.get("years", 10))
    risk_profile = data.get("risk_profile", "balanced")

    rates = RETURN_RATES.get(risk_profile, RETURN_RATES["balanced"])
    result = {"scenarios": {"typical": [], "best": [], "worst": []}, "years": []}

    for year in range(1, years + 1):
        months = year * 12
        contributions = round(monthly_amount * months, 2)
        result["years"].append(year)
        for scenario, rate in rates.items():
            value = dca_future_value(monthly_amount, rate, months)
            result["scenarios"][scenario].append(
                {
                    "year": year,
                    "value": value,
                    "contributions": contributions,
                    "gain": round(value - contributions, 2),
                }
            )

    result["total_contributions"] = round(monthly_amount * years * 12, 2)
    return jsonify(result)
