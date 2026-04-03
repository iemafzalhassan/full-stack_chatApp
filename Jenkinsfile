pipeline{
    agent any
    environment{
        dockerUser = "arpanel"
        IMAGE_TAG = ""
    }
    stages{
        stage("Git pull"){
            steps{
                git url: "https://github.com/arpanelfranklin/full-stack_chatApp.git", branch: "main"
            }
        }
        stage("docker build"){
            steps{
                script {
                    IMAGE_TAG = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                }
                sh "docker build -t ${env.dockerUser}/chat-app-frontend:v1.0.${IMAGE_TAG} ./frontend"
                sh "docker build -t ${env.dockerUser}/chat-app-backend:v1.0.${IMAGE_TAG} ./backend"
            }
        }
        stage("trivy scan"){
            steps{
                sh "trivy fs . -o result.json"
            }
        }
        stage("docker push"){
            steps{
                withCredentials([usernamePassword(
                credentialsId: "dockerHubCred",
                usernameVariable: "dockerHubUser",
                passwordVariable: "dockerHubPass"
                )]){
                    sh "docker login -u ${env.dockerHubUser} -p ${env.dockerHubPass}"
                    sh "docker push ${env.dockerHubUser}/chat-app-frontend:v1.0.${IMAGE_TAG}"
                    sh "docker push ${env.dockerHubUser}/chat-app-backend:v1.0.${IMAGE_TAG}"
                }

            }
        }
        stage("Git update"){
            steps{
                withCredentials([usernamePassword(
                    credentialsId: "gitHubCred",
                    usernameVariable: "GIT_USERNAME",
                    passwordVariable: "GIT_PASSWORD"
                )]){
                    script {
                    IMAGE_TAG = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    }
                    sh "git config user.email 'arpanelfranklin@gmail.com'"
                    sh "git config user.name 'arpanelfranklin'"
                    sh "git remote set-url origin https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/arpanelfranklin/full-stack_chatApp.git"
                    sh "sed -i s|image: ${env.dockerUser}/chat-app-backend:*|image: ${env.dockerUser}/chat-app-backend:v1.0.${IMAGE_TAG}|g ./k8s/backend/backend-deployment.yml"
                    sh "sed -i s|image: ${env.dockerUser}/chat-app-frontend:*|image: ${env.dockerUser}/chat-app-frontend:v1.0.${IMAGE_TAG}|g ./k8s/frontend/frontend-deployment.yml"
                    sh "git add ./k8s/backend/backend-deployment.yml"
                    sh "git add ./k8s/frontend/frontend-depoyment.yml"
                    sh "git commit -m 'updated version via JENKINS"
                    sh "git push origin main"
                }
            }
        }
    }
    post{
        success{
            script{
                emailext from: "arpanel07@gmail.com"
                subject: "[Jenkins] Chat-app pipline Sucess"
                body: "Build successfully. you can access the app in port 9090"
                attachmentsPattern: '**/result.json',
                to: "arpanel.devops@gmail.com"
            }
        }
        failure{
            script{
                emailext from: "arpanel07@gmail.com"
                subject: "[JENKINS] Chat-app pipeline Sucess"
                body: "Build failed. Contact Devops Team ASAP."
                attachmentsPattern '**/result.json'
                to: "arpanel.devops@gmail.com"
            }
        }
    }
}
