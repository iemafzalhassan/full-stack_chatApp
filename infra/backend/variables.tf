variable "aws_region" {
  default = "us-east-2"
}

variable "s3_bucket_name" {
  default = "chatapp-terraform-state-harshsehrawat-dev"
}

variable "dynamodb_table_name" {
  default = "chatapp-terraform-locks"
}
