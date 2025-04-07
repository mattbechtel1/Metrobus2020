function buildHeader(stopId, searchCode, agency) {
    const headerDiv = document.createElement('div')
    headerDiv.id = 'header'
    
    let describeText = function(stopId) {
        if (!isNaN(parseInt(stopId))) {
            return 'stop #' + stopId + '.'
        } else {
            return stopId + ' station.'
        }
    }(stopId)
    
    headerDiv.innerText = "You've selected " + describeText
    
    const favoriteHeart = document.createElement('a')
    favoriteHeart.classList.add('clickable-emoji')
    favoriteHeart.innerText = '💗'
    favoriteHeart.dataset.stop = searchCode || stopId
    favoriteHeart.dataset.description = stopId
    favoriteHeart.dataset.stopType = searchCode ? 'train' : 'bus'
    favoriteHeart.addEventListener('click', addFavorite)
    
    let refresh 
    if (!isNaN(parseInt(stopId))) {
        if (agency === 'metro') {
            refresh = createRefresh(function() {                
                loaderNotification(`Refreshing the schedule for stop #${stopId}`)
                fetch(`${baseUrl}/metro/busstop/${stopId}`)
                .then(response => response.json())
                .then(data => {
                    checkForBuses(data.stop, stopId)
                    clearAndReturnNotification()
                })
                .catch(displayError)
            })
        }
    } else {
        refresh = createRefresh(function() {
            loaderNotification(`Refreshing the train schedule for ${stopId} station.`)
            fetch(`${baseUrl}/metro/station/${searchCode}`)
            .then(response => response.json())
            .then(data => {
                displayTrains(data.Trains, stopId, searchCode)
                clearAndReturnNotification()
            })
            .catch(displayError)
        })
    }
    refresh.classList.add("right-side-header")
    
    headerDiv.append(favoriteHeart, refresh)

    return headerDiv
}

function buildCloseBtn() {
    let closeBtn = document.createElement('button')
    closeBtn.classList.add('delete')
    closeMarker = document.createElement('i')
    closeMarker.classList.add('fas', 'fa-times')
    closeBtn.addEventListener('click', clearAndReturnNotification)
    closeBtn.appendChild(closeMarker)
    return closeBtn
}

const createSubmit = function(btnText) {
    const submitBtn = document.createElement('button');
    submitBtn.classList.add('button', 'is-primary')
    submitBtn.innerText = btnText;
    submitBtn.type = 'submit';

    return submitBtn
}

const createRefresh = function(refreshFn) {
    const refreshBtn = document.createElement('button')
    refreshBtn.classList.add('button', 'is-primary')
    refreshBtn.innerText = "Refresh"
    refreshBtn.addEventListener('click', refreshFn)
    return refreshBtn
}