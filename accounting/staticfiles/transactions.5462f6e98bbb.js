document.addEventListener('DOMContentLoaded', function(){
    // Constants
    const BASE = window.location.origin
    const KIND = document.querySelector('#kind')
    const USER = document.querySelector('#user')
    const ITEM = document.querySelector('#item')
    const CODE = document.querySelector('#code')
    const UNIT = document.querySelector('#unit')
    const PRICE = document.querySelector('#price')
    const INVENTORY = document.querySelector('#inventory')
    const QUANTITY = document.querySelector('#quantity')
    const AVAILABLEQUANTITY = document.querySelector('.availableQuantity span')
    const CHECKTABLE = document.querySelector('.checkoutTable table tbody')
    const CLEARBUTTON = document.querySelector('#clearAll')
    const FORM = document.querySelector('form')
    const TOTALBEFORETAX = document.querySelector('#totalBeforeTax')
    const TAX = document.querySelector('#tax')
    const TOTALAFTERTAX = document.querySelector('#totalAfterTax')
    const ADDTRANSACTION = document.querySelector('#addTransaction')
    const TRANSACTIONSEARCH = document.querySelector('#transactionSearch')
    const USERNAMESEARCH = document.querySelector('#usernameSearch')
    const IDSEARCH = document.querySelector('#idSearch')
    const FROMPRICESEARCH = document.querySelector('#fromPriceSearch')
    const TOPRICESEARCH = document.querySelector('#toPriceSearch')
    const SEARCHBTN = document.querySelector('#searchBtn')
    const TABLETRANSACTIONS = document.querySelector('.table-striped tbody')
    const ROWSPERPAGE = document.querySelector('#rowsPerPage')
    const ARROWS = document.querySelectorAll('.arrows')
    let numbers = document.querySelectorAll('.numbers')
    const NUMBERSCONTAINER = document.querySelector('.pagination')

    // Variables
    let item = {}
    let currentPage = 1
    let hasPrevious = false
    let hasNext = false
    let pagesCount = 1

    // Initial Setup
    searchRows()

    ITEM.addEventListener('keyup', e => {
        displayRecommendations(e)
    })
    ITEM.addEventListener('change', e => {
        displayItemInfo(e)
    })

    CODE.addEventListener('blur', e => {
        displayItemInfo(e)
    })

    INVENTORY.addEventListener('change', e => {
        let id =  e.target.value
        item.then(result => {
            console.log(result)
            displayAvailableQuantity(result.inventories, id)
        })
    })

    USER.addEventListener('keyup', e => {
        displayRecommendations(e)
    })

    FORM.addEventListener('submit', (e) => {
        e.preventDefault()
        if (KIND.value && USER.value && INVENTORY.value && PRICE.value && QUANTITY.value){
            if (PRICE.value != 0 && QUANTITY.value != 0){
                // Values
                let code = CODE.value
                let product = ITEM.innerHTML
                let unit = UNIT.value
                let availableQuantity = parseInt(AVAILABLEQUANTITY.innerHTML)
                let quantity = QUANTITY.value
                let price = PRICE.value
                let total = price*quantity
                let inventory = INVENTORY.options[INVENTORY.selectedIndex].textContent
                let inventoryID = INVENTORY.value
                console.log(availableQuantity)
                console.log(quantity)
                console.log(parseInt(availableQuantity) < quantity)
                console.log(KIND.value == 'sell')
                console.log(availableQuantity < quantity && KIND.value == 'sell')

                if (availableQuantity < quantity && KIND.value == 'sell'){
                    console.log('Error')
                    return
                }
                let condition = true
                for (element of CHECKTABLE.children){
                    let itemCode = element.querySelector('.codeItem').innerHTML
                    let itemInventory = element.querySelector('.inventoryItem').innerHTML
                    let itemPrice = element.querySelector('.priceItem').innerHTML
                    if (code == itemCode && itemInventory == inventory){
                        condition = false
                        quantity = parseInt(element.querySelector('.quantityItem').innerHTML) + parseInt(quantity)
                        element.querySelector('.quantityItem').innerHTML = quantity
                        element.querySelector('.totalItem').innerHTML = (itemPrice * quantity).toFixed(2)
                    }   
                }
                if (condition){
                    document.querySelectorAll('.fa-xmark').forEach(e => {
                        e.removeEventListener('click', e => {
                            removeRow(e)
                        })
                    })
                    CHECKTABLE.innerHTML += `
                    <tr>
                        <td class='codeItem'>${code}</td>
                        <td class='nameItem'>${product}</td>
                        <td class='unitItem'>${unit}</td>
                        <td class='quantityItem'>${quantity}</td>
                        <td class='priceItem'>${price}</td>
                        <td class='inventoryItem' data-id='${inventoryID}'>${inventory}</td>
                        <td class='totalItem'>${total}</td>
                        <td class='cancelation'><i class='fa-solid fa-xmark red-color'></i></td>
                    </tr>
                    `
                    document.querySelectorAll('.fa-xmark').forEach(mark => {
                        mark.addEventListener('click', e => {
                            removeRow(e.target)
                        })
                    })
                }
                // Calculate Total
                calculateTotal()

                // Resetting values
                CODE.value = ''
                ITEM.value = ''
                UNIT.value = ''
                AVAILABLEQUANTITY.innerHTML = 0
                QUANTITY.value = ''
                PRICE.value = ''
                INVENTORY.value = ''

                // Disable main values
                KIND.disabled = true
                USER.disabled = true
            }
        }
        


    })

    CLEARBUTTON.addEventListener('click', () => {
        // Enable main values
        KIND.disabled = false
        USER.disabled = false
        CHECKTABLE.innerHTML = ''
        calculateTotal()
    })

    ADDTRANSACTION.addEventListener('click', async () => {
        let items = []
        let available = true
        for (element of CHECKTABLE.children){
            let code = element.querySelector('.codeItem').innerHTML
            let quantity = element.querySelector('.quantityItem').innerHTML
            let price = element.querySelector('.priceItem').innerHTML
            let inventory = element.querySelector('.inventoryItem').dataset.id
            let dataInfo = {
                'transactionType' : KIND.value,
                'code' : code,
                'inventory' : inventory,
                'quantity' : quantity,
                'price' : price
            }
            // Check if items available with these quantity and in this inventory ? push to Array : make false and return from table
            console.log(dataInfo)
            

            await fetch(`${BASE}/checkavailable`, {
                method : 'POST',
                body : JSON.stringify(dataInfo)
            })
            .then(response => response.json().then(data => ({'data': data, 'status':response.status})))
            .then(result => {
                if (result.status == 200){
                    let datahere = dataInfo
                    items.push(datahere)
                }
                else{
                    // Pop up Message Danger
                    console.log(result.data.message)
                    available = false
                }
            })
            if (!available){
                return
            }    
        }

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        fetch(`${BASE}/transactions`, {
            method : 'POST',
            headers : {
                'Content-Type' : 'application/json',
                'X-CSRFToken' : csrfToken
            },
            body : JSON.stringify({
                'transactionType' : KIND.value,
                'user' : USER.value,
                'items' : items,
                'totalPrice' : TOTALAFTERTAX.value,
                'tax' : TAX.value
            })
        })
        .then(window.location.href=`${BASE}/transactions`)

    })

    SEARCHBTN.addEventListener('click', () => {
        currentPage = 1 
        searchRows()
    })

    ARROWS.forEach((element) => {
        element.addEventListener('click', (e) => {
            e.preventDefault()
            // return false

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
        currentPage = 1
        searchRows()
    })

    // Functions
    function displayAvailableQuantity(inventories, id){
        AVAILABLEQUANTITY.innerHTML = 0
        if (inventories){
            inventories.forEach(value => {
                if (id == value.inventoryPK){
                    AVAILABLEQUANTITY.innerHTML = value.quantity;
                    // Search if Item is added before so Change it to lower
                    return;
                }
            })
        }
    }

    function displayRecommendations(element){
        let value = encodeURIComponent(element.target.value)
        let dropDown = element.target.parentNode.querySelector('.dropdown-menu')

        if (value){
            let table = element.target.id
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
                        dropDown.innerHTML += `<li class="dropdown-item" data-id='${value.id}'>${value.item}</li>`
                    })

                    for (child of dropDown.children){
                        child.addEventListener('click', e => {
                            element.target.value = e.target.innerHTML
                            displayItemInfo(e)
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

    function displayItemInfo(element){
        let value =  element.target.dataset?.id || element.target.value
        if (parseInt(value)){
            item = fetch(`${BASE}/getInfo/item/${value}`)
            .then(response => response.json().then(data => ({'data': data, 'status': response.status})))
            .then(result => {
                if (result.status == 404){
                    console.log(result.data.message)
                    return
                }
                result = result.data.item
                CODE.value = result.code
                UNIT.value = result.unit
                ITEM.value = result.item
                if (KIND.value == 'purchase'){
                    PRICE.value = result.purchasePrice
                }
                else{
                    PRICE.value = result.sellPrice
                }
                if (INVENTORY.value){
                    displayAvailableQuantity(result.inventories, INVENTORY.value)
                }
                else{
                    AVAILABLEQUANTITY.innerHTML = result.quantity;
                }
                
                return result
            })
        }   
    }

    function removeRow(element){
        element.parentNode.parentNode.remove()
        calculateTotal()
    }

    function calculateTotal(){
        let sum = 0
        CHECKTABLE.querySelectorAll('.totalItem').forEach(element => sum += +element.innerHTML)
        TOTALBEFORETAX.value = sum.toFixed(2)
        // Change with your Tax !!!!!
        TAX.value = (TOTALBEFORETAX.value * 0.14).toFixed(2)
        TOTALAFTERTAX.value = (parseFloat(TOTALBEFORETAX.value) + parseFloat(TAX.value)).toFixed(2)
    }

    function searchRows(){
        let transactionType = TRANSACTIONSEARCH.value
        let username = USERNAMESEARCH.value
        let id = IDSEARCH.value
        let fromPrice = FROMPRICESEARCH.value
        let toPrice = TOPRICESEARCH.value 
        let rows = ROWSPERPAGE.value

        // Prepare URL
        let data = {
            'page' : currentPage,
            'rows' : rows,
            'transactionType' : transactionType,
            'client' : username,
            'id' : id,
            'fromPrice' : fromPrice,
            'toPrice' : toPrice,
            'refresh' : false
        }
        let queryParams = new URLSearchParams(data)
        let url = `${window.location.href.split('?')[0]}?${queryParams}`

        // Send Request
        fetch(url)
        .then(response => response.json())
        .then(result => {
            // Change Rows
            TABLETRANSACTIONS.innerHTML = displayRows(result.transactions)

            // Hide more Rows pages && Update Max
            pagesCount = result.pagesCount
            hasPrevious = result.hasPrevious
            hasNext = result.hasNext
            paginationControl()
        })
    }

    function displayRows(list){
        let content = ''
        list.forEach(value => {
            let items = value.items.map(val => val.item.item)
            let inventories = value.items.map(val => val.inventory)
            let type
            if (value.transactionType == 'purchase'){
                type = 'المشتريات'
            }
            else if (value.transactionType == 'sell'){
                type = 'المبيعات'
            }
            content += `
            <tr>
                <th scope="row">${type}</th>
                <td class="id">${ value.id }</td>
                <td class="username">${ value.user }</td>
                <td class="items"> 
                    ${items.join(',')}
                </td>
                <td class="inventory">
                    ${inventories.join(',')}
                </td>
                <td class="price">${ value.totalPrice }</td>
                <td class="date"> ${ value.dateTime } </td>
                <td>
                    <button type="button" class="btn btn-light report" data-id="${ value.id }">
                        <a href="${value.urlInvoice}">تقرير</a>
                    </button>
                </td>
            </tr>
            
            
            `
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
            // console.log(classList)
            // console.log(hasPrevious)
            // console.log(hasNext)
            // console.log('=============')
            if ((classList && !hasPrevious) || (!classList && !hasNext)){
                e.classList.add('disabled')
            }
        })
    }

    function checkNumbers(){
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
            // console.log(numbers.length)
            // console.log(pagesCount)

            // Fix not hiding last Element [Done]
            for (let i = numbers.length-1; i > pagesCount - 1; i--){
                numbers[i].classList.add('d-none')
            }
        }
        // console.log(currentPage-1)
        // console.log(numbers[currentPage-1])
        numbers[currentPage-1].classList.add('active')
    }

    function moveNumbers(element){
        currentPage = parseInt(element.dataset.id)
        searchRows()
    }
})