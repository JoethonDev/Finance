# Generated by Django 4.2.4 on 2023-09-05 13:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0005_remove_transactions_inventory_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='items',
            name='quantityFromLastYear',
        ),
        migrations.AddField(
            model_name='inventory_items',
            name='quantityFromLastYear',
            field=models.IntegerField(default=0),
        ),
    ]