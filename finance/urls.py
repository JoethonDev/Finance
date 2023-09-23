from django.urls import path
from .views import *


urlpatterns = [
    path('', index, name='index'),
    path('inventory', inventory, name='inventory'),
    path('addItemInventory', addItemInventory, name='addItemInventory'),
    path('searchItemInventory', searchItemInventory, name='searchItemInventory'),
    path('inventoryReport/<int:id>', inventoryReport, name='inventoryReport'),
    path('itemReport/<int:id>', itemReport, name='itemReport'),
    path('items', items, name='items'),
    path('categories', items, name='categories'),
    path('transactions', transactions, name='transactions'),
    path('invoice/<int:id>', invoice, name='invoice'),
    path('getInfo/item/<int:id>', getInfo, name='getInfo'),
    path('getInfo/category/<int:id>', getInfo, name='getInfo'),
    path('getInfo/item/<str:name>', getInfo, name='getInfo'),
    path('getInfo/category/<str:name>', getInfo, name='getInfo'),
    path('<str:table>/<str:text>/', getRecommendations, name='getRecommendations'),
    path('checkavailable', checkAvailability, name='checkAvailability'),
    path('loginView', loginView, name='loginView'),
    path('logoutView', logoutView, name='logoutView'),
    path('reportPage', reportPage, name='reportPage'),
    path('settings', settings, name='settings'),
    path('profile', profile, name='profile'),

]