# KENNOBUDDY/dbconnector/connector.py
import MySQLdb
import configparser
import os

class DatabaseConfig:
    def __init__(self, config_path):
        self.config_path = os.path.join(os.path.dirname(__file__), 'config.ini')
        self.load_config()

    def load_config(self):
        config = configparser.ConfigParser()
        config.read(self.config_path)
        self.hostname = config.get('default', 'hostname')
        self.username = config.get('default', 'username')
        self.password = config.get('default', 'password')
        self.database = config.get('default', 'database')

def connect_to_database(config_path='config.ini'):
    db_config = DatabaseConfig(config_path)
    try:
        conn = MySQLdb.connect(host=db_config.hostname, user=db_config.username, passwd=db_config.password, db=db_config.database)
        print("Database connection successfully established.")
        return conn
    except MySQLdb.Error as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None