# Kubernetes 3-Tier Chat Application Deployment

This project demonstrates the deployment of a **3-tier chat application** on **Kubernetes** using containerized services and Kubernetes infrastructure components.

The application consists of:

- **Frontend:** ReactJS  
- **Backend:** Node.js  
- **Database:** MongoDB  

The goal of this project was to understand how modern applications are **containerized, deployed, and managed in a Kubernetes cluster**, including networking, storage, and service communication.

---

# Architecture Overview

The application follows a **3-tier architecture**:

User → Ingress → Frontend (React) → Backend (Node.js) → Database (MongoDB)

Each component runs in **separate Kubernetes deployments** and communicates through **Kubernetes services**.

---

# Architecture Diagram

```
User
  |
  v
Ingress Controller
  |
  v
React Frontend Service
  |
  v
React Frontend Pod
  |
  v
NodeJS Backend Service
  |
  v
NodeJS Backend Pod
  |
  v
MongoDB Service
  |
  v
MongoDB Pod
  |
  v
Persistent Volume Claim
  |
  v
Persistent Volume
```

---

# Technologies Used

- Kubernetes  
- Docker  
- Docker Hub  
- ReactJS  
- Node.js  
- MongoDB  
- Persistent Volumes  
- Persistent Volume Claims  
- Kubernetes Ingress  

---

# Project Structure

```
k8s-chat-application
│
├── README.md
│
├── frontend
│   ├── Dockerfile
│   └── source-code
│
├── backend
│   ├── Dockerfile
│   └── source-code
│
├── kubernetes
│   │
│   ├── namespace
│   │   └── namespace.yaml
│   │
│   ├── frontend
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   ├── backend
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   ├── database
│   │   ├── mongodb-deployment.yaml
│   │   ├── mongodb-service.yaml
│   │   ├── persistent-volume.yaml
│   │   └── persistent-volume-claim.yaml
│   │
│   └── ingress
│       └── ingress.yaml
```

---

# Containerization

The frontend and backend applications were containerized using **Docker**.

Steps:

1. Created Dockerfiles for the frontend and backend applications  
2. Built Docker images locally  
3. Pushed the images to **Docker Hub**

Example:

```bash
docker build -t username/react-chat-app .
docker push username/react-chat-app
```

---

# Kubernetes Resources Implemented

The following Kubernetes resources were created to deploy the application.

## Namespace
A dedicated namespace was created to isolate all resources related to this project.

## Deployments
Deployments were created for:

- React Frontend
- Node.js Backend
- MongoDB Database

These ensure pods are managed and restarted automatically if failures occur.

## Services
ClusterIP services were created to allow communication between application components.

## Persistent Storage

MongoDB requires persistent storage to retain data even if the pod restarts.

This was implemented using:

- Persistent Volume (PV)
- Persistent Volume Claim (PVC)

## Ingress

An **Ingress controller** was configured to expose the application through a single entry point and manage routing.

---

# Deployment Steps

## Create Namespace

```bash
kubectl apply -f kubernetes/namespace/
```

## Deploy Database

```bash
kubectl apply -f kubernetes/database/
```

## Deploy Backend

```bash
kubectl apply -f kubernetes/backend/
```

## Deploy Frontend

```bash
kubectl apply -f kubernetes/frontend/
```

## Deploy Ingress

```bash
kubectl apply -f kubernetes/ingress/
```

---

# Verifying Deployment

Check pods:

```bash
kubectl get pods -n <namespace>
```

Check services:

```bash
kubectl get svc -n <namespace>
```

---

# Accessing the Application

Initially, the application was tested using **port forwarding**.

Example:

```bash
kubectl port-forward service/frontend-service 3000:3000
```

After verification, the application was exposed using **Ingress**.

---

# Learning Outcomes

Through this project I gained practical experience with:

- Containerizing applications using Docker  
- Deploying microservices on Kubernetes  
- Managing application networking using Kubernetes Services  
- Configuring persistent storage using PV and PVC  
- Exposing applications using Ingress  
- Managing deployments and namespaces in Kubernetes  

---

# Future Improvements

Possible enhancements for this project include:

- Helm chart for easier deployment  
- Horizontal Pod Autoscaling  
- CI/CD pipeline integration  
- Monitoring using Prometheus and Grafana  
- Logging with ELK stack  

---

# Author

**Pratik Sinha**

Computer Science Engineer | DevOps | Kubernetes | Cloud Native

GitHub:  
https://github.com/pks2906
