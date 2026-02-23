const colors = {'OR': 'orange', 'BL': 'blue', 'RD': 'red', 'SV': 'silver', 'GR': 'green', 'YL': 'yellow'}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('search-by-station').addEventListener('click', function() {
        
        loaderNotification("Finding stations...")

        fetch(`${baseUrl}/metro/stations`)
        .then(response => response.json())
        .then(data => {
            listStations(data)
            clearAndReturnNotification()
        })
        .catch(displayError)
    });
    document.getElementById('search-by-line').addEventListener('click', function() {
        
        loaderNotification('Finding metrolines...')

        fetch(`${baseUrl}/metro/lines`)
        .then(response => response.json())
        .then(data => {
            clearAndReturnNotification()
            displayLineSearch(data.Lines)
        })
        .catch(displayError)
    });
})

function listStations(stations) {
    const mainContainer = clearAndReturnMain()
    const form = buildDropDownForm(stations, function(station) {
        const option = document.createElement('option')
        option.value = [station.Code, station.Name]
        option.innerText = station.Name

        return option
    }, 'Go to Station')

    form.addEventListener('submit', function(e) {
        e.preventDefault()

        loaderNotification(`Finding the train schedule for ${e.target.opt.value.split(',')[1]}`)
        
        fetch(`${baseUrl}/metro/station/${e.target.opt.value.split(',')[0]}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                return displayError(data.message)
            }
            loaderNotification(...data.alerts)
            displayTrains(data.Trains, e.target.opt.value.split(',')[1], e.target.opt.value.split(',')[0])
            clearAndReturnNotification()
        })
        .catch(displayError)
    })

    mainContainer.appendChild(form)
}

function displayLineSearch(lines) {
    const mainContainer = clearAndReturnMain()

    const metroLineForm = buildDropDownForm(lines, function(line) {
        const option = document.createElement('option')
        option.value = line.LineCode;
        option.innerText = line.DisplayName;

        return option
    }, 'Go to Line')

    metroLineForm.addEventListener('submit', function(e) {lineSearch(e)})

    mainContainer.appendChild(metroLineForm);
}

function lineSearch(event) {
    event.preventDefault()

    loaderNotification(`Finding stations on the ${colors[event.target.opt.value]} line...`)

    fetch(`${baseUrl}/metro/stations?Linecode=${event.target.opt.value}`)
    .then(response => response.json())
    .then(data => {
        loaderNotification(...data.alerts)
        listStations(data.stations)
    })
    .catch(displayError)
}

function buildDropDownForm(optionsList, forEachCallback, saveText) {
    const form = document.createElement('form');
    form.id = 'metroline-filter-form'

    const outerDiv = document.createElement('div')
    outerDiv.classList.add('field', 'has-addons')
    form.appendChild(outerDiv)

    const innerDiv1 = document.createElement('div')
    innerDiv1.classList.add('control')

    const innerDiv2 = document.createElement('div')
    innerDiv2.classList.add('select')
    innerDiv1.appendChild(innerDiv2)

    const select = document.createElement('select')
    select.setAttribute('name', 'opt')
    const defaultOpt = document.createElement('option')

    defaultOpt.innerText = "Select an Option"
    select.appendChild(defaultOpt)

    optionsList.forEach(function(option) {
        select.appendChild(forEachCallback(option))
    })

    innerDiv2.appendChild(select)

    const btnDiv = document.createElement('div');
    btnDiv.classList.add('control')

    let btn = createSubmit(saveText)
    btnDiv.appendChild(btn)

    outerDiv.append(innerDiv1, btnDiv)

    return form
}

function displayTrains(trains, stationName, stationCode) {
    const mainContainer = clearAndReturnMain()
    
    if (trains.length < 1) {
        mainContainer.innerHTML = "No trains found."
    } else {
        
        const heading = buildHeader(stationName, stationCode)

        const table = document.createElement('table')
        table.classList.add('table', 'is-hoverable')
        const tableBody = document.createElement('tbody')
        table.appendChild(tableBody)
        
        trains.forEach(function(prediction) {
            let row = document.createElement('tr');
            
            let trainColor = document.createElement('td');
            const trainBox = document.createElement('div');
            trainBox.classList.add('busbox')
            trainBox.style.color = colors[prediction.Line]
            trainBox.innerText = prediction.Line;
            
            const trainDesc = document.createElement('div')
            // trainDesc.classList.add('bus-description')
            trainDesc.innerText = " toward " + prediction.DestinationName;
            trainColor.append(trainBox, trainDesc)
            
            let trainMinutes = document.createElement('td');
            if (!!parseInt(prediction.Min)) {
                trainMinutes.innerText = prediction.Min + ' minutes';
            } else {
                trainMinutes.innerText = prediction.Min
            }
            
            row.append(trainColor, trainMinutes)
            tableBody.appendChild(row)
        })
        mainContainer.append(heading, table)
    }

}