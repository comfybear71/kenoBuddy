

function onJurisdiction() {
    jurisdiction = document.getElementById('jurisdiction').value;
    console.log('Current Jurisdiction:', jurisdiction);
    
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

function createCardContent(data, index) {
    let numbersArray = data.numbers.split(", ");
    let strikeRatePercent = Math.floor((data.hitsCount / data.numbers.length) * 100);

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


    return `
        <div class="specific-card" style="flex-grow: 1; flex-shrink: 1; flex-basis: 0; width: 100%; box-sizing: border-box;">
            <div class="card-body" >
                <h5 class="card-title">${data.name} No. ${data.gameNo}</h5>
                <p class="card-text">
                    Strike Rate: ${strikeRatePercent}% <br>
                    ${indicators}
                </p>
                <button id="myCustomButton" class="btn btn-custom-dark btn-sm collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                    More Info
                </button>
                ${imageTag}
                <div class="collapse" id="${collapseId}">
                    <div class="card card-body mt-1" style="font-size: 0.8rem; flex: 1 1 auto; padding: 0.5rem 0.5rem;">
                        Hits: ${data.hits} <br>
                        Numbers: ${data.numbers} <br>
                        Possible Combinations: ${data.possibleCombinations}
                    </div>
                </div>
            </div>
        </div>
    `;

    jurisdictionAdded = false; 
}
