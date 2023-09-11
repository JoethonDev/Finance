document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const BASE = window.location.origin
    const URL = window.location.href.split('/')
    const SEARCHBAR = document.querySelector('#search')
    const IDSEARCH = document.querySelector('#searchCode')
    const CATEGORYPAGE = document.querySelectorAll('.category')
    const ITEMSPAGE = document.querySelectorAll('.items')
    const PAGESWITCH = document.querySelectorAll('input[name="pageSwitch"]')
    const ROWSPERPAGE = document.querySelector('#rowsPerPage')
    const ARROWS = document.querySelectorAll('.arrows')
    let numbers = document.querySelectorAll('.numbers')
    const NUMBERSCONTAINER = document.querySelector('.pagination')
    const SEARCHBTN = document.querySelector('#searchBtn')
    const CATEGORY = document.querySelectorAll('.category-search')

    PAGESWITCH.forEach(element => {
        element.addEventListener('click', (e)=> {
            id  =  e.target.id
            pageSwitch(id)
        })
    })

    // Variables
    let item = {}

    let kind = URL[URL.length - 1]
    let currentPage
    let currentPageItem = 1
    let currentPageCategory = 1

    let hasPreviousItem = false
    let hasPreviousCategory = false

    let hasNextItem = false
    let hasNextCategory = false

    let pagesCountItem = 1
    let pagesCountCategory = 1

    // Initial settings
    pageSwitch(URL[URL.length - 1])
    document.querySelector(`input[name="pageSwitch"][id="${URL[URL.length - 1].split('?')[0]}"]`).checked = true
    // document.querySelector('select[name="categoryItem"]').addEventListener('change', (e) => {
    //     let value = e.target.value
    //     fetch(`${BASE}/getInfo/category/${value}`)
    //     .then(response => response.json().then(data => ({'data':data, 'status':response.status})))
    //     .then(result => {
    //         if (result.status == 404){
    //             console.log(result.data.message)
    //             return
    //         }
           
    //     })
    // })

    CATEGORY.forEach(element => {
        element.addEventListener('keyup', e => {
            displayRecommendations(e)
        })
        element.addEventListener('change', e => {
            displayCategoryInfo(e)
        })
    })

    // Search function
    SEARCHBTN.addEventListener('click', (e)=>{
        if (kind == 'items'){
            currentPageItem = 1
        }
        else{
            currentPageCategory = 1
        }
        e.preventDefault()
        searchRows()
        return false
    })

    ARROWS.forEach((element) => {
        element.addEventListener('click', (e) => {
            e.preventDefault()
            // return false
            if (kind == 'items'){
                currentPage = currentPageItem
                hasPrevious = hasPreviousItem
                hasNext = hasNextItem
            }
            else{
                currentPage = currentPageCategory
                hasPrevious = hasPreviousCategory
                hasNext = hasNextCategory
            }
            let classList = element.classList.contains('previous')
            if ((classList && hasPrevious)){
                currentPage -= 1
            }
            else if ((!classList && hasNext)){
                currentPage += 1
            }
            searchRows()
        })
    })

    numbers.forEach((element) => {
        element.addEventListener('click', (e) => {
            e.preventDefault()
            moveNumbers(element)
            // return false

        })
    })

    ROWSPERPAGE.addEventListener('change' , () => {
        if (kind == 'items'){
            currentPageItem = 1
        }
        else{
            currentPageCategory = 1
        }
        searchRows()
    })

    // Functions
    function displayRecommendations(element){
        let value = encodeURIComponent(element.target.value)
        let dropDown = element.target.parentNode.querySelector('.dropdown-menu')

        if (value){
            let table = element.target.dataset.id
            fetch(`${BASE}/${table}/${value}`)
            .then(response => response.json().then(data => ({'data':data, 'status':response.status})))
            .then(result => {
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
                        dropDown.innerHTML += `<li class="dropdown-item" data-id='${value.id}'>${value.category}</li>`
                    })

                    for (child of dropDown.children){
                        child.addEventListener('click', e => {
                            element.target.value = e.target.innerHTML
                            displayCategoryInfo(e)
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

    function displayCategoryInfo(element){
        let value =  element.target.dataset?.id || element.target.value
        if (parseInt(value)){
            item = fetch(`${BASE}/getInfo/category/${value}`)
            .then(response => response.json().then(data => ({'data': data, 'status': response.status})))
            .then(result => {
                if (result.status == 404){
                    console.log(result.data.message)
                    return
                }
                result = result.data.category
                document.querySelectorAll('input[name="code"]').forEach(e => {
                    e.value =  result.code
                })
                
                return result
            })
        }   
    }


    function pageSwitch(page){
        kind = page
        if (page == 'categories'){
            CATEGORYPAGE.forEach(e => {
                e.classList.remove('d-none')
            })
            ITEMSPAGE.forEach(e => {
                e.classList.add('d-none')
            })
        }
        else{
            CATEGORYPAGE.forEach(e => {
                e.classList.add('d-none')
            })
            ITEMSPAGE.forEach(e => {
                e.classList.remove('d-none')
            })
        }
        searchRows()
    }

    function searchRows(){
        let name = SEARCHBAR.value
        let code = IDSEARCH.value
        let rows = ROWSPERPAGE.value
        if (kind == 'items'){
            currentPage = currentPageItem
        }
        else{
            currentPage = currentPageCategory
        }

        // Prepare URL
        let data = {
            'kind' : kind,
            'page' : currentPage,
            'rows' : rows,
            'name' : name,
            'code' : code,
            'refresh' : false
        }
        let queryParams = new URLSearchParams(data)
        let url = `${window.location.href.split('?')[0]}?${queryParams}`

        // Send Request
        fetch(url)
        .then(response => response.json())
        .then(result => {
            // Change Rows
            document.querySelector('.category tbody').innerHTML = displayRows(result.categories, 'category')
            document.querySelector('.items tbody').innerHTML = displayRows(result.items, 'items')
            // Hide more Rows pages && Update Max
            if (kind == 'items'){
                pagesCountItem = result.pagesCount
                hasPreviousItem = result.hasPrevious
                hasNextItem = result.hasNext
            }
            else{
                pagesCountCategory = result.pagesCount
                hasPreviousCategory = result.hasPrevious
                hasNextCategory = result.hasNext
            }
            
            paginationControl()
        })
    }

    function displayRows(list, tableKind){
        let content = ''
        list.forEach(value => {
            if (tableKind == 'items'){
                content += `
                <tr>
                      <th scope="row">${ value.code }</th>
                      <td class="name">${ value.item }</td>
                      <td>${ value.quantity }</td>
                      <td> ${ value.unit } </td>
                      <td>${ value.category }</td>
                      <td>${ value.purchasePrice }</td>
                      <td>${ value.sellPrice }</td>
                      <td> ${ value.quantityFromLastYear } </td>
                      <td>
                          <button type="button" class="btn btn-light" data-id="${ value.id }">تقرير</button>
                      </td>
                </tr>
                
                
                `
            }
            else {
                content += `
                <tr>
                    <th scope="row">${ value.code }</th>
                    <td class="name">${ value.category }</td>
                    <td>${ value.categoryParent }</td>
                    <td>
                        <button type="button" class="btn btn-light" data-id="${ value.id }">تقرير</button>
                    </td>
                </tr>
                `
            }
        })
        return content
    }

    function paginationControl(){
        // Show all buttons
        checkNumbers()
        // Check if there is next or previous
        checkArrows()
    }

    function checkArrows(){
        ARROWS.forEach(e => {
            e.classList.remove('disabled')

            let classList = e.classList.contains('previous')
            if (kind == 'items'){
                if ((classList && !hasPreviousItem) || (!classList && !hasNextItem)){
                    e.classList.add('disabled')
                }
            }
            else{
                if ((classList && !hasPreviousCategory) || (!classList && !hasNextCategory)){
                    e.classList.add('disabled')
                }
            }
            
        })
    }

    function checkNumbers(){
        let pagesCount = 0
        if(kind == 'items'){
            pagesCount = pagesCountItem
            currentPage = currentPageItem

        }
        else{
            pagesCount = pagesCountCategory
            currentPage = currentPageCategory

        }
        if (numbers.length < pagesCount){   
            for (let x = numbers.length+1 ; x <= pagesCount; x++ ){
                const li = document.createElement('li')
                li.className = 'page-item numbers'
                li.dataset.id = x
                li.innerHTML = `
                <a class="page-link">
                    <span aria-hidden="true">${x}</span>
                </a>
                
                `
                li.addEventListener('click', () => {
                    moveNumbers(li)
                })
                NUMBERSCONTAINER.insertBefore(li, document.querySelector('.next'))
            }

            numbers = document.querySelectorAll('.numbers')
        }
        else{
            numbers.forEach(ele => {
                ele.classList.remove('d-none')
                ele.classList.remove('active')
            })
            // Hide not used numbers 
            // console.log(kind)
            // console.log(numbers.length)
            // console.log(pagesCount)

            // Fix not hiding last Element [Done]
            for (let i = numbers.length-1; i > pagesCount - 1; i--){
                numbers[i].classList.add('d-none')
            }
        }

        numbers[currentPage-1].classList.add('active')
    }

    function moveNumbers(element){
        if (kind == 'items'){
            currentPageItem = parseInt(element.dataset.id)
        }
        else{
            currentPageCategory = parseInt(element.dataset.id)
        }
        searchRows()
    }
})