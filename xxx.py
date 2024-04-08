from flask import Flask, jsonify, render_template, request, session, Response
from datetime import datetime, timezone
import numpy as np
import json
import aiohttp
import threading  # Make sure to import threading here
import asyncio
import random
from dbconnector.timeutils import calculate_time_difference
from dbconnector.connector import connect_to_database
from dbconnector.telegramError import send_telegram_message


app = Flask(__name__)

jurisdiction = 'ACT'
numOfGames = 10
last_checked_id = 0
difference_in_seconds = 0

async def call_api(url, max_retries=5, initial_delay=5):
    global difference_in_seconds
    retries = 0
    delay = initial_delay

    async with aiohttp.ClientSession() as session:
        while retries < max_retries:
            try:
                async with session.get(url) as response:
                    data = await response.json()
                    if data is not None:  # Or any other validation of `data`
                        send_telegram_message("MAIN APP- Valid data")
                        # Use calculate_time_difference from the imported module
                        
                        closing_time_str = data.get('selling', {}).get('closing')
                        
                        message = f'closing_time_str {closing_time_str}'
                        send_telegram_message(message)
                        
                        difference_in_seconds = calculate_time_difference(closing_time_str)
                        message = f'difference_in_seconds {difference_in_seconds}'
                        send_telegram_message(message)
                        
                        return data
                    else:
                        raise ValueError("Invalid response")
                    
            except (aiohttp.ClientError, ValueError) as e:
                print(f"Attempt {retries + 1}: {str(e)}")
                if retries < max_retries - 1:
                    await asyncio.sleep(delay + random.uniform(0, 2))
                    delay *= 2
                retries += 1
        send_telegram_message("MAIN APP - API did not return valid data after maximum retries.")
        return None


async def continuously_check_condition(api_url):
    while True:
        data = await call_api(api_url)
        
        await asyncio.sleep(difference_in_seconds + 5)


@app.route('/data', methods=['GET'])
def fetch_data():
    conn = connect_to_database()
    crsr = conn.cursor()
    if conn:
        
        crsr.execute("SELECT * FROM act_numbers")
        records = crsr.fetchall()
        
        # Fetch column names
        columns = [col[0] for col in crsr.description]

        # Convert each row to a dictionary
        results = [dict(zip(columns, row)) for row in records]
        
        crsr.close()
        conn.close()

        return jsonify({"data": results})
    else:
        return jsonify({"error": "Database connection failed."})

@app.route('/act', methods=['GET'])
def fetch_act():
    conn = connect_to_database()
    crsr = conn.cursor()
    if conn:
        
        crsr.execute("SELECT * FROM act_numbers")
        records = crsr.fetchall()
        
        columns = [col[0] for col in crsr.description]
        results = [dict(zip(columns, row)) for row in records]
        
        crsr.close()
        conn.close()

        return jsonify({"data": results})
    else:
        return jsonify({"error": "Database connection failed."})

@app.route('/nsw', methods=['GET'])
def fetch_nsw():
    conn = connect_to_database()
    crsr = conn.cursor()
    if conn:
        
        crsr.execute("SELECT * FROM nsw_numbers")
        records = crsr.fetchall()
        
        columns = [col[0] for col in crsr.description]
        results = [dict(zip(columns, row)) for row in records]
        
        crsr.close()
        conn.close()

        return jsonify({"data": results})
    else:
        return jsonify({"error": "Database connection failed."})

@app.route('/qld', methods=['GET'])
def fetch_qld():
    conn = connect_to_database()
    crsr = conn.cursor()
    if conn:
        
        crsr.execute("SELECT * FROM qld_numbers")
        records = crsr.fetchall()
        
        columns = [col[0] for col in crsr.description]
        results = [dict(zip(columns, row)) for row in records]
        
        crsr.close()
        conn.close()

        return jsonify({"data": results})
    else:
        return jsonify({"error": "Database connection failed."})

@app.route('/vic', methods=['GET'])
def fetch_vic():
    conn = connect_to_database()
    crsr = conn.cursor()
    if conn:
        
        crsr.execute("SELECT * FROM vic_numbers")
        records = crsr.fetchall()
        
        columns = [col[0] for col in crsr.description]
        results = [dict(zip(columns, row)) for row in records]
        
        crsr.close()
        conn.close()

        return jsonify({"data": results})
    else:
        return jsonify({"error": "Database connection failed."})

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/data-view')
def data_view():
    return render_template('data_view.html')

@app.route('/act-view')
def act_view():
    return render_template('act_view.html')

@app.route('/nsw-view')
def nsw_view():
    return render_template('nsw_view.html')

@app.route('/qld-view')
def qld_view():
    return render_template('qld_view.html')

@app.route('/vic-view')
def vic_view():
    return render_template('vic_view.html')

@app.route('/fetch', methods=['GET', 'POST'])
def proxy():
    conn = connect_to_database()
    crsr = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json()
        jurisdiction = data.get('jurisdiction')
        numOfGames = int(data.get('numOfGames'), 0)
        
        if conn:
        
            table_name = ""
            if jurisdiction == 'ACT':
                table_name = "act_draws"
            elif jurisdiction == 'QLD':
                table_name = "qld_draws"
            elif jurisdiction == 'NSW':
                table_name = "nsw_draws"
            elif jurisdiction == 'VIC':
                table_name = "vic_draws"
                
            if table_name:
                # Directly using numOfGames in the query after validation
                query = f"SELECT * FROM {table_name} ORDER BY id DESC LIMIT {numOfGames}"
                crsr.execute(query)
                records = crsr.fetchall()
                crsr.close()
                conn.close()
                
                return process_records(data, records)

        return jsonify({"error": "Invalid request"}), 400

def process_records(data, records):        
    
    for record in records:
        id, current_game_number, current_closed, draw, opened, closing = record

    draws, game_numbers, current_game_number, count_values, indices, hot_numbers, cold_numbers = game_data.returnData(records)
    numbers_arrays = [num for num in range(1, 81)]
    
    if difference_in_seconds < 0:
        sendError = "error"
        message = f'FML: seconds {difference_in_seconds}'
        send_telegram_message(message)
    else:
        sendError = ""
        message = f'SUCK MY SALTY BALLS: seconds {difference_in_seconds}'
        send_telegram_message(message)

    responseData = {
        "originalData": data,
        "processedData": {
            "draws": draws,
            "game_numbers": game_numbers,
            "current_game_number": current_game_number,
            "count_values": count_values,
            "indices": indices,
            "hot_numbers": hot_numbers,
            "cold_numbers": cold_numbers,
            "numbers_array": numbers_arrays,
            "opened": opened,
            "closing": closing,
            "difference_in_seconds": difference_in_seconds,
            "sendError": sendError
        }
    }

    return jsonify({"data": responseData})


class GameData:

    def returnData(self, records):
        
        # Convert records to a list of dictionaries for JSON serialization
        processed_records = [{
            "current_game_number": rec[1],
            "draw": json.loads(rec[3])  # Assuming rec[3] is a JSON string representing a list
        } for rec in records]  
        
        # Extract the draw numbers from the processed records
        draws = [rec["draw"] for rec in processed_records]
        game_numbers = [rec["current_game_number"] for rec in processed_records]
        current_game_numbers = [rec["current_game_number"] for rec in processed_records]
        
        number_stats = {num: {"count": 0, "indices": [], "game-number": []} for num in range(1, 81)}
        
        for i, draw in enumerate(draws):
            for num in draw:
                if 1 <= num <= 80: 
                    number_stats[num]["count"] += 1
                    number_stats[num]["indices"].append(i + 1)
                    number_stats[num]["game-number"].append(current_game_numbers[i])

        output_list = []
        
        for num, stats in number_stats.items():
            if stats["count"] > 0:
                output_list.append(
                    (num, stats['count'], stats['indices'], stats['game-number']))
            else:
                output_list.append(f"Number {num}: Not drawn")

        unique, counts = np.unique(draws, return_counts=True)
        value_counts = list(zip(unique, counts))
        list2 = [t[1] for t in value_counts]
        sorted_value_counts = sorted( value_counts, key=lambda x: x[1], reverse=True)

        count_values = []  # Rename count to avoid conflict
        indices = []
        current_game_number = []

        # Iterate through each tuple
        for tpl in output_list:
            if len(tpl) >= 4:
                c = tpl[1]
                idx = tpl[2]
                game_num = tpl[3]

                count_values.append(c)
                indices.append(idx)
                current_game_number.append(game_num)
                

        list1 = []
        list2 = []

        for item in sorted_value_counts:
            list1.append(item[0])
            list2.append(item[1])

        hot_numbers = list1[:10]
        hot_number_count = list2[:10]
        cold_numbers = list1[70:80]
        cold_number_count = list2[70:80]

        hot_numbers = list(map(int, hot_numbers))
        hot_number_count = list(map(int, hot_number_count))
        cold_numbers = list(map(int, cold_numbers))
        cold_number_count = list(map(int, cold_number_count))
        

        return draws, game_numbers, current_game_number, count_values, indices, hot_numbers, cold_numbers

game_data = GameData()



# Function to run the asyncio loop in a separate thread
def start_async_loop():
    api_url = 'https://api-info-act.keno.com.au/v2/games/kds?jurisdiction=ACT'
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(continuously_check_condition(api_url))

if __name__ == '__main__':
    # Start the asyncio loop in a background thread
    threading.Thread(target=start_async_loop, daemon=True).start()
    # Start the Flask app
    app.run(host="0.0.0.0", debug=True, port=5000)



