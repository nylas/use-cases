import os
import json
from hmac import HMAC, compare_digest
from flask import Flask, request
from flask_cors import CORS

# Nylas app credentials
NYLAS_CLIENT_SECRET = os.environ.get("NYLAS_CLIENT_SECRET")

# Verify the Nylas Webhook signature
def verify_signature(secret, signature, body):
    """
    Verify the Nylas Webhook signature
    """
    # Generate a signature using the secret and the request body
    generated_signature = HMAC(
        key=secret.encode(),
        msg=body,
        digestmod="sha256"
    ).hexdigest()

    # Compare the generated signature with the signature from the request header
    return compare_digest(generated_signature, signature)

# Initialize the Flask app
flask_app = Flask(__name__)

# Enable CORS for the Flask app
CORS(flask_app, supports_credentials=True)

# A get endpoint that will validate the Nylas Webhook challenge.
# The challenge is a HMAC-SHA256 signature using the client secret as the key.
@flask_app.route("/", methods=["GET"])
def webhook_challenge():
    """
    The webhook challenge endpoint
    """

    # Get the challenge and signature from the request
    challenge = request.args.get("challenge")

    if not challenge:
        return 'Missing challenge', 400

    # Return the challenge
    return challenge

# Create a callback route for the Nylas Webhook
@flask_app.route("/", methods=["POST"])
def webhook():
    """
    The webhook endpoint
    """

    # Get the signature and body from the request
    signature = request.headers.get("X-Nylas-Signature")
    body = request.get_data()

    # Ensure the client secret is set
    if not NYLAS_CLIENT_SECRET:
        print('Missing NYLAS_CLIENT_SECRET')
        return {"error": "Missing NYLAS_CLIENT_SECRET"}, 401

    # Verify the signature
    if not verify_signature(NYLAS_CLIENT_SECRET, signature, body):
        return {"error": "Invalid signature"}, 401

    # Parse the webhook payload
    body = request.get_json()

    #  Log the webhook event to the console json pretty printed
    print('Webhook event received: ', json.dumps(body, indent=2))

    return {"success": True}
