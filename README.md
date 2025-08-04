# Full Stack Chat Application on AWS EKS using Terraform, GitLab CI/CD, and ALB

This project automates the deployment of a full-stack chat application on **Amazon EKS** using a complete DevOps pipeline. It includes infrastructure provisioning using **Terraform**, container orchestration with **Kubernetes**, container image storage via **ECR**, and access to the app via an **Application Load Balancer (ALB)**.

---

## 📌 Tech Stack

- **Infrastructure Provisioning:** Terraform
- **Kubernetes Platform:** Amazon EKS
- **CI/CD Pipeline:** GitLab CI/CD (Self-hosted Runner on EC2)
- **Container Registry:** AWS ECR
- **Monitoring (Planned):** Prometheus & Grafana
- **App Stack:**
  - Frontend: React
  - Backend: Node.js + Express
  - Database: MongoDB

---

## 📦 Project Structure

```
.
├── infra/
│   ├── backend/          # Terraform remote state using S3 + DynamoDB
│   └── eks/              # VPC, EKS Cluster, Node Groups, ECR
├── k8s/                  # Kubernetes manifests (deployments, services, ingress)
├── frontend/             # Frontend source code + Dockerfile
├── backend/              # Backend source code + Dockerfile
├── .gitlab-ci.yml        # Main GitLab CI pipeline
├── .gitlab-ci.infra.yml  # Infra-specific pipeline logic
├── .gitlab-ci.deploy.yml # Deployment-specific pipeline logic
└── README.md             # You are here
```

---

## 🚀 What We Did

### 1. Remote State Management
- Created a secure and centralized **Terraform backend** using:
  - **S3 bucket** for state storage
  - **DynamoDB table** for state locking

### 2. Infrastructure as Code (Terraform)
- Provisioned:
  - **VPC**
  - **EKS Cluster** with managed node groups
  - **ECR repositories** for storing Docker images

### 3. CI/CD Automation (GitLab)
- Used a **self-hosted GitLab Runner** on EC2 for CI/CD.
- CI Pipeline performs:
  1. Infrastructure provisioning using Terraform
  2. Docker image build for frontend and backend
  3. Push images to **ECR**
  4. Replace placeholders in Kubernetes manifests
  5. Deploy updated workloads to EKS via `kubectl apply`

### 4. Kubernetes Workloads
- **Namespaces, ConfigMaps, Secrets** used to organize and secure configs
- MongoDB with **persistent volume** and **PVC**
- Frontend and backend deployed with updated images from ECR

### 5. Ingress with ALB
- Used **AWS Load Balancer Controller**
- Created an **Internet-facing ALB** with ingress rules to route traffic to the frontend service

---

## ✅ Outcome

- Full-stack chat app is **deployed, containerized, and accessible** via a public **ALB endpoint**
- Entire process from infra setup to app deployment is **automated via CI/CD**
- Secrets and image references are dynamically injected and managed securely

---

## 🔭 Future Scope

- Set up **Prometheus + Grafana** stack for:
  - Metrics collection
  - Dashboards for monitoring
  - Alerting rules for proactive ops
- Add **domain name** with **Route 53**
- Add **HTTPS support** with **ACM + cert-manager**
- Setup **Horizontal Pod Autoscalers** for frontend/backend
- Add **log forwarding** with **FluentBit** or **CloudWatch Logs**

---

## 🧠 Author & Maintainer

- Name: HARSH Sehrawat

---

## 🛠️ Requirements

- AWS CLI, kubectl, Terraform
- AWS credentials via GitLab CI/CD variables
- GitLab Runner (Docker-based) with AWS IAM role access