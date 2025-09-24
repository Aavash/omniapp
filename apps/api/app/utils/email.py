import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os

from app.utils.email_template import prepare_email

# Configuration
SMTP_EMAIL = "budgetmapapp@gmail.com"
SMTP_PASSWORD = "hgbp hgoc txwp nqte"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def create_transport():
    """Create and return SMTP transport"""
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(SMTP_EMAIL, SMTP_PASSWORD)
    return server


def send_text_email(to: str, subject: str, message: str) -> dict:
    """Send plain text email

    Args:
        to: Recipient email address
        subject: Email subject
        message: Plain text message body

    Returns:
        Dictionary with:
        - 'status': True if successful, False if failed
        - 'message': Success/error message
        - 'error': Exception object if failed (None if successful)
    """
    msg = MIMEText(message)
    msg["Subject"] = subject
    msg["From"] = SMTP_EMAIL
    msg["To"] = to

    try:
        with create_transport() as server:
            server.sendmail(SMTP_EMAIL, to, msg.as_string())
        return True
    except smtplib.SMTPException as e:
        print(e)
        return False

    except Exception as e:
        print(e)
        return False


def send_html_email(to: str, subject: str, message: str) -> bool:
    """Send HTML email with error handling

    Args:
        to: Recipient email address
        subject: Email subject
        message: HTML message content

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        html_content = prepare_email(message)

        msg = MIMEText(html_content, "html")
        msg["Subject"] = subject
        msg["From"] = SMTP_EMAIL
        msg["To"] = to

        msg["X-Mailer"] = "Shiftbay Mailer"
        msg["X-Priority"] = "3"

        with create_transport() as server:
            server.sendmail(SMTP_EMAIL, to, msg.as_string())

        return True

    except smtplib.SMTPException as e:
        print(f"SMTP error sending to {to}: {str(e)}")
        return False

    except Exception as e:
        print(f"Error sending email to {to}: {str(e)}")
        return False


def send_email_with_attachment(to: str, subject: str, message: str, file_path: str):
    """Send email with attachment"""
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = SMTP_EMAIL
    msg["To"] = to

    msg.attach(MIMEText(message, "plain"))

    with open(file_path, "rb") as attachment:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(attachment.read())

    encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition",
        f"attachment; filename= {os.path.basename(file_path)}",
    )
    msg.attach(part)

    with create_transport() as server:
        server.sendmail(SMTP_EMAIL, to, msg.as_string())


def send_bulk_emails(recipients: list, subject: str, message: str, is_html=False):
    """Send bulk emails to multiple recipients"""
    with create_transport() as server:
        for to in recipients:
            try:
                if is_html:
                    msg = MIMEText(message, "html")
                else:
                    msg = MIMEText(message, "plain")

                msg["Subject"] = subject
                msg["From"] = SMTP_EMAIL
                msg["To"] = to

                server.sendmail(SMTP_EMAIL, to, msg.as_string())
                print(f"Sent to {to}")
            except Exception as e:
                print(f"Failed to send to {to}: {e}")
                continue
