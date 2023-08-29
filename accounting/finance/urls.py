from django.urls import path
from .views import *


urlpatterns = [
    path('inventory', inventory, name='inventory'),
    path('items', items, name='items'),
    path('categories', items, name='categories'),
    path('transactions', transactions, name='transactions'),
    path('invoice/<int:id>', invoice, name='invoice'),
    path('getInfo/item/<int:id>', getInfo, name='getInfo'),
    path('getInfo/category/<int:id>', getInfo, name='getInfo'),
    path('<str:table>/<str:text>/', getRecommendations, name='getRecommendations'),
    path('checkavailable', checkAvailability, name='checkAvailability'),
]