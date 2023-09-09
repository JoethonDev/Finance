from django.db import models

# Constrains
USER_PARTIES = [
    ('seller', 'Seller'),
    ('buyer', 'Buyer')
]

TRANSACTIONS = [
    ('sell', 'مبيعات'),
    ('buy', 'مشتريات')
]

# Create your models here.
class Settings(models.Model):
    companyEnglishName = models.CharField(max_length=256)
    companyArabicName = models.CharField(max_length=256)
    yearStart = models.DateTimeField()
    taxes = models.IntegerField()
    # Make Choices here [by average || by last] [TODO]
    assestsCalculations = models.CharField(max_length=256)
    pass

class Countries(models.Model):
    name = models.CharField(max_length=256)

    def __str__(self):
        return self.name
    
class Users(models.Model):
    name = models.CharField(max_length=256)
    phone = models.CharField(max_length=256)
    email = models.CharField(max_length=256)
    partyType = models.CharField(max_length=256, choices=USER_PARTIES)
    country = models.ForeignKey(Countries, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')

class ItemsCategories(models.Model):
    category = models.CharField(max_length=256, blank=False, unique=True)
    code = models.CharField(max_length=256, blank=False, unique=True)
    categoryParent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.category

    def serialize(self):
        return {
            'id' : self.pk,
            'code' : self.code,
            'category' : self.category,
            # 'categoryParent' : self.categoryParent.category if self.categoryParent else None,
            'categoryParent' : self.categoryParent.__str__(),
        }
    
class Items(models.Model):
    item = models.CharField(max_length=256, blank=False, unique=True)
    code = models.CharField(max_length=256, blank=False, unique=True)
    unit = models.CharField(max_length=256, blank=False)
    category = models.ForeignKey(ItemsCategories, on_delete=models.DO_NOTHING, related_name='items')
    sellPrice = models.FloatField(default=0, blank=False)
    purchasePrice = models.FloatField(default=0, blank=False)
    quantity = models.IntegerField(default=0, blank=False)

    def serialize(self):
        return {
            'id' : self.pk,
            'item' : self.item,
            'code' : self.code,
            'unit' : self.unit,
            'category' : self.category.category,
            'sellPrice' : self.sellPrice,
            'purchasePrice' : self.purchasePrice,
            'quantity' : self.quantity,
            'inventories' : [inventory.serializeInventories() for inventory in self.inventoriesList.all()]
        }

class Wastes(models.Model):
    item = models.ForeignKey(Items, on_delete=models.DO_NOTHING, related_name='wastes')
    quantity = models.IntegerField(default=0, blank=False)
    dateTime = models.DateTimeField(auto_now_add=True)
    
    def serialize(self):
        return {
            'item' : self.item.serialize(),
            'quantity' : self.quantity
        }

class Inventories(models.Model):
    inventory = models.CharField(max_length=256, blank=False, unique=True)
    place = models.CharField(max_length=256)
    balance = models.FloatField(default=0, blank=False)
    items = models.ManyToManyField(Items, through='Inventory_Items', related_name='inventoriesItems')
    wastes = models.ManyToManyField(Wastes, through='Inventory_Wastes', related_name='inventoriesWastes')

    def serialize(self):
        return {
            'id' : self.pk,
            'inventory' : self.inventory,
            'place' : self.place,
            'balance' : self.balance,
            'items' : [item.serializeItems() for item in self.itemsList.all()],
            'wastes' : [waste.serializeItems() for waste in self.wastesList.all()],
        }

class Inventory_Items(models.Model):
    item = models.ForeignKey(Items, on_delete=models.DO_NOTHING, related_name='inventoriesList')
    inventory = models.ForeignKey(Inventories, on_delete=models.DO_NOTHING, related_name='itemsList')
    quantity = models.IntegerField(default=0, blank=False)
    quantityFromLastYear = models.IntegerField(blank=False, default=0)
    
    def serializeItems(self):
        return {
            'item' : self.item.serialize(),
            'quantity' : self.quantity,
            'quantityFromLastYear' : self.quantityFromLastYear
        }
    
    def serializeInventories(self):
        return {
            'inventoryPK' : self.inventory.pk,
            'inventory' : self.inventory.inventory,
            'quantity' : self.quantity, 
            'quantityFromLastYear' : self.quantityFromLastYear

        }

class Inventory_Wastes(models.Model):
    waste = models.ForeignKey(Wastes, on_delete=models.DO_NOTHING, related_name='inventoriesList')
    invertory = models.ForeignKey(Inventories, on_delete=models.DO_NOTHING, related_name='wastesList')
    quantity = models.IntegerField(default=0, blank=False)

    def serializeItems(self):
        return {
            'waste' : self.waste.serialize(),
            'quantity' : self.quantity
        }

class ItemPrices(models.Model):
    item = models.ForeignKey(Items, on_delete=models.DO_NOTHING, related_name='prices')
    price = models.FloatField(blank=False)
    transactionType = models.CharField(max_length=256, blank=False, choices=TRANSACTIONS)
    dateTime = models.DateTimeField(auto_now_add=True)  

class Transactions(models.Model):
    transactionType = models.CharField(max_length=256, blank=False, choices=TRANSACTIONS)
    totalPrice = models.FloatField(blank=False)
    tax = models.FloatField(blank=False)
    items = models.ManyToManyField(Items, through='Transactions_Items', related_name='items')
    # user = models.ForeignKey(Users, on_delete=models.DO_NOTHING)
    user = models.CharField(max_length=256)
    dateTime = models.DateTimeField(auto_now_add=True) 

    def serialize(self):
        items = {}
        for item in self.itemsList.all():
            if item.item in items :
                data = item.serialize()
                items[item.item]['quantity'] += data['quantity']
                items[item.item]['inventory'] += f',{data["inventory"]}'
            else: 
                items[item.item] = item.serialize()
        itemsList = []
        for val in items.values():
            itemsList.append(val)

        return {
            'id' : self.pk,
            'transactionType' : self.transactionType,
            'user' : self.user,
            'tax' : self.tax,
            'totalPrice' : self.totalPrice,
            'items' : itemsList,
            'dateTime' : self.dateTime.strftime("%d/%m/%Y"),
        }

class Transactions_Items(models.Model):
    item = models.ForeignKey(Items, on_delete=models.DO_NOTHING)
    transaction = models.ForeignKey(Transactions, on_delete=models.DO_NOTHING, related_name='itemsList')
    # Remove Null and Blank!!!
    inventory = models.ForeignKey(Inventories, on_delete=models.DO_NOTHING, null=True, blank=True)
    quantity = models.IntegerField(blank=False)
    price = models.FloatField(blank=False) 

    def serialize(self):
        return {
            'item' : self.item.serialize(),
            'quantity' : self.quantity,
            'pricePerItem' : self.price,
            # Remove Null and Blank!!!
            # 'inventory' : self.inventory.inventory
            'inventory' : self.inventory.inventory if self.inventory else None
        }