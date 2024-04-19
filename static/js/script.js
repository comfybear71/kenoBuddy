let intervalId;
let isFetching = false; // Flag to prevent duplicate fetches
let isChecking = false;
var currentIndex = 0;
let globalCurrentDraw = [];
let globalGameNumber = [];
let globalCurrentGameNumber = [];
let globalNumbers_array = []

let jurisdictionAdded = false;

addChangeListener('jurisdiction', onJurisdictionChange);
addChangeListener('numOfGames', onNumOfGamesChange);
var chances= document.getElementById("chances");
var clear = document.getElementById("clear");
var draw = document.getElementById("draw");
var previous = document.getElementById("previous");
var plucker = document.getElementById("plucker");




function addChangeListener(elementId, callback) {
    const element = document.getElementById(elementId);
    element.addEventListener('change', callback);
}

const appState = {
    get jurisdiction() {
        return document.getElementById('jurisdiction').value;
    },
    get numOfGames() {
        return document.getElementById('numOfGames').value;
    }
};

//jurisdiction = document.getElementById('jurisdiction').value;
//numOfGames document.getElementById('numOfGames').value;

function fetchDataAndUpdateDOM() {
    if (isFetching) return;
    isFetching = true;
    
    fetch('/fetch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                jurisdiction: appState.jurisdiction, 
                numOfGames: appState.numOfGames 
            }),
        })
        
        .then(response => response.json())
        .then(responseData  => {
            if (!responseData.data) {
                throw new Error('Data is undefined');
            }

            const processedData = responseData.data.processedData; //draws, current_game_number, count_values, indices, hot_numbers, cold_numbers
            if (!processedData) {
                throw new Error('processedData is undefined');
            }
            
            const numbers_array = Array.from({length: 80}, (_, index) => index + 1);
            
            const current_draw = processedData.draws[0];
            const game_number = processedData.game_numbers;//an array of number when they came out of the game

            const arrayLength = current_draw.length;
            const cold_numbers = processedData.cold_numbers;
            const indices = processedData.indices;
            const count_values = processedData.count_values;
            const difference_in_seconds = processedData.difference_in_seconds;

            const seven_spot = (processedData.seven_spot);
            const eight_spot = (processedData.eight_spot);
            const nine_spot = (processedData.nine_spot);
            const ten_spot = (processedData.ten_spot);

            const formatNumber = (number) => {
                return new Intl.NumberFormat('en-AU', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    useGrouping: true
                }).format(number);
            };
            
            document.getElementById('card-7-spot').innerHTML = `$${formatNumber(seven_spot)}`;
            document.getElementById('card-8-spot').innerHTML = `$${formatNumber(eight_spot)}`;
            document.getElementById('card-9-spot').innerHTML = `$${formatNumber(nine_spot)}`;
            document.getElementById('card-10-spot').innerHTML = `$${formatNumber(ten_spot)}`;

            //GLOBALS
            globalGameNumber = game_number;
            globalCurrentDraw = current_draw;
            globalCurrentGameNumber = processedData.current_game_number;
            globalNumbers_array = numbers_array;
            
            const firstFiveElementsFromEach = indices.map(innerArray => {
                // Check if innerArray exists
                if (innerArray && innerArray.length > 0) {
                    switch (innerArray.length) {
                        case 1:
                            // Handle case for 1 element
                            return [innerArray[0], '\u2620', '\u2620', '\u2620']; // Add placeholders as needed
                        case 2:
                            // Handle case for 2 elements
                            return [innerArray[0], innerArray[1], '\u2620', '\u2620']; // Add placeholders as needed
                        case 3:
                            // Handle case for 3 elements
                            return [innerArray[0], innerArray[1], innerArray[2], '\u2620']; // Add placeholders as needed
                        default:
                            // Handle case for 4 or more elements (slicing the first 4 elements)
                            return innerArray.slice(0, 4);
                    }
                } else {
                    
                    return ['\u2620', '\u2620', '\u2620', '\u2620']; // Or any other default values
                    
                }
            });

            onJurisdiction();
            updateDOMWithGameData(processedData, firstFiveElementsFromEach, count_values, current_draw, game_number); // Updates DOM with the game data
            manageCountdown(difference_in_seconds); // Manages the countdown and game stat

        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            isFetching = false; // Reset isFetching regardless of fetch result
        });
}

function onJurisdictionChange() {
    console.log('Jurisdiction changed to: ', document.getElementById('jurisdiction').value);
    const selectedJurisdiction = this.value;
    localStorage.setItem('selectedJurisdiction', selectedJurisdiction);
    revertStyles();
    showLoadingMessage();

    setTimeout(function() {
        hideLoadingMessage(); 
    }, 3000); 

    setTimeout(function() {
        fetchDataAndUpdateDOM(); 
    }, 3000);

}

function onNumOfGamesChange() {
    console.log('Number of Games changed to: ', document.getElementById('numOfGames').value);
    const selectedNumOfGames = this.value;
    localStorage.setItem('selectedNumOfGames', selectedNumOfGames);

    fetchDataAndUpdateDOM();
}

function showLoadingMessage() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingMessage() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function manageCountdown(differenceInSeconds) {
    clearInterval(intervalId); // Clear any existing countdown
    let countdownSeconds = Math.floor(differenceInSeconds);

    intervalId = setInterval(() => {
        if (countdownSeconds <= 0) {
            revertStyles(); // Assuming this resets some styles - ensure this function is defined elsewhere
            clearInterval(intervalId); // Stop the countdown
            
            document.getElementById('gameState').textContent = 'closed.';
    
            setTimeout(function() {
                fetchDataAndUpdateDOM(); // Ensure this function is defined elsewhere
            }, 5000);
        } else if (countdownSeconds <= 4) {
            document.getElementById('timer').textContent = '5 seconds.';
            document.getElementById('gameState').textContent = 'closing...';
        } else {
            // Update the countdown timer every second until it reaches the above conditions
            document.getElementById('timer').textContent = `Next: ${countdownSeconds}`;
            document.getElementById('gameState').textContent = 'Results';
        }
        countdownSeconds -= 1; // Decrement the countdown each second
    }, 1000);
}

function updateDOMWithGameData(processedData, firstFiveElementsFromEach, count_values, current_draw, game_number) {

    document.getElementById('gameNumber').textContent = `Number: ${game_number}`;
    
    updateBoard(firstFiveElementsFromEach, count_values);
    runMain(current_draw, currentIndex, current_draw.length);
    crazy_numbers(processedData.draws, processedData.indices, globalNumbers_array);
    hotNumber(processedData.hot_numbers);
    coldNumber(processedData.cold_numbers);

    globalPreviousGameNumber = processedData.previous_game_number;
    let message1 = 'Latest Game No. ' + globalGameNumber;
    caption.innerHTML = message1
    caption1.innerHTML = message1
}

function updateBoard(firstFiveElementsFromEach, countValues) {
    let totalDraws = document.getElementById('numOfGames').value;// Example total draws

    // Loop through all cells
    for (let i = 1; i <= 80; i++) {
        const cell = document.getElementById(`cell-${i}`);
        const index = i - 1; // Adjust index for zero-based array

         // Adding the click event listener
        cell.addEventListener('click', function() {
            this.classList.toggle('clicked'); // Example: Toggle a class to change style
        });

        // Find or create the bottom-number div
        let bottomDiv = cell.querySelector('.bottom-number');
        if (!bottomDiv) {
            bottomDiv = document.createElement('div');
            bottomDiv.className = 'bottom-number';
            bottomDiv.id = `bottom-number-${index}`;
            cell.appendChild(bottomDiv);
        }
        // Update bottomDiv content with first five elements from each corresponding index
        bottomDiv.textContent = firstFiveElementsFromEach[index].join(', '); // Assuming it's an array

        // // Find or create the badge div
        // let badge = cell.querySelector('.badge');
        // if (!badge) {
        //     badge = document.createElement('div');
        //     badge.className = 'badge';
        //     cell.appendChild(badge);
        // }

        // // Calculate the percentage value for the badge
        // const percentageValue = Math.round((countValues[index] / totalDraws) * 100);
        // badge.textContent = `${percentageValue}%`;

        // // Update badge style based on the percentage value
        // badge.style.backgroundColor = getBadgeColor(percentageValue, totalDraws);
    }
}

function getBadgeColor(percentageValue, totalDraws) {
    if (totalDraws == 100 && percentageValue > 18 || totalDraws == 50 && percentageValue > 35 || totalDraws == 20 && percentageValue > 40 || totalDraws == 10 && percentageValue > 45) {
        return 'black';
    } else if (totalDraws == 100 && percentageValue > 15 || totalDraws == 50 && percentageValue > 30 || totalDraws == 20 && percentageValue > 35 || totalDraws == 10 && percentageValue > 40) {
        return 'blue';
    } else if (totalDraws == 100 && percentageValue > 12 || totalDraws == 50 && percentageValue > 25 || totalDraws == 20 && percentageValue > 30 || totalDraws == 10 && percentageValue > 25) {
        return 'green';
    } else if (totalDraws == 100 && percentageValue > 10 || totalDraws == 50 && percentageValue > 15 || totalDraws == 20 && percentageValue > 25 || totalDraws == 10 && percentageValue > 15) {
        return 'orange';
    } else if (totalDraws == 100 && percentageValue > 5 || totalDraws == 50 && percentageValue > 5 || totalDraws == 20 && percentageValue > 20 || totalDraws == 10 && percentageValue > 5){
        return 'red'; // Use transparent color for values <= 20
    } else {
        return 'brown';
    }
}

function runMain(arr, currentIndex, arrayLength) {
    
    if (currentIndex < arrayLength) {
        var value = arr[currentIndex];

        var id_value = "cell-" + String(value)
        var bottom_text_id_value = "bottom-number-" + String(value - 1)
        var element = document.getElementById(id_value)
        var bottom_text_element = document.getElementById(bottom_text_id_value)
        
        if (element) { 
            if (value >= 1 && value <= 10) {
                element.style.backgroundColor = "#c5202b";
                element.style.border = "2px solid yellow";
                element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 1)";
                element.style.opacity = "1";
                //text_element.style.color = "white";
                bottom_text_element.style.color = "white";
            } else if (value >= 11 && value <= 20) {
                element.style.backgroundColor = "#006bb5"
                element.style.border = "2px solid yellow";
                element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 1)";
                element.style.opacity = "1";
                //text_element.style.color = "white";
                bottom_text_element.style.color = "white";
            } else if (value >= 21 && value <= 30) {
                element.style.backgroundColor = "#00843d"
                element.style.border = "2px solid yellow";
                element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 1)";
                element.style.opacity = "1";
                //text_element.style.color = "white";
                bottom_text_element.style.color = "white";
            } else if (value >= 31 && value <= 40) {
                element.style.backgroundColor = "#f9a800"
                element.style.border = "2px solid yellow";
                element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 1)";
                element.style.opacity = "1";
                //text_element.style.color = "white";
                bottom_text_element.style.color = "white";
            } else if (value >= 41 && value <= 50) {
                element.style.backgroundColor = "#b42996"
                element.style.border = "2px solid yellow";
                element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 1)";
                element.style.opacity = "1";
                //text_element.style.color = "white";
                bottom_text_element.style.color = "white";
            } else if (value >= 51 && value <= 60) {
                element.style.backgroundColor = "#f05000"
                element.style.border = "2px solid yellow";
                element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 1)";
                element.style.opacity = "1";
                //text_element.style.color = "white";
                bottom_text_element.style.color = "white";
            } else if (value >= 61 && value <= 70) {
                element.style.backgroundColor = "#8eaac0"
                element.style.border = "2px solid yellow";
                element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 1)";
                element.style.opacity = "1";
                //text_element.style.color = "white";
                bottom_text_element.style.color = "white";
            } else if (value >= 71 && value <= 80) {
                element.style.backgroundColor = "#523191"
                element.style.border = "2px solid yellow";
                element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 1)";
                element.style.opacity = "1";
                //text_element.style.color = "white";
                bottom_text_element.style.color = "white";
            }
            currentIndex++;
            setTimeout(function() { runMain(arr, currentIndex, arrayLength); }, 100); // Pass arguments explicitly
        } else {
            console.log("Element not found with ID:", value);
            currentIndex++;
            setTimeout(function() { runMain(arr, currentIndex, arrayLength); }, 0);
        }
    } 
}

function revertStyles() {
    for (var i = 1; i <= 80; i++) {

        var id_value = "cell-" + String(i)
        var bottom_text_id_value = "bottom-number-" + String(i - 1)
        var element = document.getElementById(id_value)
        var bottom_text_element = document.getElementById(bottom_text_id_value)

        if (element) {
            element.style.backgroundColor = "#555";
            element.style.border = "2px solid grey";
            element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.1)";
            element.style.opacity = "0.7";
            //text_element.style.color = "black";
            //bottom_text_element.style.color = "black";
        }
    }
}

function hotNumber(hotNumbers){

    if (Array.isArray(hotNumbers)) {
        hotNumbers.forEach((number, index) => {
            const elementId = `hot-item${index + 1}`;
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = number;
            } else {
                console.warn('Element not found:', elementId);
            }
        });
    } else {
        console.error('hotNumbers is not an array:', hotNumbers);
    }
}

function coldNumber(coldNumbers){
    //let actualArray = JSON.parse(coldNumbers);
    if (Array.isArray(coldNumbers)) {
        coldNumbers.forEach((number, index) => {
            const element = document.getElementById(`cold-item${index + 1}`);
            if (element) {
                element.textContent = number;
            }
            });
    } else {
        console.error('coldNumbers is not an array:', coldNumbers);
    }
}

clear.addEventListener("click", function() {
    currentIndex = 0;
    revertStyles();
    let message1 = 'Cleared Board';
    caption.innerHTML = message1
    caption1.innerHTML = message1
});

draw.addEventListener("click", function() {
    currentIndex = 0;
    revertStyles();
    let message1 = 'Current Draw  ' + globalGameNumber;
    caption.innerHTML = message1
    runMain(globalCurrentDraw, currentIndex, globalCurrentDraw.length);
});

const twoButtons = ['chances', 'random'];
twoButtons.forEach(buttonId => {
    document.getElementById(buttonId).addEventListener('click', handleTwoButtonClick);
});

function handleTwoButtonClick(event){
    const buttonName = event.target.id;

    if (buttonName === 'chances') {
        currentIndex = 0;
        revertStyles();
        let message1 = 'Random/Chances Draw';
        caption.innerHTML = message1
        caption1.innerHTML = message1
        const randomNumbers = generateUniqueRandomNumbers(20, 80);
        runMain(randomNumbers, 0, randomNumbers.length);
    }

    if (buttonName === 'random') {
        currentIndex = 0;
        revertStyles();

        const random_number = Math.floor(Math.random() * (board_rows * board_columns)) + 1;
        const random_orientation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
        const valid_t_pattern_proper_4 = generate_proper_t_pattern_4(random_number, random_orientation);

        if (valid_t_pattern_proper_4) {
            console.log("Generated T-Pattern:", valid_t_pattern_proper_4);
            runMain(valid_t_pattern_proper_4, 0, 4);
        } else {
            console.log("Unable to generate a valid T-Pattern after 100 attempts.");
            revertStyles();
        }
        
    }
}

function generateUniqueRandomNumbers(count, max) {
    const numbers = new Set();
    while (numbers.size < count) {
        const randomNumber = Math.floor(Math.random() * max) + 1;
        numbers.add(randomNumber);
    }
    return [...numbers];
}

previous.addEventListener("click", function() {
    
    const requestBody = {
        jurisdiction: appState.jurisdiction,
    };

    fetch('/get-previous-game-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    })
    .then(response => response.json())
    .then(data => {

        let innerArray = data[0];
        let numbersArray = JSON.parse(innerArray[0]);
        let number = innerArray[1];

        revertStyles();
            
        if (data.error) {
            let message1 = data.message;
            caption.innerHTML = message1;
            caption1.innerHTML = message1;
        } else {
            let message1 = 'Previous Draw  ' + number;
            caption.innerHTML = message1;
            runMain(numbersArray, 0, 20);
        }
    })
    .catch(error => console.error('Error fetching previous game result:', error));
});


const buttons = ['taps', 'plucker', 'grabs', 'picks', 'filtered'];
buttons.forEach(buttonId => {
    document.getElementById(buttonId).addEventListener('click', handleButtonClick);
});

function handleButtonClick(event) {
    const buttonName = event.target.id; 
    
    const requestBody = {
        jurisdiction: appState.jurisdiction,
        name: buttonName,
    };

    fetch('/strats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    })
    .then(response => response.json())
    .then(data => {


        console.log(data);
        let newResultArray = data[0][0];
        let newResult = JSON.parse(newResultArray);
        let prevResultArray = data[1][0];
        let prevResult = JSON.parse(prevResultArray);

        let newNumber = data[0][3];
        let prevNumber = data[1][3];
        
        let selectResultsArray = data[1][2];
        let selectResults = JSON.parse(selectResultsArray);

        let resultGameArray = data[1][1];
        let resultGame = JSON.parse(resultGameArray);
        let combinations = data[1][2];

        let newGameArray = data[0][4];
        let newGame =JSON.parse(newGameArray);
        let prevGameArray = data[1][4];
        let prevGame =JSON.parse(prevGameArray);

        let nullValue = data[0][1];
        let notNullValue = data[1][3];

        console.log(nullValue);

        revertStyles();

        if (nullValue === null) {
            let message = 'Above is the selection for game ' + newNumber;
            caption.innerHTML = message;
            runMain(newResult, 0, newResult.length);
        } 

        if (notNullValue !== null) {
            let strikeRatePercent = ((resultGame.length / prevResult.length) * 100);
            let roundDownNumber = Math.floor(strikeRatePercent * 100) / 100;

            let message = `${resultGame.length} from ${newResult.length} for game ${prevNumber}. Picked ${resultGame}  => ${roundDownNumber}%`;
            caption1.innerHTML = message;
        }
    })
    .catch(error => console.error('Error fetching plucker:', error));
};

function crazy_numbers(current_game_number, indices, numbers_array) {
    let crazy_number_dict = {};

    for (let i = 0; i < numbers_array.length; i++) {
        let idx = indices[i][0];
        let conditionMet = (idx > 10) || (idx === 'm');

        if (conditionMet) {
            let indexValue = idx === 'm' ? document.getElementById('numOfGames').value : idx;
            crazy_number_dict[i + 1] = {
                'number': numbers_array[i],
                'game_number': current_game_number,
                'index': indexValue
            };
        }
    }
    createCrazyNumberDivs(crazy_number_dict);
}

function createItem(number, index, type) {
    const item = document.createElement('div');
    item.className = `${type}-item`;

    const topText = document.createElement('div');
    topText.className = 'top-text';
    topText.textContent = number;
    item.appendChild(topText);

    const bottomText = document.createElement('div');
    bottomText.className = 'bottom-text';
    bottomText.textContent =  + index + ' ago';
    item.appendChild(bottomText);

    return item;
}

function createCrazyNumberDivs(crazyNumberDict) {
    const pickColumn = document.getElementById('pickColumn') || createCategoryColumn('pick');
    const crazyColumn = document.getElementById('crazyColumn') || createCategoryColumn('crazy');
    const insaneColumn = document.getElementById('insaneColumn') || createCategoryColumn('insane');

    // Clear the container to ensure we're not duplicating elements
    pickColumn.innerHTML = '';
    crazyColumn.innerHTML = '';
    insaneColumn.innerHTML = '';

    // Append labels
    pickColumn.appendChild(createPickMessage('PICK'));
    crazyColumn.appendChild(createCrazyMessage('CRAZY'));
    insaneColumn.appendChild(createInsaneMessage('INSANE'));

    // Populate columns based on the crazy number dictionary data
    for (const [key, value] of Object.entries(crazyNumberDict)) {
        let type;
        if (value.index >= 10 && value.index < 15) {
            type = 'pick';
        } else if (value.index >= 15 && value.index < 20) {
            type = 'crazy';
        } else if (value.index >= 20) {
            type = 'insane';
        }

        if (type) {
            const item = createItem(value.number, value.index, type);
            if (type === 'pick') pickColumn.appendChild(item);
            else if (type === 'crazy') crazyColumn.appendChild(item);
            else if (type === 'insane') insaneColumn.appendChild(item);
        }
    }
}

function createCategoryColumn(type) {
    const column = document.createElement('div');
    column.id = `${type}Column`;
    column.className = 'category-column';
    return column;
}

// Helper function to create a default message item
function createCrazyMessage(message) {
    const defaultMessage = document.createElement('div');
    defaultMessage.className = 'crazy-item';
    defaultMessage.textContent = message;
    return defaultMessage;
}

// Helper function to create a default message item
function createPickMessage(message) {
    const defaultMessage = document.createElement('div');
    defaultMessage.className = 'pick-item';
    defaultMessage.textContent = message;
    return defaultMessage;
}

// Helper function to create a default message item
function createInsaneMessage(message) {
    const defaultMessage = document.createElement('div');
    defaultMessage.className = 'insane-item';
    defaultMessage.textContent = message;
    return defaultMessage;
}

function appendItemsToColumn() {
    // Obtain references to each column
    const pickColumn = document.getElementById('pickColumn');
    const crazyColumn = document.getElementById('crazyColumn');
    const insaneColumn = document.getElementById('insaneColumn');

    // Append items to the correct column
    pickColumn.appendChild(createPickMessage('PICK')); // Assuming this creates a header or label
  
    crazyColumn.appendChild(createCrazyMessage('CRAZY')); // Assuming this creates a header or label
 
    insaneColumn.appendChild(createInsaneMessage('INSANE')); // Assuming this creates a header or label
    
}

appendItemsToColumn();


function onJurisdiction() {
    jurisdiction = document.getElementById('jurisdiction').value;

    let route;
    switch (jurisdiction) {
        case 'ACT': route = '/act'; break;
        case 'NSW': route = '/nsw'; break;
        case 'QLD': route = '/qld'; break;
        case 'SA': route = '/act'; break;
        case 'TAS': route = '/act'; break;
        case 'NT': route = '/act'; break;
        case 'VIC': route = '/vic'; break; 
        default: 
            console.warn('Unhandled jurisdiction:', jurisdiction);
    }

    const mainContainer = document.getElementById('mainContainer');
    mainContainer.innerHTML = '';

    fetch(route)
        .then(response => response.json())
        .then(response => {

        if (!response.data) {
            console.error('Error: Missing data in response');
            return;
        }

        let gamesToShow = response.data.slice(-2).reverse().slice(1);

        gamesToShow.forEach(gameEntry => {
            const categories = ['filtered', 'taps', 'picks', 'grabs', 'plucker'];

            let gameContainer = document.createElement('div');
            gameContainer.className = 'game-data-container';

            categories.forEach(category => {
                let hitsArray = parseToArray(gameEntry[`${category}_numbers`]);
                let numbersArray = parseToArray(gameEntry[category]);
                    
                if (!jurisdictionAdded) {
                    let heading = document.createElement('div');
                    heading.className = 'jurisdiction-info';
                    heading.textContent = `Jurisdiction: ${jurisdiction}`;
                    mainContainer.appendChild(heading);
                    jurisdictionAdded = true;
                } 

                let data = {
                        gameNo: gameEntry.game_number,
                        name: `${category.charAt(0).toUpperCase() + category.slice(1)} Data`,
                        hits: hitsArray.join(", "),
                        hitsCount: hitsArray.length,
                        numbers: numbersArray.join(", "),
                        possibleCombinations: gameEntry[`${category}_comb`],
                    };

                gameContainer.innerHTML += createCardContent(data);
            });

            jurisdictionAdded = false;
            document.getElementById('mainContainer').appendChild(gameContainer);
        });
    });

    const cardElement = document.createElement('div');
    const element = document.getElementById('mainContainer');
    
    if (element) {
        element.appendChild(cardElement);
    } else {
        console.error('An element was not found.');
    }
}

function parseToArray(str) {
    if (!str) { // Checks for null, undefined, and empty string
    return []; // Returns an empty array if the input is null-like
    }
    try {
    return JSON.parse(str);
    } catch (e) {
    return str.split(',');
    }
}

function processGameEntry(gameEntry) {
    // Define an array of data types you want to process
    const dataTypes = ['filtered', 'taps', 'picks', 'grabs', 'plucker'];

    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-data-container';

    // Loop through each data type and create a card for it
    dataTypes.forEach(dataType => {
        let data = {
            gameNo: gameEntry.game_number,
            name: dataType.charAt(0).toUpperCase() + dataType.slice(1), // Capitalize the first letter
            hits: parseToArray(gameEntry[dataType + '_numbers']).join(", "),
            hitsCount: parseToArray(gameEntry[dataType + '_numbers']).length,
            numbers: parseToArray(gameEntry[dataType]).join(", "),
            possibleCombinations: gameEntry[dataType + '_comb'],
        };
        gameContainer.innerHTML += createCardContent(data);
    });

    document.getElementById('mainContainer').appendChild(gameContainer);
}

function createCardContent(data) {
    
    let numbersArray = data.numbers.split(", ");
    let strikeRatePercent = Math.floor((data.hitsCount / 20) * 100);

    let greenBlocks = Math.ceil(data.hitsCount / 4);
    let redBlocks = Math.ceil((25 - data.hitsCount) / 4);
    let indicators = '🟩'.repeat(greenBlocks) + '🟥'.repeat(redBlocks);
    let collapseId = "collapse" + data.name.replace(/\s+/g, '') + data.game_number;
    

    let imageTag = '';
    if (data.hitsCount >= 10) {
            imageTag = '<button class="btn btn-success btn-sm">Ten Spot</button>';
        } else {
            switch (data.hitsCount) {
                case 6:
                    imageTag = '<button class="btn btn-light btn-sm">Six Spot</button>';
                    break;
                case 7:
                    imageTag = '<button class="btn btn-warning btn-sm">Seven Spot</button>';
                    break;
                case 8:
                    imageTag = '<button class="btn btn-danger btn-sm">Eight Spot</button>';
                    break;
                case 9:
                    imageTag = '<button class="btn btn-info btn-sm">Nine Spot</button>';
                    break;
            }
        }


    // Assuming data.numbers is a comma-separated string of numbers, and data.hits is an array of numbers.
    const numbsArray = data.numbers.split(',').map(num => num.trim());
    const hitsArray = data.hits.split(',').map(hit => parseInt(hit.trim()));

    const styledNumbers = numbsArray.map(number => {
        const trimmedNumber = number.trim();
        const numberInt = parseInt(trimmedNumber);

        console.log('Checking Number:', numberInt); // Debugging each number

        if (hitsArray.includes(numberInt)) {
            console.log('Hit found:', trimmedNumber); 

            return `<b><span style="color: yellow;">${trimmedNumber}</span></b>`;
        } else {

            return trimmedNumber;
        }
    }).join(', '); 

    // Return the template literal with styled numbers
    return `
        <div class="specific-card" style="flex-grow: 1; flex-shrink: 1; flex-basis: 0; width: 100%; box-sizing: border-box;">
            <div class="card-body" >
                <h5 class="card-title"><h5>${data.name}</h5> Game No. ${data.gameNo}
                <p class="card-text">
                    Strike Rate: ${strikeRatePercent}% <br>
                    ${indicators}
                </p>
                <button id="myCustomButton" class="btn btn-custom-dark btn-sm collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                    More Info
                </button>
                ${imageTag}
                <div class="collapse" id="${collapseId}" style="width: 100%;">
                <div class="card-moreinfo card-body mt-2" style="font-size: 0.8rem; flex-grow: 1; flex-shrink: 1; flex-basis: 0; width: 100%; padding: 0.5rem;">
                        Hits: ${data.hits} <br>
                        Numbers: ${styledNumbers} <br>
                        Possible Combinations: ${data.possibleCombinations}
                    </div>
                </div>
            </div>
        </div>
    `;
   
}









const t_orientations_proper_4 = {
    0: [[0, -1], [1, -1], [1, 0], [1, 1]],  // Regular T
    90: [[-1, 0], [0, 0], [1, 0], [0, 1]],  // T rotated 90° (horizontal bar on the bottom)
    180: [[0, -1], [-1, -1], [-1, 0], [-1, 1]], // T rotated 180° (upside-down T)
    270: [[-1, 0], [0, 0], [1, 0], [0, -1]]   // T rotated 270° (horizontal bar on the top)
};

const board_rows = 8;
const board_columns = 10;

function is_valid_position(row, column) {
    return row >= 0 && row < board_rows && column >= 0 && column < board_columns;
}

function generate_proper_t_pattern_4(center_number, orientation) {
    // Find the center position of the T-pattern based on the chosen number
    const center_row = Math.floor((center_number - 1) / board_columns);
    const center_column = (center_number - 1) % board_columns;
    
    // Get the relative positions for the T based on the chosen orientation
    const t_relative_positions = t_orientations_proper_4[orientation];
    
    // Calculate the absolute positions for the T-pattern on the board
    const t_positions = [];
    for (const relative_position of t_relative_positions) {
        const row = center_row + relative_position[0];
        const column = center_column + relative_position[1];
        if (is_valid_position(row, column)) {
            // Convert back to number representation
            t_positions.push(row * board_columns + column + 1);
        }
    }
    
    return t_positions.length === t_relative_positions.length ? t_positions : null;
}












document.addEventListener('DOMContentLoaded', () => {
    // Restore the selected options from localStorage
    const savedJurisdiction = localStorage.getItem('selectedJurisdiction');
    if (savedJurisdiction) {
        document.getElementById('jurisdiction').value = savedJurisdiction;
    }

    const savedNumOfGames = localStorage.getItem('selectedNumOfGames');
    if (savedNumOfGames) {
        document.getElementById('numOfGames').value = savedNumOfGames;
    }

    fetchDataAndUpdateDOM();
});