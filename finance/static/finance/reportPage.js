document.addEventListener('DOMContentLoaded', function() {
    // Contansts
    const INVENTORIES = document.querySelectorAll('.inventory')
    const PAGESWITCH = document.querySelectorAll('input[name="pageSwitch"]')
    const KIND = document.querySelector('input[name="kind"]')
    const FROMINVENTORY = document.querySelector('#fromInventory')
    const TOINVENTORY = document.querySelector('#toInventory')
    const FROMITEM = document.querySelector('#fromItem')
    const TOITEM = document.querySelector('#toItem')
    const DROPDOWN = document.querySelectorAll('.dropdown')


    inputSwitch()
    removeAlerts()
    // Need To switch Pages => Hide or reveal inventories => Change KIND value
    PAGESWITCH.forEach(element => {
        element.addEventListener('click', (e)=> {
            let id  =  e.target.id
            KIND.value = id
            console.log(KIND.value)
            if (id == 'details'){
                INVENTORIES.forEach(e => {
                    e.classList.add('d-none')
                })
            }
            else{
                INVENTORIES.forEach(e => {
                    e.classList.remove('d-none')
                })
            }
        })
    })
    // Make drop-down recommendations
    DROPDOWN.forEach(div => {
        let input = div.querySelector('input')
        getInfoByText(input)
        input.addEventListener('keyup', () => {
            displayRecommendations(input)
        })
    })


})