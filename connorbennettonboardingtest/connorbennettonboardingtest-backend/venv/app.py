import os
import pandas as pd
from flask_cors import CORS # Import CORS
from flask import Flask, request, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv
from bson.objectid import ObjectId # Import ObjectId for handling MongoDB _id

df = pd.read_csv('Interview_dataset.csv')

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- MongoDB Connection ---
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable not set.")

client = MongoClient(MONGODB_URI)
db = client.OnboardingTest # Get the default database from the URI, or specify one: client.your_database_name

# Define a collection for users
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
            # Convert ObjectId to string for JSON serialization
            user['_id'] = str(user['_id'])
            users.append(user)
        return jsonify({"success": True, "data": users}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
@app.route('/api/bulkdata', methods=["POST"])
def buldata():
    try:
        # Convert DataFrame to list of dictionaries
        records = df.to_dict(orient='records')

        # Insert all records into MongoDB
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
    # Run the Flask app. In production, use a WSGI server like Gunicorn.
    app.run(debug=True, port=5000) # Run on port 5000, or any other free port