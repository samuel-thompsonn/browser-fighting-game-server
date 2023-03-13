import zipfile
import os

zip_target_directories = [
    'src'
]

zip_target_files = [
    '.env',
    'package.json',
    'tscsonfig.json'
]

def zip_directory(path, zip_file):
    for root, dirs, files in os.walk(path):
        for file in files:
            print(os.path.join(root, file))
            zip_file.write(os.path.join(root, file))

def create_export_zip():
    with zipfile.ZipFile('export/export.zip', 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for directory in zip_target_directories:
            zip_directory('src/', zip_file)
        for file in zip_target_files:
            zip_file.write(file)
        
if __name__ == '__main__':
    create_export_zip()
