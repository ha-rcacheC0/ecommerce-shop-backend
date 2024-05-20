# Development TODOs

This is all the required elements to get this website fully functional.

We can mark anything as optional as needed to ensure we have the project done on time

## Project Setup

- [x] **Initialize Project**

  - [x] Create a project directory
  - [x] Initialize a Git repository
  - [x] Initialize Node.js project using `npm init`

- [x] **Install Dependencies**
  - [x] Install Express for the backend: `npm install express`
  - [x] Install Prisma and the PostgreSQL client for Node.js: `npm install prisma @prisma/client`
  - [x] Install other required dependencies: `npm install dotenv body-parser cors`

## Database Setup

- [x] **Set Up PostgreSQL Database**

  - [x] Install PostgreSQL on your machine or use a cloud service
  - [x] Create a database for the e-commerce application

- [ ] **Set Up Prisma**
  - [x] Initialize Prisma in the project: `npx prisma init`
  - [ ] Configure the `prisma/schema.prisma` file with your data model
  - [x] Set up a `.env` file to store database connection details
  - [x] Run `npx prisma migrate dev --name init` to create the initial migration and sync the database schema

## Backend Setup (Express API)

- [x] **Create Express Server**

  - [ ] Set up the basic Express server in `server.js`
  - [ ] Configure middleware for parsing JSON and handling CORS

- [ ] **Define Routes**

  - [ ] Set up routes for:
    - [ ] products
    - [ ] users
    - [ ] orders
  - [ ] Implement CRUD operations for each resource

- [ ] **Implement Controllers**

  - [ ] Create controller functions to handle requests and interact with the database using Prisma

- [ ] **Set Up Authentication**

  - [ ] Implement user registration and login routes
  - [ ] Use JWT for authentication and authorization

- [ ] **Handle Error Handling**
  - [ ] Implement centralized error handling middleware

## Frontend Setup (Vanilla JS)

- [ ] **Create HTML Structure**

  - [ ] Create basic HTML pages for:
    - [ ] home
    - [ ] product listing
    - [ ] product detail
    - [ ] cart
    - [ ] checkout
    - [ ] login

- [ ] **Style the Application**

  - [ ] Create CSS files for styling the application

- [ ] **Set Up JavaScript**

  - [ ] Write JavaScript to handle dynamic content loading
  - [ ] Implement functions to fetch data from the API and update the UI

- [ ] **Handle User Interaction**

  - [ ] Implement functionality for adding/removing items from the cart
  - [ ] Handle user authentication on the frontend

- [ ] **Set Up Event Listeners**
  - [ ] Add event listeners for form submissions, button clicks, etc.

## Integration and Testing

- [ ] **Test API Endpoints**

  - [ ] Use tools like Postman to test API endpoints

- [ ] **Test Frontend Functionality**

  - [ ] Manually test frontend functionality and user flows

- [ ] **Debug and Fix Issues**
  - [ ] Debug any issues that arise and fix bugs

## Deployment

- [ ] **Prepare for Deployment**

  - [ ] Set up environment variables for production
  - [ ] Optimize code for production

- [ ] **Deploy Backend**

  - [ ] Deploy the Express server to a cloud platform (e.g., Heroku, AWS)

- [ ] **Deploy Frontend**

  - [ ] Host the static frontend files using a service like Netlify or Vercel

- [ ] **Set Up Domain**

  - [ ] Configure a custom domain for the e-commerce site

- [ ] **Monitor and Maintain**
  - [ ] Set up monitoring for server performance and errors
  - [ ] Regularly update dependencies and handle maintenance tasks
