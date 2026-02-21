from pydantic import BaseModel, Field
from typing import List


class ExpenseItem(BaseModel):
    name: str = Field(..., examples=["Rent"])
    amount: float = Field(..., ge=0, examples=[1200])


class BudgetSnapshot(BaseModel):
    """What the user sends to us."""
    monthly_income: float = Field(..., gt=0, examples=[3000])
    expenses: List[ExpenseItem] = Field(default_factory=list)


class BudgetResult(BaseModel):
    """What we send back."""
    total_expenses: float
    leftover: float
    suggested_savings: float
    message: str