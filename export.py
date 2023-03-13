import zipfile
import os
import boto3

zip_target_directories = [
    'src'
]

zip_target_files = [
    '.env',
    'package.json',
    'tsconfig.json'
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

def sync_to_cloud(filename, bucket, target_key):
    s3 = boto3.resource('s3')
    bucket = s3.meta.client.upload_file(filename, bucket, target_key)
        
if __name__ == '__main__':
    create_export_zip()
    sync_to_cloud('export/export.zip', 'test-ec2-instance-deployment', 'app.zip')