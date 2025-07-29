terraform {
  backend "s3" {
    bucket         = "chatapp-terraform-state-harshsehrawat-dev"  # your unique bucket
    key            = "eks/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "chatapp-terraform-locks"
    encrypt        = true
  }
}
