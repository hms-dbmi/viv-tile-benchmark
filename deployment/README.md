To deploy, you need to download Terraform v0.11:

```bash
brew install terraform@0.11
```

The terraform file spins up two AWS instances - an http1 server and an http2 server.

To run the terraform configuration, you need to store the states somewhere - so if you need to make the bucket, you can run:

```bash
 aws s3 mb s3://viv-benchmark --region us-east-1
```

Then when you initialize terraform in the right directory, you provide that bucket name:

```bash
cd ../path/to/deployment/terraform
terraform init -upgrade -backend-config="bucket=viv-benchmark" -backend-config="region=us-east-1"
```

Next you can ininitialize the site configuration

```bash
terraform workspace new viv-benchmark
```

You can test out what you are about to build:

```bash
terraform plan
```

And finally, you can spin up (or update) resources:

```bash
terraform apply
```

Terraform automatically starts the HTTP1 and HTTP2 servers.  These will need to be hooked up to the `http1.viv.vitessce.io` and `http2.viv.vitessce.io` respectively (take note of which server is which in the output from Terraform).

Then you can use these urls for benchmarking.

