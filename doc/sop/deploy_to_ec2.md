# SOP: Deploying to EC2

This might not be the long-term deployment solution, but here's how to deploy the code so that it's running on an EC2 instance.

1. Make sure you're authenticated to use the AWS CLI locally. (`aws sso login` and then connect to AWS: profile:samthompson_administrator with the VSC plugin)
2. Run export.py from root: `python export.py`.
3. ssh into the target EC2 instance: Go to EC2 console, select the instance, select Actions->Connect, and select SSH client. Copy the example SSH command and run it in the console. If that doesn't work, feel free to connect using Instance Connect, the first tab of the Connect screen.
4. Use the s3 CLI to download the server code on the instance: `aws s3 cp s3://test-ec2-instance-deployment/app.zip ./app.zip
`
5. unzip the app on the instance: `unzip app.zip -d ~/app-info/bfg-server`
6. `cd bfg-server`, then install dependencies: `npm install`.
8. Run the server with PROD environment: `npm run start-prod`.

### Notes

I had to install typescript with `sudo apt-install node-typescript` to run tsc for `npm run start`.