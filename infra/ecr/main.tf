resource "aws_ecr_repository" "frontend" {
  name = "chatapp-frontend"
}

resource "aws_ecr_repository" "backend" {
  name = "chatapp-backend"
}
