from fastapi import FastAPI
from app.agents.routers.budget_router import budget_router

app = FastAPI()

# include your budget routes
app.include_router(budget_router)


@app.get("/")
def root():
    return {"message": "Finance Agent Backend Running 🚀"}