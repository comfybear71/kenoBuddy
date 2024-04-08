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
    closing = data.get('selling', {}).get('closing')
    
    if draw is not None:
        draw_json = json.dumps(list(draw))
    else:
        send_telegram_message('QLD - WTF')
    
    crsr.execute("SELECT COUNT(*) FROM qld_draws")
    count = crsr.fetchone()[0]
    # DELETE THE OLDEST RECORD TO MAKE ROOM FOR NEW RECORD MAX:100
    if count >= 100:
        crsr.execute("DELETE FROM qld_draws ORDER BY id LIMIT %s", (count - 99,))

    #CHECK TO SEE IF GAME NUMBER EXISTS OR NOT, IF DONT EXIST THEN PROCEED
    crsr.execute("SELECT 1 FROM qld_draws WHERE current_game_number = %s LIMIT 1", (current_game_number,))
    
    if not crsr.fetchone():
        try:
            crsr.execute("INSERT INTO qld_draws(current_game_number, draw,closing) VALUES (%s, %s, %s)", (current_game_number, draw_json, closing,))
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
                    data = await response.json()
                    
                    if data is not None:
                        # send_telegram_message("QLD - Valid data")
                        return data
                    else:
                        raise ValueError("Invalid response")
                    
            except (aiohttp.ClientError, ValueError) as e:
                print(f"Attempt {retries + 1}: {str(e)}")
                if retries < max_retries - 1:
                    await asyncio.sleep(delay + random.uniform(0, 2))
                    delay *= 2
                retries += 1
        send_telegram_message("QLD - API did not return valid data after maximum retries.")
        return None


async def continuously_check_condition(api_url):
    while True:
        data = await call_api(api_url)
        
        if data:
            await insert_into_db(data)
        
        await asyncio.sleep(difference_in_seconds + 5)


api_url = 'https://api-info-qld.keno.com.au/v2/games/kds?jurisdiction=QLD'

asyncio.run(continuously_check_condition(api_url))
