import MySQLdb
import aiohttp
import asyncio
from datetime import datetime
import configparser
import json
from dateutil import parser

config = configparser.ConfigParser()
config.read('config.ini')
difference_in_seconds = 160

HOSTNAME = config.get('default', 'hostname')
USERNAME = config.get('default', 'username')
PASSWORD = config.get('default', 'password')
DATABASE = config.get('default', 'database')

# Function to connect to the database
def connect_to_database():
    conn = MySQLdb.connect(host=HOSTNAME, user=USERNAME, passwd=PASSWORD, db=DATABASE)
    return conn

# def ensure_tables_exist():
#     conn = connect_to_database()
#     crsr = conn.cursor()
#     sql_command_create_table = """CREATE TABLE IF NOT EXISTS nsw_draws (
#                             id INT AUTO_INCREMENT PRIMARY KEY,
#                             current_game_number INT NOT NULL,
#                             current_closed DATETIME,
#                             draw JSON,
#                             opened DATETIME,
#                             closing DATETIME,
#                             CONSTRAINT UC_GameNumber UNIQUE (current_game_number)
#                         );"""
#     try:
#         crsr.execute(sql_command_create_table)
#         conn.commit()
#         print("Tables ensured to exist successfully.")
#     except Exception as e:
#         print(f"An error occurred while ensuring tables exist: {e}")
#     finally:
#         crsr.close()
#         conn.close()
# ensure_tables_exist()

async def insert_into_db(data):
    conn = connect_to_database()
    crsr = conn.cursor()
    record_inserted = False  # Default to False
    
    global difference_in_seconds
    
    current = data.get('current', {})
    selling = data.get('selling', {})
    
    current_game_number = current.get('game-number')
    draw = current.get('draw')
    closed = current.get('closed')
    
    opened = selling.get('opened')
    closing = selling.get('closing')
    
    
    # Check if either variable is None
    if opened is None or closing is None:
        print("One of the times is None, cannot calculate difference.")
    else:
        # Proceed with the calculation since both are not None
        time1 = parser.parse(opened)
        time2 = parser.parse(closing)
        difference_in_seconds = (time2 - time1).total_seconds()
        print(f"The difference in seconds is: {difference_in_seconds}")
        
        
    if draw is not None:
        draw_json = json.dumps(list(draw))
        
    
    crsr.execute("SELECT COUNT(*) FROM nsw_draws")
    count = crsr.fetchone()[0]
    if count >= 100:
        crsr.execute("DELETE FROM nsw_draws ORDER BY current_closed LIMIT %s", (count - 99,))

    crsr.execute("SELECT 1 FROM nsw_draws WHERE current_game_number = %s LIMIT 1", (current_game_number,))
    
    if not crsr.fetchone():
        try:
            crsr.execute("INSERT INTO nsw_draws(current_game_number, current_closed, draw, opened, closing) VALUES (%s, %s, %s, %s, %s)", (current_game_number, closed, draw_json, opened, closing,))
            conn.commit()
            print("Record inserted successfully.")
            record_inserted = True 
        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            crsr.close()
            conn.close()
            print("MySQL connection is closed")
        return record_inserted
    else:
        print(f"Game-number {current_game_number} already exists, skipping insertion.")

async def call_api(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

async def continuously_check_condition(api_url):

    while True:
        data = await call_api(api_url)
        
        if data:
            await insert_into_db(data)
        
        # Adjust sleep duration based on insertion result
        #sleep_duration = 160 if record_inserted else 5
        await asyncio.sleep(difference_in_seconds)


api_url = 'https://api-info-nsw.keno.com.au/v2/games/kds?jurisdiction=NSW'
asyncio.run(continuously_check_condition(api_url))

