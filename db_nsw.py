import MySQLdb
import aiohttp
import asyncio
from datetime import datetime, timezone
import configparser
import json
from dateutil import parser
from dbconnector.connector import connect_to_database
from dbconnector.timeutils import calculate_time_difference

config = configparser.ConfigParser()
config.read('config.ini')
difference_in_seconds = 0


async def insert_into_db(data):
    conn = connect_to_database('config.ini')
    crsr = conn.cursor()
    record_inserted = False  # Default to False
    
    global difference_in_seconds
    
    difference_in_seconds = calculate_time_difference(data.get('selling', {}).get('closing'))
    current_game_number = data.get('current', {}).get('game-number')
    draw = data.get('current', {}).get('draw')
    closed = data.get('current', {}).get('closed')
    opened = data.get('selling', {}).get('opened')
    closing = data.get('selling', {}).get('closing')
    
    if draw is not None:
        draw_json = json.dumps(list(draw))
    else:
        print('WTF')
    
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
        
        await asyncio.sleep(difference_in_seconds + 2)


api_url = 'https://api-info-nsw.keno.com.au/v2/games/kds?jurisdiction=NSW'
asyncio.run(continuously_check_condition(api_url))


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

