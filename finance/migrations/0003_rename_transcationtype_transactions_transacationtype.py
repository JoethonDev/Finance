# Generated by Django 4.1.5 on 2023-08-17 15:57

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0002_alter_transactions_user'),
    ]

    operations = [
        migrations.RenameField(
            model_name='transactions',
            old_name='transcationType',
            new_name='transacationType',
        ),
    ]
