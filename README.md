# WAD Project

Name: Axel Tan<br>
Module Group: L2<br>
<br>

## Project Title

SwiftShop <br>
<br>

## Key Features

Feature 1: Register, Login & Logout (JWT Authentication).<br>
Feature 2: Product Management (CRUD for Admin).<br>
Feature 3: Search and Filter products.<br>
Feature 4: Product reviews.<br>
Feature 5: Shopping Cart & Checkout Logic.<br>
Feature 6: Singapore Address Auto-fill.<br>
Feature 7: Automated Order Email Notifications.<br>
Feature 8: Real-time Currency Converter.<br>

## External APIs[^1] that you would like to use

Describe which external APIs that you would like to use and how you would use them.<br>

1. OneMap API<br>
   - Purpose: Enhances the checkout experience by automatically populating address details (Street name, building name) when a user enters a Singapore postal code.<br>
2. ExchangeRate-API<br>
   - Purpose: To provide real-time currency conversion (SGD to other currencies) for products on the shop and cart pages.<br>
3. SendGrid API<br>
   - Purpose: To send automated order confirmation emails to users after a successful checkout, containing their order summary and shipping details.<br>

## External node modules[^1] that you would like to use

Describe which node modules that you would like to use and how you would use them.<br>

1. **express**
   - Purpose: The main web framework used to build the REST API endpoints and serve the frontend HTML/CSS/JS files.
2. **mongoose**
   - Purpose: To connect to the MongoDB database and define schemas/models for Users, Products, Reviews, and Categories.
3. **bcryptjs**
   - Purpose: To hash user passwords before saving them to the database and to compare hashed passwords during login for security.
4. **jsonwebtoken (jwt)**
   - Purpose: To generate and verify tokens (Bearer Token) for keeping users logged in and protecting private routes (like Checkout and Admin).
5. **axios**
   - Purpose: To make HTTP requests from the Node.js server to external APIs (OneMap and ExchangeRate-API).
6. **@sendgrid/mail**
   - Purpose: The official client library for the SendGrid API, used to construct and send the email notifications.
7. **cors**
   - Purpose: To enable Cross-Origin Resource Sharing, allowing the frontend to communicate with the backend API securely.

<br>

## References

API Documentation:
https://axeltan16-2869277.postman.co/workspace/8f872524-b0c1-496d-8588-4c49cac99143/documentation/49809992-c5b5160d-6d0b-4c67-a026-3cd92c46fe36

**Libraries & APIs:**

- [OneMap API Documentation](https://www.onemap.gov.sg/docs/)
- [ExchangeRate-API Documentation](https://www.exchangerate-api.com/docs/overview)
- [SendGrid Node.js Library](https://github.com/sendgrid/sendgrid-nodejs)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Documentation](https://expressjs.com/)

<br>
<br>
:warning: This repository includes gitignore file which will not commit certain files or folders (especially node_modules folder) for a node.js project into the repository.  
**Please do not remove the .gitignore file as it will help to minimize the size of the project in the repository.**
<br>
[^1]: Note that you can still change them at the later stage of the project if you find new APIs or node modules.
