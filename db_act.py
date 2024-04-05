import MySQLdb
import aiohttp
import asyncio
from datetime import datetime, timezone
import configparser
import json
from dateutil import parser

config = configparser.ConfigParser()
config.read('config.ini')
difference_in_seconds = 0

HOSTNAME = config.get('default', 'hostname')
USERNAME = config.get('default', 'username')
PASSWORD = config.get('default', 'password')
DATABASE = config.get('default', 'database')

# Function to connect to the database
def connect_to_database():
    conn = MySQLdb.connect(host=HOSTNAME, user=USERNAME, passwd=PASSWORD, db=DATABASE)
    return conn


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
    utc_now = datetime.now(timezone.utc)
    closing = parser.parse(closing)
    utc_now_on_arbitrary_date = utc_now.replace(year=2000, month=1, day=1, microsecond=0)
    closing_on_arbitrary_date = closing.replace(year=2000, month=1, day=1, microsecond=0)
    difference_in_seconds = int((closing_on_arbitrary_date - utc_now_on_arbitrary_date).total_seconds())

    
    if draw is not None:
        draw_json = json.dumps(list(draw))
    else:
        print('WTF')
        
    crsr.execute("SELECT COUNT(*) FROM act_draws")
    count = crsr.fetchone()[0]
    if count >= 100:
        crsr.execute("DELETE FROM act_draws ORDER BY current_closed LIMIT %s", (count - 99,))

    crsr.execute("SELECT 1 FROM act_draws WHERE current_game_number = %s LIMIT 1", (current_game_number,))
    
    if not crsr.fetchone():
        try:
            crsr.execute("INSERT INTO act_draws(current_game_number, current_closed, draw, opened, closing) VALUES (%s, %s, %s, %s, %s)", (current_game_number, closed, draw_json, opened, closing,))
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
        
        await asyncio.sleep(difference_in_seconds + 2)

api_url = 'https://api-info-act.keno.com.au/v2/games/kds?jurisdiction=ACT'
asyncio.run(continuously_check_condition(api_url))

# def ensure_tables_exist():
#     conn = connect_to_database()
#     crsr = conn.cursor()
#     sql_command_create_table = """CREATE TABLE IF NOT EXISTS act_draws (
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
