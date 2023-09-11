document.addEventListener('DOMContentLoaded', function () {
    // Constants
    const NAMESEARCH = document.querySelector('#nameSearch')
    const CODESEARCH = document.querySelector('#codeSearch')
    const BTNSEARCH = document.querySelector('#btnSearch')
    const ROWSPerPage = document.querySelector('#rowsPerPage')
    const TABLE = document.querySelector('.table-striped tbody')
    const ARROWS = document.querySelectorAll('.arrows')
    const NUMBERS = document.querySelectorAll('.numbers')
    const PAGESWITCH = document.querySelectorAll('input[name="pageSwitch"]')
    const FORMS = document.querySelectorAll('form')
    const INVENTORYNAME = document.querySelectorAll('.inventoryField')
    const ITEM = document.querySelectorAll('.itemField')

    // Variables

    // initial setup
    console.log(pageKind)
    if (pageKind){
        pageSwitch(pageKind)

    }
    removeAlerts()
    inputSwitch()
    INVENTORYNAME.forEach(e => {
        getInfoByText(e)
        e.addEventListener('keyup', () => {
            displayRecommendations(e)
        })
    })
    ITEM.forEach(e => {
        getInfoByText(e)
        e.addEventListener('keyup', () => {
            displayRecommendations(e)
        })
    })

    PAGESWITCH.forEach(element => {
        if (element.id == pageKind){
            element.checked = true
        }
        element.addEventListener('click' , e => {
            let page = e.target.id
            pageSwitch(page)
        })
    })

    // Search Function
    BTNSEARCH.addEventListener('click', (e) => {
        e.preventDefault()
        const URL = window.location.href.split('?')[0]
        // Params
        let data = {
            'rows' : rowsPerPage,
            'inventory' : NAMESEARCH.value ,
            'id' : CODESEARCH.value
        }
        const queryParams = new URLSearchParams(data)
        // Send Request
        const FULLURL = `${URL}?${queryParams}` 
        window.location.href = FULLURL
        return false
    })

    ROWSPerPage.addEventListener('change', (e) => {
        rowsPerPage = ROWSPerPage.value
        const URL = window.location.href.split('?')[0]
        // Params
        let data = {
            'rows' : rowsPerPage,
            'inventory' : NAMESEARCH.value ,
            'id' : CODESEARCH.value
        }
        const queryParams = new URLSearchParams(data)
        // Send Request
        const FULLURL = `${URL}?${queryParams}` 
        window.location.href = FULLURL

    })

    ARROWS.forEach(e => {
        e.addEventListener('click', (event) => {
            event.preventDefault()
            let className = e.classList.contains('previous')
            if (className){
                if (hasPrevious){
                    currentPage -= 1
                }
                else{
                    return
                }
            }
            else {
                if (hasNext){
                    currentPage += 1
                }
                else{
                    return
                }
            }
            console.log(currentPage)
            const URL = window.location.href.split('?')[0]

            // Params
            let data = {
                'rows' : rowsPerPage,
                'page' : currentPage,
                'inventory' : NAMESEARCH.value ,
                'id' : CODESEARCH.value
            }
            const queryParams = new URLSearchParams(data)
            // Send Request
            const FULLURL = `${URL}?${queryParams}` 
            window.location.href = FULLURL
            return false
        })
    })

    NUMBERS.forEach(e => {
        e.addEventListener('click', (event) => {
            event.preventDefault()
            const URL = window.location.href.split('?')[0]
            currentPage = e.dataset.id
            // Params
            let data = {
                'rows' : rowsPerPage,
                'page' : currentPage,
                'inventory' : NAMESEARCH.value ,
                'id' : CODESEARCH.value
            }
            const queryParams = new URLSearchParams(data)
            // Send Request
            const FULLURL = `${URL}?${queryParams}` 
            window.location.href = FULLURL

            return false
        })
    })


    // Functions 
    function pageSwitch(page){
        FORMS.forEach(form => {
            if (form.classList.contains(page)){
                form.classList.remove('d-none')
            }
            else{
                form.classList.add('d-none')
            }
        })
    }
})