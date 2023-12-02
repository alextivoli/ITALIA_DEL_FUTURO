from waitress import serve
from flask import Flask
import ssl

certPath = '/etc/letsencrypt/live/italiadelfuturo.it/fullchain.pem'
keyPath = '/etc/letsencrypt/live/italiadelfuturo.it/privkey.pem'

app = Flask(__name__)

# Define your routes and other Flask application configurations here
@app.route('/')
def hello_world():
    return 'Hello, World!'

if __name__ == '__main__':
    # Serve HTTP
    #serve(app, host='0.0.0.0', port=80)

    # Serve HTTPS
    ssl_context = ssl.create_default_context(purpose=ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain(certfile=certPath, keyfile=keyPath)

    serve(app, host='0.0.0.0', port=443, url_scheme='https', ssl_context=ssl_context)