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

const seattleUrl = SEATTLE_URL
const dcUrl = DC_URL
let baseUrl = dcUrl

const all_urls = [
  seattleUrl,
  dcUrl
]

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
}

function changeCity(city) {
  changeBaseUrl(city)
  changeCityName(city)
}