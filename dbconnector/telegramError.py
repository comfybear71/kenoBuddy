# KENNOBUDDY/dbconnector/telegramError.property
import configparser
import requests

class TelegramError:
    def __init__(self, config_path):
        self.config_path = config_path
        self.error_bot = None
        self.chat_id = None
        self.load_config()
        
    def load_config(self):
        config = configparser.ConfigParser()
        config.read(self.config_path)
        self.error_bot = config.get('default', 'error_bot')
        self.chat_id = config.get('default', 'chat_id')
        
def send_telegram_message(message,  config_path='config.ini'):
    error_config = TelegramError(config_path)
    
    send_text = f'https://api.telegram.org/bot{error_config.error_bot}/sendMessage?chat_id={error_config.chat_id}&text={message}'
    
    response = requests.get(send_text)
    return response.json()
