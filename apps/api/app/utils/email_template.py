from app.apis.dtos.auth import ContactEmail


EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        /* Base styles */
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #e6f2ff; /* Light blue background */
        }
        
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            padding: 0;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            padding: 25px 0;
            text-align: center;
            background-color: #0077cc; /* Shiftbay blue */
            color: white;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        .content {
            padding: 25px;
        }
        
        .footer {
            padding: 20px;
            text-align: center;
            background-color: #f5f9ff;
            font-size: 12px;
            color: #666666;
        }
        
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0077cc;
            text-decoration: none;
            border-radius: 4px;
            margin: 15px 0;
            font-weight: bold;
        }
        
        /* Responsive styles */
        @media screen and (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">SHIFTBAY</div>
        </div>
        
            <!-- Dynamic content will be inserted here -->
            {{message_content}}
        <div class="content">
            
            <!-- Optional button -->
            <p style="text-align: center; margin-top: 30px;">
                <a href="https://www.shiftbay.com" class="button">Visit Shiftbay</a>
            </p>
        </div>
        
        <div class="footer">
            <p>
                &copy; 2023 Shiftbay. All rights reserved.<br>
                <a href="https://www.shiftbay.com/privacy" style="color: #0077cc;">Privacy Policy</a> | 
                <a href="https://www.shiftbay.com/terms" style="color: #0077cc;">Terms of Service</a>
            </p>
            <p>
                <small>
                    You're receiving this email because you signed up for our service.<br>
                    <a href="{{unsubscribe_link}}" style="color: #0077cc;">Unsubscribe</a>
                </small>
            </p>
        </div>
    </div>
</body>
</html>
"""


def prepare_email(message: str):
    html_message = EMAIL_TEMPLATE.replace("{{message_content}}", message)
    return html_message


def prepare_contact_email(emailData: ContactEmail):
    CONTACT_MESSAGE = """    
    <div class="container">
        <h2 style="color: #0077cc;">New Contact Form Submission</h2>
        <p><strong>From:</strong> {{name}} ({{email}})</p>
        <p><strong>Message:</strong></p>
        <p>{{message}}</p>
        <p style="margin-top: 20px;">
            <a href="https://shiftbay.com" style="color: #0077cc;">Shiftbay Website</a>
        </p>
    </div> """
    return (
        CONTACT_MESSAGE.replace("{{name}}", emailData.name)
        .replace("{{email}}", emailData.email)
        .replace("{{message}}", emailData.message)
    )
