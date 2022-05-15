const sessionURL = `${baseUrl}/login`
let userHeldInState

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('log').addEventListener('click', showLogIn)
})

const userInputs = () => {
    const innerDiv1 = document.createElement('div');
    innerDiv1.classList.add('control')

    const emailInput = document.createElement('input');
    emailInput.classList.add('input');
    emailInput.setAttribute('name', 'email');
    emailInput.setAttribute('placeholder', "Enter email address")
    innerDiv1.appendChild(emailInput)

    const innerDiv2 = document.createElement('div')
    innerDiv2.classList.add('control')

    const passwordInput = document.createElement('input')
    passwordInput.classList.add('input');
    passwordInput.type = 'password'
    passwordInput.setAttribute('name', 'password');
    passwordInput.setAttribute('placeholder', "Enter password")
    innerDiv2.appendChild(passwordInput)

    return [innerDiv1, innerDiv2]
}

function showLogIn() {
    const mainContainer = clearAndReturnMain()

    const form = document.createElement('form');
    form.id = 'login-form'

    const outerDiv = document.createElement('div');
    outerDiv.classList.add('field')
    form.appendChild(outerDiv)

    const buttonsDiv = document.createElement('div')
    buttonsDiv.classList.add('control', 'buttons')

    const submitBtn = createSubmit('Log In')
    const newUserBtn = document.createElement('Button')
    newUserBtn.classList.add('button', 'is-primary')
    newUserBtn.innerText = 'Sign Up'
    newUserBtn.type = 'button'
    newUserBtn.addEventListener('click', newUserForm)
    buttonsDiv.append(submitBtn, newUserBtn)

    outerDiv.append(...userInputs(), buttonsDiv)
    form.addEventListener('submit', startSession)
    mainContainer.appendChild(form)
}

function newUserForm() {
    const mainContainer = clearAndReturnMain()

    const form = document.createElement('form')
    form.id = 'sign-up-form'

    const outerDiv = document.createElement('div')
    outerDiv.classList.add('field')
    form.appendChild(outerDiv)

    const passwordConfirmDiv = document.createElement('div')
    passwordConfirmDiv.classList.add('control')
    passwordConfirmInput = document.createElement('input')
    passwordConfirmInput.classList.add('input')
    passwordConfirmInput.type = 'password'
    passwordConfirmInput.setAttribute('name', 'securepassword')
    passwordConfirmInput.setAttribute('placeholder', "Confirm password")
    passwordConfirmDiv.appendChild(passwordConfirmInput)

    const submitBtn = createSubmit('Sign Up')
    const buttonDiv = document.createElement('div')
    buttonDiv.classList.add('control')
    buttonDiv.appendChild(submitBtn)

    outerDiv.append(...userInputs(), passwordConfirmDiv, buttonDiv)

    form.addEventListener('submit', createNewUser)
    mainContainer.appendChild(form)
}

class UserFormObject {
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }

    get objectify() {
        return {
            email: this.email,
            password: this.password
        }
    }
}

function startSession(event) {
    event.preventDefault()

    let formObj = new UserFormObject(event.target.email.value, event.target.password.value)
    
    loaderNotification('Logging you in...')

    fetch(sessionURL, hostedObj('POST', formObj.objectify))
    .then(response => response.json())
    .then(user => {
        if (user.error) {
            displayError(user.message)
        } else {
            userHeldInState = user
            const favLink = document.getElementById('favorites')
            favLink.style.display = 'flex'
            greetUser(user)
        }
    })
}

function greetUser(user) {
    confirmNotification("Welcome " + user.email)
    clearAndReturnMain()
}

function createNewUser(e) {
    e.preventDefault()

    let formObj = new UserFormObject(e.target.email.value, e.target.password.value)
    let totalObj = {...formObj.objectify, password_confirmation: e.target.securepassword.value}

    loaderNotification("Validating your new account...")
    
    fetch(`${baseUrl}/users`, hostedObj('POST', {user: totalObj}))
    .then(response => response.json())
    .then(user => {
        if (!user.error) {
            userHeldInState = user
            const favLink = document.getElementById('favorites')
            favLink.style.display = 'flex'
            greetUser(user)
        } else {
            displayError(user)
            document.getElementById('sign-up-form').reset()
        }
    })
}
