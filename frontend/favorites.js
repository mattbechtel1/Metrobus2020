const favoriteUrl = `${baseUrl}/favorites`

function addFavorite(e) {
    if (!userHeldInState) {
      errorNotification('Please log in to declare favorites')
  
    } else {
  
      let stopId = e.target.dataset.stop;
      let defaultDescription = e.target.dataset.description
      
      let postObj = {
        'lookup': stopId,
        'user_id': userHeldInState.id,
        'description': defaultDescription,
        'transit_type': e.target.dataset.stopType,
        'permanent_desc': defaultDescription
      }
  
      loaderNotification('Adding to your favorites list...')
      
      fetch(favoriteUrl, hostedObj('POST', postObj))
      .then(response => response.json())
      .then(newFav => {
        userHeldInState.favorites.push(newFav)
        confirmNotification(`${newFav.description} has been added to your favorites.`)
      })
      .catch(displayError)
    }
  }

  function displayFavorites(favList) {
    const mainContainer = clearAndReturnMain()
    const listContainer = document.createElement('table')
    listContainer.classList.add('table', 'is-hoverable')
    const containerBody = document.createElement('tbody')
    listContainer.appendChild(containerBody)

    const favElements = favList.map(fav => {
        let row = document.createElement('tr')

        let stopNum = document.createElement('td');
        let stopBox = document.createElement('a')
        stopBox.innerText = fav.permanent_desc
        stopBox.classList.add('stopbox')

        let stopDesc = document.createElement('div')
        stopDesc.classList.add('bus-description')
        stopDesc.innerText = " " + fav.description;
        stopDesc.id = `favorite-${fav.id}`
        stopNum.append(stopBox, stopDesc)

        switch(fav.transit_type) {
            case 'bus':
                stopNum.addEventListener('click', (e) => {
                    loaderNotification(`Getting the schedule for ${fav.description}`)
                    
                    fetch(`${baseUrl}/metro/busstop/${fav.lookup}`)
                    .then(response => response.json())
                    .then(data => {
                        clearAndReturnNotification()
                        checkForBuses(data.stop, fav.lookup)
                    })
                    .catch(displayError)
                })
                break
            case 'train':
                stopNum.addEventListener('click', (e) => {

                    loaderNotification(`Getting the schedule for ${fav.description}`)
                    
                    fetch(`${baseUrl}/metro/station/${fav.lookup}`)
                    .then(response => response.json())
                    .then(data => {
                        clearAndReturnNotification()
                        displayTrains(data.Trains, fav.description, fav.lookup)
                    })
                    .catch(displayError)
                })
                break
        }
            
        const editFigure = document.createElement('a')
        editFigure.innerText = '✏️'
        editFigure.classList.add('clickable-emoji')
        editFigure.dataset.fav = fav.id
        editFigure.addEventListener('click', (e) => editFav(e.target.dataset.fav))

        const deleteFigure = document.createElement('a')
        deleteFigure.innerText = '🗑️'
        deleteFigure.classList.add('clickable-emoji')
        deleteFigure.dataset.fav = fav.id
        deleteFigure.addEventListener('click', (e) => deleteFavConfirm(e.target.dataset.fav))

        row.append(stopNum, editFigure, deleteFigure)

        return row
    })

    favElements.forEach(elem => {
        containerBody.appendChild(elem)
    })

    mainContainer.appendChild(listContainer)
}

function editFav(favId) {
    const editableFavDescription = document.getElementById(`favorite-${favId}`)
    
    const editDescriptionForm = document.createElement('form')
    editDescriptionForm.classList.add('bus-description')
    editDescriptionForm.addEventListener('submit', saveEdit)
    editDescriptionForm.addEventListener('click', (e) => e.stopPropagation())
    editDescriptionForm.dataset.favId = favId
    
    const descriptionInput = document.createElement('input')
    descriptionInput.classList.add('input','resized-input');
    descriptionInput.setAttribute('name', 'description');
    descriptionInput.setAttribute('maxlength', '60')
    descriptionInput.setAttribute('placeholder', editableFavDescription.innerText)
    
    const descriptionSaveBtn = createSubmit('Save')

    const cancelEditBtn = document.createElement('button')
    cancelEditBtn.innerText = 'Cancel'
    cancelEditBtn.classList.add('button', 'is-warning')
    cancelEditBtn.addEventListener('click', removeEditForm)
    
    editDescriptionForm.append(descriptionInput, descriptionSaveBtn, cancelEditBtn)
    editableFavDescription.setAttribute('hidden', true)
    
    editableFavDescription.insertAdjacentElement('afterend', editDescriptionForm)

    function removeEditForm() {
        formContainer.remove()
        editableFavDescription.removeAttribute('hidden')
    }
}

function saveEdit(e) {
    e.preventDefault()

    loaderNotification("Saving...")

    fetch(`${favoriteUrl}/${e.target.dataset.favId}`, hostedObj('PATCH', {
        description: e.target.description.value
    }))
    .then(response => response.json())
    .then(updatedFav => {
        if (updatedFav.error) {
            errorNotification(updatedFav.message)
        } else {
            updateFavInState(updatedFav)
            confirmNotification(`${updatedFav.description} has been saved into your favorites.`)
        }
    })
    .catch(displayError)
}

function deleteFavConfirm(favId) {
    if (confirm("Are you sure you want to delete this favorite?")) {

        loaderNotification('Deleting...')

        fetch(`${favoriteUrl}/${favId}`, hostedObj('DELETE', null))
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayError(data)
            } else {
                confirmNotification("Successfully removed from favorites")
                deleteFavFromState(data.id)
            }
        })
    }
}

function deleteFavFromState(favId) {
    const updatedFavs = userHeldInState.favorites.filter(fav => fav.id !== favId)
    userHeldInState.favorites = updatedFavs
    displayFavorites(updatedFavs)
}

function updateFavInState(replacementFav) {
    const oldFavIdx = userHeldInState.favorites.findIndex(fav => fav.id === replacementFav.id)
    userHeldInState.favorites = [...userHeldInState.favorites.slice(0, oldFavIdx), replacementFav, ...userHeldInState.favorites.slice(oldFavIdx + 1)]
    displayFavorites(userHeldInState.favorites)
}