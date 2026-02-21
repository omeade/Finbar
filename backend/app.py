from flask import Flask, request, make_response
from routes.strategy import strategy_bp
from routes.simulation import simulation_bp
from routes.chat import chat_bp
from routes.stocks import stocks_bp

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = make_response()
        res.headers["Access-Control-Allow-Origin"] = "*"
        res.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        res.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return res, 204

app.register_blueprint(strategy_bp, url_prefix="/api")
app.register_blueprint(simulation_bp, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api")
app.register_blueprint(stocks_bp, url_prefix="/api")


@app.get("/")
def root():
    return {"message": "InvestIQ API running"}


if __name__ == "__main__":
    app.run(debug=True, port=8080)
