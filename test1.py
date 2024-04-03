import aiohttp
import asyncio
import requests
from datetime import datetime, timedelta

API_URL_ACT = "https://api-info-act.keno.com.au/v2/games/kds?jurisdiction=ACT"

class GameData:
    def returnData(self, current_game_number, current_draw, gameDay):
        number_of_games = 50
        modal_game_number = self.get_modal_number( current_game_number, number_of_games)
        
        base_url = "https://api-info-act.keno.com.au"
        end_point = "/v2/info/history"
        additional_params = f"&starting_game_number={modal_game_number}&number_of_games={number_of_games}&date={gameDay}&page_size={number_of_games}&page_number=1"
        full_url = f"{base_url}{ end_point}?jurisdiction=ACT{additional_params}"  
        
        response = requests.get(full_url)

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

        count_values = [] 
        indices = []
        game_number = []

        for tpl in output_list:
            # Ensure the tuple has at least four elements before unpacking
            if len(tpl) >= 4:
                c = tpl[1]
                idx = tpl[2]
                game_num = tpl[3]

                count_values.append(c)
                indices.append(idx)
                game_number.append(game_num)
                
        print(f"Game Number: {current_game_number}, Draw: {current_draw}, Game Day: {gameDay}")
                
    def get_modal_number(self, this_current_number, number_of_games):
        adjusted_number = this_current_number + 1000
        modal_number = (adjusted_number - int(number_of_games)) % 1000
        return modal_number
        



async def call_api():
    
    game_data_instance = GameData()
    
    async with aiohttp.ClientSession() as session:  # Creates a session for making HTTP requests
        try:
            async with session.get(API_URL_ACT) as response:  # Asynchronous GET request
                if response.status == 200:
                    data = await response.json()  # Asynchronously read the response JSON
                    
                    current_game_number = data['current'].get('game-number', 'Default Game Number')
                    current_draw = data['current'].get('draw', 'Default Draw')
                    current_closed = data['current'].get('closed', 'Default Closed')

                    current_closed_dt = datetime.strptime(current_closed, "%Y-%m-%dT%H:%M:%S.%fZ")

                    if current_closed_dt.time() >= datetime.strptime("21:30:00.002", "%H:%M:%S.%f").time():
                        current_closed_dt += timedelta(days=1)
                        gameDay = current_closed_dt.strftime("%Y-%m-%d")
                    else:
                        gameDay = current_closed_dt.strftime("%Y-%m-%d")
                    
                    if current_game_number and current_draw:
                        game_data_instance.returnData(current_game_number, current_draw, gameDay)
                else:
                    print("Failed to fetch data from API")
        except aiohttp.ClientError as e:
            print(f"HTTP request error: {e}")

# To run the call_api coroutine
asyncio.run(call_api())

