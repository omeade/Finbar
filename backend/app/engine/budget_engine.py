from typing import Tuple
from app.models.budget import BudgetSnapshot


def calculate_budget(snapshot: BudgetSnapshot) -> Tuple[float, float, float, str]:
    """
    Very simple budget math:
    - total_expenses = sum(expenses)
    - leftover = income - total_expenses
    - suggested_savings:
        * if leftover > 0 -> save 70% of leftover (just a simple rule)
        * else -> 0
    """
    total_expenses = sum(item.amount for item in snapshot.expenses)
    leftover = snapshot.monthly_income - total_expenses

    if leftover > 0:
        suggested_savings = round(leftover * 0.70, 2)
        message = (
            f"You have €{round(leftover, 2)} left after expenses. "
            f"A simple suggestion is to save about €{suggested_savings}."
        )
    else:
        suggested_savings = 0.0
        message = (
            f"You're overspending by €{abs(round(leftover, 2))}. "
            f"Try reducing expenses or increasing income."
        )

    total_expenses = round(total_expenses, 2)
    leftover = round(leftover, 2)

    return total_expenses, leftover, suggested_savings, message