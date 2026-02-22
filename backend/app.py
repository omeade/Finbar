import logging
import os
import time
from datetime import timedelta

from flask import Flask, g, make_response, request
from flask_jwt_extended import JWTManager

from models import bcrypt, db
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.simulation import simulation_bp
from routes.stocks import stocks_bp
from routes.strategy import strategy_bp
from routes.t212 import t212_bp
from routes.user import user_bp

app = Flask(__name__)

# ── Database & Auth config ────────────────────────────────────────────────────
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", f"sqlite:///{os.path.join(os.path.dirname(__file__), 'finbar.db')}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "finbar-dev-secret-change-in-prod")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

# ── Extensions ────────────────────────────────────────────────────────────────
db.init_app(app)
bcrypt.init_app(app)
JWTManager(app)

# ── Create tables on startup ──────────────────────────────────────────────────
with app.app_context():
    db.create_all()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
app.logger.setLevel(logging.INFO)


@app.before_request
def start_request_timer():
    g._request_started_at = time.perf_counter()


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = (
        "Content-Type,Authorization,X-T212-Key,X-T212-Secret"
    )
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    duration_ms = None
    started_at = getattr(g, "_request_started_at", None)
    if started_at is not None:
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
    body = request.get_data(as_text=True).strip()
    if len(body) > 500:
        body = body[:500] + "...(truncated)"
    app.logger.info(
        "API %s %s status=%s duration_ms=%s query=%s body=%s",
        request.method,
        request.path,
        response.status_code,
        duration_ms,
        request.query_string.decode("utf-8"),
        body or "<empty>",
    )
    return response


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = make_response()
        res.headers["Access-Control-Allow-Origin"] = "*"
        res.headers["Access-Control-Allow-Headers"] = (
            "Content-Type,Authorization,X-T212-Key,X-T212-Secret"
        )
        res.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        return res, 204


# ── Blueprints ────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(strategy_bp, url_prefix="/api")
app.register_blueprint(simulation_bp, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api")
app.register_blueprint(stocks_bp, url_prefix="/api")
app.register_blueprint(t212_bp, url_prefix="/api")


@app.get("/")
def root():
    return {"message": "Finbar API running"}


if __name__ == "__main__":
    app.run(debug=True, port=8080)
