
const ua = window.navigator.userAgent
if (!!ua.match(/Trident/) || !!ua.match(/Edge/) || !!ua.match(/MSIE/)) {
  alert("MetroBus 2020 utilizes technology that is not currently compatible with Internet Explorer. Please consider switching to a modern browser.");
}

const hostedObj = function(requestType, formResponseObj) {
  return {
    method: requestType,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(formResponseObj)
  }
}

function clearAndReturnMain() {
  let mainContainer = document.getElementById('main-container')
  mainContainer.innerHTML = ""
  return mainContainer
}


// const dcUrl = 'http://localhost:3000'
// const seattleUrl = 'http://localhost:3001'
let baseUrl = dcUrl

const dcUrl = 'https://dc-metrobus-2020-api.herokuapp.com'
const seattleUrl = 'https://seattle-metrobus-2020-api-001c64bebff0.herokuapp.com/'

function changeBaseUrl(city) {
  function getBaseUrl(city) {
    switch(city) {
        case 'seattle':
            return seattleUrl
        case 'washington':
            return dcUrl
    }
  }
  baseUrl = getBaseUrl(city)
}

function changeCityName(city) {
  function getCityName(city) {
    switch(city) {
      case 'seattle':
        return "Seattle"
      case 'washington':
        return "DC"
    }
  }

  document.getElementById("app_header").innerText = getCityName(city) + " Metrobus App"
  debug_url = document.getElementById("url")
  if (debug_url) {
    debug_url.innerText = baseUrl
  }
}

function changeCity(city) {
  changeBaseUrl(city)
  changeCityName(city)
}