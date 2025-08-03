# 🚀 Full-Stack Chat App Deployment Guide: Kubernetes (Kind) & Docker Compose

Welcome to the official guide for deploying a **Full-Stack Chat Application** on your local machine. Whether you're a student, a professional, or someone exploring the world of Kubernetes and Docker, this guide is designed to help you deploy the app with ease.

In this tutorial, you will learn how to:
1. Set up a local Kubernetes environment using **Kind**.
2. Deploy a **Full-Stack Chat Application** (Frontend, Backend, MongoDB) on **Kubernetes**.
3. Explore an alternative deployment using **Docker Compose**.

---

## 📋 Prerequisites

Before we start the deployment, ensure that you have the following tools installed and set up on your machine:

### **1. Kind (Kubernetes in Docker)**  
Kind is a tool that lets you run Kubernetes clusters in Docker containers. It’s lightweight, easy to use, and perfect for local development.

**For Windows** (PowerShell):
```bash
curl.exe -Lo kind-windows-amd64.exe https://kind.sigs.k8s.io/dl/v0.25.0/kind-windows-amd64
Move-Item .\kind-windows-amd64.exe c:\some-dir-in-your-PATH\kind.exe
```

**For Windows** (WSL - Windows Subsystem for Linux):
```bash
# For AMD64 / x86_64
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.25.0/kind-linux-amd64

# For ARM64
[ $(uname -m) = aarch64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.25.0/kind-linux-arm64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

**For Linux**:
```bash
# For AMD64 / x86_64
[ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.25.0/kind-linux-amd64

# For ARM64
[ $(uname -m) = aarch64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.25.0/kind-linux-arm64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

---

### **2. Kubectl (Kubernetes Command Line Tool)**  
Kubectl is the tool we’ll use to manage Kubernetes clusters. You’ll use it to interact with your local Kubernetes cluster and deploy resources.

**For x86_64 Architecture:**
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
```

**For ARM64 Architecture:**
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl"
```

**Validate the downloaded binary:**
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check
```

**Install kubectl:**
```bash
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
# OR if there’s an issue with your root permissions:
chmod +x kubectl
mkdir -p ~/.local/bin
mv ./kubectl ~/.local/bin/kubectl
```

**Verify kubectl installation:**
```bash
kubectl version --client --output=yaml
```

---

### **3. Docker**  
Docker is required for building and running containers locally. Follow the instructions on the [official Docker website](https://www.docker.com/get-started) to download and install Docker on your system.

Once installed, you can verify Docker by running:

```bash
docker --version
```

---

## 🛠️ Cloning the Project

With the prerequisites set up, let’s grab the code for the chat application. Run the following commands:

```bash
git clone https://github.com/iemafzalhassan/full-stack_chatApp.git
```
```bash
cd full-stack_chatApp/k8s
```

```bash
git checkout DevOps
```

This will:
- **Clone** the project repository from GitHub.
- Navigate into the `k8s` folder, which contains the Kubernetes configuration files for the deployment.

---

## 🚢 Deployment Using Kubernetes (Kind)

Now that we have everything in place, let’s start deploying the chat application to Kubernetes. Below are the detailed steps to deploy each component of the application using **Kind**.

### 1. Create Kind Cluster:

```bash
# Create cluster using config

kind create cluster --config k8s/kind-config.yaml

# Verify cluster is running
kubectl cluster-info
```

### 2. Create Namespace and Base Resources

A **namespace** is a way to organize your resources. It keeps the app's resources isolated and easy to manage. To create the namespace for our chat app, run:


```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Verify namespace creation
kubectl get namespaces
```

### 3. Create Storage and Configurations

MongoDB is used for storing chat messages and user data. To deploy MongoDB, apply the following commands:

```bash
# Create MongoDB PVC
kubectl apply -f k8s/mongo-pvc.yaml -n chat-app

# Create backend secrets
kubectl apply -f k8s/backend-secrets.yaml -n chat-app

# Create frontend nginx config
kubectl apply -f k8s/frontend-configmap.yaml -n chat-app
```

### 4. Deploy MongoDB
```bash
# Deploy MongoDB
kubectl apply -f k8s/mongodb-deployment.yaml -n chat-app
kubectl apply -f k8s/mongodb-service.yaml -n chat-app

# Wait for MongoDB pod to be ready
kubectl wait --for=condition=Ready pods -l app=mongodb -n chat-app --timeout=120s
```


### 5. 🖥️ Deploy Backend Service

The **backend** service processes messages and user authentication. To deploy the backend, run the following commands:

```bash
# Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml -n chat-app
kubectl apply -f k8s/backend-service.yaml -n chat-app

# Wait for Backend pod to be ready
kubectl wait --for=condition=Ready pods -l app=backend -n chat-app --timeout=120s
```

These files will deploy the backend service, which will handle all API requests from the frontend.

### 6. 🌐 Deploy Frontend Service

The **frontend** is the user interface where people interact with the chat app. To deploy the frontend, use these commands:

```bash
# Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml -n chat-app
kubectl apply -f k8s/frontend-service.yaml -n chat-app

# Wait for Frontend pod to be ready
kubectl wait --for=condition=Ready pods -l app=frontend -n chat-app --timeout=120s
```

This will launch the frontend UI and expose it to the web.

---

## 🧐 Verification and Management

Once the app is deployed, it's crucial to verify that everything is running smoothly.

```bash
# Check all resources
kubectl get all -n chat-app

# Check pod logs if needed
kubectl logs -f -l app=frontend -n chat-app
kubectl logs -f -l app=backend -n chat-app
kubectl logs -f -l app=mongodb -n chat-app
```
## Accessing the Application

The application is exposed through NodePort services:
http://localhost:8080

You can verify the service URLs using:
```bash
# Get service details
kubectl get svc -n chat-app
```

### 🔍 Describe a Pod

If a pod isn’t working as expected, you can describe it to get more information:

```bash
kubectl describe pod <pod-name> -n chat-app
```

This will give you detailed information about a specific pod, including any potential issues.

## Cleanup

When you're done, you can clean up using:
```bash
# Delete all resources in namespace
kubectl delete namespace chat-app

# Delete the kind cluster
kind delete cluster --name chat-app-cluster
```

---

## 🐳 Docker Compose (Alternative Local Deployment)

If you prefer a simpler local setup using **Docker Compose**, you can deploy the chat app without Kubernetes. Here’s how to do it:

```bash
docker-compose up -d --build
```

This command:
- Starts all services defined in the `docker-compose.yml` file.
- Runs the services in detached mode (`-d`).
- Rebuilds the Docker images (`--build`) in case of any changes.

Once the services are running, you can access the app at [http://localhost:8080](http://localhost:8080).


## 🎉 Conclusion

Congratulations! You’ve successfully deployed the **Full-Stack Chat Application** using **Kubernetes (via Kind)** or **Docker Compose**. Whether you're using Kubernetes for a more robust, scalable solution or Docker Compose for a simpler local setup, your chat app is now running!
