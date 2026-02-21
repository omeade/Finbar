from fastapi import APIRouter
from app.models.budget import BudgetSnapshot, BudgetResult
from app.engine.budget_engine import calculate_budget

budget_router = APIRouter(prefix="/budget", tags=["budget"])


@budget_router.post("/generate", response_model=BudgetResult)
def generate_budget(snapshot: BudgetSnapshot) -> BudgetResult:
    total_expenses, leftover, suggested_savings, message = calculate_budget(snapshot)

    return BudgetResult(
        total_expenses=total_expenses,
        leftover=leftover,
        suggested_savings=suggested_savings,
        message=message,
    )