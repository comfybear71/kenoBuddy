import aiohttp
import asyncio
import random
import json
from dbconnector.timeutils import calculate_time_difference
from dbconnector.connector import connect_to_database
from dbconnector.telegramError import send_telegram_message


difference_in_seconds = 0


async def insert_into_db(data):
    conn = connect_to_database()
    crsr = conn.cursor()
    record_inserted = False
    
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
        send_telegram_message('XXX - WTF')
    
    crsr.execute("SELECT COUNT(*) FROM xxx_draws")
    count = crsr.fetchone()[0]
    # DELETE THE OLDEST RECORD TO MAKE ROOM FOR NEW RECORD MAX:100
    if count >= 100:
        crsr.execute("DELETE FROM xxx_draws ORDER BY current_closed LIMIT %s", (count - 99,))

    #CHECK TO SEE IF GAME NUMBER EXISTS OR NOT, IF DONT EXIST THEN PROCEED
    crsr.execute("SELECT 1 FROM xxx_draws WHERE current_game_number = %s LIMIT 1", (current_game_number,))
    
    if not crsr.fetchone():
        try:
            crsr.execute("INSERT INTO xxx_draws(current_game_number, current_closed, draw, opened, closing) VALUES (%s, %s, %s, %s, %s)", (current_game_number, closed, draw_json, opened, closing,))
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


async def call_api(url, max_retries=5, initial_delay=5):
    retries = 0
    delay = initial_delay

    async with aiohttp.ClientSession() as session:
        while retries < max_retries:
            try:
                
                async with session.get(url) as response:
                    # Ensure the response is JSON
                    #if response.headers.get('Content-Type') == 'application/json':
                    data = await response.json()
                    
                    if data is not None:  # Or any other validation of `data`
                        send_telegram_message("XXX - Valid data")
                        return data
                    else:
                        # If response is not JSON or data validation fails, prepare for retry
                        raise ValueError("Invalid response")
                    
            except (aiohttp.ClientError, ValueError) as e:
                print(f"Attempt {retries + 1}: {str(e)}")
                if retries < max_retries - 1:
                    # Wait with exponential backoff plus jitter
                    await asyncio.sleep(delay + random.uniform(0, 2))
                    delay *= 2
                retries += 1
        # All retries failed; handle accordingly
        send_telegram_message("XXX - API did not return valid data after maximum retries.")
        return None


async def continuously_check_condition(api_url):
    while True:
        data = await call_api(api_url)
        
        if data:
            await insert_into_db(data)
        
        await asyncio.sleep(difference_in_seconds + 5)


api_url = 'https://api-info-xxx.keno.com.au/v2/games/kds?jurisdiction=XXX'

asyncio.run(continuously_check_condition(api_url))


# def ensure_tables_exist():
#     conn = connect_to_database()
#     crsr = conn.cursor()
#     sql_command_create_table = """CREATE TABLE IF NOT EXISTS qld_draws (
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
