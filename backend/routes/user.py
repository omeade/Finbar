import json

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import UserData, db

user_bp = Blueprint("user", __name__)


@user_bp.get("/api/user/data")
@jwt_required()
def get_data():
    user_id = int(get_jwt_identity())
    ud = UserData.query.filter_by(user_id=user_id).first()
    if not ud:
        return jsonify({"settings": {}, "budget": {}}), 200
    return jsonify({"settings": ud.get_settings(), "budget": ud.get_budget()}), 200


@user_bp.put("/api/user/data")
@jwt_required()
def update_data():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    ud = UserData.query.filter_by(user_id=user_id).first()
    if not ud:
        ud = UserData(user_id=user_id)
        db.session.add(ud)

    if "settings" in data:
        ud.settings = json.dumps(data["settings"])
    if "budget" in data:
        ud.budget = json.dumps(data["budget"])

    db.session.commit()
    return jsonify({"success": True}), 200
