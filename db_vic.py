import aiohttp
import asyncio
import random
import configparser
import json
from dbconnector.connector import connect_to_database
from dbconnector.timeutils import calculate_time_difference
from dbconnector.telegramError import send_telegram_message

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
        send_telegram_message('VIC - WTF')
        
    
    crsr.execute("SELECT COUNT(*) FROM vic_draws")
    count = crsr.fetchone()[0]
    if count >= 100:
        crsr.execute("DELETE FROM vic_draws ORDER BY current_closed LIMIT %s", (count - 99,))

    crsr.execute("SELECT 1 FROM vic_draws WHERE current_game_number = %s LIMIT 1", (current_game_number,))
    
    if not crsr.fetchone():
        try:
            crsr.execute("INSERT INTO vic_draws(current_game_number, current_closed, draw, opened, closing) VALUES (%s, %s, %s, %s, %s)", (current_game_number, closed, draw_json, opened, closing,))
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
                        send_telegram_message("VIC - Valid data")
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
        send_telegram_message(" VIC - API did not return valid data after maximum retries.")
        return None
            

async def continuously_check_condition(api_url):
    while True:
        data = await call_api(api_url)
        
        if data:
            await insert_into_db(data)
        
        await asyncio.sleep(difference_in_seconds + 5)


api_url = 'https://api-info-vic.keno.com.au/v2/games/kds?jurisdiction=VIC'
asyncio.run(continuously_check_condition(api_url))

