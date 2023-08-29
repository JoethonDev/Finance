from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(Items)
admin.site.register(Inventories)
admin.site.register(Inventory_Items)
admin.site.register(ItemPrices)
admin.site.register(Transactions)
admin.site.register(Transactions_Items)