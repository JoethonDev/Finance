import sys
from django.core.management import execute_from_command_line

# Load modules
import docx
from docx.api import Document
from docx.oxml.shared import OxmlElement, qn
import doc2docx
import os
from finance.models import *



    

def run():
    # print('Hello')
    # Get doc files
    doc_files = []
    path = os.path.dirname(os.path.abspath(__file__))
    files =  os.listdir(path)
    # print(files)

    for file in files :
        if file.endswith('.doc'):
            doc_files.append(f'{path}\\{file}')
    
    # print(doc_files)
    # Convert all doc to docx
    docx_files = []
    for file in doc_files :
        doc2docx.convert(file)
        # print()
        docx_files.append(f'{file}x')

    # Filtered words
    filtered_words = ['السعر', 'مصر', '']
    item_counter = 1
    category_counter = 1
    category_code = ''
    item_code = ''
    master = None

    # Read each docx
    for file in docx_files :
        docx = Document(file)
        # Extract Tables from each file
        tables = docx.tables

        # Loop through tables
        for table in tables :
            # Extract Columns
            for col in table.columns :

                # Loop cells cells
                for cell in col.cells :
                    style = cell._tc.get_or_add_tcPr()
                    styleCheck = style.find(qn('w:shd'))
                    text = cell.text.strip()

                    try :
                        int(text)
                        break
                    except : 
                        pass
                    # Check if valid cell context 
                    # print(text)
                    if text not in filtered_words :
                        # If cell is Master
                        if styleCheck is not None :
                            #   Check if category is not found
                            #   assign current master to category created or found
                            category = ItemsCategories.objects.filter(category=text)
                            category_counter += 1

                            if category :
                                master = category[0]
                            else :
                                #   Create category in sql 
                                category_code = str(category_counter)
                                master = ItemsCategories.objects.create(category=text, code=category_code)
                            
                        # else
                        else :
                            item = Items.objects.filter(item=text)
                            item_counter += 1

                            #  Check if item is not found
                            if not item :
                                item_code = category_code + str(item_counter)
                                # print(item_code)
                                #  Create item in sql and assign to that category 
                                Items.objects.create(item=text, code=item_code, unit='طقم', category=master)


        print(f'{file} is done!')
    print(item_code)
    print(category_code)
