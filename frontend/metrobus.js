const alarmSound = new Audio('./assets/charge.wav');
const confirmSound = new Audio('./assets/263133__pan14__tone-beep.wav');
const lostSound = new Audio('./assets/259172__xtrgamr__uhoh.wav');

document.addEventListener('DOMContentLoaded', function() {
    fetch(`${baseUrl}/metro/alerts`) // puts metro alerts into cache

    document.getElementById('search-by-stop').addEventListener('click', () => popUpSearch(stopSearch, 'Enter 7-digit stop #'));
    document.getElementById('search-by-route').addEventListener('click', function() {
        popUpSearch(routeSearch, 'Enter bus route #');
        
        loaderNotification("Getting bus routes...")

        fetch(`${baseUrl}/metro/busroutes`)
        .then(response => response.json())
        .then(data => {
            getRoutes(data.Routes)
            clearAndReturnNotification()
        })
        .catch(displayError)
        });
    const favLink = document.getElementById('favorites')
    favLink.style.display = 'none'
    favLink.addEventListener('click', () => displayFavorites(userHeldInState.favorites))
})

function popUpSearch(searchFunction, placeholderText) {
    const mainContainer = clearAndReturnMain()

    const form = document.createElement('form');
    form.id = 'search-form'

    const outerDiv = document.createElement('div');
    outerDiv.classList.add('field', 'has-addons')
    form.appendChild(outerDiv)

    const innerDiv1 = document.createElement('div');
    innerDiv1.classList.add('control')

    const input = document.createElement('input');
    input.classList.add('input');
    input.setAttribute('name', 'queryData');
    input.setAttribute('maxlength', '7')
    input.setAttribute('placeholder', placeholderText)
    innerDiv1.appendChild(input)

    const innerDiv2 = document.createElement('div')
    innerDiv2.classList.add('control')

    const submitBtn = createSubmit('Search')
    innerDiv2.appendChild(submitBtn)

    outerDiv.append(innerDiv1, innerDiv2)
    form.addEventListener('submit', (e) => searchFunction(e))
    mainContainer.appendChild(form)
}

function stopSearch(event) {
    event.preventDefault()
    
    let form = document.getElementById('search-form')
    const busStop = form.queryData.value.toString();
    let stopId;

    if (busStop.length !== 7 ) {
        errorNotification('Invalid stop number')
        return
    } else {
        stopId = busStop;
    }
    
    loaderNotification("Getting bus schedule for your stop...")

    fetch(`${baseUrl}/metro/busstop/${stopId}`)
    .then(response => response.json())
    .then(data => {
        if (data.Message) {
            errorNotification(data.Message)
        } else {
            checkForBuses(data.stop, stopId)
            clearAndReturnNotification()
        }
    })
    .catch(displayError)
}

function routeSearch(event) {
    event.preventDefault();

    const form = event.currentTarget
    const query = form.queryData.value.toString().toUpperCase();
    
    if (query.length > 4 ) {
        errorNotification('Invalid route');
        return;
    }

    const fullUrl = `${baseUrl}/metro/busstops/?RouteID=${query}&IncludingVariations=true`
    
    loaderNotification('Finding bus stops associated with that route...')

    fetch(fullUrl)
    .then(response => response.json())
    .then(data => {
        if (data.bus.Message) {
            errorNotification(data.bus.Message)
            return;
        } else {
            clearAndReturnNotification()
            displaySchedule(data.bus)
            loaderNotification(...data.alerts)
        }
    })
    .catch(displayError)
}

function getBuses(data, stopId) {
    const mainContainer = document.getElementById('main-container')
    if (data.Predictions.length < 1) {
        mainContainer.innerHTML = "No buses found."
    } else {
        mainContainer.innerHTML = ""

        const heading = buildHeader(stopId)
        
        const table = document.createElement('table')
        table.classList.add('table', 'is-hoverable')
        const tableBody = document.createElement('tbody')
        table.appendChild(tableBody)
        
        data.Predictions.forEach(function(prediction) {
            let row = document.createElement('tr');
            
            let busNum = document.createElement('td');
            const busBox = document.createElement('div');
            busBox.classList.add('busbox')
            busBox.innerText = prediction.RouteID;
            
            const busDesc = document.createElement('div')
            busDesc.classList.add('bus-description')
            busDesc.innerText = " " + prediction.DirectionText;
            busNum.append(busBox, busDesc)
            
            let busMinutes = document.createElement('td');
            busMinutes.innerText = prediction.Minutes + ' minutes';
            let alarmSet = document.createElement('a');
            alarmSet.addEventListener('click', askAlarm);
            alarmSet.dataset.stop = stopId;
            alarmSet.dataset.minutes = prediction.Minutes;
            alarmSet.dataset.tripId = prediction.TripID;
            alarmSet.classList.add('clickable-emoji')
            alarmSet.innerText = '⏰';
            
            row.append(busNum, busMinutes, alarmSet)
            tableBody.appendChild(row)
        })
        mainContainer.append(heading, table)
    }
}

function getRoutes(routeList) {
    const secondForm = document.createElement('form')
    secondForm.id = 'route-list-form'
    
    const routesListOuterDiv = document.createElement('div')
    routesListOuterDiv.classList.add('field', 'has-addons')
    secondForm.appendChild(routesListOuterDiv)

    const routesListInnerDiv1 = document.createElement('div')
    routesListInnerDiv1.classList.add('control')

    const routesListInnerDiv2 = document.createElement('div')
    routesListInnerDiv2.classList.add('select')
    routesListInnerDiv1.appendChild(routesListInnerDiv2)

    const select = document.createElement('select')
    select.setAttribute('name', 'queryData')
    const defaultOpt = document.createElement('option')

    defaultOpt.innerText = "Or select a route"
    select.appendChild(defaultOpt)

    routeList = filterRoutes(routeList)

    routeList.forEach(function(route) {
        const option = document.createElement('option')
        const routeNumber = route.RouteID;
        option.value = routeNumber;
        option.innerText = routeNumber + " " + route.LineDescription

        select.appendChild(option)
    })

    routesListInnerDiv2.appendChild(select)

    const btnDiv = document.createElement('div');
    btnDiv.classList.add('control')

    const secondBtn = createSubmit('Go To Route')
    btnDiv.appendChild(secondBtn)

    routesListOuterDiv.append(routesListInnerDiv1, btnDiv)

    secondForm.addEventListener('submit', function(e) {routeSearch(e)})

    const mainContainer = document.getElementById('main-container')
    mainContainer.appendChild(secondForm);
}

function displaySchedule(schedule) {
    const mainContainer = clearAndReturnMain()

    let div = document.createElement('div')
    div.innerText = "You have selected " + schedule.Name +"."

    const dropdownForm = document.createElement('form')
    dropdownForm.id = 'select-direction-form'

    const outerDirectionDiv = document.createElement('div')
    outerDirectionDiv.classList.add('field', 'has-addons')
    dropdownForm.appendChild(outerDirectionDiv)

    const innerDirectionDiv1 = document.createElement('div')
    outerDirectionDiv.classList.add('control')

    const innerDirectionDiv2 = document.createElement('div')
    innerDirectionDiv2.classList.add('select')
    innerDirectionDiv1.appendChild(innerDirectionDiv2)

    const buildOption = (direction, selection) => {
        let option = document.createElement('option')
        if (direction.length > 0) {
            option.innerText = direction[0].TripDirectionText + " TOWARD " + direction[0].TripHeadsign
            option.value = selection
        } else {
            option = null
        }
        return option
    }

    const opt0 = buildOption(schedule.Direction0, 0)
    const opt1 = buildOption(schedule.Direction1, 1)

    if (!opt0 && !opt1) {
        const noBusesMessage = document.createElement('div')
        noBusesMessage.innerText = `No ${schedule.Name} buses are currently scheduled.`
        mainContainer.appendChild(noBusesMessage)
        return
    }

    const dropdownSelect = document.createElement('select')
    dropdownSelect.setAttribute('name', 'directionNum')
    dropdownSelect.classList.add('select', 'is-info')
    innerDirectionDiv2.appendChild(dropdownSelect)

    dropdownSelect.append(opt0, opt1)

    const directionBtnDiv = document.createElement('div')
    directionBtnDiv.classList.add('control')
    
    const directionSubmitBtn = createSubmit('Submit')
    directionBtnDiv.appendChild(directionSubmitBtn)

    innerDirectionDiv2.append(dropdownSelect);
    outerDirectionDiv.append(innerDirectionDiv1, directionBtnDiv)

    dropdownForm.addEventListener('submit', (e) => listRouteStops(e, schedule))
    mainContainer.append(div, dropdownForm)
}

function filterRoutes(routeList) {
    return routeList.filter(function(route) {
        return route.RouteID.split('v').length < 2
    })
}

function listRouteStops(event, schedule) {
    event.preventDefault();

    let directionNumKey = 'Direction' + event.target.directionNum.value;
    const ul = document.createElement('ul')
    const routeId = schedule[directionNumKey][0]["RouteID"]
    schedule[directionNumKey][0]["StopTimes"].forEach(stopTime => {
        const li = document.createElement('li')
        const link = document.createElement('a')
        link.innerText = "Stop Id: " + stopTime.StopID + " at " + stopTime.StopName
        li.appendChild(link)
        li.addEventListener('click', function() {
            loaderNotification(`Finding the schedule for stop #${stopTime.StopID}`)
            
            fetch(`${baseUrl}/metro/busstop/?stopId=${stopTime.StopID}&routeId=${routeId}`)
            .then(response => response.json())
            .then(data => {
                if (data.stop.Message) {
                    displayError(data.stop.Message)
                } else {
                    clearAndReturnNotification()
                    loaderNotification(...data.alerts)
                    checkForBuses(data.stop, stopTime.StopID)
                }
            }) 
            .catch(displayError)
            })
        ul.appendChild(li)
    })

    const mainContainer = clearAndReturnMain()
    mainContainer.append(ul)
}

function checkForBuses(data, stopId) {
    if (data.Message) {
        errorNotification(data.Message)
    } else {
        getBuses(data, stopId)
    }
}