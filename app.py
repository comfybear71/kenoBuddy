from flask import Flask, jsonify, render_template, request, session, Response
import requests
from datetime import datetime, timedelta
import numpy as np
import json
import configparser
import MySQLdb

app = Flask(__name__)

jurisdiction = 'ACT'
numOfGames = 10
last_checked_id = 0
difference_in_seconds = 160

config = configparser.ConfigParser()
config.read('config.ini')

HOSTNAME = config.get('default', 'hostname')
USERNAME = config.get('default', 'username')
PASSWORD = config.get('default', 'password')
DATABASE = config.get('default', 'database')

#CTRL + SHIFT + L multiple select tool
# Collapse: Ctrl + Shift + [ 
# Expand: Ctrl + Shift + ] 

# Function to connect to the database
def connect_to_database():
    conn = MySQLdb.connect(host=HOSTNAME, user=USERNAME, passwd=PASSWORD, db=DATABASE)
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
                query = f"SELECT * FROM {table_name} ORDER BY current_game_number DESC LIMIT {numOfGames}"
                crsr.execute(query)
                records = crsr.fetchall()
                crsr.close()
                conn.close()
                
                return process_records(data, records)

        return jsonify({"error": "Invalid request"}), 400

@app.route('/check', methods=['GET', 'POST'])
def check():
    global last_checked_id
    conn = connect_to_database()
    crsr = conn.cursor()
    
    if request.method == 'POST':
        data = request.get_json()
        jurisdiction = data.get('jurisdiction')
        
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
                query = f"SELECT * FROM {table_name} WHERE id > %s ORDER BY id DESC"
                crsr.execute(query, (last_checked_id,))
                results = crsr.fetchall()
                if results:
                    last_checked_id = results[0][0]
                    return jsonify({"newRecords": True, 'records': results})
                else:
                    return jsonify({"newRecords":False})

            crsr.close()
            conn.close()


def process_records(data, records):        
    global difference_in_seconds
    for record in records:
        id, current_game_number, current_closed, draw, opened, closing = record
        # print(f"Game ID: {id}")
        # print(f"Game Number: {current_game_number}")
        # print(f"Game Date: {current_closed}")
        # print(f"Draw Numbers: {draw}")
        # print(f"Opened: {opened}")
        # print(f"Closing: {closing}")
        # print("----------")
    # print(data)

    draws, game_numbers, current_game_number, count_values, indices, hot_numbers, cold_numbers = game_data.returnData(records)
    
    numbers_arrays = [num for num in range(1, 81)]
    
    # Check if either variable is None
    if opened is None or closing is None:
        print("One of the times is None, cannot calculate difference.")
    else:
        # Proceed with the calculation since both are not None
        time1 = datetime.strptime(opened, '%Y-%m-%d %H:%M:%S')
        time2 = datetime.strptime(closing, '%Y-%m-%d %H:%M:%S')
        difference_in_seconds = (time2 - time1).total_seconds()
        print(f"The difference in seconds is: {difference_in_seconds}")
        
    
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
            "difference_in_seconds": difference_in_seconds
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
        
        # Iterate over each draw list
        for i, draw in enumerate(draws):
            # Iterate over each number in the draw list
            for num in draw:
                if 1 <= num <= 80:  # Ensure num is within the desired range
                    number_stats[num]["count"] += 1
                    # Use i+1 if you want indices to start from 1
                    number_stats[num]["indices"].append(i + 1)
                    number_stats[num]["game-number"].append(current_game_numbers[i])

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

        count_values = []  # Rename count to avoid conflict
        indices = []
        current_game_number = []

        # Iterate through each tuple
        for tpl in output_list:
            # Ensure the tuple has at least four elements before unpacking
            if len(tpl) >= 4:
                c = tpl[1]
                idx = tpl[2]
                game_num = tpl[3]

                count_values.append(c) #NUMBER OF TIMES NUMBERS DRAWN IN 20, 50, 100
                indices.append(idx)
                current_game_number.append(game_num)
                
        # print(current_game_number)

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
        

        return draws, game_numbers, current_game_number, count_values, indices, hot_numbers, cold_numbers

game_data = GameData()

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5000)



