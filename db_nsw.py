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
    
    jackpots = data.get('selling', {}).get('jackpots')
    base_seven_spot = jackpots['seven-spot']['base']
    base_eight_spot = jackpots['eight-spot']['base']
    base_nine_spot = jackpots['nine-spot']['base']
    base_ten_spot = jackpots['ten-spot']['base']
    
    if draw is not None:
        draw_json = json.dumps(list(draw))
    else:
        await asyncio.sleep(1800)
        send_telegram_message('NSW - WTF')
    
    crsr.execute("SELECT COUNT(*) FROM nsw_draws")
    count = crsr.fetchone()[0]
    # DELETE THE OLDEST RECORD TO MAKE ROOM FOR NEW RECORD MAX:100
    if count >= 100:
        crsr.execute("DELETE FROM nsw_draws ORDER BY id LIMIT %s", (count - 99,))

    #CHECK TO SEE IF GAME NUMBER EXISTS OR NOT, IF DONT EXIST THEN PROCEED
    crsr.execute("SELECT 1 FROM nsw_draws WHERE current_game_number = %s LIMIT 1", (current_game_number,))
    
    if not crsr.fetchone():
        try:
            crsr.execute("INSERT INTO nsw_draws(current_game_number, draw, closing, 7_spot, 8_spot, 9_spot, 10_spot) VALUES (%s, %s, %s, %s, %s, %s, %s)", (current_game_number, draw_json, closing, base_seven_spot, base_eight_spot, base_nine_spot, base_ten_spot,))
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


async def call_api(url, max_retries=5, initial_delay=5, session=None):
    retries = 0
    delay = initial_delay
    own_session = False
    
    if session is None:
        session = aiohttp.ClientSession()

    try:
        while retries < max_retries:
            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data is not None:  # Or any other validation of `data`
                            # send_telegram_message("ACT - Valid data")
                            return data
                        else:
                            raise ValueError("Invalid response")
                    else:
                        send_telegram_message(f"ACT - HTTP status {response.status}")
                        raise aiohttp.ClientError(f"HTTP status {response.status}")
            except (aiohttp.ClientError, ValueError) as e:
                send_telegram_message(f"Attempt {retries + 1}: {str(e)}")
                if retries < max_retries - 1:
                    # Wait with exponential backoff plus jitter
                    await asyncio.sleep(delay + random.uniform(0, 2))
                    delay *= 2
                retries += 1
                send_telegram_message(f"Attempt {retries + 1}: {str(e)}")
    finally:
        if own_session:
            await session.close()  # Ensure the session is closed if we created it
    # All retries failed; handle accordingly
    send_telegram_message("ACT - API did not return valid data after maximum retries.")
    return None


async def continuously_check_condition(api_url):
    while True:
        data = await call_api(api_url)
        
        if data is not None:
            difference_in_seconds = calculate_time_difference(data.get('selling', {}).get('closing'))
            
            if difference_in_seconds is None:
                await asyncio.sleep(1800)
                send_telegram_message(f"ACT - Difference in seconds {difference_in_seconds}")
                difference_in_seconds = 0
                
            
            await insert_into_db(data)
            await asyncio.sleep(difference_in_seconds + 5)
        else:
            await asyncio.sleep(600)
            difference_in_seconds = 0
            send_telegram_message(f"NSW - {data}")


api_url = 'https://api-info-nsw.keno.com.au/v2/games/kds?jurisdiction=NSW'

asyncio.run(continuously_check_condition(api_url))
