let intervalId;
let isFetching = false; // Flag to prevent duplicate fetches
var currentIndex = 0;
let globalCurrentDraw = [];
let globalCurrentGameNumber = [];
let globalPreviousGameNumber= [];
let globalNumbers_array = [];
let previous_results = [[], []];
let globalPreviousDraw = [];
let globalMatchingNumbers1 = [];
let globalMatchingNumbers2 = [];
let globalMatchingNumbers3 = [];
let globalMatchingNumbers4 = [];
let globalRemainingNumbersList = [];
let oddNumbersList = [];
let evenNumbersList = [];
let headNumbersList = [];
let tailNumbersList = [];
let sample_test1 = [];
let sample_test2 = [];
let sample_test3 = [];
let sample_test4 = [];
let sample_test5 = [];
let sample_test6 = [];
let sample_test7 = [];
let sample_test8 = [];
let sample_test9 = [];
let previous_plucker = [[], []];
let previous_picks = [[], []];
let previous_selects = [[], []];
let previous_taps = [[], []];
let previous_digs = [[], []];
let previous_grabs = [[], []];
let previous_snags = [[], []];
let previous_wagers = [[], []];
let previous_stakes = [[], []];

const userAgent = navigator.userAgent || navigator.vendor || window.opera;

function fetchDataAndUpdateDOM() {
    if (isFetching) return;
    isFetching = true;

    // Add event listeners for change events on the dropdowns using the intermediary functions
    document.getElementById('jurisdiction').addEventListener('change', onJurisdictionChange);
    document.getElementById('numOfGames').addEventListener('change', onNumOfGamesChange);

    const jurisdiction = document.getElementById('jurisdiction').value;
    const numOfGames = document.getElementById('numOfGames').value;
    

    fetch('/fetch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jurisdiction, numOfGames }),
        })
        .then(response => response.json())
        .then(responseData  => {

            // Assuming the original data with 'selling' object is under 'originalData'
            const data = responseData.originalData;
            const processedData = responseData.processedData;
            const numbers_array = responseData.processedData.numbers_array;
            const current_draw = responseData.processedData.current_draw;
            const arrayLength = current_draw.length;
            const cold_numbers = responseData.processedData.cold_numbers;

            //GLOBALS
            globalCurrentDraw = responseData.processedData.current_draw;
            globalCurrentGameNumber = responseData.processedData.current_game_number;
            globalNumbers_array = numbers_array;
            
            const firstFiveElementsFromEach = responseData.processedData.indices.map(innerArray => {
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

            const count_values = responseData.processedData.count_values;
            
            if (!data || !data.selling || !data.selling.closing) {
                console.error('selling.closing is undefined');
                return; // Exit if the expected data is not present
            }

            // Check if running on an iPhone
            if (/iPhone/i.test(userAgent)) {
                // Code specific to iPhone
                const now = new Date();
                const closingTime = new Date(data.selling.closing);
                const differenceInSeconds = (closingTime - now) / 1000;
                console.log(`Difference in seconds on iPhone: ${Math.floor(differenceInSeconds)}`);
                if (differenceInSeconds > 0) {
                    updateDOMWithGameData(data, processedData, firstFiveElementsFromEach, count_values, current_draw); // Updates DOM with the game data
                    manageCountdown(differenceInSeconds, data); // Manages the countdown and game state
                } 

            } else {
                // Code for other devices (e.g., PC)
                const now = new Date();
                const closingTime = new Date(data.selling.closing);
                const cvtOffset = 1 * 60 * 60 * 1000; // For UTC-1
                const cvtTime = new Date(now.getTime() - cvtOffset);
                const differenceInSeconds = (closingTime - cvtTime) / 1000;
                console.log(`Difference in seconds on PC/Other: ${Math.floor(differenceInSeconds)}`);
                if (differenceInSeconds > 0) {
                    updateDOMWithGameData(data, processedData, firstFiveElementsFromEach, count_values, current_draw); // Updates DOM with the game data
                    manageCountdown(differenceInSeconds, data); // Manages the countdown and game state
                } 
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            isFetching = false; // Reset isFetching regardless of fetch result
        });
}

// Intermediary function for jurisdiction change
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

function manageCountdown(differenceInSeconds, data) {
    clearInterval(intervalId); // Clear any existing countdown
    let countdownSeconds = Math.floor(differenceInSeconds);

    intervalId = setInterval(() => {
        // First, check if the countdown has reached or passed zero
        if (countdownSeconds <= 0) {
            revertStyles(); // Assuming this resets some styles - ensure this function is defined elsewhere
            clearInterval(intervalId); // Stop the countdown
            document.getElementById('timer').textContent = '5 seconds.';
            document.getElementById('gameState').textContent = 'closed.';
    
            // Delay fetching new game data by 5 seconds after the game closes
            setTimeout(function() {
                fetchDataAndUpdateDOM(); // Ensure this function is defined elsewhere
            }, 5000);
        } else if (countdownSeconds <= 5) {
            // If there are 5 seconds or less remaining, but it's not yet zero
            document.getElementById('gameState').textContent = 'closing...';
        } else {
            // Update the countdown timer every second until it reaches the above conditions
            document.getElementById('timer').textContent = `Next: ${countdownSeconds}`;
            document.getElementById('gameState').textContent = 'Results';
        }
    
        countdownSeconds -= 1; // Decrement the countdown each second
    }, 1000);
    
}

function updateDOMWithGameData(data, processedData, firstFiveElementsFromEach, count_values, current_draw) {
    document.getElementById('gameNumber').textContent = `Number: ${data.current['game-number']}`;
    
    updateBoard(firstFiveElementsFromEach, count_values);
    runMain(current_draw, currentIndex, current_draw.length);
    updateGameResults(current_draw);
    crazy_numbers(globalCurrentGameNumber, processedData.indices, globalNumbers_array);
    hotNumber(processedData.hot_numbers);
    coldNumber(processedData.cold_numbers);
    sampleTest(processedData.indices)
    globalPreviousGameNumber = processedData.previous_game_number;

    if (globalPreviousDraw.length != 0) {
        remainingData(processedData.indices, globalPreviousDraw);
    } 

    let message1 = 'Latest Game No. ' + globalCurrentGameNumber;
    caption.innerHTML = message1
    caption1.innerHTML = message1
}

function formatDate(isoDate) {
    const date = new Date(isoDate);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function extractTimeToSeconds(isoTimestamp) {
    const closingTime = new Date(isoTimestamp);
    const now = new Date();
    return Math.floor((closingTime - now) / 1000);
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

        // Find or create the badge div
        let badge = cell.querySelector('.badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'badge';
            cell.appendChild(badge);
        }

        // Calculate the percentage value for the badge
        const percentageValue = Math.round((countValues[index] / totalDraws) * 100);
        badge.textContent = `${percentageValue}%`;

        // Update badge style based on the percentage value
        badge.style.backgroundColor = getBadgeColor(percentageValue, totalDraws);
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
            element.style.backgroundColor = "lightgrey";
            element.style.border = "2px solid grey";
            element.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.1)";
            element.style.opacity = "0.7";
            //text_element.style.color = "black";
            bottom_text_element.style.color = "black";
        }
    }
}

function updateGameResults(newResult) {
    previous_results[1] = previous_results[0];
    previous_results[0] = newResult;
    globalPreviousDraw = previous_results[1];
}
function updatePreviousPlucker(newResult) {
    previous_plucker[1] = previous_plucker[0];
    previous_plucker[0] = newResult;
    return previous_plucker;
}
function updatePreviousPicks(newResult) {
    previous_picks[1] = previous_picks[0];
    previous_picks[0] = newResult;
    return previous_picks;
}
function updatePreviousSelects(newResult) {
    previous_selects[1] = previous_selects[0];
    previous_selects[0] = newResult;
    return previous_selects;
}
function updatePreviousTaps(newResult) {
    previous_taps[1] = previous_taps[0];
    previous_taps[0] = newResult;
    return previous_taps;
}
function updatePreviousDigs(newResult) {
    previous_digs[1] = previous_digs[0];
    previous_digs[0] = newResult;
    return previous_digs;
}
function updatePreviousGrabs(newResult) {
    previous_grabs[1] = previous_grabs[0];
    previous_grabs[0] = newResult;
    return previous_grabs;
}
function updatePreviousSnags(newResult) {
    previous_snags[1] = previous_snags[0];
    previous_snags[0] = newResult;
    return previous_snags;
}
function updatePreviousWagers(newResult) {
    previous_wagers[1] = previous_wagers[0];
    previous_wagers[0] = newResult;
    return previous_wagers;
}
function updatePreviousStakes(newResult) {
    previous_stakes[1] = previous_stakes[0];
    previous_stakes[0] = newResult;
    return previous_stakes;
}


//////////CONTROL BUTTONS FOR PREV, DRAW, CHANCES, CLEAR, TAILS, HEADS, EVENS, ODDS/////////////////
function toggleSwitch(btnNumber) {
    const button = document.getElementById(`switch-btn${btnNumber}`);
    button.classList.toggle('active');
    
    // Get all active buttons
    const activeButtons = document.querySelectorAll('.switch-container button.active');
    if (activeButtons.length > 0) {
        // Reset currentIndex, stopRunFirstFunction(), and revertStyles()
        currentIndex = 0;
        revertStyles();
        
        // Iterate over all active buttons
        activeButtons.forEach(activeButton => {
            // Get the corresponding array and call runInfo
            switch (activeButton.id) {
                case 'switch-btn1':
                    //runInfo(tail_number_list, currentIndex, tail_number_list.length);
                    runMain(tailNumbersList, currentIndex, tailNumbersList.length);
                    break;
                case 'switch-btn2':
                    //runInfo(head_number_list, currentIndex, head_number_list.length);
                    runMain(headNumbersList, currentIndex, headNumbersList.length); 
                    break;
                case 'switch-btn3':
                   // runInfo(even_numbers_list, currentIndex, even_numbers_list.length);
                    runMain(evenNumbersList, currentIndex, evenNumbersList.length);
                    break;
                case 'switch-btn4':
                   // runInfo(odd_numbers_list, currentIndex, odd_numbers_list.length);
                    runMain(oddNumbersList, currentIndex, oddNumbersList.length);
                    break;
                default:
                    console.log('Unknown button:', activeButton.id);
            }
        });
    } else {
        // No button is active, so revert the styles
        revertStyles();
    }
}

function testSwitch(btnNumber, btnName) {
    const button = document.getElementById(`test-btn${btnNumber}`);

    // Get all buttons in the container
    const allButtons = document.querySelectorAll('.item-strats button');

     // Check if previous_results is empty
    if (globalPreviousDraw.length == 0) {
        // Update caption to indicate waiting for previous results
        caption.innerHTML = 'Waiting for previous results';
        caption1.innerHTML = 'Waiting for previous results';
        return; // Exit function early
    }

    // Deactivate all buttons
    allButtons.forEach(btn => {
        if (btn.id !== `test-btn${btnNumber}`) {
            btn.classList.remove('active');
        }
    });

    button.classList.toggle('active');

    const activeButtons = document.querySelectorAll('.item-strats button.active');
    if (activeButtons.length > 0) {

        currentIndex = 0;
        revertStyles();

        // Iterate over all active buttons
        activeButtons.forEach(activeButton => {
            // Get the corresponding array and call runInfo
            switch (activeButton.id) {
                case 'test-btn1':
                    //runInfo(sample_test1, currentIndex, sample_test1.length);
                    runMain(sample_test1, currentIndex, sample_test1.length);
                    countMatchingElements(previous_plucker[0], previous_results[1], previous_plucker[0].length, btnName)
                    break;
                case 'test-btn2':
                    //runInfo(sample_test2, currentIndex, sample_test2.length);
                    runMain(sample_test2, currentIndex, sample_test2.length);
                    countMatchingElements(previous_picks[0], previous_results[1], previous_picks[0].length, btnName)
                    break;
                case 'test-btn3':
                    //runInfo(sample_test3, currentIndex, sample_test3.length);
                    runMain(sample_test3, currentIndex, sample_test3.length);
                    countMatchingElements(previous_selects[0], previous_results[1], previous_selects[0].length, btnName)
                    break;
                case 'test-btn4':
                    //runInfo(sample_test4, currentIndex, sample_test4.length);
                    runMain(sample_test4, currentIndex, sample_test4.length);
                    countMatchingElements(previous_taps[0], previous_results[1], previous_taps[0].length, btnName)
                    break;
                case 'test-btn5':
                    //runInfo(sample_test5, currentIndex, sample_test5.length);
                    runMain(sample_test5, currentIndex, sample_test5.length);
                    countMatchingElements(previous_digs[0], previous_results[1], previous_digs[0].length, btnName)
                    break;
                case 'test-btn6':
                    //runInfo(sample_test6, currentIndex, sample_test6.length);
                    runMain(sample_test6, currentIndex, sample_test6.length);
                    countMatchingElements(previous_grabs[0], previous_results[1], previous_grabs[0].length, btnName)
                    break;
                case 'test-btn7':
                    //runInfo(sample_test7, currentIndex, sample_test7.length);
                    runMain(sample_test7, currentIndex, sample_test7.length);
                    countMatchingElements(previous_snags[0], previous_results[1], previous_snags[0].length, btnName)
                    break;
                case 'test-btn8':
                    //runInfo(sample_test8, currentIndex, sample_test8.length);
                    runMain(sample_test8, currentIndex, sample_test8.length);
                    countMatchingElements(previous_wagers[0], previous_results[1], previous_wagers[0].length, btnName)
                    break;
                case 'test-btn9':
                    //runInfo(sample_test9, currentIndex, sample_test9.length);
                    runMain(sample_test9, currentIndex, sample_test9.length);
                    countMatchingElements(previous_stakes[0], previous_results[1], previous_stakes[0].length, btnName)
                    break;
                default:
                    console.log('Unknown button:', activeButton.id);
            }
        });
    } else {
        // No button is active, so revert the styles
        revertStyles();
        caption.innerHTML = 'Waiting on at least one game!!'
        caption1.innerHTML = 'Waiting on at least one game!!'
    }
}

function countMatchingElements(arr1, arr2, length, btnName) {
    // Initialize a counter for matching elements
    let count = 0;
    let numbers = [];

    for (let i = 0; i < arr1.length; i++) {
        // Check if the current element exists in the second array
        if (arr2.includes(arr1[i])) {
            numbers.push(arr1[i]);
            count++;
        }
    }

    let message = '[' + globalPreviousGameNumber + '] ' +  btnName + '  ' + count + ' from ' + length ;
    if (numbers.length > 0) {
        message += '\n' + numbers.join(', ');
    }
    caption.innerText = message
    caption1.innerText = message

    return count;
}

function hotNumber(hotNumbers){
    let actualArray = JSON.parse(hotNumbers);
    if (Array.isArray(actualArray)) {
        actualArray.forEach((number, index) => {
            const element = document.getElementById(`hot-item${index + 1}`);
            if (element) {
                element.textContent = number;
            }
            });
    } else {
        console.error('hotNumbers is not an array:', actualArray);
    }
}

function coldNumber(coldNumbers){
    let actualArray = JSON.parse(coldNumbers);
    if (Array.isArray(actualArray)) {
        actualArray.forEach((number, index) => {
            const element = document.getElementById(`cold-item${index + 1}`);
            if (element) {
                element.textContent = number;
            }
            });
    } else {
        console.error('coldNumbers is not an array:', actualArray);
    }
}

var chances= document.getElementById("chances");
var clear = document.getElementById("clear");
var draw = document.getElementById("draw");
var previous = document.getElementById("previous");

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
    let message1 = 'Just got the current draw for game no. ' + globalCurrentGameNumber;
    caption.innerHTML = message1
    caption1.innerHTML = message1
    runMain(globalCurrentDraw, currentIndex, globalCurrentDraw.length);
});

chances.addEventListener("click", function() {
    currentIndex = 0;
    revertStyles();
   
    if(globalRemainingNumbersList != 0){
        let message1 = 'Take your Chance';
        caption.innerHTML = message1
        caption1.innerHTML = message1
        runMain(globalRemainingNumbersList, currentIndex, globalRemainingNumbersList.length);
    } else {
        let message1 = 'Waiting for next Game!!';
        caption.innerHTML = message1
        caption1.innerHTML = message1
    }
    
});

previous.addEventListener("click", function() {
    currentIndex = 0;
    revertStyles();
    if (globalPreviousDraw.length == 0) {
        let message1 = 'No Previous Draw yet, please wait for next draw.';
        caption.innerHTML = message1
        caption1.innerHTML = message1
    } else {
        let message1 = 'Previous Draw';
        caption.innerHTML = message1
        caption1.innerHTML = message1
        runMain(globalPreviousDraw, currentIndex, globalPreviousDraw.length);
    }
});

function remainingData(indices, previousResult) {

    let allNumbersSet = new Set(Array.from({ length: 80 }, (_, i) => i + 1));
    let numbersArray = Array.from(allNumbersSet);
    
    indices.forEach((index, i) => {
        // Matching number drawn out 2 games in a row
        if (index[0] === 1 && index[1] === 2) {
            globalMatchingNumbers1.push(numbersArray[i]);
        }
        // Matching number drawn out 3 games in a row
        if (index[0] === 1 && index[1] === 2 && index[2] === 3) {
            globalMatchingNumbers2.push(numbersArray[i]);
        }
        // Matching Numbers drawn more than 4 games ago but less than 8
        if (index[0] >= 3 && index[0] <= 9) {
            globalMatchingNumbers3.push(numbersArray[i]);
        }
        // Matching Numbers drawn more than 8 games ago
        if (index[0] >= 8) {
            globalMatchingNumbers4.push(numbersArray[i]);
        }
    });

    let matchingSet1 = new Set(globalMatchingNumbers1);
    let matchingSet2 = new Set(globalMatchingNumbers2);
    let matchingSet3 = new Set(globalMatchingNumbers3);
    let matchingSet4 = new Set(globalMatchingNumbers4);
    let matchingSet5 = new Set(globalCurrentDraw);

    // Calculate the remaining numbers set
    let remainingNumbersSet = new Set([...allNumbersSet].filter(x => !matchingSet1.has(x) && !matchingSet2.has(x) && !matchingSet3.has(x) && !matchingSet4.has(x) && !matchingSet5.has(x)));
    
    //clear globals
    globalMatchingNumbers1.length = 0;
    globalMatchingNumbers2.length = 0;
    globalMatchingNumbers3.length = 0;
    globalMatchingNumbers4.length = 0;
    globalRemainingNumbersList.length = 0;
    globalRemainingNumbersList.push(...remainingNumbersSet);

    oddNumbersList = globalRemainingNumbersList.filter(x => x % 2 !== 0);
    evenNumbersList = globalRemainingNumbersList.filter(x => x % 2 === 0);
    headNumbersList = globalRemainingNumbersList.filter(x => x <= 40);
    tailNumbersList = globalRemainingNumbersList.filter(x => x > 40);
}

function sampleTest(indices) {
    sample_test1 = [];
    sample_test2 = [];
    sample_test3 = [];
    sample_test4 = [];
    sample_test5 = [];
    sample_test6 = [];
    sample_test7 = [];
    sample_test8 = [];
    sample_test9 = [];
    // Object to store results
    let resultsDict = {};


    indices.forEach((sublist, i) => {
        // Check if the sublist is not an array or if it contains placeholder 'm'
        if (!Array.isArray(sublist) || sublist.includes('m')) {
            console.error(`Item at index ${i+1} is not a valid array or contains placeholder 'm'`);
            // Handle the case where sublist is not as expected
            // For example, you can assign default values or skip processing this sublist
            resultsDict[i + 1] = {
                indices: 0, // Assuming default values
                smallest: null,
                largest: null,
                sum: 0,
                secondElement: null,
                thirdElement: null,
                fourthElement: null
            };
            return; // Skip further processing for this item
        }
    
        // If sublist is a valid array, proceed with calculations
        let sublistSum = sublist.reduce((a, b) => a + b, 0);
        let smallest = Math.min(...sublist);
        let largest = Math.max(...sublist);
        let secondElement = sublist.length >= 2 ? sublist[1] : null;
        let thirdElement = sublist.length >= 3 ? sublist[2] : null;
        let fourthElement = sublist.length >= 4 ? sublist[3] : null;
    
        resultsDict[i + 1] = {
            indices: sublist.length,
            smallest: smallest,
            largest: largest,
            sum: sublistSum,
            secondElement: secondElement,
            thirdElement: thirdElement,
            fourthElement: fourthElement
        };
    });

    // Processing the conditions similar to the Python function
    Object.entries(resultsDict).forEach(([number, info]) => {
        if (info.sum > 200 && info.sum < 300 && info.secondElement < 10) sample_test1.push(Number(number));
        if (info.sum > 300 && info.sum < 400 && info.secondElement < 10) sample_test2.push(Number(number));
        if (info.sum > 400 && info.sum < 500 && info.secondElement < 10) sample_test3.push(Number(number));
        if (info.secondElement < 5) sample_test4.push(Number(number));
        if (info.thirdElement < 8) sample_test5.push(Number(number));
        if (info.fourthElement < 10) sample_test6.push(Number(number));
        if (info.indices >= 13) sample_test7.push(Number(number));
        if (info.indices >= 15) sample_test8.push(Number(number));
        if (info.indices > 10 && info.indices < 15) sample_test9.push(Number(number));
    });

    updatePreviousPlucker(sample_test1);
    updatePreviousPicks(sample_test2);
    updatePreviousSelects(sample_test3);
    updatePreviousTaps(sample_test4);
    updatePreviousDigs(sample_test5);
    updatePreviousGrabs(sample_test6);
    updatePreviousSnags(sample_test7);
    updatePreviousWagers(sample_test8);
    updatePreviousStakes(sample_test9);
}

function crazy_numbers(current_game_number, indices, numbers_array) {

    crazy_number_dict = {}

    for (let i = 0; i < numbers_array.length; i++) {

        let idx = indices[i][0];

        if (idx > 10 && idx <= 20) {
            crazy_number_dict[i + 1] = {
                'number': numbers_array[i],
                'game_number': current_game_number,
                'index': idx
            };
        } else if (idx > 20 && idx <= 25) {
            crazy_number_dict[i + 1] = {
                'number': numbers_array[i],
                'game_number': current_game_number,
                'index': idx
            };
        } else if (idx > 25 && idx <= 30) {
            crazy_number_dict[i + 1] = {
                'number': numbers_array[i],
                'game_number': current_game_number,
                'index': idx
            };
        } else if (idx > 30) {
            crazy_number_dict[i + 1] = {
                'number': numbers_array[i],
                'game_number': current_game_number,
                'index': idx
            };
        } else if (indices[i][0] === 'm') {
            crazy_number_dict[i + 1] = {
                'number': numbers_array[i],
                'game_number': current_game_number,
                'index': document.getElementById('numOfGames').value
            };
        }
    }
    createCrazyNumberDivs(crazy_number_dict);
}

// Base function to create items for each category (PICK, CRAZY, INSANE)
function createPickItem(number, index) {
    const item = document.createElement('div');
    item.className = 'pick-item';

    // Top text for the number
    const topText = document.createElement('div');
    topText.className = 'top-text';
    topText.textContent = number;
    item.appendChild(topText);

    // Bottom text for the index
    const bottomText = document.createElement('div');
    bottomText.className = 'bottom-text';
    bottomText.textContent = index + ' ago';
    item.appendChild(bottomText);

    return item;
}

function createCrazyItem(number, index) {
    const item = document.createElement('div');
    item.className = 'crazy-item';

    // Top text for the number
    const topText = document.createElement('div');
    topText.className = 'top-text';
    topText.textContent = number;
    item.appendChild(topText);

    // Bottom text for the index
    const bottomText = document.createElement('div');
    bottomText.className = 'bottom-text';
    bottomText.textContent = index + ' ago';
    item.appendChild(bottomText);

    return item;
}

function createInsaneItem(number, index) {
    const item = document.createElement('div');
    item.className = 'insane-item';

    // Top text for the number
    const topText = document.createElement('div');
    topText.className = 'top-text';
    topText.textContent = number;
    item.appendChild(topText);

    // Bottom text for the index
    const bottomText = document.createElement('div');
    bottomText.className = 'bottom-text';
    bottomText.textContent = index + ' ago';
    item.appendChild(bottomText);

    return item;
}

// Function to dynamically create the crazy numbers display
function createCrazyNumberDivs(crazyNumberDict) {
    const itemCraziesContainer = document.getElementById('dynamicContent');
    // Clear the container to ensure we're not duplicating elements
    itemCraziesContainer.innerHTML = '';

    // Create rows for PICK, CRAZY, and INSANE categories
    const pickRow = document.createElement('div');
    pickRow.className = 'pick-row';
    const crazyRow = document.createElement('div');
    crazyRow.className = 'crazy-row';
    const insaneRow = document.createElement('div');
    insaneRow.className = 'insane-row';

    // Flags to track if any item was added to a category
    let hasPick = false, hasCrazy = false, hasInsane = false;

    // Populate rows based on the crazy number dictionary data
    for (const [key, value] of Object.entries(crazyNumberDict)) {
        
        
        if (value.index >= 10 && value.index < 15) {
            const item = createPickItem(value.number, value.index);
            pickRow.appendChild(item);
            hasPick = true;
        } else if (value.index >= 15 && value.index < 20) {
            const item = createCrazyItem(value.number, value.index);
            crazyRow.appendChild(item);
            hasCrazy = true;
        } else if (value.index >= 20) {
            const item = createInsaneItem(value.number, value.index);
            insaneRow.appendChild(item);
            hasInsane = true;
        }
    }

    // Append default message if a row is empty
    if (!hasPick || hasPick) pickRow.prepend(createPickMessage('PICK'));
    if (!hasCrazy || hasCrazy) crazyRow.prepend(createCrazyMessage('CRAZY'));
    if (!hasInsane || hasInsane) insaneRow.prepend(createInsaneMessage('INSANE'));

    // Append rows to the container
    itemCraziesContainer.appendChild(pickRow);
    itemCraziesContainer.appendChild(crazyRow);
    itemCraziesContainer.appendChild(insaneRow);
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

    // After restoring selections, now you can fetch data and update DOM
    fetchDataAndUpdateDOM();
});