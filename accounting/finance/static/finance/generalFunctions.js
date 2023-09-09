const BASE = window.location.origin


function inputSwitch(){
    document.querySelectorAll('input').forEach(element => {
        element.setAttribute('autocomplete', 'off')
        element.addEventListener('keypress', e => {
            if (e.key == 'Enter'){
                e.preventDefault()
                let next = 1
                let element = e.target
                let parent = element.parentNode.parentNode.querySelectorAll('input')
                // console.log(parent)
                let index = Array.from(parent).indexOf(element)
                // console.log(index+next)
                if ((index+next) < parent.length ){
                    while ( (index+next) < parent.length && parent[index+next].disabled){
                        next += 1
    
                    }
                    parent[index+next].focus()

                }
                

                
            }
        })
    })
}

function getInfoByText(element, func=null){
    element.addEventListener('blur', (e) => {
        
        let dropDown = element.parentNode.querySelector('.dropdown-menu')
        if (dropDown.classList.contains('show')){
            setTimeout(() => {
                dropDown.classList.remove('show')
            }, 300 )
        }
        else{
            if (func){
                func(element)
            }
        }

    })
}

function popUp(message, condition){
    let alert = document.createElement('div')
    alert.className = 'alert pop-up'
    alert.innerText = message
    if (condition){
        alert.classList.add('alert-success')
    }
    else{
        alert.classList.add('alert-danger')
    }
    document.querySelector('body').appendChild(alert)
    removeAlerts()
    
}

function removeAlerts(){
    document.querySelectorAll('alert').forEach(e => {
        setTimeout(() => {
            e.remove()
        },  5500)
    }) 
}

function displayRecommendations(element, func=null){
    let value = encodeURIComponent(element.value)
    let dropDown = element.parentNode.querySelector('.dropdown-menu')


    if (value){
        let table = element.dataset.table
        fetch(`${BASE}/${table}/${value}`)
        .then(response => response.json().then(data => ({'data':data, 'status':response.status})))
        .then(result => {
            // console.log(result)
            if (result.status == 404){
                // Display Error
                console.log(result.message)
                return
            }
            result = result.data

            dropDown.innerHTML = ''
            if (result.data.length){
                dropDown.classList.add('show')
                result.data.forEach(value => {
                    dropDown.innerHTML += `<li class="dropdown-item" data-id='${value.id}'>${value.value}</li>`
                })

                for (child of dropDown.children){
                    child.addEventListener('click', e => {
                        console.log(element)
                        element.value = e.target.innerHTML
                        if (func){
                            func(e.target)
                        }
                        dropDown.classList.remove('show')   
                    })
                }
            }
            else{
                dropDown.classList.remove('show')
            }
        })
    }
    else{
        dropDown.classList.remove('show')
    }

    
}


