output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "node_group_role_arn" {
  value = module.eks.eks_managed_node_groups["default"].iam_role_arn
}

output "frontend_repo_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "backend_repo_url" {
  value = aws_ecr_repository.backend.repository_url
}
