# KENNOBUDDY/dbconnector/telegramError.property
import configparser
import requests
import os

class TelegramError:
    def __init__(self):
        # Constructs the path to 'config.ini' located in the same directory as this script
        self.config_path = os.path.join(os.path.dirname(__file__), 'config.ini')
        self.load_config()
        
    def load_config(self):
        config = configparser.ConfigParser()
        config.read(self.config_path)
        # Assuming your config.ini has [default] section
        self.error_bot = config.get('default', 'error_bot')
        self.chat_id = config.get('default', 'chat_id')
        
def send_telegram_message(message):
    error_config = TelegramError()
    send_text = f'https://api.telegram.org/bot{error_config.error_bot}/sendMessage?chat_id={error_config.chat_id}&text={message}'
    response = requests.get(send_text)
    return response.json()
