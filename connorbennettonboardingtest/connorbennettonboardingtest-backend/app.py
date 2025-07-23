import os
import pandas as pd
from flask_cors import CORS
from flask import Flask, request, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv
from bson.objectid import ObjectId

df = pd.read_csv('Interview_dataset.csv')

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- MongoDB Connection ---
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable not set.")

client = MongoClient(MONGODB_URI)
db = client.OnboardingTest

users_collection = db.Users

# --- API Routes ---

@app.route('/api/test', methods=['GET'])
def test():
    print("Test...")
    return jsonify("Test...")

@app.route('/api/users', methods=['GET'])
def get_users():
    """
    Retrieves all users from the MongoDB collection.
    """
    try:
        users = []
        for user in users_collection.find():
            user['_id'] = str(user['_id'])
            users.append(user)
        return jsonify({"success": True, "data": users}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
@app.route('/api/bulkdata', methods=["POST"])
def buldata():
    try:
        records = df.to_dict(orient='records')

        result = users_collection.insert_many(records)

        return jsonify({
            "success": True,
            "inserted_count": len(result.inserted_ids),
            "inserted_ids": [str(_id) for _id in result.inserted_ids]
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)