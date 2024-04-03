from flask import Flask, jsonify, render_template, request, session, Response
import requests
from datetime import datetime, timedelta
import numpy as np
import json
import configparser
import MySQLdb

app = Flask(__name__)

jurisdiction = 'ACT'
numOfGames = 50

config = configparser.ConfigParser()
config.read('config.ini')

HOSTNAME = config.get('default', 'hostname')
USERNAME = config.get('default', 'username')
PASSWORD = config.get('default', 'password')
DATABASE = config.get('default', 'database')

# Function to connect to the database
def connect_to_database():
    conn = MySQLdb.connect(host=HOSTNAME, user=USERNAME, passwd=PASSWORD, db=DATABASE)
    #print("Database connected successfully")
    return conn


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

        # Example data manipulation: Counting the records
        #record_count = len(records)
        
        # More complex manipulations can go here

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









@app.route('/fetch', methods=['GET', 'POST'])
def proxy():

    if request.method == 'POST':
        data = request.get_json()
        jurisdiction = data.get('jurisdiction')
        numOfGames = data.get('numOfGames')

        if jurisdiction == 'QLD':
            api_url = "https://api-info-qld.keno.com.au/v2/games/kds?jurisdiction=QLD"
        elif jurisdiction == 'VIC':
            api_url = "https://api-info-vic.keno.com.au/v2/games/kds?jurisdiction=VIC"
        elif jurisdiction == 'NSW':
            api_url = "https://api-info-nsw.keno.com.au/v2/games/kds?jurisdiction=NSW"
        else:
            api_url = "https://api-info-act.keno.com.au/v2/games/kds?jurisdiction=ACT"

    try:
        response = requests.get(api_url)
        if response.status_code == 200:
            data = response.json()

            current_game_number = data['current'].get( 'game-number', 'Default Game Number')
            current_draw = data['current'].get('draw', 'Default Draw')
            current_closed = data['current'].get('closed', 'Default Closed')

            current_closed_dt = datetime.strptime( current_closed, "%Y-%m-%dT%H:%M:%S.%fZ")

            if current_closed_dt.time() >= datetime.strptime("21:30:00.002", "%H:%M:%S.%f").time():
                current_closed_dt += timedelta(days=1)
                gameDay = current_closed_dt.strftime("%Y-%m-%d")
            else:
                gameDay = current_closed_dt.strftime("%Y-%m-%d")



            draws, game_numbers, count_values, indices, game_number, numbers_array, hot_numbers, cold_numbers, previous_game_number = game_data.returnData(
                current_game_number, current_draw, gameDay, jurisdiction, numOfGames)

            # Construct the response object
            response_data = {
                "originalData": data,
                "processedData": {
                    "current_game_number": current_game_number,
                    "current_draw": current_draw,
                    "gameDay": gameDay,
                    "draws": draws,
                    "game_numbers": game_numbers,
                    "count_values": count_values,
                    "indices": indices,
                    "game_number": game_number,
                    "numbers_array": numbers_array,
                    "hot_numbers": json.dumps(hot_numbers),
                    "cold_numbers": json.dumps(cold_numbers),
                    "previous_game_number": previous_game_number

                }
            }
            

            return jsonify(response_data)

        else:
            # Log the error or inform an admin if necessary
            return jsonify({"error": "Failed to fetch data from the external API"}), 500
    except requests.exceptions.RequestException as e:
        # This prints the error to your console. For production, consider logging to a file or notification system.
        print(e)
        return jsonify({"error": "Error fetching data from the external API"}), 500


@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/data-view')
def data_view():
    # You can pass data to your template from here, if necessary
    return render_template('data_view.html')

@app.route('/act-view')
def act_view():
    # You can pass data to your template from here, if necessary
    return render_template('act_view.html')


@app.route('/nsw-view')
def nsw_view():
    # You can pass data to your template from here, if necessary
    return render_template('nsw_view.html')

@app.route('/qld-view')
def qld_view():
    # You can pass data to your template from here, if necessary
    return render_template('qld_view.html')

@app.route('/vic-view')
def vic_view():
    # You can pass data to your template from here, if necessary
    return render_template('vic_view.html')







class GameData:

    def get_modal_number(self, this_current_number, number_of_games):
        adjusted_number = this_current_number + 1000
        modal_number = (adjusted_number - int(number_of_games)) % 1000
        return modal_number

    def get_previous_modal_number(self, this_current_number):
        adjusted_number = this_current_number + 1000
        modal_number = (adjusted_number) % 1000
        return modal_number

    def returnData(self, current_game_number, current_draw, gameDay, jurisdiction, numOfGames):

        number_of_games = numOfGames
        modal_game_number = self.get_modal_number( current_game_number, number_of_games)
        previous_game_number = self.get_previous_modal_number( current_game_number - 1)

        if jurisdiction == 'QLD':
            base_url = "https://api-info-qld.keno.com.au"
            end_point = "/v2/info/history"
            additional_params = f"&starting_game_number={modal_game_number}&number_of_games={ number_of_games}&date={gameDay}&page_size={number_of_games}&page_number=1"
            full_url = f"{base_url}{ end_point}?jurisdiction=QLD{additional_params}"
        elif jurisdiction == 'VIC':
            base_url = "https://api-info-vic.keno.com.au"
            end_point = "/v2/info/history"
            additional_params = f"&starting_game_number={modal_game_number}&number_of_games={ number_of_games}&date={gameDay}&page_size={number_of_games}&page_number=1"
            full_url = f"{base_url}{ end_point}?jurisdiction=VIC{additional_params}"
        elif jurisdiction == 'NSW':
            base_url = "https://api-info-nsw.keno.com.au"
            end_point = "/v2/info/history"
            additional_params = f"&starting_game_number={modal_game_number}&number_of_games={ number_of_games}&date={gameDay}&page_size={number_of_games}&page_number=1"
            full_url = f"{base_url}{ end_point}?jurisdiction=NSW{additional_params}"
        else:
            base_url = "https://api-info-act.keno.com.au"
            end_point = "/v2/info/history"
            additional_params = f"&starting_game_number={modal_game_number}&number_of_games={ number_of_games}&date={gameDay}&page_size={number_of_games}&page_number=1"
            full_url = f"{base_url}{ end_point}?jurisdiction=ACT{additional_params}"

        response = requests.get(full_url)

        print(full_url)

        if response.status_code == 200:
            historic_data = response.json()

            game_numbers = [item['game-number']                
            for item in historic_data['items']]
            draws = [item['draw'] for item in historic_data['items']]

        game_numbers.append(current_game_number)
        draws.append(current_draw)

        game_numbers.reverse()
        draws.reverse()

        number_stats = {num: {"count": 0, "indices": [], "game-number": []} for num in range(1, 81)}



        # Iterate over each draw list
        for i, draw in enumerate(draws):
            # Iterate over each number in the draw list
            for num in draw:
                if 1 <= num <= 80:  # Ensure num is within the desired range
                    number_stats[num]["count"] += 1
                    # Use i+1 if you want indices to start from 1
                    number_stats[num]["indices"].append(i + 1)
                    number_stats[num]["game-number"].append(game_numbers[i])

        # Initialize an output list to store the results
        output_list = []
        # Iterate over each number in number_stats
        for num, stats in number_stats.items():
            if stats["count"] > 0:
                # Append the number, count, indices, and game numbers to the output list as a tuple
                output_list.append(
                    (num, stats['count'], stats['indices'], stats['game-number']))
            else:
                # If the number was not drawn, append a message to the output list
                output_list.append(f"Number {num}: Not drawn")

        unique, counts = np.unique(draws, return_counts=True)
        value_counts = list(zip(unique, counts))
        list2 = [t[1] for t in value_counts]
        sorted_value_counts = sorted( value_counts, key=lambda x: x[1], reverse=True)
        numbers_array = [num for num in range(1, 81)]

        count_values = []  # Rename count to avoid conflict
        indices = []
        game_number = []

        # Iterate through each tuple
        for tpl in output_list:
            # Ensure the tuple has at least four elements before unpacking
            if len(tpl) >= 4:
                c = tpl[1]
                idx = tpl[2]
                game_num = tpl[3]

                count_values.append(c)
                indices.append(idx)
                game_number.append(game_num)

        list1 = []
        list2 = []

        for item in sorted_value_counts:
            list1.append(item[0])
            list2.append(item[1])

        hot_numbers = list1[:10]
        hot_number_count = list2[:10]
        cold_numbers = list1[70:80]
        cold_number_count = list2[70:80]

        # Convert NumPy arrays to lists (for JSON serializable format)
        hot_numbers = list(map(int, hot_numbers))
        hot_number_count = list(map(int, hot_number_count))
        cold_numbers = list(map(int, cold_numbers))
        cold_number_count = list(map(int, cold_number_count))
        

        return draws, game_numbers, count_values, indices, game_number, numbers_array, hot_numbers, cold_numbers, previous_game_number

game_data = GameData()

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5000)



