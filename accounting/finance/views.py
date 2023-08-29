from django.shortcuts import render
from django.http import HttpResponseRedirect, JsonResponse, HttpResponse
from django.urls import reverse
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
from .models import *
from django.db.models import Q
from django.core.paginator import Paginator
from json import loads, dumps
from urllib.parse import unquote

# Test PDF Generate
from django.template.loader import get_template

from xhtml2pdf import pisa

# JSON Requests
def getInfo(request, id):
    kind =  request.build_absolute_uri().split('/')[-2]
    if kind == 'item':
        item = Items.objects.filter(Q(code=id) | Q(pk=id))
        if item :
            return JsonResponse({'item' : item[0].serialize()}, status=200)
        
    elif kind == 'category':
        category = ItemsCategories.objects.filter(pk=id)
        if category :
            return JsonResponse({'category' : category[0].serialize()}, status=200)
        
    return JsonResponse({'message' : 'Bad Request!'}, status=404)

def getRecommendations(request, table, text):
    text = unquote(text)
    if table == 'user':
        list = [{'item': user.item, 'id': user.pk} for user in Users.objects.filter(name__contains=text)[:5]]
        pass
    elif table == 'item':
        list = [{'item': item.item, 'id': item.pk} for item in Items.objects.filter(item__contains=text)[:5]]
    elif table == 'category':
        list = [{'category': category.category, 'id': category.pk} for category in ItemsCategories.objects.filter(category__contains=text)[:5]]
    else :
        return JsonResponse({'message' : 'Bad Request!'}, status=404)
    return JsonResponse({'data' : list}, status=200)

@csrf_exempt
def checkAvailability(request):
    data = loads(request.body)
    if data['transactionType'] == 'sell':
        quantity = int(data['quantity'])
        item = Items.objects.get(code=int(data['code']))
        inventory = Inventories.objects.get(pk=int(data['inventory']))
        # Check item quantity
        if quantity > item.quantity :
            return JsonResponse({'message' : f'الكميه المطلوبه لمنتج {item.item} غير متوفره'}, status=400)
        row = inventory.itemsList.filter(item=item)
        if not row or quantity > row[0].quantity :
            return JsonResponse({'message' : f'الكميه المطلوبه لمنتج {item.item} غير متوفره في مخزن {inventory.inventory}'}, status=400)
    return JsonResponse({}, status=200)

def paginateRows(request, model):
    # Get Parameters
    try :
        pageNumber = int(request.GET.get('page', 1))
        rowsNumber = int(request.GET.get('rows', 20))
    except :
        pageNumber = 1
        rowsNumber = 20

    inventoryPaginator = Paginator(model, rowsNumber)
    currentPage = inventoryPaginator.get_page(pageNumber)
    
    return (currentPage, rowsNumber)

# Create your views here
def index(request):
    return

def inventory(request):
    """
    GET :
        When access page it displays a form that has name, balance and country
        Find a search bar 
        Find a table displays name, balance, country, button to generate report of inventory

    POST :
        Add new inventory details
    
    PUT :
        Check if need information about inventory 
            send it back as JSON
        else
            Update inventory details
    """
    if request.method == 'GET':
        # Get Parameters
        # try :
        #     pageNumber = int(request.GET.get('page', 1))
        #     rowsNumber = int(request.GET.get('rows', 20))
        # except :
        #     pageNumber = 1
        #     rowsNumber = 20

        refreshCondition = request.GET.get('refresh', True)
        inventoryName = request.GET.get('inventory', '')
        inventoryID = request.GET.get('id', '')
        krwags = {}

        # Make filters
        if inventoryName :
            krwags['inventory__contains'] = inventoryName
        if inventoryID :
            krwags['pk'] = inventoryID

        # Retrieve Data
        inventories = Inventories.objects.filter(**krwags).order_by('id')
        currentPage, rowsNumber = paginateRows(request, inventories)
        # inventoryPaginator = Paginator(inventories, rowsNumber)
        # currentPage = inventoryPaginator.get_page(pageNumber)

        # Send Data
        if refreshCondition == True:
            return render(request, 'finance/inventory.html',{
                'inventories' : currentPage,
                'rows' : int(rowsNumber),
                'rowsOptions' : [1,3,5,10,20,50,100],
                'name' : inventoryName,
                'id' : inventoryID
            })
        else :
            hasPrevious = currentPage.has_previous()
            hasNext = currentPage.has_next()
            currentPage = [inventory.serialize() for inventory in currentPage]
            return JsonResponse({
                'inventories' : currentPage,
                'hasNext' : hasNext,
                'hasPrevious' : hasPrevious,
                }, status=200, safe=False)
    
    elif request.method == 'POST':
        name = request.POST['name'] 
        place = request.POST['place']
        balance = request.POST['balance'] or 0
        if name and place:
            Inventories.objects.create(inventory=name, place=place, balance=balance)
        return HttpResponseRedirect(reverse('inventory'))

    elif request.method == 'PUT':
        data =  loads(request.body)
        id =  data['id']
        inventory = Inventories.objects.filter(pk=id)
        if inventory :
            inventory = inventory[0]

            if data['getInfo'] :
                return JsonResponse({'inventory' : inventory.serialize()}, status=200)
            
            if data['update']:
                # Suggest of changing in items and wastes
                name = data['name']
                place = data['place']
                balance = data['balance']
                inventory.inventory = name
                inventory.place = place
                inventory.balance = balance
                inventory.save()
                return HttpResponseRedirect(reverse('inventory'))
                
        return JsonResponse({'message' : 'Not Found!'}, status=404)
        
    pass

def items(request):
    """
        GET : 
            Display form 
                0ne => [Category, Code, ParentCategory] => Types
                Two => [Item, Code, Category, purchasePrice, sellPrice, Quantity, unit, quantityFromLastYear]
            Table display all Types or Items

        POST : 
            Add new Item/Category

        PUT :
            Update Item/Category
    """
    current_url = request.build_absolute_uri().split('/')

    if request.method == 'GET':
        kind = request.GET.get('kind', current_url[-1])
        name = request.GET.get('name', '') 
        code = request.GET.get('code', '') 
        refresh = request.GET.get('refresh', True) 
        kwrags = {}
        itemsRows = []
        categoriesRows = []
        if name :
            if kind == 'items' or kind == 'item':
                kwrags['item__contains'] = name
            else :
                kwrags['category__contains'] = name

        if code :
            kwrags['code'] = code


        
        rows = 20
        if kind == 'items' or kind == 'item':
            items = Items.objects.filter(**kwrags).order_by('item')
            currentPageItems, rowsPerPageItems = paginateRows(request, items)
            itemsRows = [items.serialize() for items in currentPageItems]
            rows = rowsPerPageItems
        else : 
            categories = ItemsCategories.objects.filter(**kwrags).order_by('category')
            currentPageCategories, rowsPerPageCategories = paginateRows(request, categories)
            categoriesRows = [category.serialize() for category in currentPageCategories]
            rows = rowsPerPageCategories


        if kind == 'items' or kind == 'item' :
            currentPage = currentPageItems
        else :
            currentPage = currentPageCategories

        if refresh == True:
            return render(request, 'finance/items.html',{
                'categories' : categoriesRows,
                'items' : itemsRows,
                'rows' : int(rows),
                'rowsOptions' : [1,3,5,10,20,50,100],
                'currentPage' : currentPage,
                'kind' : kind
            })
        else :
            if kind == 'items' or kind == 'item' :
                hasPrevious = currentPageItems.has_previous()
                hasNext = currentPageItems.has_next()
            else :
                hasPrevious = currentPageCategories.has_previous()
                hasNext = currentPageCategories.has_next()

            return JsonResponse({
                'categories' : categoriesRows,
                'items' : itemsRows,
                'hasNext' : hasNext,
                'pagesCount' : currentPage.paginator.num_pages,
                'hasPrevious' : hasPrevious,
                }, status=200, safe=False)
    
    elif request.method == 'POST':
        if request.POST['kind'] == 'item':
            name = request.POST.get('name') 
            code = request.POST.get('code')
            category = request.POST.get('categoryItem')
            purchasePrice = request.POST.get('purchasePrice') or 0
            sellPrice = request.POST.get('sellPrice') or 0
            quantity = request.POST.get('quantity') or 0
            unit = request.POST.get('unit')
            quantityFromLastYear = request.POST.get('quantityFromLastYear') or 0
            if name and code and category and unit:
                categoryObj = ItemsCategories.objects.get(pk=category)
                Items.objects.create(item=name, code=code, category=categoryObj, unit=unit, sellPrice=sellPrice, purchasePrice=purchasePrice, quantity=quantity, quantityFromLastYear=quantityFromLastYear)
        else :
            name = request.POST['name'] 
            code = request.POST['code']
            category = request.POST.get('category')
            categoryObj = None
            if name and code:
                if category:
                    categoryObj = ItemsCategories.objects.get(pk=category)
                ItemsCategories.objects.create(category=name, code=code, categoryParent=categoryObj)

        return HttpResponseRedirect(reverse(current_url[-1]))  
    pass

def transactions(request):
    """
    GET :
        display Form
            user | items | unit | price | Transactions
        search ['date', 'ID', 'item', 'client']
        Table
    
    POST:
        Add transaction
        if buy :
            update Items => quantity | PurchasePrice | SellPrice
            update Inventory_Items => quantity 
            add ItemPrices record
            add Transaction
            add Transaction_Items
        if sell :
            update Items => quantity 
            update Inventory_Items => quantity 
            add ItemPrices record
            add Transaction
            add Transaction_Items
    """
    if request.method == 'GET':
        # [kind , client, id, fromPrice, toPrice]
        # Get Params
        refreshCondition = request.GET.get('refresh', True)
        type = request.GET.get('transactionType', '')
        transactionID = request.GET.get('id', '')
        client = request.GET.get('client', '')
        fromPrice = request.GET.get('fromPrice', '')
        toPrice = request.GET.get('toPrice', '')
        krwags = {}
        # Make filters
        if type and type != 'all':
            krwags['transactionType'] = type
            
        if transactionID:
            krwags['pk'] = transactionID

        if client:
            krwags['user__contains'] = client

        if fromPrice:
            krwags['totalPrice__gte'] = fromPrice

        if toPrice:
            krwags['totalPrice__lte'] = toPrice
        
        # Process Data
        inventories = [inventory.serialize() for inventory in Inventories.objects.all()]
        users = [user.name for user in Users.objects.all()]
        items = [item.serialize() for item in Items.objects.all()]
        transactions = Transactions.objects.filter(**krwags).order_by('-dateTime')
        currentPage, rowsNumber = paginateRows(request, transactions)
        transactionsRows = [
            {
                **transaction.serialize(),
                'urlInvoice': reverse('invoice', args=[transaction.serialize()['id']])
            }
            for transaction in currentPage
        ]


        if refreshCondition == True:
            return render(request, 'finance/transactions.html', {
                'users' : users,
                'inventories' : inventories,
                'items' : items,
                'transactions' : transactionsRows,
                'currentPage' : currentPage,
                'rows' : int(rowsNumber),
                'rowsOptions' : [1,3,5,10,20,50,100],
            })
        else :
            hasPrevious = currentPage.has_previous()
            hasNext = currentPage.has_next()
            pagesCount = currentPage.paginator.num_pages
            return JsonResponse({
            'transactions' : transactionsRows,
            'hasNext' : hasNext,
            'hasPrevious' : hasPrevious,
            'pagesCount' : pagesCount
            }, status=200, safe=False)

    elif request.method == 'POST':
        data = loads(request.body)
        print(data)
        transactionType = data['transactionType']
        user = data['user']
        items = data['items']
        totalPrice = data['totalPrice']
        tax = data['tax']
        if not items:
            return JsonResponse({'message' : 'Access Forbidden!'}, status=403)
        # Change User to user model instead of saving as string [TODO]
        transaction = Transactions.objects.create(transactionType=transactionType, totalPrice=totalPrice, user=user, tax=tax)
        for product in items:
            price = float(product['price']) * 1.14
            # inventory of the item
            inventory = Inventories.objects.get(pk=int(product['inventory']))
            # update Items => quantity | PurchasePrice | SellPrice
            item = Items.objects.get(code=product['code'])
            quantity = int(product['quantity'])
            if transactionType == 'purchase':
                item.purchasePrice = price / 1.14
                item.sellPrice = round(price * 1.1, 2)
                item.quantity += quantity
                # update Inventory_Items => quantity 
                row = inventory.itemsList.filter(item=item)
                if row :
                    row[0].quantity += quantity
                else :
                    inventory_item = Inventory_Items.objects.create(item=item, quantity=quantity, inventory=inventory)
                    inventory.itemsList.add(inventory_item)

            elif transactionType == 'sell':
                item.sellPrice = round(price , 2)
                # update quantity of item
                item.quantity -= quantity
                # update Inventory_Items => quantity 
                row = inventory.itemsList.filter(item=item)
                if row :
                    row[0].quantity -= quantity
 
            # add ItemPrices record
            ItemPrices.objects.create(item=item, price=price, transactionType=transactionType)
            # add Transaction_Items
            transaction_item = Transactions_Items.objects.create(item=item, quantity=int(product['quantity']), inventory=inventory, transaction=transaction, price=price)
            transaction.itemsList.add(transaction_item)
            # Save Item and Inventory_Items
            item.save()
            if row : 
                row[0].save()

            # update inventory balance
            balance = 0
            for data in inventory.itemsList.all():
                data = data.serializeItems()
                quantityPerInventory = data['quantity']
                pricePerItem = data['item']['sellPrice']
                balance += (pricePerItem * quantityPerInventory)

            inventory.balance = balance
            # Save inventory data
            inventory.save()


        return JsonResponse({'message' : 'تم اضافه الفاتوره بنجاح'}, status=200)

def invoice(request, id):
    # Get Item
    transaction = Transactions.objects.get(pk=id).serialize()

    # Edit Values
    if transaction['transactionType'] == 'purchase':
        transaction['transactionType'] = 'المشتريات'
    else:
        transaction['transactionType'] = 'المبيعات'
    # Add derived values
    transaction['inventories'] = set()
    for item in transaction['items']:
        transaction['inventories'].add(item['inventory'])
        item['pricePerItem'] = round(item['pricePerItem'], 2)
        item['total'] = round(item['quantity'] * item['pricePerItem'], 2)


    transaction['totalBeforeTax'] = round(transaction['totalPrice'] - transaction['tax'], 2)

    # pdf = generate_pdf('finance/invoice.html', {'transaction' : transaction})
    # return render_to_pdf('finance/invoice.html', {'transaction' : transaction})
    return render(request, 'finance/invoice.html', {'transaction' : transaction})



from io import BytesIO
from django.http import HttpResponse
from django.template.loader import get_template
from xhtml2pdf import pisa

def render_to_pdf(template_src, context_dict={}):
    template = get_template(template_src)
    html  = template.render(context_dict)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result, encoding='utf-8')
    if not pdf.err:
        return HttpResponse(result.getvalue(), content_type='application/pdf')
    return None