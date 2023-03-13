import zipfile
import os

def zip_directory(path, zip_file):
    for root, dirs, files in os.walk(path):
        for file in files:
            zip_file.write(os.path.join(root, file),
                            os.path.relpath(os.path.join(root, file),
                                            os.path.join(root, '..')))

def create_export_zip():
    with zipfile.ZipFile('export.zip', 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_directory('src/', zip_file)

        
if __name__ == '__main__':
    create_export_zip()
